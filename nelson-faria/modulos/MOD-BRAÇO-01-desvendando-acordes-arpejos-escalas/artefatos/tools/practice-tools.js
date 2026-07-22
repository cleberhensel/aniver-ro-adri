/**
 * Practice Tools — Timer + Metronome
 * Componentes reutilizáveis para treinos (escalas, arpejos, etc.)
 *
 * Uso:
 *   <link rel="stylesheet" href="tools/practice-tools.css">
 *   <script src="tools/practice-tools.js"></script>
 *
 *   const timer = new PracticeTools.Timer({ container: '#timer-root', ... });
 *   const metro = new PracticeTools.Metronome({ container: '#metro-root', ... });
 */
(function (global) {
  'use strict';

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function emit(instance, name, detail) {
    instance._handlers[name]?.forEach((fn) => fn(detail));
    instance.container?.dispatchEvent(
      new CustomEvent('practice:' + name, { detail, bubbles: true })
    );
  }

  function formatTime(ms) {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function parseDurationInput(sec) {
    return Math.max(1, Math.min(3600, Number(sec) || 60));
  }

  /** BPM = semínimas/min; cada opção define quantos cliques por semínima. */
  const SUBDIVISIONS = {
    colcheia: { label: 'Colcheia', ticksPerBeat: 2 },
    triplet: { label: 'Quiáltera de colcheia', ticksPerBeat: 3 },
    semicolcheia: { label: 'Semicolcheia', ticksPerBeat: 4 },
    quintina: { label: 'Quintina', ticksPerBeat: 5 },
    sextina: { label: 'Sextina', ticksPerBeat: 6 },
  };

  /* ─── Timer ─── */

  class Timer {
    constructor(options = {}) {
      this.options = {
        mode: 'countdown',
        durationSec: 120,
        autoStart: false,
        presets: [30, 60, 120, 300, 600],
        showProgress: true,
        ...options,
      };
      this.container =
        typeof options.container === 'string'
          ? document.querySelector(options.container)
          : options.container;
      this._handlers = {};
      this._raf = null;
      this._state = 'idle';
      this._mode = this.options.mode;
      this._durationMs = this.options.durationSec * 1000;
      this._elapsedMs = 0;
      this._startedAt = 0;
      this._pausedAt = 0;

      if (this.container) this._render();
      if (this.options.autoStart) this.start();
    }

    on(event, fn) {
      (this._handlers[event] ||= []).push(fn);
      return this;
    }

    off(event, fn) {
      if (!this._handlers[event]) return this;
      if (fn) this._handlers[event] = this._handlers[event].filter((f) => f !== fn);
      else delete this._handlers[event];
      return this;
    }

    get state() {
      return this._state;
    }
    get mode() {
      return this._mode;
    }
    get remainingMs() {
      if (this._mode === 'countdown') return Math.max(0, this._durationMs - this._elapsedMs);
      return this._elapsedMs;
    }
    get elapsedMs() {
      return this._elapsedMs;
    }
    get progress() {
      if (this._mode === 'stopwatch') return 0;
      return this._durationMs ? Math.min(1, this._elapsedMs / this._durationMs) : 0;
    }

    setMode(mode) {
      if (this._state !== 'idle') return;
      this._mode = mode;
      this._elapsedMs = 0;
      this._updateDisplay();
      this._syncModeUI();
    }

    setDuration(sec) {
      if (this._state !== 'idle') return;
      this._durationMs = parseDurationInput(sec) * 1000;
      this._updateDisplay();
      if (this._els?.durationInput) this._els.durationInput.value = Math.round(this._durationMs / 1000);
    }

    start() {
      if (this._state === 'running') return;
      if (this._state === 'paused') {
        this._state = 'running';
        this._startedAt = performance.now() - this._elapsedMs;
        this._tick();
        emit(this, 'resume', this._snapshot());
        this._syncButtons();
        return;
      }
      this._state = 'running';
      this._elapsedMs = 0;
      this._startedAt = performance.now();
      this._tick();
      emit(this, 'start', this._snapshot());
      this._syncButtons();
    }

    pause() {
      if (this._state !== 'running') return;
      this._state = 'paused';
      this._elapsedMs = performance.now() - this._startedAt;
      cancelAnimationFrame(this._raf);
      emit(this, 'pause', this._snapshot());
      this._syncButtons();
    }

    reset() {
      cancelAnimationFrame(this._raf);
      this._state = 'idle';
      this._elapsedMs = 0;
      emit(this, 'reset', this._snapshot());
      this._updateDisplay();
      this._syncButtons();
    }

    _snapshot() {
      return {
        state: this._state,
        mode: this._mode,
        elapsedMs: this._elapsedMs,
        remainingMs: this.remainingMs,
        progress: this.progress,
      };
    }

    _tick() {
      this._elapsedMs = performance.now() - this._startedAt;

      if (this._mode === 'countdown' && this._elapsedMs >= this._durationMs) {
        this._elapsedMs = this._durationMs;
        this._state = 'idle';
        this._updateDisplay(true);
        this._syncButtons();
        emit(this, 'complete', this._snapshot());
        emit(this, 'tick', this._snapshot());
        return;
      }

      this._updateDisplay();
      emit(this, 'tick', this._snapshot());
      this._raf = requestAnimationFrame(() => this._tick());
    }

    _render() {
      const c = this.container;
      c.classList.add('pt-root');
      c.innerHTML = `
        <div class="pt-panel pt-timer-panel">
          <h3>Timer</h3>
          <div class="pt-timer-display">
            <div class="pt-timer-time" data-el="time">00:00</div>
            <div class="pt-timer-meta" data-el="meta">Contagem regressiva</div>
            <div class="pt-timer-progress" data-el="progress-wrap">
              <div class="pt-timer-progress-fill" data-el="progress"></div>
            </div>
          </div>
          <div class="pt-chip-row" data-el="mode-row">
            <button type="button" class="pt-chip" data-mode="countdown">Regressivo</button>
            <button type="button" class="pt-chip" data-mode="stopwatch">Cronômetro</button>
          </div>
          <div class="pt-chip-row" data-el="presets"></div>
          <div class="pt-controls" style="margin-top:0.65rem">
            <div class="pt-control" data-el="duration-wrap">
              <label>Duração (seg)</label>
              <input type="number" data-el="duration" min="1" max="3600" value="${Math.round(this._durationMs / 1000)}">
            </div>
          </div>
          <div class="pt-btn-row">
            <button type="button" class="pt-btn pt-btn-primary" data-el="btn-start">Iniciar</button>
            <button type="button" class="pt-btn" data-el="btn-pause" disabled>Pausar</button>
            <button type="button" class="pt-btn pt-btn-danger" data-el="btn-reset">Zerar</button>
          </div>
        </div>`;

      this._els = {
        time: $('[data-el="time"]', c),
        meta: $('[data-el="meta"]', c),
        progress: $('[data-el="progress"]', c),
        progressWrap: $('[data-el="progress-wrap"]', c),
        durationWrap: $('[data-el="duration-wrap"]', c),
        durationInput: $('[data-el="duration"]', c),
        presets: $('[data-el="presets"]', c),
        btnStart: $('[data-el="btn-start"]', c),
        btnPause: $('[data-el="btn-pause"]', c),
        btnReset: $('[data-el="btn-reset"]', c),
      };

      this._els.presets.innerHTML = this.options.presets
        .map((s) => `<button type="button" class="pt-chip" data-preset="${s}">${s < 60 ? s + 's' : s / 60 + ' min'}</button>`)
        .join('');

      c.querySelectorAll('[data-mode]').forEach((btn) => {
        btn.addEventListener('click', () => this.setMode(btn.dataset.mode));
      });
      c.querySelectorAll('[data-preset]').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (this._state !== 'idle') return;
          this.setDuration(Number(btn.dataset.preset));
          c.querySelectorAll('[data-preset]').forEach((b) => b.classList.toggle('active', b === btn));
        });
      });
      this._els.durationInput.addEventListener('change', () => this.setDuration(this._els.durationInput.value));
      this._els.btnStart.addEventListener('click', () => this.start());
      this._els.btnPause.addEventListener('click', () => this.pause());
      this._els.btnReset.addEventListener('click', () => this.reset());

      this._syncModeUI();
      this._updateDisplay();
    }

    _syncModeUI() {
      if (!this._els) return;
      this.container.querySelectorAll('[data-mode]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.mode === this._mode);
      });
      const isCountdown = this._mode === 'countdown';
      this._els.durationWrap.style.display = isCountdown ? '' : 'none';
      this._els.progressWrap.style.display = isCountdown && this.options.showProgress ? '' : 'none';
      this._els.meta.textContent = isCountdown ? 'Contagem regressiva' : 'Cronômetro';
    }

    _syncButtons() {
      if (!this._els) return;
      const running = this._state === 'running';
      const paused = this._state === 'paused';
      this._els.btnStart.disabled = running;
      this._els.btnPause.disabled = !running;
      this._els.btnStart.textContent = paused ? 'Retomar' : 'Iniciar';
    }

    _updateDisplay(complete) {
      if (!this._els) return;
      const ms = this._mode === 'countdown' ? this.remainingMs : this._elapsedMs;
      this._els.time.textContent = formatTime(ms);
      this._els.time.classList.toggle('warning', this._mode === 'countdown' && ms <= 10000 && ms > 0 && !complete);
      this._els.time.classList.toggle('done', !!complete);
      if (this._mode === 'countdown') {
        this._els.progress.style.width = (this.progress * 100).toFixed(1) + '%';
      }
    }

    destroy() {
      cancelAnimationFrame(this._raf);
      if (this.container) this.container.innerHTML = '';
    }
  }

  /* ─── Metronome ─── */

  class Metronome {
    constructor(options = {}) {
      this.options = {
        bpm: 80,
        beatsPerBar: 4,
        subdivision: 'colcheia',
        volume: 0.8,
        accentVolume: 1,
        ...options,
      };
      this.container =
        typeof options.container === 'string'
          ? document.querySelector(options.container)
          : options.container;
      this._handlers = {};
      this._ctx = null;
      this._running = false;
      this._bpm = this.options.bpm;
      this._beatsPerBar = this.options.beatsPerBar;
      this._subdivisionId = SUBDIVISIONS[this.options.subdivision]
        ? this.options.subdivision
        : 'colcheia';
      this._volume = this.options.volume;
      this._accentVolume = this.options.accentVolume;
      this._currentTick = 0;
      this._nextNoteTime = 0;
      this._schedulerId = null;
      this._lookahead = 25;
      this._scheduleAhead = 0.1;

      if (this.container) this._render();
    }

    on(event, fn) {
      (this._handlers[event] ||= []).push(fn);
      return this;
    }

    off(event, fn) {
      if (!this._handlers[event]) return this;
      if (fn) this._handlers[event] = this._handlers[event].filter((f) => f !== fn);
      else delete this._handlers[event];
      return this;
    }

    get running() {
      return this._running;
    }
    get bpm() {
      return this._bpm;
    }
    get beat() {
      const tpb = this._ticksPerBeat();
      const tickInBar = this._currentTick % (this._beatsPerBar * tpb);
      return Math.floor(tickInBar / tpb) + 1;
    }

    get subdivision() {
      return this._subdivisionId;
    }

    _ticksPerBeat() {
      return SUBDIVISIONS[this._subdivisionId]?.ticksPerBeat || 2;
    }

    setBpm(bpm) {
      this._bpm = Math.max(30, Math.min(300, Number(bpm) || 80));
      if (this._els?.bpmSlider) this._els.bpmSlider.value = this._bpm;
      if (this._els?.bpmInput) this._els.bpmInput.value = this._bpm;
      this._updateBpmDisplay();
    }

    setBeatsPerBar(n) {
      this._beatsPerBar = Math.max(1, Math.min(12, Number(n) || 4));
      this._renderBeatDots();
    }

    setSubdivision(id) {
      if (SUBDIVISIONS[id]) {
        this._subdivisionId = id;
      } else {
        const legacy = { 2: 'colcheia', 3: 'triplet', 4: 'semicolcheia', 5: 'quintina', 6: 'sextina' };
        this._subdivisionId = legacy[Number(id)] || 'colcheia';
      }
      if (this._els?.subdivision) this._els.subdivision.value = this._subdivisionId;
      this._updateSubdivisionLabel();
    }

    setVolume(v) {
      this._volume = Math.max(0, Math.min(1, Number(v)));
    }

    async _ensureContext() {
      if (!this._ctx) {
        this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this._ctx.state === 'suspended') await this._ctx.resume();
      return this._ctx;
    }

    _click(time, level) {
      const ctx = this._ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const freqs = { accent: 1200, beat: 880, sub: 620 };
      const vols = {
        accent: this._accentVolume,
        beat: this._volume,
        sub: this._volume * 0.5,
      };
      osc.frequency.value = freqs[level] || freqs.beat;
      const vol = vols[level] ?? this._volume;
      gain.gain.setValueAtTime(vol * 0.001, time);
      gain.gain.exponentialRampToValueAtTime(vol * 0.3, time + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      osc.start(time);
      osc.stop(time + 0.06);
    }

    _scheduler() {
      const ctx = this._ctx;
      const tpb = this._ticksPerBeat();
      const ticksInBar = this._beatsPerBar * tpb;

      while (this._nextNoteTime < ctx.currentTime + this._scheduleAhead) {
        const tickInBar = this._currentTick % ticksInBar;
        const quarterBeat = Math.floor(tickInBar / tpb) + 1;
        const tickInBeat = tickInBar % tpb;

        let level = 'sub';
        if (tickInBeat === 0) level = quarterBeat === 1 ? 'accent' : 'beat';
        this._click(this._nextNoteTime, level);

        const scheduledBeat = quarterBeat;
        const scheduledTickInBeat = tickInBeat;
        const scheduledAccent = level === 'accent';
        const scheduledTime = this._nextNoteTime;
        const delayMs = Math.max(0, (scheduledTime - ctx.currentTime) * 1000);
        setTimeout(() => {
          if (!this._running) return;
          if (scheduledTickInBeat === 0) this._flashBeat(scheduledBeat, scheduledAccent);
          emit(this, 'beat', {
            beat: scheduledBeat,
            tickInBeat: scheduledTickInBeat,
            ticksPerBeat: tpb,
            accent: scheduledAccent,
            subdivision: this._subdivisionId,
            bpm: this._bpm,
          });
        }, delayMs);

        this._nextNoteTime += 60 / this._bpm / tpb;
        this._currentTick++;
      }
    }

    async start() {
      await this._ensureContext();
      if (this._running) return;
      this._running = true;
      this._currentTick = 0;
      this._nextNoteTime = this._ctx.currentTime + 0.05;
      this._schedulerId = setInterval(() => this._scheduler(), this._lookahead);
      emit(this, 'start', { bpm: this._bpm });
      this._syncButtons();
      this._syncStatus(true);
    }

    stop() {
      if (!this._running) return;
      this._running = false;
      clearInterval(this._schedulerId);
      this._schedulerId = null;
      this._clearBeatFlash();
      emit(this, 'stop', { bpm: this._bpm });
      this._syncButtons();
      this._syncStatus(false);
    }

    toggle() {
      return this._running ? this.stop() : this.start();
    }

    tapTempo() {
      const now = performance.now();
      this._tapTimes = (this._tapTimes || []).filter((t) => now - t < 2000);
      this._tapTimes.push(now);
      if (this._tapTimes.length >= 2) {
        const intervals = [];
        for (let i = 1; i < this._tapTimes.length; i++) {
          intervals.push(this._tapTimes[i] - this._tapTimes[i - 1]);
        }
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        this.setBpm(Math.round(60000 / avg));
        emit(this, 'tap', { bpm: this._bpm });
      }
    }

    _render() {
      const c = this.container;
      c.classList.add('pt-root');
      c.innerHTML = `
        <div class="pt-panel pt-metro-panel">
          <h3>Metrônomo</h3>
          <div class="pt-bpm-label">BPM</div>
          <div class="pt-bpm-display" data-el="bpm-display">${this._bpm}</div>
          <div class="pt-beat-viz" data-el="beat-viz"></div>
          <div class="pt-controls">
            <div class="pt-control">
              <label>BPM</label>
              <input type="range" data-el="bpm-slider" min="30" max="240" value="${this._bpm}">
              <div class="pt-range-val"><span data-el="bpm-val">${this._bpm}</span> BPM</div>
            </div>
            <div class="pt-control" style="flex:0 0 5rem">
              <label>&nbsp;</label>
              <input type="number" data-el="bpm-input" min="30" max="300" value="${this._bpm}">
            </div>
          </div>
          <div class="pt-controls" style="margin-top:0.5rem">
            <div class="pt-control">
              <label>Compasso</label>
              <select data-el="time-sig">
                <option value="2">2/4</option>
                <option value="3">3/4</option>
                <option value="4" selected>4/4</option>
                <option value="5">5/4</option>
                <option value="6">6/8 (2 grupos)</option>
              </select>
            </div>
            <div class="pt-control">
              <label>Subdivisão</label>
              <select data-el="subdivision">
                <option value="colcheia">Colcheia</option>
                <option value="triplet">Quiáltera de colcheia</option>
                <option value="semicolcheia">Semicolcheia</option>
                <option value="quintina">Quintina</option>
                <option value="sextina">Sextina</option>
              </select>
            </div>
            <div class="pt-control">
              <label>Volume</label>
              <input type="range" data-el="volume" min="0" max="100" value="${Math.round(this._volume * 100)}">
            </div>
          </div>
          <div class="pt-btn-row">
            <button type="button" class="pt-btn pt-btn-primary" data-el="btn-toggle">Iniciar</button>
            <button type="button" class="pt-btn pt-btn-accent" data-el="btn-tap">Tap tempo</button>
          </div>
          <div class="pt-status">
            <span><i class="pt-status-dot" data-el="status-dot"></i><span data-el="status-text">Parado</span></span>
            <span>Compasso: <strong data-el="sig-label">4/4</strong></span>
            <span>Subdivisão: <strong data-el="sub-label">Colcheia</strong></span>
          </div>
        </div>`;

      this._els = {
        bpmDisplay: $('[data-el="bpm-display"]', c),
        bpmSlider: $('[data-el="bpm-slider"]', c),
        bpmInput: $('[data-el="bpm-input"]', c),
        bpmVal: $('[data-el="bpm-val"]', c),
        beatViz: $('[data-el="beat-viz"]', c),
        timeSig: $('[data-el="time-sig"]', c),
        subdivision: $('[data-el="subdivision"]', c),
        volume: $('[data-el="volume"]', c),
        btnToggle: $('[data-el="btn-toggle"]', c),
        btnTap: $('[data-el="btn-tap"]', c),
        statusDot: $('[data-el="status-dot"]', c),
        statusText: $('[data-el="status-text"]', c),
        sigLabel: $('[data-el="sig-label"]', c),
        subLabel: $('[data-el="sub-label"]', c),
      };

      this._els.subdivision.value = this._subdivisionId;
      this._updateSubdivisionLabel();

      this._els.bpmSlider.addEventListener('input', () => this.setBpm(this._els.bpmSlider.value));
      this._els.bpmInput.addEventListener('change', () => this.setBpm(this._els.bpmInput.value));
      this._els.timeSig.addEventListener('change', () => {
        const v = Number(this._els.timeSig.value);
        this.setBeatsPerBar(v === 6 ? 2 : v);
        this._els.sigLabel.textContent = v === 6 ? '6/8' : v + '/4';
      });
      this._els.subdivision.addEventListener('change', () => this.setSubdivision(this._els.subdivision.value));
      this._els.volume.addEventListener('input', () => this.setVolume(this._els.volume.value / 100));
      this._els.btnToggle.addEventListener('click', () => this.toggle());
      this._els.btnTap.addEventListener('click', () => this.tapTempo());

      this._renderBeatDots();
    }

    _renderBeatDots() {
      if (!this._els?.beatViz) return;
      this._els.beatViz.innerHTML = '';
      for (let i = 1; i <= this._beatsPerBar; i++) {
        const dot = document.createElement('span');
        dot.className = 'pt-beat-dot' + (i === 1 ? ' accent' : '');
        dot.dataset.beat = i;
        this._els.beatViz.appendChild(dot);
      }
    }

    _flashBeat(beat, accent) {
      if (!this._els?.beatViz) return;
      this._els.beatViz.querySelectorAll('.pt-beat-dot').forEach((d) => d.classList.remove('active'));
      const dot = this._els.beatViz.querySelector(`[data-beat="${beat}"]`);
      if (dot) dot.classList.add('active');
    }

    _clearBeatFlash() {
      this._els?.beatViz?.querySelectorAll('.pt-beat-dot').forEach((d) => d.classList.remove('active'));
    }

    _updateBpmDisplay() {
      if (!this._els) return;
      this._els.bpmDisplay.textContent = this._bpm;
      this._els.bpmVal.textContent = this._bpm;
    }

    _updateSubdivisionLabel() {
      if (!this._els?.subLabel) return;
      this._els.subLabel.textContent = SUBDIVISIONS[this._subdivisionId]?.label || 'Colcheia';
    }

    _syncButtons() {
      if (!this._els) return;
      this._els.btnToggle.textContent = this._running ? 'Parar' : 'Iniciar';
      this._els.btnToggle.classList.toggle('pt-btn-danger', this._running);
      this._els.btnToggle.classList.toggle('pt-btn-primary', !this._running);
    }

    _syncStatus(live) {
      if (!this._els) return;
      this._els.statusDot.classList.toggle('live', live);
      this._els.statusText.textContent = live ? 'Tocando' : 'Parado';
    }

    destroy() {
      this.stop();
      if (this._ctx) {
        this._ctx.close();
        this._ctx = null;
      }
      if (this.container) this.container.innerHTML = '';
    }
  }

  /* ─── Session helper (liga timer + metrônomo em rounds) ─── */

  class Session {
    constructor({ timer, metronome, workSec = 120, restSec = 15, rounds = 4, linkMetronome = true } = {}) {
      this.timer = timer;
      this.metronome = metronome;
      this.workSec = workSec;
      this.restSec = restSec;
      this.rounds = Math.max(1, rounds);
      this.linkMetronome = linkMetronome;
      this.currentRound = 0;
      this.phase = 'idle';
      this._handlers = {};
      this._onTimerComplete = this._handleTimerComplete.bind(this);

      this.timer?.on('complete', this._onTimerComplete);
    }

    on(event, fn) {
      (this._handlers[event] ||= []).push(fn);
      return this;
    }

    configure({ workSec, restSec, rounds, bpm } = {}) {
      if (workSec != null) this.workSec = Math.max(1, workSec);
      if (restSec != null) this.restSec = Math.max(0, restSec);
      if (rounds != null) this.rounds = Math.max(1, rounds);
      if (bpm != null) this.metronome?.setBpm(bpm);
    }

    start() {
      this.currentRound = 1;
      this._beginWork();
    }

    stop() {
      this.phase = 'idle';
      this.currentRound = 0;
      this.timer?.reset();
      this.metronome?.stop();
      emit(this, 'stop', this._snap());
    }

    _beginWork() {
      this.phase = 'work';
      emit(this, 'roundStart', this._snap());
      this.timer?.setDuration(this.workSec);
      this.timer?.reset();
      this.timer?.start();
      if (this.linkMetronome) this.metronome?.start();
    }

    _beginRest() {
      this.phase = 'rest';
      this.metronome?.stop();
      emit(this, 'restStart', this._snap());
      if (this.restSec <= 0) {
        this._advanceRound();
        return;
      }
      this.timer?.setDuration(this.restSec);
      this.timer?.reset();
      this.timer?.start();
    }

    _advanceRound() {
      if (this.currentRound >= this.rounds) {
        this.phase = 'done';
        this.metronome?.stop();
        emit(this, 'complete', this._snap());
        return;
      }
      this.currentRound++;
      this._beginWork();
    }

    _handleTimerComplete() {
      if (this.phase === 'work') {
        this.metronome?.stop();
        if (this.currentRound >= this.rounds) {
          this.phase = 'done';
          emit(this, 'complete', this._snap());
          return;
        }
        this._beginRest();
      } else if (this.phase === 'rest') {
        this._advanceRound();
      }
    }

    _snap() {
      return {
        phase: this.phase,
        round: this.currentRound,
        totalRounds: this.rounds,
        workSec: this.workSec,
        restSec: this.restSec,
      };
    }

    destroy() {
      this.stop();
      this.timer?.off('complete', this._onTimerComplete);
    }
  }

  global.PracticeTools = { Timer, Metronome, Session, SUBDIVISIONS, formatTime };
})(typeof window !== 'undefined' ? window : globalThis);
