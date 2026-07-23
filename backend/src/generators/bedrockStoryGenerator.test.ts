import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { afterEach, describe, expect, it, vi } from "vitest";
import fixture from "../../../contracts/story-generation.example.json";
import type { AppConfig } from "../config";
import {
  ContentBlockedError,
  GenerationFailedError,
  GenerationTimeoutError,
} from "../domain/errors";
import { BedrockStoryGenerator } from "./bedrockStoryGenerator";

const config: AppConfig = {
  tableName: "test",
  region: "us-east-1",
  generatorMode: "bedrock",
  modelId: "us.amazon.nova-2-lite-v1:0",
  guardrailId: "guardrail-test",
  guardrailVersion: "DRAFT",
  allowedOrigin: "http://localhost:5173",
  promptVersion: "story-v1",
};

const input = {
  age: 8,
  theme: "Espacio",
  difficulty: "media" as const,
  educationalObjective: "Valorar el trabajo en equipo",
  maxWords: 300 as const,
  mainCharacter: "Luna",
};

function bedrockText(text: string) {
  return {
    stopReason: "end_turn" as const,
    output: { message: { role: "assistant" as const, content: [{ text }] } },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("BedrockStoryGenerator", () => {
  it("accepts a valid JSON response", async () => {
    const send = vi
      .spyOn(BedrockRuntimeClient.prototype, "send")
      .mockResolvedValue(bedrockText(JSON.stringify(fixture)) as never);

    const story = await new BedrockStoryGenerator(config).generate(input);

    expect(story.questions).toHaveLength(5);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("repairs invalid JSON at most once", async () => {
    const send = vi
      .spyOn(BedrockRuntimeClient.prototype, "send")
      .mockResolvedValueOnce(bedrockText("esto no es JSON") as never)
      .mockResolvedValueOnce(bedrockText(JSON.stringify(fixture)) as never);

    await expect(
      new BedrockStoryGenerator(config).generate(input),
    ).resolves.toMatchObject({ title: fixture.title });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("fails after one unsuccessful repair", async () => {
    const send = vi
      .spyOn(BedrockRuntimeClient.prototype, "send")
      .mockResolvedValue(bedrockText("JSON inválido") as never);

    await expect(
      new BedrockStoryGenerator(config).generate(input),
    ).rejects.toBeInstanceOf(GenerationFailedError);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("returns a safe error when Guardrails blocks content", async () => {
    const send = vi
      .spyOn(BedrockRuntimeClient.prototype, "send")
      .mockResolvedValue({ stopReason: "guardrail_intervened" } as never);

    await expect(
      new BedrockStoryGenerator(config).generate(input),
    ).rejects.toBeInstanceOf(ContentBlockedError);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("does not retry a timed out invocation", async () => {
    const send = vi
      .spyOn(BedrockRuntimeClient.prototype, "send")
      .mockRejectedValue(new DOMException("timeout", "TimeoutError"));

    await expect(
      new BedrockStoryGenerator(config).generate(input),
    ).rejects.toBeInstanceOf(GenerationTimeoutError);
    expect(send).toHaveBeenCalledTimes(1);
  });
});
