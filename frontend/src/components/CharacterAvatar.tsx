import { platformCatalog, type WorldId } from "@story-teacher/shared";
import { useId } from "react";
import { normalizeAvatarId } from "../catalog/avatars";

interface CharacterAvatarProps {
  avatarId: string;
  outfitId?: string | null | undefined;
  size?: number;
  animated?: boolean;
  className?: string;
}

const worldPalettes: Record<WorldId | "base", { background: string; shirt: string; accent: string }> = {
  base: { background: "#e9f7ff", shirt: "#7657f6", accent: "#fdd73b" },
  space: { background: "#e7eaff", shirt: "#5978f6", accent: "#fdd73b" },
  fantasy: { background: "#f3e8ff", shirt: "#8b5cf6", accent: "#ff9bc2" },
  ocean: { background: "#dff9ff", shirt: "#24b8cf", accent: "#63d8ff" },
  jungle: { background: "#e8ffdf", shirt: "#58b83f", accent: "#f4c84a" },
  inventions: { background: "#fff3d8", shirt: "#ef9f19", accent: "#44a8d8" },
  mystery: { background: "#ffe9f0", shirt: "#ec6f80", accent: "#7657f6" },
};

export function CharacterAvatar({ avatarId, outfitId, size = 96, animated = false, className = "" }: CharacterAvatarProps) {
  const normalized = normalizeAvatarId(avatarId);
  const meta = platformCatalog.avatars.find((candidate) => candidate.id === normalized);
  const palette = worldPalettes[meta?.worldId ?? "base"];
  const uniqueId = useId().replaceAll(":", "");
  const isAnimal = meta?.kind !== "kid";

  return (
    <svg className={`character-avatar ${animated ? "character-avatar--animated" : ""} ${className}`} width={size} height={size} viewBox="0 0 180 200" aria-hidden="true">
      <defs>
        <linearGradient id={`avatar-bg-${uniqueId}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={palette.background} /><stop offset="1" stopColor="#ffffff" /></linearGradient>
        <filter id={`avatar-shadow-${uniqueId}`} x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#003f5c" floodOpacity=".18" /></filter>
      </defs>
      <circle cx="90" cy="96" r="82" fill={`url(#avatar-bg-${uniqueId})`} />
      <circle cx="36" cy="45" r="7" fill={palette.accent} opacity=".42" />
      <path d="M139 31l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#fdd73b" />

      {outfitId === "cosmic-backpack" ? <path d="M124 109c28 1 36 20 29 58h-31Z" fill="#6cc8ff" stroke="#174b69" strokeWidth="5" /> : null}
      {outfitId === "adventure-cape" ? <path d="M48 116c-20 27-17 60 1 75l41-27 41 27c18-15 21-48 1-75-12 9-26 14-42 14s-30-5-42-14Z" fill="#ff705d" stroke="#9d351c" strokeWidth="5" /> : null}

      <g className="character-avatar__body" filter={`url(#avatar-shadow-${uniqueId})`}>
        <path d="M50 189c1-47 14-72 40-72s39 25 40 72Z" fill={palette.shirt} stroke="#174b69" strokeWidth="5" />
        <path d="M75 125h30v22c-8 7-22 7-30 0Z" fill="#ffd0ad" />
        {isAnimal ? <AnimalHead avatarId={normalized} accent={palette.accent} /> : <KidHead avatarId={normalized} accent={palette.accent} />}
        <path d="M78 157h24" fill="none" stroke={palette.accent} strokeWidth="8" strokeLinecap="round" />
        <path d="M64 190c5-20 2-37-9-47M116 190c-5-20-2-37 9-47" fill="none" stroke="#174b69" strokeWidth="5" strokeLinecap="round" opacity=".32" />
      </g>

      {outfitId === "star-crown" ? <path d="M56 39 68 20l22 17 22-17 12 20-8 17H64Z" fill="#fdd73b" stroke="#705d00" strokeWidth="5" strokeLinejoin="round" /> : null}
      {outfitId === "idea-headphones" ? <g fill="none" stroke="#7657f6" strokeLinecap="round"><path d="M48 82a42 42 0 0 1 84 0" strokeWidth="9"/><path d="M47 78h13v31H47zM120 78h13v31h-13z" fill="#c7baff" strokeWidth="6"/></g> : null}
      {outfitId ? <><circle cx="145" cy="157" r="18" fill="#fff" stroke="#174b69" strokeWidth="4" /><path d="m137 157 5 5 10-12" fill="none" stroke="#49a82f" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></> : null}
    </svg>
  );
}

function AnimalHead({ avatarId, accent }: { avatarId: string; accent: string }) {
  const colors: Record<string, string> = {
    "animal-fox": "#ff9d78", "animal-panda": "#fff8e9", "animal-rabbit": "#eee9ff", "animal-raccoon": "#a9b5bf",
    "animal-cat-comet": "#8e91ff", "animal-dragon": "#7bd96b", "animal-deer": "#d9a36d", "animal-otter": "#b87d55",
    "animal-turtle": "#79c89a", "animal-capybara": "#bd8a61", "animal-monkey": "#d49a62", "animal-squirrel": "#e2814f",
    "animal-beaver": "#9d6948", "animal-cat-detective": "#c48ba8", "animal-chameleon": "#71c978",
  };
  const face = colors[avatarId] ?? "#ff9d78";
  const isRabbit = avatarId === "animal-rabbit";
  const isDragon = avatarId === "animal-dragon";
  const isDeer = avatarId === "animal-deer";
  const isCat = avatarId.includes("cat-");
  const roundEars = ["animal-panda", "animal-raccoon", "animal-otter", "animal-capybara", "animal-monkey", "animal-beaver"].includes(avatarId);
  return <g>
    {isRabbit ? <><path d="M57 57C43 25 52 8 65 12c13 4 13 28 12 45M103 57c-1-17-1-41 12-45 13-4 22 13 8 45" fill={face} stroke="#174b69" strokeWidth="5"/><path d="M62 46c-6-18-4-26 0-27M118 46c6-18 4-26 0-27" fill="none" stroke="#ff9fb0" strokeWidth="6" strokeLinecap="round"/></> : null}
    {isDragon ? <><path d="m55 59-19-27 27 8M125 59l19-27-27 8" fill="#f6d65a" stroke="#174b69" strokeWidth="5"/><path d="m72 43 18-27 18 27" fill={accent} stroke="#174b69" strokeWidth="5"/></> : null}
    {isDeer ? <><path d="M59 53 42 23m18 15-24-2M121 53l17-30m-18 15 24-2" fill="none" stroke="#76502f" strokeWidth="6" strokeLinecap="round"/><path d="m51 60-18-20 29 5M129 60l18-20-29 5" fill={face} stroke="#174b69" strokeWidth="5"/></> : null}
    {!isRabbit && !isDragon && !isDeer && (isCat || avatarId === "animal-fox" || avatarId === "animal-squirrel") ? <><path d="m48 60 7-42 31 25M132 60l-7-42-31 25" fill={face} stroke="#174b69" strokeWidth="5" strokeLinejoin="round"/></> : null}
    {roundEars ? <><circle cx="55" cy="58" r="20" fill={face} stroke="#174b69" strokeWidth="5"/><circle cx="125" cy="58" r="20" fill={face} stroke="#174b69" strokeWidth="5"/></> : null}
    {avatarId === "animal-turtle" ? <path d="M49 70c5-31 77-31 82 0l-13-33H62Z" fill="#3d9f68" stroke="#174b69" strokeWidth="5"/> : null}
    {avatarId === "animal-chameleon" ? <><circle cx="58" cy="61" r="22" fill={face} stroke="#174b69" strokeWidth="5"/><circle cx="122" cy="61" r="22" fill={face} stroke="#174b69" strokeWidth="5"/></> : null}
    <circle cx="90" cy="84" r="47" fill={face} stroke="#174b69" strokeWidth="5"/>
    {avatarId === "animal-panda" ? <><ellipse cx="71" cy="78" rx="15" ry="18" fill="#17313d" transform="rotate(18 71 78)"/><ellipse cx="109" cy="78" rx="15" ry="18" fill="#17313d" transform="rotate(-18 109 78)"/></> : null}
    {avatarId === "animal-raccoon" ? <path d="M51 75q39-28 78 0l-11 25H62Z" fill="#48545d" opacity=".86"/> : null}
    {avatarId === "animal-monkey" ? <ellipse cx="90" cy="88" rx="34" ry="29" fill="#f2c79a"/> : null}
    {avatarId === "animal-capybara" ? <rect x="62" y="78" width="56" height="35" rx="17" fill="#dcae82"/> : null}
    {avatarId === "animal-cat-detective" ? <path d="M50 65q40-30 80 0l-6-22H56Z" fill="#574067" stroke="#174b69" strokeWidth="4"/> : null}
    <circle cx="72" cy="82" r="6" fill="#174b69"/><circle cx="108" cy="82" r="6" fill="#174b69"/>
    {avatarId === "animal-chameleon" ? <><circle cx="72" cy="82" r="12" fill="none" stroke="#fff" strokeWidth="5"/><circle cx="108" cy="82" r="12" fill="none" stroke="#fff" strokeWidth="5"/></> : null}
    <path d="m84 94 6-5 6 5-6 7Z" fill="#174b69"/><path d="M78 106q12 10 24 0" fill="none" stroke="#174b69" strokeWidth="4" strokeLinecap="round"/>
    {avatarId === "animal-beaver" ? <path d="M83 103h14v15H83Z" fill="#fff" stroke="#174b69" strokeWidth="3"/> : null}
    {avatarId === "animal-otter" ? <path d="M58 99h-18m20 8H43m79-8h18m-20 8h17" stroke="#174b69" strokeWidth="3" strokeLinecap="round"/> : null}
    {avatarId === "animal-cat-comet" ? <path d="M121 43q21-23 31-9-7 7-27 17Z" fill="#fdd73b"/> : null}
  </g>;
}

function KidHead({ avatarId, accent }: { avatarId: string; accent: string }) {
  const tones = ["#70422f", "#8c563c", "#d58a5f", "#efb48d", "#6f422e", "#bb7351"];
  const hairs = ["#172126", "#3c241f", "#4b2b24", "#73452d"];
  const index = Math.abs(hashCode(avatarId));
  const skin = tones[index % tones.length]!;
  const hair = hairs[index % hairs.length]!;
  return <g>
    <circle cx="90" cy="82" r="47" fill={skin} stroke="#174b69" strokeWidth="5"/>
    {avatarId === "kid-curls" ? <g fill={hair}>{[55,68,82,98,113,126].map((cx, item) => <circle key={cx} cx={cx} cy={item % 2 ? 43 : 48} r="18"/>)}<circle cx="51" cy="65" r="17"/><circle cx="129" cy="65" r="17"/></g> : <path d="M48 72c-1-34 16-52 42-52 29 0 46 22 43 56-12-14-24-19-38-23-13 11-29 17-47 19Z" fill={hair}/>}
    <circle cx="73" cy="83" r="5" fill="#172126"/><circle cx="107" cy="83" r="5" fill="#172126"/><path d="M78 102q12 10 24 0" fill="none" stroke="#5d2b25" strokeWidth="4" strokeLinecap="round"/><circle cx="60" cy="97" r="7" fill="#ff9c92" opacity=".4"/><circle cx="120" cy="97" r="7" fill="#ff9c92" opacity=".4"/>
    {avatarId === "kid-meteor" ? <path d="M56 48q34-31 68 0l-7-20H63Z" fill="#5978f6" stroke="#174b69" strokeWidth="4"/> : null}
    {avatarId === "kid-knight" ? <path d="m58 52 10-24 22 15 22-15 10 24" fill="none" stroke="#f4c84a" strokeWidth="7" strokeLinejoin="round"/> : null}
    {avatarId === "kid-diver" ? <g fill="#bdeeff" stroke="#174b69" strokeWidth="4"><rect x="54" y="68" width="31" height="22" rx="9"/><rect x="95" y="68" width="31" height="22" rx="9"/><path d="M85 78h10"/></g> : null}
    {avatarId === "kid-botanist" ? <path d="M118 39q24-17 28 4-19 14-29 6Z" fill="#58b83f" stroke="#174b69" strokeWidth="4"/> : null}
    {avatarId === "kid-inventor" ? <g fill={accent} stroke="#174b69" strokeWidth="4"><circle cx="70" cy="69" r="14"/><circle cx="110" cy="69" r="14"/><path d="M84 69h12"/></g> : null}
    {avatarId === "kid-storyteller" ? <path d="M52 53q38-43 76 0c-27-10-49-10-76 0Z" fill="#ec6f80" stroke="#174b69" strokeWidth="5"/> : null}
  </g>;
}

function hashCode(value: string): number {
  return [...value].reduce((hash, character) => ((hash << 5) - hash) + character.charCodeAt(0), 0);
}
