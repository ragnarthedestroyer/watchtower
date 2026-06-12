# Typecheck workspace protocol fix

GitHub Actions failed during `npm install` with:

```text
npm error code EUNSUPPORTEDPROTOCOL
npm error Unsupported URL Type "workspace:": workspace:*
```

The repository uses npm workspaces, but the GitHub runner rejected package dependency versions using the `workspace:*` protocol.

For compatibility, internal workspace dependencies were changed from:

```json
"@watchtower/core": "workspace:*"
```

to the current local package version:

```json
"@watchtower/core": "0.1.0"
```

The root `workspaces` field remains unchanged, so npm can still link local workspace packages during install.
