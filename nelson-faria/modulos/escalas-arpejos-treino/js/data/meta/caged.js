(function (global) {
  'use strict';
  global.EatData = global.EatData || {};
  global.EatData.caged = {
    RING: ['A', 'G', 'E', 'D', 'C'],
    ANCHORS: {
      A: { si: 4, rel: 2, hint: 'tônica na 5ª corda (A)' },
      G: { si: 2, rel: 2, hint: 'tônica na 3ª corda (G)' },
      E: { si: 5, rel: 3, hint: 'tônica na 6ª corda (E)' },
      D: { si: 3, rel: 2, hint: 'tônica na 4ª corda (D)' },
      C: { si: 4, rel: 5, hint: 'tônica na 5ª corda (A) · casa rel 5' }
    },
    HEX: {
      A: '#4ecdc4',
      G: '#a78bfa',
      E: '#f0a030',
      D: '#ff6b6b',
      C: '#69db7c'
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
