// ─── BECOMING · components/empty-states.js ───────────────────────────────────
// Einheitliche Empty-State-Komponenten für alle Seiten

function renderEmptyState(container, { icon, headline, subtext, cta }) {
  if (!container) return;
  const ctaHtml = cta
    ? (cta.href
        ? `<a href="${cta.href}" class="btn-primary empty-state-cta">${cta.label}</a>`
        : `<button type="button" class="btn-primary empty-state-cta" id="${cta.id || ''}">${cta.label}</button>`)
    : '';

  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <h3 class="empty-state-headline">${headline}</h3>
      <p class="empty-state-subtext">${subtext}</p>
      ${ctaHtml}
    </div>
  `;
}

// ─── Hub: keine aktiven Personas ─────────────────────────────────────────────

function renderHubEmptyState(container, onCTA) {
  const icon = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
  renderEmptyState(container, {
    icon,
    headline: 'Wähle deine erste Persona',
    subtext:  'Starte mit einer Entwicklungsrichtung und baue täglich neue Gewohnheiten auf.',
    cta: { label: 'Persona auswählen', id: 'emptyHubCTA' },
  });
  document.getElementById('emptyHubCTA')?.addEventListener('click', onCTA);
}

// ─── Dashboard: keine Habits auf aktuellem Level ──────────────────────────────

function renderDashboardEmptyState(container, persona, level, onAddHabit) {
  const icon = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>`;
  renderEmptyState(container, {
    icon,
    headline: `Keine Habits auf Level ${level}`,
    subtext:  `Diese Persona hat noch keine Habits auf Level ${level}. Füge eigene Habits hinzu, um zu starten.`,
    cta: { label: '+ Eigene Habit hinzufügen', id: 'emptyDashCTA' },
  });
  document.getElementById('emptyDashCTA')?.addEventListener('click', onAddHabit);
}

// ─── Weekly: keine Aktivität diese Woche ─────────────────────────────────────

function renderWeeklyEmptyState(container) {
  const icon = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
  renderEmptyState(container, {
    icon,
    headline: 'Noch keine Aktivität diese Woche',
    subtext:  'Beginne heute mit deinen Habits und baue eine Streak auf.',
    cta: { label: 'Zum Dashboard', href: 'dashboard.html' },
  });
}

// ─── Stats: weniger als 7 Tage Daten ─────────────────────────────────────────

function renderStatsEmptyState(container, activeDays) {
  const remaining = Math.max(0, 7 - activeDays);
  const icon = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`;
  renderEmptyState(container, {
    icon,
    headline: 'Stats werden klarer nach 7 Tagen',
    subtext:  activeDays === 0
      ? 'Starte deine ersten Habits, damit deine Statistiken sichtbar werden.'
      : `Du hast erst ${activeDays} aktive ${activeDays === 1 ? 'Tag' : 'Tage'}. Noch ${remaining} ${remaining === 1 ? 'Tag' : 'Tage'} bis aussagekräftige Trends sichtbar werden.`,
    cta: { label: 'Heute Habits tracken', href: 'dashboard.html' },
  });
}
