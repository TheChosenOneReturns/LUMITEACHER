import { useCallback, useEffect, useState } from "react";
import type { StoryPublic } from "@story-teacher/shared";
import { useNavigate, useParams } from "react-router-dom";
import { api, ApiClientError } from "../api/client";
import { ErrorState, LoadingState } from "../components/PageState";
import { SkillBadge } from "../components/SkillBadge";
import { saveAttemptResult } from "../state/attemptStorage";

const optionLetters = ["A", "B", "C", "D"];

export function QuizPage() {
  const { storyId = "" } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState<StoryPublic | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array.from({ length: 5 }, () => null),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStory = useCallback(async () => {
    setError(null);
    try {
      setStory(await api.getStory(storyId));
    } catch (loadError) {
      setError(
        loadError instanceof ApiClientError
          ? loadError.message
          : "No pudimos preparar el desafío.",
      );
    }
  }, [storyId]);

  useEffect(() => {
    void loadStory();
  }, [loadStory]);

  if (error && !story) return <ErrorState message={error} onRetry={loadStory} />;
  if (!story) return <LoadingState message="Preparando cinco preguntas…" />;

  const loadedStory = story;
  const question = loadedStory.questions[current]!;
  const selected = answers[current];
  const progress = ((current + 1) / loadedStory.questions.length) * 100;

  function chooseAnswer(index: number) {
    setAnswers((previous) => {
      const next = [...previous];
      next[current] = index;
      return next;
    });
  }

  async function next() {
    if (selected === null) return;
    if (current < loadedStory.questions.length - 1) {
      setCurrent((value) => value + 1);
      return;
    }

    if (answers.some((answer) => answer === null)) return;
    setSubmitting(true);
    setError(null);
    try {
      const attemptId = crypto.randomUUID();
      const result = await api.submitAttempt(
        loadedStory.storyId,
        answers as number[],
        attemptId,
      );
      saveAttemptResult(result);
      navigate(
        `/historias/${loadedStory.storyId}/resultados/${result.attemptId}`,
      );
    } catch (submitError) {
      setError(
        submitError instanceof ApiClientError
          ? submitError.message
          : "No pudimos corregir el desafío.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="quiz-page page-width page-section">
      <div className="quiz-progress">
        <div className="quiz-progress__top">
          <strong>Misión en progreso</strong>
          <span>Pregunta {current + 1} de {loadedStory.questions.length}</span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={5}
          aria-valuenow={current + 1}
          aria-label={`Pregunta ${current + 1} de 5`}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <section className="question-panel">
        <SkillBadge skill={question.skill} />
        <h1>{question.statement}</h1>
        <div className="answer-grid" role="radiogroup" aria-label="Opciones">
          {question.options.map((option, index) => (
            <button
              key={`${option}-${index}`}
              type="button"
              role="radio"
              aria-checked={selected === index}
              className={`answer-card ${selected === index ? "is-selected" : ""}`}
              onClick={() => chooseAnswer(index)}
            >
              <span className="answer-card__letter">{optionLetters[index]}</span>
              <span>{option}</span>
              {selected === index ? (
                <span className="answer-card__check" aria-hidden="true">✓</span>
              ) : null}
            </button>
          ))}
        </div>

        {error ? <p className="form-error" role="alert">{error}</p> : null}

        <div className="quiz-actions">
          <button
            className="button button--outline"
            type="button"
            disabled={current === 0 || submitting}
            onClick={() => setCurrent((value) => value - 1)}
          >
            ← Anterior
          </button>
          <button
            className="button button--green"
            type="button"
            disabled={selected === null || submitting}
            onClick={() => void next()}
          >
            {submitting
              ? "Corrigiendo…"
              : current === loadedStory.questions.length - 1
                ? "Ver resultado"
                : "Siguiente →"}
          </button>
        </div>
      </section>
    </div>
  );
}
