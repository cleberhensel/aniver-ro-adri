# [DA-046]: Deep pass — Probabilidade estatística de progressões (Hooktheory)

**Sources**: [SRC-046](../02-raw-discovery/046-SRC-hooktheory-markov-chord-probabilities.md)

---

## Síntese estendida

Além da teoria funcional (o que *deveria* vir), existe evidência empírica do que *realmente* vem nas músicas pop analisadas. Hooktheory indexou 70.000+ músicas e aplica **análise de Markov**: dado acorde X, qual a probabilidade do próximo?

### Descobertas-chave

- Após **I**, **V** aparece ~31% das vezes — o movimento mais provável.
- A progressão **I–V–vi–IV** ("axis progression") emerge seguindo cadeias de máxima probabilidade repetidamente.
- Rotacionar a mesma sequência (vi–IV–I–V) muda color emocional mantendo 4 acordes diatônicos.

### Implicação prática para acompanhamento ao vivo

Quando você ouve o cantor começar e identifica o **I** (tom estabelecido):

```
Se ouvi I → aposte V ou vi como próximo
Se ouvi V → aposte I (resolução) ou vi (decepção pop)
Se ouvi vi → aposte IV (axis) ou V
Se ouvi IV → aposte I ou V
```

Isso **não substitui** o ouvido — é rede de segurança enquanto confirma qualidade (maior/menor/7ª) em tempo real.

### Ferramenta de estudo

[Hooktheory Trends](https://www.hooktheory.com/trends) permite clicar acordes e ver probabilidades + lista de músicas que usam a sequência — treino de pattern matching auditivo.

## Limitações

- Database enviesada para pop anglo e música indexada por usuários.
- MPB/bossa sub-representada — combinar com padrões Jobim [DA-048].
