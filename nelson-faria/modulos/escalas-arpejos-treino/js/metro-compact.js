(function (global) {
  'use strict';

  function MetroCompact(options = {}) {
    this.pulseEl = typeof options.pulse === 'string' ? document.querySelector(options.pulse) : options.pulse;
    this.beatsEl = typeof options.beats === 'string' ? document.querySelector(options.beats) : options.beats;
    this.timerEl = typeof options.timer === 'string' ? document.querySelector(options.timer) : options.timer;
    this.volumeSlider = typeof options.volumeSlider === 'string' ? document.querySelector(options.volumeSlider) : options.volumeSlider;
    this.volumePct = typeof options.volumePct === 'string' ? document.querySelector(options.volumePct) : options.volumePct;
    this.muteBtn = typeof options.muteBtn === 'string' ? document.querySelector(options.muteBtn) : options.muteBtn;
    this.storageKey = options.storageKey || 'eat-drill-volume';
    this.bpm = options.bpm ?? 80;
    this.beatsPerBar = options.beatsPerBar ?? 4;
    this.volume = 0.7;
    this.lastVolume = 0.7;
    this._handlers = {};
    this._metro = null;
    this._boundTick = this._onTick.bind(this);
    this._loadVolume();
    this._wireVolume();
    this._renderBeats();
  }

  MetroCompact.prototype.on = function (event, fn) {
    (this._handlers[event] ||= []).push(fn);
    return this;
  };

  MetroCompact.prototype._emit = function (event, data) {
    (this._handlers[event] || []).forEach((fn) => fn(data));
  };

  MetroCompact.prototype._loadVolume = function () {
    try {
      const v = localStorage.getItem(this.storageKey);
      if (v != null) this.volume = Math.max(0, Math.min(1, Number(v) / 100));
    } catch (_) { /* ignore */ }
    if (this.volume > 0.001) this.lastVolume = this.volume;
    this.syncVolumeUI();
  };

  MetroCompact.prototype._wireVolume = function () {
    if (this.volumeSlider) {
      this.volumeSlider.addEventListener('input', () => this.setVolume(this.volumeSlider.value));
    }
    if (this.muteBtn) {
      this.muteBtn.addEventListener('click', () => {
        if (this.volume <= 0.001) this.setVolume(Math.round(this.lastVolume * 100));
        else {
          if (this.volume > 0.001) this.lastVolume = this.volume;
          this.setVolume(0);
        }
      });
    }
  };

  MetroCompact.prototype.setVolume = function (pct) {
    const v = Math.max(0, Math.min(100, Number(pct) || 0)) / 100;
    this.volume = v;
    if (v > 0.001) this.lastVolume = v;
    if (this._metro) this._metro.setVolume(v);
    try {
      localStorage.setItem(this.storageKey, String(Math.round(v * 100)));
    } catch (_) { /* ignore */ }
    this.syncVolumeUI();
    this._emit('volumeChange', { volume: v });
  };

  MetroCompact.prototype.syncVolumeUI = function () {
    const muted = this.volume <= 0.001;
    const pctVal = Math.round(this.volume * 100);
    if (this.volumeSlider) {
      this.volumeSlider.value = String(pctVal);
      this.volumeSlider.parentElement?.style.setProperty('--vol-pct', pctVal + '%');
    }
    if (this.volumePct) this.volumePct.textContent = String(pctVal);
    if (this.muteBtn) {
      this.muteBtn.classList.toggle('muted', muted);
      this.muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
      const icoSound = this.muteBtn.querySelector('.ico-sound');
      const icoMute = this.muteBtn.querySelector('.ico-mute');
      if (icoSound) icoSound.hidden = muted;
      if (icoMute) icoMute.hidden = !muted;
    }
  };

  MetroCompact.prototype._renderBeats = function () {
    if (!this.beatsEl) return;
    this.beatsEl.innerHTML = '';
    for (let i = 1; i <= this.beatsPerBar; i++) {
      const dot = document.createElement('span');
      dot.className = 'drill-beat';
      dot.dataset.beat = String(i);
      this.beatsEl.appendChild(dot);
    }
  };

  MetroCompact.prototype._ensureMetro = function () {
    if (!this._metro && global.PracticeTools?.Metronome) {
      this._metro = new global.PracticeTools.Metronome({
        bpm: this.bpm,
        beatsPerBar: this.beatsPerBar,
        volume: this.volume
      });
      this._metro.on('beat', this._boundTick);
    }
    return this._metro;
  };

  MetroCompact.prototype._onTick = function (data) {
    const beat = data?.beat ?? this._metro?.beat ?? 1;
    const accent = beat === 1;
    if (this.pulseEl) {
      this.pulseEl.classList.add('on');
      this.pulseEl.classList.toggle('accent', accent);
      clearTimeout(this._flashT);
      this._flashT = setTimeout(() => this.pulseEl?.classList.remove('on', 'accent'), 90);
    }
    if (this.beatsEl) {
      this.beatsEl.querySelectorAll('.drill-beat').forEach((dot) => {
        const on = Number(dot.dataset.beat) === beat;
        dot.classList.toggle('active', on);
        dot.classList.toggle('accent', on && accent);
      });
    }
  };

  MetroCompact.prototype.setBpm = function (bpm) {
    this.bpm = Math.max(30, Number(bpm) || 80);
    this._metro?.setBpm(this.bpm);
  };

  MetroCompact.prototype.start = function () {
    const m = this._ensureMetro();
    if (!m) return;
    m.setBpm(this.bpm);
    m.setBeatsPerBar(this.beatsPerBar);
    m.setVolume(this.volume);
    m.start();
  };

  MetroCompact.prototype.stop = function () {
    this._metro?.stop();
    this.pulseEl?.classList.remove('on', 'accent');
    this.beatsEl?.querySelectorAll('.drill-beat').forEach((d) => {
      d.classList.remove('active', 'accent');
    });
  };

  MetroCompact.prototype.updateTimer = function (remainingSec, running, hasLimit) {
    if (!this.timerEl) return;
    if (!running) {
      this.timerEl.textContent = '—';
      this.timerEl.classList.remove('warn');
      return;
    }
    if (!hasLimit) {
      this.timerEl.textContent = '∞';
      this.timerEl.classList.remove('warn');
      return;
    }
    this.timerEl.textContent = String(remainingSec);
    this.timerEl.classList.toggle('warn', remainingSec <= 5 && remainingSec > 0);
  };

  global.Eat = global.Eat || {};
  global.Eat.MetroCompact = MetroCompact;
})(typeof window !== 'undefined' ? window : globalThis);
