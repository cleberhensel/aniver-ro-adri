# escalas-arpejos-treino

Ginásio reutilizável de treino de **escalas** e **arpejos** (Nelson Faria). Dados + engines + páginas finas — sem build.

## Papel no ecossistema

| Onde | Conteúdo |
|------|----------|
| [MOD-BRAÇO-01](../MOD-BRAÇO-01-desvendando-acordes-arpejos-escalas/) | Aula, posters SVG, tablatura, campo harmônico |
| **este módulo** | Drill, validador, sessão timer/metro |

## Páginas

- [`pages/index.html`](pages/index.html) — hub com badges ready / partial / planned
- [`pages/drill-escala.html`](pages/drill-escala.html) — cockpit tom · shapes · pulso · braço
- [`pages/drill-arpejo.html`](pages/drill-arpejo.html) — ii–V–I (Maj7 / Dom7 / m7)
- [`pages/validador.html`](pages/validador.html) — microfone + graus por família
- [`pages/sessao.html`](pages/sessao.html) — PracticeTools Session (work/rest)
- [`pages/backing-tracks.html`](pages/backing-tracks.html) — catálogo de backing tracks por tonalidade (MPB · Bossa · Samba · Jazz)
- [`pages/playlist-bossa.html`](pages/playlist-bossa.html) — playlist inicial Bossa nos tons prioritários (player + YouTube)

## API (`window.Eat`)

| Componente | Ficheiro |
|------------|----------|
| `Eat.Catalog` | `js/data/catalog.js` |
| `Eat.ShapePlacement` | `js/placement.js` |
| `Eat.Neck` | `js/neck.js` |
| `Eat.DrillSession` | `js/drill-session.js` |
| `Eat.KeyPicker` | `js/key-picker.js` |
| `Eat.ScaleFamilyPicker` | `js/scale-family-picker.js` |
| `Eat.MetroCompact` | `js/metro-compact.js` |
| `Eat.Pitch` | `js/pitch.js` |

Metrônomo de áudio: `PracticeTools.Metronome` em `vendor/practice-tools.js`.

## Catálogo (MVP)

**Escalas — ready:** maior (5 shapes CAGED)  
**Escalas — partial:** menor natural / harmônica / melódica (só A shape)  
**Escalas — planned:** penta, blues, modos, etc.

**Arpejos — partial:** Maj7, Dom7, m7 + ii–V–I  
**Arpejos — planned:** m7♭5, °7, mais formas

## Teoria

- [Poster CAGED](../MOD-BRAÇO-01-desvendando-acordes-arpejos-escalas/artefatos/escalas-shapes-tonalidade.html)
- [Menores 3 tipos](../MOD-BRAÇO-01-desvendando-acordes-arpejos-escalas/artefatos/escalas-menor-shapes-tablatura.html)
- [Arpejos ii–V–I](../MOD-BRAÇO-01-desvendando-acordes-arpejos-escalas/artefatos/arpejos-ii-V-I.html)
- [Estudo profundo de arpejos (8 caps.)](../MOD-BRAÇO-01-desvendando-acordes-arpejos-escalas/artefatos/estudo-arpejos/) · [Markdown](../MOD-BRAÇO-01-desvendando-acordes-arpejos-escalas/artefatos/estudo-arpejos/markdown/)

## Abrir localmente

Abrir qualquer HTML em `pages/` no browser (file:// ou servidor estático). Scripts em cascata, IIFE, sem bundler.
