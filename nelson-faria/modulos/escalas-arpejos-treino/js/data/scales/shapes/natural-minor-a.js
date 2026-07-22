(function (global) {
  'use strict';
  global.EatData = global.EatData || {};

  function n(f, degree, isRoot, chg) {
    const note = { f, degree: String(degree) };
    if (isRoot) note.isRoot = true;
    if (chg) note.chg = true;
    return note;
  }

  global.EatData.naturalMinorAShape = {
    id: 'natural-minor.A',
    familyId: 'natural-minor',
    cagedId: 'A',
    order: 1,
    name: 'A shape · menor natural',
    anchorRef: 'A',
    ui: { hex: '#4ecdc4' },
    notes: [
      [n(2, '5'), n(3, '♭6'), n(5, '♭7')],
      [n(2, '2'), n(3, '♭3'), n(5, '4')],
      [n(2, '♭7'), n(4, '1', true)],
      [n(2, '4'), n(4, '5')],
      [n(2, '1', true), n(4, '2'), n(5, '♭3')],
      [n(2, '5'), n(3, '♭6'), n(5, '♭7')]
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);
