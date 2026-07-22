/**
 * Injeta diagramas onde aparecem acordes (.chord-pill, [data-chord], tabelas, .chord-grid-source)
 */
(function () {
  'use strict';

  const CHORD_NAME_RE = /^([A-G](?:#|b)?(?:maj7|min7|m7b5|m7|M7|7M|7|m|maj|min|dim7|dim|aug|sus|add|Maj7|º|°)?(?:\/[A-G](?:#|b)?)?)$/i;
  const SKIP = new Set(['→', 'T', 'SD', 'D', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII']);

  function isChordName(s) {
    const t = s.trim();
    if (!t || SKIP.has(t)) return false;
    return CHORD_NAME_RE.test(t);
  }

  function enhancePill(el) {
    if (el.dataset.chordDone) return;
    const name = el.textContent.trim();
    if (!isChordName(name)) return;
    const CD = window.ChordDiagrams;
    if (!CD) return;
    const shape = CD.lookupShape(name);
    if (!shape) return;
    el.dataset.chordDone = '1';
    el.classList.add('chord-pill-diagram');
    const fig = document.createElement('span');
    fig.className = 'chord-pill-wrap';
    fig.innerHTML = CD.renderChord(name, shape, { width: 58, hideName: false, showStringLabels: false });
    el.textContent = '';
    el.appendChild(fig);
    const lbl = document.createElement('span');
    lbl.className = 'chord-pill-label';
    lbl.textContent = name;
    el.appendChild(lbl);
  }

  function enhanceDataChord(el) {
    if (el.dataset.chordDone) return;
    const name = el.dataset.chord;
    if (!name) return;
    const CD = window.ChordDiagrams;
    if (!CD) return;
    el.dataset.chordDone = '1';
    el.innerHTML = CD.renderChordCard(name, { width: 80 });
  }

  function enhanceGridSource(el) {
    if (el.dataset.chordDone) return;
    const raw = el.dataset.chordGrid || el.textContent;
    const names = raw.split(/[\s,–\-|→]+/).map(s => s.trim()).filter(isChordName);
    if (!names.length) return;
    const CD = window.ChordDiagrams;
    if (!CD) return;
    el.dataset.chordDone = '1';
    const grid = document.createElement('div');
    grid.className = 'chord-grid';
    grid.innerHTML = names.map(n => CD.renderChordCard(n, { width: 72 })).join('');
    if (el.classList.contains('chord-grid-source')) {
      el.after(grid);
    } else {
      el.innerHTML = grid.outerHTML;
    }
  }

  function enhanceTableCells(scope) {
    const root = scope || document;
    root.querySelectorAll('table td strong').forEach(cell => {
      const name = cell.textContent.trim();
      if (!isChordName(name) || cell.querySelector('.chord-cell-diagram')) return;
      const CD = window.ChordDiagrams;
      if (!CD || !CD.lookupShape(name)) return;
      const wrap = document.createElement('div');
      wrap.className = 'chord-cell-diagram';
      wrap.innerHTML = CD.renderChord(name, CD.lookupShape(name), { width: 52, hideName: false, showStringLabels: false });
      cell.appendChild(wrap);
    });
  }

  function enhanceProgressionRows(scope) {
    const root = scope || document;
    root.querySelectorAll('.progression-diagram').forEach(el => {
      if (el.dataset.chordDone) return;
      const names = (el.dataset.chords || '').split(',').map(s => s.trim()).filter(Boolean);
      if (!names.length) return;
      const CD = window.ChordDiagrams;
      if (!CD) return;
      el.dataset.chordDone = '1';
      el.innerHTML = '<div class="chord-grid chord-grid--progression">' +
        names.map(n => CD.renderChordCard(n, { width: 64 })).join('') + '</div>';
    });
  }

  function initChordDiagrams(root) {
    const scope = root || document;
    scope.querySelectorAll('.chord-pill').forEach(enhancePill);
    scope.querySelectorAll('[data-chord]').forEach(enhanceDataChord);
    scope.querySelectorAll('[data-chord-grid]').forEach(enhanceGridSource);
    enhanceTableCells(scope);
    enhanceProgressionRows(scope);
  }

  window.initChordDiagrams = initChordDiagrams;

  document.addEventListener('DOMContentLoaded', () => initChordDiagrams());
})();
