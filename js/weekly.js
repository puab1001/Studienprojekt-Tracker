// ─── BECOMING · weekly.js ────────────────────────────────────────────────────
// Wochenansicht: Navigation, echte Daten, Reflexion speichern

const WEEKLY_HABIT_COUNTS = { disciplined: 5, curious: 4, resilient: 4, intentional: 4, connected: 4 };

const DAY_NAMES_DE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

document.addEventListener('DOMContentLoaded', () => {

  // Aktuelle Woche: Mo der laufenden Woche
  const state = { weekOffset: 0 };

  renderWeek(state);

  document.querySelector('.week-switch .switch-btn:first-child')?.addEventListener('click', () => {
    state.weekOffset--;
    renderWeek(state);
  });

  document.querySelector('.week-switch .switch-btn:last-child')?.addEventListener('click', () => {
    if (state.weekOffset >= 0) return; // Nicht in die Zukunft
    state.weekOffset++;
    renderWeek(state);
  });

  initWeeklyReflection(state);

});

// ─── Woche rendern ────────────────────────────────────────────────────────────

function renderWeek(state) {
  const { monday, sunday } = getWeekRange(state.weekOffset);
  const persona = getActivePersona();
  const data    = getHabitData();
  const total   = WEEKLY_HABIT_COUNTS[persona] || 4;

  // Header
  updateHeader(monday, sunday, persona, state, data, total);

  // Tages-Karten
  renderDayCards(monday, persona, data, total);

  // Stats
  renderWeekStats(monday, persona, data, total);

  // Trend-Balken
  renderTrendBars(monday, persona, data, total);

  // Reflexion laden
  loadWeeklyReflection(getWeekKey(monday), persona);

  // Zukünftige Woche: "Weiter"-Button deaktivieren
  const nextBtn = document.querySelector('.week-switch .switch-btn:last-child');
  if (nextBtn) nextBtn.disabled = state.weekOffset >= 0;
}

function updateHeader(monday, sunday, persona, state, data, total) {
  const personaLabels = { disciplined: 'The Disciplined', curious: 'The Curious', resilient: 'The Resilient', intentional: 'The Intentional', connected: 'The Connected' };

  const eyebrow = document.querySelector('.eyebrow');
  const h1      = document.querySelector('.hero-wrap h1');
  const label   = document.querySelector('.switch-label');
  const heroWrap = document.querySelector('.hero-wrap');

  const weekNum  = getWeekNumber(monday);
  const dateStr  = `${formatDateShort(monday)} – ${formatDateShort(sunday)}`;

  if (eyebrow) eyebrow.textContent = `Woche ${weekNum} · ${personaLabels[persona] || persona}`;
  if (label)   label.textContent   = dateStr;
  if (heroWrap) heroWrap.style.background = `var(--${persona})`;

  // H1: aktivste Tage berechnen
  const activeDays = countActiveDays(monday, persona, data, total);
  if (h1) {
    if (activeDays === 0) {
      h1.textContent = 'Diese Woche noch kein Habit abgeschlossen.';
    } else if (activeDays === 7) {
      h1.textContent = 'Perfekte Woche! Alle 7 Tage konsequent.';
    } else {
      h1.textContent = `Du warst diese Woche an ${activeDays} von 7 Tagen konsequent.`;
    }
  }
}

function renderDayCards(monday, persona, data, total) {
  const grid = document.querySelector('.days-grid');
  if (!grid) return;

  const todayStr = getTodayKey();

  grid.innerHTML = Array.from({ length: 7 }, (_, i) => {
    const d   = new Date(monday);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    const done = data[key]?.[persona]?.length || 0;
    const isToday = key === todayStr;
    const isFuture = key > todayStr;

    let status, note;
    if (isFuture) {
      status = 'open';  note = 'Noch offen';
    } else if (done === 0) {
      status = 'bad';   note = 'Kein Habit gemacht';
    } else if (done < total) {
      status = 'mid';   note = `${done} von ${total} erledigt`;
    } else {
      status = 'good';  note = 'Alle Habits erfüllt';
    }

    return `
      <div class="day-card ${isToday ? 'active' : ''}">
        <div class="day-top">
          <div class="day-name">${DAY_NAMES_DE[(d.getDay())]}</div>
          <div class="day-number">${d.getDate()}</div>
        </div>
        <div class="status-dot status-${status}"></div>
        <div class="day-note">${note}</div>
      </div>
    `;
  }).join('');
}

function renderWeekStats(monday, persona, data, total) {
  const todayStr   = getTodayKey();
  let done = 0, possible = 0, activeDays = 0, xp = 0, streak = 0;

  for (let i = 0; i < 7; i++) {
    const d   = new Date(monday);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    if (key > todayStr) continue;

    const dayDone = data[key]?.[persona]?.length || 0;
    done      += dayDone;
    possible  += total;
    xp        += dayDone * 10;
    if (dayDone > 0) activeDays++;
  }

  const rate = possible ? Math.round((done / possible) * 100) : 0;

  // Streak (laufend bis Sonntag dieser Woche)
  streak = calcStreakUpTo(monday, 7, persona, data);

  const statEls = document.querySelectorAll('.stat-box strong');
  if (statEls[0]) statEls[0].textContent = `${rate}%`;
  if (statEls[1]) statEls[1].textContent = activeDays;
  if (statEls[2]) statEls[2].textContent = `${xp} XP`;
  if (statEls[3]) statEls[3].textContent = `${streak} ${streak === 1 ? 'Tag' : 'Tage'}`;
}

function renderTrendBars(monday, persona, data, total) {
  // Für "The Disciplined" haben wir Tag-Kategorien, sonst generisch
  const categories = getTrendCategories(persona);
  const todayStr   = getTodayKey();

  // Berechne Completion pro Kategorie (vereinfacht: gleichmäßig aufteilen)
  const rows = document.querySelectorAll('.trend-row');

  categories.forEach((cat, i) => {
    if (!rows[i]) return;
    const fill  = rows[i].querySelector('.bar-fill');
    const label = rows[i].querySelector('.trend-label');
    const value = rows[i].querySelector('.trend-value');

    // Berechne einen gewichteten Prozentwert für diese Kategorie
    let catDone = 0, catPossible = 0;
    for (let d = 0; d < 7; d++) {
      const day = new Date(monday);
      day.setDate(day.getDate() + d);
      const key = day.toISOString().split('T')[0];
      if (key > todayStr) continue;
      const dayDone = data[key]?.[persona]?.length || 0;
      catPossible++;
      // Jede Kategorie bekommt anteiligen Score
      if (dayDone >= cat.minHabits) catDone++;
    }

    const pct = catPossible ? Math.round((catDone / catPossible) * 100) : 0;
    if (fill)  fill.style.width     = `${pct}%`;
    if (label) label.textContent    = cat.label;
    if (value) value.textContent    = `${pct}%`;
  });
}

function getTrendCategories(persona) {
  const map = {
    disciplined: [
      { label: 'Fokus',        minHabits: 1 },
      { label: 'Routine',      minHabits: 2 },
      { label: 'Verzicht',     minHabits: 3 },
    ],
    curious: [
      { label: 'Lernen',       minHabits: 1 },
      { label: 'Neugier',      minHabits: 2 },
      { label: 'Offenheit',    minHabits: 3 },
    ],
    resilient: [
      { label: 'Erholung',     minHabits: 1 },
      { label: 'Bewegung',     minHabits: 2 },
      { label: 'Konsistenz',   minHabits: 3 },
    ],
    intentional: [
      { label: 'Fokus',        minHabits: 1 },
      { label: 'Klarheit',     minHabits: 2 },
      { label: 'Struktur',     minHabits: 3 },
    ],
    connected: [
      { label: 'Präsenz',      minHabits: 1 },
      { label: 'Verbindung',   minHabits: 2 },
      { label: 'Empathie',     minHabits: 3 },
    ],
  };
  return map[persona] || map.disciplined;
}

// ─── Wochenreflexion ──────────────────────────────────────────────────────────

let weeklyAutoSaveTimer = null;

function initWeeklyReflection(state) {
  const box     = document.querySelector('.reflection-box');
  const saveBtn = document.getElementById('weeklySaveBtn');
  if (!box) return;

  // Browser <br> bereinigen + Auto-Save auslösen
  box.addEventListener('input', () => {
    if (box.innerHTML === '<br>') box.innerHTML = '';
    clearTimeout(weeklyAutoSaveTimer);
    weeklyAutoSaveTimer = setTimeout(() => saveWeeklyReflection(box, state, true), 2000);
  });

  saveBtn?.addEventListener('click', () => saveWeeklyReflection(box, state));
}

function saveWeeklyReflection(box, state, silent = false) {
  const persona = getActivePersona();
  const { monday } = getWeekRange(state.weekOffset);
  const key  = getWeekKey(monday);
  const data = getReflections();
  data[`weekly_${key}_${persona}`] = box.textContent.trim();
  saveReflections(data);

  if (!silent) {
    const btn = document.getElementById('weeklySaveBtn');
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

function loadWeeklyReflection(weekKey, persona) {
  const box = document.querySelector('.reflection-box');
  if (!box) return;
  clearTimeout(weeklyAutoSaveTimer);
  const saved = getReflections()[`weekly_${weekKey}_${persona}`];
  box.textContent = saved || '';
}

// ─── Datums-Helfer ────────────────────────────────────────────────────────────

function getWeekRange(offset) {
  const today  = new Date();
  const day    = today.getDay(); // 0=So
  const diff   = (day === 0 ? -6 : 1 - day); // Montag dieser Woche
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff + offset * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return { monday, sunday };
}

function getWeekNumber(date) {
  const d     = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getWeekKey(monday) {
  return monday.toISOString().split('T')[0];
}

function formatDateShort(date) {
  return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

function countActiveDays(monday, persona, data, total) {
  const todayStr = getTodayKey();
  let count = 0;
  for (let i = 0; i < 7; i++) {
    const d   = new Date(monday);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    if (key > todayStr) continue;
    if ((data[key]?.[persona]?.length || 0) > 0) count++;
  }
  return count;
}

function calcStreakUpTo(monday, days, persona, data) {
  let streak = 0;
  for (let i = days - 1; i >= 0; i--) {
    const d   = new Date(monday);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    if (key > getTodayKey()) continue;
    if ((data[key]?.[persona]?.length || 0) > 0) streak++;
    else break;
  }
  return streak;
}
