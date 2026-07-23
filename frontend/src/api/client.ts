import {
  attemptResultSchema,
  congratulationSchema,
  courseDashboardSchema,
  courseSummarySchema,
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
import { getSessionUserId } from "../auth/session";

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

export const api = {
  async listDemoProfiles(): Promise<UserProfile[]> {
    return listProfilesResponse.parse(await request("/demo/profiles", {}, false)).items;
  },

  async createDemoProfile(input: CreateDemoProfileInput): Promise<UserProfile> {
    return userProfileSchema.parse(
      await request("/demo/profiles", { method: "POST", body: JSON.stringify(input) }, false),
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
    const response = await request("/stories", {
      method: "POST",
      headers: { "Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify({ ...input, ...(courseId ? { courseId } : {}) }),
    });
    return storyPublicSchema.parse(response);
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

  async createMission(courseId: string, input: GenerateStoryInput): Promise<Mission> {
    return missionSchema.parse(
      await request(`/courses/${encodeURIComponent(courseId)}/missions`, {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify(input),
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

async function request(
  path: string,
  init: RequestInit = {},
  authenticated = true,
): Promise<unknown> {
  const userId = getSessionUserId();
  if (authenticated && !userId) {
    throw new ApiClientError("Elegí un perfil para continuar.", "NO_SESSION", 401);
  }
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(userId ? { "X-Demo-User-Id": userId } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiClientError(
      "No pudimos conectarnos. Revisá que el entorno local esté iniciado.",
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
