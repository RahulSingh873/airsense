# AirSense — Data & "Schema" Design

## 1. Does this project need a database?

**No.** Per the PRD (§5.2, Explicitly Out of Scope), v1.0 has no user accounts, no saved/bookmarked cities, and no historical data. Every user story (PRD §6) is satisfiable with live, in-memory data fetched fresh on each search:

| User Story | Needs persistence? | Why / why not |
|---|---|---|
| Search a city and see current AQI/weather | No | Fetched live from Open-Meteo on each search |
| Answer 2 questions, get AI recommendation | No | Sent live to Claude per request, not stored |
| Compare 2 cities | No | Both cities fetched live, held in memory only during that view |
| See a Safety Score | No | Computed client-side from the live AQI value |

Since **zero** user stories require data to survive a page reload, a database would be unjustified scope — it would add setup complexity (Day 3), security surface (another thing to secure), and testing burden (Day 8) for a feature nobody asked for. This directly protects the PRD's stated risk mitigation: *"Scope creep from 'any city' search... bounded"* (§10) applies equally here — we're bounding data scope too.

## 2. In-Memory "Schema" (Client-Side JS Objects)

Even without a database, it's worth defining the shape of the data flowing through the app, since multiple files (`api.js`, `ui.js`, `score.js`, `claude.js`) need to agree on it.

### 2.1 `CityData` object (returned by `api.js`'s `fetchCityData()`)

| Field | Type | Source | Example |
|---|---|---|---|
| `cityName` | string | Geocoding API `name` | `"Ghaziabad"` |
| `country` | string | Geocoding API `country` | `"India"` |
| `latitude` | number | Geocoding API `latitude` | `28.6692` |
| `longitude` | number | Geocoding API `longitude` | `77.4538` |
| `aqi` | number | Air Quality API `current.us_aqi` | `187` |
| `pm2_5` | number | Air Quality API `current.pm2_5` | `92.3` |
| `pm10` | number | Air Quality API `current.pm10` | `140.1` |
| `temperature` | number | Weather API `current.temperature_2m` | `31` |
| `humidity` | number | Weather API `current.relative_humidity_2m` | `58` |
| `weatherCode` | number | Weather API `current.weather_code` | `3` |

### 2.2 `SafetyScore` object (returned by `score.js`'s `calculateSafetyScore()`)

| Field | Type | Description | Example |
|---|---|---|---|
| `numericScore` | number (0-100) | Derived from AQI, higher = safer | `28` |
| `grade` | string (A–F) | Letter grade for quick scanning | `"D"` |
| `label` | string | Human-readable category | `"Poor Air Quality"` |
| `color` | string | Hex or CSS variable for badge styling | `"#E2604F"` |

**Mapping logic (standard US AQI breakpoints):**

| AQI Range | Grade | Label | Numeric Score |
|---|---|---|---|
| 0–50 | A | Excellent | 90–100 |
| 51–100 | B | Good | 70–89 |
| 101–150 | C | Moderate | 50–69 |
| 151–200 | D | Poor | 25–49 |
| 201+ | F | Hazardous | 0–24 |

### 2.3 `PersonalizationAnswers` object (from the 2-question form)

| Field | Type | Example |
|---|---|---|
| `isSensitiveGroup` | boolean | `true` |
| `planningOutdoorActivity` | boolean | `true` |

### 2.4 `RecommendationRequest` payload (sent to the Netlify Function)

Combines `CityData` + `PersonalizationAnswers` into one flat object — see API.md §1 for the exact contract.

### 2.5 `RecommendationResponse` (from the Netlify Function)

| Field | Type | Example |
|---|---|---|
| `recommendation` | string | `"Air quality in Ghaziabad is currently poor (AQI 187)..."` |
| `error` | string (only present on failure) | `"Unable to reach Claude API"` |

## 3. Validation & Constraints (applied in code, not a DB)

Since there's no database enforcing constraints, `api.js` and the Netlify Function must validate manually:

- `aqi` must be a positive number; if missing/null, snapshot rendering shows "data unavailable" rather than crashing.
- `cityName` from user input must be non-empty and trimmed before triggering a geocode call.
- `isSensitiveGroup` / `planningOutdoorActivity` must both be explicitly answered (true/false) before "Get My Recommendation" is enabled — no undefined/null states reach the Netlify Function.

## 4. Future Scope Note (Not Built Now)

If a future version (v1.1+) adds saved/favorite cities (mentioned in the Pitch Deck's Future Scope slide), the simplest first step would be **browser `localStorage`** (no backend database needed) — only if a full account system were added later would a real database (e.g., a lightweight hosted Postgres or Firebase) become justified. This is a deliberate note for future-you, not a Day 3+ task.
