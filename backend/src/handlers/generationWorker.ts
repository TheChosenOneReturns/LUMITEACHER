import { storyInputSchema } from "@story-teacher/shared";
import { z } from "zod";
import {
  getGenerationJobRepository,
  getStoryService,
} from "../container";
import { ApplicationError } from "../domain/errors";

const workerEventSchema = z
  .object({
    generationId: z.string().regex(/^[a-f0-9]{32}$/u),
    userId: z.string().min(1),
    input: storyInputSchema,
    idempotencyKey: z.string().min(16).max(64),
    context: z
      .object({
        courseId: z.string().optional(),
        missionId: z.string().optional(),
        source: z.enum(["free", "mission"]).optional(),
      })
      .strict(),
  })
  .strict();

export async function handler(rawEvent: unknown): Promise<void> {
  const event = workerEventSchema.parse(rawEvent);
  const jobs = getGenerationJobRepository();
  const context = {
    ...(event.context.courseId ? { courseId: event.context.courseId } : {}),
    ...(event.context.missionId ? { missionId: event.context.missionId } : {}),
    ...(event.context.source ? { source: event.context.source } : {}),
  };

  try {
    const story = await getStoryService().createStory(
      event.userId,
      event.input,
      event.idempotencyKey,
      context,
    );
    await jobs.markCompleted(event.userId, event.generationId, story.storyId);
  } catch (error) {
    const failure =
      error instanceof ApplicationError
        ? { code: error.code, message: error.message }
        : {
            code: "GENERATION_FAILED" as const,
            message: "Lumi no pudo terminar la aventura. Intentá nuevamente.",
          };
    console.error(
      JSON.stringify({
        level: "ERROR",
        event: "generation.worker_failed",
        generationId: event.generationId,
        code: failure.code,
        errorName: error instanceof Error ? error.name : "UnknownError",
      }),
    );
    await jobs.markFailed(event.userId, event.generationId, failure);
  }
}
