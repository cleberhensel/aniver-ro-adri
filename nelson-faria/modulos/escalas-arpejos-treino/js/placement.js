(function (global) {
  'use strict';

  const tuning = () => global.EatData?.tuning || {};
  const caged = () => global.EatData?.caged || {};

  function noteAt(si, absFret) {
    const OPEN = tuning().OPEN || [];
    return (OPEN[si] + absFret) % 12;
  }

  function findWindowStart(si, relFret, root) {
    for (let ws = 0; ws <= 22; ws++) {
      if (noteAt(si, ws + relFret - 1) === root) return ws;
    }
    return 0;
  }

  function shapePlacement(shape, root) {
    const anchors = caged().ANCHORS || {};
    const anchor = anchors[shape.anchorRef || shape.cagedId];
    if (!anchor) {
      return { ws: 0, we: 4, absNotes: [], anchorAbs: 0, hint: '' };
    }
    const ws = findWindowStart(anchor.si, anchor.rel, root);
    const FRETS = tuning().FRETS || 5;
    const absNotes = [];
    shape.notes.forEach((stringNotes, si) => {
      stringNotes.forEach((n) => {
        absNotes.push({
          si,
          abs: ws + n.f - 1,
          rel: n.f,
          root: !!n.isRoot,
          degree: n.degree,
          chg: !!n.chg
        });
      });
    });
    return {
      ws,
      we: ws + FRETS - 1,
      absNotes,
      anchorAbs: ws + anchor.rel - 1,
      hint: anchor.hint || ''
    };
  }

  function placeRange(placements, cagedId) {
    const place = placements.find((p) => p.shape.cagedId === cagedId);
    if (!place) return '?';
    return place.ws === place.we ? `${place.ws}` : `${place.ws}–${place.we}`;
  }

  global.Eat = global.Eat || {};
  global.Eat.ShapePlacement = {
    noteAt,
    findWindowStart,
    shapePlacement,
    placeRange
  };
})(typeof window !== 'undefined' ? window : globalThis);
