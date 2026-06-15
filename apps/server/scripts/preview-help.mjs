#!/usr/bin/env node
const serverPort = process.env.WATCHTOWER_SERVER_PORT || "8787";
const webPort = process.env.WATCHTOWER_WEB_PORT || "3000";

console.log("Acki Watchtower preview help");
console.log("");
console.log("Recommended first preview command:");
console.log("  npm run preview:watchtower");
console.log("");
console.log("Expected local URLs:");
console.log(`  Web app:        http://localhost:${webPort}`);
console.log(`  Backend health: http://localhost:${serverPort}/health`);
console.log(`  Route catalog:  http://localhost:${serverPort}/routes`);
console.log("");
console.log("GitHub Codespaces steps:");
console.log("  1. Open your repo on GitHub.");
console.log("  2. Click Code → Codespaces → Create codespace on main.");
console.log("  3. In the Codespaces terminal, run: npm install");
console.log("  4. Then run: npm run preview:watchtower");
console.log("  5. Open the forwarded port 3000 to view the Web app.");
console.log("");
console.log("Default mode is demo. Live-read mode should only be used after endpoints are configured.");
