// ─── BECOMING · common.js ────────────────────────────────────────────────────
// Läuft auf allen Seiten: Auth-Guard, Persona-Cache, globale UI-Helfer

// ─── In-Memory-Cache (Nutzer- und Persona-Daten) ─────────────────────────────

const _cache = {
  user:               null,
  unlockedPersonas:   [],
  personaLevels:      {},
  personaLevelDates:  {},
  personaDeletedAt:   {},
  personaCreatedAt:   {},
  personaDisplayMeta: {},
  activePersona:      'disciplined',
};

// ─── Seiten-Initialisierung ───────────────────────────────────────────────────

async function initPage() {
  const protectedPages = ['dashboard.html', 'logged_in_landing.html', 'tagebuch.html'];
  const currentPage    = window.location.pathname.split('/').pop() || 'index.html';

  const { data: { session } } = await db.auth.getSession();

  if (protectedPages.includes(currentPage) && !session) {
    window.location.href = '/index.html';
    return false;
  }

  if (!session) return true;

  const userId = session.user.id;

  const [settingsRes, personasRes] = await Promise.all([
    db.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
    db.from('user_personas').select('*').eq('user_id', userId),
  ]);

  _cache.user = {
    id:    userId,
    email: session.user.email,
    name:  settingsRes.data?.display_name || session.user.email,
  };
  _cache.activePersona = settingsRes.data?.active_persona || 'disciplined';

  _cache.unlockedPersonas  = [];
  _cache.personaLevels     = {};
  _cache.personaLevelDates = {};
  _cache.personaDeletedAt  = {};
  _cache.personaCreatedAt  = {};

  if (personasRes.data) {
    _cache.unlockedPersonas = personasRes.data.map(p => p.persona);
    personasRes.data.forEach(p => {
      _cache.personaLevels[p.persona]     = p.level || 1;
      _cache.personaLevelDates[p.persona] = p.level_updated_at || '1970-01-01';
      _cache.personaDeletedAt[p.persona]  = p.deleted_at || null;
      // created_at: ISO timestamp → strip to date-only string for easy comparison
      _cache.personaCreatedAt[p.persona]  = p.created_at
        ? p.created_at.slice(0, 10)
        : getTodayKey();
      if (p.display_name) {
        _cache.personaDisplayMeta[p.persona] = {
          name:  p.display_name,
          desc:  p.display_desc  || '',
          color: p.display_color || 'linear-gradient(135deg,#5b5cf0,#7f61f2)',
        };
      }
    });
  }

  // Habit-Defs, Completions und Reflexionen laden (aus db.js)
  await initDbData(userId);

  _setupNav(currentPage);
  _setupUserDisplay();
  _setupLogout();
  hideLoader();

  return true;
}

// ─── Synchrone Getter ─────────────────────────────────────────────────────────

function getUser()             { return _cache.user; }
function getActivePersona()    { return _cache.activePersona; }
function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function localISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getPersonaLevel(p)     { return _cache.personaLevels[p] || 1; }
function getPersonaLevelDate(p) { return _cache.personaLevelDates[p] || '1970-01-01'; }
function getPersonaCreatedAt(p) { return _cache.personaCreatedAt[p]  || getTodayKey(); }

function getUnlockedPersonas() {
  return _cache.unlockedPersonas.filter(p => !_cache.personaDeletedAt[p]);
}

function getDeletedPersonas() {
  return _cache.unlockedPersonas.filter(p => !!_cache.personaDeletedAt[p]);
}

// ─── Eigene vs. vordefinierte Personas ───────────────────────────────────────

const _DEFAULT_PERSONAS = new Set(['disciplined','curious','resilient','intentional','connected']);

const _PERSONA_LABELS = {
  disciplined: 'The Disciplined',
  curious:     'The Curious',
  resilient:   'The Resilient',
  intentional: 'The Intentional',
  connected:   'The Connected',
};

function getPersonaLabel(p) {
  return getPersonaDisplayName(p) || _PERSONA_LABELS[p] || p;
}

function isDefaultPersona(p)      { return _DEFAULT_PERSONAS.has(p); }
function getPersonaColor(p)       { return isDefaultPersona(p) ? `var(--${p})` : (_cache.personaDisplayMeta[p]?.color || 'linear-gradient(135deg,#5b5cf0,#7f61f2)'); }
function getPersonaDisplayName(p) { return _cache.personaDisplayMeta[p]?.name || null; }
function getPersonaDisplayDesc(p) { return _cache.personaDisplayMeta[p]?.desc || ''; }

// ─── Persona-Operationen (Cache + Supabase) ───────────────────────────────────

async function setActivePersonaAsync(persona) {
  const prev = _cache.activePersona;
  _cache.activePersona = persona;
  const { error } = await db.from('user_settings').upsert(
    { user_id: _cache.user.id, active_persona: persona },
    { onConflict: 'user_id' }
  );
  if (error) {
    _cache.activePersona = prev;
    throw error;
  }
}

async function unlockPersonaAsync(persona) {
  if (_cache.personaDeletedAt[persona] != null) {
    await restorePersona(persona);
    return;
  }
  if (_cache.unlockedPersonas.includes(persona)) return;

  const today = getTodayKey();
  const now   = new Date().toISOString();

  _cache.unlockedPersonas.push(persona);
  _cache.personaLevels[persona]     = 1;
  _cache.personaLevelDates[persona] = today;
  _cache.personaDeletedAt[persona]  = null;
  _cache.personaCreatedAt[persona]  = today;

  const { error } = await db.from('user_personas').upsert(
    { user_id: _cache.user.id, persona, level: 1, level_updated_at: today, created_at: now },
    { onConflict: 'user_id,persona' }
  );
  if (error) {
    _cache.unlockedPersonas = _cache.unlockedPersonas.filter(p => p !== persona);
    delete _cache.personaLevels[persona];
    delete _cache.personaLevelDates[persona];
    delete _cache.personaDeletedAt[persona];
    delete _cache.personaCreatedAt[persona];
    throw error;
  }
}

async function softDeletePersona(persona) {
  const now = new Date().toISOString();
  _cache.personaDeletedAt[persona] = now;

  const { error } = await db.from('user_personas')
    .update({ deleted_at: now })
    .eq('user_id', _cache.user.id)
    .eq('persona', persona);

  if (error) {
    console.error('[common] softDeletePersona failed:', error.message);
    _cache.personaDeletedAt[persona] = null;
    throw error;
  }
}

async function restorePersona(persona) {
  const prev = _cache.personaDeletedAt[persona];
  _cache.personaDeletedAt[persona] = null;

  const { error } = await db.from('user_personas')
    .update({ deleted_at: null })
    .eq('user_id', _cache.user.id)
    .eq('persona', persona);

  if (error) {
    _cache.personaDeletedAt[persona] = prev;
    throw error;
  }
}

async function createCustomPersonaAsync(name, desc, color) {
  const key   = `custom_${Date.now()}`;
  const today = getTodayKey();
  const now   = new Date().toISOString();

  _cache.unlockedPersonas.push(key);
  _cache.personaLevels[key]      = 1;
  _cache.personaLevelDates[key]  = today;
  _cache.personaDeletedAt[key]   = null;
  _cache.personaCreatedAt[key]   = today;
  _cache.personaDisplayMeta[key] = { name, desc: desc || '', color };

  const { error } = await db.from('user_personas').insert({
    user_id:          _cache.user.id,
    persona:          key,
    level:            1,
    level_updated_at: today,
    created_at:       now,
    display_name:     name,
    display_desc:     desc  || null,
    display_color:    color,
  });

  if (error) {
    _cache.unlockedPersonas = _cache.unlockedPersonas.filter(p => p !== key);
    delete _cache.personaLevels[key];
    delete _cache.personaLevelDates[key];
    delete _cache.personaDeletedAt[key];
    delete _cache.personaCreatedAt[key];
    delete _cache.personaDisplayMeta[key];
    throw error;
  }

  return key;
}

async function levelUpPersona(persona) {
  const current = getPersonaLevel(persona);
  if (current >= 3) return false;
  const newLevel = current + 1;
  const today    = getTodayKey();

  _cache.personaLevels[persona]     = newLevel;
  _cache.personaLevelDates[persona] = today;

  const { error } = await db.from('user_personas')
    .update({ level: newLevel, level_updated_at: today })
    .eq('user_id', _cache.user.id)
    .eq('persona', persona);

  if (error) {
    _cache.personaLevels[persona]     = current;
    _cache.personaLevelDates[persona] = getPersonaLevelDate(persona);
    throw error;
  }

  return true;
}

async function checkAndLevelUp(persona, habitTotal) {
  const level = getPersonaLevel(persona);
  if (level >= 3) return false;

  const levelSince = getPersonaLevelDate(persona);
  const data       = getHabitData();

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = localISODate(d);
    if (key <= levelSince) return false;
    if ((data[key]?.[persona]?.length || 0) < habitTotal) return false;
  }

  return levelUpPersona(persona);
}

// ─── Logout ───────────────────────────────────────────────────────────────────

async function logout() {
  try {
    await db.auth.signOut();
  } catch (e) {
    console.warn('Sign-out error (offline?):', e);
  }
  window.location.href = '/index.html';
}

// ─── Interne UI-Setup-Funktionen ──────────────────────────────────────────────

function _setupNav(currentPage) {
  const nav = document.querySelector('nav.nav');
  if (!nav) return;

  const activePersona = getActivePersona();
  const personaLabel  = getPersonaLabel(activePersona);
  const personaColor  = getPersonaColor(activePersona);

  const isHome      = currentPage === 'logged_in_landing.html';
  const isDashboard = currentPage === 'dashboard.html';
  const isTagebuch  = currentPage === 'tagebuch.html';

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-links';
  wrapper.innerHTML = `
    <a href="/logged_in_landing.html" class="nav-link${isHome ? ' active' : ''}">Home</a>
    <div class="nav-dropdown-wrap">
      <a href="/dashboard.html" class="nav-link nav-persona-pill${isDashboard ? ' active' : ''}" style="background:${personaColor};color:white;">
        ${escapeHtml(personaLabel)}
      </a>
      <div class="nav-dropdown" id="_navPersonaDrop"></div>
    </div>
    <a href="/tagebuch.html" class="nav-link${isTagebuch ? ' active' : ''}">Tagebuch</a>
  `;

  // Populate persona dropdown
  const drop = wrapper.querySelector('#_navPersonaDrop');
  if (drop) {
    const unlocked = getUnlockedPersonas();
    drop.innerHTML = unlocked.map(key => {
      const label  = getPersonaLabel(key);
      const color  = getPersonaColor(key);
      const isCur  = key === activePersona;
      return `<button class="nav-persona-item${isCur ? ' nav-persona-item--active' : ''}" type="button" data-persona="${escapeHtml(key)}">
        <span class="nav-persona-dot" style="background:${color};"></span>
        <span>${escapeHtml(label)}</span>
        ${isCur ? '<span class="nav-persona-check">✓</span>' : ''}
      </button>`;
    }).join('');
    drop.querySelectorAll('.nav-persona-item').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.preventDefault();
        e.stopPropagation();
        try { await setActivePersonaAsync(btn.dataset.persona); } catch (_) {}
        window.location.href = '/dashboard.html';
      });
    });
  }

  const burger = document.createElement('button');
  burger.className = 'nav-burger';
  burger.type = 'button';
  burger.setAttribute('aria-label', 'Navigation öffnen');
  burger.setAttribute('aria-expanded', 'false');
  burger.innerHTML = `<span></span><span></span><span></span>`;
  burger.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = nav.classList.toggle('nav--open');
    burger.setAttribute('aria-expanded', String(isOpen));
    burger.setAttribute('aria-label', isOpen ? 'Navigation schließen' : 'Navigation öffnen');
  });

  document.addEventListener('click', () => nav.classList.remove('nav--open'));

  const navRight = nav.querySelector('.nav-right');
  if (navRight) {
    nav.insertBefore(wrapper, navRight);
    nav.insertBefore(burger, navRight);
  } else {
    nav.appendChild(wrapper);
    nav.appendChild(burger);
  }
}

function _setupUserDisplay() {
  const user = getUser();
  if (!user) return;

  const initials = getInitials(user.name);
  document.querySelectorAll('.avatar').forEach(el => el.textContent = initials);
  document.querySelectorAll('.user-chip').forEach(chip => {
    const span = chip.querySelectorAll('span')[1];
    if (span) span.textContent = `Hey, ${user.name.split(' ')[0]}`;
  });

  const toggleBtn = document.getElementById('userMenuToggle');
  const dropdown  = document.getElementById('userDropdown');
  if (toggleBtn && dropdown) {
    toggleBtn.addEventListener('click', e => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });
    document.addEventListener('click', () => dropdown.classList.remove('active'));
  }

  _setupThemeToggle();
}

function _setupLogout() {
  document.querySelectorAll('a[href="/index.html"]').forEach(link => {
    if (link.closest('.user-dropdown')) {
      link.addEventListener('click', e => {
        e.preventDefault();
        logout();
      });
    }
  });
}

// ─── Globale Hilfsfunktionen ──────────────────────────────────────────────────

function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(' ').map(w => w[0].toUpperCase()).slice(0, 2).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// showToast ist als leichter Fallback definiert; components/toast.js überschreibt diese Funktion.
function showToast(message, type = 'info', duration = 3000) {
  document.querySelectorAll('.toast-legacy').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = 'toast toast--visible toast-legacy';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, duration);
}

function hideLoader() {
  const loader = document.getElementById('pageLoader');
  if (!loader) return;
  loader.classList.add('loader--fade');
  setTimeout(() => loader.remove(), 400);
}

const _SVG_MOON = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
const _SVG_SUN  = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`;

function _setupThemeToggle() {
  if (document.querySelector('.theme-toggle')) return;

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'theme-toggle';
  toggle.setAttribute('aria-label', 'Dark Mode umschalten');

  const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';
  toggle.innerHTML = isDark() ? _SVG_SUN : _SVG_MOON;

  toggle.addEventListener('click', () => {
    const dark = !isDark();
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('becoming_theme', dark ? 'dark' : 'light');
    toggle.innerHTML = dark ? _SVG_SUN : _SVG_MOON;
  });

  const target = document.querySelector('.nav-right') || document.querySelector('.nav-actions');
  if (target) target.prepend(toggle);
}

const _SVG_TROPHY = `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`;

function showLevelUpCelebration(persona, newLevel, personaLabel) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reducedMotion && window.confetti) {
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    setTimeout(() => {
      confetti({ particleCount: 60, spread: 100, origin: { y: 0.4, x: 0.25 }, angle: 60 });
      confetti({ particleCount: 60, spread: 100, origin: { y: 0.4, x: 0.75 }, angle: 120 });
    }, 300);
  }

  if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);

  const overlay = document.createElement('div');
  overlay.className = 'levelup-overlay';
  overlay.innerHTML = `
    <div class="levelup-card">
      <span class="levelup-star" style="color:var(--primary);">${_SVG_TROPHY}</span>
      <div class="levelup-pill">LEVEL UP</div>
      <h2 class="levelup-title">Level ${newLevel} erreicht!</h2>
      <div class="levelup-persona">${personaLabel}</div>
      <p class="levelup-desc">Du hast 7 Tage in Folge alle Habits abgeschlossen.<br>Deine Konsequenz hat sich ausgezahlt.</p>
      <button class="btn-primary" style="width:100%;" id="levelupClose">Weiter geht's!</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => {
    overlay.classList.add('levelup--out');
    setTimeout(() => overlay.remove(), 400);
  };

  overlay.querySelector('#levelupClose').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
}
