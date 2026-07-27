import { ArrowRightIcon } from "./icons";
import type { StorySummary } from "@story-teacher/shared";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { riseItem } from "./MotionPrimitives";

import sceneSpace from "../assets/story-scenes/scene-space.webp";
import sceneFantasy from "../assets/story-scenes/scene-fantasy.webp";
import sceneOcean from "../assets/story-scenes/scene-ocean.webp";
import sceneJungle from "../assets/story-scenes/scene-jungle.webp";
import sceneInventions from "../assets/story-scenes/scene-inventions.webp";
import sceneMystery from "../assets/story-scenes/scene-mystery.webp";

const themeImages: Record<string, string> = {
  espacio: sceneSpace,
  "espacio profundo": sceneSpace,
  fantasía: sceneFantasy,
 fantasia: sceneFantasy,
  océano: sceneOcean,
  oceano: sceneOcean,
  selva: sceneJungle,
  "selva de las voces": sceneJungle,
  inventos: sceneInventions,
  "tema libre": sceneMystery,
};

function getThemeImage(theme: string): string {
  const normalized = theme.toLocaleLowerCase("es");
  for (const [key, src] of Object.entries(themeImages)) {
    if (normalized.includes(key)) return src;
  }
  return sceneMystery;
}

export function StoryCard({ story }: { story: StorySummary }) {
  const themeImage = getThemeImage(story.theme);

  return (
    <motion.article
      className="story-card"
      variants={riseItem}
      whileHover={{ y: -8, rotate: -0.5 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <div className="story-card__art" aria-hidden="true">
        <img src={themeImage} alt="" loading="lazy" decoding="async" />
      </div>
      <div className="story-card__body">
        <span className="eyebrow">
          {story.theme} · {story.age} años
        </span>
        <h2>{story.title}</h2>
        <p>
          Creada el {new Intl.DateTimeFormat("es-AR").format(new Date(story.createdAt))}
        </p>
        <Link className="card-link" to={`/historias/${story.storyId}`}>
          Abrir aventura <ArrowRightIcon size={19} weight="bold" aria-hidden="true" />
        </Link>
      </div>
    </motion.article>
  );
}
