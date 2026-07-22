import {
  ArrowClockwiseIcon,
  BooksIcon,
  CheckCircleIcon,
  LightbulbFilamentIcon,
  MagicWandIcon,
  SparkleIcon,
  StarFourIcon,
} from "../components/icons";
import type { StoryPublic } from "@story-teacher/shared";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiClientError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Lumi } from "../components/Lumi";
import { ErrorState, LoadingState } from "../components/PageState";
import { SkillBadge } from "../components/SkillBadge";
import { loadAttemptResult } from "../state/attemptStorage";

export function ResultsPage() {
  const { storyId = "", attemptId = "" } = useParams();
  const { profile } = useAuth();
  const [result] = useState(() => loadAttemptResult(attemptId));
  const [story, setStory] = useState<StoryPublic | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStory = useCallback(async () => {
    setError(null);
    try {
      setStory(await api.getStory(storyId));
    } catch (loadError) {
      setError(loadError instanceof ApiClientError ? loadError.message : "No pudimos abrir el resultado.");
    }
  }, [storyId]);

  useEffect(() => { if (result) void loadStory(); }, [loadStory, result]);

  if (!result) return <ErrorState message="Este resultado ya no está en esta sesión. Podés abrir la historia y hacer el desafío nuevamente." />;
  if (error) return <ErrorState message={error} onRetry={loadStory} />;
  if (!story) return <LoadingState message="Preparando tu resultado…" />;

  const message = result.correctCount === 5
    ? "Excelente lectura. Encontraste todas las pistas."
    : result.correctCount >= 3
      ? "Muy buen trabajo. Cada historia te ayuda a mejorar."
      : "Buen intento. Revisemos las pistas y probemos otra vez.";

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
          Increíble trabajo, {profile!.name}
        </motion.h1>
        <p>{message}</p>
        <motion.div className="score-orb" aria-label={`${result.correctCount} de 5 correctas`} initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 170, damping: 13, delay: 0.24 }}>
          <svg viewBox="0 0 120 120" aria-hidden="true"><motion.circle cx="60" cy="60" r="52" pathLength="100" initial={{ pathLength: 0 }} animate={{ pathLength: result.scorePercent / 100 }} transition={{ duration: 1.1, delay: 0.4, ease: "easeOut" }} /></svg>
          <div><strong>{result.correctCount}/5</strong><small>{result.scorePercent}%</small></div>
        </motion.div>
      </section>

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
