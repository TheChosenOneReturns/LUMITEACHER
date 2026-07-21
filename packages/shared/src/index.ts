import { z } from "zod";

export const difficultyValues = ["facil", "media", "desafio"] as const;
export const skillValues = [
  "literal",
  "inference",
  "vocabulary",
  "sequence",
  "cause_effect",
] as const;

export const difficultySchema = z.enum(difficultyValues);
export const skillSchema = z.enum(skillValues);

export const storyInputSchema = z
  .object({
    age: z.number().int().min(6).max(12),
    theme: z.string().trim().min(2).max(60),
    difficulty: difficultySchema,
    educationalObjective: z.string().trim().min(5).max(160),
    maxWords: z.union([z.literal(150), z.literal(300), z.literal(500)]),
    mainCharacter: z.string().trim().max(60).nullable().optional(),
  })
  .strict();

const generatedQuestionBaseSchema = z
  .object({
    statement: z.string().trim().min(1).max(300),
    options: z.array(z.string().trim().min(1).max(220)).length(4),
    correctAnswer: z.number().int().min(0).max(3),
    skill: skillSchema,
    explanation: z.string().trim().min(1).max(400),
  })
  .strict();

export const generatedQuestionSchema = generatedQuestionBaseSchema
  .superRefine((question, context) => {
    const normalized = question.options.map((option) =>
      option.trim().toLocaleLowerCase("es"),
    );
    if (new Set(normalized).size !== normalized.length) {
      context.addIssue({
        code: "custom",
        path: ["options"],
        message: "Las cuatro opciones deben ser diferentes.",
      });
    }
  });

export const generatedStorySchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    story: z.string().trim().min(1),
    questions: z.array(generatedQuestionSchema).length(5),
  })
  .strict()
  .superRefine((story, context) => {
    const actualSkills = story.questions.map((question) => question.skill);
    if (actualSkills.some((skill, index) => skill !== skillValues[index])) {
      context.addIssue({
        code: "custom",
        path: ["questions"],
        message:
          "Las habilidades deben aparecer una vez y en el orden canónico.",
      });
    }

    const statements = story.questions.map((question) =>
      question.statement.trim().toLocaleLowerCase("es"),
    );
    if (new Set(statements).size !== statements.length) {
      context.addIssue({
        code: "custom",
        path: ["questions"],
        message: "Las preguntas no deben repetirse.",
      });
    }
  });

export const publicQuestionSchema = generatedQuestionBaseSchema.omit({
  correctAnswer: true,
  explanation: true,
}).extend({
  questionId: z.string().min(1),
});

export const storyPublicSchema = z
  .object({
    storyId: z.string().min(10).max(64),
    createdAt: z.string().datetime(),
    input: storyInputSchema,
    title: z.string().min(1),
    story: z.string().min(1),
    questions: z.array(publicQuestionSchema).length(5),
  })
  .strict();

export const storySummarySchema = z
  .object({
    storyId: z.string(),
    createdAt: z.string().datetime(),
    title: z.string(),
    theme: z.string(),
    age: z.number().int(),
  })
  .strict();

export const submitAttemptSchema = z
  .object({
    attemptId: z.string().min(10).max(64),
    answers: z.array(z.number().int().min(0).max(3)).length(5),
  })
  .strict();

export const questionResultSchema = z
  .object({
    questionId: z.string(),
    selectedAnswer: z.number().int().min(0).max(3),
    correctAnswer: z.number().int().min(0).max(3),
    isCorrect: z.boolean(),
    skill: skillSchema,
    explanation: z.string(),
  })
  .strict();

export const attemptResultSchema = z
  .object({
    attemptId: z.string(),
    storyId: z.string(),
    createdAt: z.string().datetime(),
    correctCount: z.number().int().min(0).max(5),
    scorePercent: z.union([
      z.literal(0),
      z.literal(20),
      z.literal(40),
      z.literal(60),
      z.literal(80),
      z.literal(100),
    ]),
    results: z.array(questionResultSchema).length(5),
  })
  .strict();

export type Difficulty = z.infer<typeof difficultySchema>;
export type Skill = z.infer<typeof skillSchema>;
export type GenerateStoryInput = z.infer<typeof storyInputSchema>;
export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
export type GeneratedStory = z.infer<typeof generatedStorySchema>;
export type PublicQuestion = z.infer<typeof publicQuestionSchema>;
export type StoryPublic = z.infer<typeof storyPublicSchema>;
export type StorySummary = z.infer<typeof storySummarySchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
export type QuestionResult = z.infer<typeof questionResultSchema>;
export type AttemptResult = z.infer<typeof attemptResultSchema>;

export const errorCodes = [
  "VALIDATION_ERROR",
  "CONTENT_BLOCKED",
  "STORY_NOT_FOUND",
  "ATTEMPT_ALREADY_EXISTS",
  "GENERATION_TIMEOUT",
  "GENERATION_FAILED",
  "INTERNAL_ERROR",
] as const;

export type ErrorCode = (typeof errorCodes)[number];

export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    requestId: string;
  };
}

export class GeneratedStoryValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(issues.join(" "));
    this.name = "GeneratedStoryValidationError";
    this.issues = issues;
  }
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}

export function parseGeneratedStory(
  value: unknown,
  maxWords: number,
): GeneratedStory {
  const parsed = generatedStorySchema.safeParse(value);
  if (!parsed.success) {
    throw new GeneratedStoryValidationError(
      parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "response"}: ${issue.message}`,
      ),
    );
  }

  const wordCount = countWords(parsed.data.story);
  if (wordCount > maxWords) {
    throw new GeneratedStoryValidationError([
      `story: contiene ${wordCount} palabras y el máximo es ${maxWords}.`,
    ]);
  }

  return parsed.data;
}

export const skillLabels: Record<Skill, string> = {
  literal: "Comprensión literal",
  inference: "Inferencias",
  vocabulary: "Vocabulario",
  sequence: "Secuencia",
  cause_effect: "Causa y consecuencia",
};
