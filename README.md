<img width="1142" height="217" alt="Screenshot 2026-08-05 213641" src="https://github.com/user-attachments/assets/60f9c359-6237-4c6f-987e-f6b19ed3f038" />

# AirSense

Live AI-powered air quality & health advisory dashboard — built for the AB Talks 60-Day Claude AI Challenge.

**Live site:** https://airsenseanalysis.netlify.app

## What it does

Search any city and get:
- Live AQI and weather data
- A personalized, AI-generated health recommendation based on your sensitivity and outdoor activity plans
- A gamified Safety Score (A–F grade)
- Side-by-side comparison with a second city

## Tech stack

- Vanilla HTML, CSS, JavaScript (no framework)
- Netlify Functions (serverless proxy for AI calls)
- Open-Meteo APIs (geocoding, air quality, weather — free, no key required)
- AI: currently using Groq (temporary substitute for Claude API, pending Anthropic billing setup)
- Hosted on Netlify

## Architecture note

The AI API key is never exposed to the browser — every AI call is routed through a Netlify Function that reads the key from a server-side environment variable. This keeps the app fully static/serverless while still keeping secrets secure.

## Running locally

1. Clone the repo
2. Create a `.env` file with `GROQ_API_KEY=your_key_here` (and `ANTHROPIC_API_KEY=your_key_here` if using Claude)
3. Run `netlify dev`
4. Open `http://localhost:8888`
