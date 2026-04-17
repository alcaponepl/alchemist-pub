# Alchemist

An interactive 3D dashboard for wind farm monitoring (digital twin) with `sea/land` modes, real-time telemetry, alerts, and turbine detail screens.

## Features

- Product landing page with a wind farm preview.
- Operational dashboard with:
  - 3D scene (`@react-three/fiber`, `three`, `@react-three/drei`)
  - environment and energy production metrics
  - turbine list with statuses (`online`, `warning`, `offline`)
  - warning/critical alerts
  - scene performance panels
- Detailed single turbine view (`/dashboard/turbine/:turbineId`).
- UI pages: login, register, settings.
- Data is currently simulated locally via `windFarmSimulator` (no backend yet).

## Tech Stack

- React 19 + TypeScript
- Vite 7
- React Router 7
- Three.js + React Three Fiber + Drei
- Lucide Icons
- Firebase Hosting (static build deployment)
- Optional: WebAssembly (Rust + `wasm-pack`) for compute logic

## Requirements

- Node.js `>= 22.12.0` (recommended; Vite 7 requires at least this version in the 22.x line)
- npm

## Local Development

```bash
npm install
npm run dev
```

The app starts by default at `http://localhost:5173`.

## Scripts

- `npm run dev` - development mode (Vite)
- `npm run build` - production build (`tsc -b && vite build`)
- `npm run preview` - local preview of the production build
- `npm run lint` - linting
- `npm run wasm:build` - build WASM module from `src-rust`
- `npm run deploy` - deploy to Firebase Hosting

## Firebase Hosting Deployment

This repo already includes SPA hosting config in `firebase.json`:

- `public: dist`
- rewrite `** -> /index.html`
- `predeploy: npm run build`

Steps:

1. Login to Firebase CLI:
   ```bash
   npx firebase login
   ```
2. Set your Firebase `project id` in `.firebaserc` (locally; file is in `.gitignore`).
3. Run deploy:
   ```bash
   npm run deploy
   ```

## Project Structure

```text
src/
  components/         # UI components and 3D scene
  hooks/              # hooks (simulated data, wasm)
  pages/              # landing, dashboard, turbine details, auth, settings
  services/           # wind farm telemetry simulator
  types/              # domain types (windFarm)
src-rust/             # Rust/WASM module (optional)
firebase.json         # Firebase Hosting configuration
```

## Routing

- `/` - Landing page
- `/dashboard` - Dashboard 3D
- `/dashboard/turbine/:turbineId` - Turbine details
- `/login` - Login (UI)
- `/register` - Register (UI)
- `/settings` - Settings (UI)

## Notes

- The project currently uses a local data simulator (`src/services/windFarmSimulator.ts`).
- You may see a large JS bundle warning during build; this is expected for a 3D-heavy scene and graphics dependencies.
