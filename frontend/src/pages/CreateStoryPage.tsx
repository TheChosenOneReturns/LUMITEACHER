import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenTextIcon,
  BrainIcon,
  CheckIcon,
  ClockIcon,
  CompassIcon,
  FlagCheckeredIcon,
  LightbulbFilamentIcon,
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
import { Lumi } from "../components/Lumi";
import { difficultyIcons, StoryThemeIcon } from "../components/VisualIcons";
import { getStorySceneImage } from "../story/interactiveStory";

const themes = ["Espacio", "Fantasía", "Océano", "Selva", "Inventos", "Tema libre"];
const difficultyOptions: { value: Difficulty; label: string; hint: string }[] = [
  { value: "facil", label: "Explorador", hint: "Pistas claras" },
  { value: "media", label: "Aventurero", hint: "Un poco de misterio" },
  { value: "desafio", label: "Gran detective", hint: "Más inferencias" },
];
const stepMeta = [
  { label: "Experiencia", shortLabel: "Formato", Icon: BookOpenTextIcon },
  { label: "Mundo", shortLabel: "Mundo", Icon: CompassIcon },
  { label: "Personaje", shortLabel: "Protagonista", Icon: UsersThreeIcon },
  { label: "Desafío", shortLabel: "Tu aventura", Icon: RocketLaunchIcon },
];
const generationPhases = [
  { label: "Imaginando el mundo", hint: "Colores, lugares y una gran sorpresa", progress: 18, Icon: MapTrifoldIcon },
  { label: "Trazando los caminos", hint: "Cada decisión abre una aventura", progress: 44, Icon: TreeStructureIcon },
  { label: "Dando voz al cuento", hint: "Lumi prepara cada escena", progress: 72, Icon: SpeakerHighIcon },
  { label: "Afinando el desafío", hint: "Últimos detalles antes de despegar", progress: 94, Icon: BrainIcon },
];

interface StoryPreset extends GenerateStoryInput {
  id: string;
  title: string;
  description: string;
}

const storyPresets: StoryPreset[] = [
  { id: "estacion-luz", title: "La señal del planeta azul", description: "Cooperación entre estrellas", age: 8, theme: "Espacio", difficulty: "media", educationalObjective: "Comprender por qué colaborar ayuda a resolver problemas", maxWords: 800, mainCharacter: "Luna, una exploradora espacial curiosa", storyMode: "interactive", language: "es" },
  { id: "biblioteca-lunas", title: "La biblioteca de las dos lunas", description: "Pistas en un reino fantástico", age: 9, theme: "Fantasía", difficulty: "desafio", educationalObjective: "Usar pistas, secuencias y perspectivas para resolver un misterio", maxWords: 1200, mainCharacter: "Mara y un pequeño dragón lector", storyMode: "interactive", language: "es" },
  { id: "invento-submarino", title: "El invento submarino", description: "Causas y soluciones en el océano", age: 10, theme: "Océano", difficulty: "desafio", educationalObjective: "Analizar causas y consecuencias para encontrar soluciones sustentables", maxWords: 1200, mainCharacter: "Nico, un inventor que conversa con las ballenas", storyMode: "interactive", language: "es" },
];

const floatingStars = Array.from({ length: 11 }, (_, index) => ({
  left: `${8 + ((index * 19) % 87)}%`,
  top: `${10 + ((index * 27) % 78)}%`,
  delay: index * 0.18,
  duration: 2.8 + (index % 4) * 0.55,
}));

function SelectionMark() {
  return <motion.span className="choice-indicator" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }} transition={{ type: "spring", stiffness: 420, damping: 19 }}><CheckIcon size={14} weight="bold" /></motion.span>;
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
  const currentGeneration = generationPhases[generationPhase] ?? generationPhases[0]!;

  useEffect(() => { void api.listCourses().then(setCourses).catch(() => setCourses([])); }, []);
  useEffect(() => {
    if (!loading) return;
    const timer = window.setInterval(() => setGenerationPhase((value) => Math.min(value + 1, generationPhases.length - 1)), 1050);
    return () => window.clearInterval(timer);
  }, [loading]);

  function applyPreset(preset: StoryPreset) {
    setAge(preset.age); setTheme(preset.theme); setCustomTheme(themes.includes(preset.theme) ? "" : preset.theme);
    setDifficulty(preset.difficulty); setEducationalObjective(preset.educationalObjective); setMaxWords(preset.maxWords);
    setMainCharacter(preset.mainCharacter ?? ""); setStoryMode(preset.storyMode ?? "interactive"); setLanguage(preset.language ?? "es");
    setLoadedPreset(preset.id); setStep(1); setError(null);
    window.setTimeout(() => document.querySelector(".story-lab")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }), 80);
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
      setError(createError instanceof ApiClientError ? createError.message : "¡Ups! No pudimos crear la aventura. Probemos de nuevo."); setLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="generation-journey" aria-live="polite" aria-label="Creando tu cuento">
        <motion.img className="generation-journey__scene" src={sceneImage} alt="" initial={{ opacity: 0, scale: 1.14 }} animate={{ opacity: 1, scale: reduceMotion ? 1 : 1.02 }} transition={{ duration: reduceMotion ? 0 : 7, ease: "easeOut" }} />
        <div className="generation-journey__veil" />
        <div className="generation-journey__stars" aria-hidden="true">{floatingStars.map((star, index) => <motion.i key={index} style={{ left: star.left, top: star.top }} animate={reduceMotion ? {} : { opacity: [.18, 1, .18], scale: [.7, 1.55, .7], y: [0, -8, 0] }} transition={{ duration: star.duration, delay: star.delay, repeat: Infinity }} />)}</div>
        <motion.div className="generation-journey__panel" initial={{ opacity: 0, y: 24, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 150, damping: 22 }}>
          <header className="generation-journey__header">
            <span className="generation-live"><motion.i animate={reduceMotion ? {} : { scale: [1, 1.55, 1] }} transition={{ duration: 1.5, repeat: Infinity }} /> LUMI ESTÁ CREANDO</span>
            <strong>{currentGeneration.progress}%</strong>
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
            <div className="generation-timeline__rail"><motion.i animate={{ width: `${currentGeneration.progress}%` }} transition={{ type: "spring", stiffness: 90, damping: 20 }} /></div>
            <div className="generation-timeline__steps">{generationPhases.map(({ label, Icon }, index) => {
              const status = index < generationPhase ? "is-complete" : index === generationPhase ? "is-active" : "";
              return <motion.div className={status} key={label} animate={index === generationPhase && !reduceMotion ? { y: [0, -4, 0] } : {}} transition={{ duration: 1.4, repeat: Infinity }}><span>{index < generationPhase ? <CheckIcon weight="bold" /> : <Icon weight="duotone" />}</span><small>{label.replace(/^(Imaginando|Trazando|Dando|Afinando) /, "")}</small></motion.div>;
            })}</div>
          </div>

          <footer className="generation-journey__footer">
            <span><StoryThemeIcon theme={selectedTheme} size={20} /> {selectedTheme}</span>
            <span><UsersThreeIcon size={20} /> {mainCharacter || "Personaje sorpresa"}</span>
            <span><TreeStructureIcon size={20} /> {storyMode === "interactive" ? "4 finales" : "Lectura clásica"}</span>
          </footer>
        </motion.div>
      </section>
    );
  }

  const previewTitle = loadedPreset ? storyPresets.find((preset) => preset.id === loadedPreset)?.title : language === "es" ? "Una historia por descubrir" : "A story waiting to be discovered";

  return (
    <div className="page-width page-section create-page create-page--studio">
      <motion.header className="story-studio-hero story-studio-hero--motion" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}>
        <motion.img key={sceneImage} src={sceneImage} alt={`Vista del mundo ${selectedTheme}`} initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduceMotion ? 0 : 1.1 }} />
        <div className="story-studio-hero__shade" />
        <div className="hero-story-particles" aria-hidden="true">{floatingStars.slice(0, 7).map((star, index) => <motion.i key={index} style={{ left: star.left, top: star.top }} animate={reduceMotion ? {} : { y: [0, -12, 0], opacity: [.25, .9, .25], rotate: [0, 90, 180] }} transition={{ delay: star.delay, duration: star.duration + 1, repeat: Infinity }} />)}</div>
        <motion.div className="story-studio-hero__copy" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: .1, delayChildren: .15 } } }}>
          <motion.span className="studio-live" variants={{ hidden: { opacity: 0, x: -14 }, visible: { opacity: 1, x: 0 } }}><motion.i animate={reduceMotion ? {} : { scale: [1, 1.5, 1] }} transition={{ duration: 1.7, repeat: Infinity }} /> Estudio de Lumi</motion.span>
          <motion.h1 variants={{ hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0 } }}>Creá una aventura a tu manera</motion.h1>
          <motion.p variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>Tres elecciones simples. Un mundo entero por descubrir.</motion.p>
          <motion.div className="studio-feature-chips" variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}><span><SparkleIcon weight="fill" /> Elegí</span><span><PencilSimpleIcon /> Imaginá</span><span><PlayIcon weight="fill" /> Viví el cuento</span></motion.div>
        </motion.div>
        <motion.div className="story-studio-hero__stamp" initial={{ scale: 0, rotate: -16 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: .7, type: "spring", stiffness: 230, damping: 16 }}><RocketLaunchIcon size={38} weight="duotone" /></motion.div>
      </motion.header>

      <form className="story-lab" onSubmit={submit} noValidate>
        <header className="story-lab__heading">
          <div><span className="eyebrow"><MagicWandIcon /> Laboratorio de historias</span><h2>Armemos tu cuento</h2><p>Elegí lo esencial. Lumi se ocupa de la magia.</p></div>
          <motion.div className="story-lab__counter" key={step} initial={{ scale: .9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}><span>0{step + 1}</span><small>de 04</small></motion.div>
        </header>

        <nav className="story-studio__steps story-lab__steps" aria-label="Pasos para crear el cuento">
          {stepMeta.map(({ label, shortLabel, Icon }, index) => <motion.button type="button" key={label} className={step === index ? "is-active" : index < step ? "is-complete" : ""} aria-current={step === index ? "step" : undefined} onClick={() => setStep(index)} whileHover={{ y: -2 }} whileTap={{ scale: .97 }}>
            {step === index ? <motion.i className="step-active-bg" layoutId="active-story-step" transition={{ type: "spring", stiffness: 330, damping: 28 }} /> : null}
            <span>{index < step ? <CheckIcon weight="bold" /> : <Icon weight="duotone" />}</span><b>{shortLabel}</b><small>{[storyMode === "interactive" ? "Interactiva" : "Clásica", selectedTheme, mainCharacter || "Sorpresa de Lumi", difficultyOptions.find((item) => item.value === difficulty)?.label][index]}</small>
          </motion.button>)}
        </nav>

        <div className="story-lab__body">
          <div className="story-studio__workspace">
            <div className="story-studio__progress"><motion.span animate={{ width: `${((step + 1) / stepMeta.length) * 100}%` }} transition={{ type: "spring", stiffness: 140, damping: 22 }} /></div>
            <AnimatePresence initial={false}>
              <motion.section key={step} className="studio-step" initial={{ opacity: 0, x: 34, filter: "blur(4px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} exit={{ opacity: 0, x: -28, filter: "blur(4px)" }} transition={{ type: "spring", stiffness: 180, damping: 23 }}>
                {step === 0 ? <>
                  <span className="eyebrow"><BookOpenTextIcon /> Primer paso</span><h2>¿Cómo querés vivirlo?</h2><p>Elegí el ritmo. El aprendizaje ya viene dentro.</p>
                  <motion.div className="experience-choice-grid" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: .08 } } }}>
                    {([{ value: "interactive", title: "Con caminos", text: "Decisiones y 4 finales", Icon: TreeStructureIcon }, { value: "classic", title: "Libro clásico", text: "Lectura sin pausas", Icon: BookOpenTextIcon }] as const).map(({ value, title, text, Icon }) => <motion.button variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }} key={value} type="button" className={storyMode === value ? "is-selected" : ""} aria-pressed={storyMode === value} onClick={() => setStoryMode(value)} whileHover={{ y: -5, rotate: value === "interactive" ? -.6 : .6 }} whileTap={{ scale: .97 }}><Icon size={38} weight="duotone" /><span><strong>{title}</strong><small>{text}</small></span><AnimatePresence>{storyMode === value ? <SelectionMark /> : null}</AnimatePresence></motion.button>)}
                  </motion.div>
                  <div className="language-switch"><span><TranslateIcon size={25} /><b>Idioma</b></span><div><button type="button" aria-label="Español" aria-pressed={language === "es"} className={language === "es" ? "is-selected" : ""} onClick={() => setLanguage("es")}><strong>ES</strong><span>Español</span></button><button type="button" aria-label="English" aria-pressed={language === "en"} className={language === "en" ? "is-selected" : ""} onClick={() => setLanguage("en")}><strong>EN</strong><span>English</span></button></div></div>
                </> : null}

                {step === 1 ? <>
                  <span className="eyebrow"><CompassIcon /> Segundo paso</span><h2>Elegí un mundo</h2><p>La edad ajusta las palabras. El escenario hace el resto.</p>
                  <div className="studio-field"><span className="studio-field__label"><UsersThreeIcon /> Edad</span><div className="studio-age-row">{[6,7,8,9,10,11,12].map((value) => <motion.button layout key={value} type="button" aria-label={`${value} años`} aria-pressed={age === value} className={age === value ? "is-selected" : ""} onClick={() => setAge(value)} whileHover={{ y: -3 }} whileTap={{ scale: .9 }}><strong>{value}</strong><small>años</small>{age === value ? <motion.i layoutId="selected-age" /> : null}</motion.button>)}</div></div>
                  <div className="studio-field"><span className="studio-field__label"><MapTrifoldIcon /> Mundo</span><div className="studio-world-grid">{themes.map((option, index) => { const selected = option === theme && !customTheme; return <motion.button key={option} type="button" aria-pressed={selected} className={selected ? "is-selected" : ""} onClick={() => { setTheme(option); setCustomTheme(""); }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .045 }} whileHover={{ y: -4, scale: 1.015 }} whileTap={{ scale: .96 }}><StoryThemeIcon theme={option} size={31} /><span>{option}</span><AnimatePresence>{selected ? <SelectionMark /> : null}</AnimatePresence></motion.button>; })}</div></div>
                  <label className="text-field studio-custom-world"><span><PencilSimpleIcon /> Otro mundo</span><div className="input-with-icon"><SparkleIcon /><input value={customTheme} maxLength={60} placeholder="Ej.: una ciudad de nubes" onChange={(event) => setCustomTheme(event.target.value)} /></div></label>
                </> : null}

                {step === 2 ? <>
                  <span className="eyebrow"><UsersThreeIcon /> Tercer paso</span><h2>Dale un corazón</h2><p>Un protagonista. Una misión. Todo lo demás es magia.</p>
                  <label className="studio-character-field"><span><UsersThreeIcon /> Protagonista</span><input value={mainCharacter} maxLength={60} placeholder="Ej.: Kira, una gata astronauta" onChange={(event) => setMainCharacter(event.target.value)} /><small>{mainCharacter.length}/60 · Vacío = sorpresa de Lumi</small></label>
                  <label className="studio-objective-field"><span><LightbulbFilamentIcon /> Misión de aprendizaje</span><strong>¿Qué querés practicar?</strong><textarea aria-label="¿Qué te gustaría practicar o aprender?" value={educationalObjective} minLength={5} maxLength={160} rows={4} required onChange={(event) => setEducationalObjective(event.target.value)} /><small><ShieldCheckIcon /> Sin datos personales · {educationalObjective.length}/160</small></label>
                </> : null}

                {step === 3 ? <>
                  <span className="eyebrow"><RocketLaunchIcon /> Cuarto paso · Revisión</span><h2>¡Lista para despegar!</h2><p>Un último vistazo y abrimos el portal.</p>
                  <div className="studio-final-grid"><fieldset><legend><BrainIcon /> Desafío</legend>{difficultyOptions.map((option) => { const Icon = difficultyIcons[option.value]; return <motion.button type="button" key={option.value} className={difficulty === option.value ? "is-selected" : ""} aria-pressed={difficulty === option.value} onClick={() => setDifficulty(option.value)} whileHover={{ x: 3 }} whileTap={{ scale: .98 }}><Icon size={26} weight="duotone" /><span><strong>{option.label}</strong><small>{option.hint}</small></span>{difficulty === option.value ? <SelectionMark /> : null}</motion.button>; })}</fieldset><fieldset><legend><ClockIcon /> Duración</legend>{([{ value: 300, label: "Breve", hint: "8–12 min" }, { value: 800, label: "Por capítulos", hint: "15–22 min" }, { value: 1200, label: "Gran travesía", hint: "25–35 min" }] as const).map((option) => <motion.button type="button" key={option.value} className={maxWords === option.value ? "is-selected" : ""} aria-pressed={maxWords === option.value} onClick={() => setMaxWords(option.value)} whileHover={{ x: 3 }} whileTap={{ scale: .98 }}><ClockIcon size={25} /><span><strong>{option.label}</strong><small>{option.hint}</small></span>{maxWords === option.value ? <SelectionMark /> : null}</motion.button>)}</fieldset></div>
                  {courses.length ? <label className="text-field studio-course"><span>Compartir con un curso</span><select value={courseId} onChange={(event) => setCourseId(event.target.value)}><option value="">Sólo para mí</option>{courses.map((course) => <option key={course.courseId} value={course.courseId}>{course.name}</option>)}</select></label> : null}
                  <motion.div className="studio-launch-summary" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 }}><div><span><StoryThemeIcon theme={selectedTheme} size={32} /></span><p><strong>{mainCharacter || "Personaje sorpresa"}</strong><small>{selectedTheme} · {age} años · {language === "es" ? "ES" : "EN"}</small></p></div><div className="studio-branch-map" aria-label={storyMode === "interactive" ? "Dos decisiones y cuatro finales" : "Lectura lineal"}>{storyMode === "interactive" ? <><i /><span><i /><i /></span><span><i /><i /><i /><i /></span></> : <><i /><span><i /></span><span><i /></span></>}</div></motion.div>
                </> : null}
              </motion.section>
            </AnimatePresence>

            {error ? <motion.p className="form-error" role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>{error}</motion.p> : null}
            <div className="studio-navigation"><motion.button className="button button--outline studio-back" type="button" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))} whileTap={{ scale: .96 }}><ArrowLeftIcon /> <span>Atrás</span></motion.button>{step < stepMeta.length - 1 ? <motion.button className="button button--yellow" type="button" onClick={() => setStep((value) => Math.min(stepMeta.length - 1, value + 1))} whileHover={{ y: -2 }} whileTap={{ scale: .97 }}>Continuar <ArrowRightIcon /></motion.button> : <motion.button aria-label={storyMode === "interactive" ? "Crear aventura interactiva" : "Crear cuento"} className="button button--yellow studio-create-button" type="submit" whileHover={{ y: -4, boxShadow: "0 11px 0 var(--yellow-dark)" }} whileTap={{ y: 2, scale: .98 }}><RocketLaunchIcon size={24} /> Crear aventura</motion.button>}</div>
          </div>

          <aside className="story-studio__preview" aria-label="Vista previa del cuento">
            <span className="preview-live"><motion.i animate={reduceMotion ? {} : { scale: [1, 1.5, 1] }} transition={{ duration: 1.7, repeat: Infinity }} /> Tu aventura</span>
            <div className="story-studio__preview-image"><motion.img key={sceneImage} src={sceneImage} alt="" initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .6 }} /><motion.span key={selectedTheme} initial={{ scale: 0, rotate: -18 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring" }}><StoryThemeIcon theme={selectedTheme} size={44} /></motion.span></div>
            <AnimatePresence mode="wait"><motion.div className="preview-title" key={`${previewTitle}-${mainCharacter}`} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -7 }}><h3>{previewTitle}</h3><p>{mainCharacter || (language === "es" ? "Lumi elegirá un protagonista." : "Lumi will choose a hero.")}</p></motion.div></AnimatePresence>
            {step !== 2 ? <label className="preview-objective-editor"><span><LightbulbFilamentIcon /> Misión de aprendizaje</span><textarea aria-label="¿Qué te gustaría practicar o aprender?" rows={3} value={educationalObjective} onChange={(event) => setEducationalObjective(event.target.value)} /></label> : null}
            <div className="preview-story-flow"><span className="is-ready"><MapTrifoldIcon /> Mundo</span><b /><span className={storyMode === "interactive" ? "is-ready" : ""}><TreeStructureIcon /> Caminos</span><b /><span className={step >= 2 ? "is-ready" : ""}><FlagCheckeredIcon /> Final</span></div>
            <div className="preview-voice"><SpeakerHighIcon weight="fill" /><span><strong>{language === "es" ? "Voz en español" : "English voice"}</strong><small>Lista en cada escena</small></span><motion.i animate={reduceMotion ? {} : { scaleY: [.35, 1, .5, .8, .35] }} transition={{ duration: 1.3, repeat: Infinity }} /></div>
          </aside>
        </div>
      </form>

      <section className="studio-presets studio-presets--shortcuts" aria-labelledby="studio-presets-title">
        <div><span className="eyebrow"><SparkleIcon weight="fill" /> Atajos de imaginación</span><h2 id="studio-presets-title">¿Empezamos con una idea?</h2><p>Cargala y hacela tuya.</p></div>
        <div className="studio-preset-track">{storyPresets.map((preset, index) => <motion.button key={preset.id} type="button" aria-label={`Cargar prueba ${preset.title}`} aria-pressed={loadedPreset === preset.id} className={loadedPreset === preset.id ? "is-selected" : ""} onClick={() => applyPreset(preset)} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .4 }} transition={{ delay: index * .08 }} whileHover={{ y: -7, rotate: index === 1 ? .4 : -.4 }} whileTap={{ scale: .97 }}><StoryThemeIcon theme={preset.theme} size={34} /><span><strong>{preset.title}</strong><small>{preset.description}</small></span><PlayIcon weight="fill" /></motion.button>)}</div>
      </section>
    </div>
  );
}
