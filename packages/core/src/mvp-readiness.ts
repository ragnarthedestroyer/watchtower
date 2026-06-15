export type WatchtowerReadinessStatus =
  | "done"
  | "partial"
  | "blocked"
  | "not_started";

export type WatchtowerReadinessArea =
  | "project_foundation"
  | "ci_typecheck"
  | "web_app"
  | "telegram_app"
  | "server"
  | "live_read"
  | "snapshot_policy"
  | "snapshot_research_persistence"
  | "account_inspection"
  | "balance_decoding"
  | "database_persistence"
  | "telegram_auth"
  | "deployment";

export type WatchtowerReadinessItem = {
  area: WatchtowerReadinessArea;
  title: string;
  status: WatchtowerReadinessStatus;
  summary: string;
  nextStep: string;
};

export const WATCHTOWER_MVP_READINESS: WatchtowerReadinessItem[] = [
  {
    area: "project_foundation",
    title: "Project foundation",
    status: "done",
    summary: "Monorepo structure, shared packages, docs, and scripts are in place.",
    nextStep: "Keep future changes inside the established package boundaries."
  },
  {
    area: "ci_typecheck",
    title: "CI and strict TypeScript",
    status: "done",
    summary: "GitHub Actions typecheck is active and strict TypeScript is passing.",
    nextStep: "Keep every batch green before adding larger features."
  },
  {
    area: "web_app",
    title: "Web app foundation",
    status: "partial",
    summary: "The web app can show status panels, snapshot evidence, history, and account inspection.",
    nextStep: "Add real watchlist editing and deployment configuration."
  },
  {
    area: "telegram_app",
    title: "Telegram Mini App foundation",
    status: "partial",
    summary: "The Telegram app mirrors the web evidence and inspection flows, with runtime awareness.",
    nextStep: "Add Telegram init data validation before treating users as authenticated."
  },
  {
    area: "server",
    title: "Server foundation",
    status: "partial",
    summary: "The server exposes safe health, route, account, epoch, snapshot, and history routes.",
    nextStep: "Connect server routes to real persistent storage and verified live endpoints."
  },
  {
    area: "live_read",
    title: "Live-read foundation",
    status: "partial",
    summary: "Live health checks and raw account reads exist, but real endpoint behavior still needs testing.",
    nextStep: "Run live-read tests with controlled test addresses."
  },
  {
    area: "snapshot_policy",
    title: "Snapshot safety policy",
    status: "done",
    summary: "Unsafe snapshots are blocked when API, epoch, wallet, or decoder evidence is not reliable.",
    nextStep: "Keep the policy conservative until balance decoding is confirmed."
  },
  {
    area: "snapshot_research_persistence",
    title: "Research snapshot persistence",
    status: "partial",
    summary: "Blocked snapshots can be saved explicitly as temporary in-memory research evidence.",
    nextStep: "Replace in-memory storage with a real provider only after the data model stabilizes."
  },
  {
    area: "account_inspection",
    title: "Account inspection",
    status: "partial",
    summary: "Legacy and State V2 inspection UI is available for raw evidence and decoder hints.",
    nextStep: "Use real inspection payloads to improve account classification and decoding."
  },
  {
    area: "balance_decoding",
    title: "Balance decoding",
    status: "blocked",
    summary: "Balance candidates are detected, but no NACKL balance is confirmed yet.",
    nextStep: "Collect live account evidence and compare it against known wallet balances."
  },
  {
    area: "database_persistence",
    title: "Real database persistence",
    status: "not_started",
    summary: "Provider-neutral schema and mapping exist, but no external database adapter is selected.",
    nextStep: "Choose a database provider after live-read and snapshot evidence stabilize."
  },
  {
    area: "telegram_auth",
    title: "Telegram authentication",
    status: "not_started",
    summary: "Telegram runtime detection exists, but init data validation is not implemented yet.",
    nextStep: "Add server-side Telegram init data validation before private user data is stored."
  },
  {
    area: "deployment",
    title: "Deployment",
    status: "not_started",
    summary: "The project is not deployed yet.",
    nextStep: "Deploy only after live-read behavior and environment requirements are clear."
  }
];

export function readinessSummary(items = WATCHTOWER_MVP_READINESS): {
  total: number;
  done: number;
  partial: number;
  blocked: number;
  notStarted: number;
} {
  return {
    total: items.length,
    done: items.filter((item) => item.status === "done").length,
    partial: items.filter((item) => item.status === "partial").length,
    blocked: items.filter((item) => item.status === "blocked").length,
    notStarted: items.filter((item) => item.status === "not_started").length
  };
}
