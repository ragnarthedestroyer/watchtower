# Command aliases and run scripts

Batch 43 adds clearer root-level npm scripts so future instructions can use one consistent command style.

## Why this was added

Earlier documentation used commands like:

```bash
npm run dev:server
```

The root `package.json` already had the equivalent workspace command as:

```bash
npm run server:dev
```

Both styles now work.

## Current root commands

From the repository root, after dependencies are installed:

```bash
npm run typecheck
```

Runs TypeScript validation.

```bash
npm run dev:server
```

Starts the backend server.

```bash
npm run dev:web
```

Starts the web app.

```bash
npm run dev:telegram
```

Starts the Telegram Mini App preview.

```bash
npm run smoke:server
```

Runs the safe server route smoke test. The backend server must already be running.

```bash
npm run smoke:live
```

Runs the live-read smoke test. The backend server must already be running.

```bash
npm run test:urls
```

Prints useful browser test URLs.

## Required action after this batch

No command needs to be run locally. After uploading the batch, commit it and check GitHub Actions.

Expected result:

```text
Typecheck passes
```
