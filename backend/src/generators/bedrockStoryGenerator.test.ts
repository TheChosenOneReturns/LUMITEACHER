import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { afterEach, describe, expect, it, vi } from "vitest";
import fixture from "../../../contracts/story-generation.example.json";
import interactiveFixture from "../../../contracts/interactive-story.example.json";
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
  authMode: "demo",
  sessionIpPolicy: "off",
  modelId: "us.anthropic.claude-sonnet-4-5-20250929-v1:0",
  guardrailId: "guardrail-test",
  guardrailVersion: "DRAFT",
  allowedOrigin: "http://localhost:5173",
  promptVersion: "story-v1",
  maxGenerationsPerDay: 20,
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

function bedrockTool(value: unknown) {
  return {
    stopReason: "tool_use" as const,
    output: {
      message: {
        role: "assistant" as const,
        content: [
          {
            toolUse: {
              toolUseId: "tool-use-test",
              name: "submit_interactive_story",
              input: value,
            },
          },
        ],
      },
    },
  };
}

function withoutPageId(page: { text: string; sensoryCue: string }) {
  const words = page.text.trim().split(/\s+/u);
  const expanded = [...words];
  while (expanded.length < 30) {
    expanded.push(...words.slice(0, 30 - expanded.length));
  }
  return { text: expanded.join(" "), sensoryCue: page.sensoryCue };
}

function withoutChoiceIds(choice: { label: string; consequence: string }) {
  return { label: choice.label, consequence: choice.consequence };
}

function flatScene(scene: {
  title: string;
  pages: Array<{ text: string; sensoryCue: string }>;
}) {
  return {
    title: scene.title,
    pageOne: withoutPageId(scene.pages[0]!),
    pageTwo: withoutPageId(scene.pages[1]!),
  };
}

function flatQuestion(question: {
  statement: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}) {
  return {
    statement: question.statement,
    optionA: question.options[0]!,
    optionB: question.options[1]!,
    optionC: question.options[2]!,
    optionD: question.options[3]!,
    correctOption: ["A", "B", "C", "D"][question.correctAnswer]!,
    explanation: question.explanation,
  };
}

const flatInteractiveFixture = {
  title: interactiveFixture.title,
  scenes: [
    flatScene(interactiveFixture.opening),
    flatScene(interactiveFixture.routes[0]!),
    flatScene(interactiveFixture.routes[0]!.endings[0]!),
    flatScene(interactiveFixture.routes[0]!.endings[1]!),
    flatScene(interactiveFixture.routes[1]!),
    flatScene(interactiveFixture.routes[1]!.endings[0]!),
    flatScene(interactiveFixture.routes[1]!.endings[1]!),
  ],
  choices: [
    withoutChoiceIds(interactiveFixture.opening.choices[0]!),
    withoutChoiceIds(interactiveFixture.opening.choices[1]!),
    withoutChoiceIds(interactiveFixture.routes[0]!.choices[0]!),
    withoutChoiceIds(interactiveFixture.routes[0]!.choices[1]!),
    withoutChoiceIds(interactiveFixture.routes[1]!.choices[0]!),
    withoutChoiceIds(interactiveFixture.routes[1]!.choices[1]!),
  ],
  finalQuestions: interactiveFixture.finalQuestions.map(flatQuestion),
};

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

  it("accepts a valid interactive JSON response", async () => {
    const send = vi
      .spyOn(BedrockRuntimeClient.prototype, "send")
      .mockResolvedValue(bedrockTool(flatInteractiveFixture) as never);

    const adventure = await new BedrockStoryGenerator(
      config,
    ).generateInteractive({ ...input, storyMode: "interactive" });

    expect(adventure.routes).toHaveLength(2);
    expect(adventure.finalQuestions).toHaveLength(5);
    expect(send).toHaveBeenCalledTimes(1);
    expect(
      (send.mock.calls[0]?.[0] as ConverseCommand).input.toolConfig,
    ).toMatchObject({
      tools: [{ toolSpec: { strict: true } }],
      toolChoice: { tool: { name: "submit_interactive_story" } },
    });
  });

  it("builds stable IDs and references without a second model call", async () => {
    const generated = structuredClone(flatInteractiveFixture);
    const send = vi
      .spyOn(BedrockRuntimeClient.prototype, "send")
      .mockResolvedValue(bedrockTool(generated) as never);

    const adventure = await new BedrockStoryGenerator(
      config,
    ).generateInteractive({
      ...input,
      storyMode: "interactive",
    });

    expect(adventure.opening.choices[0]?.nextSceneId).toBe(
      "route-1",
    );
    expect(adventure.routes[0]?.choices[0]?.nextSceneId).toBe(
      "ending-1-1",
    );
    expect(adventure.routes[1]?.endings[1]?.id).toBe("ending-2-2");
    expect(adventure.routes[1]?.endings[1]?.pages).toHaveLength(2);
    expect(adventure.finalQuestions[0]?.skill).toBe("literal");
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("fails an invalid structured adventure after one repair", async () => {
    const send = vi
      .spyOn(BedrockRuntimeClient.prototype, "send")
      .mockResolvedValue(bedrockTool({ title: "Incompleta" }) as never);

    await expect(
      new BedrockStoryGenerator(config).generateInteractive({
        ...input,
        storyMode: "interactive",
      }),
    ).rejects.toBeInstanceOf(GenerationFailedError);
    expect(send).toHaveBeenCalledTimes(2);
  });
});
