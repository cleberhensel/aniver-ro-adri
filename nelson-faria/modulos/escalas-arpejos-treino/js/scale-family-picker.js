(function (global) {
  'use strict';

  function ScaleFamilyPicker(options = {}) {
    this.select = typeof options.select === 'string'
      ? document.querySelector(options.select)
      : options.select;
    this.familyId = options.familyId || 'major';
    this._handlers = {};
    this._build();
  }

  ScaleFamilyPicker.prototype.on = function (event, fn) {
    (this._handlers[event] ||= []).push(fn);
    return this;
  };

  ScaleFamilyPicker.prototype._emit = function (event, data) {
    (this._handlers[event] || []).forEach((fn) => fn(data));
  };

  ScaleFamilyPicker.prototype._build = function () {
    if (!this.select) return;
    const families = global.EatCatalog?.listFamilies() || [];
    const groups = { ready: [], partial: [], planned: [] };
    families.forEach((f) => {
      if (groups[f.status]) groups[f.status].push(f);
    });
    let html = '';
    ['ready', 'partial', 'planned'].forEach((status) => {
      const list = groups[status];
      if (!list.length) return;
      const label = status === 'ready' ? 'Prontas' : status === 'partial' ? 'Parciais' : 'Planejadas';
      html += `<optgroup label="${label}">`;
      list.forEach((f) => {
        const disabled = f.status === 'planned' ? ' disabled' : '';
        html += `<option value="${f.id}"${disabled}${f.id === this.familyId ? ' selected' : ''}>${f.label}</option>`;
      });
      html += '</optgroup>';
    });
    this.select.innerHTML = html;
    this.select.addEventListener('change', () => {
      const id = this.select.value;
      const fam = global.EatCatalog.getFamily(id);
      if (!fam || fam.status === 'planned') return;
      this.familyId = id;
      this._emit('change', { id, intervals: fam.intervals, family: fam });
    });
  };

  ScaleFamilyPicker.prototype.getFamilyId = function () {
    return this.familyId;
  };

  ScaleFamilyPicker.prototype.setFamilyId = function (id) {
    const fam = global.EatCatalog.getFamily(id);
    if (!fam || fam.status === 'planned') return;
    this.familyId = id;
    if (this.select) this.select.value = id;
    this._emit('change', { id, intervals: fam.intervals, family: fam });
  };

  global.Eat = global.Eat || {};
  global.Eat.ScaleFamilyPicker = ScaleFamilyPicker;
})(typeof window !== 'undefined' ? window : globalThis);
