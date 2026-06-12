# Typecheck strict optional fix

This hotfix resolves TypeScript errors introduced by `exactOptionalPropertyTypes`.

## Fixes

- Server environment config now omits optional keys instead of passing explicit `undefined`.
- Server HTTP request/response types now use Node `IncomingMessage` and `ServerResponse` directly.
- Acki network fetch options now omit optional `headers` and `body` unless required.
- API health signal now omits `errorText` when there is no error text.
- Live health config now omits optional endpoint keys unless configured.

## Reason

With `exactOptionalPropertyTypes: true`, an optional property such as `value?: string` does not accept `value: undefined`. The property must be omitted entirely.
