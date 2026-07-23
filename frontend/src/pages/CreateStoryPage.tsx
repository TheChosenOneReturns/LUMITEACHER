import {
  CheckIcon,
  ClockIcon,
  MagicWandIcon,
  PathIcon,
  PencilSimpleIcon,
  PlayIcon,
  ShieldCheckIcon,
  SparkleIcon,
  SpeakerHighIcon,
  TreeStructureIcon,
  TranslateIcon,
} from "../components/icons";
import {
  storyInputSchema,
  type CourseSummary,
  type Difficulty,
  type GenerateStoryInput,
  type StoryLanguage,
  type StoryMode,
} from "@story-teacher/shared";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiClientError } from "../api/client";
import { Lumi } from "../components/Lumi";
import { difficultyIcons, StoryThemeIcon } from "../components/VisualIcons";
import { getStorySceneImage } from "../story/interactiveStory";

const themes = ["Espacio", "Fantasía", "Océano", "Selva", "Inventos", "Tema libre"];
const difficultyOptions: { value: Difficulty; label: string; hint: string }[] = [
  { value: "facil", label: "Explorador", hint: "Pistas directas y frases breves" },
  { value: "media", label: "Aventurero", hint: "Decisiones con un poco de misterio" },
  { value: "desafio", label: "Gran detective", hint: "Más inferencias y vocabulario" },
];
const stepLabels = ["Experiencia", "Mundo", "Personaje", "Desafío"];
const generationPhases = ["Diseñando el mundo", "Abriendo cuatro caminos", "Preparando las voces", "Creando cinco preguntas"];

interface StoryPreset extends GenerateStoryInput {
  id: string;
  title: string;
  description: string;
}

const storyPresets: StoryPreset[] = [
  { id: "estacion-luz", title: "La señal del planeta azul", description: "Tres capítulos, dos checkpoints y cuatro finales entre estrellas.", age: 8, theme: "Espacio", difficulty: "media", educationalObjective: "Comprender por qué colaborar ayuda a resolver problemas", maxWords: 800, mainCharacter: "Luna, una exploradora espacial curiosa", storyMode: "interactive", language: "es" },
  { id: "biblioteca-lunas", title: "La biblioteca de las dos lunas", description: "Una aventura extensa de sombras, pistas y perspectivas.", age: 9, theme: "Fantasía", difficulty: "desafio", educationalObjective: "Usar pistas, secuencias y perspectivas para resolver un misterio", maxWords: 1200, mainCharacter: "Mara y un pequeño dragón lector", storyMode: "interactive", language: "es" },
  { id: "invento-submarino", title: "El invento submarino", description: "Una expedición larga para reunir a una familia de ballenas.", age: 10, theme: "Océano", difficulty: "desafio", educationalObjective: "Analizar causas y consecuencias para encontrar soluciones sustentables", maxWords: 1200, mainCharacter: "Nico, un inventor que conversa con las ballenas", storyMode: "interactive", language: "es" },
];

function SelectionMark() {
  return <motion.span className="choice-indicator" initial={{ scale: 0, rotate: -80 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 80 }} transition={{ type: "spring", stiffness: 360, damping: 18 }}><CheckIcon size={14} weight="bold" /></motion.span>;
}

export function CreateStoryPage() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [age, setAge] = useState(8);
  const [theme, setTheme] = useState("Espacio");
  const [customTheme, setCustomTheme] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("media");
  const [educationalObjective, setEducationalObjective] = useState("Comprender por qué colaborar ayuda a resolver problemas");
  const [maxWords, setMaxWords] = useState<GenerateStoryInput["maxWords"]>(800);
  const [mainCharacter, setMainCharacter] = useState("");
  const [storyMode, setStoryMode] = useState<StoryMode>("interactive");
  const [language, setLanguage] = useState<StoryLanguage>("es");
  const [loading, setLoading] = useState(false);
  const [generationPhase, setGenerationPhase] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loadedPreset, setLoadedPreset] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [courseId, setCourseId] = useState("");
  const selectedTheme = customTheme.trim() || theme;
  const sceneImage = useMemo(() => getStorySceneImage(selectedTheme), [selectedTheme]);

  useEffect(() => { void api.listCourses().then(setCourses).catch(() => setCourses([])); }, []);
  useEffect(() => {
    if (!loading) return;
    const timer = window.setInterval(() => setGenerationPhase((value) => Math.min(value + 1, generationPhases.length - 1)), 620);
    return () => window.clearInterval(timer);
  }, [loading]);

  function applyPreset(preset: StoryPreset) {
    setAge(preset.age); setTheme(preset.theme); setCustomTheme(themes.includes(preset.theme) ? "" : preset.theme);
    setDifficulty(preset.difficulty); setEducationalObjective(preset.educationalObjective); setMaxWords(preset.maxWords);
    setMainCharacter(preset.mainCharacter ?? ""); setStoryMode(preset.storyMode ?? "interactive"); setLanguage(preset.language ?? "es");
    setLoadedPreset(preset.id); setStep(1); setError(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null);
    const candidate: GenerateStoryInput = { age, theme: selectedTheme, difficulty, educationalObjective: educationalObjective.trim(), maxWords, mainCharacter: mainCharacter.trim() || null, storyMode, language };
    const validation = storyInputSchema.safeParse(candidate);
    if (!validation.success) { setError(validation.error.issues[0]?.message ?? "Revisá los datos."); return; }
    setGenerationPhase(0); setLoading(true);
    try {
      const story = await api.createStory(validation.data, courseId || null);
      navigate(`/historias/${story.storyId}`);
    } catch (createError) {
      setError(createError instanceof ApiClientError ? createError.message : "No pudimos crear la aventura."); setLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="generation-state generation-state--cinematic page-width" aria-live="polite">
        <motion.img src={sceneImage} alt="" initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: .28, scale: 1 }} transition={{ duration: reduceMotion ? 0 : 1.2 }} />
        <div className="generation-state__veil" />
        <div className="generation-state__content">
          <div className="magic-orbit" aria-hidden="true"><motion.span animate={reduceMotion ? {} : { rotate: 360 }} transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}><SparkleIcon size={36} weight="fill" /></motion.span><Lumi /><motion.span animate={reduceMotion ? {} : { rotate: -360 }} transition={{ duration: 9, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}><MagicWandIcon size={38} weight="duotone" /></motion.span></div>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>Tu aventura está cobrando vida</motion.h1>
          <AnimatePresence mode="wait"><motion.p key={generationPhase} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>{generationPhases[generationPhase]}…</motion.p></AnimatePresence>
          <div className="generation-steps" aria-hidden="true">{generationPhases.map((phase, index) => <motion.span key={phase} className={index <= generationPhase ? "is-ready" : ""} animate={index === generationPhase && !reduceMotion ? { scale: [1, 1.12, 1] } : {}}><CheckIcon /></motion.span>)}</div>
        </div>
      </section>
    );
  }

  return (
    <div className="page-width page-section create-page create-page--studio">
      <motion.header className="story-studio-hero" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}>
        <motion.img key={sceneImage} src={sceneImage} alt={`Vista del mundo ${selectedTheme}`} initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduceMotion ? 0 : .7 }} />
        <div className="story-studio-hero__shade" />
        <div className="story-studio-hero__copy">
          <span className="studio-live"><motion.i animate={reduceMotion ? {} : { scale: [1, 1.45, 1] }} transition={{ duration: 1.7, repeat: Infinity }} /> Estudio narrativo en vivo</span>
          <h1>Tu imaginación decide qué ocurre después</h1>
          <p>Diseñá un mundo, elegí sus caminos y escuchá la aventura con una voz tranquila.</p>
          <div className="studio-feature-chips"><span><TreeStructureIcon /> 4 finales</span><span><SpeakerHighIcon /> Voz suave</span><span><TranslateIcon /> Español + English</span></div>
        </div>
      </motion.header>

      <section className="studio-presets" aria-labelledby="studio-presets-title">
        <div><span className="eyebrow"><SparkleIcon weight="fill" /> Aventuras listas</span><h2 id="studio-presets-title">Entrá directo a una historia con decisiones</h2></div>
        <div className="studio-preset-track">{storyPresets.map((preset, index) => <motion.button key={preset.id} type="button" aria-label={`Cargar prueba ${preset.title}`} aria-pressed={loadedPreset === preset.id} className={loadedPreset === preset.id ? "is-selected" : ""} onClick={() => applyPreset(preset)} whileHover={{ y: -6 }} whileTap={{ scale: .98 }}><span className="studio-preset__number">0{index + 1}</span><StoryThemeIcon theme={preset.theme} size={38} /><span><strong>{preset.title}</strong><small>{preset.description}</small></span><PlayIcon weight="fill" /></motion.button>)}</div>
      </section>

      <form className="story-studio" onSubmit={submit} noValidate>
        <nav className="story-studio__steps" aria-label="Pasos para crear el cuento">{stepLabels.map((label, index) => <motion.button type="button" key={label} className={step === index ? "is-active" : index < step ? "is-complete" : ""} aria-current={step === index ? "step" : undefined} onClick={() => setStep(index)} whileTap={{ scale: .97 }}><span>{index < step ? <CheckIcon weight="bold" /> : index + 1}</span><b>{label}</b><small>{[storyMode === "interactive" ? "Interactiva" : "Clásica", selectedTheme, mainCharacter || "A elección de Lumi", difficultyOptions.find((item) => item.value === difficulty)?.label][index]}</small></motion.button>)}</nav>

        <div className="story-studio__workspace">
          <div className="story-studio__progress"><motion.span animate={{ width: `${((step + 1) / stepLabels.length) * 100}%` }} transition={{ type: "spring", stiffness: 140, damping: 22 }} /></div>
          <AnimatePresence initial={false}>
            <motion.section key={step} className="studio-step" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }} transition={{ type: "spring", stiffness: 190, damping: 24 }}>
              {step === 0 ? <>
                <span className="eyebrow"><PathIcon /> Cómo se vive</span><h2>¿Qué clase de cuento querés abrir?</h2><p>Podés explorar decisiones o leer de principio a fin. El quiz académico siempre conserva sus cinco habilidades.</p>
                <div className="experience-choice-grid">
                  {([{ value: "interactive", title: "Aventura con caminos", text: "Dos decisiones, cuatro finales y un mapa de tu recorrido.", Icon: TreeStructureIcon }, { value: "classic", title: "Libro clásico", text: "Una lectura continua, ilustrada y sin interrupciones.", Icon: PencilSimpleIcon }] as const).map(({ value, title, text, Icon }) => <motion.button key={value} type="button" className={storyMode === value ? "is-selected" : ""} aria-pressed={storyMode === value} onClick={() => setStoryMode(value)} whileHover={{ y: -5 }} whileTap={{ scale: .98 }}><Icon size={35} weight="duotone" /><span><strong>{title}</strong><small>{text}</small></span><AnimatePresence>{storyMode === value ? <SelectionMark /> : null}</AnimatePresence></motion.button>)}
                </div>
                <div className="language-switch"><span><TranslateIcon size={25} /><b>Idioma de la historia y la voz</b></span><div><button type="button" aria-pressed={language === "es"} className={language === "es" ? "is-selected" : ""} onClick={() => setLanguage("es")}><strong>ES</strong><span>Español</span></button><button type="button" aria-pressed={language === "en"} className={language === "en" ? "is-selected" : ""} onClick={() => setLanguage("en")}><strong>EN</strong><span>English</span></button></div></div>
              </> : null}

              {step === 1 ? <>
                <span className="eyebrow"><SparkleIcon /> El escenario</span><h2>Elegí quién lee y dónde comienza</h2><p>La edad adapta el vocabulario; el mundo transforma el relato y su ilustración en tiempo real.</p>
                <div className="studio-field"><span className="studio-field__label">Edad</span><div className="studio-age-row">{[6,7,8,9,10,11,12].map((value) => <motion.button key={value} type="button" aria-label={`${value} años`} aria-pressed={age === value} className={age === value ? "is-selected" : ""} onClick={() => setAge(value)} whileTap={{ scale: .92 }}><strong>{value}</strong><small>años</small></motion.button>)}</div></div>
                <div className="studio-field"><span className="studio-field__label">Mundo</span><div className="studio-world-grid">{themes.map((option) => { const selected = option === theme && !customTheme; return <motion.button key={option} type="button" aria-pressed={selected} className={selected ? "is-selected" : ""} onClick={() => { setTheme(option); setCustomTheme(""); }} whileHover={{ y: -4 }} whileTap={{ scale: .97 }}><StoryThemeIcon theme={option} size={31} /><span>{option}</span>{selected ? <SelectionMark /> : null}</motion.button>; })}</div></div>
                <label className="text-field"><span>Inventar otro mundo</span><div className="input-with-icon"><PencilSimpleIcon /><input value={customTheme} maxLength={60} placeholder="Ej.: dinosaurios, música o una ciudad de nubes" onChange={(event) => setCustomTheme(event.target.value)} /></div></label>
              </> : null}

              {step === 2 ? <>
                <span className="eyebrow"><PencilSimpleIcon /> Corazón del relato</span><h2>Creá al protagonista y su misión</h2><p>Lumi integra el aprendizaje dentro de las decisiones, sin convertir la historia en una lección rígida.</p>
                <label className="studio-character-field"><span>¿Quién protagoniza?</span><input value={mainCharacter} maxLength={60} placeholder="Ej.: una gata astronauta llamada Kira" onChange={(event) => setMainCharacter(event.target.value)} /><small>{mainCharacter.length}/60 · Si lo dejás vacío, Lumi crea uno.</small></label>
                <label className="studio-objective-field"><span>Misión de aprendizaje</span><strong>¿Qué te gustaría practicar o aprender?</strong><textarea aria-label="¿Qué te gustaría practicar o aprender?" value={educationalObjective} minLength={5} maxLength={160} rows={4} required onChange={(event) => setEducationalObjective(event.target.value)} /><small><ShieldCheckIcon /> Sin nombres completos ni datos personales · {educationalObjective.length}/160</small></label>
              </> : null}

              {step === 3 ? <>
                <span className="eyebrow"><MagicWandIcon /> Ritmo final</span><h2>Ajustá el desafío y abrí el portal</h2><p>La dificultad cambia las pistas del texto y la profundidad de las preguntas.</p>
                <div className="studio-final-grid"><fieldset><legend>Dificultad</legend>{difficultyOptions.map((option) => { const Icon = difficultyIcons[option.value]; return <button type="button" key={option.value} className={difficulty === option.value ? "is-selected" : ""} aria-pressed={difficulty === option.value} onClick={() => setDifficulty(option.value)}><Icon size={26} weight="duotone" /><span><strong>{option.label}</strong><small>{option.hint}</small></span>{difficulty === option.value ? <SelectionMark /> : null}</button>; })}</fieldset><fieldset><legend>Profundidad de lectura</legend>{([{ value: 300, label: "Aventura breve", hint: "8–12 minutos" }, { value: 800, label: "Por capítulos", hint: "15–22 minutos" }, { value: 1200, label: "Gran travesía", hint: "25–35 minutos" }] as const).map((option) => <button type="button" key={option.value} className={maxWords === option.value ? "is-selected" : ""} aria-pressed={maxWords === option.value} onClick={() => setMaxWords(option.value)}><ClockIcon size={26} /><span><strong>{option.label}</strong><small>Hasta {option.value} palabras · {option.hint}</small></span>{maxWords === option.value ? <SelectionMark /> : null}</button>)}</fieldset></div>
                {courses.length ? <label className="text-field studio-course"><span>Compartir con un curso</span><select value={courseId} onChange={(event) => setCourseId(event.target.value)}><option value="">Sólo para mí</option>{courses.map((course) => <option key={course.courseId} value={course.courseId}>{course.name}</option>)}</select></label> : null}
                <div className="studio-launch-summary"><div><span><StoryThemeIcon theme={selectedTheme} size={32} /></span><p><strong>{mainCharacter || "Un personaje sorpresa"}</strong><small>{selectedTheme} · {age} años · {language === "es" ? "Español" : "English"}</small></p></div><div className="studio-branch-map" aria-label={storyMode === "interactive" ? "Dos decisiones y cuatro finales" : "Lectura lineal"}>{storyMode === "interactive" ? <><i /><span><i /><i /></span><span><i /><i /><i /><i /></span></> : <><i /><span><i /></span><span><i /></span></>}</div></div>
              </> : null}
            </motion.section>
          </AnimatePresence>

          {error ? <motion.p className="form-error" role="alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.p> : null}
          <div className="studio-navigation"><button className="button button--outline" type="button" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>Atrás</button>{step < stepLabels.length - 1 ? <motion.button className="button button--yellow" type="button" onClick={() => setStep((value) => Math.min(stepLabels.length - 1, value + 1))} whileTap={{ scale: .97 }}>Continuar <PathIcon /></motion.button> : <motion.button className="button button--yellow studio-create-button" type="submit" whileHover={{ y: -4 }} whileTap={{ y: 2, scale: .98 }}><MagicWandIcon size={24} /> Crear {storyMode === "interactive" ? "aventura interactiva" : "cuento"}</motion.button>}</div>
        </div>

        <aside className="story-studio__preview" aria-label="Vista previa del cuento">
          <span className="preview-live"><i /> Vista previa viva</span><div className="story-studio__preview-image"><motion.img key={sceneImage} src={sceneImage} alt="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} /><motion.span animate={reduceMotion ? {} : { x: [0, 10, 0], y: [0, -4, 0] }} transition={{ duration: 4, repeat: Infinity }}><StoryThemeIcon theme={selectedTheme} size={48} /></motion.span></div>
          <h3>{loadedPreset ? storyPresets.find((preset) => preset.id === loadedPreset)?.title : language === "es" ? "Una historia todavía por descubrir" : "A story waiting to be discovered"}</h3><p>{mainCharacter || (language === "es" ? "Lumi elegirá un protagonista para vos." : "Lumi will choose a hero for you.")}</p>
          {step !== 2 ? <label className="preview-objective-editor"><span>Misión de aprendizaje</span><textarea aria-label="¿Qué te gustaría practicar o aprender?" rows={3} value={educationalObjective} onChange={(event) => setEducationalObjective(event.target.value)} /></label> : null}
          <div className="preview-story-flow"><span className="is-ready"><CheckIcon /> Mundo</span><b /><span className={storyMode === "interactive" ? "is-ready" : ""}><TreeStructureIcon /> Decisiones</span><b /><span><SparkleIcon /> Final</span><b /><span><ShieldCheckIcon /> Quiz</span></div>
          <div className="preview-voice"><SpeakerHighIcon weight="fill" /><span><strong>{language === "es" ? "Narración en español" : "English narration"}</strong><small>Voz suave disponible durante cada escena</small></span></div>
        </aside>
      </form>
    </div>
  );
}
