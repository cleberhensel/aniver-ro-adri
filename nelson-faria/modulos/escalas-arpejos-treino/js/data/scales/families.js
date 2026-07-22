(function (global) {
  'use strict';
  global.EatData = global.EatData || {};

  const DEG7 = ['1', '2', '3', '4', '5', '6', '7'];

  global.EatData.families = [
    {
      id: 'major',
      label: 'Maior',
      quality: 'maior',
      intervals: [0, 2, 4, 5, 7, 9, 11],
      degreeLabels: DEG7,
      status: 'ready',
      ring: ['A', 'G', 'E', 'D', 'C'],
      shapeIds: ['major.A', 'major.G', 'major.E', 'major.D', 'major.C']
    },
    {
      id: 'natural-minor',
      label: 'Menor natural',
      quality: 'menor',
      intervals: [0, 2, 3, 5, 7, 8, 10],
      degreeLabels: ['1', '2', '♭3', '4', '5', '♭6', '♭7'],
      status: 'partial',
      ring: ['A'],
      shapeIds: ['natural-minor.A']
    },
    {
      id: 'harmonic-minor',
      label: 'Menor harmônica',
      quality: 'menor',
      intervals: [0, 2, 3, 5, 7, 8, 11],
      degreeLabels: ['1', '2', '♭3', '4', '5', '♭6', '7'],
      status: 'partial',
      ring: ['A'],
      shapeIds: ['harmonic-minor.A']
    },
    {
      id: 'melodic-minor',
      label: 'Menor melódica (↑)',
      quality: 'menor',
      intervals: [0, 2, 3, 5, 7, 9, 11],
      degreeLabels: ['1', '2', '♭3', '4', '5', '6', '7'],
      status: 'partial',
      ring: ['A'],
      shapeIds: ['melodic-minor.A']
    },
    { id: 'pentatonic-major', label: 'Penta maior', quality: 'maior', intervals: [0, 2, 4, 7, 9], degreeLabels: ['1', '2', '3', '5', '6'], status: 'planned', ring: [], shapeIds: [] },
    { id: 'pentatonic-minor', label: 'Penta menor', quality: 'menor', intervals: [0, 3, 5, 7, 10], degreeLabels: ['1', '♭3', '4', '5', '♭7'], status: 'planned', ring: [], shapeIds: [] },
    { id: 'blues', label: 'Blues', quality: 'menor', intervals: [0, 3, 5, 6, 7, 10], degreeLabels: ['1', '♭3', '4', '♭5', '5', '♭7'], status: 'planned', ring: [], shapeIds: [] },
    { id: 'diminished', label: 'Diminuta', quality: 'simétrica', intervals: [0, 2, 3, 5, 6, 8, 9, 11], degreeLabels: [], status: 'planned', ring: [], shapeIds: [] },
    { id: 'whole-tone', label: 'Tons inteiros', quality: 'simétrica', intervals: [0, 2, 4, 6, 8, 10], degreeLabels: [], status: 'planned', ring: [], shapeIds: [] },
    { id: 'chromatic', label: 'Cromática', quality: '—', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], degreeLabels: [], status: 'planned', ring: [], shapeIds: [] },
    { id: 'ionian', label: 'Jônio', quality: 'modo', intervals: [0, 2, 4, 5, 7, 9, 11], degreeLabels: DEG7, status: 'planned', ring: [], shapeIds: [] },
    { id: 'dorian', label: 'Dórico', quality: 'modo', intervals: [0, 2, 3, 5, 7, 9, 10], degreeLabels: DEG7, status: 'planned', ring: [], shapeIds: [] },
    { id: 'phrygian', label: 'Frígio', quality: 'modo', intervals: [0, 1, 3, 5, 7, 8, 10], degreeLabels: DEG7, status: 'planned', ring: [], shapeIds: [] },
    { id: 'lydian', label: 'Lídio', quality: 'modo', intervals: [0, 2, 4, 6, 7, 9, 11], degreeLabels: DEG7, status: 'planned', ring: [], shapeIds: [] },
    { id: 'mixolydian', label: 'Mixolídio', quality: 'modo', intervals: [0, 2, 4, 5, 7, 9, 10], degreeLabels: DEG7, status: 'planned', ring: [], shapeIds: [] },
    { id: 'aeolian', label: 'Eólio', quality: 'modo', intervals: [0, 2, 3, 5, 7, 8, 10], degreeLabels: DEG7, status: 'planned', ring: [], shapeIds: [] },
    { id: 'locrian', label: 'Lócrio', quality: 'modo', intervals: [0, 1, 3, 5, 6, 8, 10], degreeLabels: DEG7, status: 'planned', ring: [], shapeIds: [] }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
