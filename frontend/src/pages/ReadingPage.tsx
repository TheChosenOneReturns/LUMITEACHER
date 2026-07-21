import { useCallback, useEffect, useState } from "react";
import type { StoryPublic } from "@story-teacher/shared";
import { Link, useParams } from "react-router-dom";
import { api, ApiClientError } from "../api/client";
import { Lumi } from "../components/Lumi";
import { ErrorState, LoadingState } from "../components/PageState";

export function ReadingPage() {
  const { storyId = "" } = useParams();
  const [story, setStory] = useState<StoryPublic | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStory = useCallback(async () => {
    setError(null);
    try {
      setStory(await api.getStory(storyId));
    } catch (loadError) {
      setError(
        loadError instanceof ApiClientError
          ? loadError.message
          : "No pudimos abrir la aventura.",
      );
    }
  }, [storyId]);

  useEffect(() => {
    void loadStory();
  }, [loadStory]);

  if (error) return <ErrorState message={error} onRetry={loadStory} />;
  if (!story) return <LoadingState message="Abriendo el libro mágico…" />;

  return (
    <div className="page-width page-section reading-page">
      <div className="reading-meta">
        <span className="pill">{story.input.theme}</span>
        <span>{story.input.age} años</span>
        <span>Hasta {story.input.maxWords} palabras</span>
      </div>

      <article className="book-page">
        <div className="book-page__illustration" aria-hidden="true">
          <div>🚀</div>
          <span>✦</span><span>★</span><span>☁</span>
        </div>
        <div className="book-page__content">
          <span className="eyebrow">Una aventura creada con Lumi</span>
          <h1>{story.title}</h1>
          <div className="story-copy">
            {story.story.split(/\n+/u).map((paragraph, index) => (
              <p key={`${paragraph.slice(0, 20)}-${index}`}>{paragraph}</p>
            ))}
          </div>
        </div>
      </article>

      <section className="reading-next">
        <Lumi message="¿Encontraste todas las pistas? ¡Es hora del desafío!" />
        <Link
          className="button button--green"
          to={`/historias/${story.storyId}/desafio`}
        >
          ▶ Comenzar desafío
        </Link>
      </section>
    </div>
  );
}

