(function () {
  'use strict';

  const STORAGE_KEY = 'harmonia-funcional-curso-progress';

  function getProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveProgress(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    updateProgressBar();
  }

  function initNav() {
    const nav = document.getElementById('sidebar-nav');
    if (!nav || typeof THEORY === 'undefined') return;

    const current = window.location.pathname.split('/').pop() || 'index.html';
    let html = '';
    let lastPhase = -1;

    THEORY.modules.forEach(m => {
      if (m.phase !== lastPhase && m.phase > 0) {
        const labels = { 1: 'Fase 1 — Fundamentos', 2: 'Fase 2 — Funções e acordes', 3: 'Fase 3 — Progressões e ouvido', 4: 'Fase 4 — Ao vivo e MPB' };
        html += `<div class="nav-phase">${labels[m.phase] || ''}</div>`;
        lastPhase = m.phase;
      }
      const active = m.file === current ? ' active' : '';
      const done = getProgress()[m.id] ? ' ✓' : '';
      html += `<a class="nav-module${active}" href="${m.file}">${m.title}${done}</a>`;
    });
    nav.innerHTML = html;
  }

  function updateProgressBar() {
    const bar = document.getElementById('course-progress-bar');
    if (!bar || typeof THEORY === 'undefined') return;
    const prog = getProgress();
    const modules = THEORY.modules.filter(m => m.id !== 'index' && m.id !== 'tools');
    const done = modules.filter(m => prog[m.id]).length;
    const pct = Math.round((done / modules.length) * 100);
    bar.style.width = pct + '%';
    const label = document.getElementById('course-progress-label');
    if (label) label.textContent = `${done}/${modules.length} módulos (${pct}%)`;
  }

  function initAccordions() {
    document.querySelectorAll('.accordion-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.accordion-item');
        item.classList.toggle('open');
      });
    });
  }

  function initMarkComplete() {
    const btn = document.getElementById('mark-module-complete');
    if (!btn) return;
    const moduleId = btn.dataset.module;
    const prog = getProgress();
    if (prog[moduleId]) btn.textContent = '✓ Módulo concluído';
    btn.addEventListener('click', () => {
      prog[moduleId] = true;
      saveProgress(prog);
      btn.textContent = '✓ Módulo concluído';
      initNav();
    });
  }

  function initTransposer() {
    const root = document.getElementById('transposer');
    if (!root) return;

    const keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const progSelect = document.getElementById('trans-prog');
    const fromKey = document.getElementById('trans-from');
    const toKey = document.getElementById('trans-to');
    const out = document.getElementById('trans-result');

    if (fromKey) {
      keys.forEach(k => {
        fromKey.innerHTML += `<option value="${k}">${k}</option>`;
        toKey.innerHTML += `<option value="${k}">${k}</option>`;
      });
      toKey.value = 'G';
    }

    function run() {
      const progKey = progSelect.value;
      const p = THEORY.progressions[progKey];
      const from = fromKey.value;
      const to = toKey.value;
      const nums = p.nums.filter(n => typeof n === 'number' || /^\d/.test(String(n)));
      const simpleNums = p.nums.map(n => (typeof n === 'number' ? n : parseInt(String(n), 10)));
      const fromC = numsToChords(simpleNums.filter(n => !isNaN(n)), from);
      const toC = numsToChords(simpleNums.filter(n => !isNaN(n)), to);
      out.innerHTML = `<strong>${p.name}</strong> (${p.genre})<br><br>
        Tom ${from}: <div class="chord-grid">${fromC.map(c => `<span class="chord-pill">${c}</span>`).join('')}</div><br>
        Tom ${to}: <div class="chord-grid">${toC.map(c => `<span class="chord-pill">${c}</span>`).join('')}</div><br><br>
        Números: <code>${p.nums.join(' – ')}</code> &nbsp;|&nbsp; Romanos: <code>${p.roman.join(' – ')}</code>`;
      if (window.initChordDiagrams) window.initChordDiagrams(out);
    }

    document.getElementById('trans-run')?.addEventListener('click', run);
    run();
  }

  function initKeyField() {
    const root = document.getElementById('key-field-tool');
    if (!root) return;
    const keySel = document.getElementById('kf-key');
    const out = document.getElementById('kf-result');
    ['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Eb'].forEach(k => {
      keySel.innerHTML += `<option value="${k}">${k}</option>`;
    });

    function render() {
      const chords = getDiatonicChords(keySel.value);
      let html = '<table><tr><th>Grau</th><th>Rom.</th><th>NNS</th><th>Função</th><th>Acorde</th><th>Sensação</th></tr>';
      const feels = {
        T: 'Repouso, casa, estabilidade',
        SD: 'Movimento, abertura, preparação',
        'T*': 'Tônica fraca, passagem',
        D: 'Tensão, quer resolver'
      };
      chords.forEach(c => {
        const fnClass = c.function.startsWith('T') ? 'T' : c.function;
        html += `<tr><td>${c.degree}</td><td>${c.roman}</td><td>${c.nashville}</td>
          <td><span class="fn-badge fn-badge-${fnClass}">${c.function}</span></td>
          <td><strong>${c.chord}</strong></td><td>${feels[c.function] || ''}</td></tr>`;
      });
      html += '</table>';
      out.innerHTML = html;
      if (window.initChordDiagrams) window.initChordDiagrams(out);
    }
    keySel.addEventListener('change', render);
    render();
  }

  function initPredictor() {
    const root = document.getElementById('predictor-tool');
    if (!root) return;
    const after = document.getElementById('pred-after');
    const genre = document.getElementById('pred-genre');
    const out = document.getElementById('pred-result');
    [1, 4, 5, 6, 2].forEach(n => {
      after.innerHTML += `<option value="${n}">Após grau ${n}</option>`;
    });

    const genreMap = {
      pop: { data: THEORY.markovPop, label: 'Pop anglo (Hooktheory)' },
      bossa: { data: THEORY.markovBossa, label: 'Bossa nova / MPB harmônica' },
      samba: { data: THEORY.markovSamba, label: 'Samba / choro funcional' }
    };

    function run() {
      const n = parseInt(after.value, 10);
      const g = genre?.value || 'pop';
      const src = genreMap[g] || genreMap.pop;
      const opts = src.data[n] || [];
      if (!opts.length) {
        out.textContent = 'Sem dados estatísticos para este grau.';
        return;
      }
      out.innerHTML = opts.map(o =>
        `<div style="margin:0.5rem 0"><strong>Grau ${o.to}</strong> — ~${o.pct}% probabilidade</div>`
      ).join('') + `<p style="font-size:0.85rem;color:var(--text-muted);margin-top:1rem">Fonte: ${src.label}. Use como aposta inicial; confirme pelo ouvido.</p>`;
    }
    document.getElementById('pred-run')?.addEventListener('click', run);
    genre?.addEventListener('change', run);
    after?.addEventListener('change', run);
    run();
  }

  function initFunctionQuiz() {
    const root = document.getElementById('function-quiz');
    if (!root) return;
    const questions = [
      { chord: 'V / G em tom C', options: ['Tônica', 'Subdominante', 'Dominante'], answer: 2 },
      { chord: 'IV / F em tom C', options: ['Tônica', 'Subdominante', 'Dominante'], answer: 1 },
      { chord: 'vi / Am em tom C', options: ['Tônica relativa', 'Subdominante', 'Dominante'], answer: 0 },
      { chord: 'ii / Dm em tom C', options: ['Tônica', 'Subdominante', 'Dominante'], answer: 1 },
      { chord: 'vii° / Bdim em tom C', options: ['Tônica', 'Subdominante', 'Dominante'], answer: 2 },
      { chord: 'Após V, o mais provável é…', options: ['I (tônica)', 'iii', 'bVII'], answer: 0 },
      { chord: 'D7 em tom C (fora do campo)', options: ['Erro', 'Dominante secundária V/V', 'Modulação'], answer: 1 }
    ];
    let idx = 0;
    let score = 0;
    const qEl = document.getElementById('quiz-question');
    const optsEl = document.getElementById('quiz-options');
    const scoreEl = document.getElementById('quiz-score');

    function show() {
      if (idx >= questions.length) {
        qEl.textContent = `Fim! Pontuação: ${score}/${questions.length}`;
        optsEl.innerHTML = '<button class="btn" id="quiz-restart">Recomeçar</button>';
        document.getElementById('quiz-restart')?.addEventListener('click', () => { idx = 0; score = 0; show(); });
        return;
      }
      const q = questions[idx];
      qEl.textContent = q.chord;
      optsEl.innerHTML = q.options.map((o, i) =>
        `<button class="quiz-option" data-i="${i}">${o}</button>`
      ).join('');
      optsEl.querySelectorAll('.quiz-option').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.dataset.i, 10);
          if (i === q.answer) { btn.classList.add('correct'); score++; }
          else { btn.classList.add('wrong'); optsEl.children[q.answer]?.classList.add('correct'); }
          scoreEl.textContent = `Acertos: ${score}`;
          setTimeout(() => { idx++; show(); }, 800);
        });
      });
    }
    show();
  }

  function initChecklist() {
    document.querySelectorAll('[data-checklist]').forEach(list => {
      const id = list.dataset.checklist;
      const prog = getProgress();
      const saved = prog['check_' + id] || {};
      list.querySelectorAll('input[type=checkbox]').forEach((cb, i) => {
        cb.checked = !!saved[i];
        cb.addEventListener('change', () => {
          saved[i] = cb.checked;
          prog['check_' + id] = saved;
          saveProgress(prog);
        });
      });
    });
  }

  function initCifraConverter() {
    const root = document.getElementById('cifra-converter');
    if (!root) return;
    const input = document.getElementById('cc-input');
    const key = document.getElementById('cc-key');
    const out = document.getElementById('cc-output');
    ['C', 'G', 'D', 'A', 'E', 'F', 'Am', 'Em'].forEach(k => {
      key.innerHTML += `<option value="${k.replace('m', '')}">${k}</option>`;
    });

    document.getElementById('cc-run')?.addEventListener('click', () => {
      const text = input.value.trim();
      const rootKey = key.value;
      const diatonic = getDiatonicChords(rootKey);
      const map = {};
      diatonic.forEach(d => { map[d.chord.toLowerCase()] = d.nashville; });

      const parts = text.split(/[\s–\-|]+/).filter(Boolean);
      const nums = parts.map(p => {
        const found = diatonic.find(d => d.chord.toLowerCase() === p.toLowerCase());
        return found ? found.nashville : '?';
      });
      out.innerHTML = `Números: <code>${nums.join(' – ')}</code><br>
        <div class="chord-grid" style="margin-top:0.75rem">${parts.map(p => `<span class="chord-pill">${p}</span>`).join('')}</div>
        <p style="margin-top:0.75rem;font-size:0.9rem">Para transpor: mantenha os números, troque apenas o tom (1 = nova tônica).</p>`;
      if (window.initChordDiagrams) window.initChordDiagrams(out);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    updateProgressBar();
    initAccordions();
    initMarkComplete();
    initTransposer();
    initKeyField();
    initPredictor();
    initFunctionQuiz();
    initChecklist();
    initCifraConverter();
    if (window.initChordDiagrams) window.initChordDiagrams();
  });
})();
