# Batch 79 — Live raw token movement history frontend

Batch 79 adds the first visible live-data bridge for the token movement dashboard.

It adds a Web frontend panel that can call:

```text
GET /api/token-movements/live-raw-history
```

The user can request either:

```text
address=0:<64hex>
```

or the State V2 form:

```text
account_id=<64hex>&dapp_id=<64hex>
```

## What this is

This is a read-only, on-the-fly raw history viewer. It shows transaction/message evidence returned by the live route from Batch 78.

It is intended to help move from the synthetic dashboard preview toward real account data.

## What this is not

This is not confirmed token movement decoding yet.

It does not claim that a row is a final NACKL, SHELL, or USDC transfer unless later decoder evidence supports that classification.

It does not store wallet history, searched addresses, raw payloads, browser state, or wallet-linked analytics.

## UI behavior

The frontend now has a live token movement panel above the existing status sections. It reuses the address-mode inputs for legacy address or State V2 account_id + dapp_id.

When loaded, the panel shows:

- transaction count;
- inbound message count;
- outbound message count;
- raw/not-decoded count;
- warnings;
- a compact transaction/message table.

## Safety boundary

The wording must remain conservative:

- live evidence;
- raw history;
- not decoded token movement yet;
- on-the-fly / no storage.
