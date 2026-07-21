import { useCallback, useEffect, useState } from "react";
import type { StoryPublic } from "@story-teacher/shared";
import { Link, useParams } from "react-router-dom";
import { api, ApiClientError } from "../api/client";
import { Lumi } from "../components/Lumi";
import { ErrorState, LoadingState } from "../components/PageState";
import { SkillBadge } from "../components/SkillBadge";
import { loadAttemptResult } from "../state/attemptStorage";

export function ResultsPage() {
  const { storyId = "", attemptId = "" } = useParams();
  const [result] = useState(() => loadAttemptResult(attemptId));
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
          : "No pudimos abrir el resultado.",
      );
    }
  }, [storyId]);

  useEffect(() => {
    if (result) void loadStory();
  }, [loadStory, result]);

  if (!result) {
    return (
      <ErrorState message="Este resultado ya no está en esta sesión. Podés abrir la historia y hacer el desafío nuevamente." />
    );
  }
  if (error) return <ErrorState message={error} onRetry={loadStory} />;
  if (!story) return <LoadingState message="Preparando tu resultado…" />;

  const message =
    result.correctCount === 5
      ? "¡Excelente lectura! Encontraste todas las pistas."
      : result.correctCount >= 3
        ? "¡Muy buen trabajo! Cada historia te ayuda a mejorar."
        : "¡Buen intento! Revisemos las pistas y probemos otra vez.";

  return (
    <div className="results-page page-width page-section">
      <section className="celebration">
        <div className="celebration__stars" aria-hidden="true">★ ✦ ★</div>
        <span className="pill">Desafío completado</span>
        <h1>¡Increíble trabajo, Sofía!</h1>
        <p>{message}</p>
        <div className="score-orb" aria-label={`${result.correctCount} de 5 correctas`}>
          <strong>{result.correctCount}/5</strong>
          <small>{result.scorePercent}%</small>
        </div>
      </section>

      <section className="skills-result">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Tus habilidades</span>
            <h2>Las pistas que descubriste</h2>
          </div>
          <Lumi compact message="¡Cada intento cuenta!" />
        </div>

        <div className="result-list">
          {result.results.map((questionResult, index) => {
            const question = story.questions[index]!;
            return (
              <details className="result-item" key={questionResult.questionId}>
                <summary>
                  <SkillBadge skill={questionResult.skill} />
                  <span
                    className={questionResult.isCorrect ? "status-success" : "status-practice"}
                  >
                    {questionResult.isCorrect ? "✓ Logrado" : "↻ A practicar"}
                  </span>
                </summary>
                <div className="result-item__details">
                  <h3>{question.statement}</h3>
                  <p>
                    <strong>Tu respuesta:</strong>{" "}
                    {question.options[questionResult.selectedAnswer]}
                  </p>
                  {!questionResult.isCorrect ? (
                    <p>
                      <strong>Respuesta correcta:</strong>{" "}
                      {question.options[questionResult.correctAnswer]}
                    </p>
                  ) : null}
                  <p className="explanation">💡 {questionResult.explanation}</p>
                </div>
              </details>
            );
          })}
        </div>
      </section>

      <div className="button-row button-row--center">
        <Link className="button button--green" to="/crear">
          ✨ Crear otra aventura
        </Link>
        <Link className="button button--outline" to="/inicio">
          📚 Ver biblioteca
        </Link>
      </div>
    </div>
  );
}
