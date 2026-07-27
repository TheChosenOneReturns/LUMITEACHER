import { z } from "zod";

export const difficultyValues = ["facil", "media", "desafio"] as const;
export const skillValues = [
  "literal",
  "inference",
  "vocabulary",
  "sequence",
  "cause_effect",
] as const;
export const worldValues = ["space", "fantasy", "ocean", "jungle", "inventions", "mystery"] as const;
export const gameValues = [
  "clue-detective",
  "memory",
  "sequence",
  "decision-maze",
  "emotion-theater",
  "word-forge",
  "evidence-board",
  "cause-machine",
  "perspective-prism",
  "story-map",
] as const;
export const cardPowerValues = [
  "nebula-spotlight",
  "orbit-preview",
  "gravity-first",
  "comet-shortcut",
  "oracle-question",
  "mirror-match",
  "destiny-link",
  "tower-unlock",
  "emotion-echo",
  "sonar-route",
  "current-cause",
  "coral-beacon",
  "leaf-emotion",
  "vine-bridge",
  "jaguar-forecast",
  "seed-recall",
  "gear-zoom",
  "idea-snap",
  "blueprint-ghost",
  "rewind-move",
  "invisible-evidence",
  "twin-perspective",
  "time-boundary",
  "lumi-adapt",
] as const;

export const difficultySchema = z.enum(difficultyValues);
export const storyModeSchema = z.enum(["classic", "interactive"]);
export const storyLanguageSchema = z.enum(["es", "en"]);
export const skillSchema = z.enum(skillValues);
export const worldIdSchema = z.enum(worldValues);
export const gameIdSchema = z.enum(gameValues);
export const cardPowerSchema = z.enum(cardPowerValues);

export const storyInputSchema = z
  .object({
    age: z.number().int().min(6).max(12),
    theme: z.string().trim().min(2).max(60),
    difficulty: difficultySchema,
    educationalObjective: z.string().trim().min(5).max(160),
    maxWords: z.union([z.literal(150), z.literal(300), z.literal(500), z.literal(800), z.literal(1200)]),
    mainCharacter: z.string().trim().max(60).nullable().optional(),
    storyMode: storyModeSchema.optional(),
    language: storyLanguageSchema.optional(),
  })
  .strict();

export const createStoryRequestSchema = storyInputSchema.extend({
  courseId: z.string().min(10).max(64).nullable().optional(),
});

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

// --- Aventuras interactivas (story-interactive v2): base y formato público ---

const sceneIdSchema = z.string().regex(/^[a-z0-9-]+$/u);

export const interactivePageSchema = z
  .object({
    id: sceneIdSchema,
    text: z.string().trim().min(80).max(1500),
    sensoryCue: z.string().trim().min(1).max(220),
  })
  .strict();

export const interactiveChoiceSchema = z
  .object({
    id: sceneIdSchema,
    label: z.string().trim().min(1).max(140),
    consequence: z.string().trim().min(1).max(220),
    nextSceneId: sceneIdSchema,
  })
  .strict();

export const interactiveCheckpointSchema = z
  .object({
    id: sceneIdSchema,
    statement: z.string().trim().min(1).max(300),
    options: z.array(z.string().trim().min(1).max(220)).length(4),
    correctAnswer: z.number().int().min(0).max(3),
    skill: z.enum(["literal", "inference", "cause_effect"]),
    explanation: z.string().trim().min(1).max(400),
  })
  .strict();

export const interactiveScenePublicSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    pages: z.array(interactivePageSchema).min(1),
    checkpoint: interactiveCheckpointSchema.nullable(),
    choices: z.array(interactiveChoiceSchema),
    ending: z.boolean(),
  })
  .strict();

export const interactiveAdventurePublicSchema = z
  .object({
    title: z.string().min(1),
    language: storyLanguageSchema,
    worldId: worldIdSchema,
    scenes: z.array(interactiveScenePublicSchema).min(7),
  })
  .strict();

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
    adventure: interactiveAdventurePublicSchema.nullable().optional(),
    courseId: z.string().nullable().optional(),
    missionId: z.string().nullable().optional(),
    source: z.enum(["free", "mission"]).optional(),
  })
  .strict();

export const generationIdSchema = z
  .string()
  .regex(/^[a-f0-9]{32}$/u, "El identificador de generación no es válido.");

const generationBaseSchema = z
  .object({
    generationId: generationIdSchema,
  })
  .strict();

export const generationStatusSchema = z.discriminatedUnion("status", [
  generationBaseSchema.extend({
    status: z.literal("pending"),
  }),
  generationBaseSchema.extend({
    status: z.literal("completed"),
    story: storyPublicSchema,
  }),
  generationBaseSchema.extend({
    status: z.literal("failed"),
    error: z
      .object({
        code: z.string().min(1),
        message: z.string().min(1),
      })
      .strict(),
  }),
]);

export const storySummarySchema = z
  .object({
    storyId: z.string(),
    createdAt: z.string().datetime(),
    title: z.string(),
    theme: z.string(),
    age: z.number().int(),
    courseId: z.string().nullable().optional(),
    source: z.enum(["free", "mission"]).optional(),
  })
  .strict();

export const submitAttemptSchema = z
  .object({
    attemptId: z.string().min(10).max(64),
    answers: z.array(z.number().int().min(0).max(3)).length(5),
    checkpointStars: z.number().int().min(0).max(4).optional(),
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
    statement: z.string().optional(),
    selectedOption: z.string().optional(),
    correctOption: z.string().optional(),
  })
  .strict();

export const rewardGrantSchema = z
  .object({
    starsEarned: z.number().int().min(0).max(14),
    mapAdvanced: z.boolean(),
    newlyUnlockedBadgeIds: z.array(z.string()),
    newlyUnlockedCardIds: z.array(z.string()),
    newlyUnlockedAccessoryIds: z.array(z.string()),
    newlyUnlockedAvatarIds: z.array(z.string()),
    cardCopiesGranted: z.array(z.object({ cardId: z.string(), quantity: z.number().int().min(1) }).strict()),
    worldId: worldIdSchema.nullable(),
    worldStep: z.number().int().min(1).max(4).nullable(),
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
    rewardGrant: rewardGrantSchema.nullable().optional(),
  })
  .strict();

export const userRoleSchema = z.enum(["student", "adult"]);
export const adultLabelSchema = z.enum(["Profesor/a", "Familia"]);

export const userProfileSchema = z
  .object({
    userId: z.string().min(3).max(64),
    role: userRoleSchema,
    displayName: z.string().min(2).max(40),
    age: z.number().int().min(6).max(12).nullable().optional(),
    avatarId: z.string().min(1).max(40),
    favoriteTheme: z.string().min(2).max(60),
    adultLabel: adultLabelSchema.nullable().optional(),
    selectedAccessoryId: z.string().nullable().optional(),
    profileBadge: z.string().max(32).nullable().optional(),
  })
  .strict();

export const createDemoProfileSchema = z
  .object({
    displayName: z.string().trim().min(2).max(24),
    age: z.number().int().min(6).max(12),
    avatarId: z.string().min(2).max(40),
    favoriteTheme: z.string().trim().min(2).max(60),
  })
  .strict();

export const catalogItemSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    description: z.string(),
    assetId: z.string(),
    threshold: z.number().int().min(0).optional(),
  })
  .strict();

export const worldCatalogItemSchema = z
  .object({
    id: worldIdSchema,
    label: z.string(),
    description: z.string(),
    assetId: z.string(),
    accent: z.string(),
  })
  .strict();

export const avatarCatalogItemSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    description: z.string(),
    kind: z.enum(["animal", "kid"]),
    base: z.boolean(),
    worldId: worldIdSchema.nullable(),
    milestone: z.number().int().min(2).max(4).nullable(),
  })
  .strict();

export const gameCatalogItemSchema = z
  .object({
    id: gameIdSchema,
    label: z.string(),
    description: z.string(),
    threshold: z.number().int().min(0),
  })
  .strict();

export const worldCardSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    description: z.string(),
    assetId: z.string(),
    worldId: worldIdSchema,
    milestone: z.number().int().min(1).max(4),
    rarity: z.enum(["common", "rare", "epic", "legendary"]),
    gameId: gameIdSchema.nullable(),
    power: cardPowerSchema,
    powerLabel: z.string(),
    powerDescription: z.string(),
  })
  .strict();

export const platformCatalogSchema = z
  .object({
    themes: z.array(catalogItemSchema),
    worlds: z.array(worldCatalogItemSchema),
    avatars: z.array(avatarCatalogItemSchema),
    games: z.array(gameCatalogItemSchema),
    badges: z.array(catalogItemSchema),
    cards: z.array(worldCardSchema),
    accessories: z.array(catalogItemSchema),
    congratulations: z.array(catalogItemSchema),
  })
  .strict();

export const courseSummarySchema = z
  .object({
    courseId: z.string(),
    name: z.string().min(2).max(80),
    description: z.string().max(240),
    ownerUserId: z.string(),
    memberCount: z.number().int().min(0),
    missionCount: z.number().int().min(0),
    createdAt: z.string().datetime(),
  })
  .strict();

export const inviteSchema = z
  .object({
    token: z.string().min(16),
    courseId: z.string(),
    courseName: z.string(),
    expiresAt: z.string().datetime(),
    status: z.enum(["active", "revoked", "expired"]),
  })
  .strict();

export const missionSchema = z
  .object({
    missionId: z.string(),
    courseId: z.string(),
    storyId: z.string(),
    title: z.string(),
    theme: z.string(),
    educationalObjective: z.string(),
    createdAt: z.string().datetime(),
    status: z.enum(["active", "archived"]),
  })
  .strict();

export const activityTypeSchema = z.enum([
  "story_opened",
  "quiz_started",
  "attempt_completed",
]);

export const activitySchema = z
  .object({
    activityId: z.string(),
    courseId: z.string(),
    userId: z.string(),
    displayName: z.string(),
    storyId: z.string(),
    missionId: z.string().nullable().optional(),
    type: activityTypeSchema,
    createdAt: z.string().datetime(),
    scorePercent: z.number().int().min(0).max(100).nullable().optional(),
  })
  .strict();

export const rewardStateSchema = z
  .object({
    totalStars: z.number().int().min(0),
    mapStep: z.number().int().min(0).max(24),
    completedStoryIds: z.array(z.string()),
    unlockedBadgeIds: z.array(z.string()),
    unlockedCardIds: z.array(z.string()),
    cardInventory: z.record(z.string(), z.number().int().min(0)),
    worldMasteryCounts: z.record(worldIdSchema, z.number().int().min(0)),
    unlockedAvatarIds: z.array(z.string()),
    unlockedAccessoryIds: z.array(z.string()),
    selectedAccessoryId: z.string().nullable(),
    skillCorrect: z.record(skillSchema, z.number().int().min(0)),
    activeDayKeys: z.array(z.string()),
  })
  .strict();

export const congratulationSchema = z
  .object({
    congratulationId: z.string(),
    courseId: z.string(),
    fromUserId: z.string(),
    fromDisplayName: z.string(),
    toUserId: z.string(),
    templateId: z.string().nullable(),
    message: z.string().min(1).max(160),
    assetId: z.string(),
    highlightedSkill: skillSchema.nullable(),
    createdAt: z.string().datetime(),
  })
  .strict();

export const studentProgressSchema = z
  .object({
    profile: userProfileSchema,
    attempts: z.array(
      attemptResultSchema.extend({
        storyTitle: z.string(),
        theme: z.string(),
        courseId: z.string().nullable(),
        missionId: z.string().nullable().optional(),
      }),
    ),
    rewards: rewardStateSchema,
    recentActivity: z.array(activitySchema),
  })
  .strict();

export const dashboardStudentSchema = z
  .object({
    userId: z.string(),
    displayName: z.string(),
    avatarId: z.string(),
    completedMissions: z.number().int().min(0),
    averageScore: z.number().min(0).max(100),
    lastActivityAt: z.string().datetime().nullable(),
    focusSkill: skillSchema.nullable(),
  })
  .strict();

export const courseDashboardSchema = z
  .object({
    course: courseSummarySchema,
    activeStudents: z.number().int().min(0),
    completionPercent: z.number().min(0).max(100),
    averageScore: z.number().min(0).max(100),
    skillAccuracy: z.record(skillSchema, z.number().min(0).max(100)),
    students: z.array(dashboardStudentSchema),
    recentActivity: z.array(activitySchema),
  })
  .strict();

export type Difficulty = z.infer<typeof difficultySchema>;
export type Skill = z.infer<typeof skillSchema>;
export type WorldId = z.infer<typeof worldIdSchema>;
export type GameId = z.infer<typeof gameIdSchema>;
export type CardPower = z.infer<typeof cardPowerSchema>;
export type GenerateStoryInput = z.infer<typeof storyInputSchema>;
export type StoryMode = z.infer<typeof storyModeSchema>;
export type StoryLanguage = z.infer<typeof storyLanguageSchema>;
export type CreateStoryRequest = z.infer<typeof createStoryRequestSchema>;
export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
export type GeneratedStory = z.infer<typeof generatedStorySchema>;
export type PublicQuestion = z.infer<typeof publicQuestionSchema>;
export type StoryPublic = z.infer<typeof storyPublicSchema>;
export type GenerationStatus = z.infer<typeof generationStatusSchema>;
export type StorySummary = z.infer<typeof storySummarySchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
export type QuestionResult = z.infer<typeof questionResultSchema>;
export type AttemptResult = z.infer<typeof attemptResultSchema>;
export type RewardGrant = z.infer<typeof rewardGrantSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type CreateDemoProfileInput = z.infer<typeof createDemoProfileSchema>;
export type PlatformCatalog = z.infer<typeof platformCatalogSchema>;
export type WorldCard = z.infer<typeof worldCardSchema>;
export type CourseSummary = z.infer<typeof courseSummarySchema>;
export type Invite = z.infer<typeof inviteSchema>;
export type Mission = z.infer<typeof missionSchema>;
export type ActivityType = z.infer<typeof activityTypeSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type RewardState = z.infer<typeof rewardStateSchema>;
export type Congratulation = z.infer<typeof congratulationSchema>;
export type StudentProgress = z.infer<typeof studentProgressSchema>;
export type CourseDashboard = z.infer<typeof courseDashboardSchema>;

export const errorCodes = [
  "UNAUTHORIZED",
  "VALIDATION_ERROR",
  "CONTENT_BLOCKED",
  "STORY_NOT_FOUND",
  "GENERATION_NOT_FOUND",
  "GENERATION_PENDING",
  "ATTEMPT_ALREADY_EXISTS",
  "GENERATION_TIMEOUT",
  "GENERATION_FAILED",
  "GENERATION_LIMIT",
  "PROFILE_REQUIRED",
  "SESSION_CONTEXT_CHANGED",
  "FORBIDDEN",
  "COURSE_NOT_FOUND",
  "INVITE_INVALID",
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

// --- Aventuras interactivas (story-interactive v2): salida del modelo ---

const interactivePagesSchema = z.array(interactivePageSchema).min(2);

export const generatedInteractiveStorySchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    language: storyLanguageSchema,
    worldId: worldIdSchema,
    opening: z
      .object({
        id: z.literal("opening"),
        title: z.string().trim().min(1).max(120),
        pages: interactivePagesSchema,
        checkpoint: interactiveCheckpointSchema,
        choices: z.array(interactiveChoiceSchema).length(2),
      })
      .strict(),
    routes: z
      .array(
        z
          .object({
            id: z.string().regex(/^route-[a-z0-9-]+$/u),
            title: z.string().trim().min(1).max(120),
            pages: interactivePagesSchema,
            checkpoint: interactiveCheckpointSchema,
            choices: z.array(interactiveChoiceSchema).length(2),
            endings: z
              .array(
                z
                  .object({
                    id: z.string().regex(/^ending-[a-z0-9-]+$/u),
                    title: z.string().trim().min(1).max(120),
                    pages: interactivePagesSchema,
                  })
                  .strict(),
              )
              .length(2),
          })
          .strict(),
      )
      .length(2),
    finalQuestions: z.array(generatedQuestionSchema).length(5),
  })
  .strict()
  .superRefine((adventure, context) => {
    const routeIds = new Set(adventure.routes.map((route) => route.id));
    for (const choice of adventure.opening.choices) {
      if (!routeIds.has(choice.nextSceneId)) {
        context.addIssue({
          code: "custom",
          path: ["opening", "choices"],
          message: `La decisión "${choice.id}" apunta a una ruta inexistente.`,
        });
      }
    }
    for (const route of adventure.routes) {
      const endingIds = new Set(route.endings.map((ending) => ending.id));
      for (const choice of route.choices) {
        if (!endingIds.has(choice.nextSceneId)) {
          context.addIssue({
            code: "custom",
            path: ["routes", route.id, "choices"],
            message: `La decisión "${choice.id}" apunta a un final inexistente.`,
          });
        }
      }
    }

    const actualSkills = adventure.finalQuestions.map((question) => question.skill);
    if (actualSkills.some((skill, index) => skill !== skillValues[index])) {
      context.addIssue({
        code: "custom",
        path: ["finalQuestions"],
        message:
          "Las habilidades deben aparecer una vez y en el orden canónico.",
      });
    }
  });

export type InteractivePage = z.infer<typeof interactivePageSchema>;
export type InteractiveChoice = z.infer<typeof interactiveChoiceSchema>;
export type InteractiveCheckpoint = z.infer<typeof interactiveCheckpointSchema>;
export type GeneratedInteractiveStory = z.infer<
  typeof generatedInteractiveStorySchema
>;

export function parseGeneratedInteractiveStory(
  value: unknown,
  maxWordsPerPath: number,
): GeneratedInteractiveStory {
  const parsed = generatedInteractiveStorySchema.safeParse(value);
  if (!parsed.success) {
    throw new GeneratedStoryValidationError(
      parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "response"}: ${issue.message}`,
      ),
    );
  }

  for (const route of parsed.data.routes) {
    for (const ending of route.endings) {
      const words = [
        ...parsed.data.opening.pages,
        ...route.pages,
        ...ending.pages,
      ].reduce((total, page) => total + countWords(page.text), 0);
      if (words > maxWordsPerPath) {
        throw new GeneratedStoryValidationError([
          `${route.id}/${ending.id}: el recorrido tiene ${words} palabras y el máximo es ${maxWordsPerPath}.`,
        ]);
      }
    }
  }

  return parsed.data;
}

export type InteractiveScenePublic = z.infer<typeof interactiveScenePublicSchema>;
export type InteractiveAdventurePublic = z.infer<
  typeof interactiveAdventurePublicSchema
>;

export function toInteractiveAdventurePublic(
  generated: GeneratedInteractiveStory,
): InteractiveAdventurePublic {
  return {
    title: generated.title,
    language: generated.language,
    worldId: generated.worldId,
    scenes: [
      {
        id: "opening",
        title: generated.opening.title,
        pages: generated.opening.pages,
        checkpoint: generated.opening.checkpoint,
        choices: generated.opening.choices,
        ending: false,
      },
      ...generated.routes.flatMap((route) => [
        {
          id: route.id,
          title: route.title,
          pages: route.pages,
          checkpoint: route.checkpoint,
          choices: route.choices,
          ending: false,
        },
        ...route.endings.map((ending) => ({
          id: ending.id,
          title: ending.title,
          pages: ending.pages,
          checkpoint: null,
          choices: [],
          ending: true,
        })),
      ]),
    ],
  };
}

export const skillLabels: Record<Skill, string> = {
  literal: "Comprensión literal",
  inference: "Inferencias",
  vocabulary: "Vocabulario",
  sequence: "Secuencia",
  cause_effect: "Causa y consecuencia",
};

export const platformCatalog: PlatformCatalog = {
  themes: [
    { id: "space", label: "Espacio", description: "Planetas y estrellas", assetId: "theme-space" },
    { id: "fantasy", label: "Fantasía", description: "Castillos y criaturas", assetId: "theme-fantasy" },
    { id: "ocean", label: "Océano", description: "Misterios bajo el agua", assetId: "theme-ocean" },
    { id: "jungle", label: "Selva", description: "Naturaleza y animales", assetId: "theme-jungle" },
    { id: "inventions", label: "Inventos", description: "Ideas que cobran vida", assetId: "theme-inventions" },
    { id: "mystery", label: "Tema libre", description: "Una sorpresa diferente", assetId: "theme-mystery" },
  ],
  worlds: [
    { id: "space", label: "Órbita Curiosa", description: "Pistas entre planetas, cometas y constelaciones", assetId: "world-space", accent: "#5978f6" },
    { id: "fantasy", label: "Reino de los Porqués", description: "Preguntas valientes en castillos imposibles", assetId: "world-fantasy", accent: "#8b5cf6" },
    { id: "ocean", label: "Arrecife de Pistas", description: "Secretos que viajan bajo el agua", assetId: "world-ocean", accent: "#24b8cf" },
    { id: "jungle", label: "Selva de las Voces", description: "Historias que crecen entre hojas y huellas", assetId: "world-jungle", accent: "#58b83f" },
    { id: "inventions", label: "Ciudad de Inventos", description: "Ideas, mecanismos y soluciones inesperadas", assetId: "world-inventions", accent: "#f0a51c" },
    { id: "mystery", label: "Portal de Historias", description: "Un destino para todo lo que aún no imaginamos", assetId: "world-mystery", accent: "#ec6f80" },
  ],
  avatars: [
    { id: "animal-fox", label: "Zorro curioso", description: "Siempre encuentra una nueva pista", kind: "animal", base: true, worldId: null, milestone: null },
    { id: "animal-panda", label: "Panda lector", description: "Guarda historias para compartir", kind: "animal", base: true, worldId: null, milestone: null },
    { id: "animal-rabbit", label: "Coneja cósmica", description: "Salta entre preguntas brillantes", kind: "animal", base: true, worldId: null, milestone: null },
    { id: "kid-curls", label: "Exploradora solar", description: "Ilumina cada descubrimiento", kind: "kid", base: true, worldId: null, milestone: null },
    { id: "kid-space", label: "Inventor espacial", description: "Construye respuestas con paciencia", kind: "kid", base: true, worldId: null, milestone: null },
    { id: "kid-nature", label: "Guardiana del bosque", description: "Escucha lo que cuenta la naturaleza", kind: "kid", base: true, worldId: null, milestone: null },
    { id: "animal-raccoon", label: "Roco, mapache orbital", description: "Ordena las estrellas del camino", kind: "animal", base: false, worldId: "space", milestone: 2 },
    { id: "kid-meteor", label: "Leo, cazador de nubes", description: "Predice aventuras mirando el cielo", kind: "kid", base: false, worldId: "space", milestone: 3 },
    { id: "animal-cat-comet", label: "Kira, gata cometa", description: "Cruza la galaxia siguiendo pistas", kind: "animal", base: false, worldId: "space", milestone: 4 },
    { id: "animal-dragon", label: "Drako, dragón lector", description: "Protege los libros del reino", kind: "animal", base: false, worldId: "fantasy", milestone: 2 },
    { id: "kid-knight", label: "Alma, guardiana de cuentos", description: "Defiende cada pregunta importante", kind: "kid", base: false, worldId: "fantasy", milestone: 3 },
    { id: "animal-deer", label: "Nilo, ciervo mágico", description: "Encuentra senderos entre los porqués", kind: "animal", base: false, worldId: "fantasy", milestone: 4 },
    { id: "animal-otter", label: "Ota, nutria buceadora", description: "Recoge pistas en el fondo del mar", kind: "animal", base: false, worldId: "ocean", milestone: 2 },
    { id: "kid-diver", label: "Marina, exploradora", description: "Lee las corrientes como un mapa", kind: "kid", base: false, worldId: "ocean", milestone: 3 },
    { id: "animal-turtle", label: "Timo, tortuga cartógrafa", description: "Nunca pierde el rumbo de una historia", kind: "animal", base: false, worldId: "ocean", milestone: 4 },
    { id: "animal-capybara", label: "Capi, capibara naturalista", description: "Observa cada detalle con calma", kind: "animal", base: false, worldId: "jungle", milestone: 2 },
    { id: "kid-botanist", label: "Yara, guardiana de semillas", description: "Hace crecer ideas con preguntas", kind: "kid", base: false, worldId: "jungle", milestone: 3 },
    { id: "animal-monkey", label: "Mico, mono reportero", description: "Cuenta todo lo que descubre", kind: "animal", base: false, worldId: "jungle", milestone: 4 },
    { id: "animal-squirrel", label: "Tuerca, ardilla mecánica", description: "Guarda piezas para cada solución", kind: "animal", base: false, worldId: "inventions", milestone: 2 },
    { id: "kid-inventor", label: "Ada, creadora de ideas", description: "Convierte problemas en prototipos", kind: "kid", base: false, worldId: "inventions", milestone: 3 },
    { id: "animal-beaver", label: "Beto, castor constructor", description: "Une cada parte en el orden correcto", kind: "animal", base: false, worldId: "inventions", milestone: 4 },
    { id: "animal-cat-detective", label: "Miau, detective de pistas", description: "Descubre lo que nadie ve", kind: "animal", base: false, worldId: "mystery", milestone: 2 },
    { id: "kid-storyteller", label: "Vera, guardiana del portal", description: "Abre caminos con sus relatos", kind: "kid", base: false, worldId: "mystery", milestone: 3 },
    { id: "animal-chameleon", label: "Zed, camaleón archivista", description: "Clasifica secretos de todos los mundos", kind: "animal", base: false, worldId: "mystery", milestone: 4 },
  ],
  games: [
    { id: "clue-detective", label: "Detectives del cuento", description: "Investigá detalles y formulá inferencias", threshold: 0 },
    { id: "memory", label: "Conexiones secretas", description: "Relacioná objetos con sus significados", threshold: 10 },
    { id: "sequence", label: "El taller de la historia", description: "Reconstruí una aventura paso a paso", threshold: 25 },
    { id: "decision-maze", label: "Laberinto de decisiones", description: "Elegí rutas usando pistas y consecuencias", threshold: 40 },
    { id: "emotion-theater", label: "Teatro de emociones", description: "Leé gestos, tonos e intenciones", threshold: 55 },
    { id: "word-forge", label: "Fábrica de palabras", description: "Construí vocabulario dentro de contexto", threshold: 70 },
    { id: "evidence-board", label: "Mural de evidencias", description: "Conectá pruebas con hipótesis", threshold: 90 },
    { id: "cause-machine", label: "Máquina de causas", description: "Encendé cadenas de causa y efecto", threshold: 120 },
    { id: "perspective-prism", label: "Prisma de perspectivas", description: "Compará cómo cambia una misma escena", threshold: 160 },
    { id: "story-map", label: "Expedición de pistas", description: "Planificá rutas con reglas espaciales", threshold: 220 },
  ],
  badges: [
    { id: "first-story", label: "Primer viaje", description: "Completaste tu primer cuento", assetId: "badge-first" },
    { id: "perfect-score", label: "Mente brillante", description: "Lograste cinco respuestas correctas", assetId: "badge-perfect" },
    { id: "five-stories", label: "Gran explorador", description: "Completaste cinco cuentos diferentes", assetId: "badge-five" },
    { id: "three-days", label: "Constancia luminosa", description: "Aprendiste durante tres días", assetId: "badge-streak" },
    ...skillValues.map((skill) => ({
      id: `skill-${skill}`,
      label: skillLabels[skill],
      description: "Acertaste esta habilidad en tres cuentos diferentes",
      assetId: `badge-${skill}`,
    })),
  ],
  cards: [
    { id: "card-space", label: "Linterna de Nebulosa", description: "Una luz para leer entre líneas", assetId: "card-space", worldId: "space", milestone: 1, rarity: "common", gameId: "clue-detective", power: "nebula-spotlight", powerLabel: "Foco de nebulosa", powerDescription: "Ilumina exactamente la evidencia que sostiene la inferencia." },
    { id: "card-space-2", label: "Radar de Órbita", description: "Encuentra señales que pertenecen juntas", assetId: "card-space-2", worldId: "space", milestone: 2, rarity: "rare", gameId: "memory", power: "orbit-preview", powerLabel: "Barrido orbital", powerDescription: "Escanea una carta oculta y deja ver su contenido antes de elegir." },
    { id: "card-space-3", label: "Reloj de Gravedad", description: "Todo viaje comienza en algún lugar", assetId: "card-space-3", worldId: "space", milestone: 3, rarity: "epic", gameId: "sequence", power: "gravity-first", powerLabel: "Ancla gravitatoria", powerDescription: "Fija el primer acontecimiento y explica por qué inicia la historia." },
    { id: "card-space-4", label: "Portal de Cometa", description: "Abre un atajo entre decisiones", assetId: "card-space-4", worldId: "space", milestone: 4, rarity: "legendary", gameId: "decision-maze", power: "comet-shortcut", powerLabel: "Salto de cometa", powerDescription: "Cruza automáticamente una bifurcación difícil del laberinto." },
    { id: "card-fantasy", label: "Pluma del Oráculo", description: "Susurra una pregunta para investigar", assetId: "card-fantasy", worldId: "fantasy", milestone: 1, rarity: "common", gameId: "clue-detective", power: "oracle-question", powerLabel: "Pregunta del oráculo", powerDescription: "Formula la pregunta estratégica que conviene hacerse antes de responder." },
    { id: "card-fantasy-2", label: "Espejo Gemelo", description: "Refleja dos ideas que se corresponden", assetId: "card-fantasy-2", worldId: "fantasy", milestone: 2, rarity: "rare", gameId: "memory", power: "mirror-match", powerLabel: "Reflejo perfecto", powerDescription: "Encuentra y une una pareja completa de forma permanente." },
    { id: "card-fantasy-3", label: "Hilo del Destino", description: "Une una prueba con su explicación", assetId: "card-fantasy-3", worldId: "fantasy", milestone: 3, rarity: "epic", gameId: "evidence-board", power: "destiny-link", powerLabel: "Hilo probatorio", powerDescription: "Traza una conexión correcta entre una evidencia y su hipótesis." },
    { id: "card-fantasy-4", label: "Llave de la Torre", description: "Abre palabras que parecían imposibles", assetId: "card-fantasy-4", worldId: "fantasy", milestone: 4, rarity: "legendary", gameId: "word-forge", power: "tower-unlock", powerLabel: "Sílabas liberadas", powerDescription: "Abre la palabra bloqueada y revela cuántas piezas necesita." },
    { id: "card-ocean", label: "Perla de Eco", description: "Permite escuchar lo que siente un personaje", assetId: "card-ocean", worldId: "ocean", milestone: 1, rarity: "common", gameId: "emotion-theater", power: "emotion-echo", powerLabel: "Eco interior", powerDescription: "Reproduce un pensamiento breve del personaje para inferir su emoción." },
    { id: "card-ocean-2", label: "Sonar Amable", description: "Localiza rutas seguras bajo la superficie", assetId: "card-ocean-2", worldId: "ocean", milestone: 2, rarity: "rare", gameId: "story-map", power: "sonar-route", powerLabel: "Ruta de sonar", powerDescription: "Marca todas las casillas seguras que podés alcanzar en el próximo movimiento." },
    { id: "card-ocean-3", label: "Corriente Azul", description: "Transporta la causa hacia su consecuencia", assetId: "card-ocean-3", worldId: "ocean", milestone: 3, rarity: "epic", gameId: "cause-machine", power: "current-cause", powerLabel: "Engranaje corriente", powerDescription: "Coloca la causa intermedia que mantiene funcionando la cadena." },
    { id: "card-ocean-4", label: "Brújula Coral", description: "Señala la decisión coherente con la pista", assetId: "card-ocean-4", worldId: "ocean", milestone: 4, rarity: "legendary", gameId: "decision-maze", power: "coral-beacon", powerLabel: "Faro coral", powerDescription: "Hace brillar la salida compatible con la información del relato." },
    { id: "card-jungle", label: "Hoja Susurrante", description: "La selva revela lo que dice el cuerpo", assetId: "card-jungle", worldId: "jungle", milestone: 1, rarity: "common", gameId: "emotion-theater", power: "leaf-emotion", powerLabel: "Gesto susurrante", powerDescription: "Anima el gesto corporal que delata la emoción del personaje." },
    { id: "card-jungle-2", label: "Liana Gemela", description: "Une detalles que se apoyan entre sí", assetId: "card-jungle-2", worldId: "jungle", milestone: 2, rarity: "rare", gameId: "evidence-board", power: "vine-bridge", powerLabel: "Puente de lianas", powerDescription: "Agrupa dos evidencias que colaboran para sostener una hipótesis." },
    { id: "card-jungle-3", label: "Huella del Jaguar", description: "Anticipa el terreno que viene", assetId: "card-jungle-3", worldId: "jungle", milestone: 3, rarity: "epic", gameId: "story-map", power: "jaguar-forecast", powerLabel: "Rastro futuro", powerDescription: "Previsualiza los próximos dos pasos y los riesgos que esconden." },
    { id: "card-jungle-4", label: "Semilla Memoria", description: "Cada intento deja un recuerdo útil", assetId: "card-jungle-4", worldId: "jungle", milestone: 4, rarity: "legendary", gameId: "memory", power: "seed-recall", powerLabel: "Memoria creciente", powerDescription: "Conserva visibles las dos cartas del último intento que no coincidió." },
    { id: "card-inventions", label: "Lupa de Engranajes", description: "Amplía el detalle que cambia una conclusión", assetId: "card-inventions", worldId: "inventions", milestone: 1, rarity: "common", gameId: "clue-detective", power: "gear-zoom", powerLabel: "Zoom de precisión", powerDescription: "Amplía una palabra decisiva y muestra cómo modifica el significado." },
    { id: "card-inventions-2", label: "Imán de Ideas", description: "Atrae las piezas de una palabra", assetId: "card-inventions-2", worldId: "inventions", milestone: 2, rarity: "rare", gameId: "word-forge", power: "idea-snap", powerLabel: "Ensamble magnético", powerDescription: "Encaja automáticamente una pieza correcta en la palabra contextual." },
    { id: "card-inventions-3", label: "Plano Cronológico", description: "Proyecta el orden antes de construir", assetId: "card-inventions-3", worldId: "inventions", milestone: 3, rarity: "epic", gameId: "sequence", power: "blueprint-ghost", powerLabel: "Plano fantasma", powerDescription: "Superpone siluetas numeradas que orientan todas las posiciones." },
    { id: "card-inventions-4", label: "Botón de Rebobinar", description: "Permite revisar una decisión", assetId: "card-inventions-4", worldId: "inventions", milestone: 4, rarity: "legendary", gameId: "decision-maze", power: "rewind-move", powerLabel: "Rebobinado seguro", powerDescription: "Devuelve una decisión equivocada sin perder energía de exploración." },
    { id: "card-mystery", label: "Tinta Invisible", description: "Hace aparecer una prueba escondida", assetId: "card-mystery", worldId: "mystery", milestone: 1, rarity: "common", gameId: "evidence-board", power: "invisible-evidence", powerLabel: "Prueba invisible", powerDescription: "Revela una evidencia secreta que descarta la hipótesis más engañosa." },
    { id: "card-mystery-2", label: "Página Gemela", description: "Compara dos miradas del mismo suceso", assetId: "card-mystery-2", worldId: "mystery", milestone: 2, rarity: "rare", gameId: "perspective-prism", power: "twin-perspective", powerLabel: "Doble narrador", powerDescription: "Abre dos pensamientos simultáneos para contrastar sus puntos de vista." },
    { id: "card-mystery-3", label: "Marcador del Tiempo", description: "Separa con claridad antes y después", assetId: "card-mystery-3", worldId: "mystery", milestone: 3, rarity: "epic", gameId: "cause-machine", power: "time-boundary", powerLabel: "Frontera temporal", powerDescription: "Marca dónde termina la causa y comienza su consecuencia directa." },
    { id: "card-mystery-4", label: "Comodín de Lumi", description: "Una ayuda que aprende la mecánica actual", assetId: "card-mystery-4", worldId: "mystery", milestone: 4, rarity: "legendary", gameId: null, power: "lumi-adapt", powerLabel: "Chispa adaptable", powerDescription: "Combina dos ayudas distintas según el desafío activo." },
  ],
  accessories: [
    { id: "star-crown", label: "Corona estelar", description: "Un brillo para Lumi", assetId: "accessory-crown", threshold: 10 },
    { id: "adventure-cape", label: "Capa aventurera", description: "Para viajar entre historias", assetId: "accessory-cape", threshold: 25 },
    { id: "idea-headphones", label: "Auriculares de ideas", description: "Para escuchar nuevas pistas", assetId: "accessory-headphones", threshold: 45 },
    { id: "cosmic-backpack", label: "Mochila cósmica", description: "Guarda todos tus descubrimientos", assetId: "accessory-backpack", threshold: 70 },
  ],
  congratulations: [
    { id: "brave-reader", label: "¡Qué gran lectura!", description: "Seguiste cada pista con mucha atención.", assetId: "postcard-rocket" },
    { id: "keep-going", label: "Cada intento cuenta", description: "Tus ideas crecen cada vez que volvés a probar.", assetId: "postcard-seed" },
    { id: "sharp-eye", label: "¡Vista de explorador!", description: "Descubriste detalles muy importantes.", assetId: "postcard-lens" },
  ],
};
