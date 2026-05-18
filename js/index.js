// ─── BECOMING · index.js ─────────────────────────────────────────────────────
// Landing Page: Modals, Carousel, Login, Registrierung

document.addEventListener('DOMContentLoaded', async () => {

  // Falls bereits eingeloggt → direkt zu Heute
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    window.location.href = 'logged_in_landing.html';
    return;
  }

  _setupThemeToggle();
  initModals();
  initCarousel();
  initAuthForms();
  initPasswordToggles();

});

// ─── Modals ──────────────────────────────────────────────────────────────────

function initModals() {
  const loginModal    = document.getElementById('loginModal');
  const registerModal = document.getElementById('registerModal');
  const openLogin     = document.getElementById('openLogin');
  const openRegister  = document.getElementById('openRegister');

  openLogin?.addEventListener('click', () => openModal(loginModal));
  openRegister?.addEventListener('click', () => openModal(registerModal));

  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.close;
      closeModal(document.getElementById(id));
    });
  });

  [loginModal, registerModal].forEach(modal => {
    modal?.addEventListener('click', e => {
      if (e.target === modal) closeModal(modal);
    });
  });

  document.addEventListener('keydown', e => {
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

  const submitLink = modal.querySelector('.auth-submit');
  if (!submitLink) return;

  submitLink.addEventListener('click', async e => {
    e.preventDefault();
    const email    = modal.querySelector('input[type="email"]')?.value.trim();
    const password = modal.querySelector('input[type="password"]')?.value;

    if (!email || !password) {
      showFormError(modal, 'Bitte alle Felder ausfüllen.');
      return;
    }

    submitLink.textContent = 'Wird angemeldet…';
    submitLink.style.opacity = '0.6';

    const { error } = await db.auth.signInWithPassword({ email, password });

    submitLink.textContent = 'Anmelden';
    submitLink.style.opacity = '';

    if (error) {
      showFormError(modal, 'E-Mail oder Passwort falsch.');
      return;
    }

    window.location.href = 'logged_in_landing.html';
  });
}

function initRegisterForm() {
  const modal = document.getElementById('registerModal');
  if (!modal) return;

  const submitBtn = modal.querySelector('.auth-submit');
  if (!submitBtn) return;

  submitBtn.addEventListener('click', async e => {
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

    submitBtn.textContent = 'Konto wird erstellt…';
    submitBtn.style.opacity = '0.6';

    const { data, error } = await db.auth.signUp({ email, password });

    submitBtn.textContent = 'Registrieren';
    submitBtn.style.opacity = '';

    if (error) {
      const msg = error.message.toLowerCase().includes('already')
        ? 'Diese E-Mail ist bereits registriert.'
        : error.message;
      showFormError(modal, msg);
      return;
    }

    const userId = data.user.id;
    await initNewUser(userId, name);

    localStorage.setItem('becoming_show_onboarding', 'true');
    window.location.href = 'logged_in_landing.html';
  });
}

function showFormError(modal, message) {
  modal.querySelector('.form-error')?.remove();

  const err = document.createElement('div');
  err.className = 'form-error';
  err.style.cssText = 'color:#ef4444;font-size:13px;font-weight:600;padding:10px 14px;background:rgba(239,68,68,0.08);border-radius:12px;border:1px solid rgba(239,68,68,0.2);';
  err.textContent = message;

  const form = modal.querySelector('.auth-form');
  form?.insertBefore(err, form.firstChild);
}

// ─── Passwort-Toggle ─────────────────────────────────────────────────────────

function initPasswordToggles() {
  document.querySelectorAll('.pw-toggle').forEach(btn => {
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', () => {
      const input = btn.closest('.input-wrap').querySelector('input');
      const isVisible = input.type === 'text';
      input.type = isVisible ? 'password' : 'text';
      btn.textContent = isVisible ? 'Anzeigen' : 'Verbergen';
    });
  });
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

  function startAuto() { autoTimer = setInterval(() => goTo(current + 1), 4500); }
  function resetAuto()  { clearInterval(autoTimer); startAuto(); }

  prevBtn?.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
  nextBtn?.addEventListener('click', () => { goTo(current + 1); resetAuto(); });
  dots.forEach((dot, i) => dot.addEventListener('click', () => { goTo(i); resetAuto(); }));

  let touchStartX = 0;
  stage.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { goTo(current + (diff > 0 ? 1 : -1)); resetAuto(); }
  });

  startAuto();
}
