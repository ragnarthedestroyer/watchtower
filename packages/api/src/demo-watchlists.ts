import type { Watchlist } from "@watchtower/core";

export function buildDemoWatchlists(): Watchlist[] {
  const now = new Date().toISOString();

  return [
    {
      id: "demo-primary-watchlist",
      ownerUserId: "demo-user",
      name: "Primary monitoring list",
      description: "Demo list for the first Watchtower UI flow.",
      visibility: "private",
      wallets: [
        {
          id: "wallet-demo-legacy",
          label: "Main legacy wallet",
          enabled: true,
          identity: {
            scheme: "legacy",
            legacyAddress: "0:099e09156b6b0dcc840a815baf279e71e50736c3e81ff1e7fde788ad1780b4c1"
          },
          tags: ["legacy", "monitoring"],
          createdAt: now,
          updatedAt: now
        },
        {
          id: "wallet-demo-state-v2",
          label: "State V2 placeholder",
          enabled: false,
          identity: {
            scheme: "state_v2",
            dappId: "0000000000000000000000000000000000000000000000000000000000000000",
            accountId: "099e09156b6b0dcc840a815baf279e71e50736c3e81ff1e7fde788ad1780b4c1"
          },
          tags: ["state-v2", "disabled-placeholder"],
          createdAt: now,
          updatedAt: now
        }
      ],
      createdAt: now,
      updatedAt: now
    }
  ];
}
