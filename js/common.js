// ─── BECOMING · common.js ────────────────────────────────────────────────────
// Läuft auf allen Seiten: User-Menü, Auth-Guard, Name-Anzeige

document.addEventListener('DOMContentLoaded', () => {

  // ── Auth-Guard ──────────────────────────────────────────────────────────────
  const protectedPages = ['dashboard.html', 'logged_in_landing.html', 'tagebuch.html', 'weekly.html'];
  const currentPage = window.location.pathname.split('/').pop();

  if (protectedPages.includes(currentPage)) {
    const user = getUser();
    if (!user) {
      window.location.href = '/index.html';
      return;
    }
  }

  // ── Globale Navigation injizieren ──────────────────────────────────────────
  if (protectedPages.includes(currentPage)) {
    injectNavLinks(currentPage);
  }

  // ── User-Anzeige im Header ──────────────────────────────────────────────────
  const user = getUser();
  if (user) {
    // Avatar-Initialen
    const avatarEls = document.querySelectorAll('.avatar');
    const initials = getInitials(user.name);
    avatarEls.forEach(el => el.textContent = initials);

    // "Willkommen zurück"-Text (optional: Name einbauen)
    const chips = document.querySelectorAll('.user-chip');
    chips.forEach(chip => {
      const textSpan = chip.querySelectorAll('span')[1];
      if (textSpan) textSpan.textContent = `Hey, ${user.name.split(' ')[0]}`;
    });
  }

  // ── User-Dropdown-Toggle ────────────────────────────────────────────────────
  const toggleBtn = document.getElementById('userMenuToggle');
  const dropdown = document.getElementById('userDropdown');

  if (toggleBtn && dropdown) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });

    // Schließen bei Klick außerhalb
    document.addEventListener('click', () => {
      dropdown.classList.remove('active');
    });
  }

  // ── Ausloggen ───────────────────────────────────────────────────────────────
  const logoutLinks = document.querySelectorAll('a[href="/index.html"]');
  logoutLinks.forEach(link => {
    // Nur Links im Dropdown als Logout behandeln
    if (link.closest('.user-dropdown')) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    }
  });

});

// ─── Globale Navigation ───────────────────────────────────────────────────────

function injectNavLinks(currentPage) {
  const nav = document.querySelector('nav.nav');
  if (!nav) return;

  const pages = [
    { href: '/logged_in_landing.html', label: 'Hub',      key: 'logged_in_landing.html' },
    { href: '/dashboard.html',         label: 'Heute',    key: 'dashboard.html'         },
    { href: '/weekly.html',            label: 'Woche',    key: 'weekly.html'            },
    { href: '/tagebuch.html',          label: 'Tagebuch', key: 'tagebuch.html'          },
  ];

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-links';
  wrapper.innerHTML = pages.map(p =>
    `<a href="${p.href}" class="nav-link${currentPage === p.key ? ' active' : ''}">${p.label}</a>`
  ).join('');

  const navRight = nav.querySelector('.nav-right');
  navRight ? nav.insertBefore(wrapper, navRight) : nav.appendChild(wrapper);
}

// ─── Toast-Benachrichtigung ───────────────────────────────────────────────────

function showToast(message) {
  document.querySelector('.toast')?.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('toast--visible'));
  });

  setTimeout(() => {
    toast.classList.remove('toast--visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 3200);
}

// ─── Hilfsfunktionen (global verfügbar für alle anderen JS-Dateien) ──────────

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('becoming_user')) || null;
  } catch { return null; }
}

function saveUser(userData) {
  localStorage.setItem('becoming_user', JSON.stringify(userData));
}

function logout() {
  // User-Session löschen aber Habit-Daten behalten
  localStorage.removeItem('becoming_user');
  window.location.href = '/index.html';
}

function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(' ')
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

// ─── Daten-Helfer (für alle Seiten) ─────────────────────────────────────────

function getTodayKey() {
  return new Date().toISOString().split('T')[0]; // z.B. "2025-04-30"
}

function getHabitData() {
  try {
    return JSON.parse(localStorage.getItem('becoming_habits')) || {};
  } catch { return {}; }
}

function saveHabitData(data) {
  localStorage.setItem('becoming_habits', JSON.stringify(data));
}

function getReflections() {
  try {
    return JSON.parse(localStorage.getItem('becoming_reflections')) || {};
  } catch { return {}; }
}

function saveReflections(data) {
  localStorage.setItem('becoming_reflections', JSON.stringify(data));
}

function getActivePersona() {
  return localStorage.getItem('becoming_active_persona') || 'disciplined';
}

function setActivePersona(persona) {
  localStorage.setItem('becoming_active_persona', persona);
}

function getUnlockedPersonas() {
  try {
    return JSON.parse(localStorage.getItem('becoming_personas')) || ['disciplined'];
  } catch { return ['disciplined']; }
}

function unlockPersona(persona) {
  const personas = getUnlockedPersonas();
  if (!personas.includes(persona)) {
    personas.push(persona);
    localStorage.setItem('becoming_personas', JSON.stringify(personas));
  }
}
