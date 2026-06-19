# Token movement direct transfer classifier foundation

Batch 67 adds a read-only, on-the-fly classifier for direct NACKL, SHELL, and USDC transfers.

## Purpose

The frontend should not collapse every inbound or outbound token movement into one generic history list. Users need separate visuals for:

- NACKL direct transfers in;
- SHELL direct transfers in;
- USDC direct transfers in;
- NACKL direct transfers out;
- SHELL direct transfers out;
- USDC direct transfers out;
- excluded unresolved, decoder-needed, mining, or contract-routed rows.

## Safety rule

A movement is not treated as a simple direct transfer when it contains signals for:

- NACKL mining or rewards;
- accumulator interaction;
- bridge or TokenBridge interaction;
- PrivateNote;
- DEX / DODEX;
- unknown token;
- unknown direction;
- decoder-needed or partial evidence.

Those rows are pushed into the excluded / unresolved section until stronger evidence exists.

## Privacy boundary

This classifier is intended for on-the-fly rendering. It does not fetch chain data, store searched addresses, write browser storage, persist wallet history, use analytics, sign transactions, or custody assets.
