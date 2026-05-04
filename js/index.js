// ─── BECOMING · index.js ─────────────────────────────────────────────────────
// Landing Page: Modals, Carousel, Login, Registrierung

document.addEventListener('DOMContentLoaded', () => {

  // Falls bereits eingeloggt → direkt zum Hub
  if (getUser()) {
    window.location.href = '/logged_in_landing.html';
    return;
  }

  initModals();
  initCarousel();
  initAuthForms();

});

// ─── Modals ──────────────────────────────────────────────────────────────────

function initModals() {
  const loginModal    = document.getElementById('loginModal');
  const registerModal = document.getElementById('registerModal');
  const openLogin     = document.getElementById('openLogin');
  const openRegister  = document.getElementById('openRegister');

  openLogin?.addEventListener('click', () => openModal(loginModal));
  openRegister?.addEventListener('click', () => openModal(registerModal));

  // Schließen-Buttons (data-close Attribut)
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.close;
      closeModal(document.getElementById(id));
    });
  });

  // Klick außerhalb schließt Modal
  [loginModal, registerModal].forEach(modal => {
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  // ESC-Taste
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal(loginModal);
      closeModal(registerModal);
    }
  });
}

function openModal(modal) {
  if (!modal) return;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  // Erstes Input fokussieren
  setTimeout(() => modal.querySelector('input')?.focus(), 50);
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
}

// ─── Auth-Formulare ───────────────────────────────────────────────────────────

function initAuthForms() {
  initLoginForm();
  initRegisterForm();
}

function initLoginForm() {
  const modal = document.getElementById('loginModal');
  if (!modal) return;

  // Den "Anmelden"-Link durch einen echten Submit-Button ersetzen (funktional)
  const submitLink = modal.querySelector('.auth-submit');
  if (!submitLink) return;

  submitLink.addEventListener('click', (e) => {
    e.preventDefault();
    const email    = modal.querySelector('input[type="email"]')?.value.trim();
    const password = modal.querySelector('input[type="password"]')?.value;

    if (!email || !password) {
      showFormError(modal, 'Bitte alle Felder ausfüllen.');
      return;
    }

    // Gespeicherte User prüfen
    const users = getStoredUsers();
    const user  = users.find(u => u.email === email);

    if (!user) {
      showFormError(modal, 'Kein Konto mit dieser E-Mail gefunden.');
      return;
    }
    if (user.password !== btoa(password)) {
      showFormError(modal, 'Falsches Passwort.');
      return;
    }

    // Login erfolgreich
    saveUser({ name: user.name, email: user.email });
    window.location.href = '/logged_in_landing.html';
  });
}

function initRegisterForm() {
  const modal = document.getElementById('registerModal');
  if (!modal) return;

  const submitBtn = modal.querySelector('.auth-submit');
  if (!submitBtn) return;

  submitBtn.addEventListener('click', (e) => {
    e.preventDefault();

    const name     = modal.querySelector('input[type="text"]')?.value.trim();
    const email    = modal.querySelector('input[type="email"]')?.value.trim();
    const password = modal.querySelector('input[type="password"]')?.value;

    if (!name || !email || !password) {
      showFormError(modal, 'Bitte alle Felder ausfüllen.');
      return;
    }
    if (password.length < 6) {
      showFormError(modal, 'Passwort muss mindestens 6 Zeichen haben.');
      return;
    }

    const users = getStoredUsers();
    if (users.find(u => u.email === email)) {
      showFormError(modal, 'Diese E-Mail ist bereits registriert.');
      return;
    }

    // User speichern
    users.push({ name, email, password: btoa(password) });
    localStorage.setItem('becoming_users', JSON.stringify(users));

    // Direkt einloggen
    saveUser({ name, email });

    // Erste Persona freischalten
    localStorage.setItem('becoming_personas', JSON.stringify(['disciplined']));
    setActivePersona('disciplined');

    window.location.href = '/logged_in_landing.html';
  });
}

function getStoredUsers() {
  try {
    return JSON.parse(localStorage.getItem('becoming_users')) || [];
  } catch { return []; }
}

function showFormError(modal, message) {
  // Alten Fehler entfernen
  modal.querySelector('.form-error')?.remove();

  const err = document.createElement('div');
  err.className = 'form-error';
  err.style.cssText = 'color:#ef4444; font-size:13px; font-weight:600; padding:10px 14px; background:rgba(239,68,68,0.08); border-radius:12px; border:1px solid rgba(239,68,68,0.2);';
  err.textContent = message;

  const form = modal.querySelector('.auth-form');
  form?.insertBefore(err, form.firstChild);
}

// ─── Carousel ────────────────────────────────────────────────────────────────

function initCarousel() {
  const stage   = document.getElementById('carouselStage');
  const dots    = document.querySelectorAll('.dot');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (!stage) return;

  const slides = stage.querySelectorAll('.slide');
  let current  = 0;
  let autoTimer;

  function goTo(index) {
    slides[current].classList.remove('active');
    dots[current]?.classList.remove('active');

    current = (index + slides.length) % slides.length;

    slides[current].classList.add('active');
    dots[current]?.classList.add('active');
  }

  function startAuto() {
    autoTimer = setInterval(() => goTo(current + 1), 4500);
  }

  function resetAuto() {
    clearInterval(autoTimer);
    startAuto();
  }

  prevBtn?.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
  nextBtn?.addEventListener('click', () => { goTo(current + 1); resetAuto(); });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goTo(i); resetAuto(); });
  });

  // Touch-Swipe
  let touchStartX = 0;
  stage.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { goTo(current + (diff > 0 ? 1 : -1)); resetAuto(); }
  });

  startAuto();
}
