# Batch 61 Hotfix V2: remove generatedAt undefined from export panels

This hotfix replaces the web and Telegram token movement export panels.

The previous hotfix may still allow TypeScript to infer an object containing
`generatedAt: string | undefined` at the call site. With `exactOptionalPropertyTypes`,
that is not assignable to `generatedAt?: string`.

This version builds `TokenMovementExportOptions` through helper functions and returns
an object without the `generatedAt` key unless a concrete string is present.

Run:

```bash
npm run typecheck
```

Commit message:

```text
Batch 61 hotfix: build export options without undefined generatedAt
```
