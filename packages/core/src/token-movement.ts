/**
 * Watchtower Batch 51 — Token Movement Model Foundation
 *
 * Read-only domain model for asset movement history and future traceability.
 * This file does not perform live reads, signing, custody, wallet actions, trading,
 * or decoding claims. It only defines conservative shared types, helpers and sample
 * research fixtures that later batches can consume.
 */

export type TokenMovementAssetFamily =
  | "NACKL"
  | "SHELL"
  | "USDC"
  | "TIP3"
  | "UNKNOWN";

export type TokenMovementDirection =
  | "incoming"
  | "outgoing"
  | "internal"
  | "unknown";

export type TokenMovementConfidence =
  | "confirmed"
  | "probable"
  | "possible"
  | "unknown";

export type TokenMovementEvidenceKind =
  | "transaction"
  | "message"
  | "event"
  | "account-state"
  | "contract-call"
  | "manual-note"
  | "research-fixture";

export type TokenMovementAddressRole =
  | "wallet"
  | "token-wallet"
  | "token-root"
  | "accumulator"
  | "bridge"
  | "dex"
  | "private-note"
  | "multifactor"
  | "contract"
  | "unknown";

export type TokenMovementAmount = {
  /** Raw integer amount exactly as observed or decoded. */
  raw: string | null;
  /** Human display value, only when decimals or units are known. */
  display: string | null;
  /** Decimals used for display conversion, when known. */
  decimals: number | null;
  /** Unit label such as SHELL, NACKL, USDC, or raw units. */
  unit: string;
  /** True only when amount was decoded from a trusted source. */
  confirmed: boolean;
};

export type TokenMovementParty = {
  address: string | null;
  label: string | null;
  role: TokenMovementAddressRole;
  dappId?: string | null;
  accountId?: string | null;
};

export type TokenMovementToken = {
  family: TokenMovementAssetFamily;
  symbol: string;
  tokenType?: number | null;
  rootContract?: string | null;
  walletContract?: string | null;
  contractLabel?: string | null;
  isKnown: boolean;
};

export type TokenMovementEvidence = {
  kind: TokenMovementEvidenceKind;
  id: string | null;
  source: string;
  description: string;
  confidence: TokenMovementConfidence;
};

export type TokenMovementUncertainty = {
  field: string;
  reason: string;
  severity: "low" | "medium" | "high";
};

export type TokenMovement = {
  id: string;
  observedAt: string | null;
  logicalTime?: string | null;
  direction: TokenMovementDirection;
  token: TokenMovementToken;
  amount: TokenMovementAmount;
  from: TokenMovementParty;
  to: TokenMovementParty;
  via: TokenMovementParty | null;
  likelyAction: string;
  summary: string;
  proofStatus: TokenMovementConfidence;
  evidence: TokenMovementEvidence[];
  uncertainty: TokenMovementUncertainty[];
  warnings: string[];
  tags: string[];
};

export type TokenMovementHistory = {
  subject: TokenMovementParty;
  generatedAt: string;
  movements: TokenMovement[];
  warnings: string[];
};

export const UNKNOWN_TOKEN: TokenMovementToken = {
  family: "UNKNOWN",
  symbol: "UNKNOWN",
  tokenType: null,
  rootContract: null,
  walletContract: null,
  contractLabel: null,
  isKnown: false,
};

export function createUnknownAmount(unit = "raw units"): TokenMovementAmount {
  return {
    raw: null,
    display: null,
    decimals: null,
    unit,
    confirmed: false,
  };
}

export function createParty(input: Partial<TokenMovementParty> = {}): TokenMovementParty {
  return {
    address: input.address ?? null,
    label: input.label ?? null,
    role: input.role ?? "unknown",
    dappId: input.dappId ?? null,
    accountId: input.accountId ?? null,
  };
}

export function hasConfirmedProof(movement: TokenMovement): boolean {
  return movement.proofStatus === "confirmed" && movement.evidence.some((item) => item.confidence === "confirmed");
}

export function movementNeedsReview(movement: TokenMovement): boolean {
  return movement.proofStatus !== "confirmed" || movement.uncertainty.some((item) => item.severity === "high");
}

export function summarizeMovement(movement: TokenMovement): string {
  const amount = movement.amount.display ?? movement.amount.raw ?? "unknown amount";
  const token = movement.token.symbol || movement.token.family;
  const from = movement.from.label ?? movement.from.address ?? "unknown source";
  const to = movement.to.label ?? movement.to.address ?? "unknown destination";
  return `${amount} ${token} moved from ${from} to ${to}: ${movement.likelyAction}`;
}

export const TOKEN_MOVEMENT_RESEARCH_FIXTURES: TokenMovement[] = [
  {
    id: "research-shell-accumulator-unresolved",
    observedAt: null,
    logicalTime: null,
    direction: "outgoing",
    token: {
      family: "SHELL",
      symbol: "SHELL",
      tokenType: 2,
      rootContract: null,
      walletContract: null,
      contractLabel: "SHELL / native gas or tokenized shell flow",
      isKnown: true,
    },
    amount: {
      raw: null,
      display: "~30000",
      decimals: null,
      unit: "SHELL",
      confirmed: false,
    },
    from: createParty({ label: "user wallet", role: "wallet" }),
    to: createParty({ label: "accumulator / recovery contract", role: "accumulator" }),
    via: null,
    likelyAction: "Possible SHELL transfer to accumulator for USDC recovery flow",
    summary:
      "Research placeholder for the real incident where almost 30k SHELL was sent to an accumulator and disappeared from visible frontend history.",
    proofStatus: "unknown",
    evidence: [
      {
        kind: "research-fixture",
        id: "shell-accumulator-incident-note",
        source: "manual user report",
        description:
          "User reported sending almost 30k SHELL to an accumulator to recover or get USDC back; current frontend did not provide traceability.",
        confidence: "possible",
      },
    ],
    uncertainty: [
      {
        field: "transactionId",
        reason: "No confirmed transaction or message id attached yet.",
        severity: "high",
      },
      {
        field: "amount.raw",
        reason: "Amount is approximate and not decoded from chain data yet.",
        severity: "high",
      },
      {
        field: "contract",
        reason: "Accumulator contract address and ABI are not confirmed yet.",
        severity: "high",
      },
    ],
    warnings: [
      "Do not present this fixture as confirmed transaction history.",
      "This is a research target for Batch 58, not proof of where funds are now.",
    ],
    tags: ["shell", "accumulator", "usdc-recovery", "incident", "research"],
  },
  {
    id: "research-nackl-generic-transfer",
    observedAt: null,
    logicalTime: null,
    direction: "unknown",
    token: {
      family: "NACKL",
      symbol: "NACKL",
      tokenType: 1,
      rootContract: null,
      walletContract: null,
      contractLabel: "NACKL",
      isKnown: true,
    },
    amount: createUnknownAmount("NACKL"),
    from: createParty({ role: "wallet" }),
    to: createParty({ role: "wallet" }),
    via: null,
    likelyAction: "Generic NACKL movement placeholder",
    summary: "Placeholder used to validate UI/API handling before live NACKL decoding is reliable.",
    proofStatus: "unknown",
    evidence: [],
    uncertainty: [
      { field: "decoder", reason: "Confirmed balance and movement decoding is not solved yet.", severity: "high" },
    ],
    warnings: ["Do not save unsafe snapshots from this placeholder."],
    tags: ["nackl", "fixture"],
  },
  {
    id: "research-usdc-tip3-generic-transfer",
    observedAt: null,
    logicalTime: null,
    direction: "unknown",
    token: {
      family: "USDC",
      symbol: "USDC",
      tokenType: 3,
      rootContract: null,
      walletContract: null,
      contractLabel: "USDC / TIP-3 candidate",
      isKnown: true,
    },
    amount: createUnknownAmount("USDC"),
    from: createParty({ role: "token-wallet" }),
    to: createParty({ role: "token-wallet" }),
    via: createParty({ label: "TIP-3 contract", role: "contract" }),
    likelyAction: "Generic USDC / TIP-3 movement placeholder",
    summary: "Placeholder used to validate future USDC and TIP-3 asset flow history.",
    proofStatus: "unknown",
    evidence: [],
    uncertainty: [
      { field: "tokenRoot", reason: "Root contract is not confirmed in this foundation batch.", severity: "high" },
    ],
    warnings: ["Do not present as confirmed USDC balance or transfer history."],
    tags: ["usdc", "tip3", "fixture"],
  },
];

export function buildTokenMovementHistory(subject: TokenMovementParty, movements: TokenMovement[]): TokenMovementHistory {
  const warnings = movements
    .flatMap((movement) => movement.warnings)
    .filter((warning, index, all) => all.indexOf(warning) === index);

  return {
    subject,
    generatedAt: new Date().toISOString(),
    movements,
    warnings,
  };
}
