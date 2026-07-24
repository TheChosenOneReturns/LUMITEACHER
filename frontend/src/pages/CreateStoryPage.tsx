import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenTextIcon,
  BrainIcon,
  CaretDownIcon,
  CheckIcon,
  ClockIcon,
  CompassIcon,
  GearSixIcon,
  LightbulbFilamentIcon,
  LockKeyOpenIcon,
  MagicWandIcon,
  MapTrifoldIcon,
  PencilSimpleIcon,
  PlayIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  SparkleIcon,
  SpeakerHighIcon,
  StarFourIcon,
  TreeStructureIcon,
  TranslateIcon,
  UsersThreeIcon,
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
import { useAuth } from "../auth/AuthContext";
import { Lumi } from "../components/Lumi";
import { difficultyIcons, StoryThemeIcon } from "../components/VisualIcons";
import { getStorySceneImage } from "../story/interactiveStory";

const themes = ["Espacio", "Fantasía", "Océano", "Selva", "Inventos", "Tema libre"];
const difficultyOptions: { value: Difficulty; label: string; hint: string }[] = [
  { value: "facil", label: "Explorador", hint: "Pistas claras" },
  { value: "media", label: "Aventurero", hint: "Algo de misterio" },
  { value: "desafio", label: "Detective", hint: "Más inferencias" },
];
const simpleSteps = [
  { label: "Mundo", Icon: CompassIcon },
  { label: "Protagonista", Icon: UsersThreeIcon },
  { label: "Misión", Icon: LightbulbFilamentIcon },
  { label: "Tu aventura", Icon: RocketLaunchIcon },
];
const generationPhases = [
  { label: "Imaginando el mundo", shortLabel: "Mundo", hint: "Colores y lugares", progress: 18, Icon: MapTrifoldIcon },
  { label: "Ordenando las escenas", shortLabel: "Escenas", hint: "Cada momento encuentra su lugar", progress: 44, Icon: BookOpenTextIcon },
  { label: "Dando voz al cuento", shortLabel: "Voz", hint: "Cada escena cobra vida", progress: 72, Icon: SpeakerHighIcon },
  { label: "Afinando el desafío", shortLabel: "Desafío", hint: "Últimos detalles", progress: 94, Icon: BrainIcon },
];

interface StoryPreset extends GenerateStoryInput {
  id: string;
  title: string;
  description: string;
}

const storyPresets: StoryPreset[] = [
  { id: "estacion-luz", title: "La señal del planeta azul", description: "Cooperación entre estrellas", age: 8, theme: "Espacio", difficulty: "media", educationalObjective: "Comprender por qué colaborar ayuda a resolver problemas", maxWords: 800, mainCharacter: "Luna, una exploradora espacial curiosa", storyMode: "interactive", language: "es" },
  { id: "biblioteca-lunas", title: "La biblioteca de las dos lunas", description: "Pistas en un reino fantástico", age: 9, theme: "Fantasía", difficulty: "desafio", educationalObjective: "Usar pistas, secuencias y perspectivas para resolver un misterio", maxWords: 1200, mainCharacter: "Mara y un pequeño dragón lector", storyMode: "interactive", language: "es" },
  { id: "invento-submarino", title: "El invento submarino", description: "Soluciones en el océano", age: 10, theme: "Océano", difficulty: "desafio", educationalObjective: "Analizar causas y consecuencias para encontrar soluciones sustentables", maxWords: 1200, mainCharacter: "Nico, un inventor que conversa con las ballenas", storyMode: "interactive", language: "es" },
];

const floatingStars = Array.from({ length: 11 }, (_, index) => ({
  left: `${8 + ((index * 19) % 87)}%`,
  top: `${10 + ((index * 27) % 78)}%`,
  delay: index * 0.18,
  duration: 2.8 + (index % 4) * 0.55,
}));

function SelectionMark() {
  return (
    <motion.span
      className="choice-indicator"
      initial={{ scale: 0, rotate: -90 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, rotate: 90 }}
      transition={{ type: "spring", stiffness: 420, damping: 19 }}
    >
      <CheckIcon size={14} weight="bold" />
    </motion.span>
  );
}

export function CreateStoryPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [age, setAge] = useState(profile?.age ?? 8);
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
  const currentGeneration = generationPhases[generationPhase] ?? generationPhases[0]!;
  const generationSparkPosition = 9 + currentGeneration.progress * 0.82;

  useEffect(() => { void api.listCourses().then(setCourses).catch(() => setCourses([])); }, []);
  useEffect(() => {
    if (profile?.age) setAge(profile.age);
  }, [profile?.age]);
  useEffect(() => {
    if (!loading) return;
    const timer = window.setInterval(
      () => setGenerationPhase((value) => Math.min(value + 1, generationPhases.length - 1)),
      1050,
    );
    return () => window.clearInterval(timer);
  }, [loading]);

  function applyPreset(preset: StoryPreset) {
    setAge(preset.age);
    setTheme(preset.theme);
    setCustomTheme(themes.includes(preset.theme) ? "" : preset.theme);
    setDifficulty(preset.difficulty);
    setEducationalObjective(preset.educationalObjective);
    setMaxWords(preset.maxWords);
    setMainCharacter(preset.mainCharacter ?? "");
    setStoryMode(preset.storyMode ?? "interactive");
    setLanguage(preset.language ?? "es");
    setLoadedPreset(preset.id);
    setStep(0);
    setError(null);
    window.setTimeout(() => {
      const storyLab = document.querySelector(".story-lab");
      if (storyLab && typeof storyLab.scrollIntoView === "function") {
        storyLab.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      }
    }, 80);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const candidate: GenerateStoryInput = {
      age,
      theme: selectedTheme,
      difficulty,
      educationalObjective: educationalObjective.trim(),
      maxWords,
      mainCharacter: mainCharacter.trim() || null,
      storyMode,
      language,
    };
    const validation = storyInputSchema.safeParse(candidate);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "Revisá los datos.");
      return;
    }
    setGenerationPhase(0);
    setLoading(true);
    try {
      const story = await api.createStory(validation.data, courseId || null);
      navigate(`/historias/${story.storyId}`);
    } catch (createError) {
      setError(createError instanceof ApiClientError ? createError.message : "No pudimos crear la aventura. Probemos de nuevo.");
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="generation-journey" aria-live="polite" aria-label="Creando tu cuento">
        <motion.img className="generation-journey__scene" src={sceneImage} alt="" initial={{ opacity: 0, scale: 1.14 }} animate={{ opacity: 1, scale: reduceMotion ? 1 : 1.02 }} transition={{ duration: reduceMotion ? 0 : 7, ease: "easeOut" }} />
        <div className="generation-journey__veil" />
        <div className="generation-journey__stars" aria-hidden="true">
          {floatingStars.map((star, index) => (
            <motion.i key={index} style={{ left: star.left, top: star.top }} animate={reduceMotion ? {} : { opacity: [.18, 1, .18], scale: [.7, 1.55, .7], y: [0, -8, 0] }} transition={{ duration: star.duration, delay: star.delay, repeat: Infinity }} />
          ))}
        </div>
        <motion.div className="generation-journey__panel" initial={{ opacity: 0, y: 24, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 150, damping: 22 }}>
          <header className="generation-journey__header">
            <span className="generation-live"><motion.i animate={reduceMotion ? {} : { scale: [1, 1.55, 1] }} transition={{ duration: 1.5, repeat: Infinity }} /> LUMI ESTÁ CREANDO</span>
            <motion.strong key={currentGeneration.progress} initial={reduceMotion ? false : { scale: .75, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 20 }}>{currentGeneration.progress}%</motion.strong>
          </header>

          <div className="generation-portal" aria-hidden="true">
            <motion.div className="generation-portal__ring generation-portal__ring--outer" animate={reduceMotion ? {} : { rotate: 360 }} transition={{ duration: 13, repeat: Infinity, ease: "linear" }}><StarFourIcon weight="fill" /><SparkleIcon weight="fill" /><StoryThemeIcon theme={selectedTheme} size={28} /></motion.div>
            <motion.div className="generation-portal__ring generation-portal__ring--inner" animate={reduceMotion ? {} : { rotate: -360 }} transition={{ duration: 9, repeat: Infinity, ease: "linear" }} />
            <motion.div className="generation-portal__lumi" animate={reduceMotion ? {} : { y: [0, -9, 0], rotate: [-1.5, 1.5, -1.5] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}><Lumi /></motion.div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div className="generation-journey__copy" key={generationPhase} initial={{ opacity: 0, y: 12, filter: "blur(5px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -10, filter: "blur(5px)" }} transition={{ duration: reduceMotion ? 0 : .35 }}>
              <span>PASO {generationPhase + 1} DE {generationPhases.length}</span>
              <h1>{currentGeneration.label}</h1>
              <p>{currentGeneration.hint}</p>
            </motion.div>
          </AnimatePresence>

          <div className="generation-timeline" role="progressbar" aria-label={currentGeneration.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={currentGeneration.progress}>
            <div className="generation-timeline__rail">
              <motion.i animate={{ width: `${currentGeneration.progress}%` }} transition={{ type: "spring", stiffness: 80, damping: 18 }} />
            </div>
            <motion.b
              className="generation-timeline__spark"
              aria-hidden="true"
              animate={{ left: `${generationSparkPosition}%`, scale: reduceMotion ? 1 : [1, 1.35, 1] }}
              transition={reduceMotion ? { duration: 0 } : { left: { type: "spring", stiffness: 80, damping: 18 }, scale: { duration: 1.1, repeat: Infinity } }}
            ><SparkleIcon weight="fill" /></motion.b>
            <div className="generation-timeline__steps">
              {generationPhases.map(({ label, shortLabel, Icon }, index) => {
                const status = index < generationPhase ? "is-complete" : index === generationPhase ? "is-active" : "";
                return (
                  <motion.div className={status} key={label} animate={index === generationPhase && !reduceMotion ? { y: [0, -3, 0] } : {}} transition={{ duration: 1.4, repeat: Infinity }}>
                    <motion.span initial={reduceMotion ? false : index <= generationPhase ? { scale: .75 } : false} animate={{ scale: 1 }} transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 18 }}>
                      {index < generationPhase ? <CheckIcon weight="bold" /> : <Icon weight="duotone" />}
                    </motion.span>
                    <small>{shortLabel}</small>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <footer className="generation-journey__footer">
            <span><StoryThemeIcon theme={selectedTheme} size={20} /> {selectedTheme}</span>
            <span><TreeStructureIcon size={20} /> {storyMode === "interactive" ? "4 finales" : "Lectura clásica"}</span>
          </footer>
        </motion.div>
      </section>
    );
  }

  const previewTitle = loadedPreset
    ? storyPresets.find((preset) => preset.id === loadedPreset)?.title
    : language === "es" ? "Una historia por descubrir" : "A story waiting to be discovered";

  return (
    <div className="page-width page-section create-page create-page--studio">
      <motion.header className="story-studio-hero story-studio-hero--motion" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}>
        <motion.img key={sceneImage} src={sceneImage} alt={`Vista del mundo ${selectedTheme}`} initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduceMotion ? 0 : 1.1 }} />
        <div className="story-studio-hero__shade" />
        <div className="hero-story-particles" aria-hidden="true">
          {floatingStars.slice(0, 7).map((star, index) => <motion.i key={index} style={{ left: star.left, top: star.top }} animate={reduceMotion ? {} : { y: [0, -12, 0], opacity: [.25, .9, .25], rotate: [0, 90, 180] }} transition={{ delay: star.delay, duration: star.duration + 1, repeat: Infinity }} />)}
        </div>
        <motion.div className="story-studio-hero__copy" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: .1, delayChildren: .15 } } }}>
          <motion.span className="studio-live" variants={{ hidden: { opacity: 0, x: -14 }, visible: { opacity: 1, x: 0 } }}><motion.i animate={reduceMotion ? {} : { scale: [1, 1.5, 1] }} transition={{ duration: 1.7, repeat: Infinity }} /> Estudio de Lumi</motion.span>
          <motion.h1 variants={{ hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0 } }}>Creá una aventura a tu manera</motion.h1>
          <motion.p variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>Tres elecciones. Una aventura única.</motion.p>
          <motion.div className="studio-feature-chips" variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}><span><SparkleIcon weight="fill" /> Elegí</span><span><PencilSimpleIcon /> Imaginá</span><span><PlayIcon weight="fill" /> Viví</span></motion.div>
        </motion.div>
        <motion.div className="story-studio-hero__stamp" initial={{ scale: 0, rotate: -16 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: .7, type: "spring", stiffness: 230, damping: 16 }}><RocketLaunchIcon size={38} weight="duotone" /></motion.div>
      </motion.header>

      <form className="story-lab" onSubmit={submit} noValidate>
        <header className="story-lab__heading">
          <div><span className="eyebrow"><MagicWandIcon /> Laboratorio de historias</span><h2>Armemos tu cuento</h2><p>Elegí lo esencial.</p></div>
          <motion.button
            className={advancedOpen ? "advanced-toggle is-open" : "advanced-toggle"}
            type="button"
            aria-label="Modo avanzado"
            aria-expanded={advancedOpen}
            aria-controls="advanced-story-options"
            onClick={() => setAdvancedOpen((value) => !value)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: .97 }}
          >
            <motion.span
              key={advancedOpen ? "advanced-open" : "advanced-closed"}
              className="advanced-toggle__gear"
              animate={reduceMotion ? {} : advancedOpen ? { rotate: 360 } : { rotate: [0, 0, 18, -12, 0] }}
              transition={advancedOpen ? { duration: .55, ease: "easeOut" } : { duration: 3.2, repeat: Infinity, repeatDelay: 1.4 }}
            ><GearSixIcon size={25} weight="duotone" /></motion.span>
            <span><strong>Modo avanzado</strong><small>{advancedOpen ? "Opciones desbloqueadas" : "Edad, idioma y más"}</small></span>
            <motion.i animate={{ rotate: advancedOpen ? 180 : 0 }}><CaretDownIcon weight="bold" /></motion.i>
          </motion.button>
        </header>

        <AnimatePresence initial={false}>
          {advancedOpen ? (
            <motion.section
              id="advanced-story-options"
              className="advanced-options"
              aria-label="Opciones avanzadas del cuento"
              initial={reduceMotion ? false : { opacity: 0, y: -10, scaleY: .96 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scaleY: .96 }}
              transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 190, damping: 25 }}
            >
              <div className="advanced-options__title"><span><LockKeyOpenIcon weight="duotone" /></span><div><strong>Ajustes desbloqueados</strong><small>Personalizá sólo lo que quieras</small></div></div>
              <fieldset className="advanced-option advanced-option--format"><legend><BookOpenTextIcon /> Formato</legend><div>{([{ value: "interactive", label: "Con caminos", Icon: TreeStructureIcon }, { value: "classic", label: "Clásico", Icon: BookOpenTextIcon }] as const).map(({ value, label, Icon }) => <motion.button key={value} type="button" aria-pressed={storyMode === value} className={storyMode === value ? "is-selected" : ""} onClick={() => setStoryMode(value)} whileTap={{ scale: .95 }}><Icon weight="duotone" />{label}</motion.button>)}</div></fieldset>
              <fieldset className="advanced-option advanced-option--language"><legend><TranslateIcon /> Idioma</legend><div><button type="button" aria-label="Español" aria-pressed={language === "es"} className={language === "es" ? "is-selected" : ""} onClick={() => setLanguage("es")}>ES</button><button type="button" aria-label="English" aria-pressed={language === "en"} className={language === "en" ? "is-selected" : ""} onClick={() => setLanguage("en")}>EN</button></div></fieldset>
              <fieldset className="advanced-option advanced-option--age"><legend><UsersThreeIcon /> Edad</legend><div>{[6,7,8,9,10,11,12].map((value) => <motion.button key={value} type="button" aria-label={`${value} años`} aria-pressed={age === value} className={age === value ? "is-selected" : ""} onClick={() => setAge(value)} whileTap={{ scale: .9 }}>{value}</motion.button>)}</div></fieldset>
              <fieldset className="advanced-option advanced-option--difficulty"><legend><BrainIcon /> Desafío</legend><div>{difficultyOptions.map((option) => { const Icon = difficultyIcons[option.value]; return <motion.button type="button" key={option.value} title={option.hint} aria-pressed={difficulty === option.value} className={difficulty === option.value ? "is-selected" : ""} onClick={() => setDifficulty(option.value)} whileTap={{ scale: .95 }}><Icon weight="duotone" />{option.label}</motion.button>; })}</div></fieldset>
              <fieldset className="advanced-option advanced-option--length"><legend><ClockIcon /> Duración</legend><div>{([{ value: 300, label: "Breve" }, { value: 800, label: "Capítulos" }, { value: 1200, label: "Travesía" }] as const).map((option) => <motion.button type="button" key={option.value} aria-pressed={maxWords === option.value} className={maxWords === option.value ? "is-selected" : ""} onClick={() => setMaxWords(option.value)} whileTap={{ scale: .95 }}>{option.label}</motion.button>)}</div></fieldset>
              {courses.length ? <label className="advanced-course"><span>Curso</span><select value={courseId} onChange={(event) => setCourseId(event.target.value)}><option value="">Sólo para mí</option>{courses.map((course) => <option key={course.courseId} value={course.courseId}>{course.name}</option>)}</select></label> : null}
            </motion.section>
          ) : null}
        </AnimatePresence>

        <nav className="story-studio__steps story-lab__steps story-lab__steps--simple" aria-label="Pasos para crear el cuento">
          {simpleSteps.map(({ label, Icon }, index) => (
            <motion.button type="button" key={label} className={step === index ? "is-active" : index < step ? "is-complete" : ""} aria-current={step === index ? "step" : undefined} onClick={() => setStep(index)} whileHover={{ y: -2 }} whileTap={{ scale: .97 }}>
              {step === index ? <motion.i className="step-active-bg" layoutId="active-story-step" transition={{ type: "spring", stiffness: 330, damping: 28 }} /> : null}
              <span>{index < step ? <CheckIcon weight="bold" /> : index === step ? index + 1 : <Icon weight="duotone" />}</span><b>{label}</b>
            </motion.button>
          ))}
        </nav>

        <div className="story-lab__body">
          <div className="story-studio__workspace">
            <div className="story-studio__progress"><motion.span animate={{ width: `${((step + 1) / simpleSteps.length) * 100}%` }} transition={{ type: "spring", stiffness: 140, damping: 22 }} /></div>
            <div className="studio-step-shell">
              <AnimatePresence initial={false} mode="wait">
                <motion.section key={step} className="studio-step studio-step--simple" initial={reduceMotion ? false : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -20 }} transition={reduceMotion ? { duration: 0 } : { duration: .22, ease: "easeOut" }}>
                {step === 0 ? <>
                  <span className="eyebrow"><CompassIcon /> Paso 1</span><h2>¿Dónde empieza?</h2>
                  <div className="studio-world-grid studio-world-grid--simple">{themes.map((option, index) => { const selected = option === theme && !customTheme; return <motion.button key={option} type="button" aria-pressed={selected} className={selected ? "is-selected" : ""} onClick={() => { setTheme(option); setCustomTheme(""); }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .045 }} whileHover={{ y: -4, scale: 1.015 }} whileTap={{ scale: .96 }}><StoryThemeIcon theme={option} size={36} /><span>{option}</span><AnimatePresence>{selected ? <SelectionMark /> : null}</AnimatePresence></motion.button>; })}</div>
                  <label className="text-field studio-custom-world"><span><PencilSimpleIcon /> Otro mundo</span><div className="input-with-icon"><SparkleIcon /><input value={customTheme} maxLength={60} placeholder="Ej.: una ciudad de nubes" onChange={(event) => setCustomTheme(event.target.value)} /></div></label>
                </> : null}

                {step === 1 ? <>
                  <span className="eyebrow"><UsersThreeIcon /> Paso 2</span><h2>¿Quién vive la aventura?</h2>
                  <label className="studio-character-field studio-character-field--simple"><span><UsersThreeIcon /> Protagonista</span><input value={mainCharacter} maxLength={60} placeholder="Ej.: Kira, una gata astronauta" onChange={(event) => setMainCharacter(event.target.value)} /><small>{mainCharacter.length}/60 · Vacío = sorpresa</small></label>
                </> : null}

                {step === 2 ? <>
                  <span className="eyebrow"><LightbulbFilamentIcon /> Paso 3</span><h2>¿Qué querés practicar?</h2>
                  <label className="studio-objective-field studio-objective-field--simple"><span><LightbulbFilamentIcon /> Misión de aprendizaje</span><textarea aria-label="¿Qué te gustaría practicar o aprender?" value={educationalObjective} minLength={5} maxLength={160} rows={4} required onChange={(event) => setEducationalObjective(event.target.value)} /><small><ShieldCheckIcon /> Sin datos personales · {educationalObjective.length}/160</small></label>
                </> : null}

                {step === 3 ? <>
                  <span className="eyebrow"><RocketLaunchIcon /> Paso 4</span><h2>Todo listo</h2>
                  <div className="simple-review-grid">
                    <motion.button type="button" onClick={() => setStep(0)} whileHover={{ y: -3 }}><span><StoryThemeIcon theme={selectedTheme} size={28} /></span><small>Mundo</small><strong>{selectedTheme}</strong><PencilSimpleIcon /></motion.button>
                    <motion.button type="button" onClick={() => setStep(1)} whileHover={{ y: -3 }}><span><UsersThreeIcon size={28} weight="duotone" /></span><small>Protagonista</small><strong>{mainCharacter || "Sorpresa de Lumi"}</strong><PencilSimpleIcon /></motion.button>
                    <motion.button type="button" onClick={() => setStep(2)} whileHover={{ y: -3 }}><span><LightbulbFilamentIcon size={28} weight="duotone" /></span><small>Misión</small><strong>{educationalObjective}</strong><PencilSimpleIcon /></motion.button>
                  </div>
                  <div className="review-specs" aria-label="Ajustes del cuento">
                    <span title="Formato"><TreeStructureIcon /> {storyMode === "interactive" ? "Con caminos" : "Clásico"}</span>
                    <span title="Idioma"><TranslateIcon /> {language.toUpperCase()}</span>
                    <span title="Edad"><UsersThreeIcon /> {age}</span>
                    <span title="Desafío"><BrainIcon /> {difficultyOptions.find((option) => option.value === difficulty)?.label}</span>
                    <span title="Extensión"><ClockIcon /> {maxWords}</span>
                  </div>
                </> : null}
              </motion.section>
              </AnimatePresence>
            </div>

            {error ? <motion.p className="form-error" role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>{error}</motion.p> : null}
            <div className="studio-navigation">
              <motion.button className="button button--outline studio-back" type="button" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))} whileTap={{ scale: .96 }}><ArrowLeftIcon /> <span>Atrás</span></motion.button>
              {step < simpleSteps.length - 1 ? <motion.button className="button button--yellow" type="button" onClick={() => setStep((value) => Math.min(simpleSteps.length - 1, value + 1))} whileHover={{ y: -2 }} whileTap={{ scale: .97 }}>Continuar <ArrowRightIcon /></motion.button> : <motion.button aria-label={storyMode === "interactive" ? "Crear aventura interactiva" : "Crear cuento"} className="button button--yellow studio-create-button" type="submit" whileHover={{ y: -4, boxShadow: "0 11px 0 var(--yellow-dark)" }} whileTap={{ y: 2, scale: .98 }}><RocketLaunchIcon size={24} /> Crear aventura</motion.button>}
            </div>
          </div>

          <motion.aside
            className="story-cover-preview"
            aria-label="Vista previa del cuento"
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 170, damping: 22 }}
          >
            <div className="story-cover-preview__art">
              <motion.img
                key={sceneImage}
                src={sceneImage}
                alt=""
                initial={reduceMotion ? false : { opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: reduceMotion ? 0 : .65 }}
              />
              <div className="story-cover-preview__scrim" />
              <header className="story-cover-preview__top">
                <span><motion.i animate={reduceMotion ? {} : { scale: [1, 1.5, 1] }} transition={{ duration: 1.7, repeat: Infinity }} /> {language === "es" ? "EN CREACIÓN" : "IN PROGRESS"}</span>
                <b><span aria-hidden="true">{age}</span><span className="sr-only">{age} años</span></b>
              </header>
              <motion.div
                className="story-cover-preview__seal"
                key={selectedTheme}
                initial={reduceMotion ? false : { scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 18 }}
              ><StoryThemeIcon theme={selectedTheme} size={34} /></motion.div>
              <AnimatePresence mode="wait">
                <motion.div
                  className="story-cover-preview__copy"
                  key={`${previewTitle}-${mainCharacter}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  transition={{ duration: reduceMotion ? 0 : .25 }}
                >
                  <span><SparkleIcon weight="fill" /> {language === "es" ? "TU CUENTO" : "YOUR STORY"}</span>
                  <h3>{previewTitle}</h3>
                  {mainCharacter ? <p><UsersThreeIcon /> {mainCharacter}</p> : null}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="story-cover-preview__dock" aria-label="Resumen visual del cuento">
              <span title={selectedTheme} aria-label={`Mundo: ${selectedTheme}`}><StoryThemeIcon theme={selectedTheme} size={22} /></span>
              <span title={storyMode === "interactive" ? "Con caminos" : "Clásico"} aria-label={storyMode === "interactive" ? "Aventura con caminos" : "Cuento clásico"}>{storyMode === "interactive" ? <TreeStructureIcon /> : <BookOpenTextIcon />}</span>
              <span title={language === "es" ? "Voz en español" : "English voice"} aria-label={language === "es" ? "Voz en español" : "English voice"}><SpeakerHighIcon /></span>
            </div>
          </motion.aside>
        </div>
      </form>

      <section className="studio-presets studio-presets--shortcuts" aria-labelledby="studio-presets-title">
        <div><span className="eyebrow"><SparkleIcon weight="fill" /> Atajos</span><h2 id="studio-presets-title">¿Querés una idea?</h2></div>
        <div className="studio-preset-track">{storyPresets.map((preset, index) => <motion.button key={preset.id} type="button" aria-label={`Cargar prueba ${preset.title}`} aria-pressed={loadedPreset === preset.id} className={loadedPreset === preset.id ? "is-selected" : ""} onClick={() => applyPreset(preset)} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .4 }} transition={{ delay: index * .08 }} whileHover={{ y: -7, rotate: index === 1 ? .4 : -.4 }} whileTap={{ scale: .97 }}><StoryThemeIcon theme={preset.theme} size={34} /><span><strong>{preset.title}</strong><small>{preset.description}</small></span><PlayIcon weight="fill" /></motion.button>)}</div>
      </section>
    </div>
  );
}
