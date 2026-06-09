import { createMixerPanel } from "./mixer.js";

const $ = (sel) => document.querySelector(sel);

const player = $("#player");
const sourceSelect = $("#sourceSelect");
const statusEl = $("#status");
const currentTimeEl = $("#currentTime");
const durationEl = $("#duration");
const selectionDurationEl = $("#selectionDuration");
const timeline = $("#timeline");
const timelineSelection = $("#timelineSelection");
const markerIn = $("#markerIn");
const markerOut = $("#markerOut");
const playhead = $("#playhead");
const seek = $("#seek");
const inTimeInput = $("#inTime");
const outTimeInput = $("#outTime");
const filenameInput = $("#filename");
const corteList = $("#corteList");
const corteListMix = $("#corteListMix");
const tabFatiar = $("#tabFatiar");
const tabMixar = $("#tabMixar");

let mixerPanel = null;

const state = {
  sources: [],
  cortes: [],
  nextPart: 1,
  sourceId: null,
  duration: 0,
  markIn: null,
  markOut: null,
  loopSelection: false,
};

function setStatus(text, kind = "") {
  statusEl.textContent = text;
  statusEl.className = `header__status${kind ? ` is-${kind}` : ""}`;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatClock(seconds, withMs = true) {
  if (!Number.isFinite(seconds)) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  const base = h > 0
    ? `${pad2(h)}:${pad2(m)}:${pad2(s)}`
    : `${pad2(m)}:${pad2(s)}`;
  return withMs ? `${base}.${ms}` : base;
}

function toMark(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${pad2(m)}-${pad2(s)}`;
}

function parseTimeInput(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  const parts = trimmed.split(":").map(Number);
  if (parts.some((n) => Number.isNaN(n))) return null;

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return null;
}

function suggestFilename() {
  if (state.markIn == null || state.markOut == null) return "";
  return `${toMark(state.markIn)}-${toMark(state.markOut)}-parte-${state.nextPart}.mp3`;
}

function updateSelectionUi() {
  const hasIn = state.markIn != null;
  const hasOut = state.markOut != null;

  inTimeInput.value = hasIn ? formatClock(state.markIn, false) : "";
  outTimeInput.value = hasOut ? formatClock(state.markOut, false) : "";

  if (hasIn && hasOut && state.markOut > state.markIn) {
    const dur = state.markOut - state.markIn;
    selectionDurationEl.textContent = formatClock(dur, false);
    filenameInput.value = suggestFilename();
  } else {
    selectionDurationEl.textContent = "—";
  }

  renderTimelineMarkers();
}

function pct(seconds) {
  if (!state.duration) return 0;
  return Math.max(0, Math.min(100, (seconds / state.duration) * 100));
}

function renderTimelineMarkers() {
  playhead.style.left = `${pct(player.currentTime)}%`;
  seek.value = String(player.currentTime);

  if (state.markIn != null) {
    markerIn.classList.add("is-visible");
    markerIn.style.left = `${pct(state.markIn)}%`;
  } else {
    markerIn.classList.remove("is-visible");
  }

  if (state.markOut != null) {
    markerOut.classList.add("is-visible");
    markerOut.style.left = `${pct(state.markOut)}%`;
  } else {
    markerOut.classList.remove("is-visible");
  }

  if (state.markIn != null && state.markOut != null && state.markOut > state.markIn) {
    timelineSelection.classList.add("is-visible");
    timelineSelection.style.left = `${pct(state.markIn)}%`;
    timelineSelection.style.width = `${pct(state.markOut - state.markIn)}%`;
  } else {
    timelineSelection.classList.remove("is-visible");
  }
}

function markIn(at = player.currentTime) {
  state.markIn = at;
  if (state.markOut != null && state.markOut <= state.markIn) {
    state.markOut = null;
  }
  updateSelectionUi();
}

function markOut(at = player.currentTime) {
  state.markOut = at;
  if (state.markIn != null && state.markOut <= state.markIn) {
    state.markIn = null;
  }
  updateSelectionUi();
}

function clearMarks() {
  state.markIn = null;
  state.markOut = null;
  state.loopSelection = false;
  filenameInput.value = "";
  updateSelectionUi();
}

function seekTo(seconds) {
  if (!Number.isFinite(seconds) || !state.duration) return;
  player.currentTime = Math.max(0, Math.min(state.duration, seconds));
  renderTimelineMarkers();
}

function playSelection() {
  if (state.markIn == null || state.markOut == null || state.markOut <= state.markIn) {
    setStatus("Marque início e fim antes de ouvir o trecho.", "error");
    return;
  }
  state.loopSelection = true;
  player.currentTime = state.markIn;
  player.play();
}

async function api(path, options) {
  const res = await fetch(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data;
}

function isParteFile(name) {
  return /-parte-\d+\.mp3$/i.test(name);
}

async function loadSources() {
  const data = await api("/api/sources");
  state.sources = data.sources;

  const gravacoes = state.sources.filter((s) => !isParteFile(s.name));
  const partes = state.sources.filter((s) => isParteFile(s.name));
  const option = (s) =>
    `<option value="${encodeURIComponent(s.id)}">${s.name} (${formatSize(s.size)})</option>`;

  sourceSelect.innerHTML = [
    gravacoes.length
      ? `<optgroup label="Gravações">${gravacoes.map(option).join("")}</optgroup>`
      : "",
    partes.length
      ? `<optgroup label="Cortes existentes">${partes.map(option).join("")}</optgroup>`
      : "",
  ].join("");

  const preferred =
    gravacoes.find((s) => /Voz 260221_205738\.m4a$/i.test(s.name)) ??
    gravacoes.find((s) => /Voz 260221_205738\.mp3$/i.test(s.name)) ??
    gravacoes[0];
  state.sourceId = preferred?.id ?? state.sources[0]?.id ?? null;
  if (state.sourceId) {
    sourceSelect.value = encodeURIComponent(state.sourceId);
    await loadSource(state.sourceId);
  }
}

async function loadSource(sourceId) {
  state.sourceId = sourceId;
  player.src = `/api/source?id=${encodeURIComponent(sourceId)}`;
  player.load();
  clearMarks();
  setStatus(`Origem: ${pathBasename(sourceId)}`);
}

async function loadCortes() {
  const data = await api("/api/cortes");
  state.cortes = data.cortes;
  state.nextPart = data.nextPart;
  renderCortes();
  updateSelectionUi();
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function pathBasename(full) {
  return decodeURIComponent(full.split("/").pop() ?? full);
}

function corteItemHtml(c, withMixBtn = false) {
  return `
    <li class="corte-item" data-name="${c.name}">
      <div class="corte-item__name">${c.name}</div>
      <div class="corte-item__meta">parte ${c.part ?? "?"} · ${formatSize(c.size)}</div>
      <audio controls preload="none" src="${c.url}"></audio>
      ${withMixBtn ? `<div class="corte-item__actions"><button type="button" class="btn btn--sm btn--primary" data-mix="${c.name}">Mixar</button></div>` : ""}
    </li>`;
}

function renderCortes() {
  if (!state.cortes.length) {
    const empty = '<li class="empty">Nenhum corte salvo ainda.</li>';
    corteList.innerHTML = empty;
    corteListMix.innerHTML = empty;
    mixerPanel?.setCortes([]);
    return;
  }

  corteList.innerHTML = state.cortes.map((c) => corteItemHtml(c, true)).join("");
  corteListMix.innerHTML = state.cortes.map((c) => corteItemHtml(c, true)).join("");
  mixerPanel?.setCortes(state.cortes);
}

function switchTab(tab) {
  const isMix = tab === "mixar";
  tabFatiar.classList.toggle("hidden", isMix);
  tabMixar.classList.toggle("hidden", !isMix);
  document.querySelectorAll(".tabs__btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.tab === tab);
  });
}

function openMix(name) {
  switchTab("mixar");
  mixerPanel?.selectByName(name);
}

async function saveCorte() {
  const start = state.markIn ?? parseTimeInput(inTimeInput.value);
  const end = state.markOut ?? parseTimeInput(outTimeInput.value);

  if (start == null || end == null) {
    setStatus("Informe início e fim.", "error");
    return;
  }
  if (end <= start) {
    setStatus("O fim precisa ser depois do início.", "error");
    return;
  }
  if (!state.sourceId) {
    setStatus("Selecione um arquivo de origem.", "error");
    return;
  }

  const filename = filenameInput.value.trim() || suggestFilename();
  if (!filename) {
    setStatus("Defina um nome para o arquivo.", "error");
    return;
  }

  setStatus("Exportando com ffmpeg…");
  $("#btnSave").disabled = true;

  try {
    const result = await api("/api/cortes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceId: state.sourceId,
        start,
        end,
        filename,
        startMark: toMark(start),
        endMark: toMark(end),
        part: state.nextPart,
      }),
    });

    setStatus(`Salvo: ${result.name} (${formatClock(result.duration, false)})`, "ok");
    clearMarks();
    await loadCortes();
  } catch (err) {
    setStatus(err.message, "error");
  } finally {
    $("#btnSave").disabled = false;
  }
}

function timeFromClientX(clientX) {
  const rect = timeline.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  return ratio * state.duration;
}

player.addEventListener("loadedmetadata", () => {
  state.duration = player.duration;
  durationEl.textContent = formatClock(state.duration);
  seek.max = String(state.duration);
  renderTimelineMarkers();
});

player.addEventListener("timeupdate", () => {
  currentTimeEl.textContent = formatClock(player.currentTime);
  renderTimelineMarkers();

  if (!state.loopSelection || state.markOut == null) return;
  if (player.currentTime >= state.markOut) {
    if (state.markIn != null) {
      player.currentTime = state.markIn;
      if (player.paused) player.play();
    } else {
      player.pause();
      state.loopSelection = false;
    }
  }
});

player.addEventListener("pause", () => {
  if (player.currentTime >= (state.markOut ?? Infinity) - 0.05) {
    state.loopSelection = false;
  }
});

seek.addEventListener("input", () => {
  seekTo(Number(seek.value));
});

timeline.addEventListener("click", (event) => {
  seekTo(timeFromClientX(event.clientX));
});

timeline.addEventListener("dblclick", (event) => {
  if (event.shiftKey) markOut(timeFromClientX(event.clientX));
  else markIn(timeFromClientX(event.clientX));
});

inTimeInput.addEventListener("change", () => {
  const t = parseTimeInput(inTimeInput.value);
  if (t == null) return;
  state.markIn = t;
  updateSelectionUi();
});

outTimeInput.addEventListener("change", () => {
  const t = parseTimeInput(outTimeInput.value);
  if (t == null) return;
  state.markOut = t;
  updateSelectionUi();
});

sourceSelect.addEventListener("change", () => {
  loadSource(decodeURIComponent(sourceSelect.value));
});

$("#btnMarkIn").addEventListener("click", () => markIn());
$("#btnMarkOut").addEventListener("click", () => markOut());
$("#btnPlaySelection").addEventListener("click", playSelection);
$("#btnClear").addEventListener("click", clearMarks);
$("#btnSave").addEventListener("click", saveCorte);
$("#btnRefresh").addEventListener("click", loadCortes);

document.querySelectorAll(".tabs__btn").forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

document.body.addEventListener("click", (event) => {
  const mixBtn = event.target.closest("[data-mix]");
  if (mixBtn) openMix(mixBtn.dataset.mix);
});

mixerPanel = createMixerPanel($("#mixPanel"), {
  api,
  onStatus: setStatus,
});

document.addEventListener("keydown", (event) => {
  if (event.target.matches("input, textarea, select")) return;

  switch (event.key.toLowerCase()) {
    case "i":
      event.preventDefault();
      markIn();
      break;
    case "o":
      event.preventDefault();
      markOut();
      break;
    case "l":
      event.preventDefault();
      playSelection();
      break;
    case " ":
      event.preventDefault();
      if (player.paused) player.play();
      else player.pause();
      break;
    case "arrowleft":
      event.preventDefault();
      seekTo(player.currentTime - (event.shiftKey ? 5 : 1));
      break;
    case "arrowright":
      event.preventDefault();
      seekTo(player.currentTime + (event.shiftKey ? 5 : 1));
      break;
    default:
      break;
  }
});

(async function init() {
  try {
    await loadSources();
    await loadCortes();
    setStatus("Pronto — marque início e fim enquanto escuta.", "ok");
  } catch (err) {
    setStatus(`Servidor offline? Rode: npm start — ${err.message}`, "error");
  }
})();
