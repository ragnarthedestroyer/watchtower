# Database in-memory schema store

Batch 30 adds a provider-neutral in-memory schema store.

## Purpose

The earlier repository layer stores core objects directly. The schema layer from batches 28 and 29 defines the records that a real database provider will eventually persist.

This batch connects those two ideas by adding an in-memory store for the schema records.

## What it supports

The store can hold:

- users
- watchlists
- wallets
- API health checks
- Mobile Verifier epoch reads
- snapshots
- wallet snapshots
- balance candidates
- raw inspections

It also supports saving a snapshot bundle as one logical unit.

## What it does not do yet

This is not a production database adapter. It does not write to PostgreSQL, Supabase, Neon, SQLite, Prisma, Drizzle, or a file.

It is a safe bridge step before choosing a provider.

## Why this matters

Watchtower needs persistence, but snapshot safety must remain strict. This batch lets later code map and store blocked/read-only snapshot evidence without committing to an infrastructure provider too early.
