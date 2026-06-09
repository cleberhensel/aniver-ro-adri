import { DEFAULT_FX, PRESETS, clampFx, mixOnlyFx, formatFxSummary } from "./mixer-filters.mjs";

const CUSTOM_PRESETS_KEY = "fatiador-custom-presets";

const $ = (sel, root = document) => root.querySelector(sel);

export function createMixerPanel(rootEl, { api, onStatus }) {
  const state = {
    cortes: [],
    selected: null,
    fx: { ...DEFAULT_FX },
    duration: 0,
    abMode: "mix",
    engine: null,
  };

  rootEl.innerHTML = `
    <div class="mix-layout">
      <div class="mix-top">
        <div class="field">
          <label for="mixSelect">Trecho para mixar</label>
          <select id="mixSelect"></select>
        </div>
        <div class="mix-ab">
          <button type="button" class="btn btn--sm" data-ab="original">Original</button>
          <button type="button" class="btn btn--sm btn--primary is-active" data-ab="mix">Mixado</button>
        </div>
      </div>

      <div class="mix-transport">
        <button type="button" class="btn" id="mixPlay">▶ Ouvir</button>
        <button type="button" class="btn" id="mixStop">■ Parar</button>
        <span class="mix-time" id="mixTime">00:00 / 00:00</span>
      </div>
      <div class="mix-levels">
        <label class="mix-level__label">Nível (preview)</label>
        <meter id="mixMeter" class="mix-meter" min="-48" max="-6" value="-30" low="-24" high="-12" optimum="-16"></meter>
        <span class="mix-level__db" id="mixMeterDb">— dB</span>
      </div>
      <div class="mix-summary" id="mixSummary">Ajustes do export: —</div>

      <div class="mix-preset-bar">
        <div class="mix-presets" id="mixPresets"></div>
        <div class="mix-preset-save">
          <input id="presetName" type="text" placeholder="Nome do preset" autocomplete="off">
          <button type="button" class="btn btn--sm" id="presetSave">Salvar preset</button>
          <select id="presetDeleteSelect" class="preset-delete-select">
            <option value="">Apagar preset…</option>
          </select>
          <button type="button" class="btn btn--sm" id="presetDelete" title="Apagar preset selecionado">Apagar</button>
        </div>
      </div>

      <div class="mix-sections">
        <details class="mix-section" open>
          <summary>Corte fino</summary>
          <div class="mix-grid">
            ${slider("trimStartMs", "Atrasar início", 0, 5000, 10, "ms")}
            ${slider("trimEndMs", "Antecipar fim", 0, 5000, 10, "ms")}
          </div>
        </details>

        <details class="mix-section" open>
          <summary>Nível e tom</summary>
          <div class="mix-grid">
            ${slider("volumeDb", "Volume", -24, 12, 0.5, "dB")}
            ${slider("bassDb", "Graves", -12, 12, 0.5, "dB")}
            ${slider("midDb", "Médios", -12, 12, 0.5, "dB")}
            ${slider("trebleDb", "Agudos", -12, 12, 0.5, "dB")}
            <label class="mix-check"><input type="checkbox" id="fx-normalize" checked> Normalizar (loudness)</label>
          </div>
        </details>

        <details class="mix-section" open>
          <summary>Limpeza de ruído</summary>
          <div class="mix-grid">
            ${slider("highpassHz", "High-pass (rumble)", 0, 300, 5, "Hz")}
            ${slider("lowpassHz", "Low-pass (chiado)", 4000, 16000, 100, "Hz")}
            ${slider("noiseGateDb", "Portão de ruído", -60, -25, 1, "dB")}
            <label class="mix-check"><input type="checkbox" id="fx-extraFft"> Limpeza FFT extra (só export, não ouve no preview)</label>
            <div class="mix-slider" data-fx="noiseReduction" id="fftSliderWrap">
              <div class="mix-slider__head">
                <label>Intensidade FFT</label>
                <output data-out="noiseReduction">0</output>
              </div>
              <input type="range" id="fx-noiseReduction" min="0" max="24" step="1" value="0">
            </div>
          </div>
        </details>

        <details class="mix-section">
          <summary>Dinâmica</summary>
          <div class="mix-grid">
            <label class="mix-check"><input type="checkbox" id="fx-compressorOn"> Compressor</label>
            ${slider("compressorThreshold", "Threshold", -40, -8, 1, "dB")}
            ${slider("compressorRatio", "Ratio", 1, 8, 0.5, ":1")}
          </div>
        </details>

        <details class="mix-section">
          <summary>Fades</summary>
          <div class="mix-grid">
            ${slider("fadeInMs", "Fade in", 0, 1500, 10, "ms")}
            ${slider("fadeOutMs", "Fade out", 0, 1500, 10, "ms")}
          </div>
        </details>
      </div>

      <div class="mix-actions">
        <button type="button" class="btn" id="mixReset">Resetar</button>
        <button type="button" class="btn btn--accent" id="mixExport">Exportar este trecho</button>
        <button type="button" class="btn btn--primary" id="mixExportAll">Mixar todos os trechos</button>
      </div>
      <label class="mix-check mix-check--inline">
        <input type="checkbox" id="mixReplace"> Substituir arquivo original
      </label>
      <p class="hint">Export espelha o preview (EQ, compressor, volume). FFT e portão forte só entram se você ativar — não ouve no preview.</p>
    </div>
  `;

  function slider(id, label, min, max, step, unit) {
    return `
      <div class="mix-slider" data-fx="${id}">
        <div class="mix-slider__head">
          <label>${label}</label>
          <output data-out="${id}">0</output>
        </div>
        <input type="range" id="fx-${id}" min="${min}" max="${max}" step="${step}" value="0">
        <span class="mix-slider__unit">${unit}</span>
      </div>`;
  }

  const mixSelect = $("#mixSelect", rootEl);
  const mixTime = $("#mixTime", rootEl);
  const mixMeter = $("#mixMeter", rootEl);
  const mixMeterDb = $("#mixMeterDb", rootEl);
  const mixSummary = $("#mixSummary", rootEl);
  const presetsEl = $("#mixPresets", rootEl);

  function loadCustomPresets() {
    try {
      return JSON.parse(localStorage.getItem(CUSTOM_PRESETS_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveCustomPresets(presets) {
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
  }

  function slugPreset(name) {
    return name.trim().toLowerCase()
      .normalize("NFD").replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || `preset-${Date.now()}`;
  }

  function getPreset(key) {
    const custom = loadCustomPresets();
    if (custom[key]) return { ...DEFAULT_FX, ...custom[key] };
    if (PRESETS[key]) return { ...PRESETS[key] };
    return null;
  }

  function renderPresetButtons() {
    const custom = loadCustomPresets();
    const builtin = Object.entries(PRESETS)
      .map(([key, p]) => `<button type="button" class="btn btn--sm" data-preset="${key}">${p.label}</button>`)
      .join("");
    const saved = Object.entries(custom)
      .map(([key, p]) => `<button type="button" class="btn btn--sm btn--saved" data-preset="${key}">${p.label} ★</button>`)
      .join("");

    presetsEl.innerHTML = builtin + saved;

    const delSelect = $("#presetDeleteSelect", rootEl);
    delSelect.innerHTML = '<option value="">Apagar preset…</option>' +
      Object.entries(custom)
        .map(([key, p]) => `<option value="${key}">${p.label}</option>`)
        .join("");
  }

  renderPresetButtons();

  class MixEngine {
    constructor() {
      this.ctx = null;
      this.buffer = null;
      this.nodes = {};
      this.source = null;
      this.startedAt = 0;
      this.offset = 0;
      this.playing = false;
      this.onTick = null;
      this.raf = 0;
      this.lastPosition = 0;
      this.graphReady = false;
      this.fx = null;
      this.bypass = false;
    }

    async load(url) {
      this.halt();
      if (!this.ctx) this.ctx = new AudioContext();
      const res = await fetch(url);
      const arr = await res.arrayBuffer();
      this.buffer = await this.ctx.decodeAudioData(arr.slice(0));
      this.graphReady = false;
      this.lastPosition = 0;
      return this.buffer.duration;
    }

    ensureGraph() {
      if (this.graphReady || !this.buffer) return;
      const { ctx } = this;

      this.nodes.master = ctx.createGain();
      this.nodes.analyser = ctx.createAnalyser();
      this.nodes.analyser.fftSize = 2048;
      this.nodes.master.connect(this.nodes.analyser);
      this.nodes.analyser.connect(ctx.destination);

      this.nodes.dry = ctx.createGain();
      this.nodes.dry.connect(this.nodes.master);

      this.nodes.hp = ctx.createBiquadFilter();
      this.nodes.hp.type = "highpass";
      this.nodes.lp = ctx.createBiquadFilter();
      this.nodes.lp.type = "lowpass";
      this.nodes.low = ctx.createBiquadFilter();
      this.nodes.low.type = "lowshelf";
      this.nodes.low.frequency.value = 200;
      this.nodes.mid = ctx.createBiquadFilter();
      this.nodes.mid.type = "peaking";
      this.nodes.mid.frequency.value = 1000;
      this.nodes.mid.Q.value = 1;
      this.nodes.high = ctx.createBiquadFilter();
      this.nodes.high.type = "highshelf";
      this.nodes.high.frequency.value = 4000;
      this.nodes.comp = ctx.createDynamicsCompressor();
      this.nodes.comp.attack.value = 0.008;
      this.nodes.comp.release.value = 0.12;
      this.nodes.wet = ctx.createGain();

      this.nodes.hp.connect(this.nodes.lp);
      this.nodes.lp.connect(this.nodes.low);
      this.nodes.low.connect(this.nodes.mid);
      this.nodes.mid.connect(this.nodes.high);
      this.nodes.high.connect(this.nodes.comp);
      this.nodes.comp.connect(this.nodes.wet);
      this.nodes.wet.connect(this.nodes.master);

      this.nodes.input = ctx.createGain();
      this.nodes.input.connect(this.nodes.dry);
      this.nodes.input.connect(this.nodes.hp);

      this.graphReady = true;
    }

    setParam(param, value, ramp = 0.012) {
      if (!param) return;
      const t = this.ctx.currentTime;
      param.cancelScheduledValues(t);
      param.setTargetAtTime(value, t, ramp);
    }

    updateParams(fx, bypass) {
      if (!this.buffer) return;
      this.ensureGraph();
      this.fx = fx;
      this.bypass = bypass;

      const trimStart = fx.trimStartMs / 1000;
      const trimEnd = Math.max(trimStart + 0.05, this.buffer.duration - fx.trimEndMs / 1000);
      this.trimStart = trimStart;
      this.trimEnd = trimEnd;

      const vol = dbToGain(fx.volumeDb + (fx.normalize && !bypass ? 3 : 0));
      this.setParam(this.nodes.dry.gain, bypass ? vol : 0, 0.008);
      this.setParam(this.nodes.wet.gain, bypass ? 0 : vol, 0.008);

      this.setParam(this.nodes.hp.frequency, Math.max(20, fx.highpassHz || 20));
      this.setParam(this.nodes.lp.frequency, fx.lowpassHz);
      this.setParam(this.nodes.low.gain, fx.bassDb);
      this.setParam(this.nodes.mid.gain, fx.midDb);
      this.setParam(this.nodes.high.gain, fx.trebleDb);

      this.setParam(
        this.nodes.comp.threshold,
        fx.compressorOn ? fx.compressorThreshold : 0,
      );
      this.setParam(this.nodes.comp.ratio, fx.compressorOn ? fx.compressorRatio : 1);

      if (this.playing) {
        const now = this.getCurrentTime();
        if (now < this.trimStart) this.seekTo(this.trimStart);
        else if (now >= this.trimEnd) this.halt(true);
      } else if (this.lastPosition > 0) {
        this.lastPosition = clampTime(this.lastPosition, this.trimStart, this.trimEnd);
      }
    }

    getCurrentTime() {
      if (!this.playing || !this.ctx) {
        return clampTime(
          this.lastPosition || this.trimStart || 0,
          this.trimStart ?? 0,
          this.trimEnd ?? (this.buffer?.duration ?? 0),
        );
      }
      return this.offset + (this.ctx.currentTime - this.startedAt);
    }

    async play(from) {
      if (!this.buffer || !this.graphReady) return;
      if (this.ctx.state === "suspended") await this.ctx.resume();

      const startAt = clampTime(
        from ?? this.getCurrentTime(),
        this.trimStart,
        this.trimEnd - 0.01,
      );

      this.stopSource();
      this.source = this.ctx.createBufferSource();
      this.source.buffer = this.buffer;
      this.source.connect(this.nodes.input);

      const remaining = this.trimEnd - startAt;
      this.source.start(0, startAt, remaining);
      this.offset = startAt;
      this.startedAt = this.ctx.currentTime;
      this.lastPosition = startAt;
      this.playing = true;
      this.tick();
    }

    seekTo(seconds) {
      if (!this.buffer) return;
      const t = clampTime(seconds, this.trimStart, this.trimEnd - 0.01);
      this.lastPosition = t;
      if (this.playing) this.play(t);
    }

    getLevelDb() {
      if (!this.nodes.analyser) return -48;
      const data = new Float32Array(this.nodes.analyser.fftSize);
      this.nodes.analyser.getFloatTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
      const rms = Math.sqrt(sum / data.length);
      return 20 * Math.log10(Math.max(rms, 1e-8));
    }

    tick() {
      if (!this.playing) return;
      const t = this.getCurrentTime();
      this.lastPosition = t;
      this.onTick?.(t, this.trimEnd, this.getLevelDb());
      if (t >= this.trimEnd - 0.02) {
        this.halt(true);
        return;
      }
      this.raf = requestAnimationFrame(() => this.tick());
    }

    stopSource() {
      cancelAnimationFrame(this.raf);
      try { this.source?.stop(); } catch { /* noop */ }
      this.source = null;
    }

    halt(keepPosition = false) {
      if (this.playing) this.lastPosition = this.getCurrentTime();
      this.playing = false;
      this.stopSource();
      if (!keepPosition) this.lastPosition = this.trimStart ?? 0;
    }

    stop() {
      this.halt(true);
    }
  }

  function clampTime(t, min, max) {
    return Math.max(min, Math.min(max, t));
  }

  function dbToGain(db) {
    return Math.pow(10, db / 20);
  }

  function formatSec(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  function readFxFromUi() {
    const fx = { ...DEFAULT_FX };
    for (const el of rootEl.querySelectorAll("[data-fx] input[type=range]")) {
      const key = el.closest("[data-fx]").dataset.fx;
      fx[key] = Number(el.value);
    }
    fx.normalize = $("#fx-normalize", rootEl).checked;
    fx.compressorOn = $("#fx-compressorOn", rootEl).checked;
    fx.extraFft = $("#fx-extraFft", rootEl).checked;
    return clampFx(fx);
  }

  function writeFxToUi(fx, opts = {}) {
    state.fx = clampFx(fx);
    for (const el of rootEl.querySelectorAll("[data-fx] input[type=range]")) {
      const key = el.closest("[data-fx]").dataset.fx;
      el.value = state.fx[key];
      const out = rootEl.querySelector(`[data-out="${key}"]`);
      if (out) out.textContent = formatValue(key, state.fx[key]);
    }
    $("#fx-normalize", rootEl).checked = state.fx.normalize;
    $("#fx-compressorOn", rootEl).checked = state.fx.compressorOn;
    $("#fx-extraFft", rootEl).checked = state.fx.extraFft;
    $("#fftSliderWrap", rootEl).style.opacity = state.fx.extraFft ? "1" : "0.45";
    applyPreview();
    if (!opts.skipSave && state.selected) saveLocalFx(state.selected.name, state.fx);
  }

  function formatValue(key, val) {
    if (key.endsWith("Db") || key === "compressorThreshold" || key === "noiseGateDb") {
      return `${val > 0 ? "+" : ""}${val}`;
    }
    if (key === "compressorRatio") return `${val}:1`;
    return String(val);
  }

  function storageKey(name) {
    return `fatiador-mix:${name}`;
  }

  function saveLocalFx(name, fx) {
    localStorage.setItem(storageKey(name), JSON.stringify(fx));
  }

  function loadLocalFx(name) {
    try {
      const raw = localStorage.getItem(storageKey(name));
      return raw ? clampFx(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }

  function updateMixSummary() {
    const fx = readFxFromUi();
    mixSummary.textContent = `Export: ${formatFxSummary(fx)}`;
  }

  function applyPreview() {
    if (!state.engine) return;
    state.fx = readFxFromUi();
    state.engine.updateParams(state.fx, state.abMode === "original");
    updateMixSummary();
    if (state.selected) saveLocalFx(state.selected.name, state.fx);
  }

  async function selectCorte(corte) {
    state.selected = corte;
    state.engine = state.engine ?? new MixEngine();
    state.engine.onTick = (t, end, levelDb) => {
      mixTime.textContent = `${formatSec(t)} / ${formatSec(end)}`;
      if (Number.isFinite(levelDb)) {
        mixMeter.value = Math.max(-48, Math.min(-6, levelDb));
        mixMeterDb.textContent = `${levelDb.toFixed(1)} dB`;
      }
    };
    onStatus?.(`Carregando ${corte.name}…`);
    state.duration = await state.engine.load(corte.url);
    state.engine.ensureGraph();
    mixTime.textContent = `00:00 / ${formatSec(state.duration)}`;
    const saved = loadLocalFx(corte.name);
    writeFxToUi(saved ?? state.fx, { skipSave: true });
    onStatus?.(`Mixando: ${corte.name}`, "ok");
  }

  function setCortes(cortes) {
    state.cortes = cortes;
    mixSelect.innerHTML = cortes.length
      ? cortes.map((c) => `<option value="${c.name}">parte ${c.part} — ${c.name}</option>`).join("")
      : '<option value="">Nenhum corte</option>';
    if (cortes.length) selectCorte(cortes[0]);
  }

  mixSelect.addEventListener("change", () => {
    const c = state.cortes.find((x) => x.name === mixSelect.value);
    if (c) selectCorte(c);
  });

  rootEl.querySelectorAll("[data-fx] input[type=range]").forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.closest("[data-fx]").dataset.fx;
      const out = rootEl.querySelector(`[data-out="${key}"]`);
      if (out) out.textContent = formatValue(key, Number(input.value));
      applyPreview();
    });
  });

  $("#fx-normalize", rootEl).addEventListener("change", applyPreview);
  $("#fx-compressorOn", rootEl).addEventListener("change", applyPreview);
  $("#fx-extraFft", rootEl).addEventListener("change", () => {
    $("#fftSliderWrap", rootEl).style.opacity = $("#fx-extraFft", rootEl).checked ? "1" : "0.45";
    applyPreview();
  });

  presetsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-preset]");
    if (!btn) return;
    const preset = getPreset(btn.dataset.preset);
    if (preset) writeFxToUi(preset);
  });

  $("#presetSave", rootEl).addEventListener("click", () => {
    const name = $("#presetName", rootEl).value.trim();
    if (!name) {
      onStatus?.("Digite um nome para o preset.", "error");
      return;
    }
    const key = slugPreset(name);
    const custom = loadCustomPresets();
    custom[key] = { label: name, ...mixOnlyFx(readFxFromUi()) };
    saveCustomPresets(custom);
    renderPresetButtons();
    $("#presetName", rootEl).value = "";
    onStatus?.(`Preset salvo: ${name}`, "ok");
  });

  $("#presetDelete", rootEl).addEventListener("click", () => {
    const key = $("#presetDeleteSelect", rootEl).value;
    if (!key) {
      onStatus?.("Selecione um preset para apagar.", "error");
      return;
    }
    const custom = loadCustomPresets();
    const label = custom[key]?.label ?? key;
    delete custom[key];
    saveCustomPresets(custom);
    renderPresetButtons();
    onStatus?.(`Preset apagado: ${label}`, "ok");
  });

  rootEl.querySelectorAll("[data-ab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.abMode = btn.dataset.ab;
      rootEl.querySelectorAll("[data-ab]").forEach((b) => b.classList.toggle("is-active", b === btn));
      applyPreview();
    });
  });

  $("#mixPlay", rootEl).addEventListener("click", async () => {
    if (!state.engine?.graphReady) applyPreview();
    await state.engine?.play();
  });
  $("#mixStop", rootEl).addEventListener("click", () => state.engine?.stop());

  $("#mixReset", rootEl).addEventListener("click", () => writeFxToUi({ ...DEFAULT_FX }));

  async function exportOne() {
    if (!state.selected) return;
    const fx = readFxFromUi();
    const replace = $("#mixReplace", rootEl).checked;
    onStatus?.("Exportando mix…");
    $("#mixExport", rootEl).disabled = true;
    try {
      const result = await api("/api/mix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputName: state.selected.name,
          fx,
          replace,
        }),
      });
      onStatus?.(`Exportado: ${result.name} (${formatFxSummary(fx)})`, "ok");
    } catch (err) {
      onStatus?.(err.message, "error");
    } finally {
      $("#mixExport", rootEl).disabled = false;
    }
  }

  async function exportAll() {
    if (!state.cortes.length) {
      onStatus?.("Nenhum corte para mixar.", "error");
      return;
    }
    const fx = mixOnlyFx(readFxFromUi());
    const replace = $("#mixReplace", rootEl).checked;
    const total = state.cortes.length;

    if (!confirm(`Aplicar o preset atual em todos os ${total} trechos?`)) return;

    onStatus?.(`Mixando 0/${total}…`);
    $("#mixExportAll", rootEl).disabled = true;
    $("#mixExport", rootEl).disabled = true;

    try {
      const result = await api("/api/mix/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fx, replace }),
      });
      const ok = result.results?.length ?? 0;
      const fail = result.errors?.length ?? 0;
      onStatus?.(`Batch: ${ok}/${total} exportados${fail ? `, ${fail} erros` : ""}`, fail ? "error" : "ok");
    } catch (err) {
      onStatus?.(err.message, "error");
    } finally {
      $("#mixExportAll", rootEl).disabled = false;
      $("#mixExport", rootEl).disabled = false;
    }
  }

  $("#mixExport", rootEl).addEventListener("click", exportOne);
  $("#mixExportAll", rootEl).addEventListener("click", exportAll);

  writeFxToUi({ ...DEFAULT_FX });
  updateMixSummary();

  return {
    setCortes,
    selectByName: (name) => {
      const c = state.cortes.find((x) => x.name === name);
      if (c) {
        mixSelect.value = name;
        selectCorte(c);
      }
    },
  };
}
