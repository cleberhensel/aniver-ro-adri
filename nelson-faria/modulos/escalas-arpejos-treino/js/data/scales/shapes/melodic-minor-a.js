(function (global) {
  'use strict';
  global.EatData = global.EatData || {};

  function n(f, degree, isRoot, chg) {
    const note = { f, degree: String(degree) };
    if (isRoot) note.isRoot = true;
    if (chg) note.chg = true;
    return note;
  }

  global.EatData.melodicMinorAShape = {
    id: 'melodic-minor.A',
    familyId: 'melodic-minor',
    cagedId: 'A',
    order: 1,
    name: 'A shape · menor melódica (↑)',
    anchorRef: 'A',
    ui: { hex: '#4ecdc4' },
    notes: [
      [n(2, '5'), n(4, '6', false, true), n(5, '7', false, true)],
      [n(2, '2'), n(3, '♭3'), n(5, '4')],
      [n(2, '♭7'), n(3, '6', false, true), n(4, '1', true)],
      [n(2, '4'), n(4, '5')],
      [n(1, '7', false, true), n(2, '1', true), n(4, '2'), n(5, '♭3')],
      [n(2, '5'), n(4, '6', false, true)]
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);
