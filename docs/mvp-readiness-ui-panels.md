# MVP readiness UI panels

Batch 47 adds MVP readiness visibility to both the Web app and the Telegram Mini App.

## What changed

- The Web app loads `GET /mvp/readiness` when connected to the server.
- The Telegram Mini App loads the same readiness route.
- Both apps show readiness summary counts.
- Both apps show individual readiness items and their current status.

## Safety note

This panel measures implementation readiness only. It does not mean balance decoding is confirmed, snapshots are production-safe, or the tool is ready for public use.

Balance decoding remains blocked until live account evidence confirms exact NACKL semantics.
