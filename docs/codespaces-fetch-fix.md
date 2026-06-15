# Codespaces preview fetch fix

## Problem

When the Web app is opened through a GitHub Codespaces forwarded URL, browser requests to `http://localhost:8787` may fail.

The backend is running inside Codespaces, but the browser is outside that container. In that situation, the frontend should use the forwarded Codespaces URL for port `8787`, not plain localhost.

## Fix

The preview script now detects GitHub Codespaces and automatically sets:

```text
VITE_WATCHTOWER_API_BASE_URL=https://<codespace-name>-8787.<codespaces-forwarding-domain>
```

This lets the Web app call the backend through the correct forwarded URL.

## Manual check

After running:

```bash
npm run preview:watchtower
```

open the forwarded Web port, usually `3000`.

If the Web UI still says `Failed to fetch`, open the forwarded backend port `8787` once and visit:

```text
/health
```

Then refresh the Web app.

## Security note

This is a development-preview fix only. It does not expose secrets and does not confirm wallet balances.
