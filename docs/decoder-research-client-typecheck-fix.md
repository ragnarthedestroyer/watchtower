# Decoder research client typecheck fix

This hotfix imports `DecoderResearchReportResponse` in the shared API client.

Batch 48 added the decoder research report client method, but the response type was not included in the `client.ts` type import list.

## Fixed file

```text
packages/api/src/client.ts
```

## Why this matters

Without this import, strict TypeScript checks can fail with:

```text
Cannot find name 'DecoderResearchReportResponse'
```

The fix does not change runtime behavior. It only corrects the API client type import.
