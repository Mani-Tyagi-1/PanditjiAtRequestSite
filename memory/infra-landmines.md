---
name: infra-landmines
description: Two non-obvious broken/disabled infra spots in PanditjiAtRequest (eslint, PM2 entry)
metadata:
  type: project
---

Two non-obvious infra gotchas in this repo (found during the 2026-06-10 cleanup):

1. `frontend/eslint.config.js` is **entirely commented out** — the `yarn lint` script (`eslint .`) is effectively a no-op/broken. The ESLint devDeps (`@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `typescript-eslint`) are therefore "unused" per depcheck/knip, but should NOT be deleted — the real fix is to re-enable the config, not remove linting.

2. `server/server.js` is documented as the **PM2 cloud deployment entry point** (`script: "server.js"`), but its body is fully commented out. It's tied to the `ts-node` dependency. Left untouched because it's deployment infra; don't delete without checking how prod actually launches (current `start` script is `node dist/index.js`).

Also: `frontend/src/global.d.ts` types `window.fbq` (Meta Pixel) used across ~15 files — knip flags it as an unused file (ambient decl, no importers) but it must be kept.
