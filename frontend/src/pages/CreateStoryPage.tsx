import { useState, type FormEvent } from "react";
import {
  storyInputSchema,
  type Difficulty,
  type GenerateStoryInput,
} from "@story-teacher/shared";
import { useNavigate } from "react-router-dom";
import { api, ApiClientError } from "../api/client";
import { Lumi } from "../components/Lumi";

const themes = [
  { value: "Espacio", icon: "🚀" },
  { value: "Fantasía", icon: "🐉" },
  { value: "Océano", icon: "🌊" },
  { value: "Selva", icon: "🌿" },
];

const difficultyOptions: { value: Difficulty; label: string; icon: string }[] = [
  { value: "facil", label: "Fácil", icon: "🙂" },
  { value: "media", label: "Media", icon: "🤔" },
  { value: "desafio", label: "Desafío", icon: "⭐" },
];

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
      setError(
        createError instanceof ApiClientError
          ? createError.message
          : "No pudimos crear la aventura.",
      );
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="generation-state page-width" aria-live="polite">
        <div className="magic-orbit" aria-hidden="true">
          <span>✦</span>
          <Lumi />
          <span>★</span>
        </div>
        <h1>Lumi está imaginando tu aventura…</h1>
        <p>Preparando personajes, pistas y cinco preguntas especiales.</p>
        <div className="indeterminate-bar"><span /></div>
      </section>
    );
  }

  return (
    <div className="page-width page-section create-page">
      <div className="page-title">
        <span className="pill">Configurador mágico</span>
        <h1>¡Construyamos una historia!</h1>
        <p>Contale a Lumi qué querés explorar hoy.</p>
      </div>

      <form className="story-form" onSubmit={submit} noValidate>
        <fieldset className="form-card form-card--blue">
          <legend><span>1</span> Edad</legend>
          <p className="field-help">Elegí la edad de quien va a leer.</p>
          <div className="tile-row tile-row--ages">
            {[6, 7, 8, 9, 10, 11, 12].map((value) => (
              <button
                key={value}
                className={`choice-tile ${age === value ? "is-selected" : ""}`}
                type="button"
                aria-pressed={age === value}
                onClick={() => setAge(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="form-card form-card--green">
          <legend><span>2</span> Tema</legend>
          <p className="field-help">¿En qué mundo sucede la aventura?</p>
          <div className="tile-row tile-row--themes">
            {themes.map((option) => (
              <button
                key={option.value}
                className={`choice-tile choice-tile--theme ${theme === option.value && !customTheme ? "is-selected" : ""}`}
                type="button"
                aria-pressed={theme === option.value && !customTheme}
                onClick={() => {
                  setTheme(option.value);
                  setCustomTheme("");
                }}
              >
                <span aria-hidden="true">{option.icon}</span>
                {option.value}
              </button>
            ))}
          </div>
          <label className="text-field">
            <span>Otro tema</span>
            <input
              value={customTheme}
              maxLength={60}
              placeholder="Ej.: inventos, música o dinosaurios"
              onChange={(event) => setCustomTheme(event.target.value)}
            />
          </label>
        </fieldset>

        <section className="form-card form-card--yellow">
          <div className="section-legend"><span>3</span> Objetivo educativo</div>
          <label className="text-field">
            <span>¿Qué te gustaría practicar o aprender?</span>
            <textarea
              value={educationalObjective}
              minLength={5}
              maxLength={160}
              rows={3}
              required
              onChange={(event) => setEducationalObjective(event.target.value)}
            />
          </label>
          <p className="privacy-hint">🔒 No escribas nombres completos ni datos personales.</p>
        </section>

        <div className="form-columns">
          <fieldset className="form-card form-card--coral">
            <legend><span>4</span> Dificultad</legend>
            <div className="stacked-options">
              {difficultyOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={`wide-choice ${difficulty === option.value ? "is-selected" : ""}`}
                  aria-pressed={difficulty === option.value}
                  onClick={() => setDifficulty(option.value)}
                >
                  <span aria-hidden="true">{option.icon}</span>
                  {option.label}
                </button>
              ))}
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
                <button
                  type="button"
                  key={option.value}
                  className={`wide-choice ${maxWords === option.value ? "is-selected" : ""}`}
                  aria-pressed={maxWords === option.value}
                  onClick={() => setMaxWords(option.value)}
                >
                  <strong>{option.label}</strong>
                  <small>{option.hint}</small>
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <section className="form-card">
          <div className="section-legend"><span>6</span> Protagonista opcional</div>
          <label className="text-field">
            <span>¿Quién será el héroe de la aventura?</span>
            <input
              value={mainCharacter}
              maxLength={60}
              placeholder="Ej.: una gata astronauta llamada Luna"
              onChange={(event) => setMainCharacter(event.target.value)}
            />
          </label>
        </section>

        {error ? <p className="form-error" role="alert">{error}</p> : null}

        <button className="button button--yellow form-submit" type="submit">
          ✨ Crear aventura
        </button>
      </form>
    </div>
  );
}

