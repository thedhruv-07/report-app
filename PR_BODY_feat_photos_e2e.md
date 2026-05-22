Title: feat(photos): extract/lazy-load Photos UI + E2E smoke test

Summary

This PR extracts and lazy-loads photo-related UI into separate chunks and stabilizes E2E smoke testing for the Photos pane.

What I changed

- Exposed a programmatic staging API for automation: `window.__stagePhotos(previews)` and `window.__clearStagedPhotos` (non-production only) in `frontend/src/reports/PSI/components/Photos.jsx`.
- Hardened `PhotoStagingPanel` by coercing props and adding source-map friendly logging to catch intermittent runtime errors.
- Added a headless Puppeteer smoke script: `scripts/e2e_smoke_puppeteer.js` which injects previews and verifies that `Photos` + `PhotoStagingPanel` chunks load and previews render.
- Added a GitHub Actions workflow `.github/workflows/e2e-smoke.yml` to build the frontend, serve `dist/`, run the smoke script, and upload artifacts.
- Minor backend CORS change to allow Vite preview ports (`http://localhost:4173`, `http://localhost:4174`) useful for CI/dev preview.

Files of interest

- frontend/src/reports/PSI/components/Photos.jsx
- frontend/src/reports/PSI/components/PhotoStagingPanel.jsx
- scripts/e2e_smoke_puppeteer.js
- .github/workflows/e2e-smoke.yml
- backend/app.js (CORS additions)

Testing performed

- Local `vite build` and headless smoke runs — script injected staged preview and detected preview images.
- Verified chunk network requests for `Photos` and `PhotoStagingPanel`.
- Captured artifacts: `scripts/e2e_result.json`, `scripts/e2e_diagnostics.json`, `scripts/e2e_console_logs.json`, `scripts/e2e_photos_debug.png`.

Notes & recommendations

- Globals are only exposed in non-production and removed on unmount; still consider further guarding in production builds.
- CI workflow runs the smoke script; it uploads artifacts on failure or success for debugging.

How to run locally

1. Build frontend:

   cd frontend
   npm run build

2. Serve dist and run smoke test:

   PREVIEW_URL="http://127.0.0.1:4173" PUPPETEER_HEADLESS=true node scripts/e2e_smoke_puppeteer.js

Next steps suggested

- Open a PR using the branch `feat/photos-e2e` (already pushed).
- Monitor the Actions run; I can fetch artifacts once the run completes.
- If you want, I can open a draft PR description and assign reviewers if you provide repo permissions/tokens.
