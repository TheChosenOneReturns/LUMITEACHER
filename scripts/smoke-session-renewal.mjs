import { createHash } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";

const [functionName, tableName, region = "us-east-2"] = process.argv.slice(2);
if (!functionName || !tableName) {
  throw new Error(
    "Usage: node scripts/smoke-session-renewal.mjs <function-name> <table-name> [region]",
  );
}

const timestamp = Date.now();
const userId = `diagnostic-session-${timestamp}`;
const sessionId = `renewal-${timestamp}`;
const sourceIp = "203.0.113.77";
const userAgent = "story-teacher-production-smoke";
const key = {
  PK: `SESSION#${createHash("sha256")
    .update(`${userId}:${sessionId}`)
    .digest("hex")}`,
  SK: "CONTEXT",
};

const lambda = new LambdaClient({ region });
const documentClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region }),
);

function event(expiresAtEpochSeconds) {
  return {
    version: "2.0",
    routeKey: "GET /stories",
    rawPath: "/stories",
    rawQueryString: "limit=1",
    headers: {
      origin: "https://main.d3l7lwifmxwzzj.amplifyapp.com",
      "user-agent": userAgent,
    },
    queryStringParameters: { limit: "1" },
    requestContext: {
      accountId: "diagnostic",
      apiId: "diagnostic",
      authorizer: {
        jwt: {
          claims: {
            sub: userId,
            origin_jti: sessionId,
            exp: String(expiresAtEpochSeconds),
          },
        },
      },
      domainName: "diagnostic",
      domainPrefix: "diagnostic",
      http: {
        method: "GET",
        path: "/stories",
        protocol: "HTTP/1.1",
        sourceIp,
        userAgent,
      },
      requestId: `diagnostic-${Date.now()}`,
      routeKey: "GET /stories",
      stage: "$default",
      time: new Date().toUTCString(),
      timeEpoch: Date.now(),
    },
    isBase64Encoded: false,
  };
}

async function invoke(expiresAtEpochSeconds) {
  const response = await lambda.send(
    new InvokeCommand({
      FunctionName: functionName,
      InvocationType: "RequestResponse",
      Payload: Buffer.from(JSON.stringify(event(expiresAtEpochSeconds))),
    }),
  );
  const payload = JSON.parse(
    Buffer.from(response.Payload ?? []).toString("utf8"),
  );
  if (response.FunctionError || payload.statusCode !== 200) {
    throw new Error(
      JSON.stringify({ functionError: response.FunctionError, payload }),
    );
  }
  return payload.statusCode;
}

try {
  const now = Math.floor(Date.now() / 1_000);
  const first = await invoke(now + 60);
  const second = await invoke(now + 900);
  console.log(JSON.stringify({ first, second, renewalVerified: true }));
} finally {
  await documentClient.send(
    new DeleteCommand({
      TableName: tableName,
      Key: key,
    }),
  );
  lambda.destroy();
  documentClient.destroy();
}
