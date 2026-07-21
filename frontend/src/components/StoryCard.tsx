import type { StorySummary } from "@story-teacher/shared";
import { Link } from "react-router-dom";

const themeEmoji: Record<string, string> = {
  espacio: "🚀",
  fantasía: "🐉",
  oceano: "🌊",
  océano: "🌊",
  animales: "🦁",
  selva: "🌿",
};

export function StoryCard({ story }: { story: StorySummary }) {
  const emoji =
    Object.entries(themeEmoji).find(([theme]) =>
      story.theme.toLocaleLowerCase("es").includes(theme),
    )?.[1] ?? "✨";

  return (
    <article className="story-card">
      <div className="story-card__art" aria-hidden="true">
        {emoji}
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
          Abrir aventura <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

