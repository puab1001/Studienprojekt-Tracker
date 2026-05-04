// ─── BECOMING · dashboard.js ─────────────────────────────────────────────────
// Habit-Checkboxen, Fortschritt, XP, Streak, Persona-Modal, Reflexion

// Habit-Definitionen pro Persona
const PERSONA_HABITS = {
  disciplined: [
    { id: 'dh1', title: '30 Minuten Deep Work',            desc: 'Arbeite konzentriert an einer Aufgabe ohne Ablenkung.',          tag: 'Fokus' },
    { id: 'dh2', title: 'Kein Social Media bis 12 Uhr',    desc: 'Trainiere bewussten Verzicht und reduziere Reizüberflutung.',    tag: 'Selbstkontrolle' },
    { id: 'dh3', title: 'Morgens dieselbe Routine einhalten', desc: 'Stärke Konstanz durch wiederholbare, einfache Abläufe.',      tag: 'Routine' },
    { id: 'dh4', title: '10 Minuten bewusste Planung',     desc: 'Lege fest, was heute wichtig ist und was bewusst wegfällt.',    tag: 'Klarheit' },
    { id: 'dh5', title: 'Kurze Abendreflexion',            desc: 'Was hat heute gut funktioniert und wo warst du konsequent?',    tag: 'Reflexion' },
  ],
  curious: [
    { id: 'ch1', title: '20 Minuten lesen',                desc: 'Lies täglich – Bücher, Artikel oder Essays.',                   tag: 'Wissen' },
    { id: 'ch2', title: 'Eine neue Frage notieren',        desc: 'Halte etwas fest, das dich heute interessiert hat.',             tag: 'Neugier' },
    { id: 'ch3', title: 'Etwas Neues ausprobieren',        desc: 'Mach etwas, das du noch nie gemacht hast – klein ist okay.',    tag: 'Offenheit' },
    { id: 'ch4', title: 'Podcast oder Vortrag hören',      desc: 'Nutze Wege und Wartezeiten für Lernimpulse.',                   tag: 'Lernen' },
  ],
  resilient: [
    { id: 'rh1', title: '10 Minuten Meditation',           desc: 'Komm zur Ruhe und beobachte deine Gedanken ohne Bewertung.',    tag: 'Erholung' },
    { id: 'rh2', title: 'Bewegung – 20 Minuten',           desc: 'Körperliche Aktivität stärkt mentale Widerstandskraft.',        tag: 'Körper' },
    { id: 'rh3', title: 'Stresssituation bewusst durchatmen', desc: 'Erkenne einen Stressmoment und reagiere ruhig darauf.',      tag: 'Anpassung' },
    { id: 'rh4', title: 'Ausreichend schlafen (7–8h)',     desc: 'Schlaf ist die Basis für Resilienz und Regeneration.',          tag: 'Schlaf' },
  ],
  intentional: [
    { id: 'ih1', title: 'Top-3-Aufgaben festlegen',        desc: 'Starte den Tag mit klaren Prioritäten.',                        tag: 'Fokus' },
    { id: 'ih2', title: 'Handy beim Arbeiten weglegen',    desc: 'Schaffe Bedingungen für echten Fokus.',                         tag: 'Klarheit' },
    { id: 'ih3', title: 'Bewusste Entscheidung treffen',   desc: 'Triff heute eine Entscheidung die du sonst aufgeschoben hättest.', tag: 'Intention' },
    { id: 'ih4', title: 'Tagesende definieren',            desc: 'Lege fest, wann der Arbeitstag offiziell endet.',               tag: 'Grenzen' },
  ],
  connected: [
    { id: 'coh1', title: 'Aktiv zuhören im Gespräch',      desc: 'Sei voll präsent – kein Handy, kein Unterbrechen.',             tag: 'Präsenz' },
    { id: 'coh2', title: 'Jemandem bewusst danken',        desc: 'Drücke echte Wertschätzung aus.',                               tag: 'Dankbarkeit' },
    { id: 'coh3', title: 'Nachricht an jemanden schicken', desc: 'Melde dich bei jemandem, an den du heute gedacht hast.',        tag: 'Verbindung' },
    { id: 'coh4', title: 'Ohne Ablenkung Zeit mit Menschen', desc: 'Qualitätszeit – kein Bildschirm, volle Aufmerksamkeit.',      tag: 'Empathie' },
  ],
};

const PERSONA_META = {
  disciplined: { label: 'The Disciplined', quote: 'Konstanz schlägt Motivation.',       sub: 'Heute liegt dein Fokus auf Selbstkontrolle, Routine und bewussten Entscheidungen.' },
  curious:     { label: 'The Curious',     quote: 'Neugier öffnet Türen.',              sub: 'Heute liegt dein Fokus auf Lernen, Offenheit und geistiger Bewegung.' },
  resilient:   { label: 'The Resilient',   quote: 'Erholung ist auch Leistung.',        sub: 'Heute liegt dein Fokus auf Regeneration, Anpassung und innerem Gleichgewicht.' },
  intentional: { label: 'The Intentional', quote: 'Weniger, aber richtiger.',           sub: 'Heute liegt dein Fokus auf klaren Prioritäten und bewussten Entscheidungen.' },
  connected:   { label: 'The Connected',   quote: 'Echte Verbindung braucht Präsenz.',  sub: 'Heute liegt dein Fokus auf Empathie, Zuhören und menschlicher Nähe.' },
};

document.addEventListener('DOMContentLoaded', () => {

  const persona = getActivePersona();
  renderPersonaHeader(persona);
  renderHabits(persona);
  renderStats();
  initReflection();
  initPersonaModal();
  initSaveBtn();

});

// ─── Persona-Header ───────────────────────────────────────────────────────────

function renderPersonaHeader(persona) {
  const meta = PERSONA_META[persona];
  if (!meta) return;

  const eyebrow = document.querySelector('.eyebrow');
  const h1      = document.querySelector('.hero-copy h1');
  const subP    = document.querySelector('.hero-copy > p');

  if (eyebrow) eyebrow.textContent = meta.label;
  if (h1)      h1.textContent      = meta.quote;
  if (subP)    subP.textContent    = meta.sub;

  // Hero-Farbe anpassen
  const heroWrap = document.querySelector('.hero-copy-wrap');
  if (heroWrap) heroWrap.style.background = `var(--${persona})`;

  // Persona-Artwork rendern
  const heroVisual = document.querySelector('.hero-visual');
  if (heroVisual) {
    heroVisual.style.background = `var(--${persona})`;
    const initial = meta.label.replace('The ', '')[0];
    heroVisual.innerHTML = `
      <div class="persona-art">
        <div class="art-orb art-orb--1"></div>
        <div class="art-orb art-orb--2"></div>
        <div class="art-orb art-orb--3"></div>
        <div class="art-letter">${initial}</div>
      </div>
    `;
  }

  // Stats
  renderHeroStats(persona);
}

function renderHeroStats(persona) {
  const stats   = calcStats(persona);
  const statEls = document.querySelectorAll('.hero-stat strong');
  if (statEls.length >= 3) {
    statEls[0].textContent = `Level ${String(stats.level).padStart(2, '0')}`;
    statEls[1].textContent = `${stats.streak} ${stats.streak === 1 ? 'Tag' : 'Tage'}`;
    statEls[2].textContent = `${stats.weeklyXP} XP`;
  }
}

// ─── Habits rendern ───────────────────────────────────────────────────────────

function renderHabits(persona) {
  const habits    = PERSONA_HABITS[persona] || [];
  const todayKey  = getTodayKey();
  const habitData = getHabitData();
  const todayDone = habitData[todayKey]?.[persona] || [];

  const container = document.querySelector('.habits');
  if (!container) return;

  container.innerHTML = habits.map(h => `
    <label class="habit-item">
      <input class="habit-check" type="checkbox" data-id="${h.id}" ${todayDone.includes(h.id) ? 'checked' : ''}>
      <div>
        <div class="habit-title">${h.title}</div>
        <div class="habit-desc">${h.desc}</div>
      </div>
      <span class="habit-tag">${h.tag}</span>
    </label>
  `).join('');

  // Event-Listener
  container.querySelectorAll('.habit-check').forEach(cb => {
    cb.addEventListener('change', () => onHabitChange(persona));
  });

  updateProgress(persona);
}

function onHabitChange(persona) {
  const habits   = PERSONA_HABITS[persona] || [];
  const todayKey = getTodayKey();
  const checked  = [...document.querySelectorAll('.habit-check:checked')].map(c => c.dataset.id);

  const data = getHabitData();
  if (!data[todayKey]) data[todayKey] = {};
  data[todayKey][persona] = checked;
  saveHabitData(data);

  updateProgress(persona);
  renderHeroStats(persona);
  renderStats();

  // Toast wenn alle Habits erledigt
  if (checked.length === habits.length && habits.length > 0) {
    showToast('Alle Habits erledigt — starker Tag!');
  }
}

// ─── Fortschrittsbalken ───────────────────────────────────────────────────────

function updateProgress(persona) {
  const habits   = PERSONA_HABITS[persona] || [];
  const todayKey = getTodayKey();
  const done     = getHabitData()[todayKey]?.[persona]?.length || 0;
  const total    = habits.length;
  const pct      = total ? Math.round((done / total) * 100) : 0;

  const bar  = document.querySelector('.progress-card .progress-line span');
  const meta = document.querySelectorAll('.progress-meta span');

  if (bar)     bar.style.width = `${pct}%`;
  if (meta[0]) meta[0].textContent = `${pct}% Tagesfortschritt`;
  if (meta[1]) meta[1].textContent = `${done} von ${total} erledigt`;

  // Section-Sub
  const sub = document.querySelector('.progress-card .section-sub');
  if (sub) sub.textContent = `${done} von ${total} täglichen Habits abgeschlossen`;
}

// ─── Mini-Stats ───────────────────────────────────────────────────────────────

function renderStats() {
  const persona  = getActivePersona();
  const stats    = calcStats(persona);
  const statEls  = document.querySelectorAll('.mini-stat strong');
  const today    = new Date().toLocaleDateString('de-DE', { weekday: 'short' });

  if (statEls[0]) statEls[0].textContent = String(PERSONA_HABITS[persona]?.length || 0).padStart(2, '0');
  if (statEls[1]) statEls[1].textContent = `${stats.weekRate}%`;
  if (statEls[2]) statEls[2].textContent = String(stats.level).padStart(2, '0');
  if (statEls[3]) statEls[3].textContent = today;
}

// ─── Statistik-Berechnungen ───────────────────────────────────────────────────

function calcStats(persona) {
  const data    = getHabitData();
  const habits  = PERSONA_HABITS[persona] || [];
  const total   = habits.length;

  // Streak berechnen
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d   = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const done = data[key]?.[persona]?.length || 0;
    if (done > 0) streak++;
    else if (i > 0) break; // Lücke → Streak unterbrochen
  }

  // Wochentage (Mo–So)
  const weekDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    weekDays.push(d.toISOString().split('T')[0]);
  }

  let weekDone = 0, weekPossible = 0, weeklyXP = 0;
  weekDays.forEach(key => {
    const done = data[key]?.[persona]?.length || 0;
    weekDone      += done;
    weekPossible  += total;
    weeklyXP      += done * 10; // 10 XP pro Habit
  });

  const weekRate = weekPossible ? Math.round((weekDone / weekPossible) * 100) : 0;
  const totalXP  = Object.values(data).reduce((sum, day) => {
    return sum + (day[persona]?.length || 0) * 10;
  }, 0);
  const level = Math.floor(totalXP / 100) + 1;

  return { streak, weekRate, weeklyXP, level, totalXP };
}

// ─── Reflexion speichern ──────────────────────────────────────────────────────

let reflectionAutoSaveTimer = null;

function initReflection() {
  const box     = document.querySelector('.reflection-box');
  const saveBtn = document.getElementById('saveBtn');
  if (!box) return;

  const todayKey = getTodayKey();
  const persona  = getActivePersona();
  const saved    = getReflections()[`${todayKey}_${persona}`];

  // Gespeicherten Text laden oder Box leeren (damit CSS-Placeholder greift)
  box.textContent = saved || '';

  // Browser fügt manchmal <br> ein wenn Box geleert wird – bereinigen
  box.addEventListener('input', () => {
    if (box.innerHTML === '<br>') box.innerHTML = '';
    scheduleAutoSave(box, persona);
  });

  saveBtn?.addEventListener('click', () => saveReflection(box, persona));

  box.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveReflection(box, persona);
  });
}

function scheduleAutoSave(box, persona) {
  clearTimeout(reflectionAutoSaveTimer);
  reflectionAutoSaveTimer = setTimeout(() => saveReflection(box, persona, true), 2000);
}

function saveReflection(box, persona, silent = false) {
  const text     = box.textContent.trim();
  const todayKey = getTodayKey();
  const data     = getReflections();

  data[`${todayKey}_${persona}`] = text;
  saveReflections(data);

  if (!silent) {
    const btn = document.getElementById('saveBtn');
    if (btn) {
      btn.textContent = '✓ Gespeichert';
      btn.classList.add('saved');
      setTimeout(() => {
        btn.textContent = 'Speichern';
        btn.classList.remove('saved');
      }, 2000);
    }
  }
}

// ─── Persona-Modal ────────────────────────────────────────────────────────────

function initPersonaModal() {
  const overlay  = document.getElementById('personaModal');
  const openBtn  = document.getElementById('openPersonaModal');
  const closeBtn = document.getElementById('closePersonaModal');

  openBtn?.addEventListener('click', () => {
    updatePersonaModalActive();
    overlay?.classList.add('active');
  });
  closeBtn?.addEventListener('click', () => overlay?.classList.remove('active'));

  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('active');
  });

  // Alle Persona-Buttons direkt über data-persona
  document.querySelectorAll('#activePersonaGrid .persona-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const persona = btn.dataset.persona;
      if (persona) {
        unlockPersona(persona);
        switchPersona(persona);
        overlay?.classList.remove('active');
      }
    });
  });
}

function updatePersonaModalActive() {
  const current = getActivePersona();
  document.querySelectorAll('#activePersonaGrid .persona-option').forEach(btn => {
    btn.classList.toggle('persona-option--active', btn.dataset.persona === current);
  });
}

function switchPersona(persona) {
  clearTimeout(reflectionAutoSaveTimer);
  setActivePersona(persona);
  renderPersonaHeader(persona);
  renderHabits(persona);
  renderStats();

  const box      = document.querySelector('.reflection-box');
  const todayKey = getTodayKey();
  const saved    = getReflections()[`${todayKey}_${persona}`];
  if (box) {
    box.textContent = saved || '';
    // Input-Listener neu binden für neue Persona
    box.oninput = () => {
      if (box.innerHTML === '<br>') box.innerHTML = '';
      scheduleAutoSave(box, persona);
    };
  }
}

// ─── Save-Button Init ────────────────────────────────────────────────────────

function initSaveBtn() {
  // Bereits in initReflection() behandelt
}
