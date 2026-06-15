# Test addresses and safety rules

## Purpose

Watchtower can now inspect raw accounts. The next research step is to test known accounts and compare returned evidence against what is expected.

## Recommended test order

1. Test one known legacy account address.
2. Test one suspected Mobile Verifier root address.
3. Test one suspected PopitGame / rewards account.
4. Test one suspected PrivateNote or PrivateNote-derived account.
5. Only then test larger watchlists.

## Never assume

Do not assume that a field named `balance`, `_balance`, `_rewards`, or `rewards` is confirmed wallet NACKL.

Watchtower should only promote balance evidence to confirmed after the decoder is tied to the right contract/source model.

## Current confidence policy

- `unresolved`: no reliable evidence.
- `partial`: evidence exists, but source or interpretation is not confirmed.
- `confirmed`: evidence source and interpretation are known and consistent.

As of this stage, most balance data should remain `partial` or `unresolved`.

## Research-save rule

`POST /snapshots/live/research-save` may save blocked snapshots only as research evidence.

It must not be treated as a production snapshot or portfolio record.
