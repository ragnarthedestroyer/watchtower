# GitHub Actions and Codespaces Guide

This guide explains where Watchtower commands run and when they are required.

## 1. GitHub Actions

GitHub Actions is the automatic checker that runs after commits.

Use it for the normal development loop:

1. Upload the batch files.
2. Commit them.
3. Open **Actions** in GitHub.
4. Check the newest **Typecheck** run.
5. Continue only when the newest run is green.

For most batches, this is all that is required.

## 2. GitHub Codespaces

Codespaces is a browser-based development machine provided by GitHub. It is useful when we need to actually start the Watchtower server.

To open it:

1. Go to the Watchtower repository.
2. Click **Code**.
3. Open the **Codespaces** tab.
4. Click **Create codespace on main**.

GitHub will open a VS Code-like environment in the browser.

Commands are typed in the terminal at the bottom of the Codespaces screen.

## 3. First-time Codespaces commands

Inside Codespaces, from the repository root, run:

```bash
npm install
npm run typecheck
```

If that passes, start the backend server:

```bash
npm run server:dev
```

The backend server should start on:

```text
http://localhost:8787
```

Codespaces may show a forwarded-port popup. If it does, open or copy the forwarded URL.

## 4. Server smoke test

Open a second terminal in Codespaces and run:

```bash
node apps/server/scripts/smoke-test.mjs
```

This checks the safe server routes.

## 5. Live-read smoke test

After the server is running, run:

```bash
node apps/server/scripts/live-read-smoke-test.mjs
```

This tests live-read routes when configuration is available. In demo mode, some live-only routes may remain blocked by design.

## 6. When local or Codespaces testing is required

Testing in Codespaces is required only when a batch changes runtime behavior, server routes, API calls, or live-read logic.

For UI-only, docs-only, and type-only batches, checking GitHub Actions is enough.
