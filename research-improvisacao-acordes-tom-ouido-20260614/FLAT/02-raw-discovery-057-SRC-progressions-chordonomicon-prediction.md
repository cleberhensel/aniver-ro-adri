# [SRC-057]: CHORDONOMICON — Chord Prediction from Partial Progressions

**URL**: https://arxiv.org/html/2410.22046v3
**Captured**: 2026-06-14
**Type**: academic paper / dataset + ML

## Verbatim snippets / quotes

> "Chord prediction is a task where given an incomplete chord progression, we have to predict the next chord in the sequence. Formally, given a sequence of chords (y₁, y₂, …, yₖ) we predict P(yₖ | (y₁, …, yₖ₋₁), which means that this task is essentially language modelling."

> "For each chord progression, a random end was chosen, ranging from the fourth chord up to the second to last chord in the progression."

> "The chord prediction task achieved an accuracy of 60.13%."

> "The model attains a 75.45% accuracy [at note level], indicating that some incorrectly predicted chords still align with musical meaning."

> "The model performs more effectively for sequences with lengths less than 51 and its performance declines as the length increases."

## Primary claims

- Predição de próximo acorde a partir de sequência parcial é formalmente modelagem de linguagem (Markov, RNN, Transformer).
- Dataset CHORDONOMICON: 666.000 músicas com progressões curadas por especialistas.
- GPT-2 fine-tuned atinge 60,13% de acerto exato de acorde; 75,45% em nível de notas.
- Performance melhor com sequências curtas (<51 acordes) — alinhado à prática humana de inferência local.
- Erros "musicalmente plausíveis" (acordes compartilham notas) espelham tolerância do ouvido experiente.

## Relevance to charter Q4

Validação computacional da tese de que progressões dominantes permitem predição. Confirma que informação parcial basta para inferir próximo acorde com ~60–75% de precisão — benchmark para o que músicos experientes fazem intuitivamente. Suporta pedagogia de internalização de padrões estatísticos.
