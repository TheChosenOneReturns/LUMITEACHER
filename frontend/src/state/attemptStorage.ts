import {
  attemptResultSchema,
  type AttemptResult,
} from "@story-teacher/shared";

const prefix = "story-teacher:attempt:";

export function saveAttemptResult(result: AttemptResult): void {
  sessionStorage.setItem(`${prefix}${result.attemptId}`, JSON.stringify(result));
}

export function loadAttemptResult(attemptId: string): AttemptResult | null {
  const value = sessionStorage.getItem(`${prefix}${attemptId}`);
  if (!value) return null;
  try {
    return attemptResultSchema.parse(JSON.parse(value));
  } catch {
    sessionStorage.removeItem(`${prefix}${attemptId}`);
    return null;
  }
}

