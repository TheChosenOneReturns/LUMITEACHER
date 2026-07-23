import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenTextIcon,
  CheckIcon,
  PathIcon,
  SparkleIcon,
  StarFourIcon,
  TreeStructureIcon,
} from "../components/icons";
import type { StoryPublic } from "@story-teacher/shared";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiClientError } from "../api/client";
import { Lumi } from "../components/Lumi";
import { ErrorState, LoadingState } from "../components/PageState";
import { StoryNarrator } from "../components/StoryNarrator";
import type { NarrationHighlight } from "../components/StoryNarrator";
import { StoryThemeIcon } from "../components/VisualIcons";
import { playPageTurnSound } from "../audio/pageTurn";
import {
  buildInteractiveAdventure,
  clearJourney,
  getStorySceneImage,
  saveJourney,
  type JourneyDecision,
} from "../story/interactiveStory";
import { paginateStoryText, tokenizeNarration } from "../story/pagination";

const pageVariants = {
  enter: (direction: number) => ({ opacity: 0, rotateY: direction > 0 ? -72 : 72, x: direction > 0 ? 34 : -34, scale: .975 }),
  center: { opacity: 1, rotateY: 0, x: 0, scale: 1 },
  exit: (direction: number) => ({ opacity: 0, rotateY: direction > 0 ? 72 : -72, x: direction > 0 ? -34 : 34, scale: .975 }),
};

function NarratedPage({ text, highlight, dark = false }: { text: string; highlight: NarrationHighlight | null; dark?: boolean }) {
  let paragraphOffset = 0;
  return (
    <div className={`narrated-page ${dark ? "narrated-page--dark" : ""}`}>
      {text.split(/\n\n+/u).map((paragraph, paragraphIndex) => {
        const offset = text.indexOf(paragraph, paragraphOffset);
        paragraphOffset = offset + paragraph.length;
        return (
          <p key={`${paragraph.slice(0, 24)}-${paragraphIndex}`}>
            {tokenizeNarration(paragraph).map((token, tokenIndex) => {
              if (!token.word) return token.text;
              const start = offset + token.start;
              const end = offset + token.end;
              const active = Boolean(highlight && highlight.start < end && highlight.end > start);
              return <motion.span key={`${start}-${tokenIndex}`} className={active ? "is-being-read" : ""} animate={active ? { y: -1, scale: 1.035 } : { y: 0, scale: 1 }} transition={{ duration: .18 }}>{token.text}</motion.span>;
            })}
          </p>
        );
      })}
    </div>
  );
}

function PageControls({
  pageIndex,
  pageCount,
  language,
  onChange,
}: {
  pageIndex: number;
  pageCount: number;
  language: "es" | "en";
  onChange: (nextPage: number) => void;
}) {
  if (pageCount <= 1) return null;
  return (
    <nav className="story-page-controls" aria-label={language === "en" ? "Story pages" : "Páginas del cuento"}>
      <button type="button" disabled={pageIndex === 0} onClick={() => onChange(pageIndex - 1)} aria-label={language === "en" ? "Previous page" : "Página anterior"}><ArrowLeftIcon /></button>
      <div><span>{language === "en" ? "Page" : "Página"} <strong>{pageIndex + 1}</strong> / {pageCount}</span><div>{Array.from({ length: pageCount }, (_, index) => <i key={index} className={index === pageIndex ? "is-active" : index < pageIndex ? "is-read" : ""} />)}</div></div>
      <button type="button" disabled={pageIndex === pageCount - 1} onClick={() => onChange(pageIndex + 1)} aria-label={language === "en" ? "Turn page" : "Pasar página"}><ArrowRightIcon /></button>
    </nav>
  );
}

export function ReadingPage() {
  const { storyId = "" } = useParams();
  const reduceMotion = useReducedMotion();
  const [story, setStory] = useState<StoryPublic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sceneId, setSceneId] = useState("opening");
  const [decisions, setDecisions] = useState<JourneyDecision[]>([]);
  const [checkpointAnswers, setCheckpointAnswers] = useState<Record<string, { selected: number; correct: boolean }>>({});
  const [checkpointStars, setCheckpointStars] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageDirection, setPageDirection] = useState(1);
  const [narrationHighlight, setNarrationHighlight] = useState<NarrationHighlight | null>(null);
  const recordedStoryId = useRef<string | null>(null);

  const loadStory = useCallback(async () => {
    setError(null);
    try { setStory(await api.getStory(storyId)); }
    catch (loadError) { setError(loadError instanceof ApiClientError ? loadError.message : "No pudimos abrir la aventura."); }
  }, [storyId]);

  useEffect(() => { void loadStory(); }, [loadStory]);
  useEffect(() => {
    if (!story?.courseId || recordedStoryId.current === story.storyId) return;
    recordedStoryId.current = story.storyId;
    void api.recordActivity(story.courseId, { storyId: story.storyId, ...(story.missionId ? { missionId: story.missionId } : {}), type: "story_opened" }).catch(() => undefined);
  }, [story]);

  const adventure = useMemo(() => story ? buildInteractiveAdventure(story) : null, [story]);
  const scene = adventure?.scenes.find((item) => item.id === sceneId) ?? adventure?.scenes[0];
  const activeReadingText = story?.input.storyMode === "interactive" ? scene?.text ?? "" : story?.story ?? "";
  const readingPages = useMemo(() => paginateStoryText(activeReadingText, story?.input.maxWords === 1200 ? 135 : 120), [activeReadingText, story?.input.maxWords]);

  useEffect(() => {
    setPageIndex(0);
    setPageDirection(1);
    setNarrationHighlight(null);
  }, [activeReadingText]);

  useEffect(() => {
    if (!story || !adventure || !scene?.ending) return;
    saveJourney({
      storyId: story.storyId,
      adventureTitle: adventure.title,
      language: adventure.language,
      decisions,
      endingTitle: scene.title,
      endingText: scene.text,
      checkpointStars,
      checkpointResults: Object.entries(checkpointAnswers).map(([checkpointId, result]) => ({ checkpointId, correct: result.correct })),
      completedAt: new Date().toISOString(),
    });
  }, [adventure, checkpointAnswers, checkpointStars, decisions, scene, story]);

  function answerCheckpoint(optionIndex: number) {
    if (!scene?.checkpoint || checkpointAnswers[scene.checkpoint.id]) return;
    const correct = optionIndex === scene.checkpoint.correctAnswer;
    setCheckpointAnswers((current) => ({ ...current, [scene.checkpoint!.id]: { selected: optionIndex, correct } }));
    if (correct) setCheckpointStars((current) => current + 2);
  }

  function choosePath(choiceId: string) {
    if (!scene) return;
    const choice = scene.choices.find((item) => item.id === choiceId);
    if (!choice) return;
    setDecisions((current) => [...current, { sceneId: scene.id, sceneTitle: scene.title, choiceId: choice.id, choiceLabel: choice.label, consequence: choice.consequence }]);
    setSceneId(choice.nextSceneId);
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function turnPage(nextPage: number) {
    const bounded = Math.max(0, Math.min(readingPages.length - 1, nextPage));
    if (bounded === pageIndex) return;
    setPageDirection(bounded > pageIndex ? 1 : -1);
    setNarrationHighlight(null);
    playPageTurnSound();
    setPageIndex(bounded);
  }

  function restartJourney() {
    if (!story || !adventure) return;
    clearJourney(story.storyId); setDecisions([]); setCheckpointAnswers({}); setCheckpointStars(0); setSceneId(adventure.startSceneId);
  }

  if (error) return <ErrorState message={error} onRetry={loadStory} />;
  if (!story || !adventure || !scene) return <LoadingState message="Abriendo el libro mágico…" />;

  const language = story.input.language ?? "es";
  if (story.input.storyMode !== "interactive") {
    return (
      <div className="page-width page-section reading-page reading-page--classic">
        <div className="reading-meta"><span className="pill"><SparkleIcon weight="fill" /> {story.input.theme}</span><span>{story.input.age} años</span><span>{language === "en" ? "English edition" : "Edición en español"}</span></div>
        <motion.article className="book-page book-page--illustrated" initial={{ opacity: 0, y: 28, rotateX: 4 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ type: "spring", stiffness: 120, damping: 21 }}>
          <div className="book-page__scene"><img src={getStorySceneImage(story.input.theme)} alt={`Ilustración de ${story.input.theme}`} /><div><StoryThemeIcon theme={story.input.theme} size={82} /></div></div>
          <div className="book-page__content book-page__content--turning">
            <span className="eyebrow"><BookOpenTextIcon /> {language === "en" ? "A story created with Lumi" : "Una aventura creada con Lumi"}</span>
            <h1>{story.title}</h1>
            <div className="story-paper" style={{ perspective: 1300 }}>
              <AnimatePresence initial={false} mode="wait" custom={pageDirection}>
                <motion.div key={`classic-${pageIndex}`} className="story-paper__sheet" custom={pageDirection} variants={pageVariants} initial="enter" animate="center" exit="exit" transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 125, damping: 19, mass: .85 }} style={{ transformOrigin: pageDirection > 0 ? "left center" : "right center" }}>
                  <NarratedPage text={readingPages[pageIndex] ?? ""} highlight={narrationHighlight?.pageIndex === pageIndex ? narrationHighlight : null} />
                </motion.div>
              </AnimatePresence>
            </div>
            <PageControls pageIndex={pageIndex} pageCount={readingPages.length} language={language} onChange={turnPage} />
          </div>
        </motion.article>
        {pageIndex === readingPages.length - 1 ? <section className="reading-next"><Lumi message={language === "en" ? "Did you find every clue?" : "¿Encontraste todas las pistas?"} /><Link className="button button--green" to={`/historias/${story.storyId}/desafio`}>{language === "en" ? "Start challenge" : "Comenzar desafío"} <ArrowRightIcon /></Link></section> : null}
        <StoryNarrator pages={readingPages} pageIndex={pageIndex} language={language} onPageChange={turnPage} onHighlightChange={setNarrationHighlight} />
      </div>
    );
  }

  const chapter = scene.ending ? 3 : scene.id === "opening" ? 1 : 2;
  const isLastPage = pageIndex === readingPages.length - 1;
  return (
    <div className={`immersive-story immersive-story--${adventure.worldId}`}>
      <header className="immersive-story__top page-width">
        <div><span className="pill"><TreeStructureIcon /> Historia interactiva</span><strong>{adventure.title}</strong></div>
        <div className="immersive-story__progress-cluster"><div className="immersive-story__stars"><StarFourIcon weight="fill" /><strong>{checkpointStars}</strong><span>{language === "en" ? "reading stars" : "estrellas de lectura"}</span></div><div className="immersive-story__chapter"><span>{language === "en" ? `Chapter ${chapter} of 3` : `Capítulo ${chapter} de 3`}</span><div>{[1,2,3].map((item) => <i key={item} className={item <= chapter ? "is-active" : ""} />)}</div></div></div>
      </header>

      <main className="immersive-stage">
        <motion.img className="immersive-stage__image" src={adventure.image} alt={`Escenario ilustrado: ${scene.title}`} animate={reduceMotion ? {} : { scale: scene.ending ? 1.025 : 1, x: scene.id === "route-1" ? "-1.5%" : scene.id === "route-0" ? "1.5%" : "0%" }} transition={{ duration: 1.2, ease: "easeOut" }} />
        <div className="immersive-stage__scrim" />
        <div className="immersive-stage__particles" aria-hidden="true">{[0,1,2,3,4,5].map((item) => <motion.i key={item} animate={reduceMotion ? {} : { y: [0, -22, 0], opacity: [.2,.8,.2] }} transition={{ duration: 3.4 + item * .35, delay: item * .18, repeat: Infinity }} />)}</div>

        <AnimatePresence mode="wait">
          <motion.article key={scene.id} className={`immersive-card ${scene.ending ? "immersive-card--ending" : ""}`} initial={{ opacity: 0, y: 34, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -24, scale: .98 }} transition={{ type: "spring", stiffness: 150, damping: 22 }}>
            <span className="eyebrow">{scene.eyebrow}</span><h1>{scene.title}</h1>
            <div className="immersive-page-shell" style={{ perspective: 1500 }}>
              <AnimatePresence initial={false} mode="wait" custom={pageDirection}>
                <motion.div key={`${scene.id}-page-${pageIndex}`} className="immersive-page-sheet" custom={pageDirection} variants={pageVariants} initial="enter" animate="center" exit="exit" transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 118, damping: 18, mass: .92 }} style={{ transformOrigin: pageDirection > 0 ? "left center" : "right center" }}>
                  <NarratedPage text={readingPages[pageIndex] ?? ""} highlight={narrationHighlight?.pageIndex === pageIndex ? narrationHighlight : null} dark />
                  <span className="immersive-page-sheet__corner" aria-hidden="true" />
                </motion.div>
              </AnimatePresence>
            </div>
            <PageControls pageIndex={pageIndex} pageCount={readingPages.length} language={language} onChange={turnPage} />
            {isLastPage ? <motion.p className="immersive-card__sensory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .25 }}><SparkleIcon weight="fill" /> {scene.sensoryCue}</motion.p> : <p className="immersive-card__continue"><BookOpenTextIcon /> {language === "en" ? "Turn the page to continue the chapter" : "Pasá la página para continuar el capítulo"}</p>}

            {isLastPage && !scene.ending && scene.checkpoint ? <section className="story-checkpoint" aria-labelledby={`${scene.checkpoint.id}-title`}><div className="story-checkpoint__heading"><span><SparkleIcon weight="fill" /></span><div><small>{language === "en" ? "Reading checkpoint" : "Parada de comprensión"}</small><h2 id={`${scene.checkpoint.id}-title`}>{scene.checkpoint.statement}</h2></div><strong>+2 <StarFourIcon weight="fill" /></strong></div><div className="story-checkpoint__options">{scene.checkpoint.options.map((option, index) => { const result = checkpointAnswers[scene.checkpoint!.id]; const answered = Boolean(result); const isCorrect = index === scene.checkpoint!.correctAnswer; const isSelected = result?.selected === index; return <motion.button key={option} type="button" disabled={answered} className={answered && isCorrect ? "is-correct" : answered && isSelected ? "is-wrong" : ""} onClick={() => answerCheckpoint(index)} whileTap={answered ? {} : { scale: .98 }}><span>{String.fromCharCode(65 + index)}</span>{option}{answered && isCorrect ? <CheckIcon weight="bold" /> : null}</motion.button>; })}</div><AnimatePresence>{checkpointAnswers[scene.checkpoint.id] ? <motion.div className={`story-checkpoint__feedback ${checkpointAnswers[scene.checkpoint.id]!.correct ? "is-correct" : ""}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><strong>{checkpointAnswers[scene.checkpoint.id]!.correct ? (language === "en" ? "Great reading! +2 stars" : "¡Gran lectura! +2 estrellas") : (language === "en" ? "Good try—keep this clue" : "Buen intento: guardá esta pista")}</strong><p>{scene.checkpoint.explanation}</p></motion.div> : null}</AnimatePresence></section> : null}

            {!scene.ending ? <AnimatePresence>{isLastPage && scene.checkpoint && checkpointAnswers[scene.checkpoint.id] ? <motion.div className="story-path-choices" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}><span className="story-path-choices__label"><PathIcon /> {language === "en" ? "Your decision changes the next chapter" : "Tu decisión cambia el siguiente capítulo"}</span>{scene.choices.map((choice, index) => <motion.button key={choice.id} type="button" onClick={() => choosePath(choice.id)} initial={{ opacity: 0, x: index === 0 ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .1 + index * .1 }} whileHover={{ y: -7, scale: 1.015 }} whileTap={{ y: 2, scale: .98 }}><span className="story-choice__index">{index === 0 ? "A" : "B"}</span><span><strong>{choice.label}</strong><small>{choice.consequence}</small></span><ArrowRightIcon weight="bold" /></motion.button>)}</motion.div> : null}</AnimatePresence> : isLastPage ? <div className="immersive-ending"><div className="journey-mini-map">{decisions.map((decision, index) => <span key={decision.choiceId}><CheckIcon /> {decision.choiceLabel}{index < decisions.length - 1 ? <i /> : null}</span>)}</div><div className="immersive-ending__actions"><button className="button button--outline" type="button" onClick={restartJourney}>{language === "en" ? "Try another ending" : "Probar otro final"}</button><Link className="button button--yellow" to={`/historias/${story.storyId}/desafio`}>{language === "en" ? "Adventure challenge" : "Desafío de tu aventura"} <ArrowRightIcon /></Link></div></div> : null}
          </motion.article>
        </AnimatePresence>
      </main>
      <StoryNarrator pages={readingPages} pageIndex={pageIndex} language={adventure.language} onPageChange={turnPage} onHighlightChange={setNarrationHighlight} />
    </div>
  );
}
