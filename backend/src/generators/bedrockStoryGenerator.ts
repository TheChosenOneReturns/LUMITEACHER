import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ConverseCommandInput,
} from "@aws-sdk/client-bedrock-runtime";
import {
  GeneratedStoryValidationError,
  countWords,
  generatedQuestionSchema,
  parseGeneratedInteractiveStory,
  parseGeneratedStory,
  skillValues,
  worldIdSchema,
  type GeneratedInteractiveStory,
  type GeneratedStory,
  type GenerateStoryInput,
} from "@story-teacher/shared";
import { toJSONSchema, z } from "zod";
import type { AppConfig } from "../config";
import {
  ContentBlockedError,
  GenerationFailedError,
  GenerationTimeoutError,
} from "../domain/errors";
import type { StoryGenerator } from "../domain/models";
import {
  buildFlatInteractiveStoryPrompt,
  buildRepairPrompt,
  buildStoryPrompt,
} from "./prompt";

const CLASSIC_MAX_TOKENS = 2_500;
const INTERACTIVE_MAX_TOKENS = 8_000;
// La generación clásica corre en el worker asíncrono (300s de Lambda): el
// intento inicial más una reparación deben caber dentro de ese límite.
// 2.500 tokens de salida en Sonnet 4.5 suelen demorar entre 30 y 60 segundos.
const CLASSIC_TIMEOUT_MS = 120_000;
const INTERACTIVE_TIMEOUT_MS = 270_000;
const INTERACTIVE_TOOL_NAME = "submit_interactive_story";
const flatPageSchema = z
  .object({
    text: z.string().trim().min(80).max(1_500),
    sensoryCue: z.string().trim().min(1).max(220),
  })
  .strict();
const flatSceneSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    pageOne: flatPageSchema,
    pageTwo: flatPageSchema,
  })
  .strict();
const flatChoiceSchema = z
  .object({
    label: z.string().trim().min(1).max(140),
    consequence: z.string().trim().min(1).max(220),
  })
  .strict();
const flatQuestionSchema = z
  .object({
    statement: z.string().trim().min(1).max(300),
    optionA: z.string().trim().min(1).max(220),
    optionB: z.string().trim().min(1).max(220),
    optionC: z.string().trim().min(1).max(220),
    optionD: z.string().trim().min(1).max(220),
    correctOption: z.enum(["A", "B", "C", "D"]),
    explanation: z.string().trim().min(1).max(400),
  })
  .strict();
const flatInteractiveStorySchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    scenes: z.array(flatSceneSchema).length(7),
    choices: z.array(flatChoiceSchema).length(6),
    finalQuestions: z.array(flatQuestionSchema).length(5),
  })
  .strict();
type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };
const INTERACTIVE_TOOL_SCHEMA = strictCompatibleSchema(
  toJSONSchema(flatInteractiveStorySchema) as JsonValue,
) as { [key: string]: JsonValue };

export class BedrockStoryGenerator implements StoryGenerator {
  readonly modelId: string;
  private readonly client: BedrockRuntimeClient;

  constructor(private readonly config: AppConfig) {
    this.modelId = config.modelId;
    this.client = new BedrockRuntimeClient({ region: config.region });
  }

  async generate(input: GenerateStoryInput): Promise<GeneratedStory> {
    return this.withRepair(
      () => buildStoryPrompt(input),
      (issues) => buildRepairPrompt(input, issues),
      (text) => parseGeneratedStory(JSON.parse(stripMarkdownFence(text)), input.maxWords),
      CLASSIC_MAX_TOKENS,
    );
  }

  async generateInteractive(
    input: GenerateStoryInput,
  ): Promise<GeneratedInteractiveStory> {
    try {
      try {
        return await this.invokeInteractive(
          input,
          buildFlatInteractiveStoryPrompt(input),
        );
      } catch (error) {
        if (!(error instanceof GeneratedStoryValidationError)) throw error;
        console.warn(
          JSON.stringify({
            level: "WARN",
            event: "generation.structured_repair",
            modelId: this.modelId,
            issues: error.issues.slice(0, 10),
          }),
        );
        return await this.invokeInteractive(
          input,
          `${buildFlatInteractiveStoryPrompt(input)}

CORRECCIÓN OBLIGATORIA
La respuesta anterior fue rechazada:
${error.issues.map((issue) => `- ${issue}`).join("\n")}
Volvé a entregar el objeto completo, respetando exactamente las cantidades y el orden pedidos.`,
        );
      }
    } catch (error) {
      if (
        error instanceof ContentBlockedError ||
        error instanceof GenerationTimeoutError
      ) {
        throw error;
      }
      if (error instanceof GeneratedStoryValidationError) {
        console.error(
          JSON.stringify({
            level: "ERROR",
            event: "generation.validation_failed",
            modelId: this.modelId,
            issues: error.issues.slice(0, 10),
          }),
        );
      }
      throw new GenerationFailedError(error);
    }
  }

  private async invokeInteractive(
    input: GenerateStoryInput,
    prompt: string,
  ): Promise<GeneratedInteractiveStory> {
    const request: ConverseCommandInput = {
      modelId: this.modelId,
      messages: [
        {
          role: "user",
          content: [{ text: prompt }],
        },
      ],
      inferenceConfig: {
        maxTokens: INTERACTIVE_MAX_TOKENS,
        temperature: 0.3,
      },
      toolConfig: {
        tools: [
          {
            toolSpec: {
              name: INTERACTIVE_TOOL_NAME,
              description:
                "Entrega la aventura interactiva completa y lista para validar.",
              inputSchema: { json: INTERACTIVE_TOOL_SCHEMA },
              ...(this.supportsStrictToolUse() ? { strict: true } : {}),
            },
          },
        ],
        toolChoice: { tool: { name: INTERACTIVE_TOOL_NAME } },
      },
      ...this.guardrailConfig(),
    };

    const response = await this.send(request, INTERACTIVE_TIMEOUT_MS);
    this.assertNotBlocked(response.stopReason);

    const toolUse = response.output?.message?.content?.find(
      (block) => "toolUse" in block,
    )?.toolUse;
    if (
      !toolUse ||
      toolUse.name !== INTERACTIVE_TOOL_NAME ||
      toolUse.input === undefined
    ) {
      throw new GeneratedStoryValidationError([
        "response: Bedrock no devolvió la aventura estructurada.",
      ]);
    }

    return parseFlatInteractiveStory(toolUse.input, input);
  }

  private async withRepair<T>(
    buildPrompt: () => string,
    buildRepair: (issues: string[]) => string,
    parse: (text: string) => T,
    maxTokens: number,
  ): Promise<T> {
    try {
      return await this.invoke(parse, buildPrompt(), maxTokens, 0.2);
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
        return await this.invoke(parse, buildRepair(issues), maxTokens, 0);
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

  private async invoke<T>(
    parse: (text: string) => T,
    prompt: string,
    maxTokens: number,
    temperature: number,
  ): Promise<T> {
    const request: ConverseCommandInput = {
      modelId: this.modelId,
      messages: [{ role: "user", content: [{ text: prompt }] }],
      inferenceConfig: {
        maxTokens,
        temperature,
      },
      ...this.guardrailConfig(),
    };

    const response = await this.send(request, CLASSIC_TIMEOUT_MS);
    this.assertNotBlocked(response.stopReason);

    const text = response.output?.message?.content
      ?.map((block) => ("text" in block ? block.text : ""))
      .join("")
      .trim();
    if (!text) {
      throw new GeneratedStoryValidationError([
        "response: Bedrock no devolvió texto.",
      ]);
    }

    try {
      return parse(text);
    } catch (error) {
      if (error instanceof GeneratedStoryValidationError) {
        throw error;
      }
      throw new GeneratedStoryValidationError([
        `response: JSON inválido (${error instanceof Error ? error.message : "error desconocido"}).`,
      ]);
    }
  }

  private guardrailConfig(): Pick<ConverseCommandInput, "guardrailConfig"> {
    return this.config.guardrailId && this.config.guardrailVersion
      ? {
          guardrailConfig: {
            guardrailIdentifier: this.config.guardrailId,
            guardrailVersion: this.config.guardrailVersion,
            trace: "enabled",
          },
        }
      : {};
  }

  private async send(request: ConverseCommandInput, timeoutMs: number) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await this.client.send(new ConverseCommand(request), {
        abortSignal: controller.signal,
      });
    } catch (error) {
      if (
        controller.signal.aborted ||
        (error instanceof DOMException && error.name === "TimeoutError") ||
        (error instanceof Error && error.name === "AbortError")
      ) {
        throw new GenerationTimeoutError(error);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private assertNotBlocked(stopReason: string | undefined): void {
    if (stopReason === "guardrail_intervened") {
      throw new ContentBlockedError();
    }
  }

  private supportsStrictToolUse(): boolean {
    return (
      this.modelId.includes("claude-haiku-4-5") ||
      this.modelId.includes("claude-sonnet-4-5")
    );
  }
}

function stripMarkdownFence(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/iu, "")
    .replace(/\s*```$/u, "")
    .trim();
}

function parseFlatInteractiveStory(
  value: unknown,
  input: GenerateStoryInput,
): GeneratedInteractiveStory {
  const parsed = flatInteractiveStorySchema.safeParse(value);
  if (!parsed.success) {
    throw new GeneratedStoryValidationError(
      parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "response"}: ${issue.message}`,
      ),
    );
  }

  validateFlatStoryQuality(parsed.data, input);
  const scene = parsed.data.scenes.map((item) => ({
    ...item,
    title: cleanNarrativeTitle(item.title),
    pages: [item.pageOne, item.pageTwo],
  }));
  const choice = parsed.data.choices;
  const rawQuestions = parsed.data.finalQuestions;
  const questions = [
    questionFromFlat(rawQuestions[0]!, "literal"),
    questionFromFlat(rawQuestions[1]!, "inference"),
    questionFromFlat(rawQuestions[2]!, "vocabulary"),
    questionFromFlat(rawQuestions[3]!, "sequence"),
    questionFromFlat(rawQuestions[4]!, "cause_effect"),
  ];
  const generated = {
    title: cleanNarrativeTitle(parsed.data.title),
    language: input.language === "en" ? ("en" as const) : ("es" as const),
    worldId: worldIdFromTheme(input.theme),
    opening: {
      id: "opening" as const,
      title: scene[0]!.title,
      pages: withPageIds("opening", scene[0]!.pages),
      checkpoint: checkpointFromQuestion(
        "checkpoint-opening",
        questions[0]!,
        "literal",
      ),
      choices: [
        withChoiceId("choice-opening-1", choice[0]!, "route-1"),
        withChoiceId("choice-opening-2", choice[1]!, "route-2"),
      ],
    },
    routes: [
      {
        id: "route-1",
        title: scene[1]!.title,
        pages: withPageIds("route-1", scene[1]!.pages),
        checkpoint: checkpointFromQuestion(
          "checkpoint-route-1",
          questions[1]!,
          "inference",
        ),
        choices: [
          withChoiceId("choice-route-1-1", choice[2]!, "ending-1-1"),
          withChoiceId("choice-route-1-2", choice[3]!, "ending-1-2"),
        ],
        endings: [
          {
            id: "ending-1-1",
            title: scene[2]!.title,
            pages: withPageIds("ending-1-1", scene[2]!.pages),
          },
          {
            id: "ending-1-2",
            title: scene[3]!.title,
            pages: withPageIds("ending-1-2", scene[3]!.pages),
          },
        ],
      },
      {
        id: "route-2",
        title: scene[4]!.title,
        pages: withPageIds("route-2", scene[4]!.pages),
        checkpoint: checkpointFromQuestion(
          "checkpoint-route-2",
          questions[4]!,
          "cause_effect",
        ),
        choices: [
          withChoiceId("choice-route-2-1", choice[4]!, "ending-2-1"),
          withChoiceId("choice-route-2-2", choice[5]!, "ending-2-2"),
        ],
        endings: [
          {
            id: "ending-2-1",
            title: scene[5]!.title,
            pages: withPageIds("ending-2-1", scene[5]!.pages),
          },
          {
            id: "ending-2-2",
            title: scene[6]!.title,
            pages: withPageIds("ending-2-2", scene[6]!.pages),
          },
        ],
      },
    ],
    finalQuestions: questions,
  };

  return parseGeneratedInteractiveStory(generated, input.maxWords);
}

function validateFlatStoryQuality(
  story: z.infer<typeof flatInteractiveStorySchema>,
  input: GenerateStoryInput,
): void {
  const maxWordsPerPage = Math.min(
    110,
    Math.max(20, Math.floor(input.maxWords / 6) - 5),
  );
  const minWordsPerPage = Math.min(
    45,
    Math.max(15, Math.floor(maxWordsPerPage * 0.55)),
  );
  const toleratedMaxWordsPerPage = Math.ceil(maxWordsPerPage * 1.25);
  const issues: string[] = [];
  const scenes = story.scenes;
  const titles = scenes.map((scene) =>
    cleanNarrativeTitle(scene.title).toLocaleLowerCase("es"),
  );
  if (new Set(titles).size !== titles.length) {
    issues.push("scenes: los siete títulos deben ser diferentes.");
  }
  if (titles.some((title) => !title || /final alternativo|alternative ending/u.test(title))) {
    issues.push("scenes: los títulos deben ser narrativos y no etiquetas técnicas.");
  }

  const pageTexts = scenes.flatMap((scene) => [
    scene.pageOne.text.trim(),
    scene.pageTwo.text.trim(),
  ]);
  if (
    new Set(pageTexts.map((text) => text.toLocaleLowerCase("es"))).size !==
    pageTexts.length
  ) {
    issues.push("scenes.pages: no se permite repetir páginas.");
  }
  for (const [index, text] of pageTexts.entries()) {
    const words = countWords(text);
    if (words < minWordsPerPage || words > toleratedMaxWordsPerPage) {
      issues.push(
        `scenes.pages.${index}: contiene ${words} palabras; se esperaban entre ${minWordsPerPage} y ${toleratedMaxWordsPerPage}.`,
      );
    }
  }

  if (issues.length > 0) throw new GeneratedStoryValidationError(issues);
}

function cleanNarrativeTitle(title: string): string {
  const withoutFallback = title.split(
    /\s*[·•]\s*(?:final alternativo|alternative ending)\b/iu,
  )[0]!;
  const cleaned = withoutFallback
    .replace(
      /^(?:escena\s*\d+|apertura|ruta\s*[ab12]|final\s*[ab0-9-]+)\s*[:\-–—]\s*/iu,
      "",
    )
    .replace(/[<>]/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
  return cleaned || "Un nuevo capítulo";
}

function questionFromFlat(
  question: z.infer<typeof flatQuestionSchema>,
  skill: (typeof skillValues)[number],
) {
  return generatedQuestionSchema.parse({
    statement: question.statement,
    options: [
      question.optionA,
      question.optionB,
      question.optionC,
      question.optionD,
    ],
    correctAnswer: ["A", "B", "C", "D"].indexOf(question.correctOption),
    skill,
    explanation: question.explanation,
  });
}

function worldIdFromTheme(theme: string): z.infer<typeof worldIdSchema> {
  const normalized = theme
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("en");
  if (/(espacio|space|estrella|star|planeta|planet)/u.test(normalized)) {
    return "space";
  }
  if (/(fantasia|fantasy|magia|magic|dragon|reino)/u.test(normalized)) {
    return "fantasy";
  }
  if (/(oceano|ocean|mar|sea|submar|ballena)/u.test(normalized)) {
    return "ocean";
  }
  if (/(jungla|jungle|selva|bosque|forest)/u.test(normalized)) {
    return "jungle";
  }
  if (/(invento|invention|robot|maquina|machine|tecnolog)/u.test(normalized)) {
    return "inventions";
  }
  return "mystery";
}

function withPageIds(
  sceneId: string,
  pages: z.infer<typeof flatPageSchema>[],
) {
  return pages.map((page, index) => ({
    id: `${sceneId}-page-${index + 1}`,
    ...page,
  }));
}

function withChoiceId(
  id: string,
  choice: z.infer<typeof flatChoiceSchema>,
  nextSceneId: string,
) {
  return { id, ...choice, nextSceneId };
}

function checkpointFromQuestion(
  id: string,
  question: z.infer<typeof generatedQuestionSchema>,
  skill: "literal" | "inference" | "cause_effect",
) {
  return {
    id,
    statement: question.statement,
    options: question.options,
    correctAnswer: question.correctAnswer,
    skill,
    explanation: question.explanation,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function strictCompatibleSchema(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(strictCompatibleSchema);
  if (!isRecord(value)) return value;

  const unsupported = new Set([
    "$schema",
    "minLength",
    "maxLength",
    "pattern",
    "minItems",
    "maxItems",
    "minimum",
    "maximum",
    "multipleOf",
  ]);
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !unsupported.has(key))
      .map(([key, child]) => [key, strictCompatibleSchema(child as JsonValue)]),
  );
}
