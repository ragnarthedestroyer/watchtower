# Structure Review

Reviewed after the initial GitHub setup.

## Status

The repository structure is suitable for the current stage: documentation-first, TypeScript monorepo skeleton, and separated app/package layout.

## Fixes applied in this updated version

- Added root `README.md` from the previously misplaced `docs/README.md`.
- Moved workflow from `github/workflows/typecheck.yml` to the correct GitHub Actions path: `.github/workflows/typecheck.yml`.
- Updated package cross-imports to use `@watchtower/core` instead of relative `../../core/src` imports.
- Confirmed TypeScript check passes with `tsc --noEmit`.

## Current structure

```text
apps/
  web/
  telegram/
packages/
  core/
  api/
  db/
  ui/
docs/
.github/workflows/
```

## Next recommended implementation step

Create the first application shell in `apps/web`, then add a simple health/status page that consumes the core models without connecting to the real Acki Nacki API yet.
