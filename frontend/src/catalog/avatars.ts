import { platformCatalog } from "@story-teacher/shared";

export const avatarOptions = platformCatalog.avatars;
export type CharacterAvatarId = string;
export type AvatarKind = "animal" | "kid";

export const legacyAvatarMap: Record<string, string> = {
  explorer: "animal-fox",
  dreamer: "animal-rabbit",
  inventor: "kid-space",
  mentor: "kid-curls",
};

export function normalizeAvatarId(value: string): string {
  if (avatarOptions.some((avatar) => avatar.id === value)) return value;
  return legacyAvatarMap[value] ?? "animal-fox";
}
