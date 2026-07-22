/**
 * Campo harmônico por tônica + estilo (Ozeias) — diagramas + funções
 */
(function () {
  'use strict';

  const KEYS = ['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Eb'];

  const FN_LABEL = {
    T: 'Tônica',
    'T*': 'Tônica fraca',
    SD: 'Subdominante',
    D: 'Dominante'
  };

  const STYLES = {
    folk: {
      label: 'Folk / Choro — tríades',
      desc: 'Tríades puras, estética singela. O vii° aparece só em passagem folclórica.'
    },
    pop9: {
      label: 'Pop — add9 (nonas)',
      desc: 'Primeiro embelezamento: tríade + 9. O iii evita b9 — fica tríade menor.'
    },
    pop7: {
      label: 'Pop sofisticado — 7ªs',
      desc: 'Tetrações (Ivan Lins, Jorge Ben): maj7, m7, dom7 no V.'
    },
    samba: {
      label: 'Samba — 6 / 6·9',
      desc: 'I e vi com 6 ou 6/9; V com 7; demais tríades. Evita maj7 na tônica.'
    },
    bossa: {
      label: 'Bossa nova — jazz diatônico',
      desc: 'Campo em 7ªs: maj7, m7, G7, m7(b5) no vii — base do ii–V–I.'
    },
    mpb: {
      label: 'MPB sofisticada',
      desc: 'Como bossa, com 9 nas tônicas e subdominantes (add9 / m7 com 9).'
    }
  };

  function resolveChordName(degree, quality, note, styleId) {
    const n = note;
    const triad = n + (quality === 'min' ? 'm' : quality === 'dim' ? 'dim' : '');

    switch (styleId) {
      case 'folk':
        if (degree === 7) return { name: triad, omit: false };
        return { name: triad, omit: false };

      case 'pop9':
        if (degree === 7) return { name: triad, omit: true };
        if (degree === 3) return { name: n + 'm', omit: false };
        if (quality === 'maj') return { name: n + 'add9', fallback: n, omit: false };
        if (degree === 2) return { name: n + 'm7(9)', fallback: n + 'm', omit: false };
        if (degree === 6) return { name: n + 'm7(9)', fallback: n + 'm9', omit: false };
        if (degree === 5) return { name: n + 'add9', fallback: n, omit: false };
        return { name: n + 'm', omit: false };

      case 'pop7':
        if (degree === 5) return { name: n + '7', omit: false };
        if (quality === 'maj') return { name: n + 'maj7', omit: false };
        if (quality === 'dim') return { name: n + 'm7b5', fallback: n + 'dim', omit: false };
        return { name: n + 'm7', omit: false };

      case 'samba':
        if (degree === 7) return { name: triad, omit: true };
        if (degree === 1) return { name: n + '6/9', fallback: n + '6', omit: false };
        if (degree === 6) return { name: n + 'm6', omit: false };
        if (degree === 5) return { name: n + '7', omit: false };
        return { name: triad, omit: false };

      case 'bossa':
        if (degree === 5) return { name: n + '7', omit: false };
        if (quality === 'maj') return { name: n + 'maj7', omit: false };
        if (quality === 'dim') return { name: n + 'm7b5', omit: false };
        return { name: n + 'm7', omit: false };

      case 'mpb':
        if (degree === 5) return { name: n + '7', omit: false };
        if (degree === 7) return { name: n + 'm7b5', omit: false };
        if (degree === 1 || degree === 4) return { name: n + 'maj7', omit: false };
        if (degree === 2 || degree === 6) return { name: n + 'm7(9)', fallback: n + 'm7', omit: false };
        if (degree === 3) return { name: n + 'm7', omit: false };
        return { name: triad, omit: false };

      default:
        return { name: triad, omit: false };
    }
  }

  function pickShape(name, fallback, root, styleId, degree) {
    const CD = window.ChordDiagrams;
    const OZ = window.OZEIAS_VOICINGS;
    if (OZ && root && styleId && degree) {
      const oz = OZ.lookup(root, styleId, degree);
      if (oz?.shape) return { name, shape: oz.shape, source: 'ozeias', hint: oz.note };
    }
    if (!CD) return null;
    const s1 = CD.lookupShape(name);
    if (s1) return { name, shape: s1, source: 'dict' };
    if (fallback) {
      const s2 = CD.lookupShape(fallback);
      if (s2) return { name: fallback, shape: s2, source: 'dict' };
    }
    return null;
  }

  function fnClass(fn) {
    if (fn.startsWith('T')) return 'T';
    return fn;
  }

  function buildField(root, styleId) {
    const style = STYLES[styleId];
    const diatonic = getDiatonicChords(root);
    return diatonic.map(d => {
      const resolved = resolveChordName(d.degree, d.quality, d.note, styleId);
      const diagram = resolved.omit ? null : pickShape(resolved.name, resolved.fallback, root, styleId, d.degree);
      return {
        degree: d.degree,
        roman: d.roman,
        nashville: d.nashville,
        function: d.function,
        fnLabel: FN_LABEL[d.function] || d.function,
        chord: resolved.name,
        displayChord: diagram ? diagram.name : resolved.name,
        shape: diagram ? diagram.shape : null,
        shapeSource: diagram?.source || null,
        shapeHint: diagram?.hint || '',
        omit: resolved.omit,
        hasDiagram: !!diagram
      };
    });
  }

  function renderGrid(container, items) {
    const CD = window.ChordDiagrams;
    container.innerHTML = items.map(item => {
      if (item.omit) {
        return `<div class="campo-estilo-item campo-estilo-item--omit">
          <span class="fn-badge fn-badge-${fnClass(item.function)}">${item.function}</span>
          <div class="campo-estilo-meta">${item.roman} · grau ${item.degree}</div>
          <div class="campo-estilo-omit">— omitido neste estilo</div>
          <div class="campo-estilo-fn">${item.fnLabel}</div>
        </div>`;
      }
      const diagramHtml = CD && item.hasDiagram
        ? CD.renderChord(item.displayChord, item.shape, { width: 72, hideName: false, showStringLabels: false })
        : `<span class="chord-diagram-missing">${item.chord}</span>`;
      const srcTag = item.shapeSource === 'ozeias'
        ? '<span class="campo-estilo-src campo-estilo-src--ozeias" title="Voicing da aula Ozeias">Ozeias</span>'
        : item.shapeSource === 'dict'
          ? '<span class="campo-estilo-src">genérica</span>'
          : '';
      const shapeLine = item.shape
        ? `<div class="campo-estilo-shape">${item.shape}${item.shapeHint ? ' · ' + item.shapeHint : ''}</div>`
        : '';
      return `<div class="campo-estilo-item">
        <span class="fn-badge fn-badge-${fnClass(item.function)}">${item.function}</span>
        <div class="campo-estilo-meta">${item.roman} · ${item.nashville}</div>
        <div class="campo-estilo-diagram">${diagramHtml}</div>
        <div class="campo-estilo-name">${item.chord} ${srcTag}</div>
        ${shapeLine}
        <div class="campo-estilo-fn">${item.fnLabel}</div>
      </div>`;
    }).join('');
  }

  function init() {
    const root = document.getElementById('campo-estilo-tool');
    if (!root) return;

    const keySel = document.getElementById('ce-key');
    const styleSel = document.getElementById('ce-style');
    const descEl = document.getElementById('ce-desc');
    const gridEl = document.getElementById('ce-grid');

    KEYS.forEach(k => {
      keySel.innerHTML += `<option value="${k}">${k}</option>`;
    });
    Object.entries(STYLES).forEach(([id, s]) => {
      styleSel.innerHTML += `<option value="${id}">${s.label}</option>`;
    });
    styleSel.value = 'bossa';

    function update() {
      const key = keySel.value;
      const styleId = styleSel.value;
      const style = STYLES[styleId];
      descEl.textContent = style.desc + ' · Tom de ' + key + ' maior.';
      const items = buildField(key, styleId);
      renderGrid(gridEl, items);
    }

    keySel.addEventListener('change', update);
    styleSel.addEventListener('change', update);
    update();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
