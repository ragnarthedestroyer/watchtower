# Frontend/server preview connection

The Web app reads the backend URL from:

```text
VITE_WATCHTOWER_API_BASE_URL
```

Batch 50 adds a preview helper script that sets this automatically when running:

```bash
npm run preview:watchtower
```

The default connection is:

```text
Web app: http://localhost:3000
Server:  http://localhost:8787
```

The Web UI should show whether it is running in server-backed mode or demo mode.

## Manual equivalent

If needed, the equivalent manual commands are:

Terminal 1:

```bash
npm run server:dev
```

Terminal 2:

```bash
VITE_WATCHTOWER_API_BASE_URL=http://localhost:8787 npm run web:dev
```

The helper script avoids needing two terminals.

## Current limitation

The preview can show the UI and server-backed panels, but confirmed NACKL balances are still not implemented. Balance candidates are research evidence only.
