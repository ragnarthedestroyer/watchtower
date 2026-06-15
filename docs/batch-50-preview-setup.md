# Batch 50 — Preview setup

Batch 50 prepares the project for the first visual preview.

## Added files

```text
apps/server/scripts/dev-preview.mjs
apps/server/scripts/preview-help.mjs
docs/codespaces-preview-start.md
docs/frontend-server-preview-connection.md
docs/batch-50-preview-setup.md
package.json
```

## Added root scripts

```text
npm run preview:watchtower
npm run preview:help
```

## Purpose

The new preview command starts both the backend server and the Web app together.

It also sets:

```text
VITE_WATCHTOWER_API_BASE_URL=http://localhost:8787
```

so the Web app connects to the backend automatically during preview.

## Required action after upload

1. Commit the files.
2. Check GitHub Actions → latest Typecheck run.

No terminal command is required immediately after upload.

## Optional visualization step

When ready to actually see the app:

1. Open GitHub Codespaces.
2. Run:

```bash
npm install
npm run preview:watchtower
```

3. Open forwarded port `3000`.

## Safety note

Default preview mode is demo. Do not treat displayed balances as confirmed NACKL.
