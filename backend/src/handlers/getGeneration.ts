import type { GenerationStatus } from "@story-teacher/shared";
import {
  getGenerationJobRepository,
  getStoryService,
} from "../container";
import { ApplicationError } from "../domain/errors";
import {
  handleRequest,
  json,
  requireUser,
  type ApiEvent,
  type ApiResponse,
} from "../http/api";

export async function handler(event: ApiEvent): Promise<ApiResponse> {
  return handleRequest(event, async () => {
    const { userId } = await requireUser(event);
    const generationId = event.pathParameters?.generationId;
    if (!generationId || !/^[a-f0-9]{32}$/u.test(generationId)) {
      throw new ApplicationError(
        "VALIDATION_ERROR",
        400,
        "Falta el identificador de generación.",
      );
    }

    const job = await getGenerationJobRepository().get(userId, generationId);
    if (!job) {
      throw new ApplicationError(
        "GENERATION_NOT_FOUND",
        404,
        "No encontramos esa generación.",
      );
    }

    let response: GenerationStatus;
    if (job.status === "completed") {
      response = {
        generationId,
        status: "completed",
        story: await getStoryService().getStory(userId, job.storyId),
      };
    } else if (job.status === "failed") {
      response = {
        generationId,
        status: "failed",
        error: job.error,
      };
    } else {
      response = { generationId, status: "pending" };
    }
    return json(200, response);
  });
}
