(function () {
  'use strict';

  const catalog = window.EatCatalog;
  const tuning = catalog.tuning();
  const pitch = window.Eat.Pitch;
  const placement = window.Eat.ShapePlacement;

  let familyId = 'major';
  let family = catalog.getFamily(familyId);
  let rootPc = 0;
  let shapeId = 'major.A';
  let hitDegrees = new Set();

  const familyPicker = new window.Eat.ScaleFamilyPicker({ select: '#family-select', familyId });
  const keyPicker = new window.Eat.KeyPicker({
    container: '#key-grid',
    tonicDisplay: '#tonic-display',
    pc: rootPc,
    quality: family?.quality || 'maior'
  });

  let audioCtx = null;
  let analyser = null;
  let stream = null;
  let rafId = null;
  let buf = null;

  function currentShape() {
    const shapes = catalog.listShapes(familyId);
    return shapes.find((s) => s.cagedId === 'A') || shapes[0];
  }

  function renderNeck() {
    const shape = currentShape();
    if (!shape) return;
    const p = placement.shapePlacement(shape, rootPc);
    const neck = new window.Eat.Neck({ container: '#neck-map', getHex: (s) => s.ui?.hex || '#888' });
    neck.setShapes([shape]);
    neck.setFocus({ primary: shape.cagedId, ghost: null, ghostOp: 0 });
    neck.update([{ shape, ...p }]);
  }

  function renderDegrees() {
    const labels = family?.degreeLabels || [];
    const el = document.getElementById('degree-grid');
    el.innerHTML = labels.map((deg) => {
      const hit = hitDegrees.has(deg);
      return `<span class="deg-chip${hit ? ' hit' : ''}" data-deg="${deg}">${deg}</span>`;
    }).join('');
  }

  function resetHits() {
    hitDegrees = new Set();
    renderDegrees();
    document.getElementById('status').textContent = 'Aguardando notas…';
  }

  familyPicker.on('change', ({ id, family: fam }) => {
    familyId = id;
    family = fam;
    keyPicker.setQuality(fam.quality);
    resetHits();
    renderNeck();
    renderDegrees();
  });

  keyPicker.on('change', ({ pc }) => {
    rootPc = pc;
    resetHits();
    renderNeck();
  });

  async function startMic() {
    if (stream) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const src = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    src.connect(analyser);
    buf = new Float32Array(analyser.fftSize);
    loop();
    document.getElementById('mic-btn').textContent = 'Parar microfone';
  }

  function stopMic() {
    if (rafId) cancelAnimationFrame(rafId);
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    audioCtx?.close();
    audioCtx = null;
    document.getElementById('mic-btn').textContent = 'Ligar microfone';
  }

  function loop() {
    if (!analyser) return;
    analyser.getFloatTimeDomainData(buf);
    const { freq } = pitch.detectPitch(buf, audioCtx.sampleRate);
    const note = pitch.freqToNote(freq, tuning.A4, tuning.NOTE_NAMES);
    const status = document.getElementById('status');
    if (note) {
      const deg = pitch.matchDegree(rootPc, note.pc, family);
      status.textContent = `${note.name} · ${Math.round(note.cents)}¢` + (deg ? ` · grau ${deg}` : ' · fora da escala');
      if (deg && Math.abs(note.cents) < 35) {
        hitDegrees.add(deg);
        renderDegrees();
      }
    } else {
      status.textContent = '…';
    }
    rafId = requestAnimationFrame(loop);
  }

  document.getElementById('mic-btn').addEventListener('click', async () => {
    if (stream) stopMic();
    else await startMic();
  });
  document.getElementById('reset-btn').addEventListener('click', resetHits);

  renderNeck();
  renderDegrees();
})();
