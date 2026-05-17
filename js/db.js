// ─── BECOMING · db.js ────────────────────────────────────────────────────────
// Datenbankabstraktion: Habit-Definitionen, Completions, Reflexionen
// Kein direkter Supabase-Aufruf außerhalb dieser Datei und common.js

const _dbCache = {
  habitDefs:        {},  // { "disciplined": { 1: [habit,...], 2: [...], 3: [...] } }
  completions:      {},  // { "2025-04-30": { "disciplined": ["uuid1","uuid2"] } }
  reflections:      {},  // { "2025-04-30_disciplined": "text" }
  reflectionRows:   [],  // Rohzeilen für Tagebuch-Anzeige
};

let _dbUserId = null;

// ─── Initialisierung (aufgerufen von initPage in common.js) ──────────────────

async function initDbData(userId) {
  _dbUserId = userId;

  const [habitsRes, completionsRes, reflectionsRes] = await Promise.all([
    // difficulty_level existiert erst ab Migration 002 – Fallback ohne die Spalte
    db.from('habits')
      .select('id,persona_id,level,title,description,category,sort_order,is_default,user_id,difficulty_level')
      .is('deleted_at', null)
      .order('sort_order'),
    db.from('habit_completions')
      .select('habit_id,persona_id,day_date')
      .eq('user_id', userId),
    db.from('reflections')
      .select('*')
      .eq('user_id', userId),
  ]);

  // Falls difficulty_level fehlt (Migration 002 nicht ausgeführt) → Fallback ohne die Spalte
  let habitsData = habitsRes.data;
  if (habitsRes.error) {
    console.warn('[db] habits query failed, retrying without difficulty_level:', habitsRes.error.message);
    const fallback = await db.from('habits')
      .select('id,persona_id,level,title,description,category,sort_order,is_default,user_id')
      .is('deleted_at', null)
      .order('sort_order');
    if (fallback.error) {
      console.error('[db] habits fetch failed completely:', fallback.error.message);
    }
    habitsData = fallback.data;
  }

  if (completionsRes.error) console.error('[db] completions fetch failed:', completionsRes.error.message);
  if (reflectionsRes.error) console.error('[db] reflections fetch failed:', reflectionsRes.error.message);

  // Habit-Definitionen: { persona: { level: [{ id, title, desc, tag, isCustom, level, sortOrder, difficultyLevel }] } }
  _dbCache.habitDefs = {};
  (habitsData || []).forEach(h => {
    if (!_dbCache.habitDefs[h.persona_id]) {
      _dbCache.habitDefs[h.persona_id] = { 1: [], 2: [], 3: [] };
    }
    _dbCache.habitDefs[h.persona_id][h.level].push({
      id:              h.id,
      title:           h.title,
      desc:            h.description,
      tag:             h.category,
      isCustom:        !h.is_default,
      level:           h.level,
      sortOrder:       h.sort_order,
      difficultyLevel: h.difficulty_level,
    });
  });

  // Completions: { "2025-04-30": { "disciplined": ["uuid1",...] } }
  _dbCache.completions = {};
  (completionsRes.data || []).forEach(row => {
    const date    = row.day_date;
    const persona = row.persona_id;
    if (!_dbCache.completions[date]) _dbCache.completions[date] = {};
    if (!_dbCache.completions[date][persona]) _dbCache.completions[date][persona] = [];
    _dbCache.completions[date][persona].push(row.habit_id);
  });

  // Reflexionen
  _dbCache.reflections    = {};
  _dbCache.reflectionRows = reflectionsRes.data || [];
  _dbCache.reflectionRows.forEach(row => {
    const key = row.type === 'weekly'
      ? `weekly_${row.date}_${row.persona}`
      : `${row.date}_${row.persona}`;
    _dbCache.reflections[key] = row.content;
  });
}

// ─── Habit-Definitionen ───────────────────────────────────────────────────────

function getHabitsForPersona(persona) {
  const level = getPersonaLevel(persona);
  return _dbCache.habitDefs[persona]?.[level] || [];
}

function getHabitCountForPersona(persona) {
  return getHabitsForPersona(persona).length;
}

function getLevel1HabitsForPersona(persona) {
  return _dbCache.habitDefs[persona]?.[1] || [];
}

function getCustomHabitCount(persona) {
  const defs = _dbCache.habitDefs[persona] || {};
  let count = 0;
  [1, 2, 3].forEach(l => {
    (defs[l] || []).forEach(h => { if (h.isCustom) count++; });
  });
  return count;
}

// ─── Completion-Daten ─────────────────────────────────────────────────────────

function getHabitData() {
  return _dbCache.completions;
}

function getCompletionsForDay(persona, date) {
  return _dbCache.completions[date]?.[persona] || [];
}

async function completeHabit(habitId, persona, dayDate) {
  if (!_dbCache.completions[dayDate]) _dbCache.completions[dayDate] = {};
  if (!_dbCache.completions[dayDate][persona]) _dbCache.completions[dayDate][persona] = [];
  if (!_dbCache.completions[dayDate][persona].includes(habitId)) {
    _dbCache.completions[dayDate][persona].push(habitId);
  }

  await db.from('habit_completions').upsert(
    { user_id: _dbUserId, habit_id: habitId, persona_id: persona, day_date: dayDate },
    { onConflict: 'user_id,habit_id,day_date' }
  );
}

async function uncompleteHabit(habitId, persona, dayDate) {
  if (_dbCache.completions[dayDate]?.[persona]) {
    _dbCache.completions[dayDate][persona] =
      _dbCache.completions[dayDate][persona].filter(id => id !== habitId);
  }

  await db.from('habit_completions')
    .delete()
    .eq('user_id', _dbUserId)
    .eq('habit_id', habitId)
    .eq('day_date', dayDate);
}

// ─── Custom Habits ────────────────────────────────────────────────────────────

async function createCustomHabit(persona, { title, description, category, difficultyLevel, level }) {
  const levelDefs = _dbCache.habitDefs[persona]?.[level] || [];
  const maxSort   = levelDefs.reduce((m, h) => Math.max(m, h.sortOrder || 0), 0);

  const { data, error } = await db.from('habits').insert({
    persona_id:       persona,
    level,
    title,
    description:      description || null,
    category:         category    || null,
    difficulty_level: difficultyLevel || null,
    is_default:       false,
    user_id:          _dbUserId,
    sort_order:       maxSort + 1,
  }).select('id,persona_id,level,title,description,category,sort_order,is_default,user_id,difficulty_level').single();

  if (error) throw error;

  if (!_dbCache.habitDefs[persona]) _dbCache.habitDefs[persona] = { 1: [], 2: [], 3: [] };
  _dbCache.habitDefs[persona][level].push({
    id:              data.id,
    title:           data.title,
    desc:            data.description,
    tag:             data.category,
    isCustom:        true,
    level:           data.level,
    sortOrder:       data.sort_order,
    difficultyLevel: data.difficulty_level,
  });

  return data;
}

async function updateCustomHabit(habitId, persona, level, { title, description, category, difficultyLevel }) {
  const { error } = await db.from('habits').update({
    title,
    description:      description || null,
    category:         category    || null,
    difficulty_level: difficultyLevel || null,
    updated_at:       new Date().toISOString(),
  }).eq('id', habitId).eq('user_id', _dbUserId);

  if (error) throw error;

  const habit = (_dbCache.habitDefs[persona]?.[level] || []).find(h => h.id === habitId);
  if (habit) {
    habit.title           = title;
    habit.desc            = description || null;
    habit.tag             = category    || null;
    habit.difficultyLevel = difficultyLevel || null;
  }
}

async function deleteCustomHabit(habitId, persona, level) {
  const { error } = await db.from('habits').update({
    deleted_at: new Date().toISOString(),
  }).eq('id', habitId).eq('user_id', _dbUserId);

  if (error) throw error;

  if (_dbCache.habitDefs[persona]?.[level]) {
    _dbCache.habitDefs[persona][level] =
      _dbCache.habitDefs[persona][level].filter(h => h.id !== habitId);
  }
}

// ─── Optimistic Toggle mit Debounce ──────────────────────────────────────────

const _toggleDebounceMap = new Map();

function wrappedToggleHabit(habitId, persona, dayDate, isNowChecked, onSuccess, onError) {
  // Optimistisch Cache sofort aktualisieren
  if (isNowChecked) {
    if (!_dbCache.completions[dayDate]) _dbCache.completions[dayDate] = {};
    if (!_dbCache.completions[dayDate][persona]) _dbCache.completions[dayDate][persona] = [];
    if (!_dbCache.completions[dayDate][persona].includes(habitId)) {
      _dbCache.completions[dayDate][persona].push(habitId);
    }
  } else {
    if (_dbCache.completions[dayDate]?.[persona]) {
      _dbCache.completions[dayDate][persona] =
        _dbCache.completions[dayDate][persona].filter(id => id !== habitId);
    }
  }

  onSuccess?.();

  // Supabase-Call nach 300ms (debounced per habit)
  clearTimeout(_toggleDebounceMap.get(habitId));
  _toggleDebounceMap.set(habitId, setTimeout(async () => {
    _toggleDebounceMap.delete(habitId);
    try {
      if (isNowChecked) {
        await db.from('habit_completions').upsert(
          { user_id: _dbUserId, habit_id: habitId, persona_id: persona, day_date: dayDate },
          { onConflict: 'user_id,habit_id,day_date' }
        );
      } else {
        await db.from('habit_completions').delete()
          .eq('user_id', _dbUserId).eq('habit_id', habitId).eq('day_date', dayDate);
      }
    } catch (err) {
      // Cache zurückrollen
      if (isNowChecked) {
        if (_dbCache.completions[dayDate]?.[persona]) {
          _dbCache.completions[dayDate][persona] =
            _dbCache.completions[dayDate][persona].filter(id => id !== habitId);
        }
      } else {
        if (!_dbCache.completions[dayDate]) _dbCache.completions[dayDate] = {};
        if (!_dbCache.completions[dayDate][persona]) _dbCache.completions[dayDate][persona] = [];
        if (!_dbCache.completions[dayDate][persona].includes(habitId)) {
          _dbCache.completions[dayDate][persona].push(habitId);
        }
      }
      onError?.(err);
    }
  }, 300));
}

// ─── Reflexionen ──────────────────────────────────────────────────────────────

function getReflections()      { return _dbCache.reflections; }
function getReflectionEntries() { return _dbCache.reflectionRows; }

async function saveReflectionEntry(date, persona, type, text) {
  const key  = type === 'weekly' ? `weekly_${date}_${persona}` : `${date}_${persona}`;
  const prev = _dbCache.reflections[key];
  _dbCache.reflections[key] = text;

  // Rohzeile in reflectionRows aktuell halten
  const existing = _dbCache.reflectionRows.find(r => r.date === date && r.persona === persona && r.type === type);
  if (existing) {
    existing.content = text;
  } else {
    _dbCache.reflectionRows.push({ date, persona, type, content: text });
  }

  const { error } = await db.from('reflections').upsert(
    { user_id: _dbUserId, date, persona, type, content: text },
    { onConflict: 'user_id,date,persona,type' }
  );
  if (error) {
    _dbCache.reflections[key] = prev;
    if (existing) existing.content = prev;
    else _dbCache.reflectionRows.pop();
    throw error;
  }
}

// ─── Neuer Nutzer (aufgerufen nach Registrierung) ─────────────────────────────

async function initNewUser(userId, displayName) {
  await db.from('user_settings').insert({
    user_id: userId, display_name: displayName, active_persona: null,
  });
}
