import {
  ArrowRightIcon,
  BookOpenTextIcon,
  BrainIcon,
  CastleTurretIcon,
  MagicWandIcon,
  RocketLaunchIcon,
  SparkleIcon,
  StarFourIcon,
} from "../components/icons";
import { motion } from "motion/react";
import TransitionLink from "../components/motion/TransitionLink";
import { useAuth } from "../auth/AuthContext";
import { FloatingShape, riseItem, staggerContainer } from "../components/MotionPrimitives";
import heroImage from "../../../stitch_story_teacher_ai_platform/a_giant_magical_open_book_for_a_kids_app_landing_page._from_the_pages_friendly/screen.png";

export function LandingPage() {
  const { profile } = useAuth();
  const createPath = profile ? "/crear" : "/login?next=%2Fcrear";
  const libraryPath = profile ? "/inicio" : "/login?next=%2Finicio";

  return (
    <div className="landing-wrap">
      <section className="landing page-width">
        <motion.div
          className="landing__copy"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 variants={riseItem}>
            Una historia que <span>cobra vida</span> para vos
          </motion.h1>
          <motion.p variants={riseItem}>
            Elegí el mundo, el personaje y lo que querés aprender. Lumi crea
            una aventura única y después te desafía a descubrir sus pistas.
          </motion.p>
          <motion.div className="button-row" variants={riseItem}>
            <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ y: 3, scale: 0.98 }}>
              <TransitionLink href={createPath} className="button button--yellow">
                <MagicWandIcon size={23} weight="duotone" /> Crear mi historia
                <ArrowRightIcon size={21} weight="bold" />
              </TransitionLink>
            </motion.div>
            <motion.div whileHover={{ y: -4 }} whileTap={{ y: 3 }}>
              <TransitionLink href={libraryPath} className="button button--outline">
                <BookOpenTextIcon size={22} weight="duotone" /> Explorar historias
              </TransitionLink>
            </motion.div>
          </motion.div>
          <motion.div className="landing-proof" variants={riseItem}>
            <div><BrainIcon size={23} weight="duotone" /><span><strong>5 desafíos</strong> por cuento</span></div>
            <div><StarFourIcon size={23} weight="duotone" /><span><strong>6 a 12 años</strong> adaptado a su edad</span></div>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero-stage"
          initial={{ opacity: 0, scale: 0.86, rotate: 3 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 110, damping: 18, delay: 0.16 }}
        >
          <motion.div
            className="hero-stage__glow"
            animate={{ scale: [0.94, 1.05, 0.94], opacity: [0.55, 0.85, 0.55] }}
            transition={{ duration: 4.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
          <motion.div
            className="hero-stage__image"
            animate={{ y: [0, -9, 0], rotate: [0, -0.7, 0] }}
            transition={{ duration: 5.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <img src={heroImage} alt="Libro mágico abierto con mundos de fantasía, ciencia y naturaleza" />
            <div className="hero-stage__caption">
              <span><SparkleIcon size={18} weight="fill" /></span>
              <p><small>Lumi está listo</small><strong>¿Qué imaginamos hoy?</strong></p>
            </div>
          </motion.div>
          <FloatingShape className="hero-float hero-float--rocket"><RocketLaunchIcon weight="duotone" /></FloatingShape>
          <FloatingShape className="hero-float hero-float--castle" delay={0.9}><CastleTurretIcon weight="duotone" /></FloatingShape>
          <FloatingShape className="hero-float hero-float--spark" delay={1.6}><SparkleIcon weight="fill" /></FloatingShape>
        </motion.div>
      </section>

      <section className="landing-ribbon" aria-label="Cómo funciona">
        <motion.div className="page-width" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }}>
          {[
            ["01", "Elegí", "Un tema y una misión"],
            ["02", "Imaginá", "Lumi crea tu cuento"],
            ["03", "Descubrí", "Cinco pistas para aprender"],
          ].map(([number, title, copy]) => (
            <motion.div key={number} variants={riseItem}>
              <span>{number}</span><p><strong>{title}</strong><small>{copy}</small></p>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
