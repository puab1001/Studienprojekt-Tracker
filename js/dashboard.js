// ─── BECOMING · dashboard.js ─────────────────────────────────────────────────
// Habit-Checkboxen, Fortschritt, Level-System, Reflexion, Custom Habits

const PERSONA_META = {
  disciplined: {
    label: 'The Disciplined',
    quote: 'Konstanz schlägt Motivation.',
    subs: [
      'Heute liegt dein Fokus auf Selbstkontrolle, Routine und bewussten Entscheidungen.',
      'Du hast die Grundlagen gemeistert. Jetzt geht es um echte Disziplin.',
      'Meisterschaft: Disziplin auf höchstem Niveau – kein Kompromiss.',
    ],
  },
  curious: {
    label: 'The Curious',
    quote: 'Neugier öffnet Türen.',
    subs: [
      'Heute liegt dein Fokus auf Lernen, Offenheit und geistiger Bewegung.',
      'Tieferes Lernen: Nicht nur konsumieren, sondern reflektieren und verknüpfen.',
      'Wissensmeisterschaft: Erkenntnisse aktiv weitergeben und anwenden.',
    ],
  },
  resilient: {
    label: 'The Resilient',
    quote: 'Erholung ist auch Leistung.',
    subs: [
      'Heute liegt dein Fokus auf Regeneration, Anpassung und innerem Gleichgewicht.',
      'Tiefere Resilienz: Proaktiver Umgang mit Stress und Erschöpfung.',
      'Meisterschaft: Körper und Geist auf höchstem Level trainieren.',
    ],
  },
  intentional: {
    label: 'The Intentional',
    quote: 'Weniger, aber richtiger.',
    subs: [
      'Heute liegt dein Fokus auf klaren Prioritäten und bewussten Entscheidungen.',
      'Erweiterte Intentionalität: Struktur und Fokus auf einem neuen Level.',
      'Meisterschaft: Vollständige Kontrolle über Energie und Aufmerksamkeit.',
    ],
  },
  connected: {
    label: 'The Connected',
    quote: 'Echte Verbindung braucht Präsenz.',
    subs: [
      'Heute liegt dein Fokus auf Empathie, Zuhören und menschlicher Nähe.',
      'Tiefere Verbindung: Nicht nur präsent sein, sondern aktiv investieren.',
      'Meisterschaft: Beziehungen auf tiefster Ebene pflegen und stärken.',
    ],
  },
};

// Inline SVG icons for custom habit action buttons
const _SVG_EDIT = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
const _SVG_TRASH = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
const _SVG_PLUS = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

// ─── Seiten-Start ─────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {

  const ok = await initPage();
  if (!ok) return;

  const persona = getActivePersona();
  renderPersonaHeader(persona);
  renderHabits(persona);
  renderStats();
  initReflection();

});

// ─── Persona-Header ───────────────────────────────────────────────────────────

function renderPersonaHeader(persona) {
  const level = getPersonaLevel(persona);

  let label, quote, sub;
  if (isDefaultPersona(persona)) {
    const meta = PERSONA_META[persona];
    if (!meta) return;
    label = meta.label;
    quote = meta.quote;
    sub   = meta.subs[level - 1] || meta.subs[0];
  } else {
    label = getPersonaDisplayName(persona) || 'Eigene Persona';
    quote = 'Dein eigener Weg.';
    sub   = getPersonaDisplayDesc(persona) || 'Verfolge deine eigenen Gewohnheiten und baue deine individuelle Persona auf.';
  }

  const eyebrow = document.querySelector('.eyebrow');
  const h1      = document.querySelector('.hero-copy h1');
  const subP    = document.querySelector('.hero-copy > p');

  if (eyebrow) eyebrow.textContent = `${label} · Level ${level}`;
  if (h1)      h1.textContent      = quote;
  if (subP)    subP.textContent    = sub;

  const color = getPersonaColor(persona);
  const heroWrap = document.querySelector('.hero-copy-wrap');
  if (heroWrap) heroWrap.style.background = color;

  const heroVisual = document.querySelector('.hero-visual');
  if (heroVisual) {
    heroVisual.style.background = color;
    const initial = label.replace('The ', '')[0];
    heroVisual.innerHTML = `
      <div class="persona-art">
        <div class="art-orb art-orb--1"></div>
        <div class="art-orb art-orb--2"></div>
        <div class="art-orb art-orb--3"></div>
        <div class="art-letter">${initial}</div>
      </div>
    `;
  }

  renderHeroStats(persona);
}

function _animateUpdate(el, newText) {
  if (!el || el.textContent === newText) return;
  el.textContent = newText;
  el.classList.remove('value-updated');
  void el.offsetWidth; // reflow to restart animation
  el.classList.add('value-updated');
  el.addEventListener('animationend', () => el.classList.remove('value-updated'), { once: true });
}

function renderHeroStats(persona) {
  const stats   = calcStats(persona);
  const statEls = document.querySelectorAll('.hero-stat strong');
  if (statEls.length >= 3) {
    _animateUpdate(statEls[0], `Level ${String(stats.level).padStart(2, '0')}`);
    _animateUpdate(statEls[1], `${stats.streak} ${stats.streak === 1 ? 'Tag' : 'Tage'}`);
    _animateUpdate(statEls[2], `${stats.weeklyXP} XP`);
  }
}

// ─── Habits rendern ───────────────────────────────────────────────────────────

const _SVG_CHECK_PATH = `<svg class="habit-check-svg" viewBox="0 0 22 22" aria-hidden="true"><path class="check-path" d="M5 11l4.5 4.5L17 7" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function renderHabitItem(h, todayDone) {
  const checked = todayDone.includes(h.id) ? 'checked' : '';
  const title   = escapeHtml(h.title);
  const desc    = escapeHtml(h.desc);
  const tag     = escapeHtml(h.tag);
  if (h.isCustom) {
    return `
      <label class="habit-item habit-item--custom">
        <div class="habit-check-wrap">
          <input class="habit-check" type="checkbox" data-id="${h.id}" ${checked}>
          ${_SVG_CHECK_PATH}
        </div>
        <div>
          <div class="habit-title">${title} <span class="habit-badge-custom">Eigen</span></div>
          <div class="habit-desc">${desc || ''}</div>
        </div>
        <span class="habit-tag">${tag || ''}</span>
        <div class="habit-actions">
          <button class="habit-action-btn" type="button" data-action="edit" data-id="${h.id}" aria-label="Bearbeiten">${_SVG_EDIT}</button>
          <button class="habit-action-btn habit-action-btn--delete" type="button" data-action="delete" data-id="${h.id}" aria-label="Löschen">${_SVG_TRASH}</button>
        </div>
      </label>
    `;
  }
  return `
    <label class="habit-item">
      <div class="habit-check-wrap">
        <input class="habit-check" type="checkbox" data-id="${h.id}" ${checked}>
        ${_SVG_CHECK_PATH}
      </div>
      <div>
        <div class="habit-title">${title}</div>
        <div class="habit-desc">${desc}</div>
      </div>
      <span class="habit-tag">${tag}</span>
    </label>
  `;
}

function renderAddHabitButton(persona) {
  if (isDefaultPersona(persona)) return '';
  const count   = getCustomHabitCount(persona);
  if (count >= 10) {
    return `<div class="add-habit-limit">Maximale Anzahl eigener Habits (10) erreicht.</div>`;
  }
  return `<button class="add-habit-btn" type="button" id="addCustomHabitBtn">${_SVG_PLUS} Eigene Habit hinzufügen</button>`;
}

function renderHabits(persona) {
  const habits    = getHabitsForPersona(persona);
  const todayKey  = getTodayKey();
  const todayDone = getCompletionsForDay(persona, todayKey);

  const container = document.querySelector('.habits');
  if (!container) return;

  const level = getPersonaLevel(persona);
  const levelLabel = level === 3 ? 'Max Level' : `Level ${level}`;

  if (habits.length === 0) {
    container.innerHTML = `
      <div class="level-badge-row">
        <span class="level-badge level-badge--${persona}">${levelLabel}</span>
      </div>
    `;
    if (typeof renderDashboardEmptyState === 'function') {
      const emptyWrap = document.createElement('div');
      container.appendChild(emptyWrap);
      renderDashboardEmptyState(emptyWrap, persona, level, () => showCustomHabitModal(persona));
    } else {
      container.innerHTML += renderAddHabitButton(persona);
    }
    document.getElementById('addCustomHabitBtn')?.addEventListener('click', () => showCustomHabitModal(persona));
    updateProgress(persona);
    return;
  }

  container.innerHTML = `
    <div class="level-badge-row">
      <span class="level-badge level-badge--${persona}">${levelLabel}</span>
      ${level < 3 ? `<span class="level-hint">7 Tage alle Habits → Level ${level + 1}</span>` : '<span class="level-hint">Du hast das Maximum erreicht!</span>'}
    </div>
    ${habits.map(h => renderHabitItem(h, todayDone)).join('')}
    ${renderAddHabitButton(persona)}
  `;

  container.querySelectorAll('.habit-check').forEach(cb => {
    cb.addEventListener('change', () => {
      const habitId    = cb.dataset.id;
      const isChecked  = cb.checked;
      wrappedToggleHabit(
        habitId, persona, todayKey, isChecked,
        () => onHabitChange(persona).catch(err => console.error('onHabitChange error:', err)),
        () => {
          cb.checked = !isChecked;
          updateProgress(persona);
          renderHeroStats(persona);
          renderStats();
          showToast('Konnte nicht speichern, bitte erneut versuchen.', 'error');
        }
      );
    });
  });

  container.querySelectorAll('.habit-action-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const habitId = btn.dataset.id;
      if (btn.dataset.action === 'edit') {
        const habit = getHabitsForPersona(persona).find(h => h.id === habitId);
        if (habit) showCustomHabitModal(persona, habit);
      } else if (btn.dataset.action === 'delete') {
        confirmDeleteCustomHabit(habitId, persona);
      }
    });
  });

  document.getElementById('addCustomHabitBtn')?.addEventListener('click', () => {
    showCustomHabitModal(persona);
  });

  updateProgress(persona);
}

async function onHabitChange(persona) {
  const habits   = getHabitsForPersona(persona);
  const todayKey = getTodayKey();
  const done     = getCompletionsForDay(persona, todayKey);

  updateProgress(persona);
  renderHeroStats(persona);
  renderStats();

  if (done.length === habits.length && habits.length > 0) {
    showToast('Alle Habits erledigt — starker Tag!', 'success');

    const leveled = await checkAndLevelUp(persona, habits.length);
    if (leveled) {
      const newLevel = getPersonaLevel(persona);
      showLevelUpCelebration(persona, newLevel, PERSONA_META[persona].label);
      setTimeout(() => {
        renderPersonaHeader(persona);
        renderHabits(persona);
      }, 500);
    }
  }
}

// ─── Fortschrittsbalken ───────────────────────────────────────────────────────

function updateProgress(persona) {
  const habits   = getHabitsForPersona(persona);
  const todayKey = getTodayKey();
  const done     = getCompletionsForDay(persona, todayKey).length;
  const total    = habits.length;
  const pct      = total ? Math.round((done / total) * 100) : 0;

  const bar  = document.querySelector('.progress-card .progress-line span');
  const meta = document.querySelectorAll('.progress-meta span');

  if (bar)     bar.style.width = `${pct}%`;
  if (meta[0]) meta[0].textContent = `${pct}% Tagesfortschritt`;
  if (meta[1]) meta[1].textContent = `${done} von ${total} erledigt`;

  const sub = document.querySelector('.progress-card .section-sub');
  if (sub) sub.textContent = `${done} von ${total} täglichen Habits abgeschlossen`;

  const progressCard = document.querySelector('.progress-card');
  if (progressCard) {
    const isComplete = done === total && total > 0;
    progressCard.classList.toggle('progress-card--complete', isComplete);
    const h2 = progressCard.querySelector('h2');
    if (h2) h2.textContent = isComplete ? 'Perfekter Tag! Alle Habits erledigt.' : 'Dein Fortschritt heute';
  }
}

// ─── Mini-Stats ───────────────────────────────────────────────────────────────

function renderStats() {
  const persona  = getActivePersona();
  const stats    = calcStats(persona);
  const statEls  = document.querySelectorAll('.mini-stat strong');
  const today    = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });

  if (statEls[0]) statEls[0].textContent = String(getHabitsForPersona(persona).length).padStart(2, '0');
  if (statEls[1]) statEls[1].textContent = `${stats.weekRate}%`;
  if (statEls[2]) statEls[2].textContent = String(stats.level).padStart(2, '0');
  if (statEls[3]) statEls[3].textContent = today;
}

// ─── Statistik-Berechnungen ───────────────────────────────────────────────────

function calcStats(persona) {
  const data   = getHabitData();
  const total  = getHabitCountForPersona(persona);
  const level  = getPersonaLevel(persona);

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d   = new Date(today);
    d.setDate(d.getDate() - i);
    const key = localISODate(d);
    if ((data[key]?.[persona]?.length || 0) > 0) streak++;
    else if (i > 0) break;
  }

  const weekDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    weekDays.push(localISODate(d));
  }

  let weekDone = 0, weekPossible = 0, weeklyXP = 0;
  weekDays.forEach(key => {
    const done    = data[key]?.[persona]?.length || 0;
    weekDone     += done;
    weekPossible += total;
    weeklyXP     += done * 10;
  });

  const weekRate = weekPossible ? Math.round((weekDone / weekPossible) * 100) : 0;

  return { streak, weekRate, weeklyXP, level };
}

// ─── Custom Habit Modal ───────────────────────────────────────────────────────

let _editingHabitId    = null;
let _editingHabitLevel = null;

function _ensureCustomHabitModal() {
  if (document.getElementById('customHabitModal')) return;

  const overlay = document.createElement('div');
  overlay.className = 'persona-modal-overlay';
  overlay.id = 'customHabitModal';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="persona-modal-card custom-habit-modal-card">
      <button class="persona-modal-close" id="closeCustomHabitModal" type="button" aria-label="Schließen">×</button>
      <h3 id="customHabitModalTitle">Eigene Habit hinzufügen</h3>
      <p id="customHabitModalSub" style="margin:0 0 0;color:var(--muted);line-height:1.6;">Erstelle eine Habit, die zu deiner Persona passt.</p>

      <form class="custom-habit-form" id="customHabitForm" novalidate>
        <div class="chf-field">
          <label for="chf-title">Titel <span class="chf-required">*</span></label>
          <input id="chf-title" type="text" placeholder="z.B. Jeden Morgen spazieren gehen" maxlength="80">
          <div class="field-error" id="chf-title-error"></div>
        </div>

        <div class="chf-field">
          <label for="chf-desc">Beschreibung <span class="chf-optional">(optional)</span></label>
          <textarea id="chf-desc" placeholder="Was genau bedeutet diese Habit für dich?" rows="3" maxlength="300"></textarea>
          <div class="field-error" id="chf-desc-error"></div>
        </div>

        <div class="chf-row">
          <div class="chf-field">
            <label for="chf-category">Kategorie</label>
            <input id="chf-category" type="text" placeholder="z.B. Bewegung" maxlength="40">
          </div>
          <div class="chf-field">
            <label for="chf-level">Level</label>
            <select id="chf-level">
              <option value="1">Level 1 – Einsteiger</option>
              <option value="2">Level 2 – Fortgeschritten</option>
              <option value="3">Level 3 – Meisterschaft</option>
            </select>
          </div>
        </div>

        <div class="chf-field">
          <label>Schwierigkeit: <strong id="chf-diff-label">3 / 5</strong></label>
          <div class="chf-slider-wrap">
            <span class="chf-slider-min">1</span>
            <input id="chf-difficulty" type="range" min="1" max="5" value="3" class="chf-slider">
            <span class="chf-slider-max">5</span>
          </div>
          <div class="chf-slider-ticks">
            <span>Leicht</span><span></span><span>Mittel</span><span></span><span>Schwer</span>
          </div>
        </div>

        <div class="chf-actions">
          <button type="button" id="customHabitCancel" class="persona-back">Abbrechen</button>
          <button type="submit" class="btn-save chf-submit" id="customHabitSubmit">Habit speichern</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('closeCustomHabitModal')?.addEventListener('click', hideCustomHabitModal);
  document.getElementById('customHabitCancel')?.addEventListener('click', hideCustomHabitModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) hideCustomHabitModal(); });

  document.getElementById('chf-difficulty')?.addEventListener('input', function () {
    document.getElementById('chf-diff-label').textContent = `${this.value} / 5`;
  });
}

function showCustomHabitModal(persona, habit = null) {
  _ensureCustomHabitModal();

  const overlay = document.getElementById('customHabitModal');
  const form    = document.getElementById('customHabitForm');

  _editingHabitId    = habit?.id    || null;
  _editingHabitLevel = habit?.level || null;

  // Reset
  form.reset();
  document.querySelectorAll('#customHabitModal .field-error').forEach(el => { el.textContent = ''; });

  const titleEl   = document.getElementById('customHabitModalTitle');
  const subEl     = document.getElementById('customHabitModalSub');
  const levelSel  = document.getElementById('chf-level');
  const submitBtn = document.getElementById('customHabitSubmit');

  if (habit) {
    titleEl.textContent  = 'Habit bearbeiten';
    subEl.textContent    = 'Ändere die Details deiner eigenen Habit.';
    submitBtn.textContent = 'Änderungen speichern';

    document.getElementById('chf-title').value      = habit.title;
    document.getElementById('chf-desc').value       = habit.desc  || '';
    document.getElementById('chf-category').value   = habit.tag   || '';
    const diff = habit.difficultyLevel || 3;
    document.getElementById('chf-difficulty').value = diff;
    document.getElementById('chf-diff-label').textContent = `${diff} / 5`;

    // Level is fixed for existing habits (moving between levels is out of scope)
    levelSel.value    = habit.level;
    levelSel.disabled = true;
    levelSel.title    = 'Das Level kann nach dem Erstellen nicht mehr geändert werden.';
  } else {
    titleEl.textContent  = 'Eigene Habit hinzufügen';
    subEl.textContent    = 'Erstelle eine Habit, die zu deiner Persona passt.';
    submitBtn.textContent = 'Habit speichern';

    levelSel.value    = getPersonaLevel(persona);
    levelSel.disabled = false;
    levelSel.title    = '';
    document.getElementById('chf-diff-label').textContent = '3 / 5';
  }

  form.onsubmit = e => _handleCustomHabitSubmit(e, persona);

  overlay.classList.add('active');
  setTimeout(() => document.getElementById('chf-title')?.focus(), 80);
}

function hideCustomHabitModal() {
  document.getElementById('customHabitModal')?.classList.remove('active');
  _editingHabitId    = null;
  _editingHabitLevel = null;
  const levelSel = document.getElementById('chf-level');
  if (levelSel) { levelSel.disabled = false; levelSel.title = ''; }
}

async function _handleCustomHabitSubmit(e, persona) {
  e.preventDefault();

  // Clear errors
  document.querySelectorAll('#customHabitModal .field-error').forEach(el => { el.textContent = ''; });

  const titleVal = document.getElementById('chf-title').value.trim();
  const descVal  = document.getElementById('chf-desc').value.trim();

  let valid = true;
  if (titleVal.length < 2) {
    document.getElementById('chf-title-error').textContent = 'Mindestens 2 Zeichen erforderlich.';
    valid = false;
  } else if (titleVal.length > 80) {
    document.getElementById('chf-title-error').textContent = 'Maximal 80 Zeichen erlaubt.';
    valid = false;
  }
  if (descVal.length > 300) {
    document.getElementById('chf-desc-error').textContent = 'Maximal 300 Zeichen erlaubt.';
    valid = false;
  }
  if (!valid) return;

  const submitBtn = document.getElementById('customHabitSubmit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Wird gespeichert …';

  try {
    const payload = {
      title:           titleVal,
      description:     descVal || null,
      category:        document.getElementById('chf-category').value.trim() || null,
      difficultyLevel: parseInt(document.getElementById('chf-difficulty').value, 10),
      level:           parseInt(document.getElementById('chf-level').value, 10),
    };

    if (_editingHabitId) {
      await updateCustomHabit(_editingHabitId, persona, _editingHabitLevel, payload);
      showToast('Habit aktualisiert.', 'success');
    } else {
      await createCustomHabit(persona, payload);
      showToast('Neue Habit erstellt!', 'success');
    }

    hideCustomHabitModal();
    renderHabits(persona);
    updateProgress(persona);
    renderStats();
  } catch (err) {
    console.error('Custom habit save error:', err);
    showToast('Fehler beim Speichern. Bitte erneut versuchen.', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = _editingHabitId ? 'Änderungen speichern' : 'Habit speichern';
  }
}

function confirmDeleteCustomHabit(habitId, persona) {
  const habit = getHabitsForPersona(persona).find(h => h.id === habitId);
  if (!habit) return;

  const overlay = document.createElement('div');
  overlay.className = 'persona-modal-overlay active';
  overlay.innerHTML = `
    <div class="persona-modal-card confirm-delete-card">
      <h3 class="confirm-delete-title">Habit löschen?</h3>
      <p class="confirm-delete-text">
        <strong>${escapeHtml(habit.title)}</strong> wird als gelöscht markiert.<br>
        Bisherige Erledigungen bleiben erhalten.
      </p>
      <div class="confirm-delete-actions">
        <button class="btn-ghost" id="_delCancel">Abbrechen</button>
        <button class="btn-danger" id="_delOk">Löschen</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('#_delCancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  overlay.querySelector('#_delOk').addEventListener('click', async () => {
    overlay.remove();
    try {
      await deleteCustomHabit(habitId, persona, habit.level);
      showToast('Habit gelöscht.', 'success');
      renderHabits(persona);
      updateProgress(persona);
      renderStats();
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Fehler beim Löschen.', 'error');
    }
  });
}

// ─── Reflexion ────────────────────────────────────────────────────────────────

let reflectionAutoSaveTimer = null;

function updateReflectionCounter() {
  const box     = document.querySelector('.reflection-box');
  const counter = document.querySelector('.reflection-counter');
  if (!counter || !box) return;
  const n = box.textContent.trim().length;
  counter.textContent = n > 0 ? `${n} Zeichen` : '';
}

function initReflection() {
  const box     = document.querySelector('.reflection-box');
  const saveBtn = document.getElementById('saveBtn');
  if (!box) return;

  const todayKey = getTodayKey();
  const persona  = getActivePersona();
  box.textContent = getReflections()[`${todayKey}_${persona}`] || '';

  const counter = document.createElement('div');
  counter.className = 'reflection-counter';
  box.insertAdjacentElement('afterend', counter);
  updateReflectionCounter();

  box.addEventListener('input', () => {
    if (box.innerHTML === '<br>') box.innerHTML = '';
    updateReflectionCounter();
    scheduleAutoSave(box, persona);
  });

  saveBtn?.addEventListener('click', () => saveReflection(box, persona));

  box.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveReflection(box, persona);
  });
}

function scheduleAutoSave(box, persona) {
  clearTimeout(reflectionAutoSaveTimer);
  reflectionAutoSaveTimer = setTimeout(() => saveReflection(box, persona, true), 2000);
}

async function saveReflection(box, persona, silent = false) {
  const text     = box.textContent.trim();
  const todayKey = getTodayKey();

  try {
    await saveReflectionEntry(todayKey, persona, 'daily', text);
    if (!silent) {
      const btn = document.getElementById('saveBtn');
      if (btn) {
        btn.textContent = '✓ Gespeichert';
        btn.classList.add('saved');
        setTimeout(() => { btn.textContent = 'Speichern'; btn.classList.remove('saved'); }, 2000);
      }
    }
  } catch (err) {
    console.error('[dashboard] saveReflection failed:', err.message);
    if (!silent) showToast('Reflexion konnte nicht gespeichert werden.', 'error');
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

  overlay?.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('active');
  });
}

function updatePersonaModalActive() {
  const current = getActivePersona();
  const all     = getUnlockedPersonas();
  const grid    = document.getElementById('activePersonaGrid');
  if (!grid) return;

  grid.innerHTML = all.map(p => {
    const isDefault = isDefaultPersona(p);
    const name  = isDefault ? (PERSONA_META[p]?.label || p) : (getPersonaDisplayName(p) || 'Eigene Persona');
    const desc  = isDefault ? (PERSONA_META[p]?.subs[0] || '') : getPersonaDisplayDesc(p);
    const color = getPersonaColor(p);
    const active = current === p ? 'persona-option--active' : '';
    return `
      <button class="persona-option ${active}" type="button" data-persona="${p}">
        <div class="persona-option-visual" style="background:${color};"></div>
        <h4>${escapeHtml(name)}</h4>
        <p>${escapeHtml(desc)}</p>
      </button>
    `;
  }).join('');

  grid.querySelectorAll('.persona-option').forEach(btn => {
    btn.addEventListener('click', async () => {
      const persona = btn.dataset.persona;
      if (persona) {
        await switchPersona(persona);
        document.getElementById('personaModal')?.classList.remove('active');
      }
    });
  });
}

async function switchPersona(persona) {
  clearTimeout(reflectionAutoSaveTimer);
  await setActivePersonaAsync(persona);
  renderPersonaHeader(persona);
  renderHabits(persona);
  renderStats();

  const box      = document.querySelector('.reflection-box');
  const todayKey = getTodayKey();
  const saved    = getReflections()[`${todayKey}_${persona}`];
  if (box) {
    box.textContent = saved || '';
    updateReflectionCounter();
    box.oninput = () => {
      if (box.innerHTML === '<br>') box.innerHTML = '';
      updateReflectionCounter();
      scheduleAutoSave(box, persona);
    };
  }
}
