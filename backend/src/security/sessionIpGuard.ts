import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  type DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { AppConfig } from "../config";
import { ApplicationError } from "../domain/errors";
import type { AuthenticatedIdentity } from "../domain/models";

interface StoredSessionContext {
  PK: string;
  SK: "CONTEXT";
  userId: string;
  ipHash: string;
  userAgentHash: string;
  createdAt: string;
  lastSeenAt: string;
  mismatchCount: number;
  ttl: number;
}

export interface RequestSecurityContext {
  sourceIp?: string;
  userAgent?: string;
}

export class SessionIpGuard {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly config: AppConfig,
  ) {}

  async assertContext(
    identity: AuthenticatedIdentity,
    request: RequestSecurityContext,
  ): Promise<void> {
    if (this.config.sessionIpPolicy === "off") return;

    if (!identity.sessionId) {
      throw new ApplicationError(
        "UNAUTHORIZED",
        401,
        "La sesión no contiene un identificador verificable.",
      );
    }
    if (!request.sourceIp) {
      if (this.config.sessionIpPolicy === "strict") {
        throw new ApplicationError(
          "SESSION_CONTEXT_CHANGED",
          401,
          "No pudimos verificar el contexto de red de la sesión.",
        );
      }
      return;
    }

    const now = new Date().toISOString();
    const ttl = Math.max(
      Math.floor(Date.now() / 1_000) + 60,
      identity.expiresAtEpochSeconds ?? Math.floor(Date.now() / 1_000) + 900,
    );
    const sessionKey = createHash("sha256")
      .update(`${identity.userId}:${identity.sessionId}`)
      .digest("hex");
    const ipHash = fingerprint(identity.sessionId, request.sourceIp);
    const userAgentHash = fingerprint(
      identity.sessionId,
      request.userAgent ?? "unknown",
    );
    const key: { PK: string; SK: "CONTEXT" } = {
      PK: `SESSION#${sessionKey}`,
      SK: "CONTEXT",
    };

    try {
      await this.client.send(
        new PutCommand({
          TableName: this.config.tableName,
          Item: {
            ...key,
            entityType: "SESSION_CONTEXT",
            userId: identity.userId,
            ipHash,
            userAgentHash,
            createdAt: now,
            lastSeenAt: now,
            mismatchCount: 0,
            ttl,
          } satisfies StoredSessionContext & { entityType: string },
          ConditionExpression: "attribute_not_exists(PK)",
        }),
      );
      return;
    } catch (error) {
      if (
        !(error instanceof ConditionalCheckFailedException) &&
        (error as { name?: string }).name !== "ConditionalCheckFailedException"
      ) {
        throw error;
      }
    }

    const current = await this.client.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: key,
        ConsistentRead: true,
      }),
    );
    const stored = current.Item as StoredSessionContext | undefined;
    if (!stored) return;

    const ipChanged = !safeEqual(stored.ipHash, ipHash);
    const userAgentChanged = !safeEqual(stored.userAgentHash, userAgentHash);
    if (!ipChanged && !userAgentChanged) {
      if (ttl > stored.ttl) {
        await this.client.send(
          new UpdateCommand({
            TableName: this.config.tableName,
            Key: key,
            UpdateExpression: "SET lastSeenAt = :lastSeenAt, #ttl = :ttl",
            ExpressionAttributeNames: {
              "#ttl": "ttl",
            },
            ExpressionAttributeValues: {
              ":lastSeenAt": now,
              ":ttl": ttl,
            },
          }),
        );
      }
      return;
    }

    console.warn(
      JSON.stringify({
        level: "WARN",
        event: "session.context_changed",
        sessionKey: sessionKey.slice(0, 12),
        ipChanged,
        userAgentChanged,
      }),
    );

    if (ipChanged && this.config.sessionIpPolicy === "strict") {
      throw new ApplicationError(
        "SESSION_CONTEXT_CHANGED",
        401,
        "La red de esta sesión cambió. Volvé a ingresar para continuar.",
      );
    }

    await this.client.send(
      new UpdateCommand({
        TableName: this.config.tableName,
        Key: key,
        UpdateExpression:
          "SET lastSeenAt = :lastSeenAt, ipHash = :ipHash, userAgentHash = :userAgentHash, #ttl = :ttl ADD mismatchCount :one",
        ExpressionAttributeNames: {
          "#ttl": "ttl",
        },
        ExpressionAttributeValues: {
          ":lastSeenAt": now,
          ":ipHash": ipHash,
          ":userAgentHash": userAgentHash,
          ":ttl": ttl,
          ":one": 1,
        },
      }),
    );
  }
}

function fingerprint(sessionId: string, value: string): string {
  return createHmac("sha256", sessionId).update(value).digest("hex");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}
