# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Becoming** is a German-language, persona-based habit tracking web app. It is a fully static multi-page application — no build step, no framework, no package manager. Development means editing HTML/CSS/JS files directly and opening them in a browser.

## Running the App

Serve the project root with any static file server:

```bash
# Python
python3 -m http.server 8080

# Node (if available)
npx serve .
```

Then open `http://localhost:8080` in a browser. There are no tests, no linter config, and no CI pipeline.

## Architecture

### Page → JS → CSS mapping

| Page | Script | Stylesheet |
|---|---|---|
| `index.html` | `js/index.js` + `js/common.js` | `css/landing.css` via `styles.css` |
| `logged_in_landing.html` | `js/hub.js` | `css/hub.css` |
| `dashboard.html` | `js/dashboard.js` | `css/dashboard.css` |
| `weekly.html` | `js/weekly.js` | `css/weekly.css` |
| `tagebuch.html` | inline `<script>` only | `css/journal.css` |

`css/common.css` and `js/common.js` are loaded on every authenticated page. `styles.css` in the root is only used by `index.html` and simply re-exports `common.css` + `landing.css`.

### Global state via `js/common.js`

`common.js` runs on every page and exposes global helper functions used by all other scripts. It also handles the auth guard (redirects unauthenticated users to `index.html`). Key localStorage keys and their accessor functions:

| Key | Accessor |
|---|---|
| `becoming_user` | `getUser()` / `saveUser()` / `logout()` |
| `becoming_users` | raw via `getStoredUsers()` in `index.js` |
| `becoming_habits` | `getHabitData()` / `saveHabitData()` |
| `becoming_reflections` | `getReflections()` / `saveReflections()` |
| `becoming_active_persona` | `getActivePersona()` / `setActivePersona()` |
| `becoming_personas` | `getUnlockedPersonas()` / `unlockPersona()` |

### Habit data schema

```js
// becoming_habits
{
  "2025-04-30": {          // getTodayKey() → ISO date string
    "disciplined": ["dh1", "dh3"],   // array of completed habit IDs
    "curious": ["ch2"]
  }
}
```

### Personas

Five fixed personas: `disciplined`, `curious`, `resilient`, `intentional`, `connected`. Each has:
- A CSS variable `--<persona>` (gradient) defined in `css/common.css`
- Habit definitions in `js/dashboard.js` → `PERSONA_HABITS`
- Metadata (label, quote, subtitle) in `js/dashboard.js` → `PERSONA_META`
- Trend categories in `js/weekly.js` → `getTrendCategories()`
- Hub metadata in `js/hub.js` → `HUB_PERSONA_META`

To add a new persona, all four of those locations must be updated along with the modal grids in `dashboard.html` and `logged_in_landing.html`.

### Auth flow

Passwords are stored as `btoa(password)` (Base64, not hashed) in `localStorage`. This is intentional for a university prototype — do not add real security measures without understanding the scope change.

### CSS structure

`css/common.css` defines all CSS custom properties (color tokens, shadows, radii, persona gradients, status colors). Page-specific stylesheets assume these variables exist. `css/landing.css` duplicates the `:root` block from `common.css` because `index.html` uses `styles.css` instead of `common.css` directly — keep these two `:root` blocks in sync if changing tokens.
