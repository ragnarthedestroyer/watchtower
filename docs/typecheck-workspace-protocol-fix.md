# Typecheck workspace protocol fix

GitHub Actions failed during `npm install` with:

```text
npm error Unsupported URL Type "workspace:": workspace:*
```

The fix is to remove all `workspace:*` dependency references from package manifests and replace them with the shared local package version `0.1.0`.

The root `workspaces` configuration remains active, so npm can still link the local workspace packages during installation.

This update includes all package manifests, including `apps/server/package.json`, which was the remaining source of the unsupported workspace protocol.
