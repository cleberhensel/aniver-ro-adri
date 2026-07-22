/* eslint-disable no-unused-vars */
const THEORY = {
  notes: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
  noteNamesPt: { C: 'Dó', 'C#': 'Dó#', D: 'Ré', 'D#': 'Ré#', E: 'Mi', F: 'Fá', 'F#': 'Fá#', G: 'Sol', 'G#': 'Sol#', A: 'Lá', 'A#': 'Lá#', B: 'Si' },

  majorScaleIntervals: [0, 2, 4, 5, 7, 9, 11],

  diatonicQualities: ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'],
  diatonicFunctions: ['T', 'SD', 'T*', 'SD', 'D', 'T', 'D'],
  diatonicLabels: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
  diatonicNashville: ['1', '2-', '3-', '4', '5', '6-', '7°'],

  seventhTypes: {
    maj7: { triad: 'maj', seventh: 'maj', label: 'Maj7 / △7', feel: 'Repouso sofisticado, jazz/bossa', func: 'I em bossa' },
    dom7: { triad: 'maj', seventh: 'min', label: 'Dom7 / 7', feel: 'Tensão bluesy — quer resolver', func: 'V em todo estilo' },
    m7: { triad: 'min', seventh: 'min', label: 'm7 / min7', feel: 'Suave, preparação', func: 'ii, vi jazz' },
    mMaj7: { triad: 'min', seventh: 'maj', label: 'm(maj7)', feel: 'Picante, noir', func: 'i menor' },
    halfDim: { triad: 'dim', seventh: 'min', label: 'ø7 / m7b5', feel: 'Instável menor', func: 'viiø, iiø' },
    dim7: { triad: 'dim', seventh: 'dim', label: '°7', feel: 'Suspense, passagem', func: 'Cromático Jobim' }
  },

  progressions: {
    axis: { nums: [1, 5, 6, 4], roman: ['I', 'V', 'vi', 'IV'], name: 'Axis / 4 acordes', genre: 'Pop universal' },
    doowop: { nums: [1, 6, 4, 5], roman: ['I', 'vi', 'IV', 'V'], name: 'Doo-wop / Stand By Me', genre: 'Balada clássica' },
    blues: { nums: [1, 4, 1, 5, 4, 1, 5, 1], roman: ['I', 'IV', 'I', 'V', 'IV', 'I', 'V', 'I'], name: 'Blues 12 compassos', genre: 'Rock/blues' },
    iiVII: { nums: [2, 5, 1], roman: ['ii', 'V', 'I'], name: 'ii–V–I', genre: 'Jazz/bossa/MPB' },
    iiVImaj7: { nums: ['2m7', '57', '1maj7'], roman: ['iim7', 'V7', 'Imaj7'], name: 'ii7–V7–Imaj7', genre: 'Bossa nova' },
    andean: { nums: [6, 4, 1, 5], roman: ['vi', 'IV', 'I', 'V'], name: 'Axis invertida', genre: 'Pop melancólico' }
  },

  markovPop: {
    1: [{ to: 5, pct: 31 }, { to: 6, pct: 22 }, { to: 4, pct: 18 }],
    5: [{ to: 1, pct: 45 }, { to: 6, pct: 20 }],
    6: [{ to: 4, pct: 35 }, { to: 5, pct: 25 }],
    4: [{ to: 1, pct: 30 }, { to: 5, pct: 28 }],
    2: [{ to: 5, pct: 50 }]
  },

  markovBossa: {
    1: [{ to: 2, pct: 40 }, { to: 6, pct: 25 }, { to: 4, pct: 15 }],
    2: [{ to: 5, pct: 55 }, { to: 3, pct: 15 }],
    5: [{ to: 1, pct: 50 }, { to: 6, pct: 20 }],
    6: [{ to: 2, pct: 35 }, { to: 4, pct: 25 }],
    4: [{ to: 5, pct: 35 }, { to: 1, pct: 25 }]
  },

  markovSamba: {
    1: [{ to: 4, pct: 28 }, { to: 5, pct: 26 }, { to: 6, pct: 20 }],
    5: [{ to: 1, pct: 42 }, { to: 4, pct: 22 }],
    6: [{ to: 4, pct: 32 }, { to: 2, pct: 18 }],
    4: [{ to: 5, pct: 30 }, { to: 1, pct: 28 }, { to: 2, pct: 15 }],
    2: [{ to: 5, pct: 48 }]
  },

  mpbDevices: [
    { id: 'bIImaj7', name: 'bIImaj7 → I', example: 'Dbmaj7 → Cmaj7', song: 'Garota de Ipanema, Insensatez' },
    { id: 'tritone', name: 'Substituição trítono', example: 'Gb7 no lugar de C7', song: 'Garota de Ipanema' },
    { id: 'm6dom', name: 'm6 como dominante', example: 'Cm6 = F7', song: 'Só Danço Samba' },
    { id: 'dimpass', name: 'Diminuto passagem', example: 'Eb°7 entre Imaj7 e iim7', song: 'Outra Vez' },
    { id: 'majmin', name: 'Imaj7 → Im7', example: 'Dmaj7 → Dm7', song: 'Wave, Olha pro Céu' },
    { id: 'backdoor', name: 'Backdoor dominant', example: 'Bb7 → Cmaj7', song: 'MPB avançada' }
  ],

  voicingsGuitar: {
    maj7: { shape: 'x3545x', notes: '1-3-5-7 compacto' },
    m7: { shape: 'x353x / xx0211', notes: 'shell ii' },
    dom7: { shape: 'x3530x / 320001', notes: 'V7 essencial' },
    m6: { shape: 'x02212', notes: 'dispositivo bossa' },
    dim7: { shape: 'xx1212', notes: 'passagem cromática' }
  },

  modules: [
    { id: 'index', file: 'index.html', title: 'Início', phase: 0 },
    { id: '01', file: '01-pipeline-mental.html', title: 'Pipeline mental', phase: 1 },
    { id: '02', file: '02-escalas-intervalos.html', title: 'Escalas e intervalos', phase: 1 },
    { id: '03', file: '03-campo-harmonico.html', title: 'Campo harmônico', phase: 1 },
    { id: '04', file: '04-funcoes-harmonicas.html', title: 'Funções T–SD–D', phase: 2 },
    { id: '05', file: '05-acordes-qualidades.html', title: 'Acordes e 7ªs', phase: 2 },
    { id: '06', file: '06-progressoes.html', title: 'Progressões', phase: 3 },
    { id: '07', file: '07-transposicao.html', title: 'Transposição', phase: 3 },
    { id: '08', file: '08-ear-training.html', title: 'Treino auditivo', phase: 3 },
    { id: '09', file: '09-acompanhamento-vivo.html', title: 'Ao vivo com cantor', phase: 4 },
    { id: '10', file: '10-mpb-bossa.html', title: 'MPB e bossa', phase: 4 },
    { id: '11', file: '11-plano-treino.html', title: 'Plano 12 meses', phase: 4 },
    { id: 'tools', file: 'ferramentas.html', title: 'Ferramentas', phase: 0 }
  ]
};

function noteIndex(n) {
  const flatMap = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#', 'C#': 'C#', 'F#': 'F#' };
  const clean = String(n).replace(/m$/, '').trim();
  const note = flatMap[clean] || clean;
  const idx = THEORY.notes.indexOf(note);
  return idx >= 0 ? idx : THEORY.notes.indexOf(clean.replace('b', ''));
}

function getMajorScale(root) {
  const ri = noteIndex(root);
  if (ri < 0) return [];
  return THEORY.majorScaleIntervals.map(i => THEORY.notes[(ri + i) % 12]);
}

function getDiatonicChords(root) {
  const scale = getMajorScale(root);
  const qual = THEORY.diatonicQualities;
  const suffix = { maj: '', min: 'm', dim: 'dim' };
  return scale.map((note, i) => ({
    degree: i + 1,
    roman: THEORY.diatonicLabels[i],
    nashville: THEORY.diatonicNashville[i],
    function: THEORY.diatonicFunctions[i],
    note,
    chord: note + suffix[qual[i]],
    quality: qual[i]
  }));
}

function transposeProgression(progression, fromRoot, toRoot) {
  const from = noteIndex(fromRoot);
  const to = noteIndex(toRoot);
  const shift = (to - from + 12) % 12;
  const fromChords = getDiatonicChords(fromRoot);
  const toChords = getDiatonicChords(toRoot);
  return progression.map(num => {
    const idx = typeof num === 'number' ? num - 1 : parseInt(String(num), 10) - 1;
    if (idx < 0 || idx > 6) return '?';
    return toChords[idx].chord;
  });
}

function numsToChords(nums, root) {
  const diatonic = getDiatonicChords(root);
  return nums.map(n => {
    if (typeof n === 'string' && n.includes('m7')) {
      const d = parseInt(n, 10) - 1;
      return diatonic[d].note + 'm7';
    }
    if (typeof n === 'string' && n.includes('maj7')) return diatonic[0].note + 'maj7';
    if (typeof n === 'string' && n.includes('7')) {
      const d = parseInt(n, 10) - 1;
      return diatonic[d].note + '7';
    }
    const d = (typeof n === 'number' ? n : parseInt(n, 10)) - 1;
    return diatonic[d]?.chord || '?';
  });
}
