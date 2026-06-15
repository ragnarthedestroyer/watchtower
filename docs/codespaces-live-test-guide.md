# Codespaces live test guide

This guide explains how to test Watchtower without installing anything on a personal computer.

## 1. Open Codespaces

In GitHub:

```text
Code -> Codespaces -> Create codespace on main
```

Wait until the browser-based VS Code environment opens.

## 2. Install dependencies

In the Codespaces terminal:

```bash
npm install
```

## 3. Confirm the repo still compiles

```bash
npm run typecheck
```

Expected result:

```text
No TypeScript errors
```

## 4. Start the Watchtower server

```bash
npm run server:dev
```

The server should listen on:

```text
http://localhost:8787
```

In Codespaces, GitHub may expose the port through a forwarded URL. Use the Ports tab if needed.

## 5. Open safe browser routes

Start with these routes:

```text
/health
/config/status
/routes
/watchlists
/snapshots/latest
```

These routes are safe and do not require a wallet address.

## 6. Optional account inspection

Only use a public address you are comfortable testing with.

Legacy format:

```text
/accounts/inspect?address=0:<64hex>
```

State V2 format:

```text
/accounts/inspect?account_id=<64hex>&dapp_id=<64hex>
```

## Important safety rule

Account inspection and balance candidates are research evidence only. They are not confirmed NACKL balances until the decoder is explicitly confirmed.
