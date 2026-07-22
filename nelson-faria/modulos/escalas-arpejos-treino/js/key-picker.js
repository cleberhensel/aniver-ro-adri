(function (global) {
  'use strict';

  function KeyPicker(options = {}) {
    this.container = typeof options.container === 'string'
      ? document.querySelector(options.container)
      : options.container;
    this.tonicEl = typeof options.tonicDisplay === 'string'
      ? document.querySelector(options.tonicDisplay)
      : options.tonicDisplay;
    this.pc = options.pc ?? 0;
    this.quality = options.quality || 'maior';
    this._handlers = {};
    this._build();
  }

  KeyPicker.prototype.on = function (event, fn) {
    (this._handlers[event] ||= []).push(fn);
    return this;
  };

  KeyPicker.prototype._emit = function (event, data) {
    (this._handlers[event] || []).forEach((fn) => fn(data));
  };

  KeyPicker.prototype.setQuality = function (quality) {
    this.quality = quality || 'maior';
    this._syncTonic();
  };

  KeyPicker.prototype.setPc = function (pc) {
    this.pc = ((pc % 12) + 12) % 12;
    this._syncGrid();
    this._syncTonic();
    const names = global.EatData?.tuning?.NOTE_NAMES || [];
    this._emit('change', { pc: this.pc, name: names[this.pc] });
  };

  KeyPicker.prototype.getPc = function () {
    return this.pc;
  };

  KeyPicker.prototype._build = function () {
    if (!this.container) return;
    const names = global.EatData?.tuning?.NOTE_NAMES || [];
    this.container.innerHTML = '';
    this.container.setAttribute('role', 'group');
    this.container.setAttribute('aria-label', 'Tonalidade');
    names.forEach((name, pc) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'key-btn' + (pc === this.pc ? ' active' : '');
      btn.textContent = name;
      btn.dataset.pc = String(pc);
      btn.addEventListener('click', () => this.setPc(pc));
      this.container.appendChild(btn);
    });
    this._syncTonic();
  };

  KeyPicker.prototype._syncGrid = function () {
    if (!this.container) return;
    this.container.querySelectorAll('.key-btn').forEach((b) => {
      b.classList.toggle('active', +b.dataset.pc === this.pc);
    });
  };

  KeyPicker.prototype._syncTonic = function () {
    if (!this.tonicEl) return;
    const names = global.EatData?.tuning?.NOTE_NAMES || [];
    this.tonicEl.innerHTML = `${names[this.pc]}<small>${this.quality}</small>`;
  };

  global.Eat = global.Eat || {};
  global.Eat.KeyPicker = KeyPicker;
})(typeof window !== 'undefined' ? window : globalThis);
