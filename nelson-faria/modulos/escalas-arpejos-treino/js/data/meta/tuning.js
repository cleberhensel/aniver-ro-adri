(function (global) {
  'use strict';
  global.EatData = global.EatData || {};
  global.EatData.tuning = {
    STRING_LABELS: ['e', 'B', 'G', 'D', 'A', 'E'],
    OPEN: [4, 11, 7, 2, 9, 4],
    NOTE_NAMES: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    FRETS: 5,
    A4: 440
  };
})(typeof window !== 'undefined' ? window : globalThis);
