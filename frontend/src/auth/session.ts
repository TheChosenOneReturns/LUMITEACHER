export const sessionUserKey = "story-teacher:demo-user-id";

export function getSessionUserId(): string | null {
  return localStorage.getItem(sessionUserKey);
}

export function setSessionUserId(userId: string | null): void {
  if (userId) localStorage.setItem(sessionUserKey, userId);
  else localStorage.removeItem(sessionUserKey);
}
