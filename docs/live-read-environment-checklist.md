# Live-read environment checklist

Before testing live Acki Nacki reads, confirm these items.

## Required for demo mode

No external endpoint is required.

```env
WATCHTOWER_RUNTIME_MODE=demo
WATCHTOWER_SERVER_PORT=8787
```

Demo mode is enough to test server routes, UI panels, route catalog, and snapshot-history behavior.

## Required for live-read mode

Live-read mode should only be used when a read endpoint is configured.

```env
WATCHTOWER_RUNTIME_MODE=live-read
WATCHTOWER_GRAPHQL_ENDPOINT=<read endpoint>
WATCHTOWER_REST_ENDPOINT=<optional fallback endpoint>
WATCHTOWER_DAPP_ID=<optional/future State V2 value>
```

## What live-read mode can currently do

```text
- Check endpoint reachability.
- Read raw account responses.
- Normalize account response shape.
- Inspect account evidence.
- Read Mobile Verifier root as raw account.
- Build blocked/research snapshots.
```

## What live-read mode cannot safely claim yet

```text
- Confirm unlocked NACKL balances.
- Confirm locked/mining NACKL balances.
- Confirm PrivateNote balances.
- Save production snapshots.
```

## When to stop testing

Stop live-read testing if any route shows:

```text
RATE_LIMITED
DOWN
STALE
Cloudflare/API outage signal
all balances zero
unresolved decoder confidence
```

In those cases, Watchtower should remain in read-only/research mode.
