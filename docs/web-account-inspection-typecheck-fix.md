# Web account inspection typecheck fix

This hotfix corrects Web UI property names introduced by the State V2 account inspection UI batch.

## Fixed

- `balanceEvidence.decoderConfidence` was replaced with `balanceEvidence.recommendedSnapshotConfidence`.
- Live account inspection balance candidates now use `candidate.path` instead of `candidate.evidencePath`.
- Snapshot history balance candidates continue to use stored database field `evidencePath`.

## Reason

`BalanceEvidenceSummary` and `BalanceDecoderCandidate` use different field names from the provider-neutral database records. The Web UI was mixing the research inspection shape with the persisted history shape.
