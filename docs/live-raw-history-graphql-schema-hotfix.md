# Batch 84 — Live raw history GraphQL schema hotfix

Batch 84 fixes the first successful live-route test where the route existed and responded, but the GraphQL query did not match the current Acki Nacki public GraphQL schema.

## Problem observed

The route returned live-read output, but warnings included errors such as:

```text
GraphQL error: Field "account" argument "account_id" of type "BlockchainQuery" is required but not provided
GraphQL error: Field "account" argument "dapp_id" of type "BlockchainQuery" is required but not provided
GraphQL error: Unknown argument "address" on field "account" of type "BlockchainQuery"
GraphQL error: Unknown field "hash" on type "Transaction"
GraphQL error: Unknown field "inMessage" on type "Transaction". Did you mean "in_message"?
GraphQL error: Unknown field "outMessages" on type "Transaction". Did you mean "out_messages"?
```

This showed that the route registration was fixed, but the legacy query was still using the wrong `blockchain.account(address: ...)` shape and camelCase message fields.

## What changed

The live raw history query now uses the same account-list style already used by the raw account reader:

```graphql
accounts(filter: { id: { eq: $address } })
```

For transaction rows, it now requests only conservative schema fields:

```graphql
id
lt
now
in_msg
out_msgs
```

This avoids unsupported fields such as `hash`, `inMessage`, and `outMessages`.

## Safety boundary

The route remains read-only and on-the-fly.

Returned rows remain raw transaction/message observations. They are not confirmed decoded NACKL, SHELL, USDC, bridge, accumulator, DEX, or PrivateNote movements yet.
