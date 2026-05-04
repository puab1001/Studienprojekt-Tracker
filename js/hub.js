// ─── BECOMING · hub.js ───────────────────────────────────────────────────────
// Persona Hub: aktive Personas mit echten Daten, Persona hinzufügen

const HUB_PERSONA_HABITS_COUNT = {
  disciplined: 5,
  curious:     4,
  resilient:   4,
  intentional: 4,
  connected:   4,
};

const HUB_PERSONA_META = {
  disciplined: {
    label: 'The Disciplined',
    desc:  'Selbstkontrolle, Routine und bewusste Entscheidungen für mehr Stabilität im Alltag.',
    color: 'var(--disciplined)',
    href:  '/dashboard.html',
  },
  curious: {
    label: 'The Curious',
    desc:  'Lernen, Offenheit und tägliche geistige Bewegung durch kleine, konsequente Impulse.',
    color: 'var(--curious)',
    href:  '/dashboard.html',
  },
  resilient: {
    label: 'The Resilient',
    desc:  'Erholung, Anpassung und Durchhaltevermögen ohne dich dabei selbst zu verlieren.',
    color: 'var(--resilient)',
    href:  '/dashboard.html',
  },
  intentional: {
    label: 'The Intentional',
    desc:  'Bewusste Entscheidungen und klare Prioritäten für einen fokussierten Tag.',
    color: 'var(--intentional)',
    href:  '/dashboard.html',
  },
  connected: {
    label: 'The Connected',
    desc:  'Präsenz, Empathie und stärkere Beziehungen durch bewusste soziale Gewohnheiten.',
    color: 'var(--connected)',
    href:  '/dashboard.html',
  },
};

const ALL_PERSONAS     = ['disciplined', 'curious', 'resilient', 'intentional', 'connected'];

document.addEventListener('DOMContentLoaded', () => {

  personalizeWelcome();
  renderPersonaList();
  renderAddSection();
  initAddPersonaFlow();

});

function personalizeWelcome() {
  const user = getUser();
  if (!user) return;
  const el = document.getElementById('welcomeTitle');
  if (el) el.textContent = `Willkommen zurück, ${user.name.split(' ')[0]}`;
}

// ─── Persona-Liste rendern ────────────────────────────────────────────────────

function renderPersonaList() {
  const list = document.querySelector('.persona-list');
  if (!list) return;

  const unlocked = getUnlockedPersonas();
  const today    = getTodayKey();
  const data     = getHabitData();

  list.innerHTML = unlocked.map(key => {
    const meta    = HUB_PERSONA_META[key];
    const total   = HUB_PERSONA_HABITS_COUNT[key] || 4;
    const done    = data[today]?.[key]?.length || 0;
    const pct     = total ? Math.round((done / total) * 100) : 0;
    const streak  = calcStreak(key);
    const weeklyXP = calcWeeklyXP(key);
    const isActive = getActivePersona() === key;

    return `
      <article class="persona-card ${isActive ? 'persona-card--active' : ''}">
        <div class="persona-visual" style="background: ${meta.color};"></div>
        <div class="persona-content">
          <h3>${meta.label}</h3>
          <p>${meta.desc}</p>
          <div class="progress-row">
            <div class="progress-track">
              <div class="progress-fill" style="width: ${pct}%;"></div>
            </div>
            <span class="progress-label">Heute ${done}/${total} erledigt</span>
          </div>
          <div class="persona-meta-row">
            <span class="persona-meta">🔥 ${streak} ${streak === 1 ? 'Tag' : 'Tage'}</span>
            <span class="persona-meta">+${weeklyXP} XP diese Woche</span>
          </div>
        </div>
        <a href="${meta.href}" class="btn-primary" data-persona="${key}">
          ${done > 0 ? 'Weiter' : 'Starten'}
        </a>
      </article>
    `;
  }).join('');

  // Klick auf "Weiter/Starten" → Persona aktivieren
  list.querySelectorAll('[data-persona]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      setActivePersona(btn.dataset.persona);
      window.location.href = btn.getAttribute('href');
    });
  });
}

// ─── Add-Persona-Sektion ──────────────────────────────────────────────────────

function renderAddSection() {
  const unlocked    = getUnlockedPersonas();
  const available   = ALL_PERSONAS.filter(p => !unlocked.includes(p));
  const addCard     = document.getElementById('addPersonaCard');

  // Alle freigeschaltet → Karte ausblenden
  if (available.length === 0 && addCard) {
    addCard.style.display = 'none';
    return;
  }

  // Verfügbare Karten neu bauen
  const grid = document.querySelector('.persona-selection-grid');
  if (!grid) return;

  grid.innerHTML = available.map(key => {
    const meta = HUB_PERSONA_META[key];
    return `
      <button class="persona-selection-card" type="button" data-persona="${key}">
        <div class="persona-selection-visual" style="background: ${meta.color};"></div>
        <h4>${meta.label}</h4>
        <p>${meta.desc}</p>
      </button>
    `;
  }).join('');

  // Klick → freischalten & weiterleiten
  grid.querySelectorAll('[data-persona]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.persona;
      unlockPersona(key);
      setActivePersona(key);
      window.location.href = '/dashboard.html';
    });
  });
}

// ─── Add-Flow (Zeigen/Verstecken) ─────────────────────────────────────────────

function initAddPersonaFlow() {
  const openBtn  = document.getElementById('openPersonaSelection');
  const closeBtn = document.getElementById('closePersonaSelection');
  const initial  = document.getElementById('addPersonaInitial');
  const selection = document.getElementById('addPersonaSelection');

  openBtn?.addEventListener('click', () => {
    initial?.classList.add('persona-selection-hidden');
    selection?.classList.remove('persona-selection-hidden');
  });

  closeBtn?.addEventListener('click', () => {
    selection?.classList.add('persona-selection-hidden');
    initial?.classList.remove('persona-selection-hidden');
  });
}

// ─── Hilfsberechnungen ────────────────────────────────────────────────────────

function calcStreak(persona) {
  const data  = getHabitData();
  const today = new Date();
  let streak  = 0;

  for (let i = 0; i < 30; i++) {
    const d   = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if ((data[key]?.[persona]?.length || 0) > 0) streak++;
    else if (i > 0) break;
  }
  return streak;
}

function calcWeeklyXP(persona) {
  const data  = getHabitData();
  const today = new Date();
  let xp      = 0;

  for (let i = 0; i < 7; i++) {
    const d   = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    xp += (data[key]?.[persona]?.length || 0) * 10;
  }
  return xp;
}
