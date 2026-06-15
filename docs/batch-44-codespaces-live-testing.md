# Batch 44 — Codespaces live-testing preparation

## Purpose

This batch makes it easier to test the server and safe read-only routes from GitHub Codespaces or any browser-accessible backend environment.

## Added files

```text
apps/server/scripts/codespaces-url-help.mjs
docs/codespaces-live-test-guide.md
docs/live-read-environment-checklist.md
```

## Required action after upload

```text
1. Commit the files.
2. Check GitHub Actions -> latest Typecheck run.
```

No terminal command is required immediately.

## Optional later command

After opening Codespaces and starting the server:

```bash
node apps/server/scripts/codespaces-url-help.mjs
```

This prints safe URLs for browser testing.
