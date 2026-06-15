# Post-Batch Checklist

Use this checklist after every Watchtower batch.

## Always required

1. Upload the batch files into the repository.
2. Commit the files.
3. Open **GitHub → Actions**.
4. Check the newest **Typecheck** run.
5. Continue only if the newest run is green.

## Required only for server/API batches

Use Codespaces or a local terminal only when the batch changes:

- `apps/server`
- `packages/api`
- live-read logic
- account reading
- Mobile Verifier reading
- snapshot building
- smoke-test scripts

Run:

```bash
npm install
npm run typecheck
npm run server:dev
```

Then, in a second terminal:

```bash
node apps/server/scripts/smoke-test.mjs
```

## Required only for live Acki Nacki endpoint testing

Live endpoint testing requires environment configuration.

At minimum, live-read mode needs:

```env
WATCHTOWER_MODE=live-read
WATCHTOWER_GRAPHQL_ENDPOINT=<endpoint>
```

Optional State V2 testing may also need:

```env
WATCHTOWER_DAPP_ID=<64hex>
```

Do not expect live account routes to work in demo mode.

## Current safest rule

If unsure, do this only:

```text
Upload batch → commit → check latest GitHub Typecheck
```

If the batch requires more, the assistant should explicitly say so.
