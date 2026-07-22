(function (global) {
  'use strict';

  const idx = () => global.EatData?.scalesIndex;
  const arp = () => global.EatData?.arpeggiosIndex;
  const tuning = () => global.EatData?.tuning || {};
  const caged = () => global.EatData?.caged || {};
  const placement = () => global.Eat?.ShapePlacement;

  const catalog = {
    tuning: () => tuning(),
    caged: () => caged(),

    listFamilies() {
      return global.EatData?.families || [];
    },

    getFamily(id) {
      return idx()?.getFamily(id) || null;
    },

    listShapes(familyId) {
      return idx()?.listShapes(familyId) || [];
    },

    getShape(id) {
      return idx()?.getShape(id) || null;
    },

    statusOf(id) {
      return idx()?.statusOf(id) || 'planned';
    },

    placeShape(shape, rootPc) {
      if (!placement()) throw new Error('Eat.ShapePlacement not loaded');
      return placement().shapePlacement(shape, rootPc);
    },

    listArpeggioQualities() {
      return arp()?.listQualities() || [];
    },

    getArpeggioQuality(id) {
      return arp()?.getQuality(id) || null;
    },

    getProgression(id) {
      return arp()?.getProgression(id) || null;
    },

    chordTones(chRoot, qualityId) {
      const q = this.getArpeggioQuality(qualityId);
      if (!q) return [];
      return q.intervals.map((i) => (chRoot + i) % 12);
    },

    noteName(pc) {
      const names = tuning().NOTE_NAMES || [];
      return names[((pc % 12) + 12) % 12] || '?';
    }
  };

  global.EatCatalog = catalog;
})(typeof window !== 'undefined' ? window : globalThis);
