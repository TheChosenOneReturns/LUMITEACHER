import { skillLabels, type Skill } from "@story-teacher/shared";

const icons: Record<Skill, string> = {
  literal: "📖",
  inference: "🧠",
  vocabulary: "🔤",
  sequence: "🧩",
  cause_effect: "💡",
};

export function SkillBadge({ skill }: { skill: Skill }) {
  return (
    <span className="skill-badge">
      <span aria-hidden="true">{icons[skill]}</span>
      {skillLabels[skill]}
    </span>
  );
}

