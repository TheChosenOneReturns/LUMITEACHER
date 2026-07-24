import {
  ArrowClockwiseIcon,
  BooksIcon,
  CheckCircleIcon,
  LightbulbFilamentIcon,
  MagicWandIcon,
  SparkleIcon,
  StarFourIcon,
} from "../components/icons";
import { platformCatalog, type AttemptResult, type StoryPublic } from "@story-teacher/shared";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiClientError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Lumi } from "../components/Lumi";
import { ErrorState, LoadingState } from "../components/PageState";
import { SkillBadge } from "../components/SkillBadge";
import { loadAttemptResult } from "../state/attemptStorage";
import { loadJourney } from "../story/interactiveStory";

export function ResultsPage() {
  const { storyId = "", attemptId = "" } = useParams();
  const { profile } = useAuth();
  const [result, setResult] = useState<AttemptResult | null>(() => loadAttemptResult(attemptId));
  const [story, setStory] = useState<StoryPublic | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStory = useCallback(async () => {
    setError(null);
    try {
      setStory(await api.getStory(storyId));
    } catch (loadError) {
      setError(loadError instanceof ApiClientError ? loadError.message : "¡Ups! No pudimos abrir el resultado. Probemos de nuevo.");
    }
  }, [storyId]);

  useEffect(() => {
    let active = true;
    if (result) {
      void loadStory();
      return () => { active = false; };
    }
    void api.getAttempt(attemptId)
      .then((stored) => { if (active) setResult(stored); })
      .catch((loadError) => { if (active) setError(loadError instanceof ApiClientError ? loadError.message : "¡Ups! No pudimos recuperar el resultado."); });
    return () => { active = false; };
  }, [attemptId, loadStory, result]);

  if (error) return <ErrorState message={error} onRetry={loadStory} />;
  if (!result || !story) return <LoadingState message="Preparando tu resultado…" />;
  const journey = loadJourney(storyId);

  const message = result.correctCount === 5
    ? "¡Increíble! Encontraste todas las pistas como un gran detective."
    : result.correctCount >= 3
      ? "¡Muy bien! Cada historia te hace más fuerte."
      : "¡Buen intento! La próxima vez vas a descubrir más pistas.";

  return (
    <div className="results-page page-width page-section">
      <section className="celebration">
        <div className="celebration__confetti" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <motion.span key={index} initial={{ opacity: 0, y: 10, scale: 0 }} animate={{ opacity: [0, 1, 0.65], y: [-10, -55 - index * 6], x: (index - 2.5) * 55, rotate: index * 65, scale: 1 }} transition={{ duration: 1.4, delay: index * 0.07 }}>
              {index % 2 === 0 ? <SparkleIcon weight="fill" /> : <StarFourIcon weight="duotone" />}
            </motion.span>
          ))}
        </div>
        <motion.span className="pill" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><CheckCircleIcon weight="fill" /> Desafío completado</motion.span>
        <motion.h1 initial={{ opacity: 0, scale: 0.82 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 180, damping: 16, delay: 0.1 }}>
          Increíble trabajo, {profile!.displayName}
        </motion.h1>
        <p>{message}</p>
        <motion.div className="score-orb" aria-label={`${result.correctCount} de 5 correctas`} initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 170, damping: 13, delay: 0.24 }}>
          <svg viewBox="0 0 120 120" aria-hidden="true"><motion.circle cx="60" cy="60" r="52" pathLength="100" initial={{ pathLength: 0 }} animate={{ pathLength: result.scorePercent / 100 }} transition={{ duration: 1.1, delay: 0.4, ease: "easeOut" }} /></svg>
          <div><strong>{result.correctCount}/5</strong><small>{result.scorePercent}%</small></div>
        </motion.div>
      </section>

      {result.rewardGrant ? <motion.section className="reward-unlock" initial={{ opacity: 0, y: 18, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
        <StarFourIcon size={38} weight="fill" />
        <div><span className="eyebrow">{result.rewardGrant.starsEarned ? "Recompensa del cuento" : "Nuevo dominio alcanzado"}</span><h2>{result.rewardGrant.starsEarned ? `Ganaste ${result.rewardGrant.starsEarned} estrellas` : "¡Tu esfuerzo hizo avanzar el mapa!"}</h2><p>{result.rewardGrant.mapAdvanced ? `Llegaste al hito ${result.rewardGrant.worldStep} de ${platformCatalog.worlds.find((world) => world.id === result.rewardGrant?.worldId)?.label ?? "tu mundo"}.` : result.scorePercent < 60 ? "Alcanzá 60% en un próximo intento para avanzar el mundo." : "Este mundo ya está completo: sumaste una nueva carga."}{result.rewardGrant.cardCopiesGranted.length ? " Tu mochila recibió una carta de poder." : ""}{result.rewardGrant.newlyUnlockedAvatarIds.length ? " También apareció un nuevo personaje." : ""}</p></div>
        <Link className="button button--yellow" to="/recompensas">Ver recompensas</Link>
      </motion.section> : null}

      {journey ? <motion.section className="result-journey" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}><div><span className="eyebrow">El camino que creaste</span><h2>{journey.endingTitle}</h2><p>{journey.endingText}</p></div><ol>{journey.decisions.map((decision) => <li key={decision.choiceId}><CheckCircleIcon weight="fill" /><span><strong>{decision.choiceLabel}</strong><small>{decision.consequence}</small></span></li>)}</ol></motion.section> : null}

      <motion.section className="skills-result" initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <div className="section-heading">
          <div><span className="eyebrow">Tus habilidades</span><h2>Las pistas que descubriste</h2></div>
          <Lumi compact message="Cada intento cuenta." />
        </div>
        <div className="result-list">
          {result.results.map((questionResult, index) => {
            const question = story.questions[index]!;
            return (
              <motion.details className="result-item" key={questionResult.questionId} initial={{ opacity: 0, x: -15 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.06 }}>
                <summary>
                  <SkillBadge skill={questionResult.skill} />
                  <span className={questionResult.isCorrect ? "status-success" : "status-practice"}>
                    {questionResult.isCorrect ? <CheckCircleIcon size={19} weight="fill" /> : <ArrowClockwiseIcon size={19} weight="bold" />}
                    {questionResult.isCorrect ? "Logrado" : "A practicar"}
                  </span>
                </summary>
                <div className="result-item__details">
                  <h3>{question.statement}</h3>
                  <p><strong>Tu respuesta:</strong> {question.options[questionResult.selectedAnswer]}</p>
                  {!questionResult.isCorrect ? <p><strong>Respuesta correcta:</strong> {question.options[questionResult.correctAnswer]}</p> : null}
                  <p className="explanation"><LightbulbFilamentIcon size={24} weight="duotone" /> <span>{questionResult.explanation}</span></p>
                </div>
              </motion.details>
            );
          })}
        </div>
      </motion.section>

      <div className="button-row button-row--center">
        <Link className="button button--green" to="/crear"><MagicWandIcon size={21} weight="duotone" /> Crear otra aventura</Link>
        <Link className="button button--outline" to="/inicio"><BooksIcon size={21} weight="duotone" /> Ver biblioteca</Link>
      </div>
    </div>
  );
}
