import { createHmac } from "node:crypto";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { describe, expect, it, vi } from "vitest";
import type { AppConfig } from "../config";
import { SessionIpGuard } from "./sessionIpGuard";

function config(
  sessionIpPolicy: AppConfig["sessionIpPolicy"],
): AppConfig {
  return {
    tableName: "StoryTeacherTest",
    region: "us-east-2",
    generatorMode: "fixture",
    authMode: "cognito",
    sessionIpPolicy,
    modelId: "fixture:test",
    allowedOrigin: "http://localhost:5173",
    promptVersion: "story-v1",
    maxGenerationsPerDay: 20,
  };
}

function clientWith(
  implementation: (...args: unknown[]) => unknown,
): {
  client: DynamoDBDocumentClient;
  send: ReturnType<typeof vi.fn>;
} {
  const send = vi.fn(implementation);
  return {
    client: { send } as unknown as DynamoDBDocumentClient,
    send,
  };
}

const identity = {
  userId: "user-123",
  sessionId: "origin-jti-123",
  expiresAtEpochSeconds: Math.floor(Date.now() / 1_000) + 900,
};

function fingerprint(value: string): string {
  return createHmac("sha256", identity.sessionId).update(value).digest("hex");
}

describe("SessionIpGuard", () => {
  it("does not persist network context when the policy is off", async () => {
    const { client, send } = clientWith(() => undefined);
    await new SessionIpGuard(client, config("off")).assertContext(identity, {
      sourceIp: "203.0.113.4",
      userAgent: "test",
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("stores only hashed context for a new Cognito session", async () => {
    const { client, send } = clientWith(() => Promise.resolve({}));
    await new SessionIpGuard(client, config("observe")).assertContext(identity, {
      sourceIp: "203.0.113.4",
      userAgent: "test",
    });

    const command = send.mock.calls[0]?.[0] as {
      input: { Item: Record<string, unknown> };
    };
    expect(command.input.Item).toMatchObject({
      entityType: "SESSION_CONTEXT",
      userId: identity.userId,
      mismatchCount: 0,
    });
    expect(command.input.Item).not.toHaveProperty("sourceIp");
    expect(command.input.Item.ipHash).toMatch(/^[a-f0-9]{64}$/u);
  });

  it("rejects an IP change when strict binding is enabled", async () => {
    const { client } = clientWith((command: unknown) => {
      const name = (command as { constructor: { name: string } }).constructor
        .name;
      if (name === "PutCommand") {
        return Promise.reject({ name: "ConditionalCheckFailedException" });
      }
      return Promise.resolve({
        Item: {
          ipHash: "0".repeat(64),
          userAgentHash: "0".repeat(64),
        },
      });
    });

    await expect(
      new SessionIpGuard(client, config("strict")).assertContext(identity, {
        sourceIp: "198.51.100.8",
        userAgent: "test",
      }),
    ).rejects.toMatchObject({
      code: "SESSION_CONTEXT_CHANGED",
      statusCode: 401,
    });
  });

  it("escapes the reserved ttl attribute when extending a session", async () => {
    const sourceIp = "203.0.113.4";
    const userAgent = "test";
    const { client, send } = clientWith((command: unknown) => {
      const name = (command as { constructor: { name: string } }).constructor
        .name;
      if (name === "PutCommand") {
        return Promise.reject({ name: "ConditionalCheckFailedException" });
      }
      if (name === "GetCommand") {
        return Promise.resolve({
          Item: {
            ipHash: fingerprint(sourceIp),
            userAgentHash: fingerprint(userAgent),
            ttl: identity.expiresAtEpochSeconds - 60,
          },
        });
      }
      return Promise.resolve({});
    });

    await new SessionIpGuard(client, config("observe")).assertContext(identity, {
      sourceIp,
      userAgent,
    });

    const command = send.mock.calls[2]?.[0] as {
      input: {
        UpdateExpression: string;
        ExpressionAttributeNames: Record<string, string>;
      };
    };
    expect(command.input.UpdateExpression).toContain("#ttl = :ttl");
    expect(command.input.UpdateExpression).not.toMatch(/(?:^|[\s,])ttl\s*=/u);
    expect(command.input.ExpressionAttributeNames).toEqual({ "#ttl": "ttl" });
  });

  it("escapes the reserved ttl attribute when observing a context change", async () => {
    const { client, send } = clientWith((command: unknown) => {
      const name = (command as { constructor: { name: string } }).constructor
        .name;
      if (name === "PutCommand") {
        return Promise.reject({ name: "ConditionalCheckFailedException" });
      }
      if (name === "GetCommand") {
        return Promise.resolve({
          Item: {
            ipHash: "0".repeat(64),
            userAgentHash: "0".repeat(64),
            ttl: identity.expiresAtEpochSeconds - 60,
          },
        });
      }
      return Promise.resolve({});
    });

    await new SessionIpGuard(client, config("observe")).assertContext(identity, {
      sourceIp: "198.51.100.8",
      userAgent: "changed-agent",
    });

    const command = send.mock.calls[2]?.[0] as {
      input: {
        UpdateExpression: string;
        ExpressionAttributeNames: Record<string, string>;
      };
    };
    expect(command.input.UpdateExpression).toContain("#ttl = :ttl");
    expect(command.input.UpdateExpression).not.toMatch(/(?:^|[\s,])ttl\s*=/u);
    expect(command.input.ExpressionAttributeNames).toEqual({ "#ttl": "ttl" });
  });
});
