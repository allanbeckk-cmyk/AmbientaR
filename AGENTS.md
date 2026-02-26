# AGENTS.md

## Cursor Cloud specific instructions

### Overview

AmbientaR is a Next.js 15 (App Router) environmental management ERP web app targeting consultancies in Minas Gerais, Brazil. It uses Firebase (Auth, Firestore, Storage) as the backend — all config is hardcoded in `src/firebase/config.ts`. The UI is built with shadcn/ui, Tailwind CSS, and Radix primitives.

### Running the dev server

```bash
npm run dev
```

Starts on **http://localhost:9002** (binds `0.0.0.0`). The root URL `/` redirects unauthenticated users to `/login`.

### Lint, typecheck, build

| Task | Command | Notes |
|------|---------|-------|
| Lint | `npm run lint` | Requires `eslint@^8` and `eslint-config-next@15.0.7` (installed as devDependencies). Pre-existing warnings exist in the codebase. |
| Typecheck | `npm run typecheck` | Pre-existing TS errors exist; `next.config.ts` has `ignoreBuildErrors: true`. |
| Build | `npm run build` | Production build succeeds despite TS errors due to `ignoreBuildErrors`. |

### Gotchas

- **ESLint is not in the original `package.json` devDependencies.** You need `eslint@^8` and `eslint-config-next@15.0.7` installed, plus a `.eslintrc.json` with `{"extends": "next/core-web-vitals"}`. The update script handles this.
- **Firebase Auth required for app usage.** Without valid credentials the app renders the login page but won't go further. No Firebase emulators are configured.
- **AI features (Genkit/Gemini)** require a `GOOGLE_API_KEY` or `GOOGLE_GENAI_API_KEY` env var. The rest of the app works without it.
- **No automated test suite.** There are no test files or test framework configured in the project.
- **`useAuth()` vs `useFirebase()` vs `useFirestore()`:** `useAuth()` returns only `{ user, login, logout, isInitialized }` — it does NOT return `firestore`. Use `useFirebase()` to get `firestore`, or `useFirestore()` for a non-null reference. Destructuring `firestore` from `useAuth()` silently yields `undefined` and breaks Firestore queries.
