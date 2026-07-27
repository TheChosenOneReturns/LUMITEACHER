import {
  storyInputSchema,
  type Difficulty,
  type GenerateStoryInput,
} from "@story-teacher/shared";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  api,
  ApiClientError,
  type MissionPreview,
} from "../api/client";
import {
  ArrowLeftIcon,
  BookOpenTextIcon,
  CheckCircleIcon,
  EyeIcon,
  GraduationCapIcon,
  MagicWandIcon,
  ShieldCheckIcon,
  SparkleIcon,
} from "../components/icons";

const generationPhases = [
  "Imaginando la historia",
  "Construyendo el desafío",
  "Revisando las preguntas",
  "Preparando la vista previa",
] as const;

export function CreateMissionPage() {
  const { courseId = "" } = useParams();
  const navigate = useNavigate();
  const [age, setAge] = useState(9);
  const [theme, setTheme] = useState("Espacio");
  const [difficulty, setDifficulty] = useState<Difficulty>("media");
  const [objective, setObjective] = useState(
    "Distinguir causas y consecuencias en una aventura",
  );
  const [maxWords, setMaxWords] =
    useState<GenerateStoryInput["maxWords"]>(800);
  const [character, setCharacter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [generationPhase, setGenerationPhase] = useState(0);
  const [preview, setPreview] = useState<MissionPreview | null>(null);

  useEffect(() => {
    if (!generating) return;
    const timer = window.setInterval(
      () =>
        setGenerationPhase((current) =>
          Math.min(current + 1, generationPhases.length - 1),
        ),
      1_900,
    );
    return () => window.clearInterval(timer);
  }, [generating]);

  async function generatePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const input: GenerateStoryInput = {
      age,
      theme: theme.trim(),
      difficulty,
      educationalObjective: objective.trim(),
      maxWords,
      mainCharacter: character.trim() || null,
    };
    const parsed = storyInputSchema.safeParse(input);
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ?? "Revisá los datos de la misión.",
      );
      return;
    }

    setGenerationPhase(0);
    setGenerating(true);
    try {
      setPreview(await api.createMissionPreview(courseId, parsed.data));
    } catch (createError) {
      setError(
        createError instanceof ApiClientError
          ? createError.message
          : "No pudimos generar la vista previa.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function publishMission() {
    if (!preview) return;
    setError(null);
    setPublishing(true);
    try {
      await api.createMission(courseId, preview.generationId);
      navigate(`/adulto/cursos/${courseId}`);
    } catch (publishError) {
      setError(
        publishError instanceof ApiClientError
          ? publishError.message
          : "No pudimos publicar la misión.",
      );
      setPublishing(false);
    }
  }

  function editMission() {
    setPreview(null);
    setError(null);
  }

  return (
    <div className="page-width page-section mission-create">
      <motion.div
        className="page-title"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="pill">
          <GraduationCapIcon weight="duotone" /> Misión para el curso
        </span>
        <h1>
          {preview ? "Revisá antes de publicar" : "Diseñá el próximo desafío"}
        </h1>
        <p>
          {preview
            ? "Este borrador todavía no es visible para el alumnado."
            : "Lumi convierte estos objetivos en un cuento y cinco preguntas."}
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {preview ? (
          <motion.section
            className="mission-preview"
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <header className="mission-preview__status">
              <span>
                <EyeIcon weight="duotone" /> Vista previa privada
              </span>
              <small>Sin publicar</small>
            </header>

            <div className="mission-preview__layout">
              <article className="mission-preview__story">
                <span className="eyebrow">
                  <BookOpenTextIcon weight="duotone" /> Historia generada
                </span>
                <h2>{preview.story.title}</h2>
                <div className="mission-preview__metadata">
                  <span>{preview.story.input.theme}</span>
                  <span>{preview.story.input.age} años</span>
                  <span>{preview.story.input.maxWords} palabras máx.</span>
                </div>
                <div className="mission-preview__copy">
                  {preview.story.story
                    .split(/\n{2,}/u)
                    .filter(Boolean)
                    .map((paragraph, index) => (
                      <p key={`${index}-${paragraph.slice(0, 20)}`}>
                        {paragraph}
                      </p>
                    ))}
                </div>
              </article>

              <aside className="mission-preview__questions">
                <span className="eyebrow">
                  <SparkleIcon weight="fill" /> Desafío de comprensión
                </span>
                <h2>Las 5 preguntas</h2>
                <ol>
                  {preview.story.questions.map((question, index) => (
                    <li key={question.questionId}>
                      <span>{index + 1}</span>
                      <div>
                        <strong>{question.statement}</strong>
                        <small>{question.options.join(" · ")}</small>
                      </div>
                    </li>
                  ))}
                </ol>
              </aside>
            </div>

            <div className="mission-preview__objective">
              <ShieldCheckIcon weight="duotone" />
              <span>
                <small>Objetivo educativo</small>
                <strong>{preview.story.input.educationalObjective}</strong>
              </span>
            </div>

            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}

            <footer className="mission-preview__actions">
              <button
                className="button button--outline"
                type="button"
                disabled={publishing}
                onClick={editMission}
              >
                <ArrowLeftIcon weight="bold" /> Ajustar y generar otra
              </button>
              <button
                className="button button--yellow"
                type="button"
                disabled={publishing}
                onClick={() => void publishMission()}
              >
                <CheckCircleIcon weight="fill" />
                {publishing ? "Publicando…" : "Publicar en el curso"}
              </button>
            </footer>
          </motion.section>
        ) : (
          <motion.form
            className="mission-form"
            key="form"
            onSubmit={generatePreview}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <div className="mission-form__grid">
              <label className="text-field">
                <span>Edad orientativa</span>
                <select
                  value={age}
                  onChange={(event) => setAge(Number(event.target.value))}
                >
                  {[6, 7, 8, 9, 10, 11, 12].map((value) => (
                    <option key={value} value={value}>
                      {value} años
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-field">
                <span>Tema</span>
                <input
                  value={theme}
                  maxLength={60}
                  onChange={(event) => setTheme(event.target.value)}
                />
              </label>
              <label className="text-field">
                <span>Dificultad</span>
                <select
                  value={difficulty}
                  onChange={(event) =>
                    setDifficulty(event.target.value as Difficulty)
                  }
                >
                  <option value="facil">Fácil</option>
                  <option value="media">Media</option>
                  <option value="desafio">Desafío</option>
                </select>
              </label>
              <label className="text-field">
                <span>Extensión</span>
                <select
                  value={maxWords}
                  onChange={(event) =>
                    setMaxWords(
                      Number(
                        event.target.value,
                      ) as GenerateStoryInput["maxWords"],
                    )
                  }
                >
                  <option value={300}>Breve · hasta 300 palabras</option>
                  <option value={800}>Por capítulos · hasta 800</option>
                  <option value={1200}>Gran travesía · hasta 1200</option>
                </select>
              </label>
            </div>
            <label className="text-field">
              <span>Objetivo educativo</span>
              <textarea
                rows={4}
                minLength={5}
                maxLength={160}
                value={objective}
                onChange={(event) => setObjective(event.target.value)}
              />
            </label>
            <label className="text-field">
              <span>Protagonista opcional</span>
              <input
                maxLength={60}
                value={character}
                placeholder="Ej.: una zorra inventora llamada Nara"
                onChange={(event) => setCharacter(event.target.value)}
              />
            </label>
            <p className="privacy-hint">
              <ShieldCheckIcon weight="duotone" /> La historia se genera con
              datos pedagógicos, no con datos personales del alumnado.
            </p>

            {generating ? (
              <motion.div
                className="mission-generation"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                aria-live="polite"
              >
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                >
                  <SparkleIcon weight="fill" />
                </motion.span>
                <div>
                  <strong>{generationPhases[generationPhase]}</strong>
                  <small>
                    La generación puede tardar unos minutos. No cierres esta
                    pantalla.
                  </small>
                </div>
                <div className="mission-generation__progress">
                  <motion.i
                    animate={{
                      width: `${25 + generationPhase * 24}%`,
                    }}
                  />
                </div>
              </motion.div>
            ) : null}

            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}
            <button
              className="button button--yellow"
              disabled={generating}
              type="submit"
            >
              <MagicWandIcon weight="duotone" />
              {generating ? "Generando vista previa…" : "Generar vista previa"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
