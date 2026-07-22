(function (global) {
  'use strict';

  const tuning = () => global.EatData?.tuning || {};
  const placement = () => global.Eat?.ShapePlacement;

  function Neck(options = {}) {
    this.container = typeof options.container === 'string'
      ? document.querySelector(options.container)
      : options.container;
    this.legendEl = typeof options.legend === 'string'
      ? document.querySelector(options.legend)
      : options.legend;
    this.getHex = options.getHex || ((shape) => shape.ui?.hex || '#888');
    this.focus = { primary: null, ghost: null, ghostOp: 0 };
    this.highlight = null;
    this.shapes = [];
    this.placements = [];
    this._legendHandlers = [];
  }

  Neck.prototype.setShapes = function (shapes) {
    this.shapes = shapes || [];
    this.buildLegend();
  };

  Neck.prototype.setFocus = function (focus) {
    this.focus = focus || { primary: null, ghost: null, ghostOp: 0 };
  };

  Neck.prototype.setHighlight = function (cagedId) {
    this.highlight = cagedId || null;
  };

  Neck.prototype.update = function (placements) {
    this.placements = placements || [];
    if (!this.container) return;
    this.container.innerHTML = this.renderMap();
    this.syncLegend();
  };

  Neck.prototype.renderMap = function () {
    const placements = this.placements;
    if (!placements.length) return '';
    const focus = this.resolveFocus();
    const STRING_LABELS = tuning().STRING_LABELS || [];
    const minWs = Math.min(...placements.map((p) => p.ws));
    const maxWe = Math.max(...placements.map((p) => p.we));
    const fretCount = maxWe - minWs + 1;
    const padL = 36, padT = 28, padR = 16, padB = 22;
    const fretW = 44;
    const strH = 14;
    const W = padL + fretCount * fretW + padR;
    const H = padT + 5 * strH + padB;

    const layerOf = (cagedId) => {
      if (!focus.primary && !focus.ghost) {
        if (this.highlight && cagedId !== this.highlight) {
          return { show: false };
        }
        return { show: true, noteOp: 1, bandOp: 0.12, ghost: false };
      }
      if (cagedId === focus.primary) return { show: true, noteOp: 1, bandOp: 0.16, ghost: false };
      if (cagedId === focus.ghost && focus.ghostOp > 0.01) {
        return { show: true, noteOp: focus.ghostOp, bandOp: focus.ghostOp * 0.45, ghost: true };
      }
      return { show: false };
    };

    const ordered = placements.slice().sort((a, b) => {
      const ag = a.shape.cagedId === focus.ghost ? 0 : a.shape.cagedId === focus.primary ? 1 : 2;
      const bg = b.shape.cagedId === focus.ghost ? 0 : b.shape.cagedId === focus.primary ? 1 : 2;
      return ag - bg;
    });

    let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;

    ordered.forEach((p) => {
      const layer = layerOf(p.shape.cagedId);
      if (!layer.show) return;
      const x0 = padL + (p.ws - minWs) * fretW;
      const x1 = padL + (p.we - minWs + 1) * fretW;
      const col = this.getHex(p.shape);
      const dash = layer.ghost
        ? ` stroke="${col}" stroke-width="1.5" stroke-dasharray="4 3" stroke-opacity="${Math.min(1, layer.noteOp + 0.25)}"`
        : '';
      svg += `<rect x="${x0}" y="${padT - 4}" width="${x1 - x0}" height="${5 * strH + 8}" fill="${col}" opacity="${layer.bandOp}" rx="3"${dash}/>`;
    });

    if (minWs === 0) {
      svg += `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + 5 * strH}" stroke="#888" stroke-width="4"/>`;
    }

    for (let f = minWs; f <= maxWe; f++) {
      const x = padL + (f - minWs) * fretW;
      if (f > 0) {
        svg += `<line x1="${x}" y1="${padT}" x2="${x}" y2="${padT + 5 * strH}" stroke="#555" stroke-width="1"/>`;
      }
      svg += `<text x="${x + fretW * 0.5}" y="${padT - 8}" text-anchor="middle" font-size="10" fill="#888" font-family="system-ui">${f}</text>`;
    }

    for (let s = 0; s < 6; s++) {
      const y = padT + s * strH;
      svg += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#666" stroke-width="${s === 5 ? 2 : 1}"/>`;
      svg += `<text x="8" y="${y + 4}" font-size="10" fill="#888" font-weight="600" font-family="system-ui">${STRING_LABELS[s] || ''}</text>`;
    }

    ordered.forEach((p) => {
      const layer = layerOf(p.shape.cagedId);
      if (!layer.show) return;
      const col = this.getHex(p.shape);
      p.absNotes.forEach((n) => {
        const x = padL + (n.abs - minWs + 0.5) * fretW;
        const y = padT + n.si * strH;
        const fillCol = n.chg ? '#f0a030' : col;
        if (layer.ghost) {
          const r = n.root ? 5.5 : 4.5;
          if (n.root) {
            svg += `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${fillCol}" stroke-width="2" opacity="${layer.noteOp}"/>`;
          } else {
            svg += `<circle cx="${x}" cy="${y}" r="${r}" fill="${fillCol}" opacity="${layer.noteOp * 0.85}"/>`;
          }
        } else if (n.root) {
          svg += `<circle cx="${x}" cy="${y}" r="6" fill="#fff" stroke="${fillCol}" stroke-width="2.5"/>`;
        } else {
          svg += `<circle cx="${x}" cy="${y}" r="5" fill="${fillCol}"/>`;
        }
      });
    });

    svg += '</svg>';
    return svg;
  };

  Neck.prototype.resolveFocus = function () {
    if (this.focus.primary || this.focus.ghost) return this.focus;
    if (this.highlight) {
      return { primary: this.highlight, ghost: null, ghostOp: 0 };
    }
    return { primary: null, ghost: null, ghostOp: 0 };
  };

  Neck.prototype.buildLegend = function () {
    if (!this.legendEl) return;
    const shapes = this.shapes;
    this.legendEl.innerHTML = shapes.map((s) => `
      <button type="button" data-shape="${s.cagedId}" class="legend-btn">
        <i class="swatch" style="background:${this.getHex(s)}"></i>
        ${s.cagedId}
      </button>
    `).join('') + `<button type="button" data-shape="" class="legend-btn active">Todos</button>`;

    this.legendEl.querySelectorAll('.legend-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.shape || null;
        this.highlight = id;
        this.legendEl.querySelectorAll('.legend-btn').forEach((b) => {
          b.classList.toggle('active', b === btn);
          if (b.dataset.shape) {
            b.classList.toggle('dim', id && b.dataset.shape !== id);
          }
        });
        this.update(this.placements);
        this._emit('legendClick', { cagedId: id });
      });
    });
  };

  Neck.prototype.syncLegend = function () {
    if (!this.legendEl) return;
    const focus = this.resolveFocus();
    const ghostOn = focus.ghostOp > 0.01;
    this.legendEl.querySelectorAll('.legend-btn').forEach((b) => {
      const id = b.dataset.shape;
      if (!id) {
        b.classList.toggle('active', !focus.primary && !this.highlight);
        return;
      }
      const isCur = id === focus.primary;
      const isNext = ghostOn && id === focus.ghost;
      b.classList.toggle('active', isCur || isNext || this.highlight === id);
      b.classList.toggle('dim', focus.primary ? !isCur && !isNext : this.highlight ? this.highlight !== id : false);
    });
  };

  Neck.prototype.on = function (event, fn) {
    (this._legendHandlers[event] ||= []).push(fn);
  };

  Neck.prototype._emit = function (event, data) {
    (this._legendHandlers[event] || []).forEach((fn) => fn(data));
  };

  global.Eat = global.Eat || {};
  global.Eat.Neck = Neck;
})(typeof window !== 'undefined' ? window : globalThis);
