# [SRC-047]: Hooktheory API — Chord Frequency and Transition Statistics

**URL**: https://www.hooktheory.com/api/trends/docs
**Captured**: 2026-06-14
**Type**: API documentation / empirical data

## Verbatim snippets / quotes

> "The I chord makes up 18.9% of all chords in the database. IV is the next most frequently occurring chord and 17.2% of chords are IV."

> "vi — probability: 0.147" / "ii — probability: 0.049"

> "The I chord comes after IV chords most often, 32% of the time, the V chord next most often, 29% of the time and so on."

> "V is most likely to follow IV → I and it happens a remarkable 44% of the time."

> "The most popular progression — I → V → vi → IV"

## Primary claims

- Distribuição global de acordes no pop: I (18,9%) > IV (17,2%) > V (15,7%) > vi (14,7%) >> ii (4,9%).
- Transições condicionais quantificadas: IV→I (32%), IV→V (29%); IV→I→V (44%).
- API expõe `child_path` para consultar probabilidades dado histórico parcial — formalização computacional de "adivinhar próximo acorde".
- I, IV, V, vi formam o núcleo estatístico; ii é minoritário no pop mas central no jazz.
- Progressão mais popular documentada explicitamente: I→V→vi→IV.

## Relevance to charter Q4

Dados numéricos granulares para ranquear padrões dominantes. Permite construir tabelas de "se ouviu X, aposte em Y com Z% de chance" — protocolo de inferência harmônica baseado em estatística real de repertório pop.
