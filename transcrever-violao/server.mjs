#!/usr/bin/env node
/**
 * Servidor único para transcrições.
 *   node server.mjs          → http://localhost:8765/
 *   node server.mjs 9000     → porta custom
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(HERE, "public");
const STEMS_ROOT = path.join(HERE, "../vozes/stems/htdemucs");
const ALPHATAB = path.join(HERE, "node_modules/@coderline/alphatab/dist");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".mid": "audio/midi",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".gp5": "application/octet-stream",
  ".mjs": "text/javascript; charset=utf-8",
  ".sf2": "application/octet-stream",
  ".woff2": "font/woff2",
  ".otf": "font/otf",
};

const port = Number(process.argv[2] || process.env.PORT || 8765);

function listStems() {
  if (!fs.existsSync(STEMS_ROOT)) return [];
  return fs
    .readdirSync(STEMS_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => fs.existsSync(path.join(STEMS_ROOT, name, "transcricao", "resumo.json"))
      || fs.existsSync(path.join(STEMS_ROOT, name, "transcricao", "analise.json")))
    .sort()
    .map((id) => ({ id, title: id }));
}

function safeJoin(root, rel) {
  const file = path.normalize(path.join(root, rel));
  if (!file.startsWith(root)) return null;
  return file;
}

function send(res, status, body, type = "text/plain") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-cache" });
  res.end(body);
}

function sendFile(res, filePath) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      send(res, 404, "Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Content-Length": stat.size,
      "Cache-Control": "no-cache",
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === "/api/stems") {
    send(res, 200, JSON.stringify(listStems()), "application/json");
    return;
  }

  if (pathname === "/view" || pathname.startsWith("/view/")) {
    const viewer = path.join(PUBLIC, "viewer.html");
    return sendFile(res, viewer);
  }

  if (pathname.startsWith("/vendor/alphatab/")) {
    const rel = pathname.slice("/vendor/alphatab/".length);
    const file = safeJoin(ALPHATAB, rel);
    if (file) return sendFile(res, file);
    return send(res, 403, "Forbidden");
  }

  if (pathname.startsWith("/stems/")) {
    const rel = pathname.slice("/stems/".length);
    const file = safeJoin(STEMS_ROOT, rel);
    if (file) return sendFile(res, file);
    return send(res, 403, "Forbidden");
  }

  if (pathname === "/") {
    return sendFile(res, path.join(PUBLIC, "index.html"));
  }

  const asset = safeJoin(PUBLIC, pathname.slice(1));
  if (asset && fs.existsSync(asset)) return sendFile(res, asset);

  send(res, 404, "Not found");
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Porta ${port} já em uso — o servidor provavelmente já está a correr.`);
    console.error(`Abrir:  http://localhost:${port}/`);
    console.error(`Parar:  lsof -ti :${port} | xargs kill`);
    console.error(`Outra:  node server.mjs ${port + 1}`);
    process.exit(1);
  }
  throw err;
});

server.listen(port, () => {
  const stems = listStems();
  console.log(`Stems:  ${STEMS_ROOT}`);
  console.log(`Abrir:  http://localhost:${port}/`);
  if (stems.length) {
    console.log(`Última: http://localhost:${port}/view/${encodeURIComponent(stems[stems.length - 1].id)}`);
  }
  console.log("(Ctrl+C para parar)");
});
