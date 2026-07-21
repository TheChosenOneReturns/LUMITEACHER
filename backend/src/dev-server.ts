import { createServer, type IncomingMessage } from "node:http";
import type { ApiEvent, ApiResponse } from "./http/api";
import { handler as createStory } from "./handlers/createStory";
import { handler as getStory } from "./handlers/getStory";
import { handler as health } from "./handlers/health";
import { handler as listStories } from "./handlers/listStories";
import { handler as submitAttempt } from "./handlers/submitAttempt";

process.env.TABLE_NAME ??= "StoryTeacherLocal";
process.env.DYNAMODB_ENDPOINT ??= "http://127.0.0.1:8000";
process.env.AWS_REGION ??= "us-east-1";
process.env.STORY_GENERATOR_MODE ??= "fixture";
process.env.ALLOWED_DEMO_USER_ID ??= "demo-sofia";
process.env.ALLOWED_ORIGIN ??= "http://localhost:5173";

const port = Number(process.env.PORT ?? 3000);

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

  if (request.method === "OPTIONS") {
    response.writeHead(204, corsHeaders());
    response.end();
    return;
  }

  const body = await readBody(request);
  const storyMatch = url.pathname.match(/^\/stories\/([^/]+)$/u);
  const attemptMatch = url.pathname.match(
    /^\/stories\/([^/]+)\/attempts$/u,
  );
  const event = makeEvent(request, url, body, {
    ...(storyMatch?.[1] ? { storyId: storyMatch[1] } : {}),
    ...(attemptMatch?.[1] ? { storyId: attemptMatch[1] } : {}),
  });

  let result: ApiResponse;
  if (request.method === "GET" && url.pathname === "/health") {
    result = await health(event);
  } else if (request.method === "POST" && url.pathname === "/stories") {
    result = await createStory(event);
  } else if (request.method === "GET" && url.pathname === "/stories") {
    result = await listStories(event);
  } else if (request.method === "GET" && storyMatch) {
    result = await getStory(event);
  } else if (request.method === "POST" && attemptMatch) {
    result = await submitAttempt(event);
  } else {
    result = {
      statusCode: 404,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ error: { code: "NOT_FOUND" } }),
    };
  }

  response.writeHead(result.statusCode ?? 200, normalizeHeaders(result.headers));
  response.end(result.body ?? "");
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Story Teacher API local: http://127.0.0.1:${port}`);
});

async function readBody(request: IncomingMessage): Promise<string | undefined> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return chunks.length ? Buffer.concat(chunks).toString("utf8") : undefined;
}

function makeEvent(
  request: IncomingMessage,
  url: URL,
  body: string | undefined,
  pathParameters: Record<string, string>,
): ApiEvent {
  return {
    version: "2.0",
    routeKey: `${request.method} ${url.pathname}`,
    rawPath: url.pathname,
    rawQueryString: url.searchParams.toString(),
    headers: Object.fromEntries(
      Object.entries(request.headers).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.join(",") : (value ?? ""),
      ]),
    ),
    queryStringParameters: Object.fromEntries(url.searchParams.entries()),
    pathParameters,
    requestContext: {
      accountId: "local",
      apiId: "local",
      domainName: "localhost",
      domainPrefix: "localhost",
      http: {
        method: request.method ?? "GET",
        path: url.pathname,
        protocol: "HTTP/1.1",
        sourceIp: request.socket.remoteAddress ?? "127.0.0.1",
        userAgent: request.headers["user-agent"] ?? "local",
      },
      requestId: crypto.randomUUID(),
      routeKey: `${request.method} ${url.pathname}`,
      stage: "$default",
      time: new Date().toUTCString(),
      timeEpoch: Date.now(),
    },
    ...(body ? { body } : {}),
    isBase64Encoded: false,
  };
}

function normalizeHeaders(
  headers: ApiResponse["headers"],
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers ?? {}).map(([key, value]) => [key, String(value)]),
  );
}

function corsHeaders(): Record<string, string> {
  return {
    "access-control-allow-origin": process.env.ALLOWED_ORIGIN!,
    "access-control-allow-headers":
      "Content-Type,X-Demo-User-Id,Idempotency-Key",
    "access-control-allow-methods": "GET,POST,OPTIONS",
  };
}

