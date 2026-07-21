import { useCallback, useEffect, useState } from "react";
import type { StorySummary } from "@story-teacher/shared";
import { Link } from "react-router-dom";
import { api, ApiClientError } from "../api/client";
import { ErrorState, LoadingState } from "../components/PageState";
import { StoryCard } from "../components/StoryCard";

export function HomePage() {
  const [stories, setStories] = useState<StorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStories(await api.listStories());
    } catch (loadError) {
      setError(
        loadError instanceof ApiClientError
          ? loadError.message
          : "No pudimos abrir tu biblioteca.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStories();
  }, [loadStories]);

  if (loading) return <LoadingState message="Buscando tus aventuras…" />;
  if (error) return <ErrorState message={error} onRetry={loadStories} />;

  return (
    <div className="page-width page-section">
      <section className="welcome-banner">
        <div>
          <span className="eyebrow">Tu biblioteca mágica</span>
          <h1>¡Hola, Sofía! 👋</h1>
          <p>¿Qué aventura querés vivir hoy?</p>
        </div>
        <div className="welcome-banner__lumi" aria-hidden="true">
          🦉
        </div>
        <Link className="button button--yellow" to="/crear">
          ✨ Crear una aventura
        </Link>
      </section>

      <div className="section-heading">
        <div>
          <span className="eyebrow">Mis cuentos</span>
          <h2>Historias para volver a visitar</h2>
        </div>
        <span className="count-badge">
          {stories.length} {stories.length === 1 ? "historia" : "historias"}
        </span>
      </div>

      {stories.length === 0 ? (
        <section className="empty-state">
          <div aria-hidden="true">📚</div>
          <h2>Tu biblioteca espera su primera historia</h2>
          <p>Elegí un tema, un objetivo y un protagonista para empezar.</p>
          <Link className="button button--primary" to="/crear">
            Crear mi primera aventura
          </Link>
        </section>
      ) : (
        <section className="story-grid" aria-label="Biblioteca de historias">
          {stories.map((story) => (
            <StoryCard key={story.storyId} story={story} />
          ))}
        </section>
      )}
    </div>
  );
}

