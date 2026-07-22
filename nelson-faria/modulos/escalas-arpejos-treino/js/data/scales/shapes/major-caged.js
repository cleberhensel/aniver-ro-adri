(function (global) {
  'use strict';
  global.EatData = global.EatData || {};

  const HEX = global.EatData.caged?.HEX || {};

  function n(f, degree, isRoot) {
    const note = { f, degree: String(degree) };
    if (isRoot) note.isRoot = true;
    return note;
  }

  const raw = [
    {
      cagedId: 'A', order: 1, name: 'Digitação 1 · A shape',
      notes: [
        [n(2, 5), n(4, 6)], [n(2, 2), n(4, 3), n(5, 4)],
        [n(1, 6), n(3, 7), n(4, 1, true)], [n(1, 3), n(2, 4), n(4, 5)],
        [n(1, 7), n(2, 1, true), n(4, 2)], [n(2, 5), n(4, 6)]
      ]
    },
    {
      cagedId: 'G', order: 2, name: 'Digitação 2 · G shape',
      notes: [
        [n(2, 6), n(4, 7), n(5, 1, true)], [n(2, 3), n(3, 4), n(5, 5)],
        [n(1, 7), n(2, 1, true), n(4, 2)], [n(2, 5), n(4, 6)],
        [n(2, 2), n(4, 3), n(5, 4)], [n(2, 6), n(3, 7), n(5, 1, true)]
      ]
    },
    {
      cagedId: 'E', order: 3, name: 'Digitação 3 · E shape',
      notes: [
        [n(2, 7), n(3, 1, true), n(5, 2)], [n(3, 5), n(5, 6)],
        [n(2, 2), n(4, 3), n(5, 4)], [n(2, 6), n(4, 7), n(5, 1, true)],
        [n(2, 3), n(3, 4), n(5, 5)], [n(2, 7), n(3, 1, true), n(5, 2)]
      ]
    },
    {
      cagedId: 'D', order: 4, name: 'Digitação 4 · D shape',
      notes: [
        [n(2, 2), n(4, 3), n(5, 4)], [n(2, 6), n(4, 7), n(5, 1, true)],
        [n(1, 3), n(2, 4), n(4, 5)], [n(1, 7), n(2, 1, true), n(4, 2)],
        [n(2, 5), n(4, 6)], [n(2, 2), n(4, 3), n(5, 4)]
      ]
    },
    {
      cagedId: 'C', order: 5, name: 'Digitação 5 · C shape',
      notes: [
        [n(2, 3), n(3, 4), n(5, 5)], [n(2, 7), n(3, 1, true), n(5, 2)],
        [n(2, 5), n(4, 6)], [n(2, 2), n(4, 3), n(5, 4)],
        [n(2, 6), n(4, 7), n(5, 1, true)], [n(2, 3), n(3, 4), n(5, 5)]
      ]
    }
  ];

  global.EatData.majorCagedShapes = raw.map((s) => ({
    id: 'major.' + s.cagedId,
    familyId: 'major',
    cagedId: s.cagedId,
    order: s.order,
    name: s.name,
    anchorRef: s.cagedId,
    ui: { hex: HEX[s.cagedId] || '#888' },
    notes: s.notes
  }));
})(typeof window !== 'undefined' ? window : globalThis);
