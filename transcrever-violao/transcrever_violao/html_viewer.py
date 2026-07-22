"""Gera visualizar.html para inspecionar uma transcrição localmente."""

from __future__ import annotations

import base64
import json
import os
from pathlib import Path

from transcrever_violao.alphatex import export_alphatex
from transcrever_violao.midi_io import load_notes


def _rel_path(output_dir: Path, target: Path) -> str:
    return Path(os.path.relpath(target.resolve(), output_dir.resolve())).as_posix()


def _resolve_audio_sources(output_dir: Path, audio_path: Path | None) -> list[str]:
    parent = output_dir.parent
    by_name = {name: parent / name for name in ("guitar.mp3", "guitar.wav", "no_vocals.wav")}
    ordered: list[Path] = []
    for name in ("guitar.mp3", "guitar.wav", "no_vocals.wav"):
        if by_name[name].is_file():
            ordered.append(by_name[name])
    if audio_path and audio_path.is_file() and audio_path not in ordered:
        ordered.append(audio_path)
    return [_rel_path(output_dir, p) for p in ordered]


def export_viewer(
    output_dir: Path,
    *,
    title: str | None = None,
    audio_path: Path | None = None,
) -> Path:
    """Cria visualizar.html na pasta de transcrição."""
    output_dir = output_dir.resolve()
    analysis_path = output_dir / "analise.json"
    tab_path = output_dir / "arranjo.tab.txt"
    midi_path = output_dir / "arranjo.mid"
    gp5_path = output_dir / "arranjo.gp5"
    html_path = output_dir / "visualizar.html"

    if not analysis_path.is_file():
        raise FileNotFoundError(f"analise.json não encontrado em {output_dir}")

    analysis = json.loads(analysis_path.read_text(encoding="utf-8"))
    tab_text = tab_path.read_text(encoding="utf-8") if tab_path.is_file() else ""

    if audio_path is None:
        audio_path = Path(analysis.get("audio", ""))
    if not audio_path.is_file():
        audio_path = None

    playback_notes: list[dict] = []
    if midi_path.is_file():
        for start, end, pitch in load_notes(midi_path):
            playback_notes.append(
                {
                    "s": round(start, 4),
                    "d": round(max(0.05, end - start), 4),
                    "p": int(pitch),
                }
            )

    stem_title = title or output_dir.parent.name
    audio_sources = _resolve_audio_sources(output_dir, audio_path)

    summary = {
        "title": stem_title,
        "bpm": analysis.get("bpm"),
        "duration_sec": analysis.get("duration_sec"),
        "notes_raw": analysis.get("notes_raw"),
        "events_quantized": analysis.get("events_quantized"),
        "polyphony": analysis.get("polyphony", {}),
        "pitch_range": analysis.get("pitch_range", {}),
        "top_pitches": analysis.get("top_pitches", []),
        "model": analysis.get("model"),
        "generated_at": analysis.get("generated_at"),
    }
    roll_events = analysis.get("events", [])
    alphatex = ""
    if midi_path.is_file():
        alphatex = export_alphatex(
            [],
            title=stem_title,
            bpm=float(summary.get("bpm") or 120),
            division=int(analysis.get("division") or 32),
            raw_notes=load_notes(midi_path),
        )

    html = _render_html(
        summary=summary,
        tab_text=tab_text,
        audio_sources=audio_sources,
        playback_notes=playback_notes,
        roll_events=roll_events,
        alphatex=alphatex,
        has_gp5=gp5_path.is_file(),
    )
    html_path.write_text(html, encoding="utf-8")
    if alphatex:
        (output_dir / "arranjo.alphatex.txt").write_text(alphatex, encoding="utf-8")
    return html_path


def _render_html(
    *,
    summary: dict,
    tab_text: str,
    audio_sources: list[str],
    playback_notes: list[dict],
    roll_events: list,
    alphatex: str,
    has_gp5: bool,
) -> str:
    summary_json = json.dumps(summary, ensure_ascii=False)
    roll_json = json.dumps(roll_events, ensure_ascii=False)
    notes_json = json.dumps(playback_notes, ensure_ascii=False)
    tab_escaped = json.dumps(tab_text)
    sources_json = json.dumps(audio_sources, ensure_ascii=False)
    alphatex_json = json.dumps(alphatex)

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{_esc(summary.get("title", "Transcrição"))}</title>
  <style>
    :root {{
      --bg: #12141a; --panel: #1c2030; --border: #2e3548;
      --text: #e8ecf4; --muted: #8b95ab; --accent: #6ea8fe; --warn: #f0ad4e;
    }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); }}
    header {{ padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); }}
    h1 {{ margin: 0 0 .25rem; font-size: 1.35rem; }}
    .sub {{ color: var(--muted); font-size: .9rem; }}
    main {{ max-width: 1100px; margin: 0 auto; padding: 1.25rem 1.5rem 3rem; }}
    section {{ background: var(--panel); border: 1px solid var(--border); border-radius: 10px;
      padding: 1rem 1.25rem; margin-bottom: 1rem; }}
    h2 {{ margin: 0 0 .75rem; font-size: 1rem; color: var(--accent); }}
    .stats {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: .75rem; }}
    .stat {{ background: #151925; border-radius: 8px; padding: .65rem .8rem; }}
    .stat b {{ display: block; font-size: 1.2rem; }}
    .stat span {{ color: var(--muted); font-size: .78rem; }}
    .warn {{ background: #2a2218; border: 1px solid #5c4a2a; color: var(--warn);
      border-radius: 8px; padding: .65rem .85rem; font-size: .88rem; margin-bottom: 1rem; }}
    .tip {{ background: #182030; border: 1px solid #2a4060; color: #9ec5fe;
      border-radius: 8px; padding: .65rem .85rem; font-size: .88rem; margin-bottom: 1rem; }}
    .controls {{ display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }}
    button {{ background: #2a3550; color: var(--text); border: 1px solid var(--border);
      border-radius: 6px; padding: .45rem .85rem; cursor: pointer; font-size: .88rem; }}
    button:hover {{ background: #354261; }}
    button.primary {{ background: #2d4a7a; border-color: #4a6fa5; }}
    audio {{ width: 100%; margin-top: .5rem; }}
    #roll {{ width: 100%; height: 220px; background: #0e1018; border-radius: 8px;
      border: 1px solid var(--border); display: block; }}
    #tab {{ font-family: ui-monospace, Menlo, monospace; font-size: 11px; white-space: pre;
      overflow: auto; background: #0e1018; border-radius: 8px; padding: .75rem;
      border: 1px solid var(--border); max-height: 480px; }}
    .files {{ display: flex; flex-wrap: wrap; gap: .5rem; }}
    .files a {{ color: var(--accent); }}
    #status {{ color: var(--muted); font-size: .85rem; }}
    code {{ background: #0e1018; padding: .1rem .35rem; border-radius: 4px; }}
    .at-wrap {{
      border: 1px solid var(--border); border-radius: 8px; overflow: hidden;
      background: #0e1018; display: flex; flex-direction: column;
    }}
    .at-viewport {{
      height: 420px; width: 100%; overflow: auto; background: #f4f4f4; position: relative;
    }}
    .at-main {{ width: 100%; min-height: 400px; }}
    .at-bar {{
      display: flex; flex-wrap: wrap; gap: .5rem; align-items: center;
      padding: .5rem .75rem; background: #151925; border-top: 1px solid var(--border);
    }}
    .at-bar button:disabled {{ opacity: .45; cursor: wait; }}
    #gp5Status, #gp5Time {{ color: var(--muted); font-size: .85rem; }}
    .at-cursor-bar {{ background: rgba(255, 242, 0, 0.25); }}
    .at-cursor-beat {{ background: rgba(64, 64, 255, 0.75); width: 3px; }}
    .at-highlight * {{ fill: #0078ff; stroke: #0078ff; }}
  </style>
  {"<script src='https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.8.3/dist/alphaTab.js'></script>" if alphatex else ""}
</head>
<body>
  <header>
    <h1 id="title"></h1>
    <div class="sub" id="meta"></div>
  </header>
  <main>
    <div class="tip" id="serveTip">
      Se o áudio não tocar, use o servidor local:
      <code>transcrever-violao/servir.sh</code> nesta pasta e abra o link <code>localhost</code>.
    </div>
    <div class="warn">
      Rascunho automático (GAPS). Compare com o stem original. Revise no ouvido.
    </div>

    <section>
      <h2>Resumo</h2>
      <div class="stats" id="stats"></div>
    </section>

    <section>
      <h2>Reprodução</h2>
      <p class="sub">Stem original + MIDI transcrito (sintetizador embutido, sem internet).</p>
      <div class="controls">
        <button class="primary" id="playAll">▶ Tocar stem + MIDI</button>
        <button id="playStem">▶ Só stem</button>
        <button id="playMidi">▶ Só MIDI</button>
        <button id="stopAll">■ Parar</button>
        <span id="status">Pronto</span>
      </div>
      <audio id="stem" controls preload="metadata"></audio>
    </section>

    {"<section id='gp5Section'><h2>Tab + player (arranjo)</h2><p class='sub'>Tablatura interativa via alphaTab (equivalente ao GP5). Internet na 1ª vez (soundfont). Requer <code>servir.sh</code>.</p><div class='at-wrap'><div class='at-viewport' id='atViewport'><div id='atMain' class='at-main'></div></div><div class='at-bar'><button class='primary' id='gp5Play' disabled>▶ Play</button><button id='gp5Pause' disabled>⏸ Pausar</button><button id='gp5Stop' disabled>■ Parar</button><span id='gp5Status'>A carregar…</span><span id='gp5Time'></span></div></div></section>" if alphatex else ""}

    <section>
      <h2>Piano roll</h2>
      <canvas id="roll"></canvas>
    </section>

    <section>
      <h2>Tablatura</h2>
      <pre id="tab"></pre>
    </section>

    <section>
      <h2>Ficheiros</h2>
      <div class="files">
        <a href="arranjo.mid" download>arranjo.mid</a>
        <a href="arranjo.tab.txt" download>arranjo.tab.txt</a>
        {"<a href='arranjo.gp5' download>arranjo.gp5</a>" if has_gp5 else ""}
        <a href="analise.json" download>analise.json</a>
      </div>
    </section>
  </main>

  <script>
    const SUMMARY = {summary_json};
    const ROLL_EVENTS = {roll_json};
    const PLAYBACK_NOTES = {notes_json};
    const AUDIO_SOURCES = {sources_json};
    const TAB_TEXT = {tab_escaped};

    const stemEl = document.getElementById("stem");
    const statusEl = document.getElementById("status");

    document.getElementById("title").textContent = SUMMARY.title;
    document.getElementById("meta").textContent =
      `Modelo: ${{SUMMARY.model}} · ${{SUMMARY.generated_at || ""}}`;

    if (location.protocol === "http:" || location.protocol === "https:") {{
      document.getElementById("serveTip").style.display = "none";
    }}

    document.getElementById("stats").innerHTML = [
      ["BPM", SUMMARY.bpm],
      ["Duração", `${{SUMMARY.duration_sec}}s`],
      ["Notas MIDI", SUMMARY.notes_raw],
      ["Eventos", SUMMARY.events_quantized],
      ["Polifonia máx.", SUMMARY.polyphony?.max ?? "—"],
    ].map(([k, v]) => `<div class="stat"><b>${{v}}</b><span>${{k}}</span></div>`).join("");

    document.getElementById("tab").textContent = TAB_TEXT;

    // Áudio: tenta mp3 primeiro, depois wav
    if (AUDIO_SOURCES.length) {{
      stemEl.innerHTML = AUDIO_SOURCES.map(src =>
        `<source src="${{src}}" type="${{src.endsWith(".mp3") ? "audio/mpeg" : "audio/wav"}}">`
      ).join("");
      stemEl.load();
      stemEl.addEventListener("error", () => {{
        statusEl.textContent = "Stem não carregou — use servir.sh (file:// bloqueia áudio)";
      }});
      stemEl.addEventListener("loadedmetadata", () => {{
        statusEl.textContent = `Stem: ${{AUDIO_SOURCES[0]}} (${{stemEl.duration.toFixed(0)}}s)`;
      }});
    }} else {{
      statusEl.textContent = "Stem não encontrado (guitar.mp3/wav)";
    }}

    // Piano roll
    (function drawRoll() {{
      const canvas = document.getElementById("roll");
      const ctx = canvas.getContext("2d");
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#0e1018"; ctx.fillRect(0, 0, w, h);
      if (!ROLL_EVENTS.length) return;
      const times = ROLL_EVENTS.map(e => e.time);
      const t0 = Math.min(...times), t1 = Math.max(...times);
      const pitches = ROLL_EVENTS.flatMap(e => e.pitches);
      const p0 = Math.min(...pitches) - 2, p1 = Math.max(...pitches) + 2;
      const pad = 24;
      ctx.strokeStyle = "#252a3a";
      for (let i = 0; i <= 8; i++) {{
        const y = pad + (h - pad * 2) * (i / 8);
        ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
      }}
      ROLL_EVENTS.forEach(ev => {{
        const x = pad + ((ev.time - t0) / (t1 - t0 || 1)) * (w - pad * 2);
        ev.pitches.forEach(p => {{
          const y = h - pad - ((p - p0) / (p1 - p0 || 1)) * (h - pad * 2);
          ctx.fillStyle = "#7ee787";
          ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
        }});
      }});
    }})();

    // MIDI via Web Audio (offline, sem CDN)
    let audioCtx = null;
    let activeNodes = [];
    let stopTimer = null;

    function midiFreq(m) {{ return 440 * Math.pow(2, (m - 69) / 12); }}

    async function ensureCtx() {{
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") await audioCtx.resume();
      return audioCtx;
    }}

    function stopMidi() {{
      activeNodes.forEach(n => {{ try {{ n.stop(); n.disconnect(); }} catch (_) {{}} }});
      activeNodes = [];
      if (stopTimer) {{ clearTimeout(stopTimer); stopTimer = null; }}
    }}

    async function playMidi() {{
      if (!PLAYBACK_NOTES.length) {{
        statusEl.textContent = "Sem notas MIDI";
        return;
      }}
      const ctx = await ensureCtx();
      stopMidi();
      const t0 = ctx.currentTime + 0.08;
      const maxEnd = PLAYBACK_NOTES.reduce((m, n) => Math.max(m, n.s + n.d), 0);

      PLAYBACK_NOTES.forEach(({{ s, d, p }}) => {{
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = midiFreq(p);
        const start = t0 + s;
        const dur = Math.max(0.06, Math.min(d, 1.2));
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.15, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur + 0.05);
        activeNodes.push(osc, gain);
      }});

      statusEl.textContent = `MIDI a tocar (~${{maxEnd.toFixed(0)}}s) — sintetizador simples`;
      stopTimer = setTimeout(() => {{
        stopMidi();
        statusEl.textContent = "MIDI terminou";
      }}, (maxEnd + 1) * 1000);
    }}

    document.getElementById("playMidi").onclick = () => playMidi();
    document.getElementById("playStem").onclick = async () => {{
      stopMidi();
      try {{
        await stemEl.play();
        statusEl.textContent = "Stem a tocar";
      }} catch (e) {{
        statusEl.textContent = "Erro stem: " + e.message + " — use servir.sh";
      }}
    }};
    document.getElementById("playAll").onclick = async () => {{
      stopMidi();
      try {{
        stemEl.currentTime = 0;
        await stemEl.play();
        await playMidi();
        statusEl.textContent = "Stem + MIDI (comparar)";
      }} catch (e) {{
        statusEl.textContent = "Erro: " + e.message + " — use servir.sh";
      }}
    }};
    let gp5Api = null;

    document.getElementById("stopAll").onclick = () => {{
      stopMidi();
      stemEl.pause();
      if (gp5Api) gp5Api.stop();
      statusEl.textContent = "Parado";
    }};

    const ALPHATEX = {alphatex_json};

    // Player tab (alphaTab + alphaTex embutido)
    {"(function initGp5() {" if alphatex else ""}
    {"const AT_BASE = 'https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.8.3/dist/';" if has_gp5 else ""}
    {"const gp5Status = document.getElementById('gp5Status');" if has_gp5 else ""}
    {"const gp5Time = document.getElementById('gp5Time');" if has_gp5 else ""}
    {"const gp5Play = document.getElementById('gp5Play');" if has_gp5 else ""}
    {"const gp5Pause = document.getElementById('gp5Pause');" if has_gp5 else ""}
    {"const gp5Stop = document.getElementById('gp5Stop');" if has_gp5 else ""}
    {"const viewport = document.getElementById('atViewport');" if has_gp5 else ""}
    {"const main = document.getElementById('atMain');" if has_gp5 else ""}

    {"function fmtMs(ms) {" if has_gp5 else ""}
    {"  const s = (ms / 1000) | 0; const m = (s / 60) | 0; return String(m).padStart(2,'0') + ':' + String(s - m*60).padStart(2,'0');" if has_gp5 else ""}
    {"}" if has_gp5 else ""}

    {"function enableGp5Controls(on) {" if has_gp5 else ""}
    {"  gp5Play.disabled = !on; gp5Pause.disabled = !on; gp5Stop.disabled = !on;" if has_gp5 else ""}
    {"}" if has_gp5 else ""}

    {"if (typeof alphaTab === 'undefined') {" if has_gp5 else ""}
    {"  gp5Status.textContent = 'alphaTab não carregou — verifique internet';" if has_gp5 else ""}
    {"} else if (location.protocol === 'file:') {" if has_gp5 else ""}
    {"  gp5Status.textContent = 'GP5 requer servir.sh (não funciona em file://)';" if has_gp5 else ""}
    {"} else {" if has_gp5 else ""}
    {"  gp5Api = new alphaTab.AlphaTabApi(main, {" if has_gp5 else ""}
    {"    core: { resourceBaseUrl: AT_BASE }," if has_gp5 else ""}
    {"    player: {" if has_gp5 else ""}
    {"      enablePlayer: true," if has_gp5 else ""}
    {"      soundFont: AT_BASE + 'soundfont/sonivox.sf2'," if has_gp5 else ""}
    {"      scrollElement: viewport," if has_gp5 else ""}
    {"    }," if has_gp5 else ""}
    {"    display: { scale: 0.85, layoutMode: alphaTab.LayoutMode.Page }," if has_gp5 else ""}
    {"  });" if has_gp5 else ""}

    {"  gp5Api.error.on((e) => { gp5Status.textContent = 'Erro GP5: ' + (e.message || e); });" if has_gp5 else ""}
    {"  gp5Api.renderStarted.on(() => { gp5Status.textContent = 'A renderizar tab…'; });" if has_gp5 else ""}
    {"  gp5Api.renderFinished.on(() => { gp5Status.textContent = 'Tab pronta — aguarda soundfont'; setTimeout(() => gp5Api.resizeRender?.(), 50); });" if has_gp5 else ""}
    {"  window.addEventListener('resize', () => gp5Api?.resizeRender?.());" if has_gp5 else ""}
    {"  gp5Api.soundFontLoad.on((e) => {" if has_gp5 else ""}
    {"    const pct = e.total ? Math.floor((e.loaded / e.total) * 100) : 0;" if has_gp5 else ""}
    {"    gp5Status.textContent = 'Soundfont ' + pct + '%';" if has_gp5 else ""}
    {"  });" if has_gp5 else ""}
    {"  gp5Api.playerReady.on(() => { enableGp5Controls(true); gp5Status.textContent = 'GP5 pronto'; });" if has_gp5 else ""}
    {"  gp5Api.playerPositionChanged.on((e) => {" if has_gp5 else ""}
    {"    gp5Time.textContent = fmtMs(e.currentTime) + ' / ' + fmtMs(e.endTime);" if has_gp5 else ""}
    {"  });" if has_gp5 else ""}
    {"  gp5Api.playerStateChanged.on((e) => {" if has_gp5 else ""}
    {"    const playing = e.state === alphaTab.synth.PlayerState.Playing;" if has_gp5 else ""}
    {"    gp5Play.disabled = playing; gp5Pause.disabled = !playing;" if has_gp5 else ""}
    {"  });" if has_gp5 else ""}

    {"  gp5Play.onclick = () => { stopMidi(); stemEl.pause(); gp5Api.play(); gp5Status.textContent = 'GP5 a tocar'; };" if has_gp5 else ""}
    {"  gp5Pause.onclick = () => gp5Api.pause();" if has_gp5 else ""}
    {"  gp5Stop.onclick = () => { gp5Api.stop(); gp5Status.textContent = 'GP5 parado'; };" if has_gp5 else ""}

    {"  gp5Api.load(alphaTab.importer.ScoreLoader.loadAlphaTex(ALPHATEX));" if alphatex else ""}
    {"}" if has_gp5 else ""}
    {"})();" if has_gp5 else ""}
  </script>
</body>
</html>
"""


def _esc(text: str) -> str:
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )
