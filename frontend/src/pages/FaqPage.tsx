import { motion } from "motion/react";
import {
  ArrowRightIcon,
  CaretDownIcon,
  ChatCircleDotsIcon,
  GraduationCapIcon,
  MagicWandIcon,
} from "../components/icons";
import { Lumi } from "../components/Lumi";
import { riseItem, staggerContainer } from "../components/MotionPrimitives";
import TransitionLink from "../components/motion/TransitionLink";

const frequentlyAskedQuestions = [
  {
    question: "¿Para qué edades está pensado Story Teacher?",
    answer: "Está diseñado para niñas y niños de 6 a 12 años. La edad del perfil adapta la extensión, el vocabulario y la complejidad de las pistas de cada aventura.",
  },
  {
    question: "¿Los cuentos son siempre iguales?",
    answer: "No. Cada lector puede elegir el mundo, el protagonista, la dificultad y lo que quiere aprender. En las historias interactivas, además, sus decisiones cambian el recorrido y el final.",
  },
  {
    question: "¿Qué habilidades se practican?",
    answer: "Las actividades trabajan comprensión literal, inferencias, vocabulario, secuencias y causa–efecto. Las devoluciones explican cada respuesta sin usar mensajes punitivos.",
  },
  {
    question: "¿Qué pueden hacer docentes y familias?",
    answer: "Pueden organizar cursos, proponer misiones de lectura, consultar avances por habilidad y enviar postales de reconocimiento para acompañar el proceso.",
  },
  {
    question: "¿La experiencia tiene publicidad o desafíos por velocidad?",
    answer: "No. Story Teacher no incluye publicidad y sus recompensas no dependen de responder rápido. El foco está puesto en leer, pensar y animarse a volver a intentar.",
  },
  {
    question: "¿Necesito crear una cuenta para probar la demo?",
    answer: "No. La demo ofrece perfiles de estudiante y adulto listos para explorar, y también permite crear un perfil infantil local sin contraseña.",
  },
];

export function FaqPage() {
  return (
    <div className="faq-page">
      <header className="faq-hero page-width">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <span className="faq-hero__icon"><ChatCircleDotsIcon size={43} weight="duotone" /></span>
          <span className="eyebrow">Centro de ayuda</span>
          <h1>Preguntas frecuentes</h1>
          <p>Todo lo que necesitás saber para empezar a imaginar, leer y aprender con Story Teacher.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .12 }}>
          <Lumi mood="encouraging" message="Buscá tu pregunta y desplegá la respuesta. ¡Es muy fácil!" />
        </motion.div>
      </header>

      <main className="landing-faq faq-page__content">
        <div className="page-width">
          <motion.div
            className="landing-faq__list"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {frequentlyAskedQuestions.map(({ question, answer }, index) => (
              <motion.details className="landing-faq__item" key={question} variants={riseItem}>
                <summary>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{question}</strong>
                  <CaretDownIcon className="landing-faq__caret" weight="bold" aria-hidden="true" />
                </summary>
                <div><p>{answer}</p></div>
              </motion.details>
            ))}
          </motion.div>

          <motion.aside className="faq-next" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div>
              <span className="eyebrow">¿Listos para comenzar?</span>
              <h2>Elegí cómo querés entrar</h2>
              <p>Podés crear tu primera aventura o conocer el espacio para docentes y familias.</p>
            </div>
            <div>
              <TransitionLink href="/login?next=%2Fcrear" className="button button--yellow">
                <MagicWandIcon weight="duotone" /> Crear una aventura <ArrowRightIcon weight="bold" />
              </TransitionLink>
              <TransitionLink href="/login?next=%2Fadulto" className="button button--outline">
                <GraduationCapIcon weight="duotone" /> Espacio de adultos
              </TransitionLink>
            </div>
          </motion.aside>
        </div>
      </main>
    </div>
  );
}
