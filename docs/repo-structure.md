# Watchtower Repository Structure

## Purpose

This document defines the intended repository layout for the clean Watchtower project.

## Target Structure

```text
acki-watchtower/
  README.md
  docs/
    architecture-v0.md
    infrastructure-reuse-audit.md
    r4t-separation-rules.md
    snapshot-policy.md
    state-v2-risk-register.md
    wallet-identity-model.md
    api-trust-model.md
    mobile-verifier-epoch-model.md
    web-telegram-product-plan.md
    data-model-v0.md
    repo-structure.md
    implementation-roadmap.md
    operations-runbook.md
    security-and-privacy.md
    decoder-research-notes.md

  apps/
    web/
    telegram/

  packages/
    core/
    api/
    db/
    ui/
    sdk-adapter/

  tools/
    diagnostics/
    scripts/

  .github/
    workflows/
```

## Package Responsibilities

### `apps/web`

Web dashboard and admin UI.

### `apps/telegram`

Telegram Mini App entry point and Telegram-specific UI behavior.

### `packages/core`

Business logic:

- identity model;
- resolver interface;
- snapshot policy;
- API trust model;
- epoch model;
- decoder interfaces.

### `packages/api`

Backend API:

- watch targets;
- health status;
- snapshot attempts;
- dashboard data;
- admin operations.

### `packages/db`

Database schema, migrations, and data access.

### `packages/ui`

Shared components between web and Telegram surfaces.

### `packages/sdk-adapter`

Acki Nacki / TVM SDK integration boundary.

This package must hide legacy versus State V2 account format differences from the rest of the app.

### `tools/diagnostics`

Manual tools for ABI scans, account checks, epoch verification, and decoder research.

## Rule

Production app code must not depend directly on one-off diagnostics. Diagnostics can inform decoder development, but they must not become the main product architecture.
