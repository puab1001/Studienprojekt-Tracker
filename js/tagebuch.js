// ─── BECOMING · tagebuch.js ───────────────────────────────────────────────────
// Dynamisches Journal-Rendering aus localStorage-Daten

const TAGEBUCH_HABITS = {
  disciplined: [
    { id: 'dh1', title: '30 Minuten Deep Work' },
    { id: 'dh2', title: 'Kein Social Media bis 12 Uhr' },
    { id: 'dh3', title: 'Morgens dieselbe Routine einhalten' },
    { id: 'dh4', title: '10 Minuten bewusste Planung' },
    { id: 'dh5', title: 'Kurze Abendreflexion' },
  ],
  curious: [
    { id: 'ch1', title: '20 Minuten lesen' },
    { id: 'ch2', title: 'Eine neue Frage notieren' },
    { id: 'ch3', title: 'Etwas Neues ausprobieren' },
    { id: 'ch4', title: 'Podcast oder Vortrag hören' },
  ],
  resilient: [
    { id: 'rh1', title: '10 Minuten Meditation' },
    { id: 'rh2', title: 'Bewegung – 20 Minuten' },
    { id: 'rh3', title: 'Stresssituation bewusst durchatmen' },
    { id: 'rh4', title: 'Ausreichend schlafen (7–8h)' },
  ],
  intentional: [
    { id: 'ih1', title: 'Top-3-Aufgaben festlegen' },
    { id: 'ih2', title: 'Handy beim Arbeiten weglegen' },
    { id: 'ih3', title: 'Bewusste Entscheidung treffen' },
    { id: 'ih4', title: 'Tagesende definieren' },
  ],
  connected: [
    { id: 'coh1', title: 'Aktiv zuhören im Gespräch' },
    { id: 'coh2', title: 'Jemandem bewusst danken' },
    { id: 'coh3', title: 'Nachricht an jemanden schicken' },
    { id: 'coh4', title: 'Ohne Ablenkung Zeit mit Menschen' },
  ],
};

const TAGEBUCH_PERSONA_META = {
  disciplined: { label: 'The Disciplined', color: 'var(--disciplined)' },
  curious:     { label: 'The Curious',     color: 'var(--curious)'     },
  resilient:   { label: 'The Resilient',   color: 'var(--resilient)'   },
  intentional: { label: 'The Intentional', color: 'var(--intentional)' },
  connected:   { label: 'The Connected',   color: 'var(--connected)'   },
};

const TAGEBUCH_TITLES = {
  disciplined: ['Fokus-Tag', 'Disziplin gehalten', 'Routine gestärkt', 'Klarer Kopf', 'Strukturierter Tag'],
  curious:     ['Lernimpuls', 'Neues entdeckt', 'Geistige Bewegung', 'Horizont erweitert', 'Neugier gelebt'],
  resilient:   ['Erholung priorisiert', 'Widerstandskraft gestärkt', 'Innere Balance', 'Durchgehalten', 'Regeneration'],
  intentional: ['Bewusst gelebt', 'Klare Prioritäten', 'Intentional geblieben', 'Fokus gehalten', 'Klarheit gewonnen'],
  connected:   ['Verbunden gewesen', 'Präsent geblieben', 'Echte Verbindung', 'Empathie gelebt', 'Nähe geschaffen'],
};

const TAGEBUCH_HABIT_COUNTS = { disciplined: 5, curious: 4, resilient: 4, intentional: 4, connected: 4 };

const TAGEBUCH_DAY_NAMES  = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const TAGEBUCH_MONTH_NAMES = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

let journalYear;

document.addEventListener('DOMContentLoaded', () => {
  journalYear = new Date().getFullYear();
  updateYearDisplay();
  renderJournal();
  initYearNav();
});

// ─── Jahres-Navigation ────────────────────────────────────────────────────────

function initYearNav() {
  document.getElementById('yearPrev')?.addEventListener('click', () => {
    journalYear--;
    updateYearDisplay();
    renderJournal();
  });
  document.getElementById('yearNext')?.addEventListener('click', () => {
    if (journalYear >= new Date().getFullYear()) return;
    journalYear++;
    updateYearDisplay();
    renderJournal();
  });
}

function updateYearDisplay() {
  const yearSpan = document.getElementById('currentYear');
  if (yearSpan) yearSpan.textContent = journalYear;
  const nextBtn = document.getElementById('yearNext');
  if (nextBtn) nextBtn.disabled = journalYear >= new Date().getFullYear();
}

// ─── Journal rendern ──────────────────────────────────────────────────────────

function renderJournal() {
  const container = document.getElementById('journalContent');
  if (!container) return;

  const weeks = getWeeksWithData(journalYear);

  if (weeks.length === 0) {
    container.innerHTML = `
      <article class="card" style="text-align:center; padding: 40px 24px;">
        <p style="color:var(--muted); line-height:1.7; margin:0 0 16px;">
          Für ${journalYear} sind noch keine Einträge vorhanden.
        </p>
        <a href="/dashboard.html" class="btn-primary" style="display:inline-flex;">Zum Dashboard</a>
      </article>
    `;
    return;
  }

  container.innerHTML = weeks.map(monday => renderWeekBlock(monday)).join('');
  initToggles();
}

// ─── Wochen mit Daten finden ──────────────────────────────────────────────────

function getWeeksWithData(year) {
  const data     = getHabitData();
  const todayStr = getTodayKey();
  const weekSet  = new Set();

  Object.keys(data).forEach(dateKey => {
    if (dateKey > todayStr) return;
    const date = new Date(dateKey + 'T00:00:00');
    if (date.getFullYear() !== year) return;
    const dayData  = data[dateKey] || {};
    const hasEntry = Object.values(dayData).some(arr => arr && arr.length > 0);
    if (hasEntry) {
      const monday = getMondayOfWeek(date);
      weekSet.add(monday.toISOString().split('T')[0]);
    }
  });

  return [...weekSet]
    .map(k => new Date(k + 'T00:00:00'))
    .sort((a, b) => b - a); // neueste Woche zuerst
}

function getMondayOfWeek(date) {
  const d   = new Date(date);
  const day = d.getDay(); // 0 = Sonntag
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── Wochenblock rendern ──────────────────────────────────────────────────────

function renderWeekBlock(monday) {
  const sunday      = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const data        = getHabitData();
  const reflections = getReflections();
  const todayStr    = getTodayKey();
  const weekKey     = monday.toISOString().split('T')[0];
  const weekNum     = getWeekNumberFromDate(monday);
  const dateRange   = `${fmtDate(monday)} – ${fmtDate(sunday)}`;

  // Wochenstats
  const { dominantPersona, activeDays, streak, completionPct } =
    calcWeekStats(monday, data, todayStr);

  const personaMeta = TAGEBUCH_PERSONA_META[dominantPersona] || TAGEBUCH_PERSONA_META.disciplined;

  const dayStrip      = renderDayStrip(monday, data, todayStr);
  const entryListHtml = renderEntryList(monday, data, reflections, todayStr);
  const weeklyRef     = getWeeklyReflection(weekKey, reflections);

  const weeklyRefHtml = weeklyRef ? `
    <div class="weekly-reflection">
      <h3>Wochenreflexion</h3>
      <p>${escapeHtml(weeklyRef)}</p>
      <div class="insight-row">
        <span class="entry-badge badge-neutral">${activeDays} aktive ${activeDays === 1 ? 'Tag' : 'Tage'}</span>
        <span class="entry-badge badge-neutral">${completionPct}% Abschlussrate</span>
      </div>
    </div>
  ` : '';

  return `
    <article class="card week-block">
      <button class="week-toggle" type="button">
        <span>Woche ${weekNum} · ${dateRange}</span>
        <span class="week-arrow">⌄</span>
      </button>
      <div class="week-content">
        <div class="week-summary">
          <div class="week-meta">
            <span class="meta-pill">${personaMeta.label}</span>
            <span class="meta-pill">${completionPct}% Completion</span>
            <span class="meta-pill">🔥 ${streak} ${streak === 1 ? 'Tag' : 'Tage'} Streak</span>
          </div>
          <span class="meta-pill">${activeDays} ${activeDays === 1 ? 'Eintrag' : 'Einträge'}</span>
        </div>
        ${dayStrip}
        <div class="entry-list">
          ${entryListHtml}
        </div>
        ${weeklyRefHtml}
      </div>
    </article>
  `;
}

// ─── Wochenstats berechnen ────────────────────────────────────────────────────

function calcWeekStats(monday, data, todayStr) {
  const personaCounts = {};
  let totalDone = 0, totalPossible = 0, activeDays = 0;

  for (let i = 0; i < 7; i++) {
    const d   = new Date(monday);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    if (key > todayStr) continue;

    const dayData = data[key] || {};
    let dayHasDone = false;

    Object.entries(dayData).forEach(([persona, ids]) => {
      if (!ids || !ids.length) return;
      personaCounts[persona] = (personaCounts[persona] || 0) + ids.length;
      totalDone += ids.length;
      totalPossible += TAGEBUCH_HABIT_COUNTS[persona] || 4;
      dayHasDone = true;
    });

    if (dayHasDone) activeDays++;
  }

  const dominantPersona = Object.entries(personaCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || getActivePersona();

  const completionPct = totalPossible ? Math.round((totalDone / totalPossible) * 100) : 0;

  // Streak: konsekutive Tage am Ende der Woche
  let streak = 0;
  for (let i = 6; i >= 0; i--) {
    const d   = new Date(monday);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    if (key > todayStr) continue;
    const dayDone = Object.values(data[key] || {}).reduce((s, arr) => s + (arr?.length || 0), 0);
    if (dayDone > 0) streak++;
    else break;
  }

  return { dominantPersona, activeDays, streak, completionPct };
}

// ─── Tages-Strip rendern ──────────────────────────────────────────────────────

function renderDayStrip(monday, data, todayStr) {
  const pills = Array.from({ length: 7 }, (_, i) => {
    const d   = new Date(monday);
    d.setDate(d.getDate() + i);
    const key      = d.toISOString().split('T')[0];
    const isFuture = key > todayStr;

    let status = 'open';
    if (!isFuture) {
      const dayData = data[key] || {};
      // Dominant persona bestimmen
      const entries = Object.entries(dayData).filter(([, ids]) => ids && ids.length > 0);
      if (entries.length === 0) {
        status = 'bad';
      } else {
        const [topPersona, topIds] = entries.sort((a, b) => b[1].length - a[1].length)[0];
        const total = TAGEBUCH_HABIT_COUNTS[topPersona] || 4;
        status = topIds.length >= total ? 'good' : 'mid';
      }
    }

    return `
      <div class="day-pill">
        <strong>${TAGEBUCH_DAY_NAMES[d.getDay()]}</strong>
        <span>${d.getDate()} ${TAGEBUCH_MONTH_NAMES[d.getMonth()]}</span><br>
        <span class="status-dot status-${status}"></span>
      </div>
    `;
  });

  return `<div class="day-strip">${pills.join('')}</div>`;
}

// ─── Eintrags-Liste rendern ───────────────────────────────────────────────────

function renderEntryList(monday, data, reflections, todayStr) {
  const entries = [];

  for (let i = 0; i < 7; i++) {
    const d   = new Date(monday);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    if (key > todayStr) continue;

    const dayData = data[key] || {};
    const active  = Object.entries(dayData).filter(([, ids]) => ids && ids.length > 0);
    if (active.length === 0) continue;

    // Persona mit den meisten Habits als primäre Persona
    const [persona, doneIds] = active.sort((a, b) => b[1].length - a[1].length)[0];
    const meta    = TAGEBUCH_PERSONA_META[persona] || TAGEBUCH_PERSONA_META.disciplined;
    const habits  = TAGEBUCH_HABITS[persona]       || [];
    const total   = TAGEBUCH_HABIT_COUNTS[persona] || 4;
    const done    = doneIds.length;
    const rate    = total ? done / total : 0;

    // Deterministische Titelauswahl (anhand Tagesdatum → kein Random)
    const titlePool = TAGEBUCH_TITLES[persona] || TAGEBUCH_TITLES.disciplined;
    const title = rate >= 1
      ? `Perfekter ${meta.label.replace('The ', '')}-Tag`
      : titlePool[d.getDate() % titlePool.length];

    const reflection   = reflections[`${key}_${persona}`] || '';
    const doneHabits   = habits.filter(h => doneIds.includes(h.id));
    const xp           = done * 10;
    const dayName      = TAGEBUCH_DAY_NAMES[d.getDay()];

    const habitRows = doneHabits.length
      ? doneHabits.map(h => `
          <div class="habit-row">
            <span>${escapeHtml(h.title)}</span>
            <span>erledigt</span>
          </div>
        `).join('')
      : '<p style="color:var(--muted);font-size:14px;margin:0;">Keine Habits abgeschlossen.</p>';

    const reflectionHtml = reflection
      ? `<div class="reflection-text">${escapeHtml(reflection)}</div>`
      : `<div class="reflection-text" style="font-style:italic;">Keine Reflexion eingetragen.</div>`;

    entries.push(`
      <article class="entry">
        <button class="entry-toggle" type="button">
          <div class="entry-date" style="background: ${meta.color};">
            <div><strong>${d.getDate()}</strong><span>${dayName}</span></div>
          </div>
          <div class="entry-main">
            <h3>${title}</h3>
            <div class="entry-preview">${done} von ${total} Habits geschafft · ${meta.label}</div>
            <div class="entry-meta">
              <span class="entry-badge badge-persona">${meta.label}</span>
              <span class="entry-badge badge-neutral">+${xp} XP</span>
            </div>
          </div>
          <div class="entry-arrow">⌄</div>
        </button>
        <div class="entry-content">
          <div class="detail-grid">
            <div class="detail-card">
              <h4>Erledigte Habits</h4>
              <div class="habit-list">${habitRows}</div>
            </div>
            <div class="detail-card">
              <h4>Tagesreflexion</h4>
              ${reflectionHtml}
            </div>
          </div>
        </div>
      </article>
    `);
  }

  return entries.length
    ? entries.join('')
    : '<p style="color:var(--muted);font-size:14px;padding:8px 0;">Kein Eintrag für diese Woche vorhanden.</p>';
}

// ─── Wochenreflexion abrufen ──────────────────────────────────────────────────

function getWeeklyReflection(weekKey, reflections) {
  const personas = ['disciplined', 'curious', 'resilient', 'intentional', 'connected'];
  for (const p of personas) {
    const text = reflections[`weekly_${weekKey}_${p}`];
    if (text && text.trim()) return text.trim();
  }
  return '';
}

// ─── Toggle-Verhalten ─────────────────────────────────────────────────────────

function initToggles() {
  document.querySelectorAll('.entry-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.entry')?.classList.toggle('open');
    });
  });

  document.querySelectorAll('.week-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.week-block')?.classList.toggle('open');
    });
  });

  // Neueste Woche automatisch öffnen
  document.querySelector('#journalContent .week-block')?.classList.add('open');
}

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

function getWeekNumberFromDate(date) {
  const d      = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function fmtDate(date) {
  return `${date.getDate()} ${TAGEBUCH_MONTH_NAMES[date.getMonth()]}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
