# AirSense — Project Structure

This is the **locked folder structure** for the entire capstone (Days 3–10). It matches what's already scaffolded in your local repo as of today.

```
airsense/
├── index.html                          # The single page — all sections live here
├── css/
│   └── style.css                       # All styling: layout, design system, responsiveness, animations
├── js/
│   ├── app.js                          # Main controller — wires DOM events to the other modules
│   ├── api.js                          # All Open-Meteo fetch logic (geocoding, AQI, weather)
│   ├── claude.js                       # Frontend caller for our own Netlify Function
│   ├── ui.js                           # All DOM rendering (snapshot, AI card, safety score, errors)
│   └── score.js                        # Safety Score calculation logic (AQI → grade/label/color)
├── netlify/
│   └── functions/
│       └── get-recommendation.js       # Serverless proxy — the ONLY place Claude API is called
├── netlify.toml                        # Netlify config (functions directory, redirects if needed)
├── .gitignore                          # Excludes .env, node_modules, OS files
├── .env                                # LOCAL ONLY — holds ANTHROPIC_API_KEY for local testing, never committed
└── README.md                           # Project overview, live link (added Day 9), setup instructions
```

## Folder-by-Folder Responsibility

### `index.html`
The entire UI lives in one file, structured as clearly labeled sections (header, search, snapshot, questions, AI card, compare mode) matching UI-WIREFRAMES.md. No templating engine — plain HTML with empty containers (e.g., `<div id="snapshot-card">`) that JS fills in.

### `css/style.css`
One stylesheet for the whole app. Organized internally (not as separate files) to avoid extra HTTP requests, since this is a small enough project that splitting CSS would add complexity without benefit. Internally ordered as: CSS variables/design tokens → base/reset → layout → components → responsive breakpoints → animations.

### `js/app.js` — The Controller
The only file that attaches event listeners (`addEventListener`) and orchestrates the order of operations (e.g., "on search submit: call api.js, then ui.js, then score.js"). Nothing here should contain fetch logic or DOM-building logic directly — it delegates to the other modules. This separation is what makes Day 4-7 additive rather than requiring rewrites.

### `js/api.js` — External Data Layer
All `fetch()` calls to Open-Meteo live here and only here. Returns clean, normalized JS objects (per SCHEMA.md §2.1) so the rest of the app never has to know about raw API response shapes.

### `js/claude.js` — Our Backend Caller
A thin file: one function that POSTs to `/.netlify/functions/get-recommendation` and returns the parsed response. Deliberately separate from `api.js` since it talks to our own backend, not a third-party API — keeps the mental model clean ("external data" vs. "our AI layer").

### `js/ui.js` — Rendering Layer
Every function that touches `innerHTML` or creates DOM elements lives here. No fetch calls, no business logic — just "given this data, render it." This is what makes Day 7's polish day safe: you can rewrite rendering/animation logic without touching data-fetching code.

### `js/score.js` — Business Logic
A small, pure-function file: given an AQI number, return a `SafetyScore` object (per SCHEMA.md §2.2). Isolated because it's the one piece of "business logic" in the app or gamification layer — easy to isolate, unit-test manually, and adjust breakpoints without touching UI or API code.

### `netlify/functions/get-recommendation.js`
The entire backend. Receives the POST body, validates it, builds the Claude prompt, calls Claude with the server-side key, and returns the result. This is the **only** file in the whole project that ever sees `ANTHROPIC_API_KEY`.

### `netlify.toml`
Tells Netlify where to find the functions directory and (if needed later) any redirect rules. Minimal — this isn't a complex deployment.

### `.gitignore` / `.env`
Security boundary at the file-system level: `.env` holds the real API key locally, `.gitignore` ensures it's never committed. This was already verified in Day 1 planning and reconfirmed during today's repo setup.

### `README.md`
Left mostly empty until Day 10, when it becomes the polished, portfolio-facing document (per the Blueprint's Day 10 plan) — today it only needs the placeholder title and description already created during repo setup.

## Where Future Code Will Live (Day-by-Day Map)

| Day | Adds to |
|---|---|
| Day 3 | `netlify/functions/get-recommendation.js` (test shell), `.env`, `netlify.toml` |
| Day 4 | `index.html` (search UI), `js/api.js`, `js/ui.js`, `js/app.js`, `css/style.css` |
| Day 5 | `index.html` (questions), `js/claude.js`, `netlify/functions/get-recommendation.js` (real logic), `js/ui.js`, `js/app.js` |
| Day 6 | `js/score.js`, `index.html` (compare section), `js/ui.js`, `js/app.js`, `css/style.css` |
| Day 7 | `css/style.css` (polish pass only) |
| Day 8 | Bug fixes across any file — no new files expected |
| Day 9 | `netlify.toml` (if needed), `README.md` (live link) |
| Day 10 | `README.md` (finalized), optional `screenshots/` folder |

## Why This Structure Was Chosen

1. **One responsibility per file** — `api.js` never renders, `ui.js` never fetches, `score.js` never touches the DOM. This means bugs are easy to locate ("the recommendation text is wrong" → look in `claude.js` or the Netlify function, never in `ui.js`).
2. **No build step** — every file is used as-is by the browser. No bundler, no transpiler, no `npm run build`. This matches the "vanilla JS, ship fast" decision from Day 1 and removes an entire category of setup problems.
3. **Security boundary is structural, not just a rule** — the fact that only one file (`get-recommendation.js`) can physically access the API key means there's no way to "accidentally" leak it from `app.js` or `ui.js` — the architecture itself prevents the mistake.
4. **Matches the Blueprint's daily plan exactly** — every day's "Files and folders to create or modify" section in the Implementation Blueprint references this exact structure, so there's zero ambiguity going into Day 4.
