import { fetchAuthSession } from "aws-amplify/auth";
import { authMode } from "./config";

export const sessionUserKey = "story-teacher:demo-user-id";

export function getSessionUserId(): string | null {
  if (authMode === "cognito") return null;
  return localStorage.getItem(sessionUserKey);
}

export function setSessionUserId(userId: string | null): void {
  if (authMode === "cognito") return;
  if (userId) localStorage.setItem(sessionUserKey, userId);
  else localStorage.removeItem(sessionUserKey);
}

export async function getAuthorizationHeader(): Promise<string | null> {
  if (authMode !== "cognito") return null;
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.accessToken;
    return token ? `Bearer ${token.toString()}` : null;
  } catch {
    return null;
  }
}
