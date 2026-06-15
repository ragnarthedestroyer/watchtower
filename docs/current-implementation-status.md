# Current implementation status after Batch 24

Watchtower has moved from architecture-only to a working technical foundation.

## Implemented

- Monorepo structure.
- Shared core domain model.
- API trust model.
- Snapshot safety policy.
- Watchlist model.
- Web shell.
- Telegram Mini App shell.
- Server foundation.
- Environment validation.
- Live health connector.
- Raw account reader foundation.
- Mobile Verifier root read foundation.
- Account response normalization.
- Conservative Mobile Verifier decoder attempt.
- Account inspection route.
- Live snapshot builder foundation.
- Balance candidate evidence layer.
- Account classification layer.
- Server-backed API client foundation.
- Route catalog.
- Manual smoke-test scripts.

## Still intentionally unresolved

- Confirmed Acki Nacki balance decoding.
- Confirmed Mobile Verifier epoch ABI/BOC decoding.
- Real database persistence.
- Real Telegram init-data validation.
- Watchlist editing UI.
- Deployment.
- Production secrets and hosting configuration.

## Current safety position

Watchtower can perform live-read style checks, but it must not treat balances as confirmed yet.

Snapshots should remain blocked or read-only unless decoder confidence becomes confirmed.

This is intentional and protects against false zero balances or false positive wallet totals.

## Next recommended batch

Batch 25 should add a UI diagnostics page/section so the Web and Telegram apps can show:

- server connection status;
- runtime mode;
- config warnings/errors;
- route catalog;
- live snapshot policy reasons.

This will make manual testing easier before adding real persistence.
