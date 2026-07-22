(function (global) {
  'use strict';
  global.EatData = global.EatData || {};

  global.EatData.scalesIndex = {
    getAllShapes() {
      const d = global.EatData;
      return []
        .concat(d.majorCagedShapes || [])
        .concat([
          d.naturalMinorAShape,
          d.harmonicMinorAShape,
          d.melodicMinorAShape
        ].filter(Boolean));
    },

    getFamily(id) {
      return (global.EatData.families || []).find((f) => f.id === id) || null;
    },

    getShape(id) {
      return this.getAllShapes().find((s) => s.id === id) || null;
    },

    listShapes(familyId) {
      const fam = this.getFamily(familyId);
      if (!fam) return [];
      return fam.shapeIds
        .map((sid) => this.getShape(sid))
        .filter(Boolean)
        .sort((a, b) => a.order - b.order);
    },

    statusOf(id) {
      const shape = this.getShape(id);
      if (shape) {
        const fam = this.getFamily(shape.familyId);
        return fam?.status || 'planned';
      }
      const fam = this.getFamily(id);
      return fam?.status || 'planned';
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
