# Repertório

Player simples estilo Spotify para ouvir as faixas do repertório.

**Site:** após publicar no GitHub Pages, ficará em  
`https://SEU_USUARIO.github.io/repertorio-musicas/`

## Conteúdo

- `index.html` — player na raiz (página do GitHub Pages)
- `completo.mp3` — faixa original completa (fora da playlist)
- `01-` a `16-*.mp3` — faixas numeradas da playlist
- `fatiador/` — ferramenta local para fatiar áudio (não usada no site)

## Publicar no GitHub Pages

### 1. Criar o repositório no GitHub

Crie um repositório **público** chamado `repertorio-musicas` (sem README, sem .gitignore).

### 2. Enviar o código

```bash
cd repertorio-musicas
git add .
git commit -m "Publica player de músicas para GitHub Pages"
git remote add origin https://github.com/SEU_USUARIO/repertorio-musicas.git
git push -u origin main
```

> O push pode demorar: os MP3s somam ~127 MB. O `completo.mp3` tem ~75 MB (abaixo do limite de 100 MB do GitHub).

### 3. Ativar o GitHub Pages

1. No GitHub: **Settings** → **Pages**
2. **Build and deployment** → Source: **Deploy from a branch**
3. Branch: **main** / pasta **/ (root)**
4. Salvar

Em 1–2 minutos o site estará no ar.

## Testar localmente

```bash
python3 -m http.server 8765
```

Abra `http://localhost:8765`
