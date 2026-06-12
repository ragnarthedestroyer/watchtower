# Account Classification Foundation

Batch 20 adds the first conservative account-classification layer.

## Purpose

The raw account reader and balance-candidate decoder can now detect some evidence, but Watchtower still needs a safe way to explain what kind of account might have been read.

This batch adds classification labels without treating them as confirmed contract identities.

## New module

```text
packages/api/src/account-classifier.ts
```

The classifier returns:

```text
kind
confidence
label
evidence
warnings
```

Supported kinds:

```text
popit_game_candidate
private_note_candidate
token_or_wallet_candidate
raw_account_only
missing_account
unknown_account
```

## Safety rule

No classification is considered confirmed yet.

A rewards-like field may produce:

```text
Possible PopitGame / locked-mining rewards account
```

But this remains partial until ABI/BOC decoding confirms the contract state.

A `_balance`-style field may produce:

```text
Possible PrivateNote / note balance account
```

But this remains partial until token identity and decimals are validated.

A raw `account.balance` field remains unresolved because it does not prove NACKL, SHELL, USDC, or unlocked wallet balance.

## Updated routes

`GET /accounts/inspect` now includes:

```text
accountClassification
```

`GET /snapshots/live` now adds wallet warnings showing the account classification label and confidence.

## Still not implemented

```text
confirmed contract code-hash registry
ABI/BOC state decoding
confirmed locked NACKL decoding
confirmed unlocked NACKL decoding
snapshot saving
```
