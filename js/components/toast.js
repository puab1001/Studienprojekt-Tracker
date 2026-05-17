// ─── BECOMING · components/toast.js ─────────────────────────────────────────
// Toast-Benachrichtigungen: success | error | info
// Überschreibt showToast aus common.js

(function () {
  const _SVG = {
    success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    info:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  };

  let _container = null;

  function _ensureContainer() {
    if (_container && document.body.contains(_container)) return;
    _container = document.createElement('div');
    _container.id = 'toastContainer';
    _container.className = 'toast-container';
    document.body.appendChild(_container);
  }

  window.showToast = function showToast(message, type = 'info', duration = 3000) {
    _ensureContainer();

    const toast = document.createElement('div');
    toast.className = `toast-item toast-item--${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <span class="toast-icon">${_SVG[type] || _SVG.info}</span>
      <span class="toast-msg">${message}</span>
      <button class="toast-close" aria-label="Schließen" type="button">×</button>
    `;

    _container.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('toast-item--in')));

    const dismiss = () => {
      if (!toast.isConnected) return;
      clearTimeout(timer);
      toast.classList.remove('toast-item--in');
      toast.classList.add('toast-item--out');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    };

    const timer = setTimeout(dismiss, duration);
    toast.querySelector('.toast-close').addEventListener('click', dismiss);
  };
})();
