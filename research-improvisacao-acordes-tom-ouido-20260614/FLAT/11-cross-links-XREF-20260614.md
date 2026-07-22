# XREF-20260614 — Ledger de claims e evidências

**Date**: 2026-06-14

---

## Claims principais

| CLM ID | Claim | Support | Contested |
|--------|-------|---------|-----------|
| CLM-001 | Acordes têm funções previsíveis (T/SD/D) | SRC-001, SRC-002, DA-001 | No |
| CLM-002 | Baixo = raiz na música popular (~80%) | SRC-004 | Parcial (inversões) |
| CLM-003 | Pensar em graus > pensar em letras | SRC-031, SRC-032, SRC-061 | No |
| CLM-004 | Após I, V é acorde mais provável (~31%) | SRC-046, DA-046 | Pop bias |
| CLM-005 | 7ª = triade núcleo + intervalo 7ª | SRC-016, SRC-017 | No |
| CLM-006 | NNS permite tocar sem ensaio | SRC-031, SRC-032 | No |
| CLM-007 | Bossa usa maj7/m7, raramente tríades | SRC-047, DA-048 | No |
| CLM-008 | m6 funciona como dominante em MPB | SRC-048 | Contextual |
| CLM-009 | Tom do cantor guia transposição | SRC-076, SRC-077 | No |
| CLM-010 | Ear training relativo > absoluto | SRC-061, SRC-016 | Debate pedagógico menor |

---

## Mapa capítulo → evidência

| SYN | DA | SRC principais |
|-----|-----|----------------|
| SYN-00 | DA-001 | SRC-031, SRC-046 |
| SYN-01 | DA-001 | SRC-001, SRC-002, SRC-004 |
| SYN-02 | — | SRC-016, SRC-017, SRC-018 |
| SYN-03 | — | SRC-031, SRC-032, SRC-077 |
| SYN-04 | DA-046 | SRC-046 |
| SYN-05 | DA-048 | SRC-047, SRC-048 |
| SYN-06 | — | SRC-004, SRC-076 |
| SYN-07 | ALL | SRC-061 |

---

## Consenso cross-agent (6 discovery batches)

| Tema | Agentes | Conclusão integrada |
|------|---------|---------------------|
| Função harmônica | [Harmonia funcional](1f6e99ff-fdfa-4c7f-9eca-31b0588d600d) | T–SD–D contextual; função confirmada pela cadência, não pelo acorde isolado |
| Ear training | [Ear training](0a3a0b95-5dc4-4207-bc4d-88190ad106d5) | Currículo em camadas: intervalos → tríades → 7ªs → progressões; centro tonal > intervalos isolados |
| Transposição | [Transposição](02e80835-1802-4b43-9c28-a1e37693962a) | NNS/graus ≈ solfege móvel; tensão cifra+semitons vs. campo harmônico |
| Progressões | [Progressões](d871bda9-b1d3-4cae-981d-15403435fe16) | Pop: I–V–vi–IV; jazz/bossa: ii–V–I; predição parcial ~60–75% em datasets |
| Acompanhamento | [Acompanhamento](d6003d63-0313-4a09-83ba-e95b3eae7a0f) | Guide tones + shells; voicings enxutos; pipeline baixo→raiz→acorde |
| Pedagogia | [Play-by-ear](46ca0630-97be-48ab-b84b-49baff20769c) | Audiation antes do instrumento; tom do cantor primeiro; NNS como ear training |

**Pipeline unificado (Q1–Q7):** ouvir voz/baixo → tônica → função → qualidade → grau provável → transpor → voicing mínimo com espaço para o cantor.

---

## Gaps para iteração futura (ITR)

1. **MPB estatística** — Hooktheory sub-representa Jobim; buscar análises acadêmicas BR
2. **Choro/samba tradicional** — progressões fora do jazz harmony
3. **Métodos Berklee** — curriculum PDF primary sources
4. **Functional Ear Training** — Bruce Arnold method deep dive

---

## Status transitions

| ID | Initial | Final |
|----|---------|-------|
| SRC-001–077 | raw | synthesized |
| DA-001, DA-046, DA-048 | — | deep_a |
| SYN-00–07 | — | synthesized |
