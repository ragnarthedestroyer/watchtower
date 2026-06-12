# Typecheck RequestInit method fix

This hotfix resolves a strict TypeScript error caused by `exactOptionalPropertyTypes`.

`IncomingMessage.method` can be `undefined`, but `RequestInit.method` cannot be explicitly assigned `undefined` when strict optional property checking is enabled.

The server now builds `RequestInit` first and only assigns `method` when a method value exists.
