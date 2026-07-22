import { skillLabels, type Skill } from "@story-teacher/shared";
import { skillIcons } from "./VisualIcons";

export function SkillBadge({ skill }: { skill: Skill }) {
  const Icon = skillIcons[skill];
  return (
    <span className="skill-badge">
      <Icon size={19} weight="duotone" aria-hidden="true" />
      {skillLabels[skill]}
    </span>
  );
}
