import { getStoryService } from "../container";
import {
  handleRequest,
  json,
  requireDemoUser,
  type ApiEvent,
  type ApiResponse,
} from "../http/api";

export async function handler(event: ApiEvent): Promise<ApiResponse> {
  return handleRequest(event, async () => {
    const userId = requireDemoUser(event);
    const rawLimit = Number(event.queryStringParameters?.limit ?? 20);
    const limit = Number.isInteger(rawLimit)
      ? Math.min(50, Math.max(1, rawLimit))
      : 20;
    const items = await getStoryService().listStories(userId, limit);
    return json(200, { items });
  });
}

