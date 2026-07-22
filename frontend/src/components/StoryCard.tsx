import { ArrowRightIcon } from "./icons";
import type { StorySummary } from "@story-teacher/shared";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { riseItem } from "./MotionPrimitives";
import { StoryThemeIcon } from "./VisualIcons";

export function StoryCard({ story }: { story: StorySummary }) {
  return (
    <motion.article
      className="story-card"
      variants={riseItem}
      whileHover={{ y: -8, rotate: -0.5 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <div className="story-card__art" aria-hidden="true">
        <motion.span
          animate={{ rotate: [-4, 5, -4], y: [0, -7, 0] }}
          transition={{ duration: 4.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          <StoryThemeIcon theme={story.theme} size={76} />
        </motion.span>
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
