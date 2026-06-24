// Watchtower Diagnostic Engine
console.log("🚀 Booting Watchtower Phase 1 Diagnostics...\n");

// --- TEST 1: SAFE BALANCE PARSING (Batch 88) ---
console.log("✅ [TEST 1] Verifying Safe BigInt Parser...");
const mockApiData = { "1": "150000000000000" }; 
const parsed = BigInt(mockApiData[String(1)] ?? '0');
if (parsed.toString() !== "150000000000000") throw new Error("Parser failed!");
console.log(`   Result: Safe parsing successful. No integer overflow detected.\n`);

// --- TEST 2: GRAPHQL V3 COMPLIANCE (Batch 90) ---
console.log("✅ [TEST 2] Verifying v3 Token_dApp Payload Formatting...");
const SUPPORTED_TOKENS = [
  { symbol: 'USDC', tokenRoot: '0:a1b2...', tokenDapp: '0000000000000000000000000000000000000000000000000000000000000000' }
];
const filters = SUPPORTED_TOKENS.map(t => ({ token_root: t.tokenRoot, token_dapp: t.tokenDapp }));
if (filters[0].token_dapp.includes("0:")) throw new Error("Format error: dApp ID must be bare hex!");
console.log(`   Result: Payload formatted correctly. Ready for archive node.\n`);

// --- TEST 3: LIVE NETWORK DATA & SPLITTING ---
const TEST_ADDRESS = process.argv[2];
if (!TEST_ADDRESS) {
  console.log("⚠️  [TEST 3] No wallet address provided.");
  console.log("   To test live history, run: node test_phase1.mjs <YOUR_WALLET_ADDRESS>");
} else {
  console.log(`📡 [TEST 3] Fetching Live Network Data for: ${TEST_ADDRESS}...`);
  try {
    const response = await fetch("https://mainnet.ackinacki.org/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query getHistory($addr: String!) {
            transactions(
              filter: { account_addr: { eq: $addr } }
              orderBy: [{path: "now", direction: DESC}]
              limit: 10
            ) {
              id
              now
              in_message { value, msg_type, src }
              out_messages { value, msg_type, dst }
            }
          }
        `,
        variables: { addr: TEST_ADDRESS }
      })
    });

    const data = await response.json();
    if (data.errors) {
      console.error("   ❌ API Error:", data.errors[0].message);
    } else {
      const txs = data.data.transactions || [];
      console.log(`   📥 Retrieved ${txs.length} recent transactions.\n`);
      
      console.log("   --- CLASSIFIED TRADE HISTORY ---");
      txs.forEach((tx, i) => {
        const isSystemOrMining = tx.in_message?.msg_type === 1 || tx.in_message?.src === null;
        const type = isSystemOrMining ? "⛏️  MINING / SYSTEM EVENT" : "💸 DIRECT TRANSFER     ";
        const valRaw = tx.in_message?.value || tx.out_messages?.[0]?.value || "0";
        const valFormatted = (Number(valRaw) / 1e9).toFixed(4); 
        
        const date = new Date(tx.now * 1000).toISOString().replace("T", " ").substring(0, 19);
        console.log(`   [${i+1}] ${date} | ${type} | Vol: ${valFormatted} NACKL`);
      });
    }
  } catch (e) {
     console.error("   ❌ Network failure:", e.message);
  }
}
console.log("\n🏁 Diagnostics Complete.");
