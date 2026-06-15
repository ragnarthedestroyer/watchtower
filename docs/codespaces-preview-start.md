# Codespaces preview start guide

This guide explains how to visualize Acki Watchtower without installing a local development environment.

## Goal

Start both parts of the preview environment:

- backend server on port `8787`
- web app on port `3000`

The web app will use the backend through:

```text
VITE_WATCHTOWER_API_BASE_URL=http://localhost:8787
```

## Steps in GitHub Codespaces

1. Open the GitHub repository.
2. Click **Code**.
3. Open the **Codespaces** tab.
4. Click **Create codespace on main**.
5. Wait until the browser-based VS Code environment opens.
6. In the terminal, run:

```bash
npm install
```

7. Then run:

```bash
npm run preview:watchtower
```

8. Open the forwarded port for the web app, normally port `3000`.

## What you should see

The Web UI should show Watchtower panels such as:

- server/client mode
- config status
- route catalog
- live/latest snapshot status
- account inspection
- decoder research report
- MVP readiness
- research snapshot history

## Safety

The default preview mode is `demo`.

In this mode, Watchtower does not need real Acki Nacki API endpoints and does not confirm real balances.

Live-read testing should happen only after endpoint configuration is clear.
