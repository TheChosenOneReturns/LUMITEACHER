import { describe, expect, it, vi } from "vitest";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { AppConfig } from "../config.js";
import { emptyRewardState } from "./rewards.js";
import { PlatformService } from "./platformService.js";

const config: AppConfig = {
  tableName: "StoryTeacherTest",
  region: "us-east-1",
  generatorMode: "fixture",
  authMode: "demo",
  sessionIpPolicy: "off",
  modelId: "fixture",
  allowedOrigin: "http://localhost:5173",
  promptVersion: "story-v1",
  maxGenerationsPerDay: 20,
};

const student = {
  userId: "demo-luna",
  role: "student" as const,
  displayName: "Luna",
  age: 10,
  avatarId: "animal-chameleon",
  favoriteTheme: "Misterio",
};

function serviceWith(send: ReturnType<typeof vi.fn>) {
  return new PlatformService({ send } as unknown as DynamoDBDocumentClient, config);
}

describe("PlatformService.consumeCard", () => {
  it("rechaza una carta incompatible antes de tocar el inventario", async () => {
    const send = vi.fn(async () => ({ Item: student }));
    await expect(serviceWith(send).consumeCard("demo-luna", "card-space-2", "clue-detective", "session-0001"))
      .rejects.toMatchObject({ code: "VALIDATION_ERROR", statusCode: 400 });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("rechaza una carta sin cargas", async () => {
    const state = emptyRewardState();
    const send = vi.fn(async (command: { input?: { Key?: { SK?: string } } }) => (
      command.input?.Key?.SK === "PROFILE" ? { Item: student } : { Item: state }
    ));
    await expect(serviceWith(send).consumeCard("demo-luna", "card-space", "clue-detective", "session-0002"))
      .rejects.toMatchObject({ code: "FORBIDDEN", statusCode: 403 });
  });

  it("descuenta con una transacción atómica y registra la sesión", async () => {
    let quantity = 2;
    let transactionInput: unknown;
    const send = vi.fn(async (command: { constructor: { name: string }; input?: { Key?: { SK?: string }; TransactItems?: unknown } }) => {
      if (command.input?.Key?.SK === "PROFILE") return { Item: student };
      if (command.constructor.name === "TransactWriteCommand") {
        transactionInput = command.input?.TransactItems;
        quantity -= 1;
        return {};
      }
      return { Item: { ...emptyRewardState(), unlockedCardIds: ["card-space"], cardInventory: { "card-space": quantity } } };
    });

    const next = await serviceWith(send).consumeCard("demo-luna", "card-space", "clue-detective", "session-0003");
    expect(next.cardInventory["card-space"]).toBe(1);
    expect(transactionInput).toMatchObject([
      { Put: { Item: { SK: "CARD_USE#session-0003", cardId: "card-space" }, ConditionExpression: "attribute_not_exists(PK)" } },
      { Update: { ConditionExpression: expect.stringContaining("cardInventory") } },
    ]);
  });

  it("repetir la misma sesión es idempotente y no vuelve a descontar", async () => {
    const cancelled = Object.assign(new Error("cancelled"), { name: "TransactionCanceledException" });
    const send = vi.fn(async (command: { constructor: { name: string }; input?: { Key?: { SK?: string } } }) => {
      if (command.input?.Key?.SK === "PROFILE") return { Item: student };
      if (command.constructor.name === "TransactWriteCommand") throw cancelled;
      if (command.input?.Key?.SK === "CARD_USE#session-0004") return { Item: { cardId: "card-space", gameId: "clue-detective" } };
      return { Item: { ...emptyRewardState(), unlockedCardIds: ["card-space"], cardInventory: { "card-space": 1 } } };
    });

    const result = await serviceWith(send).consumeCard("demo-luna", "card-space", "clue-detective", "session-0004");
    expect(result.cardInventory["card-space"]).toBe(1);
    expect(send.mock.calls.filter(([command]) => command.constructor.name === "TransactWriteCommand")).toHaveLength(1);
  });
});
