// ─── BECOMING · onboarding.js ────────────────────────────────────────────────
// 4-Schritte-Onboarding für neue Nutzer

const _OB_META = {
  disciplined: {
    label: 'The Disciplined',
    desc:  'Selbstkontrolle, Struktur und konsequente Routinen als Fundament deiner Entwicklung.',
    color: 'var(--disciplined)',
  },
  curious: {
    label: 'The Curious',
    desc:  'Tägliches Lernen, Offenheit für Neues und geistige Bewegung als Wachstumsweg.',
    color: 'var(--curious)',
  },
  resilient: {
    label: 'The Resilient',
    desc:  'Innere Stärke durch bewusste Erholung, Anpassung und Durchhaltevermögen.',
    color: 'var(--resilient)',
  },
  intentional: {
    label: 'The Intentional',
    desc:  'Klare Prioritäten, weniger Ablenkung und bewusste Entscheidungen als Praxis.',
    color: 'var(--intentional)',
  },
  connected: {
    label: 'The Connected',
    desc:  'Echte Präsenz, Empathie und tiefere Beziehungen als tägliche Entwicklung.',
    color: 'var(--connected)',
  },
};

const _OB_GOALS = [
  { key: 'disciplined',  label: 'Mehr Selbstkontrolle & Struktur' },
  { key: 'curious',      label: 'Neugier & Wissen vertiefen' },
  { key: 'resilient',    label: 'Erholung & innere Stärke aufbauen' },
  { key: 'intentional',  label: 'Fokus & Klarheit gewinnen' },
  { key: 'connected',    label: 'Beziehungen & Verbundenheit stärken' },
];

// ─── State ────────────────────────────────────────────────────────────────────

let _obState = { step: 1, persona: null, firstHabitId: null };
let _obOverlay = null;

function _saveObState() {
  localStorage.setItem('becoming_ob_state', JSON.stringify(_obState));
}

function _loadObState() {
  try {
    const raw = localStorage.getItem('becoming_ob_state');
    if (raw) _obState = { ..._obState, ...JSON.parse(raw) };
  } catch (_) {}
}

function _clearObState() {
  localStorage.removeItem('becoming_show_onboarding');
  localStorage.removeItem('becoming_ob_state');
}

// ─── Einstiegspunkt ───────────────────────────────────────────────────────────

function initOnboarding() {
  if (localStorage.getItem('becoming_show_onboarding') !== 'true') return;
  _loadObState();
  _render();
}

// ─── Overlay-Gerüst ───────────────────────────────────────────────────────────

function _render() {
  _obOverlay?.remove();
  _obOverlay = document.createElement('div');
  _obOverlay.className = 'ob-overlay';
  _obOverlay.setAttribute('role', 'dialog');
  _obOverlay.setAttribute('aria-modal', 'true');
  _obOverlay.setAttribute('aria-label', 'Onboarding');

  _obOverlay.innerHTML = `
    <div class="ob-card">
      <div class="ob-header">
        <div class="ob-progress">${_obState.step} / 4</div>
        <button class="ob-skip" type="button" id="obSkip">Überspringen</button>
      </div>
      <div class="ob-dots">
        ${[1,2,3,4].map(n =>
          `<div class="ob-dot${n === _obState.step ? ' ob-dot--active' : ''}"></div>`
        ).join('')}
      </div>
      <div class="ob-body" id="obBody"></div>
    </div>
  `;

  document.body.appendChild(_obOverlay);
  document.getElementById('obSkip').addEventListener('click', _skip);

  _renderStep();
}

function _renderStep() {
  const body = document.getElementById('obBody');
  if (!body) return;

  switch (_obState.step) {
    case 1: _renderStep1(body); break;
    case 2: _renderStep2(body); break;
    case 3: _renderStep3(body); break;
    case 4: _renderStep4(body); break;
  }
}

// ─── Schritt 1: Konzept-Erklärung ─────────────────────────────────────────────

function _renderStep1(body) {
  body.innerHTML = `
    <div class="ob-icon-wrap">
      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
        <path d="M12 8v4l3 3"/>
      </svg>
    </div>
    <h2 class="ob-headline">"Du wirst, was du täglich tust."</h2>
    <p class="ob-text">
      Becoming basiert auf einem einfachen Prinzip: Deine Identität entsteht nicht durch große Entschlüsse,
      sondern durch kleine, tägliche Handlungen.
    </p>
    <p class="ob-text">
      Statt abstrakte Ziele zu setzen, wählst du eine <strong>Persona</strong> — eine Version deiner selbst,
      die du entwickeln willst — und baust Schritt für Schritt die passenden Gewohnheiten auf.
    </p>
    <button class="btn-primary ob-next" type="button" id="ob1Next">Weiter →</button>
  `;
  document.getElementById('ob1Next').addEventListener('click', () => _goTo(2));
}

// ─── Schritt 2: Ziel-Auswahl ──────────────────────────────────────────────────

function _renderStep2(body) {
  body.innerHTML = `
    <h2 class="ob-headline">Was willst du verändern?</h2>
    <p class="ob-subtext">Wähle einen Fokus — wir empfehlen dir die passende Persona.</p>
    <div class="ob-goals" id="obGoals">
      ${_OB_GOALS.map(g => `
        <button class="ob-goal${_obState.persona === g.key ? ' ob-goal--selected' : ''}"
                type="button" data-persona="${g.key}">
          ${g.label}
        </button>
      `).join('')}
    </div>
    <button class="btn-primary ob-next" type="button" id="ob2Next"
      ${_obState.persona ? '' : 'disabled'}>Weiter →</button>
  `;

  document.querySelectorAll('.ob-goal').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ob-goal').forEach(b => b.classList.remove('ob-goal--selected'));
      btn.classList.add('ob-goal--selected');
      _obState.persona = btn.dataset.persona;
      _saveObState();
      document.getElementById('ob2Next').disabled = false;
    });
  });

  document.getElementById('ob2Next').addEventListener('click', () => _goTo(3));
}

// ─── Schritt 3: Persona-Detail ────────────────────────────────────────────────

function _renderStep3(body) {
  const persona = _obState.persona || 'disciplined';
  const meta    = _OB_META[persona];
  const habits  = (typeof getLevel1HabitsForPersona === 'function')
    ? getLevel1HabitsForPersona(persona).slice(0, 4)
    : [];

  body.innerHTML = `
    <div class="ob-persona-visual" style="background:${meta.color};"></div>
    <h2 class="ob-headline">${meta.label}</h2>
    <p class="ob-text">${meta.desc}</p>
    ${habits.length > 0 ? `
      <div class="ob-habits-preview">
        <h4>Deine Level 1 Habits:</h4>
        <ul>
          ${habits.map(h => `<li>${h.title}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
    <button class="btn-primary ob-next" type="button" id="ob3Start">Diese Persona starten</button>
    <button class="ob-back-link" type="button" id="ob3Back">← Anderen Fokus wählen</button>
  `;

  document.getElementById('ob3Back').addEventListener('click', () => _goTo(2));
  document.getElementById('ob3Start').addEventListener('click', async () => {
    const btn = document.getElementById('ob3Start');
    btn.disabled = true;
    btn.textContent = 'Wird eingerichtet …';
    try {
      await unlockPersonaAsync(persona);
      await setActivePersonaAsync(persona);
      _goTo(4);
    } catch (err) {
      console.error('[onboarding] Persona-Setup fehlgeschlagen:', err.message);
      btn.disabled = false;
      btn.textContent = 'Diese Persona starten';
      if (typeof showToast === 'function') showToast('Einrichtung fehlgeschlagen – bitte erneut versuchen.', 'error');
    }
  });
}

// ─── Schritt 4: Erste Habit abhaken ──────────────────────────────────────────

function _renderStep4(body) {
  const persona = _obState.persona || 'disciplined';
  const habits  = (typeof getLevel1HabitsForPersona === 'function')
    ? getLevel1HabitsForPersona(persona)
    : [];
  const first = habits[0];

  body.innerHTML = `
    <div class="ob-check-icon">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    </div>
    <h2 class="ob-headline">Perfekt! Du bist bereit.</h2>
    <p class="ob-text">Hake deine erste Habit ab — starte deinen ersten Tag.</p>
    ${first ? `
      <label class="ob-first-habit">
        <input type="checkbox" class="ob-habit-check" id="obFirstHabitCheck">
        <span class="ob-habit-label">${first.title}</span>
      </label>
    ` : ''}
    <a href="dashboard.html" class="btn-primary ob-finish" id="ob4Finish">Zum Dashboard</a>
  `;

  const checkEl = document.getElementById('obFirstHabitCheck');
  if (checkEl && first) {
    checkEl.addEventListener('change', async () => {
      if (checkEl.checked) {
        try {
          const today = new Date().toISOString().split('T')[0];
          await completeHabit(first.id, persona, today);
          checkEl.closest('label')?.classList.add('ob-first-habit--done');
        } catch (_) {}
      }
    });
  }

  document.getElementById('ob4Finish').addEventListener('click', () => {
    _clearObState();
  });
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function _goTo(step) {
  _obState.step = step;
  _saveObState();
  _render();
}

function _skip() {
  _clearObState();
  _obOverlay?.remove();
  _obOverlay = null;
}
