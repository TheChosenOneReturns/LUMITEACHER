import { describe, expect, it } from "vitest";
import type { QuestionResult, Skill } from "@story-teacher/shared";
import { isSafeAdultMessage } from "./platformService";
import { emptyRewardState, grantForAttempt, normalizeRewardState, themeCategory } from "./rewards";

const skills: Skill[] = ["literal", "inference", "vocabulary", "sequence", "cause_effect"];
function results(correctCount: number): QuestionResult[] {
  return skills.map((skill, index) => ({ questionId: `q${index + 1}`, selectedAnswer: index < correctCount ? 0 : 1, correctAnswer: 0, isCorrect: index < correctCount, skill, explanation: "Una explicación pedagógica." }));
}
function grant(current = emptyRewardState(), overrides: Partial<Parameters<typeof grantForAttempt>[1]> = {}) {
  return grantForAttempt(current, { storyId: "story-1", theme: "Océano", correctCount: 3, results: results(3), createdAt: "2026-07-22T10:00:00.000Z", firstAttempt: true, firstMastery: true, ...overrides });
}

describe("reward rules", () => {
  it("adds checkpoint stars only to the first attempt", () => {
    const first = grant(emptyRewardState(), { firstAttempt: true, firstMastery: false, checkpointStars: 4 });
    expect(first.grant.starsEarned).toBe(12);
    const retry = grant(first.state, { firstAttempt: false, firstMastery: true, checkpointStars: 4 });
    expect(retry.grant.starsEarned).toBe(0);
  });

  it("grants stars on the first attempt and advances mastery at 60 percent", () => {
    const { state, grant: reward } = grant();
    expect(reward.starsEarned).toBe(8);
    expect(reward.mapAdvanced).toBe(true);
    expect(reward.worldId).toBe("ocean");
    expect(state.worldMasteryCounts.ocean).toBe(1);
    expect(state.cardInventory["card-ocean"]).toBe(1);
  });

  it("allows a later mastered attempt without duplicating stars", () => {
    const first = grant(emptyRewardState(), { correctCount: 2, results: results(2), firstMastery: false });
    expect(first.state.totalStars).toBe(7);
    expect(first.state.mapStep).toBe(0);
    const retry = grant(first.state, { firstAttempt: false, firstMastery: true, correctCount: 3, results: results(3) });
    expect(retry.grant.starsEarned).toBe(0);
    expect(retry.state.totalStars).toBe(7);
    expect(retry.state.mapStep).toBe(1);
  });

  it("unlocks three characters at milestones two, three and four", () => {
    let state = emptyRewardState();
    const unlocked: string[] = [];
    for (let index = 0; index < 4; index += 1) {
      const next = grant(state, { storyId: `ocean-${index}`, firstAttempt: true, firstMastery: true });
      state = next.state; unlocked.push(...next.grant.newlyUnlockedAvatarIds);
    }
    expect(unlocked).toEqual(["animal-otter", "kid-diver", "animal-turtle"]);
    expect(state.mapStep).toBe(4);
  });

  it("recharges cards in rotation after a world is complete", () => {
    let state = emptyRewardState();
    for (let index = 0; index < 5; index += 1) state = grant(state, { storyId: `ocean-${index}` }).state;
    expect(state.mapStep).toBe(4);
    expect(state.cardInventory["card-ocean"]).toBe(2);
    expect(state.worldMasteryCounts.ocean).toBe(5);
  });

  it("migrates the old map and cards instead of resetting progress", () => {
    const migrated = normalizeRewardState({ ...emptyRewardState(), mapStep: 3, unlockedCardIds: ["card-space"], cardInventory: undefined, worldMasteryCounts: undefined, unlockedAvatarIds: undefined });
    expect(migrated.mapStep).toBe(3);
    expect(migrated.worldMasteryCounts.space).toBeGreaterThanOrEqual(1);
    expect(migrated.cardInventory["card-space"]).toBe(1);
    expect(migrated.unlockedAvatarIds.length).toBeGreaterThanOrEqual(6);
  });

  it("maps known and free themes to stable worlds", () => {
    expect(themeCategory("Planetas y galaxias")).toBe("space");
    expect(themeCategory("Un tema jamás visto")).toBe("mystery");
  });
});

describe("local congratulation moderation", () => {
  it.each(["Excelente trabajo, seguí así", "Tu esfuerzo se nota en cada lectura"])("allows a safe message", (message) => expect(isSafeAdultMessage(message)).toBe(true));
  it.each(["Escribime a profe@example.com", "Llamame al 11 4567 8901", "Qué idiota", "https://example.com/perfil"])("blocks personal or inappropriate content", (message) => expect(isSafeAdultMessage(message)).toBe(false));
});
