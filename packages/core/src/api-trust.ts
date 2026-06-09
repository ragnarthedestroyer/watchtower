import type { ApiTrustStatus } from "./snapshot-policy";

export type ApiHealthSignal = {
  checkedAt: string;
  reachable: boolean;
  httpStatus?: number;
  responseMs?: number;
  stale?: boolean;
  errorText?: string;
};

export type ApiTrustDecision = {
  status: ApiTrustStatus;
  reasons: string[];
  hasRateLimitSignal: boolean;
  hasCloudflareOutageSignal: boolean;
};

export function evaluateApiTrust(signal: ApiHealthSignal): ApiTrustDecision {
  const reasons: string[] = [];

  const errorText = String(signal.errorText || "").toLowerCase();

  const hasRateLimitSignal =
    signal.httpStatus === 429 ||
    errorText.includes("429") ||
    errorText.includes("rate limit") ||
    errorText.includes("too many requests");

  const hasCloudflareOutageSignal =
    signal.httpStatus === 502 ||
    signal.httpStatus === 503 ||
    errorText.includes("bad gateway") ||
    errorText.includes("service unavailable") ||
    errorText.includes("cloudflare") ||
    errorText.includes("origin web server") ||
    errorText.includes("no server is available");

  if (!signal.reachable) {
    reasons.push("API is not reachable.");
  }

  if (signal.httpStatus) {
    reasons.push(`HTTP status: ${signal.httpStatus}.`);
  }

  if (hasRateLimitSignal) {
    reasons.push("Rate-limit signal detected.");
  }

  if (hasCloudflareOutageSignal) {
    reasons.push("Cloudflare/API outage signal detected.");
  }

  if (signal.stale) {
    reasons.push("API response is stale.");
  }

  if (signal.responseMs !== undefined && signal.responseMs > 10_000) {
    reasons.push(`API response is slow: ${signal.responseMs}ms.`);
  }

  if (hasRateLimitSignal) {
    return {
      status: "RATE_LIMITED",
      reasons,
      hasRateLimitSignal,
      hasCloudflareOutageSignal
    };
  }

  if (!signal.reachable || hasCloudflareOutageSignal) {
    return {
      status: "DOWN",
      reasons,
      hasRateLimitSignal,
      hasCloudflareOutageSignal
    };
  }

  if (signal.stale) {
    return {
      status: "STALE",
      reasons,
      hasRateLimitSignal,
      hasCloudflareOutageSignal
    };
  }

  if (signal.responseMs !== undefined && signal.responseMs > 10_000) {
    return {
      status: "DEGRADED",
      reasons,
      hasRateLimitSignal,
      hasCloudflareOutageSignal
    };
  }

  return {
    status: "OK",
    reasons: [],
    hasRateLimitSignal,
    hasCloudflareOutageSignal
  };
}
