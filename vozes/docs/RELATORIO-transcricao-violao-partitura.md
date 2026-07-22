# Relatório: Transcrição de violão → partitura / tablatura / GP5

**Data:** junho 2025  
**Contexto:** pipeline `repertorio-musicas/vozes/` — stems `guitar.wav` (htdemucs_6s) + transcrição atual (Basic Pitch + heurística)  
**Áudio de referência:** `01 Modinha` — Raphael Rabello & Ney Matogrosso (estúdio)

---

## 1. Resumo executivo

A abordagem atual (**Basic Pitch → MIDI → greedy fret assignment → tab ASCII**) é um **baseline de 2022**, instrument-agnostic, sem conhecimento de violão. Funciona parcialmente porque:

- produz **pitch + timing**, não **corda/traste**
- ignora **técnicas expressivas** (hammer-on, slide, bend, vibrato)
- não modela **ambiguidade de digitacao** (mesma nota em várias posições)
- quantiza mal músicas com **rubato** (Modinha, choro, bossa)

**Conclusão central:** em 2025–2026 **não existe** um único modelo open-source que faça `áudio → GP5 perfeito` para fingerstyle de estúdio. O estado da arte é um **pipeline modular** com modelos especializados por etapa. A fronteira prática para o álbum Rabello é:

```
guitar.wav → MPE guitar-aware (GAPS) → MIDI-to-Tab → GP5 → edição humana
```

Expectativa realista: **rascunho 65–85%** em stem limpo de estúdio; publicação profissional exige revisão manual.

---

## 2. Diagnóstico do pipeline atual

| Etapa atual | Ferramenta | Problema |
|-------------|-----------|----------|
| Separação | `htdemucs_6s` | ✅ Excelente — melhor decisão do projeto |
| Transcrição | Basic Pitch (Spotify, ICASSP 2022) | Instrument-agnostic; ~66–79% F50 em jazz real vs ~91% modelos guitar-specific |
| Fret assignment | Heurística greedy (`assign_frets`) | Não aprende estilo; minimiza traste, não playability |
| Tab | ASCII linear | Sem estrutura métrica, sem técnicas |
| GP5 | Não implementado | — |

### Dados da Modinha (`guitar.wav`)

| Métrica | Valor |
|---------|-------|
| Duração | 161,6 s |
| BPM estimado | ~96 (com rubato) |
| Onsets/min | ~233 |
| Polifonia média | ~6 notas/0,5 s |
| Basic Pitch | 878 notas, até 4 simultâneas |

Fingerstyle denso = caso **mais difícil** de AMT.

---

## 3. Panorama tecnológico 2024–2026

### 3.1 Evolução da área

```
2019  TabCNN          — primeiro audio → corda+traste (CNN)
2022  Basic Pitch     — instrument-agnostic, leve, popular
2022  MT3             — Transformer multitrack (Google/Magenta)
2023  FretNet         — pitch contínuo + tab (bends/vibrato)
2023  Perceiver TF    — supera MT3 em multitrack
2024  GAPS            — 14h violão clássico real, SOTA MIDI
2024  SynthTab        — 13.000h sintético → tab
2024  MIDI-to-Tab     — Transformer MIDI → 6 cordas
2025  TART            — 4 estágios: MPE + técnicas + tab
2025  Fretting-Transformer — T5 MIDI → TAB<string,fret>
2025  GOAT            — 35h DI elétrica + tab + técnicas
2025  Procedural fingerpicking — Karplus-Strong + CRNN
```

### 3.2 O que mudou desde Basic Pitch

1. **Saída com digitacao** — não só MIDI pitch
2. **Datasets guitar-specific** — GAPS, SynthTab, GOAT (vs GuitarSet 3h)
3. **Domain adaptation** — piano/high-res → violão (Riley, Kong)
4. **Geração procedural** — contornar escassez de dados reais
5. **Técnicas expressivas** — TART, Patil T5, FretNet pitch contínuo
6. **Export nativo GP5** — TabGrabber, Klangio, pyguitarpro

---

## 4. Modelos neurais — análise profunda

### Tier S — Melhores para violão nylon fingerstyle (stem isolado)

#### GAPS (Riley et al., ISMIR 2024)
- **O quê:** 300 performances, 14h, violão clássico/nylon, 200+ intérpretes
- **Modelo:** CRNN Kong (high-resolution piano transcription adaptado)
- **Saída:** MIDI (sem corda/traste)
- **Métricas:** F50 **91,2%** GuitarSet (supervisionado); **88,1%** zero-shot
- **Checkpoint:** `guitar-gaps.pth` — https://huggingface.co/xavriley/midi-transcription-models
- **Relevância Rabello:** ★★★★★ — nylon, fingerstyle, gravações reais diversas

#### Riley — High Resolution Domain Adaptation (ICASSP 2024)
- **O quê:** Score-audio alignment + fine-tune Kong em jazz guitar
- **F50:** 89,7% (GS+FL), 84,8% em jazz real
- **Demo:** https://xavriley.github.io/HighResolutionGuitarTranscription/

#### FretNet (Cwitkowitz, ICASSP 2023)
- **O quê:** Tab + **pitch contínuo** (bends, vibrato, slides)
- **Saída:** corda+traste + desvio de pitch
- **GitHub:** https://github.com/cwitkowitz/guitar-transcription-continuous
- **Limitação:** sem checkpoint público; treinar em GuitarSet
- **Relevância Rabello:** ★★★★★ para fraseado expressivo

### Tier A — Multitrack / generalistas melhorados

#### YourMT3+ (2024)
- Híbrido MT3 + Perceiver TF + Mixture of Experts
- F50 ~91% GuitarSet; melhor que MT3 em multitrack
- GitHub: https://github.com/mimbres/YourMT3

#### Perceiver TF (Lu et al., 2023)
- Supera MT3 em Slakh/URMP
- Base do ecossistema YourMT3

#### MT3 (Gardner et al., ICLR 2022)
- Transformer seq2seq, tokens MIDI
- GuitarSet supervisionado: 90%; **zero-shot: 32%** — não generaliza
- Colab com checkpoints; https://github.com/magenta/mt3

### Tier A — Tab end-to-end (áudio → corda+traste)

#### SynthTab + TabCNNx4 (ICASSP 2024)
- 13.000h sintético de DadaGP; Tab F1 ~79–80%
- https://synthtab.dev/

#### TabCNN (ISMIR 2019) — baseline fundacional
- CNN: CQT → 6×21 (corda × traste)
- MPE F1 ~78% frame-level

#### trimplexx CRNN (2025)
- MPE F1 **87,4%** GuitarSet — melhor treinado só em GS

### Tier B — Pesquisa de ponta (código limitado/ausente)

#### TART (2025) — **o mais completo conceitualmente**
- 4 estágios: (1) MPE adaptado, (2) classificação de técnicas MLP, (3) Transformer string/fret, (4) LSTM tab
- Primeiro framework com **fingerings + técnicas expressivas** de áudio
- Paper: https://arxiv.org/html/2510.02597
- **Código:** não público ainda

#### Patil T5 (SJSU 2025)
- CQT estéreo → tokens string/fret/timing/técnicas
- Dataset: 75k músicas, 5.134h — F global **30%** (mix real)
- Técnicas: hammer-on, bend, slide

#### Fretting-Transformer (2025)
- MIDI → TAB<string,fret> com T5; supera Guitar Pro em playability
- Implementação: https://github.com/Sidmaz666/open-fret

#### Procedural Fingerpicking (Klangio/KIT, 2025)
- Karplus-Strong + tab composition → CRNN
- Solo F1 **89,6%** após fine-tune em real
- Ideal para pretrain antes de poucos dados reais

### Tier C — Baseline atual

#### Basic Pitch (Spotify, 2022)
- Leve, rápido, pitch bend
- **Sem** corda/traste, **sem** técnicas
- F50 ~79% GuitarSet; ~66% jazz real
- Ainda útil como baseline rápido

---

## 5. Datasets

| Dataset | Tipo | Escala | Tab? | Áudio? | Fingerstyle? |
|---------|------|--------|------|--------|--------------|
| **GuitarSet** | Real hexaphonic | 3h, 360 clips | corda+traste | ✅ | Parcial (bossa) |
| **GAPS** | Real YouTube clássico | 14h, 300 peças | MIDI only | ✅ | ✅ flamenco/fingerstyle |
| **DadaGP** | Simbólico GP | 26k músicas, 1200h | ✅ GP5 | ❌ | Variado |
| **SynthTab** | Sintético | 13.000h | corda+traste | ✅ | ✅ |
| **GOAT** | Real DI elétrica | 35h | ✅ + técnicas | ✅ | Elétrica |
| **FrançoisLeduc** | Real jazz | 4h | MIDI | ✅ | Jazz |
| **EGDB** | Real+sim elétrica | 240+ | parcial | ✅ | Elétrica |

**Lacuna crítica:** nenhum benchmark para **violão nylon + fingerstyle brasileiro** (Rabello, choro, bossa com voz).

---

## 6. Métricas e expectativas realistas

| Cenário | F50 / F1 típico | Tab confiável? |
|---------|-----------------|----------------|
| GuitarSet test (supervisionado) | 88–91% | 75–80% Tab F1 |
| Stem guitar estúdio limpo | 70–90% | 60–75% |
| Fingerstyle comp (polifonia densa) | 75–80% | 50–65% |
| Mix completo (voz+violão) | 30–55% | impraticável |
| Basic Pitch em stem limpo | 65–79% | 40–55% |

**Tab F1** (nota na corda certa) é sistematicamente **10–20 pp abaixo** de pitch-only F1.

---

## 7. Ferramentas e pipelines

### 7.1 Open source — pipelines completos

| Ferramenta | Áudio→GP5 | Fingerstyle | Tier | URL |
|------------|-----------|-------------|------|-----|
| **TabGrabber** | ✅ | Médio | Experimental→Prod. local | https://github.com/topkoa/TabGrabber |
| **audio-to-gp** | ✅ (MIDI stems) | Fraco | Experimental | https://github.com/federicocunico/audio-to-gp |
| **AutoTablature** | ✅ | Não validado | Experimental | https://github.com/webprofusion/autotablature |
| **gtrsnipe** | Parcial | Médio | Experimental | https://github.com/scottvr/gtrsnipe |

**TabGrabber** é o OSS mais completo: Demucs → piptrack → tab → GP5/MusicXML/Sloppak.

### 7.2 Comerciais — produção

| Ferramenta | GP5 | MusicXML | Fingerstyle | URL |
|------------|-----|----------|-------------|-----|
| **Klangio Guitar2Tabs** | ✅ | ✅ | Clássico/fingerpicking | https://klang.io/guitar2tabs/ |
| **Songscription** | ✅ | ✅ | Acústico limpo | https://www.songscription.ai/ |
| **Tabtify** | ✅ | ✅ | Alegado | https://tabtify.com/ |
| **audio2guitar** | tabs | — | Mix banda | https://audio2guitar.com/ |

Úteis para **benchmark**: testar 20–30s do trecho mais difícil antes de pagar.

### 7.3 Middleware (MIDI → tab → GP5)

| Ferramenta | Função | Limitação |
|------------|--------|-----------|
| **MIDI-to-Tab** (ISMIR 2024) | MIDI → 6 cordas | Sem repo oficial |
| **Fretting-Transformer** | T5 MIDI→tab | Open-Fret WIP |
| **Tuttut** | HMM+Viterbi | Só ASCII |
| **Tayuya** | Escala + posição | Só solos, standard tuning |
| **PyGuitarPro** | Escrita GP3–5 | Não transcreve |
| **DadaGP encoder** | GP↔tokens | Simbólico only |

---

## 8. Arquitetura recomendada para o projeto

### 8.1 Pipeline alvo (3 fases)

```
FASE 1 — MVP (executável agora)
─────────────────────────────────
guitar.wav
  → guitar-gaps.pth (MIDI alta qualidade)
  → Open-Fret / Fretting-Transformer (digitacao)
  → PyGuitarPro → arranjo.gp5
  → arranjo.tab.txt (Tuttut)

FASE 2 — Qualidade expressiva
─────────────────────────────────
guitar.wav
  → FretNet (treinar em GuitarSet + fine-tune GAPS)
  → tab com pitch contínuo (vibrato/bends)
  → merge com análise de seções (librosa)

FASE 3 — Produção
─────────────────────────────────
guitar.wav
  → TART (quando código público)
  → ou fine-tune Patil-style em faixas Rabello anotadas manualmente
  → GP5 + MusicXML + revisão no Guitar Pro 8
```

### 8.2 Comparação: rustic vs moderno

| Aspecto | Pipeline atual | Pipeline moderno |
|---------|---------------|------------------|
| MPE | Basic Pitch (generic) | GAPS / FretNet (guitar) |
| Digitacao | Greedy heuristic | MIDI-to-Tab / Fretting-T (learned) |
| Técnicas | Nenhuma | FretNet / TART |
| Export | ASCII tab | GP5 + MusicXML |
| Rubato | BPM fixo | Grid flexível / beat tracking local |
| Dados | Nenhum | GAPS + DadaGP pretrain |

### 8.3 Integração com pipeline existente

O `extrair-voz.sh` já entrega o **input ideal** (`guitar.wav`). A transcrição deve ser **etapa separada**:

```bash
# Novo script proposto
./transcrever-violao.sh "stems/htdemucs/01 Modinha.../guitar.wav"
# Saída:
#   arranjo/arranjo.mid      (GAPS)
#   arranjo/arranjo.tab.txt  (Open-Fret)
#   arranjo/arranjo.gp5      (PyGuitarPro)
#   arranjo/analise.json     (BPM, tom, seções)
```

**Não integrar na pipeline de extração** — transcrição é lenta (GPU) e experimental.

---

## 9. Roadmap sugerido

| # | Entrega | Esforço | Impacto |
|---|---------|---------|---------|
| 1 | Integrar **GAPS** (`guitar-gaps.pth`) no lugar de Basic Pitch | 1–2 dias | ★★★★★ |
| 2 | **Open-Fret** ou MIDI-to-Tab para digitacao | 2–3 dias | ★★★★☆ |
| 3 | Export **GP5** via PyGuitarPro | 1 dia | ★★★★☆ |
| 4 | Benchmark **Klangio** vs pipeline local (Modinha) | 1h | ★★★☆☆ |
| 5 | Avaliar **TabGrabber** end-to-end | 1 dia | ★★★☆☆ |
| 6 | Treinar **FretNet** (GPU, GuitarSet) | 1–2 semanas | ★★★★★ |
| 7 | Fine-tune em 2–3 faixas Rabello **anotadas manualmente** | contínuo | ★★★★★ |
| 8 | Monitorar **TART** / **GOAT AGTT** releases | passivo | ★★★★★ |

---

## 10. Limitações estruturais (honestas)

1. **Nenhum modelo** atinge tab profissional sem edição humana
2. **7ª corda** (Rabello) — todos os modelos assumem 6 cordas EADGBE
3. **Rubato** da Modinha/choro — quantização rígida falha
4. **Bleed vocal** residual no stem — segunda passagem Demucs pode ajudar
5. **Direitos** — DadaGP/GAPS têm restrições de redistribuição
6. **GPU** — GAPS/FretNet/TabGrabber beneficiam-se de CUDA; CPU funciona mas lento
7. **TART/GOAT** — melhor arquitetura, código ainda fechado

---

## 11. Referências principais

### Papers
- MT3: https://arxiv.org/abs/2111.03017
- Basic Pitch: https://arxiv.org/abs/2203.09893
- FretNet: https://arxiv.org/abs/2212.03023
- Riley ICASSP 2024: https://arxiv.org/abs/2402.15258
- GAPS ISMIR 2024: https://arxiv.org/abs/2408.08653
- SynthTab: https://arxiv.org/abs/2309.09085
- MIDI-to-Tab: https://arxiv.org/html/2408.05024v1
- Fretting-Transformer: https://arxiv.org/abs/2506.14223
- TART: https://arxiv.org/html/2510.02597
- Procedural fingerpicking: https://arxiv.org/html/2508.07987
- GOAT: https://arxiv.org/abs/2509.22655
- YourMT3+: https://arxiv.org/abs/2407.04822
- Patil thesis: https://scholarworks.sjsu.edu/cgi/viewcontent.cgi?article=9292

### Código e modelos
- GAPS checkpoint: https://huggingface.co/xavriley/midi-transcription-models
- amt-tools (FretNet/TabCNN): https://github.com/cwitkowitz/amt-tools
- TabGrabber: https://github.com/topkoa/TabGrabber
- Open-Fret: https://github.com/Sidmaz666/open-fret
- DadaGP: https://github.com/dada-bots/dadaGP
- SynthTab: https://github.com/yongyizang/SynthTab
- PyGuitarPro: https://github.com/Perlence/PyGuitarPro
- YourMT3: https://github.com/mimbres/YourMT3

### Comerciais (benchmark)
- Klangio: https://klang.io/guitar2tabs/
- Songscription: https://www.songscription.ai/

---

## 12. Conclusão

O pipeline atual não está "errado" — está **2–3 gerações atrás** do estado da arte guitar-specific. A separação (`htdemucs_6s`) já é excelente. O gargalo é **transcrição + digitacao**.

**Próximo passo de maior ROI:** substituir Basic Pitch por **GAPS** (`guitar-gaps.pth`) + **Open-Fret** para GP5. Isso é executável em dias, não meses, e deve elevar qualidade de ~50% para ~70–80% em stems de estúdio.

Para chegar perto de partitura "publicável" do arranjo Rabello, o caminho é **modelo moderno + fine-tune em poucas faixas anotadas manualmente + edição no Guitar Pro** — não um único modelo mágico.
