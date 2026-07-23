import {
  platformCatalog,
  rewardStateSchema,
  skillValues,
  worldValues,
  type QuestionResult,
  type RewardGrant,
  type RewardState,
  type Skill,
  type WorldId,
} from "@story-teacher/shared";

const baseAvatarIds = platformCatalog.avatars.filter((avatar) => avatar.base).map((avatar) => avatar.id);

export function emptyRewardState(): RewardState {
  return {
    totalStars: 0,
    mapStep: 0,
    completedStoryIds: [],
    unlockedBadgeIds: [],
    unlockedCardIds: [],
    cardInventory: {},
    worldMasteryCounts: Object.fromEntries(worldValues.map((world) => [world, 0])) as Record<WorldId, number>,
    unlockedAvatarIds: [...baseAvatarIds],
    unlockedAccessoryIds: [],
    selectedAccessoryId: null,
    skillCorrect: Object.fromEntries(skillValues.map((skill) => [skill, 0])) as Record<Skill, number>,
    activeDayKeys: [],
  };
}

export function normalizeRewardState(value: unknown): RewardState {
  const base = emptyRewardState();
  if (!value || typeof value !== "object") return base;
  const raw = value as Record<string, unknown>;
  const stringArray = (key: string) => Array.isArray(raw[key]) ? (raw[key] as unknown[]).filter((item): item is string => typeof item === "string") : [];
  const unlockedCardIds = stringArray("unlockedCardIds");
  const rawCounts = isRecord(raw.worldMasteryCounts) ? raw.worldMasteryCounts : {};
  const worldMasteryCounts = Object.fromEntries(worldValues.map((world) => [world, numeric(rawCounts[world])])) as Record<WorldId, number>;

  if (!isRecord(raw.worldMasteryCounts)) {
    for (const world of worldValues) {
      if (unlockedCardIds.includes(`card-${world}`)) worldMasteryCounts[world] = 1;
    }
    let remaining = Math.max(0, numeric(raw.mapStep) - visibleMapSteps(worldMasteryCounts));
    for (const world of worldValues) {
      const capacity = Math.max(0, 4 - worldMasteryCounts[world]);
      const restored = Math.min(capacity, remaining);
      worldMasteryCounts[world] += restored;
      remaining -= restored;
      if (!remaining) break;
    }
  }

  const rawInventory = isRecord(raw.cardInventory) ? raw.cardInventory : {};
  const cardInventory: Record<string, number> = {};
  for (const cardId of unlockedCardIds) cardInventory[cardId] = Math.max(1, numeric(rawInventory[cardId]));
  for (const [cardId, quantity] of Object.entries(rawInventory)) cardInventory[cardId] = numeric(quantity);

  const rawSkills = isRecord(raw.skillCorrect) ? raw.skillCorrect : {};
  const candidate: RewardState = {
    totalStars: numeric(raw.totalStars),
    mapStep: visibleMapSteps(worldMasteryCounts),
    completedStoryIds: stringArray("completedStoryIds"),
    unlockedBadgeIds: stringArray("unlockedBadgeIds"),
    unlockedCardIds,
    cardInventory,
    worldMasteryCounts,
    unlockedAvatarIds: unique([...baseAvatarIds, ...stringArray("unlockedAvatarIds")]),
    unlockedAccessoryIds: stringArray("unlockedAccessoryIds"),
    selectedAccessoryId: typeof raw.selectedAccessoryId === "string" ? raw.selectedAccessoryId : null,
    skillCorrect: Object.fromEntries(skillValues.map((skill) => [skill, numeric(rawSkills[skill])])) as Record<Skill, number>,
    activeDayKeys: stringArray("activeDayKeys"),
  };
  return rewardStateSchema.parse(candidate);
}

export function grantForAttempt(
  currentInput: RewardState,
  input: {
    storyId: string;
    theme: string;
    correctCount: number;
    results: QuestionResult[];
    createdAt: string;
    firstAttempt: boolean;
    firstMastery: boolean;
    checkpointStars?: number;
  },
): { state: RewardState; grant: RewardGrant } {
  const current = normalizeRewardState(currentInput);
  const completedStoryIds = input.firstAttempt ? unique([...current.completedStoryIds, input.storyId]) : current.completedStoryIds;
  const dayKey = input.createdAt.slice(0, 10);
  const activeDayKeys = input.firstAttempt ? unique([...current.activeDayKeys, dayKey]) : current.activeDayKeys;
  const skillCorrect = { ...current.skillCorrect };
  if (input.firstAttempt) {
    for (const result of input.results) if (result.isCorrect) skillCorrect[result.skill] = (skillCorrect[result.skill] ?? 0) + 1;
  }

  const starsEarned = input.firstAttempt ? 5 + input.correctCount + Math.min(4, Math.max(0, input.checkpointStars ?? 0)) : 0;
  const totalStars = current.totalStars + starsEarned;
  const candidateBadges = [
    ...(completedStoryIds.length >= 1 ? ["first-story"] : []),
    ...(input.firstAttempt && input.correctCount === 5 ? ["perfect-score"] : []),
    ...(completedStoryIds.length >= 5 ? ["five-stories"] : []),
    ...(activeDayKeys.length >= 3 ? ["three-days"] : []),
    ...skillValues.filter((skill) => (skillCorrect[skill] ?? 0) >= 3).map((skill) => `skill-${skill}`),
  ];
  const candidateAccessories = platformCatalog.accessories
    .filter((accessory) => totalStars >= (accessory.threshold ?? Number.MAX_SAFE_INTEGER))
    .map((accessory) => accessory.id);

  const worldId = input.firstMastery ? themeCategory(input.theme) : null;
  const worldMasteryCounts = { ...current.worldMasteryCounts };
  const unlockedCardIds = [...current.unlockedCardIds];
  const cardInventory = { ...current.cardInventory };
  const unlockedAvatarIds = [...current.unlockedAvatarIds];
  const newlyUnlockedCardIds: string[] = [];
  const newlyUnlockedAvatarIds: string[] = [];
  const cardCopiesGranted: RewardGrant["cardCopiesGranted"] = [];
  let worldStep: number | null = null;
  let mapAdvanced = false;

  if (worldId) {
    const previousCount = worldMasteryCounts[worldId] ?? 0;
    const nextCount = previousCount + 1;
    worldMasteryCounts[worldId] = nextCount;
    const milestone = (previousCount % 4) + 1;
    const card = platformCatalog.cards.find((candidate) => candidate.worldId === worldId && candidate.milestone === milestone);
    if (card) {
      if (!unlockedCardIds.includes(card.id)) newlyUnlockedCardIds.push(card.id);
      unlockedCardIds.push(card.id);
      cardInventory[card.id] = (cardInventory[card.id] ?? 0) + 1;
      cardCopiesGranted.push({ cardId: card.id, quantity: 1 });
    }
    if (previousCount < 4) {
      worldStep = nextCount;
      mapAdvanced = true;
      const avatarIds = platformCatalog.avatars
        .filter((avatar) => avatar.worldId === worldId && avatar.milestone === nextCount)
        .map((avatar) => avatar.id);
      newlyUnlockedAvatarIds.push(...difference(avatarIds, unlockedAvatarIds));
      unlockedAvatarIds.push(...avatarIds);
    }
  }

  const newlyUnlockedBadgeIds = difference(candidateBadges, current.unlockedBadgeIds);
  const newlyUnlockedAccessoryIds = difference(candidateAccessories, current.unlockedAccessoryIds);
  const state: RewardState = {
    totalStars,
    mapStep: visibleMapSteps(worldMasteryCounts),
    completedStoryIds,
    unlockedBadgeIds: unique([...current.unlockedBadgeIds, ...candidateBadges]),
    unlockedCardIds: unique(unlockedCardIds),
    cardInventory,
    worldMasteryCounts,
    unlockedAvatarIds: unique(unlockedAvatarIds),
    unlockedAccessoryIds: unique([...current.unlockedAccessoryIds, ...candidateAccessories]),
    selectedAccessoryId: current.selectedAccessoryId ?? newlyUnlockedAccessoryIds[0] ?? null,
    skillCorrect,
    activeDayKeys,
  };
  return {
    state,
    grant: {
      starsEarned,
      mapAdvanced,
      newlyUnlockedBadgeIds,
      newlyUnlockedCardIds,
      newlyUnlockedAccessoryIds,
      newlyUnlockedAvatarIds,
      cardCopiesGranted,
      worldId,
      worldStep,
    },
  };
}

export function themeCategory(theme: string): WorldId {
  const value = theme.toLocaleLowerCase("es");
  if (/espacio|planeta|estrella|galax/u.test(value)) return "space";
  if (/fantas|drag[oó]n|castillo|magia/u.test(value)) return "fantasy";
  if (/oc[eé]ano|mar|agua|submar/u.test(value)) return "ocean";
  if (/selva|bosque|naturaleza|animal/u.test(value)) return "jungle";
  if (/invento|robot|ciencia|m[aá]quina/u.test(value)) return "inventions";
  return "mystery";
}

export function visibleMapSteps(counts: Record<WorldId, number>): number {
  return worldValues.reduce((sum, world) => sum + Math.min(4, counts[world] ?? 0), 0);
}

function numeric(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function difference(values: string[], previous: string[]): string[] {
  const known = new Set(previous);
  return unique(values).filter((value) => !known.has(value));
}
