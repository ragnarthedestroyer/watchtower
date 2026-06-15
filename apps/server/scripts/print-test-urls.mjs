const baseUrl = process.env.WATCHTOWER_API_BASE_URL || "http://localhost:8787";
const testAddress = process.env.WATCHTOWER_TEST_ADDRESS || "0:<64hex>";
const testAccountId = process.env.WATCHTOWER_TEST_ACCOUNT_ID || "<64hex-account-id>";
const testDappId = process.env.WATCHTOWER_TEST_DAPP_ID || "<64hex-dapp-id>";
const mvRootAddress = process.env.WATCHTOWER_TEST_MV_ROOT_ADDRESS || "0:<64hex-mobile-verifier-root>";

const urls = [
  ["Server health", `${baseUrl}/health`],
  ["Config status", `${baseUrl}/config/status`],
  ["Route catalog", `${baseUrl}/routes`],
  ["Demo/latest snapshot", `${baseUrl}/snapshots/latest`],
  ["Live snapshot", `${baseUrl}/snapshots/live`],
  ["Mobile Verifier epoch", `${baseUrl}/epoch/mobile-verifier`],
  ["Mobile Verifier epoch with override", `${baseUrl}/epoch/mobile-verifier?address=${encodeURIComponent(mvRootAddress)}`],
  ["Legacy raw account", `${baseUrl}/accounts/raw?address=${encodeURIComponent(testAddress)}`],
  ["Legacy account inspection", `${baseUrl}/accounts/inspect?address=${encodeURIComponent(testAddress)}`],
  ["State V2 raw account", `${baseUrl}/accounts/raw?account_id=${encodeURIComponent(testAccountId)}&dapp_id=${encodeURIComponent(testDappId)}`],
  ["State V2 account inspection", `${baseUrl}/accounts/inspect?account_id=${encodeURIComponent(testAccountId)}&dapp_id=${encodeURIComponent(testDappId)}`],
  ["Snapshot history", `${baseUrl}/snapshots/history`]
];

console.log("Acki Watchtower test URLs");
console.log("=========================");
console.log(`Base URL: ${baseUrl}`);
console.log("");

for (const [label, url] of urls) {
  console.log(`${label}:`);
  console.log(url);
  console.log("");
}

console.log("Notes:");
console.log("- Replace placeholder values before testing account-specific URLs.");
console.log("- These routes are read-only, except POST /snapshots/live/research-save which is not listed here.");
console.log("- Balance evidence remains research-only unless decoder confidence becomes confirmed.");
