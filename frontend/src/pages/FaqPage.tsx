import { motion } from "motion/react";
import {
  ArrowRightIcon,
  ChatCircleDotsIcon,
  GraduationCapIcon,
  MagicWandIcon,
} from "../components/icons";
import { AnimatedFaqItems } from "../components/AnimatedFaqItems";
import { Lumi } from "../components/Lumi";
import { staggerContainer } from "../components/MotionPrimitives";
import TransitionLink from "../components/motion/TransitionLink";
import { frequentlyAskedQuestions } from "./faqContent";

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
            <AnimatedFaqItems items={frequentlyAskedQuestions} />
          </motion.div>

          <motion.aside className="faq-next" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div>
              <span className="eyebrow">¿Listos para comenzar?</span>
              <h2>Elegí cómo querés entrar</h2>
              <p>Podés crear tu primera aventura o conocer el espacio para docentes y familias.</p>
            </div>
            <div>
              <TransitionLink href="/login?role=student&next=%2Fcrear" className="button button--yellow">
                <MagicWandIcon weight="duotone" /> Crear una aventura <ArrowRightIcon weight="bold" />
              </TransitionLink>
              <TransitionLink href="/login?role=adult&next=%2Fadulto" className="button button--outline">
                <GraduationCapIcon weight="duotone" /> Espacio de adultos
              </TransitionLink>
            </div>
          </motion.aside>
        </div>
      </main>
    </div>
  );
}
