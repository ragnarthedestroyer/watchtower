/**
 * Watchtower Batch 52 — Known Contract Registry and Labeler
 *
 * Read-only address labeling foundation for Token Movement History.
 * This file does not fetch chain data, sign messages, operate wallets,
 * broadcast transactions, or claim that any address is proven unless the
 * registry entry itself provides confirmed evidence.
 */

import type {
  TokenMovement,
  TokenMovementAddressRole,
  TokenMovementAssetFamily,
  TokenMovementConfidence,
  TokenMovementParty,
} from "./token-movement";

export type KnownContractSource =
  | "official-docs"
  | "abi"
  | "blockchain-observation"
  | "user-provided"
  | "manual-research"
  | "watchtower-default";

export type KnownContractEvidence = {
  source: KnownContractSource;
  description: string;
  reference: string | null;
  confidence: TokenMovementConfidence;
};

export type KnownContractEntry = {
  /** Stable internal id, for example `shell-accumulator-candidate-mainnet`. */
  id: string;
  /** Raw address as entered or observed. Null is allowed for research-only templates. */
  address: string | null;
  /** Lowercase normalized form used for matching. */
  normalizedAddress: string | null;
  /** Human-facing label used in UI and reports. */
  label: string;
  /** Contract or account role used by Token Movement History. */
  role: TokenMovementAddressRole;
  /** Optional DApp ID when State V2 identity is known. */
  dappId: string | null;
  /** Optional account ID when State V2 identity is known. */
  accountId: string | null;
  /** Related asset families. Empty means asset-agnostic or unknown. */
  assetFamilies: TokenMovementAssetFamily[];
  /** Related symbols such as SHELL, NACKL, USDC. Empty means unknown. */
  tokenSymbols: string[];
  /** Confidence of the label, not proof of a balance or movement. */
  confidence: TokenMovementConfidence;
  /** Evidence explaining why Watchtower uses this label. */
  evidence: KnownContractEvidence[];
  /** True only for local/user-provided registry entries. */
  isUserProvided: boolean;
  /** Disabled entries are documentation/research templates and must not match. */
  enabled: boolean;
  notes: string[];
  warnings: string[];
  tags: string[];
};

export type KnownContractLabel = {
  inputAddress: string | null;
  normalizedAddress: string | null;
  label: string | null;
  role: TokenMovementAddressRole;
  confidence: TokenMovementConfidence;
  entry: KnownContractEntry | null;
  warnings: string[];
};

export type KnownContractRegistry = {
  generatedAt: string;
  entries: KnownContractEntry[];
  warnings: string[];
};

export const KNOWN_CONTRACT_ROLE_DESCRIPTIONS: Record<TokenMovementAddressRole, string> = {
  wallet: "User or application wallet address.",
  "token-wallet": "Token wallet contract that may hold a specific TIP-3 asset balance.",
  "token-root": "Token root or master contract for a TIP-3-style asset.",
  accumulator: "Accumulator, recovery, collection, or aggregation contract candidate.",
  bridge: "Bridge or cross-chain movement contract candidate.",
  dex: "DEX, prediction market, orderbook, market, or trading-related contract candidate.",
  "private-note": "PrivateNote-related contract candidate. Watchtower must remain read-only.",
  multifactor: "Multifactor/account-control contract candidate.",
  contract: "Known contract without a more specific role yet.",
  unknown: "Unknown or undecoded address.",
};

export function normalizeKnownContractAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  const trimmed = address.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

export function createKnownContractEntry(input: {
  id: string;
  address?: string | null;
  label: string;
  role: TokenMovementAddressRole;
  dappId?: string | null;
  accountId?: string | null;
  assetFamilies?: TokenMovementAssetFamily[];
  tokenSymbols?: string[];
  confidence?: TokenMovementConfidence;
  evidence?: KnownContractEvidence[];
  isUserProvided?: boolean;
  enabled?: boolean;
  notes?: string[];
  warnings?: string[];
  tags?: string[];
}): KnownContractEntry {
  const normalizedAddress = normalizeKnownContractAddress(input.address ?? null);

  return {
    id: input.id,
    address: input.address ?? null,
    normalizedAddress,
    label: input.label,
    role: input.role,
    dappId: input.dappId ?? null,
    accountId: input.accountId ?? null,
    assetFamilies: input.assetFamilies ?? [],
    tokenSymbols: input.tokenSymbols ?? [],
    confidence: input.confidence ?? "unknown",
    evidence: input.evidence ?? [],
    isUserProvided: input.isUserProvided ?? false,
    enabled: input.enabled ?? true,
    notes: input.notes ?? [],
    warnings: input.warnings ?? [],
    tags: input.tags ?? [],
  };
}

export const WATCHTOWER_RESEARCH_CONTRACT_TEMPLATES: KnownContractEntry[] = [
  createKnownContractEntry({
    id: "research-shell-accumulator-template",
    address: null,
    label: "SHELL accumulator / USDC recovery candidate",
    role: "accumulator",
    assetFamilies: ["SHELL", "USDC"],
    tokenSymbols: ["SHELL", "USDC"],
    confidence: "possible",
    enabled: false,
    evidence: [
      {
        source: "manual-research",
        description:
          "Template for the unresolved incident where almost 30k SHELL was reportedly sent to an accumulator to recover or get USDC.",
        reference: "Batch 51 SHELL accumulator research fixture",
        confidence: "possible",
      },
    ],
    notes: ["Disabled because no confirmed accumulator address is attached yet."],
    warnings: ["Do not use this template as proof that a specific contract received funds."],
    tags: ["shell", "usdc", "accumulator", "incident", "template"],
  }),
  createKnownContractEntry({
    id: "research-tip3-token-root-template",
    address: null,
    label: "TIP-3 token root candidate",
    role: "token-root",
    assetFamilies: ["TIP3"],
    confidence: "possible",
    enabled: false,
    evidence: [
      {
        source: "watchtower-default",
        description: "Template role for future TIP-3 roots once addresses are confirmed.",
        reference: null,
        confidence: "possible",
      },
    ],
    notes: ["Disabled until a concrete root contract address is known."],
    warnings: ["Do not infer token identity from this template alone."],
    tags: ["tip3", "token-root", "template"],
  }),
  createKnownContractEntry({
    id: "research-private-note-template",
    address: null,
    label: "PrivateNote-related contract candidate",
    role: "private-note",
    assetFamilies: ["NACKL", "SHELL", "USDC"],
    tokenSymbols: ["NACKL", "SHELL", "USDC"],
    confidence: "possible",
    enabled: false,
    evidence: [
      {
        source: "abi",
        description: "PrivateNote and RootPN ABIs contain token_type fields and private note deploy/withdraw functions.",
        reference: "PrivateNote.abi.json / RootPN.abi.json",
        confidence: "possible",
      },
    ],
    notes: ["Disabled until concrete addresses are confirmed."],
    warnings: ["Watchtower must never become a PrivateNote operator, key store, or signer."],
    tags: ["private-note", "rootpn", "template"],
  }),
];

/**
 * Batch 52 intentionally ships with no enabled hard-coded addresses.
 * Addresses should be added only when they are confirmed or deliberately supplied by the user.
 */
export const DEFAULT_KNOWN_CONTRACT_REGISTRY: KnownContractEntry[] = [];

export function buildKnownContractRegistry(entries: KnownContractEntry[]): KnownContractRegistry {
  const warnings = entries
    .flatMap((entry) => entry.warnings)
    .filter((warning, index, all) => all.indexOf(warning) === index);

  return {
    generatedAt: new Date().toISOString(),
    entries,
    warnings,
  };
}

export function mergeKnownContractRegistries(...registries: KnownContractEntry[][]): KnownContractEntry[] {
  const byId = new Map<string, KnownContractEntry>();
  for (const registry of registries) {
    for (const entry of registry) {
      byId.set(entry.id, entry);
    }
  }
  return Array.from(byId.values());
}

export function findKnownContractEntry(
  address: string | null | undefined,
  registry: KnownContractEntry[] = DEFAULT_KNOWN_CONTRACT_REGISTRY,
): KnownContractEntry | null {
  const normalizedAddress = normalizeKnownContractAddress(address);
  if (!normalizedAddress) return null;

  return (
    registry.find(
      (entry) => entry.enabled && entry.normalizedAddress !== null && entry.normalizedAddress === normalizedAddress,
    ) ?? null
  );
}

export function labelKnownContractAddress(
  address: string | null | undefined,
  registry: KnownContractEntry[] = DEFAULT_KNOWN_CONTRACT_REGISTRY,
): KnownContractLabel {
  const normalizedAddress = normalizeKnownContractAddress(address);
  const entry = findKnownContractEntry(address, registry);

  if (!entry) {
    return {
      inputAddress: address ?? null,
      normalizedAddress,
      label: null,
      role: "unknown",
      confidence: "unknown",
      entry: null,
      warnings: normalizedAddress ? ["Address is not present in the known contract registry."] : ["No address provided."],
    };
  }

  return {
    inputAddress: address ?? null,
    normalizedAddress,
    label: entry.label,
    role: entry.role,
    confidence: entry.confidence,
    entry,
    warnings: entry.warnings,
  };
}

export function labelTokenMovementParty(
  party: TokenMovementParty,
  registry: KnownContractEntry[] = DEFAULT_KNOWN_CONTRACT_REGISTRY,
): TokenMovementParty {
  const label = labelKnownContractAddress(party.address, registry);

  if (!label.entry) return party;

  return {
    ...party,
    label: party.label ?? label.label,
    role: party.role === "unknown" ? label.role : party.role,
    dappId: party.dappId ?? label.entry.dappId,
    accountId: party.accountId ?? label.entry.accountId,
  };
}

export function labelTokenMovement(
  movement: TokenMovement,
  registry: KnownContractEntry[] = DEFAULT_KNOWN_CONTRACT_REGISTRY,
): TokenMovement {
  return {
    ...movement,
    from: labelTokenMovementParty(movement.from, registry),
    to: labelTokenMovementParty(movement.to, registry),
    via: movement.via ? labelTokenMovementParty(movement.via, registry) : null,
  };
}

export function labelTokenMovements(
  movements: TokenMovement[],
  registry: KnownContractEntry[] = DEFAULT_KNOWN_CONTRACT_REGISTRY,
): TokenMovement[] {
  return movements.map((movement) => labelTokenMovement(movement, registry));
}

export function summarizeKnownContractLabel(label: KnownContractLabel): string {
  if (!label.entry) {
    return label.normalizedAddress
      ? `${label.normalizedAddress} is currently unknown to Watchtower.`
      : "No address was provided for labeling.";
  }

  return `${label.normalizedAddress ?? label.inputAddress} is labeled as ${label.label} (${label.role}, confidence: ${label.confidence}).`;
}
