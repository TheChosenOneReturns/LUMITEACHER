import type { Congratulation, CourseSummary, Mission, RewardState, StorySummary } from "@story-teacher/shared";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiClientError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import {
  ArrowRightIcon,
  BellIcon,
  BooksIcon,
  GiftIcon,
  GraduationCapIcon,
  MagicWandIcon,
  SparkleIcon,
  StarFourIcon,
  UsersThreeIcon,
} from "../components/icons";
import { Lumi } from "../components/Lumi";
import { staggerContainer } from "../components/MotionPrimitives";
import { ErrorState, LoadingState } from "../components/PageState";
import { StoryCard } from "../components/StoryCard";
import { StoryThemeIcon } from "../components/VisualIcons";

interface MissionWithCourse extends Mission {
  courseName: string;
}

export function HomePage() {
  const { profile } = useAuth();
  const [stories, setStories] = useState<StorySummary[]>([]);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [missions, setMissions] = useState<MissionWithCourse[]>([]);
  const [rewards, setRewards] = useState<RewardState | null>(null);
  const [postcards, setPostcards] = useState<Congratulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextStories, nextCourses, nextRewards, nextPostcards] = await Promise.all([
        api.listStories(),
        api.listCourses(),
        api.getRewards(),
        api.listCongratulations(),
      ]);
      const missionGroups = await Promise.all(
        nextCourses.map(async (course) =>
          (await api.listMissions(course.courseId)).map((mission) => ({ ...mission, courseName: course.name })),
        ),
      );
      setStories(nextStories);
      setCourses(nextCourses);
      setMissions(missionGroups.flat());
      setRewards(nextRewards);
      setPostcards(nextPostcards);
    } catch (loadError) {
      setError(loadError instanceof ApiClientError ? loadError.message : "¡Ups! No pudimos abrir tu espacio lector. Probemos de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  if (loading) return <LoadingState message="Buscando tus misiones y aventuras…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="page-width page-section home-page student-dashboard">
      <motion.section className="welcome-banner" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <div className="welcome-banner__copy">
          <span className="eyebrow"><SparkleIcon weight="fill" /> Tu mundo lector</span>
          <h1>Hola, {profile!.displayName}</h1>
          <p>Tenés {missions.length} {missions.length === 1 ? "misión" : "misiones"} y un mapa esperando nuevas estrellas.</p>
        </div>
        <div className="welcome-banner__lumi"><Lumi compact mood="reading" /></div>
        <div className="welcome-actions">
          <Link className="button button--yellow" to="/crear"><MagicWandIcon size={22} weight="duotone" /> Crear aventura</Link>
          <Link className="button button--outline" to="/recompensas"><GiftIcon size={22} weight="duotone" /> Premios y juegos · {rewards?.totalStars ?? 0}</Link>
        </div>
      </motion.section>

      <section className="student-quick-grid" aria-label="Resumen personal">
        <article><UsersThreeIcon size={30} weight="duotone" /><strong>{courses.length}</strong><span>{courses.length === 1 ? "curso" : "cursos"}</span></article>
        <article><StarFourIcon size={30} weight="fill" /><strong>{rewards?.mapStep ?? 0}/24</strong><span>hitos del atlas</span></article>
        <article><BellIcon size={30} weight="duotone" /><strong>{postcards.length}</strong><span>postales</span></article>
      </section>

      <div className="section-heading">
        <div><span className="eyebrow">Mis cursos</span><h2>Misiones compartidas</h2></div>
        <span className="count-badge"><GraduationCapIcon size={18} weight="duotone" /> {missions.length} activas</span>
      </div>
      {missions.length ? (
        <motion.section className="mission-grid" variants={staggerContainer} initial="hidden" animate="visible">
          {missions.map((mission) => (
            <motion.article className="mission-card" key={mission.missionId} whileHover={{ y: -6, rotate: -0.4 }}>
              <span className="mission-card__art"><StoryThemeIcon theme={mission.theme} size={54} /></span>
              <span className="pill">{mission.courseName}</span>
              <h3>{mission.title}</h3>
              <p>{mission.educationalObjective}</p>
              <Link className="button button--green" to={`/historias/${mission.storyId}`}>Comenzar misión <ArrowRightIcon /></Link>
            </motion.article>
          ))}
        </motion.section>
      ) : (
        <section className="empty-state"><BooksIcon size={64} weight="duotone" /><h2>Todavía no hay misiones</h2><p>Podés crear una aventura libre mientras llega la próxima.</p></section>
      )}

      <div className="section-heading library-heading">
        <div><span className="eyebrow">Mis cuentos</span><h2>Historias creadas por vos</h2></div>
        <span className="count-badge"><BooksIcon size={18} weight="duotone" /> {stories.length}</span>
      </div>
      {stories.length ? (
        <motion.section className="story-grid" aria-label="Biblioteca de historias" variants={staggerContainer} initial="hidden" animate="visible">
          {stories.map((story) => <StoryCard key={story.storyId} story={story} />)}
        </motion.section>
      ) : null}
    </div>
  );
}
