# AmbientaR - Development Guide

## Cursor Cloud specific instructions

### Overview

AmbientaR ("EcoGestão MG") is a Next.js 15 PWA — an environmental management ERP for small consulting businesses in Minas Gerais, Brazil. The entire UI is in Brazilian Portuguese. The backend is Firebase (Auth, Firestore, Storage) with config hardcoded in `src/firebase/config.ts`.

### Running the application

- **Dev server:** `npm run dev` — starts on port **9002** (bound to `0.0.0.0`)
- **Build:** `npm run build` — TypeScript and ESLint errors are intentionally ignored during builds (see `next.config.ts`)
- **Lint:** `npm run lint` — requires `eslint@^8`, `eslint-config-next@15.0.7`, and `.eslintrc.json` (pre-existing lint warnings/errors in the codebase are expected)
- **Typecheck:** `npm run typecheck` — pre-existing TS errors exist; the project builds successfully because `ignoreBuildErrors: true` is set
- **Genkit AI flows:** `npm run genkit:dev` (optional; requires `GOOGLE_GENAI_API_KEY` env var)

### Key caveats

- **Firebase is cloud-only.** There are no local emulators configured. The app connects directly to the cloud Firebase project `studio-316805764-e4d13`. A valid Firebase user account is required to log in and access any authenticated pages.
- **ESLint v8 required.** Next.js 15.0.7 uses the legacy ESLint integration. ESLint v9+ will fail with "Unknown options" errors. Use `eslint@^8` and `eslint-config-next@15.0.7`.
- **PWA disabled in dev.** Service worker generation is turned off in development mode (`disable: process.env.NODE_ENV === 'development'` in `next.config.ts`).
- **Missing icons warning.** The console shows 404 for `icons/icon-192x192.png` — this is a known PWA manifest issue that does not affect functionality.
- The `GOOGLE_GENAI_API_KEY` environment variable is optional; without it, AI features (sustainability reports, geospatial analysis, assistant) won't work but the rest of the app functions normally.
