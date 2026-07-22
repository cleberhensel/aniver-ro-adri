(function () {
  'use strict';

  const catalog = window.EatCatalog;
  const tuning = catalog.tuning();
  const MAJOR = catalog.getProgression('ii-V-I-major')?.majorScale || [0, 2, 4, 5, 7, 9, 11];
  const steps = catalog.getProgression('ii-V-I-major')?.steps || [];

  let rootPc = 0;
  let highlight = null;

  function scaleNote(root, degreeNum) {
    const idx = (degreeNum - 1 + 7) % 7;
    return (root + MAJOR[idx]) % 12;
  }

  function chordRoot(root, scaleDegree) {
    return scaleNote(root, scaleDegree);
  }

  function findWindow(root) {
    for (let ws = 0; ws <= 22; ws++) {
      if ((tuning.OPEN[4] + ws + 1) % 12 === root) return ws;
    }
    return 2;
  }

  function renderNeck(step) {
    const chRoot = chordRoot(rootPc, step.scaleDegree);
    const quality = catalog.getArpeggioQuality(step.qualityId);
    const tones = catalog.chordTones(chRoot, step.qualityId);
    const ws = findWindow(chRoot);
    const we = ws + 4;
    const padL = 36, padT = 28, padR = 16, fretW = 44, strH = 14;
    const fretCount = we - ws + 1;
    const W = padL + fretCount * fretW + padR;
    const H = padT + 5 * strH + 22;
    let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect x="${padL}" y="${padT - 4}" width="${fretCount * fretW}" height="${5 * strH + 8}" fill="${step.color}" opacity="0.14" rx="3"/>`;
    for (let f = ws; f <= we; f++) {
      const x = padL + (f - ws) * fretW;
      if (f > 0) svg += `<line x1="${x}" y1="${padT}" x2="${x}" y2="${padT + 5 * strH}" stroke="#555"/>`;
      svg += `<text x="${x + fretW * 0.5}" y="${padT - 8}" text-anchor="middle" font-size="10" fill="#888">${f}</text>`;
    }
    for (let s = 0; s < 6; s++) {
      const y = padT + s * strH;
      svg += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#666"/>`;
      svg += `<text x="8" y="${y + 4}" font-size="10" fill="#888">${tuning.STRING_LABELS[s]}</text>`;
      for (let f = ws; f <= we; f++) {
        const pc = (tuning.OPEN[s] + f) % 12;
        if (tones.includes(pc)) {
          const x = padL + (f - ws + 0.5) * fretW;
          const isRoot = pc === chRoot;
          if (isRoot) svg += `<circle cx="${x}" cy="${y}" r="6" fill="#fff" stroke="${step.color}" stroke-width="2.5"/>`;
          else svg += `<circle cx="${x}" cy="${y}" r="5" fill="${step.color}"/>`;
        }
      }
    }
    svg += '</svg>';
    return svg;
  }

  function render() {
    const keyName = catalog.noteName(rootPc);
    document.getElementById('key-display').textContent = keyName;
    const cards = document.getElementById('arp-cards');
    cards.innerHTML = steps.map((step) => {
      const chRoot = chordRoot(rootPc, step.scaleDegree);
      const sym = step.qualityId === 'maj7'
        ? catalog.noteName(chRoot) + ' Maj7'
        : step.qualityId === 'dom7'
          ? catalog.noteName(chRoot) + '7'
          : catalog.noteName(chRoot) + 'm7';
      const q = catalog.getArpeggioQuality(step.qualityId);
      return `<article class="arp-card${highlight === step.roman ? ' active' : ''}" data-roman="${step.roman}">
        <h3 style="color:${step.color}">${step.roman} · ${sym}</h3>
        <p>${q?.formula || ''}</p>
        <div class="neck-mini">${renderNeck(step)}</div>
      </article>`;
    }).join('');
    cards.querySelectorAll('.arp-card').forEach((card) => {
      card.addEventListener('click', () => {
        highlight = card.dataset.roman;
        render();
      });
    });
  }

  const grid = document.getElementById('key-grid');
  tuning.NOTE_NAMES.forEach((name, pc) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'key-btn' + (pc === rootPc ? ' active' : '');
    btn.textContent = name;
    btn.addEventListener('click', () => {
      rootPc = pc;
      grid.querySelectorAll('.key-btn').forEach((b, i) => b.classList.toggle('active', i === pc));
      render();
    });
    grid.appendChild(btn);
  });

  render();
})();
