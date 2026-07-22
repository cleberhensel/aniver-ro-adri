/**
 * Voicings alinhados à aula Ozeias Rodrigues (referência em Dó maior).
 * Fontes: transcrição do vídeo + shells compactos (Jazz Guitar Academy).
 */
(function (global) {
  'use strict';

  const NOTE_IDX = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };

  /**
   * Formas em Dó maior — citadas ou demonstradas no vídeo.
   * folk/pop9: tríades e add9 (F: “tiro o dedo 2”, 9 no topo)
   * pop7/bossa: tetrações shell / abertas
   * samba: C6/9 aberto (“dó mi lá ré”), Am6, G7
   * mpb: bossa + Am7(9) com polegar na fundamental (5ª casa)
   */
  const SHAPES_C = {
    folk: {
      1: 'X 3 2 0 1 0',       // C maior aberto
      2: 'X X 0 2 3 1',       // Dm
      3: '0 2 2 0 0 0',       // Em
      4: '1 3 3 2 1 1',       // F
      5: '3 2 0 0 0 3',       // G
      6: 'X 0 2 2 1 0',       // Am
      7: 'X 2 0 1 0 1'        // Bdim (passagem folclórica)
    },
    pop9: {
      1: 'X 3 2 0 3 0',       // Cadd9 (9 sobre tríade)
      2: 'X X 0 2 3 1',       // Dm +9 melódica (mesma base; 9 implícita)
      3: '0 2 2 0 0 0',       // Em — sem b9 no iii
      4: '1 3 3 2 3 1',       // Fadd9 — vídeo: tira dedo 2, 9 (Lá) no topo
      5: '3 2 0 2 3 3',       // G com 9 (Lá)
      6: 'X 0 2 2 0 3'        // Am(add9)
    },
    pop7: {
      1: 'X 3 2 0 0 0',       // Cmaj7
      2: 'X X 0 2 1 1',       // Dm7 shell
      3: '0 2 0 0 0 0',       // Em7
      4: 'X X 3 2 1 0',       // Fmaj7
      5: '3 2 0 0 0 1',       // G7 (320001)
      6: 'X 0 2 0 1 0',       // Am7
      7: 'X 2 3 1 3 1'        // Bm7(b5)
    },
    samba: {
      1: '0 0 0 2 3 2',       // C6/9 — “dó mi lá ré”
      2: 'X X 0 2 3 1',
      3: '0 2 2 0 0 0',
      4: '1 3 3 2 1 1',
      5: '3 2 0 0 0 1',       // G7
      6: 'X 0 2 2 1 2'        // Am6 (6M — estabiliza tônica menor)
    },
    bossa: {
      1: 'X 3 2 0 0 0',
      2: 'X X 0 2 1 1',
      3: '0 2 0 0 0 0',
      4: 'X X 3 2 1 0',
      5: '3 2 0 0 0 1',
      6: 'X 0 2 0 1 0',
      7: 'X 2 3 1 3 1'
    },
    mpb: {
      1: 'X 3 2 0 0 0',
      2: 'X X 0 2 1 3',       // Dm7(9)
      3: '0 2 0 0 0 0',
      4: 'X X 3 2 1 0',
      5: '3 2 0 0 0 1',
      6: '5 7 5 5 7 5',       // Am7(9) — polegar na fundamental, pestana, 9 na ponta
      7: 'X 2 3 1 3 1'
    }
  };

  /** Formas móveis (sem cordas soltas) para transpor a partir de Dó */
  const MOVABLE_C = {
    folk: {
      1: 'X 3 5 5 5 3', 2: 'X X 5 7 6 5', 3: 'X X 5 7 5 5', 4: 'X 3 5 5 4 3',
      5: 'X 3 5 5 3 3', 6: 'X 5 7 5 5 5', 7: 'X 5 6 7 6 5'
    },
    pop9: {
      1: 'X 3 5 5 3 3', 2: 'X X 5 7 6 5', 3: 'X X 5 7 5 5', 4: 'X 3 5 5 5 3',
      5: 'X 3 5 5 5 5', 6: 'X 5 7 5 5 5'
    },
    pop7: {
      1: 'X 3 5 4 5 X', 2: 'X X 5 7 6 5', 3: 'X X 5 7 5 5', 4: 'X 3 5 4 5 X',
      5: 'X 3 5 3 4 3', 6: 'X 5 7 5 5 5', 7: 'X 5 6 7 6 5'
    },
    samba: {
      1: 'X 3 5 4 5 5', 2: 'X X 5 7 6 5', 3: 'X X 5 7 5 5', 4: 'X 3 5 5 4 3',
      5: 'X 3 5 3 4 3', 6: 'X 5 7 5 5 5'
    },
    bossa: {
      1: 'X 3 5 4 5 X', 2: 'X X 5 7 6 5', 3: 'X X 5 7 5 5', 4: 'X 3 5 4 5 X',
      5: 'X 3 5 3 4 3', 6: 'X 5 7 5 5 5', 7: 'X 5 6 7 6 5'
    },
    mpb: {
      1: 'X 3 5 4 5 X', 2: 'X X 5 7 6 7', 3: 'X X 5 7 5 5', 4: 'X 3 5 4 5 X',
      5: 'X 3 5 3 4 3', 6: 'X 5 7 5 5 7', 7: 'X 5 6 7 6 5'
    }
  };

  function semitonesFromC(root) {
    const idx = NOTE_IDX[root];
    return idx == null ? 0 : idx;
  }

  function hasOpenStrings(shape) {
    return shape.split(/\s+/).some(t => t === '0');
  }

  function transposeShape(shape, semi) {
    if (!semi) return shape;
    return shape.split(/\s+/).map(t => {
      if (t === 'X' || t === 'x') return 'X';
      const f = parseInt(t, 10);
      if (Number.isNaN(f)) return t;
      if (f === 0) return '0';
      return String(Math.min(f + semi, 22));
    }).join(' ');
  }

  /**
   * @returns {{ shape: string, source: 'ozeias'|'dict', note?: string }}
   */
  function lookup(root, styleId, degree) {
    const style = SHAPES_C[styleId];
    if (!style || !style[degree]) return null;

    const semi = semitonesFromC(root);
    let shape = style[degree];
    let note = '';

    if (semi === 0) {
      return { shape, source: 'ozeias' };
    }

    if (hasOpenStrings(shape)) {
      const mov = MOVABLE_C[styleId]?.[degree];
      if (mov) {
        shape = transposeShape(mov, semi);
        note = semi ? 'forma móvel transposta' : '';
      } else {
        return null;
      }
    } else {
      shape = transposeShape(shape, semi);
    }

    return { shape, source: 'ozeias', note };
  }

  global.OZEIAS_VOICINGS = {
    SHAPES_C,
    lookup,
    semitonesFromC
  };
})(window);
