import { storyInputSchema } from "@story-teacher/shared";
import { getStoryService } from "../container";
import {
  handleRequest,
  json,
  parseJsonBody,
  requireDemoUser,
  requireIdempotencyKey,
  type ApiEvent,
  type ApiResponse,
} from "../http/api";

export async function handler(event: ApiEvent): Promise<ApiResponse> {
  return handleRequest(event, async () => {
    const userId = requireDemoUser(event);
    const idempotencyKey = requireIdempotencyKey(event);
    const input = storyInputSchema.parse(parseJsonBody(event));
    const story = await getStoryService().createStory(
      userId,
      input,
      idempotencyKey,
    );
    return json(201, story);
  });
}

