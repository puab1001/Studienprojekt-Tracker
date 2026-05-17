// ─── BECOMING · tagebuch.js ───────────────────────────────────────────────────

const _TB_DAY_NAMES   = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const _TB_MONTH_SHORT = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];

let _tbWeekOffset  = 0;
let _tbOpenPersona = null;

// ─── Init ─────────────────────────────────────────────────────────────────────

async function initTagebuch() {
  const ok = await initPage();
  if (!ok) return;

  document.getElementById('tbPrevWeek')?.addEventListener('click', () => {
    if (_tbWeekOffset <= _tbMinWeekOffset()) return;
    _tbWeekOffset--;
    _tbOpenPersona = null;
    _renderWeekView();
  });

  document.getElementById('tbNextWeek')?.addEventListener('click', () => {
    if (_tbWeekOffset >= 0) return;
    _tbWeekOffset++;
    _tbOpenPersona = null;
    _renderWeekView();
  });

  _renderWeekView();
}

// ─── Week View ────────────────────────────────────────────────────────────────

function _renderWeekView() {
  _renderWeekLabel();
  _renderPersonaAccordions();
}

function _renderWeekLabel() {
  const { monday, sunday } = _tbWeekRange(_tbWeekOffset);
  const kw    = _tbWeekNumber(monday);
  const label = document.getElementById('tbWeekLabel');
  if (label) {
    label.textContent = `KW ${kw} · ${_tbFmtDate(monday)} – ${_tbFmtDate(sunday)} ${sunday.getFullYear()}`;
  }
  const nextBtn = document.getElementById('tbNextWeek');
  if (nextBtn) nextBtn.disabled = _tbWeekOffset >= 0;

  const prevBtn = document.getElementById('tbPrevWeek');
  if (prevBtn) prevBtn.disabled = _tbWeekOffset <= _tbMinWeekOffset();
}

function _renderPersonaAccordions() {
  const container = document.getElementById('tbPersonaAccordions');
  if (!container) return;

  const allPersonas = getUnlockedPersonas();
  const data        = getHabitData();
  const todayStr    = getTodayKey();
  const { monday, sunday } = _tbWeekRange(_tbWeekOffset);
  const mondayStr   = _tbLocalISO(monday);
  const sundayStr   = _tbLocalISO(sunday);

  // Only show personas that had already been started by this week's end
  const personas = allPersonas.filter(p => getPersonaCreatedAt(p) <= sundayStr);

  container.innerHTML = '';

  if (allPersonas.length === 0) {
    container.innerHTML = `
      <div class="tb-empty">
        <h3>Keine aktiven Personas</h3>
        <p>Füge eine Persona hinzu, um loszulegen.</p>
        <a href="/logged_in_landing.html" class="btn-primary tb-empty-cta">Zur Übersicht</a>
      </div>`;
    return;
  }

  if (personas.length === 0) {
    container.innerHTML = `
      <div class="tb-empty">
        <h3>Noch keine Persona aktiv</h3>
        <p>In dieser Woche waren noch keine Personas gestartet.</p>
      </div>`;
    return;
  }

  personas.forEach(personaKey => {
    const label     = getPersonaLabel(personaKey);
    const color     = getPersonaColor(personaKey);
    const total     = getHabitCountForPersona(personaKey);
    const createdAt = getPersonaCreatedAt(personaKey); // 'YYYY-MM-DD'

    // Build Mo–So (7 days from monday)
    const days = Array.from({ length: 7 }, (_, i) => {
      const d          = new Date(monday);
      d.setDate(d.getDate() + i);
      const dateStr    = _tbLocalISO(d);
      const isFuture   = dateStr > todayStr;
      const isPreStart = dateStr < createdAt;
      const done       = data[dateStr]?.[personaKey]?.length || 0;
      return { d, dateStr, isFuture, isPreStart, done };
    });

    // Week-status: nur echte aktive Tage (≥ created_at, nicht Zukunft)
    const activeDays = days.filter(day => !day.isFuture && !day.isPreStart);
    let weekStatus;
    if (activeDays.length === 0 || activeDays.every(day => day.done === 0)) {
      weekStatus = 'bad';
    } else if (total > 0 && activeDays.every(day => day.done >= total)) {
      weekStatus = 'good';
    } else {
      weekStatus = 'mid';
    }

    // Reflexionen für diese Persona in dieser Woche (nur Tage ab created_at)
    const reflFrom = createdAt > mondayStr ? createdAt : mondayStr;
    const weekReflections = getReflectionEntries()
      .filter(r =>
        r.persona === personaKey &&
        r.type    === 'daily' &&
        r.content?.trim() &&
        r.date >= reflFrom &&
        r.date <= sundayStr
      )
      .sort((a, b) => a.date.localeCompare(b.date));

    const isOpen  = _tbOpenPersona === personaKey;
    const section = document.createElement('div');
    section.className = `tb-accordion${isOpen ? ' tb-accordion--open' : ''}`;
    section.dataset.persona = personaKey;

    section.innerHTML = `
      <button class="tb-accordion-header" type="button">
        <div class="tb-acc-swatch" style="background:${color};"></div>
        <span class="tb-acc-label">${escapeHtml(label)}</span>
        <span class="tb-acc-status tb-status--${weekStatus}"></span>
        <span class="tb-acc-arrow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </button>
      <div class="tb-accordion-body">
        <div class="tb-days-row">
          ${days.map(({ d, dateStr, isFuture, isPreStart, done }, i) => {
            let dotStatus, countLabel;
            if (isPreStart) {
              dotStatus  = 'open';
              countLabel = 'Vor Start';
            } else if (isFuture) {
              dotStatus  = 'open';
              countLabel = '–';
            } else if (done === 0) {
              dotStatus  = 'bad';
              countLabel = `${done}/${total}`;
            } else if (done < total) {
              dotStatus  = 'mid';
              countLabel = `${done}/${total}`;
            } else {
              dotStatus  = 'good';
              countLabel = `${done}/${total}`;
            }
            const isToday = dateStr === todayStr;
            return `
              <div class="tb-day-cell${isToday ? ' tb-day-cell--today' : ''}${isPreStart ? ' tb-day-cell--prestart' : ''}">
                <div class="tb-day-name">${_TB_DAY_NAMES[i]}</div>
                <div class="tb-day-num">${d.getDate()}</div>
                <div class="tb-day-dot tb-status--${dotStatus}"></div>
                <div class="tb-day-count">${countLabel}</div>
              </div>`;
          }).join('')}
        </div>
        ${weekReflections.length > 0 ? `
          <div class="tb-refl-list">
            <div class="tb-refl-heading">Reflexionen</div>
            ${weekReflections.map(r => {
              const rd = new Date(r.date + 'T00:00:00');
              const dn = ['So','Mo','Di','Mi','Do','Fr','Sa'][rd.getDay()];
              return `
                <div class="tb-refl-item">
                  <div class="tb-refl-date">${dn}, ${rd.getDate()}. ${_TB_MONTH_SHORT[rd.getMonth()]}</div>
                  <div class="tb-refl-text">${escapeHtml(r.content.trim())}</div>
                </div>`;
            }).join('')}
          </div>` : ''}
      </div>
    `;

    section.querySelector('.tb-accordion-header').addEventListener('click', () => {
      _tbOpenPersona = _tbOpenPersona === personaKey ? null : personaKey;
      _renderPersonaAccordions();
    });

    container.appendChild(section);
  });
}

// ─── Minimum-Wochenoffset (frühestes Persona-Erstellungsdatum) ────────────────

function _tbMinWeekOffset() {
  const personas = getUnlockedPersonas();
  if (personas.length === 0) return 0;

  // Frühestes Erstellungsdatum aller aktiven Personas
  const earliest = personas.reduce((min, p) => {
    const c = getPersonaCreatedAt(p);
    return c < min ? c : min;
  }, getPersonaCreatedAt(personas[0]));

  // Montag der aktuellen Woche (offset 0)
  const today    = new Date();
  const todayDay = today.getDay();
  const curMonday = new Date(today);
  curMonday.setDate(today.getDate() + (todayDay === 0 ? -6 : 1 - todayDay));
  curMonday.setHours(0, 0, 0, 0);

  // Montag der Woche, die earliest enthält
  const ed      = new Date(earliest + 'T00:00:00');
  const edDay   = ed.getDay();
  const edMonday = new Date(ed);
  edMonday.setDate(ed.getDate() + (edDay === 0 ? -6 : 1 - edDay));
  edMonday.setHours(0, 0, 0, 0);

  return Math.round((edMonday.getTime() - curMonday.getTime()) / (7 * 86400000));
}

// ─── Datums-Helfer ────────────────────────────────────────────────────────────

function _tbWeekRange(offset) {
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

function _tbWeekNumber(date) {
  const d      = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function _tbFmtDate(d) {
  return `${d.getDate()}. ${_TB_MONTH_SHORT[d.getMonth()]}`;
}

function _tbLocalISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ─── Start ────────────────────────────────────────────────────────────────────
initTagebuch();
