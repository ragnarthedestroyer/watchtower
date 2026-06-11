# Watchtower Structure Review

## Status

The repository now has a clean monorepo shape:

```text
apps/
  server/
  telegram/
  web/

packages/
  api/
  core/
  db/
  ui/

docs/
.github/workflows/
```

## Hotfix 09b

This hotfix corrects two structure/type issues found after reviewing the uploaded GitHub zip.

### 1. GitHub Actions workflow path

The workflow must live under:

```text
.github/workflows/typecheck.yml
```

The previous path below is not recognized by GitHub Actions:

```text
github/workflows/typecheck.yml
```

After applying this hotfix, the old `github/` folder can be removed from the repository.

### 2. Demo runtime type

The server app uses `server-job` as its runtime. The shared demo health builder now accepts:

```ts
"web" | "telegram" | "server-job" | "manual"
```

This matches the broader runtime model already used by the core snapshot types and prevents the server route layer from passing an unsupported runtime value.

## Next step

After this hotfix is committed, the next implementation batch can safely add real environment/config validation for Acki Nacki endpoints.
