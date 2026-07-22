import {
  CheckIcon,
  ClockIcon,
  MagicWandIcon,
  PencilSimpleIcon,
  ShieldCheckIcon,
  SparkleIcon,
} from "../components/icons";
import {
  storyInputSchema,
  type Difficulty,
  type GenerateStoryInput,
} from "@story-teacher/shared";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiClientError } from "../api/client";
import { Lumi } from "../components/Lumi";
import { riseItem, staggerContainer } from "../components/MotionPrimitives";
import { difficultyIcons, StoryThemeIcon } from "../components/VisualIcons";

const themes = ["Espacio", "Fantasía", "Océano", "Selva"];
const difficultyOptions: { value: Difficulty; label: string; hint: string }[] = [
  { value: "facil", label: "Fácil", hint: "Pistas directas" },
  { value: "media", label: "Media", hint: "Un poco de misterio" },
  { value: "desafio", label: "Desafío", hint: "Para grandes detectives" },
];

interface StoryPreset extends GenerateStoryInput {
  id: string;
  title: string;
  description: string;
}

const storyPresets: StoryPreset[] = [
  {
    id: "estacion-luz",
    title: "La estación sin luz",
    description: "Una misión espacial sobre colaboración.",
    age: 8,
    theme: "Espacio",
    difficulty: "media",
    educationalObjective: "Comprender por qué colaborar ayuda a resolver problemas",
    maxWords: 300,
    mainCharacter: "Luna, una gata astronauta curiosa",
  },
  {
    id: "semilla-perdida",
    title: "La semilla perdida",
    description: "Una aventura breve para cuidar la naturaleza.",
    age: 7,
    theme: "Selva",
    difficulty: "facil",
    educationalObjective: "Reconocer cómo nuestras acciones pueden cuidar la naturaleza",
    maxWords: 150,
    mainCharacter: "Tilo, un pequeño guardián del bosque",
  },
  {
    id: "invento-submarino",
    title: "El invento submarino",
    description: "Un desafío de causa y efecto bajo el mar.",
    age: 10,
    theme: "Océano",
    difficulty: "desafio",
    educationalObjective: "Analizar causas y consecuencias para encontrar soluciones sustentables",
    maxWords: 500,
    mainCharacter: "Nico, un inventor que conversa con las ballenas",
  },
];

function SelectionMark() {
  return (
    <motion.span
      className="choice-indicator"
      initial={{ scale: 0, rotate: -80 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, rotate: 80 }}
      transition={{ type: "spring", stiffness: 360, damping: 18 }}
    >
      <CheckIcon size={14} weight="bold" />
    </motion.span>
  );
}

export function CreateStoryPage() {
  const navigate = useNavigate();
  const [age, setAge] = useState(8);
  const [theme, setTheme] = useState("Espacio");
  const [customTheme, setCustomTheme] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("media");
  const [educationalObjective, setEducationalObjective] = useState(
    "Comprender por qué colaborar ayuda a resolver problemas",
  );
  const [maxWords, setMaxWords] = useState<150 | 300 | 500>(300);
  const [mainCharacter, setMainCharacter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedPreset, setLoadedPreset] = useState<string | null>(null);

  function applyPreset(preset: StoryPreset) {
    setAge(preset.age);
    setTheme(preset.theme);
    setCustomTheme(themes.includes(preset.theme) ? "" : preset.theme);
    setDifficulty(preset.difficulty);
    setEducationalObjective(preset.educationalObjective);
    setMaxWords(preset.maxWords);
    setMainCharacter(preset.mainCharacter ?? "");
    setLoadedPreset(preset.id);
    setError(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const candidate: GenerateStoryInput = {
      age,
      theme: customTheme.trim() || theme,
      difficulty,
      educationalObjective: educationalObjective.trim(),
      maxWords,
      mainCharacter: mainCharacter.trim() || null,
    };
    const validation = storyInputSchema.safeParse(candidate);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "Revisá los datos.");
      return;
    }

    setLoading(true);
    try {
      const story = await api.createStory(validation.data);
      navigate(`/historias/${story.storyId}`);
    } catch (createError) {
      setError(createError instanceof ApiClientError ? createError.message : "No pudimos crear la aventura.");
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="generation-state page-width" aria-live="polite">
        <div className="magic-orbit" aria-hidden="true">
          <motion.span animate={{ rotate: 360 }} transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}>
            <SparkleIcon size={36} weight="fill" />
          </motion.span>
          <Lumi />
          <motion.span animate={{ rotate: -360 }} transition={{ duration: 9, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}>
            <MagicWandIcon size={38} weight="duotone" />
          </motion.span>
        </div>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>Lumi está imaginando tu aventura…</motion.h1>
        <p>Mezclando personajes, pistas y cinco preguntas especiales.</p>
        <div className="indeterminate-bar"><motion.span animate={{ x: ["-110%", "260%"] }} transition={{ duration: 1.45, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }} /></div>
      </section>
    );
  }

  return (
    <div className="page-width page-section create-page">
      <motion.div className="page-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <span className="pill"><MagicWandIcon size={18} weight="duotone" /> Laboratorio de historias</span>
        <h1>Construyamos un mundo</h1>
        <p>Elegí cada ingrediente. Lumi se ocupa de darles vida.</p>
      </motion.div>

      <motion.section
        className="preset-lab"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 150, damping: 22, delay: 0.08 }}
        aria-labelledby="preset-title"
      >
        <div className="preset-lab__heading">
          <div>
            <span className="eyebrow"><SparkleIcon size={16} weight="fill" /> Pruebas rápidas</span>
            <h2 id="preset-title">Cuentos listos para probar</h2>
          </div>
          <p>Elegí una receta y completamos todos los ingredientes.</p>
        </div>
        <div className="preset-grid">
          {storyPresets.map((preset) => {
            const selected = loadedPreset === preset.id;
            return (
              <motion.button
                key={preset.id}
                className={`preset-card ${selected ? "is-selected" : ""}`}
                type="button"
                aria-label={`Cargar prueba ${preset.title}`}
                aria-pressed={selected}
                onClick={() => applyPreset(preset)}
                whileHover={{ y: -5, rotate: -0.5 }}
                whileTap={{ y: 2, scale: 0.98 }}
              >
                <span className="preset-card__icon"><StoryThemeIcon theme={preset.theme} size={38} /></span>
                <span className="preset-card__copy">
                  <strong>{preset.title}</strong>
                  <small>{preset.description}</small>
                  <span>{preset.age} años · {preset.maxWords} palabras</span>
                </span>
                <AnimatePresence>{selected ? <SelectionMark /> : null}</AnimatePresence>
              </motion.button>
            );
          })}
        </div>
        <AnimatePresence mode="wait">
          {loadedPreset ? (
            <motion.p
              className="preset-status"
              role="status"
              key={loadedPreset}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
            >
              <CheckIcon size={17} weight="bold" /> Prueba cargada. Podés cambiar cualquier ingrediente antes de crearla.
            </motion.p>
          ) : null}
        </AnimatePresence>
      </motion.section>

      <motion.form
        className="story-form"
        onSubmit={submit}
        noValidate
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.fieldset className="form-card form-card--blue" variants={riseItem}>
          <legend><span>1</span> Edad</legend>
          <p className="field-help">La aventura adapta sus palabras y desafíos.</p>
          <div className="tile-row tile-row--ages">
            {[6, 7, 8, 9, 10, 11, 12].map((value) => (
              <motion.button
                key={value}
                className={`choice-tile ${age === value ? "is-selected" : ""}`}
                type="button"
                aria-pressed={age === value}
                onClick={() => setAge(value)}
                whileHover={{ y: -4 }}
                whileTap={{ y: 2, scale: 0.95 }}
              >
                {value}<small>años</small>
                <AnimatePresence>{age === value ? <SelectionMark /> : null}</AnimatePresence>
              </motion.button>
            ))}
          </div>
        </motion.fieldset>

        <motion.fieldset className="form-card form-card--green" variants={riseItem}>
          <legend><span>2</span> Mundo</legend>
          <p className="field-help">¿Dónde sucede la aventura?</p>
          <div className="tile-row tile-row--themes">
            {themes.map((option) => {
              const selected = theme === option && !customTheme;
              return (
                <motion.button
                  key={option}
                  className={`choice-tile choice-tile--theme ${selected ? "is-selected" : ""}`}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => { setTheme(option); setCustomTheme(""); }}
                  whileHover={{ y: -5, rotate: -1 }}
                  whileTap={{ y: 2, scale: 0.96 }}
                >
                  <StoryThemeIcon theme={option} size={34} />
                  {option}
                  <AnimatePresence>{selected ? <SelectionMark /> : null}</AnimatePresence>
                </motion.button>
              );
            })}
          </div>
          <label className="text-field">
            <span>Otro mundo</span>
            <div className="input-with-icon"><PencilSimpleIcon size={21} weight="duotone" /><input value={customTheme} maxLength={60} placeholder="Ej.: inventos, música o dinosaurios" onChange={(event) => setCustomTheme(event.target.value)} /></div>
          </label>
        </motion.fieldset>

        <motion.section className="form-card form-card--yellow" variants={riseItem}>
          <div className="section-legend"><span>3</span> Misión de aprendizaje</div>
          <label className="text-field">
            <span>¿Qué te gustaría practicar o aprender?</span>
            <textarea value={educationalObjective} minLength={5} maxLength={160} rows={3} required onChange={(event) => setEducationalObjective(event.target.value)} />
          </label>
          <p className="privacy-hint"><ShieldCheckIcon size={18} weight="duotone" /> No escribas nombres completos ni datos personales.</p>
        </motion.section>

        <motion.div className="form-columns" variants={riseItem}>
          <fieldset className="form-card form-card--coral">
            <legend><span>4</span> Dificultad</legend>
            <div className="stacked-options">
              {difficultyOptions.map((option) => {
                const Icon = difficultyIcons[option.value];
                return (
                  <motion.button
                    type="button"
                    key={option.value}
                    className={`wide-choice ${difficulty === option.value ? "is-selected" : ""}`}
                    aria-pressed={difficulty === option.value}
                    onClick={() => setDifficulty(option.value)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon size={27} weight="duotone" /><span><strong>{option.label}</strong><small>{option.hint}</small></span>
                    <AnimatePresence>{difficulty === option.value ? <SelectionMark /> : null}</AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="form-card form-card--gold">
            <legend><span>5</span> Extensión</legend>
            <div className="stacked-options">
              {[
                { value: 150 as const, label: "Corta", hint: "Hasta 150 palabras" },
                { value: 300 as const, label: "Media", hint: "Hasta 300 palabras" },
                { value: 500 as const, label: "Larga", hint: "Hasta 500 palabras" },
              ].map((option) => (
                <motion.button
                  type="button"
                  key={option.value}
                  className={`wide-choice ${maxWords === option.value ? "is-selected" : ""}`}
                  aria-pressed={maxWords === option.value}
                  onClick={() => setMaxWords(option.value)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ClockIcon size={27} weight="duotone" /><span><strong>{option.label}</strong><small>{option.hint}</small></span>
                  <AnimatePresence>{maxWords === option.value ? <SelectionMark /> : null}</AnimatePresence>
                </motion.button>
              ))}
            </div>
          </fieldset>
        </motion.div>

        <motion.section className="form-card" variants={riseItem}>
          <div className="section-legend"><span>6</span> Protagonista opcional</div>
          <label className="text-field">
            <span>¿Quién será el héroe de la aventura?</span>
            <div className="input-with-icon"><PencilSimpleIcon size={21} weight="duotone" /><input value={mainCharacter} maxLength={60} placeholder="Ej.: una gata astronauta llamada Luna" onChange={(event) => setMainCharacter(event.target.value)} /></div>
          </label>
        </motion.section>

        <AnimatePresence>{error ? <motion.p className="form-error" role="alert" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{error}</motion.p> : null}</AnimatePresence>

        <motion.button className="button button--yellow form-submit" type="submit" variants={riseItem} whileHover={{ y: -4, scale: 1.02 }} whileTap={{ y: 3, scale: 0.98 }}>
          <MagicWandIcon size={24} weight="duotone" /> Crear aventura
        </motion.button>
      </motion.form>
    </div>
  );
}
