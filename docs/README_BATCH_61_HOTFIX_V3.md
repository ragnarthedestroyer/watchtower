# Batch 61 Hotfix V3: force export options without undefined generatedAt

This replaces the web and Telegram token movement export panel files.

The previous TypeScript error means the repo still had the old call shape:

```ts
createTokenMovementExportBundle(records, {
  title,
  scope,
  generatedAt: options.generatedAt,
})
```

With `exactOptionalPropertyTypes`, that is invalid when generatedAt is undefined.

This hotfix constructs `TokenMovementExportOptions` as one of two object shapes: one with no generatedAt property, or one with generatedAt as a concrete string.
