import {
  ArrowRightIcon,
  BooksIcon,
  MagicWandIcon,
  SparkleIcon,
} from "../components/icons";
import { useCallback, useEffect, useState } from "react";
import type { StorySummary } from "@story-teacher/shared";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { api, ApiClientError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Lumi } from "../components/Lumi";
import { staggerContainer } from "../components/MotionPrimitives";
import { ErrorState, LoadingState } from "../components/PageState";
import { StoryCard } from "../components/StoryCard";

export function HomePage() {
  const { profile } = useAuth();
  const [stories, setStories] = useState<StorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStories(await api.listStories());
    } catch (loadError) {
      setError(loadError instanceof ApiClientError ? loadError.message : "No pudimos abrir tu biblioteca.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadStories(); }, [loadStories]);

  if (loading) return <LoadingState message="Buscando tus aventuras…" />;
  if (error) return <ErrorState message={error} onRetry={loadStories} />;

  return (
    <div className="page-width page-section home-page">
      <motion.section
        className="welcome-banner"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 150, damping: 21 }}
      >
        <div className="welcome-banner__copy">
          <span className="eyebrow"><SparkleIcon weight="fill" /> Tu biblioteca mágica</span>
          <h1>Hola, {profile!.name}</h1>
          <p>¿A qué mundo querés viajar hoy?</p>
        </div>
        <div className="welcome-banner__lumi"><Lumi compact /></div>
        <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ y: 3 }}>
          <Link className="button button--yellow" to="/crear">
            <MagicWandIcon size={22} weight="duotone" /> Crear una aventura
            <ArrowRightIcon size={20} weight="bold" />
          </Link>
        </motion.div>
      </motion.section>

      <div className="section-heading">
        <div><span className="eyebrow">Mis cuentos</span><h2>Historias para volver a visitar</h2></div>
        <span className="count-badge"><BooksIcon size={18} weight="duotone" /> {stories.length} {stories.length === 1 ? "historia" : "historias"}</span>
      </div>

      {stories.length === 0 ? (
        <motion.section className="empty-state" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
          <motion.div aria-hidden="true" animate={{ y: [0, -8, 0], rotate: [-3, 3, -3] }} transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}>
            <BooksIcon size={68} weight="duotone" />
          </motion.div>
          <h2>Tu biblioteca espera su primera historia</h2>
          <p>Elegí un tema, un objetivo y un protagonista para empezar.</p>
          <Link className="button button--primary" to="/crear"><MagicWandIcon size={21} weight="duotone" /> Crear mi primera aventura</Link>
        </motion.section>
      ) : (
        <motion.section
          className="story-grid"
          aria-label="Biblioteca de historias"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {stories.map((story) => <StoryCard key={story.storyId} story={story} />)}
        </motion.section>
      )}
    </div>
  );
}
