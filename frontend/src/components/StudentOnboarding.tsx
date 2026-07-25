import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenTextIcon,
  CheckIcon,
  MagicWandIcon,
  PathIcon,
  SparkleIcon,
  TrophyIcon,
  XIcon,
} from "./icons";
import { Lumi } from "./Lumi";

const steps = [
  {
    eyebrow: "PASO 1 DE 3",
    title: "Elegí tu aventura",
    copy: "Podés crear una historia desde cero o empezar con una misión preparada para vos.",
    hint: "Mundos, protagonistas y temas que te interesan.",
    Icon: MagicWandIcon,
    tone: "yellow",
  },
  {
    eyebrow: "PASO 2 DE 3",
    title: "Leé y tomá decisiones",
    copy: "Cada elección cambia el próximo capítulo. No hay un único camino correcto para explorar.",
    hint: "También podés escuchar el cuento con el narrador.",
    Icon: PathIcon,
    tone: "violet",
  },
  {
    eyebrow: "PASO 3 DE 3",
    title: "Descubrí las pistas",
    copy: "Al final vas a resolver cinco desafíos y ganar estrellas para tu mapa, cartas y juegos.",
    hint: "Lumi siempre te explica y te ayuda a seguir.",
    Icon: TrophyIcon,
    tone: "green",
  },
] as const;

interface StudentOnboardingProps {
  displayName: string;
  onDismiss: () => void;
  onFinish: () => void;
}

export function StudentOnboarding({
  displayName,
  onDismiss,
  onFinish,
}: StudentOnboardingProps) {
  const [step, setStep] = useState(0);
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const current = steps[step]!;
  const CurrentIcon = current.Icon;

  useEffect(() => {
    dialogRef.current?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onDismiss]);

  return (
    <motion.div
      className="onboarding-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : .2 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onDismiss();
      }}
    >
      <motion.div
        ref={dialogRef}
        className={`onboarding-card onboarding-card--${current.tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-copy"
        tabIndex={-1}
        initial={{ opacity: 0, y: 28, scale: .96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: .97 }}
        transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 23 }}
      >
        <button className="onboarding-close" type="button" onClick={onDismiss} aria-label="Omitir introducción">
          <XIcon size={22} weight="bold" />
        </button>

        <div className="onboarding-progress" aria-label={`Paso ${step + 1} de ${steps.length}`}>
          {steps.map((item, index) => (
            <span key={item.title} className={index <= step ? "is-active" : ""}>
              {index < step ? <CheckIcon size={13} weight="bold" /> : index + 1}
            </span>
          ))}
        </div>

        <div className="onboarding-layout">
          <div className="onboarding-visual" aria-hidden="true">
            <motion.div
              className="onboarding-orb"
              key={current.title}
              initial={{ scale: .75, rotate: -8, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 210, damping: 18 }}
            >
              <CurrentIcon size={76} weight="duotone" />
              <SparkleIcon className="onboarding-spark onboarding-spark--one" weight="fill" />
              <SparkleIcon className="onboarding-spark onboarding-spark--two" weight="fill" />
            </motion.div>
            <Lumi compact mood={step === 1 ? "reading" : "encouraging"} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              className="onboarding-copy"
              key={current.title}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: reduceMotion ? 0 : .22 }}
            >
              <span className="eyebrow">{current.eyebrow}</span>
              <h1 id="onboarding-title">
                {step === 0 ? `¡Hola, ${displayName}! ` : null}{current.title}
              </h1>
              <p id="onboarding-copy">{current.copy}</p>
              <div className="onboarding-hint"><BookOpenTextIcon weight="duotone" /> {current.hint}</div>
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="onboarding-actions">
          <button
            className="onboarding-skip"
            type="button"
            onClick={onDismiss}
          >
            Omitir por ahora
          </button>
          <div>
            {step > 0 ? (
              <button className="button button--outline" type="button" onClick={() => setStep((value) => value - 1)}>
                <ArrowLeftIcon weight="bold" /> Atrás
              </button>
            ) : null}
            {step < steps.length - 1 ? (
              <button className="button button--primary" type="button" onClick={() => setStep((value) => value + 1)}>
                Siguiente <ArrowRightIcon weight="bold" />
              </button>
            ) : (
              <button className="button button--yellow" type="button" onClick={onFinish}>
                <SparkleIcon weight="fill" /> Crear mi primera aventura
              </button>
            )}
          </div>
        </footer>
      </motion.div>
    </motion.div>
  );
}
