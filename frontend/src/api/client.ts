import {
  attemptResultSchema,
  storyPublicSchema,
  storySummarySchema,
  type AttemptResult,
  type GenerateStoryInput,
  type StoryPublic,
  type StorySummary,
} from "@story-teacher/shared";
import { z } from "zod";

const apiUrl = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/u, "");
const demoUserId = import.meta.env.VITE_DEMO_USER_ID || "demo-sofia";

const listResponseSchema = z.object({
  items: z.array(storySummarySchema),
});

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
  async createStory(input: GenerateStoryInput): Promise<StoryPublic> {
    const response = await request("/stories", {
      method: "POST",
      headers: { "Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify(input),
    });
    return storyPublicSchema.parse(response);
  },

  async listStories(): Promise<StorySummary[]> {
    const response = await request("/stories");
    return listResponseSchema.parse(response).items;
  },

  async getStory(storyId: string): Promise<StoryPublic> {
    const response = await request(`/stories/${encodeURIComponent(storyId)}`);
    return storyPublicSchema.parse(response);
  },

  async submitAttempt(
    storyId: string,
    answers: number[],
    attemptId: string,
  ): Promise<AttemptResult> {
    const response = await request(
      `/stories/${encodeURIComponent(storyId)}/attempts`,
      {
        method: "POST",
        body: JSON.stringify({ attemptId, answers }),
      },
    );
    return attemptResultSchema.parse(response);
  },
};

async function request(path: string, init: RequestInit = {}): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-Demo-User-Id": demoUserId,
        ...init.headers,
      },
    });
  } catch {
    throw new ApiClientError(
      "No pudimos conectarnos. Revisá tu conexión e intentá otra vez.",
      "NETWORK_ERROR",
      0,
    );
  }

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

