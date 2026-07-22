import {
  ArrowRightIcon,
  BookOpenTextIcon,
  PlayIcon,
  SparkleIcon,
} from "../components/icons";
import type { StoryPublic } from "@story-teacher/shared";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiClientError } from "../api/client";
import { Lumi } from "../components/Lumi";
import { ErrorState, LoadingState } from "../components/PageState";
import { StoryThemeIcon } from "../components/VisualIcons";

export function ReadingPage() {
  const { storyId = "" } = useParams();
  const [story, setStory] = useState<StoryPublic | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStory = useCallback(async () => {
    setError(null);
    try {
      setStory(await api.getStory(storyId));
    } catch (loadError) {
      setError(loadError instanceof ApiClientError ? loadError.message : "No pudimos abrir la aventura.");
    }
  }, [storyId]);

  useEffect(() => { void loadStory(); }, [loadStory]);

  if (error) return <ErrorState message={error} onRetry={loadStory} />;
  if (!story) return <LoadingState message="Abriendo el libro mágico…" />;

  return (
    <div className="page-width page-section reading-page">
      <motion.div className="reading-meta" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <span className="pill"><SparkleIcon weight="fill" /> {story.input.theme}</span>
        <span>{story.input.age} años</span><span>Hasta {story.input.maxWords} palabras</span>
      </motion.div>

      <motion.article
        className="book-page"
        initial={{ opacity: 0, y: 28, rotateX: 4 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 21 }}
      >
        <div className="book-page__illustration" aria-hidden="true">
          <motion.div animate={{ y: [0, -12, 0], rotate: [-8, 5, -8] }} transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}>
            <StoryThemeIcon theme={story.input.theme} size={142} />
          </motion.div>
          {[0, 1, 2].map((index) => (
            <motion.span key={index} animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.15, 0.8] }} transition={{ duration: 2.8, delay: index * 0.5, repeat: Number.POSITIVE_INFINITY }}>
              <SparkleIcon weight="fill" />
            </motion.span>
          ))}
        </div>
        <div className="book-page__content">
          <span className="eyebrow"><BookOpenTextIcon weight="duotone" /> Una aventura creada con Lumi</span>
          <h1>{story.title}</h1>
          <div className="story-copy">
            {story.story.split(/\n+/u).map((paragraph, index) => (
              <motion.p key={`${paragraph.slice(0, 20)}-${index}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + index * 0.08 }}>
                {paragraph}
              </motion.p>
            ))}
          </div>
        </div>
      </motion.article>

      <motion.section className="reading-next" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <Lumi message="¿Encontraste todas las pistas? Es hora del desafío." />
        <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ y: 3 }}>
          <Link className="button button--green" to={`/historias/${story.storyId}/desafio`}>
            <PlayIcon size={21} weight="fill" /> Comenzar desafío <ArrowRightIcon size={20} weight="bold" />
          </Link>
        </motion.div>
      </motion.section>
    </div>
  );
}
