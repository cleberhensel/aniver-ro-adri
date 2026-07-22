# Aula HTML — Harmonia Funcional

Curso interativo em HTML/CSS/JS vanilla (sem dependências, sem rede).

## Como abrir

```bash
open aula-html/index.html
```

Ou duplo-clique em `index.html` no Finder. Funciona offline.

## Estrutura

| Arquivo | Conteúdo |
|---------|----------|
| `index.html` | Visão geral + mapa do curso |
| `01-pipeline-mental.html` | Pipeline de 8 etapas ao vivo |
| `02-escalas-intervalos.html` | Escalas, intervalos, solfege |
| `03-campo-harmonico.html` | 7 acordes diatônicos |
| `04-funcoes-harmonicas.html` | **T · SD · D** — módulo central (~390 linhas, quiz + 5 exercícios) |
| `05-acordes-qualidades.html` | Tríades, 7ªs, árvore de decisão, 6 exercícios |
| `06-progressoes.html` | Axis, Markov pop/bossa/samba, preditor por gênero |
| `07-transposicao.html` | Nashville, capo, transpositor + conversor cifra (5 exercícios) |
| `08-ear-training.html` | Currículo 5 camadas, rotina 45 min, checklist diário |
| `09-acompanhamento-vivo.html` | Ao vivo com cantor, voicings, checklist pré-música |
| `10-mpb-bossa.html` | Dispositivos Jobim, análise *Outra Vez* |
| `11-plano-treino.html` | Plano 12 meses, 4 fases, metas por nível |
| `ferramentas.html` | Hub das 5 ferramentas interativas |
| `apendice-ozeias-cinco-acordes.html` | **Apêndice** — análise da aula Ozeias Rodrigues (5 acordes, MPB/samba/bossa) + transcrição |
| `../12-synthesis/SYN-08-ozeias-cinco-acordes-aula-completa.md` | **Versão MD completa** — aula Ozeias + síntese da pesquisa |

**Ordem sugerida:** index → 01…11 → ferramentas (navegação prev/next em cada módulo). Apêndice Ozeias: após módulos 04–10 ou como aprofundamento paralelo.

## Interatividade

- Campo harmônico por tom
- Transpositor de progressões
- Cifra → números Nashville
- Preditor estatístico (Hooktheory)
- Quiz de funções harmônicas
- Checklists com progresso em `localStorage`
- **Diagramas de acordes** em `.chord-pill`, tabelas e progressões (dicionário reutilizado de `vozes/stefano/chords-dict.json`)

## Diagramas de acordes

Scripts em `js/chords-dict.js`, `js/chord-diagrams.js` e `js/chord-auto.js`:

- Injeta SVG automaticamente em `.chord-pill`, `[data-chord]`, `[data-chord-grid]` e `.progression-diagram`
- Adiciona diagrama compacto em células `<strong>` de tabelas quando o texto é um acorde reconhecível
- Aliases: `Cmaj7` → `C7M`, `Bdim` → `Bº` (notação Stefano/CifraClub)
- Funciona offline (`file://`) — dicionário embutido em JS, sem fetch

Origem: `repertorio-musicas/vozes/stefano/cifra-overlay.js` + `musicas/src/lib/chords/render.ts`

## Base teórica

Derivado de `12-synthesis/` e `02-raw-discovery/` do engagement `research-improvisacao-acordes-tom-ouido-20260614`.
