export type WatchtowerRouteMode = "demo" | "live-read" | "server";

export type WatchtowerRouteQueryParam = {
  name: string;
  required: boolean;
  description: string;
};

export type WatchtowerRouteInfo = {
  method: "GET" | "POST";
  path: string;
  mode: WatchtowerRouteMode;
  description: string;
  safetyNotes: string[];
  queryParams?: WatchtowerRouteQueryParam[];
};

export type WatchtowerRouteCatalog = {
  generatedAt: string;
  routes: WatchtowerRouteInfo[];
};

export function buildWatchtowerRouteCatalog(): WatchtowerRouteCatalog {
  return {
    generatedAt: new Date().toISOString(),
    routes: [
      {
        method: "GET",
        path: "/config/status",
        mode: "server",
        description: "Returns sanitized runtime configuration status without exposing secret values.",
        safetyNotes: [
          "Does not expose API keys, bot tokens, database URLs, or endpoint values.",
          "Safe to call from the web and Telegram clients."
        ]
      },
      {
        method: "GET",
        path: "/health",
        mode: "live-read",
        description: "Returns API trust status using the live endpoint when live-read mode is configured, otherwise demo health.",
        safetyNotes: [
          "Read-only.",
          "Does not save snapshots.",
          "May return degraded, stale, down, or rate-limited status."
        ]
      },
      {
        method: "GET",
        path: "/watchlists",
        mode: "demo",
        description: "Returns the current demo watchlist until persistent user watchlists exist.",
        safetyNotes: [
          "Read-only.",
          "Uses demo data for now."
        ]
      },
      {
        method: "GET",
        path: "/snapshots/latest",
        mode: "demo",
        description: "Returns the latest demo snapshot until persistent snapshots exist.",
        safetyNotes: [
          "Read-only.",
          "Demo data only.",
          "Does not save snapshots."
        ]
      },
      {
        method: "GET",
        path: "/accounts/raw",
        mode: "live-read",
        description: "Reads raw account data from the configured Acki Nacki endpoint.",
        queryParams: [
          {
            name: "address",
            required: false,
            description: "Legacy address in 0:<64hex> or -1:<64hex> format."
          },
          {
            name: "account_id",
            required: false,
            description: "State V2 account ID as a 64-character hexadecimal string."
          },
          {
            name: "dapp_id",
            required: false,
            description: "State V2 DApp ID as a 64-character hexadecimal string. Falls back to WATCHTOWER_DAPP_ID when configured."
          }
        ],
        safetyNotes: [
          "Read-only.",
          "Does not decode balances.",
          "Does not save snapshots."
        ]
      },
      {
        method: "GET",
        path: "/accounts/inspect",
        mode: "live-read",
        description: "Reads and inspects raw account data, including normalizer warnings, decoder hints, balance candidates, and account classification.",
        queryParams: [
          {
            name: "address",
            required: false,
            description: "Legacy address in 0:<64hex> or -1:<64hex> format."
          },
          {
            name: "account_id",
            required: false,
            description: "State V2 account ID as a 64-character hexadecimal string."
          },
          {
            name: "dapp_id",
            required: false,
            description: "State V2 DApp ID as a 64-character hexadecimal string. Falls back to WATCHTOWER_DAPP_ID when configured."
          }
        ],
        safetyNotes: [
          "Read-only.",
          "Research/debug endpoint.",
          "Balance candidates are not confirmed wallet balances."
        ]
      },
      {
        method: "GET",
        path: "/epoch/mobile-verifier",
        mode: "live-read",
        description: "Reads the Mobile Verifier root account and runs the conservative epoch decoder attempt.",
        queryParams: [
          {
            name: "address",
            required: false,
            description: "Optional Mobile Verifier root legacy address override for testing."
          }
        ],
        safetyNotes: [
          "Read-only.",
          "Decoder may remain unresolved or partial.",
          "Snapshots remain unsafe unless decoder confidence is confirmed."
        ]
      },
      {
        method: "GET",
        path: "/snapshots/live",
        mode: "live-read",
        description: "Builds a live-read snapshot from the configured watchlist and applies snapshot safety policy.",
        queryParams: [
          {
            name: "mv_root_address",
            required: false,
            description: "Optional Mobile Verifier root legacy address override for testing."
          }
        ],
        safetyNotes: [
          "Read-only in the current implementation.",
          "Does not persist snapshots.",
          "Snapshot saving remains blocked unless safety policy returns SAFE_TO_SAVE."
        ]
      },

      {
        method: "POST",
        path: "/snapshots/live/research-save",
        mode: "live-read",
        description: "POST-only server route that builds a live snapshot and stores it in the in-memory schema store for research/history evidence.",
        queryParams: [
          {
            name: "mv_root_address",
            required: false,
            description: "Optional Mobile Verifier root legacy address override for testing."
          }
        ],
        safetyNotes: [
          "Use POST, not GET; this route changes server memory state.",
          "Stores research/history evidence only, not confirmed portfolio data.",
          "Blocked snapshots can be stored only with explicit research-save behavior.",
          "In-memory storage resets when the server restarts."
        ]
      },

      {
        method: "GET",
        path: "/snapshots/history",
        mode: "server",
        description: "Returns in-memory snapshot history summaries saved by research-save or future persistence flows.",
        queryParams: [
          {
            name: "watchlist_id",
            required: false,
            description: "Optional watchlist ID filter."
          },
          {
            name: "limit",
            required: false,
            description: "Optional maximum number of history entries to return. Defaults to 20 and caps at 100."
          }
        ],
        safetyNotes: [
          "Read-only.",
          "Shows temporary server memory only until a real database provider exists.",
          "Research-saved blocked snapshots are not confirmed portfolio data."
        ]
      },
      {
        method: "GET",
        path: "/snapshots/history/detail",
        mode: "server",
        description: "Returns one persisted in-memory snapshot bundle with wallet snapshots, balance candidates, API health, and epoch evidence.",
        queryParams: [
          {
            name: "snapshot_id",
            required: true,
            description: "Snapshot ID returned by /snapshots/history."
          }
        ],
        safetyNotes: [
          "Read-only.",
          "Diagnostic/history endpoint.",
          "Balance candidates remain evidence, not confirmed balances."
        ]
      },
      {
        method: "GET",
        path: "/routes",
        mode: "server",
        description: "Returns this route catalog for testing and operations.",
        safetyNotes: [
          "Read-only.",
          "Does not expose secrets."
        ]
      }
    ]
  };
}
