(function () {
  'use strict';

  const catalog = window.EatCatalog;
  const placement = window.Eat.ShapePlacement;

  let familyId = 'major';
  let family = catalog.getFamily(familyId);
  let shapes = catalog.listShapes(familyId);
  let rootPc = 0;

  const drill = new window.Eat.DrillSession({
    ring: family?.ring || [],
    mode: 'bag',
    seconds: 30,
    preview: 1
  });

  const keyPicker = new window.Eat.KeyPicker({
    container: '#key-grid',
    tonicDisplay: '#tonic-display',
    pc: rootPc,
    quality: family?.quality || 'maior'
  });

  const familyPicker = new window.Eat.ScaleFamilyPicker({
    select: '#family-select',
    familyId
  });

  const neck = new window.Eat.Neck({
    container: '#neck-map',
    legend: '#shape-legend',
    getHex: (s) => s.ui?.hex || '#888'
  });

  const metro = new window.Eat.MetroCompact({
    pulse: '#drill-pulse',
    beats: '#drill-beats',
    timer: '#drill-timer',
    volumeSlider: '#drill-volume',
    volumePct: '#drill-volume-pct',
    muteBtn: '#drill-mute',
    bpm: 80,
    beatsPerBar: 4
  });

  neck.setShapes(shapes);

  function getPlacements() {
    return shapes.map((shape) => ({
      shape,
      ...placement.shapePlacement(shape, rootPc)
    }));
  }

  function shapeByCaged(cagedId) {
    return shapes.find((s) => s.cagedId === cagedId);
  }

  function hexFor(cagedId) {
    const s = shapeByCaged(cagedId);
    return s?.ui?.hex || window.EatData?.caged?.HEX?.[cagedId] || '#888';
  }

  function setUrgency(cur, next, level) {
    ['urgency-soft', 'urgency-hard'].forEach((c) => {
      cur?.classList.remove(c);
      next?.classList.remove(c);
    });
    if (!level || !drill.running) return;
    if (level === 'soft') {
      cur?.classList.add('urgency-soft');
      next?.classList.add('urgency-soft');
    } else {
      cur?.classList.add('urgency-hard');
      next?.classList.add('urgency-hard');
    }
  }

  function flashShapeSwap() {
    const cur = document.getElementById('drill-current');
    const next = document.getElementById('drill-next');
    [cur, next].forEach((el) => {
      el.classList.remove('swap-flash');
      void el.offsetWidth;
      el.classList.add('swap-flash');
    });
    clearTimeout(flashShapeSwap._t);
    flashShapeSwap._t = setTimeout(() => {
      cur?.classList.remove('swap-flash');
      next?.classList.remove('swap-flash');
    }, 450);
  }

  function updateDrillPanel(placements) {
    const curEl = document.getElementById('drill-current');
    const letterEl = document.getElementById('drill-letter');
    const nameEl = document.getElementById('drill-shape-name');
    const metaEl = document.getElementById('drill-meta');
    const nextEl = document.getElementById('drill-next');
    const nextLetter = document.getElementById('drill-next-letter');
    const nextName = document.getElementById('drill-next-name');
    const nextMeta = document.getElementById('drill-next-meta');
    const statusEl = document.getElementById('drill-status');
    const queueEl = document.getElementById('drill-queue');
    const name = catalog.noteName(rootPc);

    if (!drill.running || !drill.current) {
      curEl.classList.add('idle');
      curEl.style.setProperty('--drill-accent', 'var(--border)');
      nextEl.style.removeProperty('--next-accent');
      letterEl.textContent = '—';
      letterEl.style.color = '';
      nameEl.textContent = 'shape';
      nameEl.style.color = '';
      metaEl.textContent = 'Aguardando…';
      nextEl.classList.add('empty');
      nextLetter.textContent = '?';
      nextLetter.style.color = '';
      nextName.textContent = '—';
      nextName.style.color = '';
      nextMeta.textContent = 'surpresa';
      statusEl.textContent = 'parado';
      queueEl.innerHTML = '';
      metro.updateTimer(0, false, !!drill.seconds);
      setUrgency(curEl, nextEl, null);
      return;
    }

    const shape = shapeByCaged(drill.current);
    const col = hexFor(drill.current);
    const place = placements.find((p) => p.shape.cagedId === drill.current);

    curEl.classList.remove('idle');
    curEl.style.setProperty('--drill-accent', col);
    letterEl.textContent = drill.current;
    letterEl.style.color = col;
    nameEl.textContent = shape?.name || `${drill.current} shape`;
    nameEl.style.color = col;
    metaEl.innerHTML =
      `<strong>${name}</strong> · casas <strong>${placement.placeRange(placements, drill.current)}</strong>` +
      ` · tônica ${place?.anchorAbs ?? '—'}`;

    statusEl.innerHTML = `#${drill.round} · ${drill.history.slice(-5).join('→')}`;

    const upcoming = drill.queue.slice(0, Math.max(drill.preview, 0));
    if (!drill.preview || !upcoming.length) {
      nextEl.classList.add('empty');
      nextEl.style.removeProperty('--next-accent');
      nextLetter.textContent = '?';
      nextLetter.style.color = '';
      nextName.textContent = 'surpresa';
      nextName.style.color = '';
      nextMeta.textContent = 'fila oculta';
      queueEl.innerHTML = '';
    } else {
      const nextId = upcoming[0];
      const nextCol = hexFor(nextId);
      const nextShape = shapeByCaged(nextId);
      nextEl.classList.remove('empty');
      nextEl.style.setProperty('--next-accent', nextCol);
      nextLetter.textContent = nextId;
      nextLetter.style.color = nextCol;
      nextName.textContent = nextShape?.name || `${nextId} shape`;
      nextName.style.color = nextCol;
      nextMeta.textContent = `casas ${placement.placeRange(placements, nextId)}`;
      queueEl.innerHTML = upcoming.slice(1).map((id) =>
        `<span class="queue-chip" style="color:${hexFor(id)}">${id}</span>`
      ).join('');
    }
  }

  function render() {
    const placements = getPlacements();
    if (drill.running && drill.current) {
      neck.setFocus({
        primary: drill.current,
        ghost: drill.queue[0] || null,
        ghostOp: drill.ghostOpacity()
      });
    } else {
      neck.setFocus({ primary: null, ghost: null, ghostOp: 0 });
    }
    neck.update(placements);
    updateDrillPanel(placements);
  }

  function applyFamily(fam) {
    family = fam;
    familyId = fam.id;
    shapes = catalog.listShapes(familyId);
    drill.setRing(fam.ring || []);
    keyPicker.setQuality(fam.quality || 'maior');
    neck.setShapes(shapes);
    if (drill.running) drill.stop();
    render();
  }

  keyPicker.on('change', ({ pc }) => {
    rootPc = pc;
    render();
  });

  familyPicker.on('change', ({ family: fam }) => {
    applyFamily(fam);
  });

  drill.on('advance', () => {
    flashShapeSwap();
    render();
  });

  drill.on('tick', ({ urgency, ghostOp, remainingSec, running }) => {
    const curEl = document.getElementById('drill-current');
    const nextEl = document.getElementById('drill-next');
    setUrgency(curEl, nextEl, urgency);
    metro.updateTimer(remainingSec, running, !!drill.seconds);
    if (ghostOp > 0 || drill._lastGhostOp > 0) render();
  });

  document.getElementById('drill-mode').addEventListener('change', (e) => {
    drill.setMode(e.target.value);
  });
  document.getElementById('drill-seconds').addEventListener('change', (e) => {
    drill.setSeconds(Number(e.target.value));
  });
  document.getElementById('drill-preview').addEventListener('change', (e) => {
    drill.setPreview(Number(e.target.value));
  });
  document.getElementById('drill-bpm').addEventListener('change', (e) => {
    metro.setBpm(Number(e.target.value));
  });

  document.getElementById('drill-start').addEventListener('click', () => {
    drill.setMode(document.getElementById('drill-mode').value);
    drill.setSeconds(Number(document.getElementById('drill-seconds').value));
    drill.setPreview(Number(document.getElementById('drill-preview').value));
    metro.setBpm(Number(document.getElementById('drill-bpm').value));
    drill.start();
    metro.start();
    document.getElementById('drill-next-btn').disabled = false;
    document.getElementById('drill-stop').disabled = false;
    render();
  });

  document.getElementById('drill-next-btn').addEventListener('click', () => {
    drill.next();
  });

  document.getElementById('drill-stop').addEventListener('click', () => {
    drill.stop();
    metro.stop();
    document.getElementById('drill-next-btn').disabled = true;
    document.getElementById('drill-stop').disabled = true;
    render();
  });

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && drill.running) {
      e.preventDefault();
      drill.next();
    }
  });

  const urlFam = new URLSearchParams(location.search).get('family');
  if (urlFam && catalog.getFamily(urlFam)?.status !== 'planned') {
    familyPicker.setFamilyId(urlFam);
  } else {
    render();
  }
})();
