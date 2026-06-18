# Batch 57 — Asset-flow visual summary

Batch 57 adds a read-only asset-flow summary layer for Token Movement History.

It turns conservative token movement candidates into a graph-like summary made of nodes and edges:

- nodes: watched address, wallet, accumulator, bridge, token root, token wallet, private note, contract, unknown;
- edges: observed or candidate movement from one node to another;
- totals: movement count, node count, edge count, confirmed/candidate/unresolved counts;
- warnings: unresolved evidence, missing endpoint, approximate amount, unsafe proof assumptions.

This batch does not fetch live history and does not prove token transfers. It only summarizes the movement records already produced by earlier layers.

## Safety rules

The summary is read-only.

It must not:

- sign transactions;
- request seed phrases or private keys;
- operate PrivateNote contracts;
- become a DEX or wallet frontend;
- treat candidate or unresolved edges as proof.

## Why this matters

The SHELL accumulator / USDC recovery incident needs a visual way to answer:

- where did the asset appear to go?
- what address or contract received it?
- is the destination known, suspected, or unknown?
- what is proven and what is still uncertain?

This model also applies to NACKL, USDC, future TIP-3 assets, and unknown undecoded assets.
