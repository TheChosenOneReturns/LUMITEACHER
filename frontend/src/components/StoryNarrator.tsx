import type { StoryLanguage } from "@story-teacher/shared";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { narrationWordRanges } from "../story/pagination";
import {
  CompassIcon,
  PauseIcon,
  PlayIcon,
  SpeakerHighIcon,
  SpeakerSlashIcon,
  SparkleIcon,
  XIcon,
} from "./icons";

export interface NarrationHighlight {
  pageIndex: number;
  start: number;
  end: number;
}

interface StoryNarratorProps {
  text?: string;
  pages?: string[];
  pageIndex?: number;
  language: StoryLanguage;
  onPageChange?: (pageIndex: number) => void;
  onHighlightChange?: (highlight: NarrationHighlight | null) => void;
}

type NarratorState = "idle" | "speaking" | "paused";
export type NarratorPersona = "woman" | "man";

const preferredVoiceNames: Record<StoryLanguage, Record<NarratorPersona, RegExp>> = {
  es: {
    woman: /elena|helena|sabina|laura|monica|zira|female|mujer|paulina|sofia|salome|catalina|ximena/i,
    man: /tomas|tomás|jorge|pablo|alvaro|álvaro|diego|david|male|hombre|raul|raúl|andres|andrés|gonzalo|lorenzo|marcelo/i,
  },
  en: {
    woman: /aria|jenny|samantha|zira|female|woman|ava|susan|emma|nova|serena|phoebe/i,
    man: /guy|mark|daniel|david|male|man|ryan|george|andrew|brian|stefan|steffan|onyx|echo/i,
  },
};

const personaCopy = {
  es: {
    woman: { name: "Amancay", role: "guardiana de luciérnagas", description: "Elena · cálida y serena" },
    man: { name: "Nahuel", role: "viajero de las nubes", description: "Tomas · suave y aventurero" },
    heading: "¿Quién te cuenta esta aventura?",
    helper: "Arrastrame a cualquier rincón de la página.",
  },
  en: {
    woman: { name: "Lyra", role: "keeper of fireflies", description: "Warm and peaceful" },
    man: { name: "Orion", role: "traveler of clouds", description: "Gentle and adventurous" },
    heading: "Who will tell this adventure?",
    helper: "Drag me anywhere on the page.",
  },
} as const;

function voiceMatchesLanguage(voice: SpeechSynthesisVoice, language: StoryLanguage): boolean {
  return voice.lang.toLowerCase().startsWith(language === "en" ? "en" : "es");
}

export function pickNarratorVoice(
  voices: SpeechSynthesisVoice[],
  language: StoryLanguage,
  persona: NarratorPersona,
): SpeechSynthesisVoice | null {
  const matching = voices.filter((voice) => voiceMatchesLanguage(voice, language));
  const regional = matching.filter((voice) => voice.lang.toLowerCase().startsWith(language === "es" ? "es-ar" : "en-us"));
  const regionalGender = regional.find((voice) => preferredVoiceNames[language][persona].test(voice.name));
  if (regionalGender) return regionalGender;
  const languageGender = matching.find((voice) => preferredVoiceNames[language][persona].test(voice.name));
  if (languageGender) return languageGender;
  const naturalRegional = regional.find((voice) => /natural|neural|google|microsoft/i.test(voice.name));
  return naturalRegional ?? regional[0] ?? matching[0] ?? null;
}

export function StoryNarrator({
  text = "",
  pages,
  pageIndex = 0,
  language,
  onPageChange,
  onHighlightChange,
}: StoryNarratorProps) {
  const reduceMotion = useReducedMotion();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [persona, setPersona] = useState<NarratorPersona>("woman");
  const [state, setState] = useState<NarratorState>("idle");
  const [open, setOpen] = useState(false);
  const [dragBounds, setDragBounds] = useState({ left: -900, right: 0, top: -600, bottom: 0 });
  const fallbackTimer = useRef<number | null>(null);
  const runId = useRef(0);
  const activePage = useRef(pageIndex);
  const activeCharacter = useRef(0);
  const narrationPages = useMemo(() => pages?.length ? pages : [text], [pages, text]);
  const available = typeof window !== "undefined" && "speechSynthesis" in window;
  const copy = personaCopy[language];

  useEffect(() => {
    if (!available) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, [available]);

  useEffect(() => {
    const updateBounds = () => setDragBounds({ left: -Math.max(240, window.innerWidth - 120), right: 0, top: -Math.max(240, window.innerHeight - 160), bottom: 0 });
    updateBounds();
    window.addEventListener("resize", updateBounds);
    return () => window.removeEventListener("resize", updateBounds);
  }, []);

  useEffect(() => {
    if (pageIndex === activePage.current) return;
    activePage.current = pageIndex;
    stopNarration();
  // stopNarration intentionally stays outside the dependency array to react only to externally changed pages.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex]);

  useEffect(() => {
    stopNarration();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, persona]);

  useEffect(() => () => stopNarration(), []);

  function clearFallback(): void {
    if (fallbackTimer.current !== null) window.clearInterval(fallbackTimer.current);
    fallbackTimer.current = null;
  }

  function emitHighlight(page: number, start: number, end: number): void {
    activeCharacter.current = start;
    onHighlightChange?.({ pageIndex: page, start, end });
  }

  function startFallback(pageText: string, page: number, currentRun: number): void {
    clearFallback();
    const ranges = narrationWordRanges(pageText);
    let cursor = Math.max(0, ranges.findIndex((range) => range.end > activeCharacter.current));
    if (cursor < 0) cursor = 0;
    fallbackTimer.current = window.setInterval(() => {
      if (runId.current !== currentRun || cursor >= ranges.length) {
        clearFallback();
        return;
      }
      const range = ranges[cursor]!;
      emitHighlight(page, range.start, range.end);
      cursor += 1;
    }, persona === "woman" ? 335 : 355);
  }

  function speakPage(page: number, currentRun: number): void {
    const pageText = narrationPages[page];
    if (!pageText || runId.current !== currentRun) {
      setState("idle");
      onHighlightChange?.(null);
      return;
    }

    activePage.current = page;
    activeCharacter.current = 0;
    const utterance = new SpeechSynthesisUtterance(pageText);
    utterance.lang = language === "en" ? "en-US" : "es-AR";
    utterance.rate = persona === "woman" ? 0.84 : 0.8;
    utterance.pitch = persona === "woman" ? 1.06 : 0.72;
    utterance.volume = 0.94;
    utterance.voice = pickNarratorVoice(voices, language, persona);
    utterance.onstart = () => startFallback(pageText, page, currentRun);
    utterance.onboundary = (event) => {
      if (runId.current !== currentRun || event.name === "sentence") return;
      clearFallback();
      const ranges = narrationWordRanges(pageText);
      const range = ranges.find((candidate) => candidate.start <= event.charIndex && candidate.end > event.charIndex)
        ?? ranges.find((candidate) => candidate.start >= event.charIndex);
      if (range) emitHighlight(page, range.start, range.end);
    };
    utterance.onerror = () => {
      clearFallback();
      setState("idle");
      onHighlightChange?.(null);
    };
    utterance.onend = () => {
      clearFallback();
      if (runId.current !== currentRun) return;
      const nextPage = page + 1;
      if (nextPage < narrationPages.length) {
        activePage.current = nextPage;
        activeCharacter.current = 0;
        onPageChange?.(nextPage);
        window.setTimeout(() => speakPage(nextPage, currentRun), reduceMotion ? 80 : 720);
        return;
      }
      setState("idle");
      onHighlightChange?.(null);
    };
    window.speechSynthesis.speak(utterance);
    setState("speaking");
  }

  function play() {
    if (!available) return;
    if (state === "paused") {
      window.speechSynthesis.resume();
      startFallback(narrationPages[activePage.current] ?? "", activePage.current, runId.current);
      setState("speaking");
      return;
    }
    window.speechSynthesis.cancel();
    runId.current += 1;
    activePage.current = Math.min(pageIndex, narrationPages.length - 1);
    speakPage(activePage.current, runId.current);
  }

  function pause() {
    if (!available) return;
    window.speechSynthesis.pause();
    clearFallback();
    setState("paused");
  }

  function stopNarration() {
    if (available) window.speechSynthesis.cancel();
    runId.current += 1;
    clearFallback();
    setState("idle");
    onHighlightChange?.(null);
  }

  if (!available) return null;

  return (
    <motion.aside
      className={`floating-narrator ${open ? "is-open" : ""}`}
      drag
      dragConstraints={dragBounds}
      dragMomentum={false}
      dragElastic={0.04}
      whileDrag={reduceMotion ? {} : { scale: 1.035, cursor: "grabbing" }}
      aria-label={language === "en" ? "Floating story narrator" : "Narrador flotante del cuento"}
    >
      <AnimatePresence>
        {open ? (
          <motion.div className="floating-narrator__panel" initial={reduceMotion ? false : { opacity: 0, y: 16, scale: .94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .95 }}>
            <header>
              <span><SparkleIcon weight="fill" /></span>
              <div><strong>{copy.heading}</strong><small>{copy.helper}</small></div>
              <button type="button" onClick={() => setOpen(false)} aria-label={language === "en" ? "Close narrator" : "Cerrar narrador"}><XIcon /></button>
            </header>
            <div className="floating-narrator__personas">
              {(["woman", "man"] as const).map((candidate) => {
                const character = copy[candidate];
                const Icon = candidate === "woman" ? SparkleIcon : CompassIcon;
                return (
                  <button key={candidate} type="button" className={persona === candidate ? "is-selected" : ""} aria-pressed={persona === candidate} onClick={() => setPersona(candidate)}>
                    <span><Icon weight="duotone" /></span>
                    <strong>{character.name}</strong>
                    <small>{character.role}</small>
                    <i>{character.description}</i>
                  </button>
                );
              })}
            </div>
            <div className="floating-narrator__page-state">
              <span>{language === "en" ? "Narrated page" : "Página narrada"}</span>
              <strong>{Math.min(pageIndex + 1, narrationPages.length)} / {narrationPages.length}</strong>
            </div>
            <div className="floating-narrator__controls">
              <button type="button" className="floating-narrator__play" onClick={state === "speaking" ? pause : play}>
                {state === "speaking" ? <PauseIcon weight="fill" /> : <PlayIcon weight="fill" />}
                <span>{state === "speaking" ? (language === "en" ? "Pause" : "Pausar") : state === "paused" ? (language === "en" ? "Continue" : "Continuar") : (language === "en" ? "Read from this page" : "Leer desde esta página")}</span>
              </button>
              {state !== "idle" ? <button type="button" onClick={stopNarration} aria-label={language === "en" ? "Stop narration" : "Detener narración"}><SpeakerSlashIcon /></button> : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <motion.button
        className="floating-narrator__launcher"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        animate={state === "speaking" && !reduceMotion ? { boxShadow: ["0 0 0 0 rgba(255,214,62,.58)", "0 0 0 18px rgba(255,214,62,0)"] } : {}}
        transition={{ duration: 1.7, repeat: state === "speaking" ? Number.POSITIVE_INFINITY : 0 }}
      >
        <SpeakerHighIcon weight="fill" />
        <span>{language === "en" ? "Story help" : "Ayuda del cuento"}</span>
      </motion.button>
    </motion.aside>
  );
}
