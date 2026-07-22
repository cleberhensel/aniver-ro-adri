(function (global) {
  'use strict';

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function DrillSession(options = {}) {
    this.ring = options.ring || [];
    this.mode = options.mode || 'bag';
    this.seconds = options.seconds ?? 30;
    this.preview = options.preview ?? 1;
    this.running = false;
    this.current = null;
    this.history = [];
    this.bag = [];
    this.queue = [];
    this.round = 0;
    this.timerId = null;
    this.endsAt = 0;
    this.remainingSec = 0;
    this._lastGhostOp = 0;
    this._handlers = {};
  }

  DrillSession.prototype.on = function (event, fn) {
    (this._handlers[event] ||= []).push(fn);
    return this;
  };

  DrillSession.prototype._emit = function (event, data) {
    (this._handlers[event] || []).forEach((fn) => fn(data));
  };

  DrillSession.prototype.setRing = function (ring) {
    this.ring = ring || [];
  };

  DrillSession.prototype.setMode = function (mode) {
    this.mode = mode;
  };

  DrillSession.prototype.setSeconds = function (sec) {
    this.seconds = Number(sec) || 0;
  };

  DrillSession.prototype.setPreview = function (n) {
    this.preview = Math.max(0, Number(n) || 0);
  };

  DrillSession.prototype.ghostOpacity = function () {
    if (!this.running || !this.seconds || this.remainingSec <= 0) return 0;
    const softAt = Math.max(8, Math.ceil(this.seconds * 0.3));
    if (this.remainingSec > softAt) return 0;
    const t = 1 - this.remainingSec / softAt;
    return 0.14 + t * 0.55;
  };

  DrillSession.prototype.urgencyLevel = function () {
    if (!this.running || !this.seconds || this.remainingSec <= 0) return null;
    const softAt = Math.max(8, Math.ceil(this.seconds * 0.3));
    if (this.remainingSec <= 5) return 'hard';
    if (this.remainingSec <= softAt) return 'soft';
    return null;
  };

  DrillSession.prototype.refillBag = function (avoid) {
    let next = shuffle(this.ring);
    if (avoid && next[0] === avoid && next.length > 1) {
      const swap = 1 + Math.floor(Math.random() * (next.length - 1));
      [next[0], next[swap]] = [next[swap], next[0]];
    }
    this.bag = next;
  };

  DrillSession.prototype.pickNext = function (from) {
    if (this.mode === 'bag') {
      if (!this.bag.length) this.refillBag(from);
      return this.bag.shift();
    }
    if (this.mode === 'neighbor') {
      if (!from) return this.ring[Math.floor(Math.random() * this.ring.length)];
      const i = this.ring.indexOf(from);
      const opts = [
        this.ring[(i + 1) % this.ring.length],
        this.ring[(i - 1 + this.ring.length) % this.ring.length]
      ];
      return opts[Math.floor(Math.random() * opts.length)];
    }
    const pool = this.ring.filter((s) => s !== from);
    return pool[Math.floor(Math.random() * pool.length)];
  };

  DrillSession.prototype.buildPreviewQueue = function () {
    const need = Math.max(3, this.preview + 2);
    while (this.queue.length < need) {
      const from = this.queue.length ? this.queue[this.queue.length - 1] : this.current;
      this.queue.push(this.pickNext(from));
    }
  };

  DrillSession.prototype.start = function () {
    this.running = true;
    this.history = [];
    this.round = 0;
    this.bag = [];
    this.queue = [];
    this.current = null;
    this.advance();
  };

  DrillSession.prototype.stop = function () {
    this.running = false;
    this.clearTimer();
    this.current = null;
    this.queue = [];
    this._emit('tick', { urgency: null, ghostOp: 0, remainingSec: 0, running: false });
  };

  DrillSession.prototype.next = function () {
    if (!this.running) return;
    this.advance(true);
  };

  DrillSession.prototype.advance = function (manual) {
    if (!this.queue.length) this.buildPreviewQueue();
    const id = this.queue.shift();
    this.current = id;
    this.history.push(id);
    this.round++;
    this.buildPreviewQueue();
    this.startCountdown();
    this._emit('advance', { current: id, queue: this.queue.slice(), round: this.round, manual: !!manual });
    this._tick();
  };

  DrillSession.prototype.clearTimer = function () {
    clearInterval(this.timerId);
    this.timerId = null;
  };

  DrillSession.prototype.startCountdown = function () {
    this.clearTimer();
    if (!this.seconds) {
      this.remainingSec = 0;
      this.endsAt = 0;
      return;
    }
    this.remainingSec = this.seconds;
    this.endsAt = performance.now() + this.seconds * 1000;
    this.timerId = setInterval(() => {
      const left = Math.max(0, Math.ceil((this.endsAt - performance.now()) / 1000));
      this.remainingSec = left;
      this._tick();
      if (left <= 0) {
        this.clearTimer();
        this.advance();
      }
    }, 200);
  };

  DrillSession.prototype._tick = function () {
    const ghostOp = this.ghostOpacity();
    this._emit('tick', {
      urgency: this.urgencyLevel(),
      ghostOp,
      remainingSec: this.remainingSec,
      running: this.running,
      current: this.current,
      queue: this.queue.slice()
    });
    this._lastGhostOp = ghostOp;
  };

  global.Eat = global.Eat || {};
  global.Eat.DrillSession = DrillSession;
})(typeof window !== 'undefined' ? window : globalThis);
