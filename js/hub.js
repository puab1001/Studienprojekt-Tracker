// ─── BECOMING · hub.js ───────────────────────────────────────────────────────
// Persona Hub: aktive Personas mit echten Daten, Level-Fortschritt, hinzufügen

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

const ALL_PERSONAS = ['disciplined', 'curious', 'resilient', 'intentional', 'connected'];

const _HUB_SVG_FLAME = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;
const _HUB_SVG_STAR  = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
const _HUB_SVG_TRASH = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;

document.addEventListener('DOMContentLoaded', async () => {

  const ok = await initPage();
  if (!ok) return;

  const _run = (label, fn) => { try { fn(); } catch (e) { console.error(`[hub] ${label} failed:`, e); } };

  _run('personalizeWelcome', personalizeWelcome);
  _run('renderPersonaList', renderPersonaList);
  _run('renderAddSection', renderAddSection);
  _run('initAddPersonaFlow', initAddPersonaFlow);
  _run('renderHeatmap', () => renderHeatmap(getHabitData()));
  _run('initHeatmapTooltip', initHeatmapTooltip);

  if (typeof initOnboarding === 'function') initOnboarding();

});

function personalizeWelcome() {
  const user = getUser();
  if (!user) return;

  const h = new Date().getHours();
  const greeting = h < 12 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend';

  const el = document.getElementById('welcomeTitle');
  if (el) el.textContent = `${greeting}, ${user.name.split(' ')[0]}`;
}

// ─── Persona-Liste rendern ────────────────────────────────────────────────────

function renderPersonaList() {
  const list = document.querySelector('.persona-list');
  if (!list) return;

  const unlocked = getUnlockedPersonas();

  if (unlocked.length === 0) {
    if (typeof renderHubEmptyState === 'function') {
      renderHubEmptyState(list, () => {
        document.getElementById('openPersonaSelection')?.click();
      });
    }
    return;
  }
  const today    = getTodayKey();
  const data     = getHabitData();

  list.innerHTML = unlocked.map(key => {
    const isDefault = isDefaultPersona(key);
    const label     = isDefault ? HUB_PERSONA_META[key].label : (getPersonaDisplayName(key) || 'Eigene Persona');
    const desc      = isDefault ? HUB_PERSONA_META[key].desc  : getPersonaDisplayDesc(key);
    const color     = getPersonaColor(key);
    const total     = getHabitCountForPersona(key);
    const done      = data[today]?.[key]?.length || 0;
    const pct       = total ? Math.round((done / total) * 100) : 0;
    const streak    = calcStreak(key);
    const weeklyXP  = calcWeeklyXP(key);
    const isActive  = getActivePersona() === key;
    const level     = getPersonaLevel(key);
    const progress  = getLevelUpProgress(key, total);

    const levelInfo = progress.maxLevel
      ? `<span class="persona-level persona-level--max">${_HUB_SVG_STAR} Max Level</span>`
      : `<span class="persona-level">Level ${level} · ${progress.consecutive}/7 Tage bis Level ${level + 1}</span>`;

    return `
      <article class="persona-card ${isActive ? 'persona-card--active' : ''}">
        <button class="persona-delete-btn" type="button" data-persona="${key}" aria-label="${escapeHtml(label)} löschen" title="Löschen">${_HUB_SVG_TRASH}</button>
        <div class="persona-visual" style="background: ${color};"></div>
        <div class="persona-content">
          <h3>${escapeHtml(label)}${isActive ? ' <span class="active-badge">Aktiv</span>' : ''}</h3>
          ${levelInfo}
          <p>${escapeHtml(desc)}</p>
          <div class="progress-row">
            <div class="progress-track">
              <div class="progress-fill" style="width: ${pct}%;"></div>
            </div>
            <span class="progress-label">Heute ${done}/${total} erledigt</span>
          </div>
          <div class="persona-meta-row">
            <span class="persona-meta persona-meta--streak">${_HUB_SVG_FLAME} ${streak} ${streak === 1 ? 'Tag' : 'Tage'}</span>
            <span class="persona-meta">+${weeklyXP} XP diese Woche</span>
          </div>
        </div>
        <a href="/dashboard.html" class="btn-primary" data-persona="${key}">
          ${done > 0 ? 'Weiter' : 'Starten'}
        </a>
      </article>
    `;
  }).join('');

  list.querySelectorAll('[data-persona].btn-primary').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.preventDefault();
      await setActivePersonaAsync(btn.dataset.persona);
      window.location.href = btn.getAttribute('href');
    });
  });

  list.querySelectorAll('.persona-delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const key = btn.dataset.persona;
      if (getUnlockedPersonas().length <= 1) {
        showToast('Das ist deine einzige Persona – füge erst eine weitere hinzu.', 'error');
        return;
      }
      const meta = isDefaultPersona(key) ? HUB_PERSONA_META[key] : null;
      showDeleteConfirm(key, meta);
    });
  });
}

// ─── Lösch-Bestätigung ────────────────────────────────────────────────────────

function showDeleteConfirm(persona, meta) {
  const existing = document.querySelector('.persona-delete-overlay');
  if (existing) existing.remove();

  const label = meta?.label || getPersonaDisplayName(persona) || 'Eigene Persona';
  const color = meta?.color || getPersonaColor(persona);

  const overlay = document.createElement('div');
  overlay.className = 'persona-delete-overlay levelup-overlay';
  overlay.innerHTML = `
    <div class="levelup-card levelup-card--left">
      <div class="persona-delete-header">
        <div class="persona-delete-swatch" style="background:${color};"></div>
        <h2 class="persona-delete-heading">${escapeHtml(label)} löschen?</h2>
      </div>
      <p style="color:var(--muted);font-size:0.9rem;line-height:1.6;margin:0 0 24px;">
        Dein Fortschritt, Level und alle Streaks bleiben vollständig erhalten.
        Du kannst die Persona jederzeit über "Persona hinzufügen" wieder aktivieren.
      </p>
      <div class="persona-delete-btns">
        <button class="btn-ghost" id="delCancel">Abbrechen</button>
        <button class="btn-danger" id="delConfirm">Löschen</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#delCancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  overlay.querySelector('#delConfirm').addEventListener('click', async () => {
    overlay.remove();

    const unlocked = getUnlockedPersonas();

    if (getActivePersona() === persona) {
      const other = unlocked.find(p => p !== persona);
      if (other) await setActivePersonaAsync(other);
    }

    try {
      await softDeletePersona(persona);
      renderPersonaList();
      renderAddSection();
      showToast(`${label} wurde gelöscht.`, 'success');
    } catch (err) {
      console.error('[hub] softDeletePersona fehlgeschlagen:', err);
      renderPersonaList();
      showToast('Löschen fehlgeschlagen – prüfe die Browser-Konsole (F12).', 'error');
    }
  });
}

// ─── Level-Fortschritt berechnen ──────────────────────────────────────────────

function getLevelUpProgress(persona, total) {
  const level = getPersonaLevel(persona);
  if (level >= 3) return { consecutive: 7, maxLevel: true };

  const levelSince = getPersonaLevelDate(persona);
  const data       = getHabitData();
  let consecutive  = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (key <= levelSince) break;
    if ((data[key]?.[persona]?.length || 0) >= total) consecutive++;
    else break;
  }

  return { consecutive, maxLevel: false };
}

// ─── Add-Persona-Sektion ──────────────────────────────────────────────────────

function renderAddSection() {
  const unlocked = getUnlockedPersonas();
  const deleted  = getDeletedPersonas();
  const locked   = ALL_PERSONAS.filter(p => !unlocked.includes(p) && !deleted.includes(p));
  const addCard  = document.getElementById('addPersonaCard');

  if (addCard) addCard.style.display = '';

  const grid = document.querySelector('.persona-selection-grid');
  if (!grid) return;

  const deletedCards = deleted.map(key => {
    const isDefault = isDefaultPersona(key);
    const dlabel = isDefault ? HUB_PERSONA_META[key].label : (getPersonaDisplayName(key) || 'Eigene Persona');
    const dcolor = getPersonaColor(key);
    return `
      <button class="persona-selection-card persona-selection-card--restore" type="button" data-persona="${key}" data-action="restore">
        <div class="persona-selection-visual" style="background: ${dcolor};opacity:0.6;"></div>
        <h4>${escapeHtml(dlabel)}</h4>
        <p>Reaktivieren</p>
      </button>
    `;
  });

  const lockedCards = locked.map(key => {
    const meta = HUB_PERSONA_META[key];
    return `
      <button class="persona-selection-card" type="button" data-persona="${key}" data-action="unlock">
        <div class="persona-selection-visual" style="background: ${meta.color};"></div>
        <h4>${meta.label}</h4>
        <p>${meta.desc}</p>
      </button>
    `;
  });

  const createCard = `
    <button class="persona-selection-card persona-selection-card--create" type="button" id="createCustomPersonaBtn">
      <div class="persona-selection-visual persona-selection-visual--create">+</div>
      <h4>Eigene Persona</h4>
      <p>Erstelle deine individuelle Entwicklungsrichtung mit eigenen Habits.</p>
    </button>
  `;

  grid.innerHTML = [...deletedCards, ...lockedCards, createCard].join('');

  grid.querySelectorAll('[data-persona]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const key    = btn.dataset.persona;
      const action = btn.dataset.action;

      if (action === 'restore') {
        await restorePersona(key);
      } else {
        await unlockPersonaAsync(key);
      }
      await setActivePersonaAsync(key);
      window.location.href = 'dashboard.html';
    });
  });

  document.getElementById('createCustomPersonaBtn')?.addEventListener('click', () => {
    showCreatePersonaModal();
  });
}

// ─── Add-Flow (Zeigen/Verstecken) ─────────────────────────────────────────────

function initAddPersonaFlow() {
  const openBtn      = document.getElementById('openPersonaSelection');
  const closeBtn     = document.getElementById('closePersonaSelection');
  const createDirect = document.getElementById('openCreatePersona');
  const initial      = document.getElementById('addPersonaInitial');
  const selection    = document.getElementById('addPersonaSelection');

  openBtn?.addEventListener('click', () => {
    initial?.classList.add('persona-selection-hidden');
    selection?.classList.remove('persona-selection-hidden');
  });

  closeBtn?.addEventListener('click', () => {
    selection?.classList.add('persona-selection-hidden');
    initial?.classList.remove('persona-selection-hidden');
  });

  createDirect?.addEventListener('click', () => {
    showCreatePersonaModal();
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

// ─── Eigene Persona erstellen ─────────────────────────────────────────────────

const _CPM_COLORS = [
  'linear-gradient(135deg,#5b5cf0,#7f61f2)',
  'linear-gradient(135deg,#34b7ff,#62d1d4)',
  'linear-gradient(135deg,#ff9466,#ffb15f)',
  'linear-gradient(135deg,#8b7dff,#c17cff)',
  'linear-gradient(135deg,#2ebf91,#75d8b3)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#f7971e,#ffd200)',
  'linear-gradient(135deg,#2193b0,#6dd5ed)',
];

let _cpmSelectedColor = _CPM_COLORS[0];

function showCreatePersonaModal() {
  document.getElementById('createPersonaModal')?.remove();
  _cpmSelectedColor = _CPM_COLORS[0];

  const overlay = document.createElement('div');
  overlay.id = 'createPersonaModal';
  overlay.className = 'levelup-overlay';
  overlay.innerHTML = `
    <div class="levelup-card cpm-card">
      <h2 style="margin:0 0 6px;font-size:1.5rem;">Eigene Persona erstellen</h2>
      <p style="color:var(--muted);font-size:14px;margin:0 0 20px;line-height:1.6;">
        Gib deiner Persona einen Namen und wähle einen Stil.
      </p>

      <div class="cpm-field">
        <label for="cpm-name">Name <span style="color:#ef4444;">*</span></label>
        <input id="cpm-name" type="text" placeholder="z.B. The Mindful, The Creative …" maxlength="40">
        <div class="cpm-error" id="cpm-name-error"></div>
      </div>

      <div class="cpm-field">
        <label for="cpm-desc">Beschreibung <span style="color:var(--muted);font-size:12px;font-weight:400;">(optional)</span></label>
        <textarea id="cpm-desc" rows="2" placeholder="Was steht hinter dieser Persona?" maxlength="200"></textarea>
      </div>

      <div class="cpm-field">
        <label>Farbe</label>
        <div class="cpm-colors" id="cpmColors">
          ${_CPM_COLORS.map((g, i) => `
            <button class="cpm-swatch${i === 0 ? ' cpm-swatch--active' : ''}" type="button" data-color="${g}" style="background:${g}" aria-label="Farbe ${i + 1}"></button>
          `).join('')}
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-top:6px;">
        <button class="btn-ghost" id="cpmCancel" style="flex:1;">Abbrechen</button>
        <button class="btn-primary" id="cpmCreate" style="flex:1;">Persona erstellen</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelectorAll('.cpm-swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('.cpm-swatch').forEach(b => b.classList.remove('cpm-swatch--active'));
      btn.classList.add('cpm-swatch--active');
      _cpmSelectedColor = btn.dataset.color;
    });
  });

  overlay.querySelector('#cpmCancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  overlay.querySelector('#cpmCreate').addEventListener('click', async () => {
    const nameVal  = document.getElementById('cpm-name').value.trim();
    const errorEl  = document.getElementById('cpm-name-error');
    errorEl.textContent = '';

    if (nameVal.length < 2) {
      errorEl.textContent = 'Mindestens 2 Zeichen erforderlich.';
      return;
    }

    const createBtn = overlay.querySelector('#cpmCreate');
    createBtn.disabled = true;
    createBtn.textContent = 'Wird erstellt …';

    try {
      const descVal = document.getElementById('cpm-desc').value.trim();
      const key     = await createCustomPersonaAsync(nameVal, descVal, _cpmSelectedColor);
      await setActivePersonaAsync(key);
      overlay.remove();
      window.location.href = 'dashboard.html';
    } catch (err) {
      console.error('[hub] createCustomPersona failed:', err);
      showToast('Fehler beim Erstellen. Bitte erneut versuchen.', 'error');
      createBtn.disabled = false;
      createBtn.textContent = 'Persona erstellen';
    }
  });
}

// Onboarding wird von js/onboarding.js via initOnboarding() übernommen

// ─── Wochenübersicht ──────────────────────────────────────────────────────────

const _hubWeekState = { weekOffset: 0 };
const _HUB_DAY_NAMES = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

function renderHubWeekSection() {
  const persona = getActivePersona();
  const data    = getHabitData();
  const total   = getHabitCountForPersona(persona);
  const { monday, sunday } = getWeekRange(_hubWeekState.weekOffset);

  const sub   = document.getElementById('hubWeekSubtitle');
  const label = document.getElementById('hubWeekLabel');

  if (label) label.textContent = `${formatDateShort(monday)} – ${formatDateShort(sunday)}`;

  if (sub) {
    const activeDays = countActiveDays(monday, persona, data, total);
    const weekNum    = getWeekNumber(monday);
    sub.textContent = activeDays === 0
      ? `KW ${weekNum} · Noch kein Habit abgeschlossen`
      : activeDays === 7
        ? `KW ${weekNum} · Perfekte Woche!`
        : `KW ${weekNum} · ${activeDays} von 7 Tagen konsequent`;
  }

  renderHubDayCards(monday, persona, data, total);
  renderHubWeekStats(monday, persona, data, total);

  const nextBtn = document.getElementById('hubNextWeek');
  if (nextBtn) nextBtn.disabled = _hubWeekState.weekOffset >= 0;
}

function renderHubDayCards(monday, persona, data, total) {
  const grid = document.getElementById('hubDaysGrid');
  if (!grid) return;

  const todayStr = getTodayKey();

  grid.innerHTML = Array.from({ length: 7 }, (_, i) => {
    const d       = new Date(monday);
    d.setDate(d.getDate() + i);
    const key     = localISODate(d);
    const done    = data[key]?.[persona]?.length || 0;
    const isToday  = key === todayStr;
    const isFuture = key > todayStr;

    let status, note;
    if (isFuture)     { status = 'open'; note = 'Offen'; }
    else if (done === 0) { status = 'bad';  note = 'Kein Habit'; }
    else if (done < total) { status = 'mid'; note = `${done}/${total}`; }
    else               { status = 'good'; note = 'Alles erledigt'; }

    const pct = isFuture ? 0 : (total > 0 ? Math.round(done / total * 100) : 0);

    return `
      <div class="day-card${isToday ? ' active' : ''}">
        <div class="day-top">
          <div class="day-name">${_HUB_DAY_NAMES[d.getDay()]}</div>
          <div class="day-number">${d.getDate()}</div>
        </div>
        <div class="status-dot status-${status}"></div>
        <div class="day-note">${note}</div>
        ${!isFuture ? `<div class="day-progress"><div class="day-progress-fill" style="width:${pct}%"></div></div>` : ''}
      </div>`;
  }).join('');
}

function renderHubWeekStats(monday, persona, data, total) {
  const row = document.getElementById('hubWeekStatsRow');
  if (!row) return;

  const todayStr = getTodayKey();
  let done = 0, possible = 0, activeDays = 0, xp = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const key = localISODate(d);
    if (key > todayStr) continue;
    const dayDone = data[key]?.[persona]?.length || 0;
    done      += dayDone;
    possible  += total;
    xp        += dayDone * 10;
    if (dayDone > 0) activeDays++;
  }

  const rate = possible ? Math.round((done / possible) * 100) : 0;
  row.innerHTML = `
    <span class="hub-week-stat">${rate}% Completion</span>
    <span class="hub-week-stat">${activeDays} aktive Tage</span>
    <span class="hub-week-stat">+${xp} XP</span>
  `;
}

function initHubWeekNav() {
  document.getElementById('hubPrevWeek')?.addEventListener('click', () => {
    _hubWeekState.weekOffset--;
    renderHubWeekSection();
  });
  document.getElementById('hubNextWeek')?.addEventListener('click', () => {
    if (_hubWeekState.weekOffset >= 0) return;
    _hubWeekState.weekOffset++;
    renderHubWeekSection();
  });
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────

function renderHeatmap(data) {
  const heatmap = document.getElementById('heatmap');
  const monthEl = document.getElementById('heatmapMonths');
  if (!heatmap) return;

  const today    = new Date();
  const cells    = [];
  const months   = [];
  let   colCount  = 0;
  let   lastMonth = null;

  const dayOfWeek = today.getDay();
  const endDate   = new Date(today);
  endDate.setDate(endDate.getDate() - dayOfWeek);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 52 * 7);

  let current = new Date(startDate);
  while (current <= today) {
    if (current.getDay() === 0) {
      colCount++;
      const month = current.toLocaleDateString('de-DE', { month: 'short' });
      if (month !== lastMonth) { months.push({ month, col: colCount }); lastMonth = month; }
    }
    const key  = localISODate(current);
    const done = Object.values(data[key] || {}).reduce((s, arr) => s + (arr?.length || 0), 0);
    const level = done === 0 ? 0 : done <= 1 ? 1 : done <= 3 ? 2 : done <= 5 ? 3 : done <= 7 ? 4 : 5;
    cells.push({ date: key, level, done });
    current.setDate(current.getDate() + 1);
  }

  heatmap.innerHTML = cells.map(c =>
    `<div class="hm-cell" data-level="${c.level}" data-date="${c.date}" data-done="${c.done}"></div>`
  ).join('');

  if (monthEl) {
    monthEl.style.display = 'grid';
    monthEl.style.gridTemplateColumns = `repeat(${colCount}, 17px)`;
    monthEl.innerHTML = months.map(m =>
      `<div class="hm-month" style="grid-column:${m.col}">${m.month}</div>`
    ).join('');
  }
}

// ─── Heatmap-Tooltip ─────────────────────────────────────────────────────────

function initHeatmapTooltip() {
  const heatmap = document.getElementById('heatmap');
  if (!heatmap) return;

  const tip = document.createElement('div');
  tip.className = 'hm-tooltip';
  document.body.appendChild(tip);

  heatmap.addEventListener('mouseover', e => {
    const cell = e.target.closest('.hm-cell[data-date]');
    if (!cell) { tip.hidden = true; return; }

    const date = new Date(cell.dataset.date + 'T00:00:00');
    const done = parseInt(cell.dataset.done, 10) || 0;
    const dateLabel = date.toLocaleDateString('de-DE', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
    const habitLabel = done === 0
      ? 'Keine Habits'
      : `${done} Habit${done !== 1 ? 's' : ''}`;

    tip.textContent = `${dateLabel} · ${habitLabel}`;
    tip.hidden = false;
  });

  heatmap.addEventListener('mousemove', e => {
    tip.style.left = `${e.clientX + 14}px`;
    tip.style.top  = `${e.clientY - 36}px`;
  });

  heatmap.addEventListener('mouseleave', () => { tip.hidden = true; });
}

// ─── Datums-Helfer ────────────────────────────────────────────────────────────

function getWeekRange(offset) {
  const today  = new Date();
  const day    = today.getDay();
  const diff   = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday, sunday };
}

function getWeekNumber(date) {
  const d      = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function formatDateShort(date) {
  return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

function countActiveDays(monday, persona, data, total) {
  const todayStr = getTodayKey();
  let count = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const key = localISODate(d);
    if (key > todayStr) continue;
    if ((data[key]?.[persona]?.length || 0) > 0) count++;
  }
  return count;
}
