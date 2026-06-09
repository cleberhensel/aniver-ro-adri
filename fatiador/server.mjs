import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildFfmpegFilterChain, clampFx } from "./mixer-filters.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const STATIC = __dirname;
const PORT = Number(process.env.PORT) || 3921;

const SOURCE_DIRS = [
  ROOT,
  path.resolve(ROOT, "../../../.."),
].filter((dir) => fs.existsSync(dir));

const AUDIO_EXT = new Set([".mp3", ".m4a", ".wav", ".aac", ".ogg"]);

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function listAudioFiles() {
  const files = new Map();

  for (const dir of SOURCE_DIRS) {
    for (const name of fs.readdirSync(dir)) {
      const ext = path.extname(name).toLowerCase();
      if (!AUDIO_EXT.has(ext)) continue;
      const full = path.join(dir, name);
      if (!fs.statSync(full).isFile()) continue;
      files.set(full, {
        id: full,
        name,
        dir,
        ext: ext.slice(1),
        size: fs.statSync(full).size,
      });
    }
  }

  return [...files.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

function listCortes() {
  return fs
    .readdirSync(ROOT)
    .filter((name) => /-parte-\d+\.mp3$/i.test(name))
    .map((name) => {
      const full = path.join(ROOT, name);
      const stat = fs.statSync(full);
      const match = name.match(/^(\d+-\d+)-(\d+-\d+)-parte-(\d+)\.mp3$/i);
      return {
        name,
        url: `/media/${encodeURIComponent(name)}`,
        size: stat.size,
        mtime: stat.mtimeMs,
        startMark: match?.[1] ?? null,
        endMark: match?.[2] ?? null,
        part: match ? Number(match[3]) : null,
      };
    })
    .sort((a, b) => (a.part ?? 0) - (b.part ?? 0));
}

function nextPartNumber() {
  const cortes = listCortes();
  if (!cortes.length) return 1;
  return Math.max(...cortes.map((c) => c.part ?? 0)) + 1;
}

function resolveSource(sourceId) {
  const full = path.resolve(sourceId);
  const allowed = SOURCE_DIRS.some((dir) => full.startsWith(dir + path.sep));
  if (!allowed || !fs.existsSync(full)) {
    throw new Error("Arquivo de origem inválido.");
  }
  return full;
}

function preferLosslessSource(sourcePath) {
  const dir = path.dirname(sourcePath);
  const base = path.basename(sourcePath, path.extname(sourcePath));
  const m4a = path.join(dir, `${base}.m4a`);
  if (fs.existsSync(m4a)) return m4a;
  const desktopM4a = path.join(SOURCE_DIRS[1] ?? "", `${base}.m4a`); // ~/Desktop
  if (fs.existsSync(desktopM4a)) return desktopM4a;
  return sourcePath;
}

function runProcess(bin, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("close", (code) => {
      if (code === 0) resolve(stderr);
      else reject(new Error(stderr.trim() || `${bin} saiu com código ${code}`));
    });
  });
}

function runFfmpeg(args) {
  return runProcess("ffmpeg", args);
}

function getDuration(filePath) {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    let out = "";
    proc.stdout.on("data", (c) => { out += c.toString(); });
    proc.on("close", (code) => {
      if (code !== 0) return reject(new Error("ffprobe falhou"));
      const d = Number(out.trim());
      if (!Number.isFinite(d)) return reject(new Error("Duração inválida"));
      resolve(d);
    });
  });
}

async function mixAudio({ inputName, fx, replace }) {
  const safeInput = path.basename(inputName);
  const inputPath = path.join(ROOT, safeInput);
  if (!fs.existsSync(inputPath)) throw new Error("Arquivo não encontrado.");

  const duration = await getDuration(inputPath);
  const effects = clampFx(fx);
  const filter = buildFfmpegFilterChain(effects, duration);
  if (!filter) throw new Error("Nenhum filtro para aplicar.");

  const base = safeInput.replace(/\.mp3$/i, "").replace(/-tratado$/, "");
  const outputName = replace ? safeInput : `${base}-tratado.mp3`;
  const outputPath = path.join(ROOT, outputName);
  const tempPath = `${outputPath}.tmp.mp3`;

  await runFfmpeg([
    "-hide_banner", "-loglevel", "error", "-y",
    "-i", inputPath,
    "-af", filter,
    "-codec:a", "libmp3lame",
    "-qscale:a", "2",
    tempPath,
  ]);

  fs.renameSync(tempPath, outputPath);

  const stat = fs.statSync(outputPath);
  return {
    name: outputName,
    url: `/media/${encodeURIComponent(outputName)}`,
    size: stat.size,
    replaced: replace,
    filter,
    fx: effects,
  };
}

async function mixBatch({ fx, replace }) {
  const cortes = listCortes();
  if (!cortes.length) throw new Error("Nenhum corte para mixar.");

  const results = [];
  const errors = [];

  for (const corte of cortes) {
    try {
      const result = await mixAudio({
        inputName: corte.name,
        fx,
        replace,
      });
      results.push(result);
    } catch (err) {
      errors.push({ name: corte.name, error: err.message });
    }
  }

  return { results, errors, total: cortes.length };
}

async function cutAudio({ sourceId, start, end, filename }) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    throw new Error("Intervalo inválido.");
  }

  const sourcePath = preferLosslessSource(resolveSource(sourceId));
  const safeName = path.basename(filename);
  if (!/^[\w\-]+\.mp3$/i.test(safeName)) {
    throw new Error("Nome de arquivo inválido.");
  }

  const outputPath = path.join(ROOT, safeName);
  if (fs.existsSync(outputPath)) {
    throw new Error(`Já existe: ${safeName}`);
  }

  const filter = `atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS`;

  await runFfmpeg([
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    sourcePath,
    "-af",
    filter,
    "-codec:a",
    "libmp3lame",
    "-qscale:a",
    "2",
    outputPath,
  ]);

  const stat = fs.statSync(outputPath);
  return {
    name: safeName,
    url: `/media/${encodeURIComponent(safeName)}`,
    size: stat.size,
    sourceUsed: path.basename(sourcePath),
    start,
    end,
    duration: end - start,
  };
}

function serveFile(res, filePath, contentType) {
  const stat = fs.statSync(filePath);
  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": stat.size,
    "Accept-Ranges": "bytes",
  });
  fs.createReadStream(filePath).pipe(res);
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return (
    {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".mjs": "text/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".mp3": "audio/mpeg",
      ".m4a": "audio/mp4",
      ".wav": "audio/wav",
    }[ext] ?? "application/octet-stream"
  );
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/api/sources") {
      return sendJson(res, 200, { sources: listAudioFiles(), outputDir: ROOT });
    }

    if (req.method === "GET" && url.pathname === "/api/cortes") {
      return sendJson(res, 200, { cortes: listCortes(), nextPart: nextPartNumber() });
    }

    if (req.method === "POST" && url.pathname === "/api/mix") {
      const body = await readBody(req);
      const result = await mixAudio({
        inputName: body.inputName,
        fx: body.fx,
        replace: Boolean(body.replace),
      });
      return sendJson(res, 201, result);
    }

    if (req.method === "POST" && url.pathname === "/api/mix/batch") {
      const body = await readBody(req);
      const result = await mixBatch({
        fx: body.fx,
        replace: Boolean(body.replace),
      });
      return sendJson(res, 201, result);
    }

    if (req.method === "POST" && url.pathname === "/api/cortes") {
      const body = await readBody(req);
      const part = body.part ?? nextPartNumber();
      const filename =
        body.filename ??
        `${body.startMark}-${body.endMark}-parte-${part}.mp3`;
      const result = await cutAudio({
        sourceId: body.sourceId,
        start: Number(body.start),
        end: Number(body.end),
        filename,
      });
      return sendJson(res, 201, result);
    }

    if (req.method === "GET" && url.pathname === "/api/source") {
      const sourceId = url.searchParams.get("id");
      if (!sourceId) return sendJson(res, 400, { error: "id obrigatório" });
      const full = resolveSource(sourceId);
      return serveFile(res, full, contentTypeFor(full));
    }

    if (req.method === "GET" && url.pathname.startsWith("/media/")) {
      const name = decodeURIComponent(url.pathname.slice("/media/".length));
      const full = path.join(ROOT, path.basename(name));
      if (!fs.existsSync(full)) {
        res.writeHead(404);
        return res.end("Not found");
      }
      return serveFile(res, full, contentTypeFor(full));
    }

    const staticPath = path.join(
      STATIC,
      url.pathname === "/" ? "index.html" : url.pathname,
    );
    if (staticPath.startsWith(STATIC) && fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
      return serveFile(res, staticPath, contentTypeFor(staticPath));
    }

    res.writeHead(404);
    res.end("Not found");
  } catch (err) {
    sendJson(res, 500, { error: err.message ?? "Erro interno" });
  }
});

server.listen(PORT, () => {
  console.log(`Fatiador: http://localhost:${PORT}`);
  console.log(`Saída dos cortes: ${ROOT}`);
});
