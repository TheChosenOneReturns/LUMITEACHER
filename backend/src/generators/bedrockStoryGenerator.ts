import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ConverseCommandInput,
} from "@aws-sdk/client-bedrock-runtime";
import {
  GeneratedStoryValidationError,
  parseGeneratedStory,
  type GeneratedStory,
  type GenerateStoryInput,
} from "@story-teacher/shared";
import type { AppConfig } from "../config";
import {
  ContentBlockedError,
  GenerationFailedError,
  GenerationTimeoutError,
} from "../domain/errors";
import type { StoryGenerator } from "../domain/models";
import { buildRepairPrompt, buildStoryPrompt } from "./prompt";

export class BedrockStoryGenerator implements StoryGenerator {
  readonly modelId: string;
  private readonly client: BedrockRuntimeClient;

  constructor(private readonly config: AppConfig) {
    this.modelId = config.modelId;
    this.client = new BedrockRuntimeClient({ region: config.region });
  }

  async generate(input: GenerateStoryInput): Promise<GeneratedStory> {
    try {
      return await this.invokeAndValidate(buildStoryPrompt(input), input, 0.2);
    } catch (error) {
      if (
        error instanceof ContentBlockedError ||
        error instanceof GenerationTimeoutError
      ) {
        throw error;
      }

      const issues =
        error instanceof GeneratedStoryValidationError
          ? error.issues
          : ["La respuesta no era JSON válido."];

      try {
        return await this.invokeAndValidate(
          buildRepairPrompt(input, issues),
          input,
          0,
        );
      } catch (repairError) {
        if (
          repairError instanceof ContentBlockedError ||
          repairError instanceof GenerationTimeoutError
        ) {
          throw repairError;
        }
        throw new GenerationFailedError(repairError);
      }
    }
  }

  private async invokeAndValidate(
    prompt: string,
    input: GenerateStoryInput,
    temperature: number,
  ): Promise<GeneratedStory> {
    const request: ConverseCommandInput = {
      modelId: this.modelId,
      messages: [{ role: "user", content: [{ text: prompt }] }],
      inferenceConfig: {
        maxTokens: 2_500,
        temperature,
      },
      ...(this.config.guardrailId && this.config.guardrailVersion
        ? {
            guardrailConfig: {
              guardrailIdentifier: this.config.guardrailId,
              guardrailVersion: this.config.guardrailVersion,
              trace: "enabled" as const,
            },
          }
        : {}),
    };

    let response;
    try {
      response = await this.client.send(new ConverseCommand(request), {
        abortSignal: AbortSignal.timeout(25_000),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "TimeoutError") {
        throw new GenerationTimeoutError(error);
      }
      throw error;
    }

    if (response.stopReason === "guardrail_intervened") {
      throw new ContentBlockedError();
    }

    const text = response.output?.message?.content
      ?.map((block) => ("text" in block ? block.text : ""))
      .join("")
      .trim();
    if (!text) {
      throw new GeneratedStoryValidationError([
        "response: Bedrock no devolvió texto.",
      ]);
    }

    let json: unknown;
    try {
      json = JSON.parse(stripMarkdownFence(text));
    } catch (error) {
      throw new GeneratedStoryValidationError([
        `response: JSON inválido (${error instanceof Error ? error.message : "error desconocido"}).`,
      ]);
    }

    return parseGeneratedStory(json, input.maxWords);
  }
}

function stripMarkdownFence(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/iu, "")
    .replace(/\s*```$/u, "")
    .trim();
}

