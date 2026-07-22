(function (global) {
  'use strict';
  global.EatData = global.EatData || {};

  global.EatData.arpeggioQualities = {
    maj7: { id: 'maj7', label: 'Sétima maior', formula: '1 · 3 · 5 · 7', intervals: [0, 4, 7, 11], status: 'partial' },
    dom7: { id: 'dom7', label: 'Dominante 7', formula: '1 · 3 · 5 · ♭7', intervals: [0, 4, 7, 10], status: 'partial' },
    min7: { id: 'min7', label: 'Menor 7', formula: '1 · ♭3 · 5 · ♭7', intervals: [0, 3, 7, 10], status: 'partial' },
    m7b5: { id: 'm7b5', label: 'm7♭5', formula: '1 · ♭3 · ♭5 · ♭7', intervals: [0, 3, 6, 10], status: 'planned' },
    dim7: { id: 'dim7', label: '°7', formula: '1 · ♭3 · ♭5 · bb7', intervals: [0, 3, 6, 9], status: 'planned' }
  };

  global.EatData.iiVIProgression = {
    id: 'ii-V-I-major',
    label: 'ii–V–I maior',
    status: 'partial',
    majorScale: [0, 2, 4, 5, 7, 9, 11],
    steps: [
      { roman: 'ii', scaleDegree: 2, qualityId: 'min7', color: '#4ecdc4', css: 'ii' },
      { roman: 'V', scaleDegree: 5, qualityId: 'dom7', color: '#f0a030', css: 'v' },
      { roman: 'I', scaleDegree: 1, qualityId: 'maj7', color: '#69db7c', css: 'i' }
    ],
    scaleDegreeArp: {
      I: { pov: '1 · 3 · 5 · 7', degs: [1, 3, 5, 7] },
      ii: { pov: '2 · 4 · 6 · 1', degs: [2, 4, 6, 1] },
      V: { pov: '5 · 7 · 2 · 4', degs: [5, 7, 2, 4] }
    }
  };

  global.EatData.arpeggiosIndex = {
    listQualities() {
      return Object.values(global.EatData.arpeggioQualities || {});
    },
    getQuality(id) {
      return global.EatData.arpeggioQualities?.[id] || null;
    },
    getProgression(id) {
      if (id === 'ii-V-I-major') return global.EatData.iiVIProgression;
      return null;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
