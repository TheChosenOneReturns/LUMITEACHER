import {
  BooksIcon,
  BrainIcon,
  CastleTurretIcon,
  CompassIcon,
  LightbulbFilamentIcon,
  ListNumbersIcon,
  PlanetIcon,
  RocketLaunchIcon,
  SparkleIcon,
  TextAaIcon,
  TreeEvergreenIcon,
  TrophyIcon,
  GraduationCapIcon,
  WavesIcon,
} from "./icons";
import type { Icon } from "@phosphor-icons/react";
import type { AvatarId } from "../auth/AuthContext";
import { CharacterAvatar } from "./CharacterAvatar";

const themeIcons: Array<[string[], Icon]> = [
  [["espacio", "planeta", "estrella"], RocketLaunchIcon],
  [["fantasía", "fantasia", "dragón", "dragon", "castillo"], CastleTurretIcon],
  [["océano", "oceano", "mar", "agua"], WavesIcon],
  [["selva", "bosque", "naturaleza", "animales"], TreeEvergreenIcon],
];

export function StoryThemeIcon({ theme, size = 58 }: { theme: string; size?: number }) {
  const normalized = theme.toLocaleLowerCase("es");
  const Match = themeIcons.find(([keywords]) =>
    keywords.some((keyword) => normalized.includes(keyword)),
  )?.[1] ?? SparkleIcon;

  return <Match size={size} weight="duotone" />;
}

const avatarIcons: Partial<Record<AvatarId, Icon>> = {
  explorer: CompassIcon,
  dreamer: PlanetIcon,
  inventor: LightbulbFilamentIcon,
  mentor: GraduationCapIcon,
};

export function ProfileAvatar({
  avatarId,
  size = 30,
}: {
  avatarId: AvatarId;
  size?: number;
}) {
  if (!avatarIcons[avatarId]) {
    return <CharacterAvatar avatarId={avatarId} size={size} />;
  }
  const AvatarIcon = avatarIcons[avatarId] ?? CompassIcon;
  return <AvatarIcon size={size} weight="duotone" aria-hidden="true" />;
}

export const difficultyIcons = {
  facil: BooksIcon,
  media: BrainIcon,
  desafio: TrophyIcon,
} as const;

export const skillIcons = {
  literal: BooksIcon,
  inference: BrainIcon,
  vocabulary: TextAaIcon,
  sequence: ListNumbersIcon,
  cause_effect: LightbulbFilamentIcon,
} as const;
