import { createWatchtowerApiClient } from "@watchtower/api";

const configuredBaseUrl = import.meta.env.VITE_WATCHTOWER_API_BASE_URL?.trim();

export const apiClientMode = configuredBaseUrl ? "server" : "demo";

export const apiClientBaseUrl = configuredBaseUrl || "local demo transport";

export const apiClient = createWatchtowerApiClient(
  configuredBaseUrl
    ? {
        baseUrl: configuredBaseUrl,
        transport: "fetch",
        runtime: "telegram"
      }
    : {
        runtime: "telegram"
      }
);
