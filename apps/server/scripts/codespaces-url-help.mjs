#!/usr/bin/env node

const baseUrl = process.env.WATCHTOWER_API_BASE_URL || "http://localhost:8787";
const sampleAddress = process.env.WATCHTOWER_TEST_ADDRESS || "0:<64hex>";
const sampleAccountId = process.env.WATCHTOWER_TEST_ACCOUNT_ID || "<64hex-account-id>";
const sampleDappId = process.env.WATCHTOWER_TEST_DAPP_ID || "<64hex-dapp-id>";

function print(title, url) {
  console.log(`\n${title}`);
  console.log(url);
}

console.log("Acki Watchtower Codespaces/browser test URL helper");
console.log("Base URL:", baseUrl);
console.log("\nStart the server first with: npm run server:dev");

print("Health", `${baseUrl}/health`);
print("Config status", `${baseUrl}/config/status`);
print("Route catalog", `${baseUrl}/routes`);
print("Demo/latest snapshot", `${baseUrl}/snapshots/latest`);
print("Live snapshot", `${baseUrl}/snapshots/live`);
print("Mobile Verifier epoch", `${baseUrl}/epoch/mobile-verifier`);
print("Legacy raw account", `${baseUrl}/accounts/raw?address=${encodeURIComponent(sampleAddress)}`);
print("Legacy account inspection", `${baseUrl}/accounts/inspect?address=${encodeURIComponent(sampleAddress)}`);
print(
  "State V2 account inspection",
  `${baseUrl}/accounts/inspect?account_id=${encodeURIComponent(sampleAccountId)}&dapp_id=${encodeURIComponent(sampleDappId)}`
);

console.log("\nNotes:");
console.log("- Replace placeholder addresses before using account routes.");
console.log("- Balance evidence is not confirmed NACKL yet.");
console.log("- Research-saved snapshots are temporary in-memory evidence only.");
