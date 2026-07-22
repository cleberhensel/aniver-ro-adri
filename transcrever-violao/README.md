# transcrever-violao

Módulo **isolado** do pipeline `vozes/`. Transcreve o stem de violão para MIDI, tablatura e GP5.

Não é chamado por `extrair-voz.sh` — roda sob demanda, depois que `guitar.wav` já existe.

## Pipeline (Fase 1)

```
guitar.wav
  → GAPS (guitar-gaps.pth / HuggingFace)
  → arranjo.mid
  → digitacao heurística (corda/traste)
  → arranjo.tab.txt + arranjo.gp5 + analise.json
```

## Instalação

```bash
cd transcrever-violao
chmod +x install.sh transcrever.sh
./install.sh
```

Cria um venv local em `.venv/` com dependências próprias (PyTorch, GAPS, etc.).

## Uso

```bash
# Arquivo de áudio
./transcrever.sh "../vozes/stems/htdemucs/01 Modinha.../guitar.wav"

# Pasta do stem (procura guitar.wav ou no_vocals.wav)
./transcrever.sh "../vozes/stems/htdemucs/01 Modinha.../"

# Saída customizada
./transcrever.sh guitar.wav -o ./saida/

# Sem GP5 (mais rápido)
./transcrever.sh guitar.wav --skip-gp5

# BPM fixo (útil em rubato)
./transcrever.sh guitar.wav --bpm 96
```

## Saídas (padrão: `<stem>/transcricao/`)

| Arquivo | Descrição |
|---------|-----------|
| `arranjo.mid` | MIDI do GAPS |
| `arranjo.tab.txt` | Tablatura ASCII (rascunho) |
| `arranjo.gp5` | Guitar Pro 5 — abrir e revisar |
| `analise.json` | BPM, contagem de notas, eventos com digitacao |
| `resumo.json` | Metadados leves para o viewer web |
| `arranjo.alphatex.txt` | Partitura/tab para alphaTab no browser |
| `playback.json` | Notas compactas (preview MIDI) |
| `arranjo.gp5` | Abrir no Guitar Pro desktop |

### Ver no browser

Um servidor único lista todas as transcrições e serve stem + tab + player:

```bash
cd transcrever-violao
node server.mjs          # http://localhost:8765/
# ou: ./servir.sh

# Regenerar só os assets web (sem rodar GAPS de novo)
./transcrever.sh --assets-only "../vozes/stems/htdemucs/01 Modinha.../transcricao"
```

## Limitações (Fase 1)

- Digitacao por heurística, não por modelo aprendido (Open-Fret / Fretting-Transformer = Fase 2).
- BPM fixo detectado no áudio — rubato não é modelado.
- Sem técnicas expressivas (bend, slide, hammer-on).
- Resultado é **rascunho** (~65–85% em stem limpo); revisão manual no Guitar Pro é esperada.

## Referências

- [GAPS / guitar-gaps.pth](https://huggingface.co/xavriley/midi-transcription-models)
- [hf_midi_transcription](https://github.com/xavriley/hf_midi_transcription)
- Relatório interno: `../vozes/docs/RELATORIO-transcricao-violao-partitura.md`
