import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readServerEnv } from "./env";
import { handleServerRequest } from "./routes";

const env = readServerEnv();

const server = createServer((incomingMessage, serverResponse) => {
  void routeIncomingRequest(incomingMessage, serverResponse);
});

async function routeIncomingRequest(
  incomingMessage: IncomingMessage,
  serverResponse: ServerResponse
): Promise<void> {
  try {
    const request = toWebRequest(incomingMessage);
    const response = await handleServerRequest(request, env);

    serverResponse.statusCode = response.status;
    response.headers.forEach((value, key) => {
      serverResponse.setHeader(key, value);
    });

    const body = response.body;

    if (!body) {
      serverResponse.end();
      return;
    }

    const bodyBuffer = Buffer.from(await response.arrayBuffer());
    serverResponse.end(bodyBuffer);
  } catch (error) {
    serverResponse.statusCode = 500;
    serverResponse.setHeader("content-type", "application/json; charset=utf-8");
    serverResponse.end(
      JSON.stringify({
        ok: false,
        errors: [error instanceof Error ? error.message : "Unknown server error."]
      })
    );
  }
}

function toWebRequest(incomingMessage: IncomingMessage): Request {
  const host = incomingMessage.headers.host || `localhost:${env.port}`;
  const url = new URL(incomingMessage.url || "/", `http://${host}`);

  return new Request(url, {
    method: incomingMessage.method,
    headers: incomingMessage.headers as HeadersInit
  });
}

server.listen(env.port, env.host, () => {
  console.log(`Acki Watchtower server listening on http://${env.host}:${env.port}`);
  console.log(`Runtime mode: ${env.endpointConfig.mode}`);
  console.log(
    "Available routes: /health, /watchlists, /snapshots/latest, /config/status"
  );

  for (const warning of env.endpointConfig.warnings) {
    console.warn(`Config warning: ${warning}`);
  }

  for (const error of env.endpointConfig.errors) {
    console.error(`Config error: ${error}`);
  }
});
