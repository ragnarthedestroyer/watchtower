import { buildDemoWatchlists } from "@watchtower/api";
import {
  createInMemorySchemaStore,
  persistWatchlist,
  type WatchtowerSchemaStore
} from "@watchtower/db";

const serverSchemaStore = createInMemorySchemaStore();
let seeded = false;

function seedDemoWatchlists(store: WatchtowerSchemaStore): void {
  if (seeded) {
    return;
  }

  for (const watchlist of buildDemoWatchlists()) {
    persistWatchlist({
      store,
      watchlist
    });
  }

  seeded = true;
}

export function getServerSchemaStore(): WatchtowerSchemaStore {
  seedDemoWatchlists(serverSchemaStore);
  return serverSchemaStore;
}
