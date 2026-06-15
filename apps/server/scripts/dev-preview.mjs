import { spawn } from "node:child_process";

const serverPort = process.env.WATCHTOWER_SERVER_PORT || "8787";
const webPort = process.env.WATCHTOWER_WEB_PORT || "3000";
const runtimeMode = process.env.WATCHTOWER_RUNTIME_MODE || "demo";

function codespacesUrl(port) {
  const codespaceName = process.env.CODESPACE_NAME;
  const domain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || "app.github.dev";

  if (!codespaceName) {
    return null;
  }

  return `https://${codespaceName}-${port}.${domain}`;
}

const localServerUrl = `http://localhost:${serverPort}`;
const localWebUrl = `http://localhost:${webPort}`;
const codespacesServerUrl = codespacesUrl(serverPort);
const codespacesWebUrl = codespacesUrl(webPort);

const apiBaseUrl =
  process.env.VITE_WATCHTOWER_API_BASE_URL ||
  process.env.WATCHTOWER_API_BASE_URL ||
  codespacesServerUrl ||
  localServerUrl;

console.log("Starting Acki Watchtower preview...");
console.log(`Server local: ${localServerUrl}`);
console.log(`Web local:    ${localWebUrl}`);

if (codespacesServerUrl && codespacesWebUrl) {
  console.log(`Server Codespaces URL: ${codespacesServerUrl}`);
  console.log(`Web Codespaces URL:    ${codespacesWebUrl}`);
}

console.log(`Mode:   ${runtimeMode}`);
console.log(`Web API base URL: ${apiBaseUrl}`);
console.log("");
console.log("In GitHub Codespaces, open the forwarded port for the Web app, usually 3000.");
console.log("If the UI says 'Failed to fetch', open the forwarded port for 8787 once, then refresh the Web app.");
console.log("Press Ctrl+C to stop both processes.");
console.log("");

const commonEnv = {
  ...process.env,
  WATCHTOWER_RUNTIME_MODE: runtimeMode,
  WATCHTOWER_SERVER_PORT: serverPort,
  VITE_WATCHTOWER_API_BASE_URL: apiBaseUrl
};

const server = spawn("npm", ["run", "server:dev"], {
  stdio: ["inherit", "pipe", "pipe"],
  env: commonEnv,
  shell: process.platform === "win32"
});

const web = spawn("npm", ["run", "web:dev", "--", "--host", "0.0.0.0", "--port", webPort], {
  stdio: ["inherit", "pipe", "pipe"],
  env: commonEnv,
  shell: process.platform === "win32"
});

function pipe(prefix, stream) {
  stream.on("data", (chunk) => {
    process.stdout.write(`[${prefix}] ${chunk}`);
  });
}

pipe("server", server.stdout);
pipe("server", server.stderr);
pipe("web", web.stdout);
pipe("web", web.stderr);

function shutdown() {
  server.kill("SIGTERM");
  web.kill("SIGTERM");
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});

process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});

server.on("exit", (code) => {
  if (code && code !== 0) {
    console.error(`Server process exited with code ${code}.`);
    web.kill("SIGTERM");
    process.exit(code);
  }
});

web.on("exit", (code) => {
  if (code && code !== 0) {
    console.error(`Web process exited with code ${code}.`);
    server.kill("SIGTERM");
    process.exit(code);
  }
});
