import {
  attemptResultSchema,
  congratulationSchema,
  courseDashboardSchema,
  courseSummarySchema,
  generationStatusSchema,
  inviteSchema,
  missionSchema,
  platformCatalogSchema,
  rewardStateSchema,
  storyPublicSchema,
  storySummarySchema,
  studentProgressSchema,
  userProfileSchema,
  type CreateDemoProfileInput,
  type ActivityType,
  type AttemptResult,
  type Congratulation,
  type CourseDashboard,
  type CourseSummary,
  type GenerateStoryInput,
  type GameId,
  type Invite,
  type Mission,
  type PlatformCatalog,
  type RewardState,
  type Skill,
  type StoryPublic,
  type StorySummary,
  type StudentProgress,
  type UserProfile,
} from "@story-teacher/shared";
import { z } from "zod";
import { authMode } from "../auth/config";
import { getAuthorizationHeader, getSessionUserId } from "../auth/session";

const apiUrl = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/u, "");
const listStoriesResponse = z.object({ items: z.array(storySummarySchema) });
const listProfilesResponse = z.object({ items: z.array(userProfileSchema) });
const listCoursesResponse = z.object({ items: z.array(courseSummarySchema) });
const listMissionsResponse = z.object({ items: z.array(missionSchema) });
const listCongratulationsResponse = z.object({ items: z.array(congratulationSchema) });

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly code = "INTERNAL_ERROR",
    readonly status = 500,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export interface MissionPreview {
  generationId: string;
  story: StoryPublic;
}

export const api = {
  async listDemoProfiles(): Promise<UserProfile[]> {
    return listProfilesResponse.parse(await request("/demo/profiles", {}, false)).items;
  },

  async createDemoProfile(input: CreateDemoProfileInput): Promise<UserProfile> {
    return userProfileSchema.parse(
      await request("/demo/profiles", { method: "POST", body: JSON.stringify(input) }, false),
    );
  },

  async bootstrapProfile(input: {
    role: "student" | "adult";
    displayName: string;
    age?: number;
    avatarId: string;
    favoriteTheme: string;
    adultLabel?: "Profesor/a" | "Familia";
  }): Promise<UserProfile> {
    return userProfileSchema.parse(
      await request("/me/bootstrap", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
  },

  async getMe(): Promise<UserProfile> {
    return userProfileSchema.parse(await request("/me"));
  },

  async updateMe(update: Partial<UserProfile>): Promise<UserProfile> {
    return userProfileSchema.parse(
      await request("/me", { method: "PATCH", body: JSON.stringify(update) }),
    );
  },

  async getCatalog(): Promise<PlatformCatalog> {
    return platformCatalogSchema.parse(await request("/catalog", {}, false));
  },

  async createStory(input: GenerateStoryInput, courseId?: string | null): Promise<StoryPublic> {
    const accepted = generationStatusSchema.parse(await request("/stories", {
      method: "POST",
      headers: { "Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify({ ...input, ...(courseId ? { courseId } : {}) }),
    }));
    if (accepted.status !== "pending") {
      return resolveGeneration(accepted);
    }

    for (let attempt = 0; attempt < 132; attempt += 1) {
      await delay(2_500);
      const status = generationStatusSchema.parse(
        await request(
          `/generations/${encodeURIComponent(accepted.generationId)}`,
        ),
      );
      if (status.status !== "pending") {
        return resolveGeneration(status);
      }
    }

    throw new ApiClientError(
      "La aventura está tardando más de lo esperado. Intentá nuevamente.",
      "GENERATION_TIMEOUT",
      504,
    );
  },

  async createMissionPreview(
    courseId: string,
    input: GenerateStoryInput,
  ): Promise<MissionPreview> {
    return generateMissionPreview(courseId, input);
  },

  async listStories(): Promise<StorySummary[]> {
    return listStoriesResponse.parse(await request("/stories")).items;
  },

  async getStory(storyId: string): Promise<StoryPublic> {
    return storyPublicSchema.parse(await request(`/stories/${encodeURIComponent(storyId)}`));
  },

  async submitAttempt(
    storyId: string,
    answers: number[],
    attemptId: string,
    checkpointStars = 0,
  ): Promise<AttemptResult> {
    return attemptResultSchema.parse(
      await request(`/stories/${encodeURIComponent(storyId)}/attempts`, {
        method: "POST",
        body: JSON.stringify({ attemptId, answers, checkpointStars }),
      }),
    );
  },

  async getAttempt(attemptId: string): Promise<AttemptResult> {
    return attemptResultSchema.parse(await request(`/attempts/${encodeURIComponent(attemptId)}`));
  },

  async listCourses(): Promise<CourseSummary[]> {
    return listCoursesResponse.parse(await request("/courses")).items;
  },

  async createCourse(input: { name: string; description: string }): Promise<CourseSummary> {
    return courseSummarySchema.parse(
      await request("/courses", { method: "POST", body: JSON.stringify(input) }),
    );
  },

  async getCourse(courseId: string): Promise<CourseSummary> {
    return courseSummarySchema.parse(await request(`/courses/${encodeURIComponent(courseId)}`));
  },

  async createInvite(courseId: string): Promise<Invite> {
    return inviteSchema.parse(
      await request(`/courses/${encodeURIComponent(courseId)}/invite`, { method: "POST" }),
    );
  },

  async getActiveInvite(courseId: string): Promise<Invite | null> {
    const response = await request(`/courses/${encodeURIComponent(courseId)}/invite`) as { invite: unknown };
    return response.invite ? inviteSchema.parse(response.invite) : null;
  },

  async revokeInvite(courseId: string): Promise<void> {
    await request(`/courses/${encodeURIComponent(courseId)}/invite/revoke`, { method: "POST" });
  },

  async getInvite(token: string): Promise<Invite> {
    return inviteSchema.parse(await request(`/invites/${encodeURIComponent(token)}`, {}, false));
  },

  async joinInvite(token: string): Promise<CourseSummary> {
    return courseSummarySchema.parse(
      await request(`/invites/${encodeURIComponent(token)}/join`, { method: "POST" }),
    );
  },

  async listMissions(courseId: string): Promise<Mission[]> {
    return listMissionsResponse.parse(
      await request(`/courses/${encodeURIComponent(courseId)}/missions`),
    ).items;
  },

  async createMission(courseId: string, generationId: string): Promise<Mission> {
    return missionSchema.parse(
      await request(`/courses/${encodeURIComponent(courseId)}/missions`, {
        method: "POST",
        body: JSON.stringify({ generationId }),
      }),
    );
  },

  async recordActivity(
    courseId: string,
    input: { storyId: string; missionId?: string; type: Exclude<ActivityType, "attempt_completed"> },
  ): Promise<void> {
    await request(`/courses/${encodeURIComponent(courseId)}/activity-events`, {
      method: "POST",
      body: JSON.stringify({ ...input, eventId: crypto.randomUUID() }),
    });
  },

  async getDashboard(courseId: string): Promise<CourseDashboard> {
    return courseDashboardSchema.parse(
      await request(`/courses/${encodeURIComponent(courseId)}/dashboard`),
    );
  },

  async getStudentProgress(courseId: string, studentId: string): Promise<StudentProgress> {
    return studentProgressSchema.parse(
      await request(
        `/courses/${encodeURIComponent(courseId)}/students/${encodeURIComponent(studentId)}/progress`,
      ),
    );
  },

  async sendCongratulation(
    courseId: string,
    studentId: string,
    input: { templateId?: string; message?: string; assetId: string; highlightedSkill?: Skill },
  ): Promise<Congratulation> {
    return congratulationSchema.parse(
      await request(
        `/courses/${encodeURIComponent(courseId)}/students/${encodeURIComponent(studentId)}/congratulations`,
        { method: "POST", body: JSON.stringify(input) },
      ),
    );
  },

  async listCongratulations(): Promise<Congratulation[]> {
    return listCongratulationsResponse.parse(await request("/me/congratulations")).items;
  },

  async getRewards(): Promise<RewardState> {
    return rewardStateSchema.parse(await request("/me/rewards"));
  },

  async selectAccessory(accessoryId: string | null): Promise<RewardState> {
    return rewardStateSchema.parse(
      await request("/me/rewards/accessory", {
        method: "PATCH",
        body: JSON.stringify({ accessoryId }),
      }),
    );
  },

  async consumeCard(cardId: string, gameId: GameId, sessionId: string): Promise<RewardState> {
    return rewardStateSchema.parse(
      await request(`/me/rewards/cards/${encodeURIComponent(cardId)}/consume`, {
        method: "POST",
        body: JSON.stringify({ gameId, sessionId }),
      }),
    );
  },
};

async function generateMissionPreview(
  courseId: string,
  input: GenerateStoryInput,
): Promise<MissionPreview> {
  const accepted = generationStatusSchema.parse(await request("/stories", {
    method: "POST",
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify({ ...input, courseId }),
  }));
  if (accepted.status !== "pending") {
    return {
      generationId: accepted.generationId,
      story: resolveGeneration(accepted),
    };
  }

  for (let attempt = 0; attempt < 132; attempt += 1) {
    await delay(2_500);
    const status = generationStatusSchema.parse(
      await request(
        `/generations/${encodeURIComponent(accepted.generationId)}`,
      ),
    );
    if (status.status !== "pending") {
      return {
        generationId: status.generationId,
        story: resolveGeneration(status),
      };
    }
  }

  throw new ApiClientError(
    "La vista previa está tardando más de lo esperado. Intentá nuevamente.",
    "GENERATION_TIMEOUT",
    504,
  );
}

function resolveGeneration(
  generation: ReturnType<typeof generationStatusSchema.parse>,
): StoryPublic {
  if (generation.status === "completed") {
    return storyPublicSchema.parse(generation.story);
  }
  if (generation.status === "failed") {
    throw new ApiClientError(
      generation.error.message,
      generation.error.code,
      502,
    );
  }
  throw new ApiClientError(
    "La aventura todavía se está creando.",
    "GENERATION_PENDING",
    202,
  );
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function request(
  path: string,
  init: RequestInit = {},
  authenticated = true,
): Promise<unknown> {
  const userId = getSessionUserId();
  const authorization = await getAuthorizationHeader();
  if (authenticated && !userId && !authorization) {
    throw new ApiClientError("Elegí un perfil para continuar.", "NO_SESSION", 401);
  }
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(userId ? { "X-Demo-User-Id": userId } : {}),
        ...(authorization ? { Authorization: authorization } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiClientError(
      authMode === "cognito"
        ? "No pudimos conectarnos con AWS. Intentá nuevamente."
        : "No pudimos conectarnos. Revisá que el entorno local esté iniciado.",
      "NETWORK_ERROR",
      0,
    );
  }

  if (response.status === 204) return null;
  const payload = (await response.json().catch(() => null)) as
    | { error?: { code?: string; message?: string } }
    | null;
  if (!response.ok) {
    throw new ApiClientError(
      payload?.error?.message ?? "Ocurrió un error. Intentá nuevamente.",
      payload?.error?.code,
      response.status,
    );
  }
  return payload;
}
