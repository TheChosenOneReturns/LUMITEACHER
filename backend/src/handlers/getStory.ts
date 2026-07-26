import { ApplicationError } from "../domain/errors";
import { getStoryService } from "../container";
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
    const storyId = event.pathParameters?.storyId;
    if (!storyId) {
      throw new ApplicationError(
        "VALIDATION_ERROR",
        400,
        "Falta el identificador de la aventura.",
      );
    }
    const story = await getStoryService().getStory(userId, storyId);
    return json(200, story);
  });
}
