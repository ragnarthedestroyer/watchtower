#!/usr/bin/env node
import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";

const serverPort = process.env.WATCHTOWER_SERVER_PORT || "8787";
const webPort = process.env.WATCHTOWER_WEB_PORT || "3000";
const apiBaseUrl = process.env.VITE_WATCHTOWER_API_BASE_URL || `http://localhost:${serverPort}`;
const runtimeMode = process.env.WATCHTOWER_RUNTIME_MODE || "demo";

const commonEnv = {
  ...process.env,
  WATCHTOWER_RUNTIME_MODE: runtimeMode,
  WATCHTOWER_SERVER_PORT: serverPort,
  VITE_WATCHTOWER_API_BASE_URL: apiBaseUrl
};

const children = [];

function startProcess(label, args, extraEnv = {}) {
  const child = spawn(npmCommand, args, {
    stdio: "pipe",
    shell: false,
    env: {
      ...commonEnv,
      ...extraEnv
    }
  });

  children.push(child);

  child.stdout.on("data", (chunk) => {
    process.stdout.write(`[${label}] ${chunk}`);
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(`[${label}] ${chunk}`);
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      console.log(`[${label}] stopped by ${signal}`);
      return;
    }

    if (code !== 0) {
      console.error(`[${label}] exited with code ${code}`);
      stopAll();
      process.exitCode = code || 1;
    }
  });

  return child;
}

function stopAll() {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
}

process.on("SIGINT", () => {
  console.log("\nStopping Watchtower preview...");
  stopAll();
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopAll();
  process.exit(0);
});

console.log("Starting Acki Watchtower preview...");
console.log(`Server: http://localhost:${serverPort}`);
console.log(`Web:    http://localhost:${webPort}`);
console.log(`Mode:   ${runtimeMode}`);
console.log(`Web API base URL: ${apiBaseUrl}`);
console.log("");
console.log("In GitHub Codespaces, open the forwarded port for the Web app, usually 3000.");
console.log("Press Ctrl+C to stop both processes.");
console.log("");

startProcess("server", ["run", "server:dev"]);
startProcess("web", ["run", "web:dev"], {
  PORT: webPort
});
