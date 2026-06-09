# Watchtower Decoder Research Notes

## Purpose

This document captures decoder research discovered during the Xubuntu prototype and the uploaded ABI review. These notes are not the first implementation priority, but they guide future balance decoding.

## Confirmed / Likely Contract Areas

### Mvmultifactor

Role observed in prototype:

- identity wallet;
- stores name/root/owner metadata;
- may expose whitelisted addresses;
- should not be treated as direct NACKL balance source without decoder proof.

### PopitGame

Role observed in prototype:

- linked mining/reward account;
- `_rewards` was the strongest confirmed locked/mining NACKL source in the local diagnostic work.

### MobileVerifiersContractRoot

Role observed in prototype:

- source of Mobile Verifier epoch fields;
- useful for `_epochStart`, `_epochEnd`, reward timing, and snapshot safety.

### PrivateNote

ABI relevance:

- `getDetails` outputs `balance: map(uint32,uint128)`;
- fields include `_balance`;
- this may be relevant for token balances by token type.

Research status:

- important, but not first build priority;
- requires reliable identity/address derivation;
- should be implemented as a confidence-labelled decoder.

### RootPN

ABI relevance:

- exposes `getPrivateNoteAddress(deposit_identifier_hash)`;
- exposes `deployPrivateNote(...)`;
- exposes `withdrawTokens(...)`;
- fields include `_deployedValues: map(uint32,uint128)`.

Research status:

- possible source for deriving PrivateNote addresses;
- must be handled carefully and not used for snapshot saving until verified.

### PMP / Oracle / OracleEventList / Nullifier

Relevance:

- prediction market / private note ecosystem;
- not needed for Watchtower MVP unless account decoding proves they are part of wallet balance path.

## Decoder Confidence

Every decoded value must be labelled:

- `confirmed`;
- `probable`;
- `experimental`;
- `unresolved`;
- `failed`.

Snapshot saving should only include confirmed values in financial totals.

## Missing Data Rule

If a decoder cannot find a value, store `null` and status `unresolved`.

Never convert unresolved balance to zero.

## Future Decoder Tasks

1. Implement MobileVerifiers root decoder.
2. Implement PopitGame rewards decoder.
3. Implement Mvmultifactor identity decoder.
4. Implement PrivateNote decoder in research mode.
5. Implement RootPN address-derivation research tool.
6. Add decoder version to every saved snapshot row.
