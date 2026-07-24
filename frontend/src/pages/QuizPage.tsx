import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  PathIcon,
  PaperPlaneTiltIcon,
  SparkleIcon,
  TreeStructureIcon,
} from "../components/icons";
import type { StoryPublic } from "@story-teacher/shared";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, ApiClientError } from "../api/client";
import { ErrorState, LoadingState } from "../components/PageState";
import { SkillBadge } from "../components/SkillBadge";
import { saveAttemptResult } from "../state/attemptStorage";
import { loadJourney } from "../story/interactiveStory";

const optionLetters = ["A", "B", "C", "D"];

export function QuizPage() {
  const { storyId = "" } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState<StoryPublic | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array.from({ length: 5 }, () => null));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const journey = loadJourney(storyId);
  const [showJourneyIntro, setShowJourneyIntro] = useState(() => Boolean(journey));
  const recordedStoryId = useRef<string | null>(null);

  const loadStory = useCallback(async () => {
    setError(null);
    try {
      setStory(await api.getStory(storyId));
    } catch (loadError) {
      setError(loadError instanceof ApiClientError ? loadError.message : "¡Ups! No pudimos preparar el desafío. Probemos de nuevo.");
    }
  }, [storyId]);

  useEffect(() => { void loadStory(); }, [loadStory]);
  useEffect(() => {
    if (!story?.courseId || recordedStoryId.current === story.storyId) return;
    recordedStoryId.current = story.storyId;
    void api.recordActivity(story.courseId, { storyId: story.storyId, ...(story.missionId ? { missionId: story.missionId } : {}), type: "quiz_started" }).catch(() => undefined);
  }, [story]);

  if (error && !story) return <ErrorState message={error} onRetry={loadStory} />;
  if (!story) return <LoadingState message="Preparando las preguntas…" />;

  if (journey && showJourneyIntro) {
    return (
      <div className="journey-quiz-intro page-width page-section">
        <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <h1>Recordá lo que leíste</h1>
          <p>Pensá en las decisiones que tomaste. Las preguntas son sobre lo que pasó en tu aventura.</p>
          {journey.checkpointStars ? <div className="journey-checkpoint-stars"><SparkleIcon weight="fill" /><strong>{journey.checkpointStars} estrellas de lectura para sumar</strong><span>Se agregan cuando termines las preguntas.</span></div> : null}
          <div className="journey-quiz-intro__path">{journey.decisions.map((decision, index) => <motion.article key={decision.choiceId} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * .12 }}><span>{index + 1}</span><div><small>{decision.sceneTitle}</small><strong>{decision.choiceLabel}</strong><p>{decision.consequence}</p></div>{index < journey.decisions.length - 1 ? <PathIcon /> : <CheckIcon weight="bold" />}</motion.article>)}</div>
          <div className="journey-quiz-intro__ending"><SparkleIcon weight="fill" /><div><span>El final que descubriste</span><h2>{journey.endingTitle}</h2><p>{journey.endingText}</p></div></div>
          <motion.button className="button button--yellow" type="button" onClick={() => setShowJourneyIntro(false)} whileHover={{ y: -4 }} whileTap={{ y: 2 }}>¡Empezar las preguntas! <ArrowRightIcon /></motion.button>
        </motion.section>
      </div>
    );
  }

  const loadedStory = story;
  const question = loadedStory.questions[current]!;
  const selected = answers[current];
  const progress = ((current + 1) / loadedStory.questions.length) * 100;

  function chooseAnswer(index: number) {
    setAnswers((previous) => {
      const nextAnswers = [...previous];
      nextAnswers[current] = index;
      return nextAnswers;
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
      const result = await api.submitAttempt(loadedStory.storyId, answers as number[], attemptId, journey?.checkpointStars ?? 0);
      saveAttemptResult(result);
      navigate(`/historias/${loadedStory.storyId}/resultados/${result.attemptId}`);
    } catch (submitError) {
      setError(submitError instanceof ApiClientError ? submitError.message : "¡Ups! No pudimos corregir el desafío. Probemos de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <div className="quiz-page page-width page-section">
      <div className="quiz-progress">
        <div className="quiz-progress__top">
          <strong><SparkleIcon size={18} weight="fill" /> ¡Vamos!</strong>
          <span>Pregunta {current + 1} de {loadedStory.questions.length}</span>
        </div>
        <div className="progress-track" role="progressbar" aria-valuemin={1} aria-valuemax={5} aria-valuenow={current + 1} aria-label={`Pregunta ${current + 1} de 5`}>
          <motion.span animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
        </div>
        <div className="progress-dots" aria-hidden="true">
          {loadedStory.questions.map((item, index) => (
            <motion.span key={item.questionId} className={index <= current ? "is-active" : ""} animate={index === current ? { scale: [1, 1.28, 1] } : {}} />
          ))}
        </div>
      </div>

      {journey ? <motion.div className="quiz-journey-ribbon" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}><TreeStructureIcon /><span><strong>Tu recorrido:</strong> {journey.decisions.map((decision) => decision.choiceLabel).join(" → ")}</span><button type="button" onClick={() => setShowJourneyIntro(true)}>Ver mapa</button></motion.div> : null}

      <AnimatePresence mode="wait">
        <motion.section
          className="question-panel"
          key={question.questionId}
          initial={{ opacity: 0, x: 34, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -34, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 170, damping: 22 }}
        >
          <SkillBadge skill={question.skill} />
          <h1>{question.statement}</h1>
          <div className="answer-grid" role="radiogroup" aria-label="Opciones">
            {question.options.map((option, index) => (
              <motion.button
                key={`${option}-${index}`}
                type="button"
                role="radio"
                aria-checked={selected === index}
                className={`answer-card ${selected === index ? "is-selected" : ""}`}
                onClick={() => chooseAnswer(index)}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.055 }}
                whileHover={{ y: -5, scale: 1.01 }}
                whileTap={{ y: 2, scale: 0.98 }}
              >
                <span className="answer-card__letter">{optionLetters[index]}</span>
                <span>{option}</span>
                <AnimatePresence>
                  {selected === index ? (
                    <motion.span className="answer-card__check" aria-hidden="true" initial={{ scale: 0, rotate: -60 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                      <CheckIcon size={17} weight="bold" />
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>

          {error ? <p className="form-error" role="alert">{error}</p> : null}

          <div className="quiz-actions">
            <button className="button button--outline" type="button" disabled={current === 0 || submitting} onClick={() => setCurrent((value) => value - 1)}>
              <ArrowLeftIcon size={20} weight="bold" /> Anterior
            </button>
            <motion.button className="button button--green" type="button" disabled={selected === null || submitting} onClick={() => void next()} whileHover={selected !== null ? { y: -3 } : {}} whileTap={selected !== null ? { y: 3 } : {}}>
              {submitting ? "Revisando…" : current === loadedStory.questions.length - 1 ? <><PaperPlaneTiltIcon size={21} weight="duotone" /> Ver resultado</> : <>Siguiente <ArrowRightIcon size={20} weight="bold" /></>}
            </motion.button>
          </div>
        </motion.section>
      </AnimatePresence>
    </div>
  );
}
