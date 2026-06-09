# Watchtower Wallet Identity Model

## Purpose

Watchtower must not treat a wallet identity as equal to a legacy address. State V2 changes the address model, so wallet identity must be abstracted from the account reference format from the first version.

## Design Principle

A Watchtower target is a stable logical identity. Address format is an implementation detail.

Wrong model:

```text
wallet = 0:<legacy_address>
```

Correct model:

```text
watch target → identity scheme → resolver → account references → decoders → snapshot
```

## Identity Types

### Legacy Address Identity

Used only as temporary compatibility.

```ts
type LegacyIdentity = {
  scheme: "legacy_address";
  legacyAddress: string;
};
```

### Legacy Named Wallet Identity

Useful for personal watchlists migrated from the Xubuntu prototype.

```ts
type LegacyNamedWalletIdentity = {
  scheme: "legacy_named_wallet";
  name: string;
  legacyAddress?: string;
};
```

### State V2 Identity

Target model for the new Watchtower.

```ts
type StateV2Identity = {
  scheme: "state_v2";
  dappId: string;
  accountId: string;
};
```

## Normalized Watch Target

```ts
type WatchTarget = {
  id: string;
  label: string;
  enabled: boolean;
  identity: LegacyIdentity | LegacyNamedWalletIdentity | StateV2Identity;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
};
```

## Resolved Account Bundle

Resolvers must return the same shape regardless of source format.

```ts
type ResolvedAccountBundle = {
  targetId: string;
  label: string;
  scheme: "legacy_address" | "legacy_named_wallet" | "state_v2";
  status: "OK" | "UNRESOLVED" | "ERROR";
  accounts: {
    main?: AccountReference;
    mobileVerifierRoot?: AccountReference;
    linkedMiningAccount?: AccountReference;
    privateNote?: AccountReference;
    other?: AccountReference[];
  };
  resolvedAt: string;
  resolverVersion: string;
  errors: string[];
};
```

## Account Reference

```ts
type AccountReference =
  | {
      scheme: "legacy";
      legacyAddress: string;
    }
  | {
      scheme: "state_v2";
      dappId: string;
      accountId: string;
      display: string;
    };
```

## Resolver Rules

1. The monitor must never hardcode address shape.
2. The dashboard must show identity scheme clearly.
3. A snapshot must be blocked if identity resolution is unresolved or stale.
4. Legacy format is allowed only as compatibility mode.
5. State V2 support is the target model.

## Migration Strategy

Phase 1: Support legacy watch targets but wrap them in identity objects.

Phase 2: Add State V2 resolver using DApp ID + Account ID.

Phase 3: Mark legacy targets as deprecated once official migration path is clear.

Phase 4: Remove legacy snapshot saving unless explicitly allowed by admin configuration.
