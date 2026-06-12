# Account response normalization

Batch 14 adds a normalization boundary for raw Acki Nacki account reads.

## Why this exists

The first live account reader returned the raw GraphQL payload directly. That is useful for debugging, but unsafe for later decoders because different endpoints may shape the same data differently.

This batch adds a small adapter that extracts a stable Watchtower account view from the raw response.

## Normalized fields

Watchtower now attempts to extract:

```text
id
account_id
dapp_id
boc
balance
last_paid
code_hash
data_hash
```

The raw payload is still preserved for research, but later decoder modules should prefer the normalized account object.

## Safety behavior

If the endpoint returns no account records, the raw account read is marked as failed.

If GraphQL returns errors, they are copied into the account-read result errors.

If more than one account is returned, Watchtower warns and uses the first record only.

If the account exists but BOC is missing, Watchtower warns that ABI/BOC decoding cannot run yet.

## What this does not do

This does not decode balances, contracts, Mobile Verifier epochs, PrivateNote state, PopitGame rewards, or unlocked NACKL.

It only converts raw endpoint responses into a safer and more predictable input for future decoder work.

## Next step

The next batch should add a decoder research boundary that can safely inspect normalized account payloads and report decoder confidence without claiming final balances.
