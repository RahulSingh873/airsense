# AirSense — API Design

This document covers every network call the app makes: the one endpoint we own (the Netlify Function) plus the three external endpoints we consume. No implementation code — contracts only.

---

## 1. Our Endpoint: `POST /.netlify/functions/get-recommendation`

This is the **only** backend endpoint in the entire project.

### Purpose
Securely proxy a request to the Claude API, so the API key never reaches the browser, and return a personalized health recommendation.

### Request

**Method:** `POST`
**Path:** `/.netlify/functions/get-recommendation`
**Headers:** `Content-Type: application/json`

**Body:**
```json
{
  "city": "Ghaziabad",
  "aqi": 187,
  "pm2_5": 92.3,
  "temperature": 31,
  "weatherCondition": "Haze",
  "isSensitiveGroup": true,
  "planningOutdoorActivity": true
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `city` | string | Yes | Non-empty |
| `aqi` | number | Yes | Must be ≥ 0 |
| `pm2_5` | number | No | Optional enrichment for the prompt |
| `temperature` | number | Yes | In Celsius |
| `weatherCondition` | string | Yes | Human-readable (e.g., "Clear", "Haze") |
| `isSensitiveGroup` | boolean | Yes | From personalization question 1 |
| `planningOutdoorActivity` | boolean | Yes | From personalization question 2 |

### Response — Success (200)
```json
{
  "recommendation": "Air quality in Ghaziabad is currently poor (AQI 187). Since you're in a sensitive group and planning outdoor activity, it's best to postpone strenuous exercise today and wear a mask if you must go out. Keep windows closed and consider an air purifier indoors if available."
}
```

### Response — Error (4xx/5xx)
```json
{
  "error": "Missing required field: aqi"
}
```

### Validation Rules (performed inside the function, before calling Claude)
- Reject if `city`, `aqi`, `temperature`, `isSensitiveGroup`, or `planningOutdoorActivity` is missing → `400`
- Reject if `aqi` or `temperature` is not a number → `400`
- Reject if `isSensitiveGroup` or `planningOutdoorActivity` is not a boolean → `400`

### Authentication
- **Client → Function:** none required (this is a public tool, no user accounts).
- **Function → Claude:** `ANTHROPIC_API_KEY` read from Netlify's environment variable — never passed in from the client, never logged.

### Error Cases

| Case | Response |
|---|---|
| Missing/invalid field in request body | `400 { "error": "..." }` |
| Claude API key missing/invalid on server | `500 { "error": "AI service temporarily unavailable" }` (never leak key details) |
| Claude API times out or rate-limits | `502 { "error": "AI service temporarily unavailable, please try again" }` |
| Unexpected server exception | `500 { "error": "Something went wrong, please try again" }` |

---

## 2. External: Open-Meteo Geocoding API

### Purpose
Convert a user-typed city name into coordinates.

### Request
```
GET https://geocoding-api.open-meteo.com/v1/search?name={cityName}&count=1
```

### Response (relevant fields)
```json
{
  "results": [
    {
      "name": "Ghaziabad",
      "country": "India",
      "latitude": 28.6692,
      "longitude": 77.4538
    }
  ]
}
```

### Error Cases
- `results` array missing or empty → treat as "city not found", show graceful UI error (per PRD §7, Functional Requirements).
- Network failure → show "unable to reach location service, check your connection."

### Authentication
None — keyless, public endpoint.

---

## 3. External: Open-Meteo Air Quality API

### Purpose
Get live AQI and pollutant data for a coordinate pair.

### Request
```
GET https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&current=us_aqi,pm2_5,pm10
```

### Response (relevant fields)
```json
{
  "current": {
    "us_aqi": 187,
    "pm2_5": 92.3,
    "pm10": 140.1
  }
}
```

### Error Cases
- Missing `current` object → show "air quality data unavailable for this location."
- Network failure → same graceful degradation as Geocoding.

### Authentication
None — keyless, public endpoint.

---

## 4. External: Open-Meteo Weather API

### Purpose
Get live temperature, humidity, and general weather condition.

### Request
```
GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,weather_code
```

### Response (relevant fields)
```json
{
  "current": {
    "temperature_2m": 31,
    "relative_humidity_2m": 58,
    "weather_code": 3
  }
}
```

**Note:** `weather_code` is a WMO numeric code — `ui.js` will need a small lookup table (e.g., 0 = "Clear sky", 3 = "Overcast", 45 = "Fog") to convert it to a human-readable string. This lookup table is a Day 4 implementation detail, not an API concern.

### Error Cases
- Same pattern as above — missing `current` → graceful error.

### Authentication
None — keyless, public endpoint.

---

## 5. External: Anthropic Claude API (`/v1/messages`)

### Purpose
Generate the personalized recommendation text. Called **only** from `get-recommendation.js`, never from the browser.

### Request (constructed server-side)
```
POST https://api.anthropic.com/v1/messages
Headers:
  x-api-key: {ANTHROPIC_API_KEY}   (from environment variable)
  content-type: application/json
Body:
{
  "model": "<current recommended Claude model — confirm on Day 3>",
  "max_tokens": 300,
  "messages": [
    { "role": "user", "content": "<constructed prompt with city/AQI/weather/answers>" }
  ]
}
```

### Response (relevant fields)
```json
{
  "content": [
    { "type": "text", "text": "Air quality in Ghaziabad is currently poor..." }
  ]
}
```

### Error Cases
- `401` → invalid/missing API key (server misconfiguration, not a user-facing bug — logged server-side)
- `429` → rate limited — function returns a "please try again shortly" message to the client
- Timeout → function returns a generic "AI service temporarily unavailable" message

### Authentication
API key only — server-side, via Netlify environment variable. **Never** exposed to the client under any circumstance.

---

## 6. Summary Table

| Endpoint | Owned by us? | Auth | Called from |
|---|---|---|---|
| `/.netlify/functions/get-recommendation` | Yes | None (client-facing) | `js/claude.js` |
| Open-Meteo Geocoding | No | None | `js/api.js` |
| Open-Meteo Air Quality | No | None | `js/api.js` |
| Open-Meteo Weather | No | None | `js/api.js` |
| Anthropic Claude `/v1/messages` | No | API key (server-side) | `netlify/functions/get-recommendation.js` only |
