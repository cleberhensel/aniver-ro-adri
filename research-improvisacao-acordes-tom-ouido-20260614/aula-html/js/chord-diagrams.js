/**
 * Diagramas de acordes — adaptado de vozes/stefano/cifra-overlay.js e musicas/src/lib/chords/render.ts
 */
(function (global) {
  'use strict';

  const STR_LABELS = ['E', 'A', 'D', 'G', 'B', 'e'];
  const VB_W = 100;
  const NUM_FRETS = 4;
  const GX0 = 16;
  const GX1 = 84;
  const COL = (GX1 - GX0) / 5;
  const ROW = 20;

  /** Aliases: notação internacional → dicionário Stefano/CifraClub */
  const ALIASES = {
    Cmaj7: 'C7M', Gmaj7: 'G7M', Fmaj7: 'F7M', Amaj7: 'A7M', Dmaj7: 'D7M', Emaj7: 'E7M', Bmaj7: 'B7M',
    Bdim: 'Bº', Cdim: 'C°', Adim: 'Aº', Ddim: 'Dº', Gdim: 'Gº', Edim: 'Eº', Fdim: 'Fº',
    Bdim7: 'Bº', Cdim7: 'C°', 'B°': 'Bº', 'C°': 'C°',
    'Bø7': 'Bm7(b5)', 'Bm7b5': 'Bm7(b5)', 'F#dim': 'F#º', 'F#°': 'F#º', 'G#dim': 'G#º',
    Dbmaj7: 'Db7M', Ebmaj7: 'Eb7M', Abmaj7: 'Ab7M', Bbmaj7: 'Bb7M',
    'G7b9': 'G7(b9)', 'C7b9': 'C7(b9)',
    'C6/9': 'C6/9', 'G6/9': 'G6(9)', 'F6/9': 'F6(9)', 'D6/9': 'D6(9)', 'A6/9': 'A6(9)',
    'Bb6/9': 'Bb6(9)', 'Eb6/9': 'Eb6(9)'
  };

  /** Formas compactas do curso quando ausentes no dict */
  const FALLBACK_SHAPES = {
    Cmaj7: 'X 3 2 0 0 0', C7M: 'X 3 2 0 0 0',
    Dm7: 'X X 0 2 1 1', G7: '3 2 0 0 0 1', Am7: 'X 0 2 0 1 0',
    Cm6: 'X 3 5 5 4 3', Cm7: 'X 3 5 3 4 3',
    'Bº': 'X 2 0 1 0 1', Bdim: 'X 2 0 1 0 1'
  };

  function normalizeShape(shape) {
    return String(shape).trim().replace(/\s+/g, ' ');
  }

  function parseFrets(shape) {
    const tokens = normalizeShape(shape).split(/\s+/);
    return tokens.length === 6
      ? tokens.map(s => (s === 'X' || s === 'x' ? -1 : parseInt(s, 10)))
      : [-1, -1, -1, -1, -1, -1];
  }

  function inferBarreFret(frets) {
    const played = frets.filter(f => f > 0);
    if (played.length < 2) return null;
    const minF = Math.min(...played);
    const atMin = frets.filter(f => f === minF).length;
    if (atMin >= 3) return minF;
    if (atMin >= 2 && Math.max(...played) > minF) return minF;
    return null;
  }

  function lookupShape(name) {
    if (!name) return null;
    const raw = name.trim();
    const dict = global.CHORD_DICT?.chords || {};
    const tryKeys = [
      raw,
      ALIASES[raw],
      raw.replace(/maj7/i, '7M').replace(/Ma7/i, '7M'),
      raw.replace(/dim7/i, 'º').replace(/dim/i, 'º').replace(/°/g, 'º'),
      raw.replace(/m7b5/i, 'm7(b5)'),
      raw.replace(/ø7/i, 'm7(b5)')
    ].filter(Boolean);
    for (const k of tryKeys) {
      if (dict[k]?.shape) return dict[k].shape;
    }
    for (const k of tryKeys) {
      if (FALLBACK_SHAPES[k]) return FALLBACK_SHAPES[k];
    }
    return FALLBACK_SHAPES[raw] || null;
  }

  function renderChord(name, shape, opts = {}) {
    if (!shape) {
      return `<span class="chord-diagram-missing" title="Sem diagrama">${name}</span>`;
    }
    const showName = opts.hideName !== true;
    const W = opts.width || 72;
    const GY0 = showName ? 38 : 24;
    const GY1 = GY0 + ROW * NUM_FRETS;
    const VB_H = GY1 + 14;
    const H = Math.round((W * VB_H) / VB_W);

    const frets = parseFrets(shape);
    const fretted = frets.filter(f => f > 0);
    const minF = fretted.length ? Math.min(...fretted) : 0;
    const maxF = fretted.length ? Math.max(...fretted) : 0;
    const baseFret = maxF > NUM_FRETS ? minF : 1;

    const cText = '#2c2416';
    const cMuted = '#6b5d4d';
    const cLine = '#c9b8a8';
    const dot = opts.dotColor || '#c45c26';

    const x = i => GX0 + i * COL;
    const y = r => GY0 + r * ROW;

    let svg = `<svg class="chord-diagram" width="${W}" height="${H}" viewBox="0 0 ${VB_W} ${VB_H}" ` +
      `role="img" aria-label="Acorde ${name}" xmlns="http://www.w3.org/2000/svg">`;

    if (showName) {
      svg += `<text x="${VB_W / 2}" y="13" text-anchor="middle" font-family="Segoe UI,sans-serif" ` +
        `font-size="11" font-weight="700" fill="${cText}">${name}</text>`;
    }

    if (baseFret === 1) {
      svg += `<rect x="${GX0 - 1}" y="${GY0 - 3.5}" width="${GX1 - GX0 + 2}" height="3.5" fill="${cText}"/>`;
    } else {
      svg += `<text x="${GX0 - 6}" y="${y(0) + ROW * 0.66}" text-anchor="end" ` +
        `font-family="Consolas,monospace" font-size="10" fill="${cMuted}">${baseFret}</text>`;
    }

    for (let r = 0; r <= NUM_FRETS; r++) {
      svg += `<line x1="${x(0)}" y1="${y(r)}" x2="${x(5)}" y2="${y(r)}" stroke="${cLine}" stroke-width="1"/>`;
    }
    for (let i = 0; i < 6; i++) {
      svg += `<line x1="${x(i)}" y1="${GY0}" x2="${x(i)}" y2="${GY1}" stroke="${cLine}" stroke-width="1"/>`;
      if (opts.showStringLabels !== false) {
        svg += `<text x="${x(i)}" y="${GY0 - 16}" text-anchor="middle" font-family="Consolas,monospace" ` +
          `font-size="7" fill="${cMuted}">${STR_LABELS[i]}</text>`;
      }
    }

    const barreFret = inferBarreFret(frets);
    const barreStrings = [];
    if (barreFret != null) {
      for (let s = 0; s < 6; s++) if (frets[s] === barreFret) barreStrings.push(s);
      if (barreStrings.length >= 2) {
        const first = Math.min(...barreStrings);
        const last = Math.max(...barreStrings);
        const by = y(barreFret - baseFret) + ROW / 2;
        svg += `<rect x="${x(first) - 5}" y="${by - 5}" width="${x(last) - x(first) + 10}" ` +
          `height="10" rx="5" fill="${dot}"/>`;
      }
    }

    for (let st = 0; st < 6; st++) {
      const f = frets[st];
      const sx = x(st);
      if (f === -1) {
        svg += `<text x="${sx}" y="${GY0 - 8}" text-anchor="middle" font-family="Consolas,monospace" ` +
          `font-size="10" font-weight="700" fill="${cMuted}">×</text>`;
      } else if (f === 0) {
        svg += `<circle cx="${sx}" cy="${GY0 - 11}" r="3.5" fill="none" stroke="${cMuted}" stroke-width="1.2"/>`;
      } else {
        const rr = f - baseFret;
        if (rr >= 0 && rr < NUM_FRETS && !barreStrings.includes(st)) {
          svg += `<circle cx="${sx}" cy="${y(rr) + ROW / 2}" r="5.5" fill="${dot}"/>`;
        }
      }
    }
    svg += '</svg>';
    return svg;
  }

  function renderChordCard(name, opts = {}) {
    const shape = lookupShape(name);
    const w = opts.width || 80;
    const footer = shape ? normalizeShape(shape) : '';
    return `<figure class="chord-card" data-chord-name="${name}">` +
      renderChord(name, shape, { width: w, hideName: false, showStringLabels: opts.showStringLabels }) +
      (footer ? `<figcaption class="chord-card__shape">${footer}</figcaption>` : '') +
      '</figure>';
  }

  function renderChordGrid(names, opts = {}) {
    const unique = [...new Set(names.filter(Boolean))];
    return `<div class="chord-grid">${unique.map(n =>
      renderChordCard(n, { width: opts.width || 72, showStringLabels: opts.showStringLabels })
    ).join('')}</div>`;
  }

  global.ChordDiagrams = {
    lookupShape,
    renderChord,
    renderChordCard,
    renderChordGrid,
    normalizeShape
  };
})(typeof window !== 'undefined' ? window : globalThis);
