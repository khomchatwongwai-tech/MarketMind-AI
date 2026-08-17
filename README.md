<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# MarketMind AI

This contains everything you need to run your app locally.

MarketMind AI is a React, Express, Firebase, Gemini, Stripe, and WebSocket market-intelligence application.

## Run Locally

**Prerequisites:** Node.js and Firebase project access.


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and configure the required development values. Never commit `.env.local` or service-account credentials.
3. Run the app:
   `npm run dev`

## Validate

Run these checks before deployment:

1. `npm run lint`
2. `npm test`
3. `npm run build`

## Render deployment

The included `render.yaml` defines the production web service. Add secret values in the Render dashboard. Production must keep `ALLOW_SIMULATED_MARKET_DATA=false`.

The service health endpoint is `/api/health`. Connect `marketmind.ai` only after the temporary Render URL passes authentication, billing, market-data, and WebSocket tests.
