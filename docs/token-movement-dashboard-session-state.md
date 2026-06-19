# Token movement dashboard session state

Batch 73 adds a small on-the-fly request lifecycle model for the frontend token movement dashboard.

It covers:

- idle
- loading
- ready
- empty
- partial
- error
- rate-limited

The purpose is to keep the frontend honest while live reads and decoding are still being connected. A dashboard may be visually ready, but the session state must still tell the user whether the rows are complete, partial, unresolved, or blocked by upstream limits.

## Privacy boundary

The model keeps the no-storage expectation explicit:

- render from current request only;
- do not persist wallet history;
- do not store searched addresses;
- do not use browser storage for token movement rows;
- do not attach analytics to wallet addresses;
- prefer no-store response headers for future API routes.

This is a data-minimisation and no-retention posture. It is not a claim that GDPR cannot apply.

## Read-only boundary

This batch does not add live reads, token decoding, transaction signing, wallet operation, custody, PrivateNote operation, or DEX operation.
