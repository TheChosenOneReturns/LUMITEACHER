import { motion } from "motion/react";
import {
  ArrowRightIcon,
  BookOpenTextIcon,
  BrainIcon,
  CheckCircleIcon,
  ChartLineUpIcon,
  ChatCircleDotsIcon,
  GraduationCapIcon,
  MagicWandIcon,
  PathIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  SparkleIcon,
  StarFourIcon,
  TrophyIcon,
  UserCircleIcon,
} from "../components/icons";
import { AnimatedFaqItems } from "../components/AnimatedFaqItems";
import TransitionLink from "../components/motion/TransitionLink";
import { useAuth } from "../auth/AuthContext";
import { FloatingShape, riseItem, staggerContainer } from "../components/MotionPrimitives";
import { Lumi } from "../components/Lumi";
import { StoryThemeIcon } from "../components/VisualIcons";
import heroImage from "../assets/story-scenes/scene-space.webp";
import poweredByAwsLogo from "../assets/partners/powered-by-aws-dark.webp";
import codigofacilito from "../assets/partners/codigofacilito.webp";
import { landingFrequentlyAskedQuestions } from "./faqContent";
import kiro from "../assets/partners/kiro.png"

const journeySteps = [
  {
    number: "01",
    title: "Elegí",
    copy: "Un mundo, una misión y algo nuevo para aprender.",
    Icon: MagicWandIcon,
  },
  {
    number: "02",
    title: "Viví la aventura",
    copy: "Leé, escuchá y tomá decisiones que cambian el cuento.",
    Icon: PathIcon,
  },
  {
    number: "03",
    title: "Descubrí",
    copy: "Resolvé pistas, entendé mejor y celebrá cada avance.",
    Icon: TrophyIcon,
  },
];

const learningSkills = [
  "Comprensión",
  "Inferencias",
  "Vocabulario",
  "Secuencias",
  "Emociones",
];

const studentProgress = [
  { name: "Luna", skills: { Comprensión: 88, Inferencias: 72, Vocabulario: 91 }, alert: false },
  { name: "Max", skills: { Comprensión: 32, Inferencias: 61, Vocabulario: 55 }, alert: true },
];

export function LandingPage() {
  const { profile } = useAuth();
  const isAdult = profile?.role === "adult";
  const studentPath = profile ? (isAdult ? "/adulto" : "/inicio") : "/login?role=student&next=%2Finicio";
  const createPath = profile ? (isAdult ? "/adulto/cursos" : "/crear") : "/login?role=student&next=%2Fcrear";
  const adultPath = profile ? (isAdult ? "/adulto" : "/inicio") : "/login?role=adult&next=%2Fadulto";

  return (
    <div className="landing-wrap landing-v2">
      <section className="landing page-width" aria-labelledby="landing-title">
        <motion.div
          className="landing__copy"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* <motion.span className="landing-kicker" variants={riseItem}>
            <SparkleIcon weight="fill" /> Lectura que se convierte en aventura
          </motion.span> */}
          <motion.h1 id="landing-title" variants={riseItem}>
            Historias que despiertan las <span>ganas de leer</span>
          </motion.h1>
          {/* <motion.p variants={riseItem}>
            Cada niño elige su mundo y Lumi crea una aventura a su medida.
            Después, las decisiones y las pistas transforman la lectura en aprendizaje.
          </motion.p> */}
          <motion.div className="button-row landing-actions" variants={riseItem}>
            <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ y: 3, scale: 0.98 }}>
              <TransitionLink href={createPath} className="button button--yellow">
                <MagicWandIcon size={23} weight="duotone" />
                {isAdult ? "Crear una misión" : "Crear mi aventura"}
                <ArrowRightIcon size={21} weight="bold" />
              </TransitionLink>
            </motion.div>
            <motion.div whileHover={{ y: -4 }} whileTap={{ y: 3 }}>
              <TransitionLink href={adultPath} className="button button--outline">
                <GraduationCapIcon size={22} weight="duotone" />
                Soy docente o familiar
              </TransitionLink>
            </motion.div>
          </motion.div>
          <motion.div className="landing-proof" variants={riseItem} aria-label="Características principales">
            <div><CheckCircleIcon size={23} weight="fill" /><span><strong>De 6 a 12 años</strong>Adaptado a cada lector</span></div>
            <div><ShieldCheckIcon size={23} weight="duotone" /><span><strong>Sin publicidad</strong>Un espacio cuidado</span></div>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero-stage"
          initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 110, damping: 18, delay: 0.12 }}
        >
          <div className="hero-stage__glow" />
          <motion.div
            className="landing-story-demo"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <div className="landing-story-demo__scene">
              <img
                src={heroImage}
                alt="Aventura espacial creada para practicar comprensión lectora"
                fetchPriority="high"
              />
              <span className="landing-story-demo__tag"><RocketLaunchIcon weight="duotone" /> Aventura espacial</span>
              <div className="landing-story-demo__chapter">
                <small>CAPÍTULO 2 DE 3</small>
                <span><i className="is-active" /><i className="is-active" /><i /></span>
              </div>
            </div>
            {/* <div className="landing-story-demo__page">
              <span className="eyebrow"><BookOpenTextIcon /> Una historia creada con Lumi</span>
              <h2>La señal del planeta azul</h2>
              <p>Una luz desconocida apareció detrás de los anillos. Luna respiró hondo: era momento de elegir el próximo rumbo.</p>
              <div className="landing-story-demo__choice">
                <span>A</span><strong>Seguir la señal misteriosa</strong><ArrowRightIcon weight="bold" />
              </div>
            </div> */}
          </motion.div>
          <div className="hero-stage__mascot"><Lumi compact mood="encouraging" message="¡Tu decisión cambia la historia!" /></div>
          <FloatingShape className="hero-float hero-float--spark"><SparkleIcon weight="fill" /></FloatingShape>
          <FloatingShape className="hero-float hero-float--rocket" delay={0.8}><StarFourIcon weight="fill" /></FloatingShape>
        </motion.div>
      </section>

      <section className="landing-ribbon" id="como-funciona" aria-label="Cómo funciona">
        <motion.div className="page-width" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }}>
          {journeySteps.map(({ number, title, copy, Icon }) => (
            <motion.article key={number} variants={riseItem}>
              <span>{number}</span>
              <Icon className="landing-ribbon__icon" size={25} weight="duotone" />
              <p><strong>{title}</strong><small>{copy}</small></p>
            </motion.article>
          ))}
        </motion.div>
      </section>

      <section className="landing-audiences page-width" aria-labelledby="audiences-title">
        <motion.div
          className="landing-section__heading"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.span className="eyebrow" variants={riseItem}>Elegí tu forma de entrar</motion.span>
          <motion.h2 id="audiences-title" variants={riseItem}>Dos formas de vivir Story Teacher</motion.h2>
          <motion.p variants={riseItem}>
            Los niños exploran y aprenden. Los adultos crean propuestas y acompañan el recorrido.
          </motion.p>
        </motion.div>
        <motion.div
          className="landing-audience-grid"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.22 }}
        >
          <motion.article
            className="landing-audience-card landing-audience-card--student"
            variants={riseItem}
            whileHover={{ y: -8, rotate: -0.35 }}
            transition={{ type: "spring", stiffness: 180, damping: 20 }}
          >
            <div className="landing-audience-card__icon">
              <UserCircleIcon size={42} weight="duotone" />
            </div>
            <span className="eyebrow">Para niños y niñas</span>
            <h3>Quiero vivir una aventura</h3>
            <p>Historias para leer, escuchar, elegir caminos y aprender jugando con Lumi.</p>
            <ul>
              <li><CheckCircleIcon weight="fill" /> Mundos personalizados</li>
              <li><CheckCircleIcon weight="fill" /> Decisiones y desafíos</li>
              <li><CheckCircleIcon weight="fill" /> Recompensas por avanzar</li>
            </ul>
            <TransitionLink href={studentPath} className="button button--yellow">
              Entrar como niño/a <ArrowRightIcon weight="bold" />
            </TransitionLink>
          </motion.article>
          <motion.article
            className="landing-audience-card landing-audience-card--adult"
            variants={riseItem}
            whileHover={{ y: -8, rotate: 0.35 }}
            transition={{ type: "spring", stiffness: 180, damping: 20 }}
          >
            <div className="landing-audience-card__icon">
              <GraduationCapIcon size={42} weight="duotone" />
            </div>
            <span className="eyebrow">Para docentes y familias</span>
            <h3>Quiero acompañar a un lector</h3>
            <p>Un espacio claro para crear misiones, organizar cursos y observar avances.</p>
            <ul>
              <li><CheckCircleIcon weight="fill" /> Misiones educativas</li>
              <li><CheckCircleIcon weight="fill" /> Seguimiento por habilidades</li>
              <li><CheckCircleIcon weight="fill" /> Acompañamiento cuidado</li>
            </ul>
            <TransitionLink href={adultPath} className="button button--outline">
              Entrar como adulto/a <ArrowRightIcon weight="bold" />
            </TransitionLink>
          </motion.article>
        </motion.div>
      </section>

      <section className="landing-section landing-experience page-width" id="experiencia" aria-labelledby="experience-title">
        <motion.div className="landing-section__heading" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
          <motion.span className="eyebrow" variants={riseItem}>Aprender sin salir de la historia</motion.span>
          <motion.h2 id="experience-title" variants={riseItem}>Una aventura completa, no sólo un cuento</motion.h2>
          <motion.p variants={riseItem}>Cada parte del recorrido tiene un propósito y acompaña al lector sin interrumpir su imaginación.</motion.p>
        </motion.div>

        <motion.div className="landing-feature-grid" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
          <motion.article className="landing-feature landing-feature--blue" variants={riseItem} whileHover={{ y: -9, rotate: -0.5 }}>
            <span><BookOpenTextIcon size={32} weight="duotone" /></span>
            <small>01 · IMAGINAR</small>
            <h3>Una historia personal</h3>
            <p>Edad, intereses, protagonista y objetivo educativo se combinan en una aventura única.</p>
          </motion.article>
          <motion.article className="landing-feature landing-feature--violet" variants={riseItem} whileHover={{ y: -9, rotate: 0.5 }}>
            <span><PathIcon size={32} weight="duotone" /></span>
            <small>02 · DECIDIR</small>
            <h3>El lector elige el rumbo</h3>
            <p>Las decisiones cambian los capítulos y convierten la lectura en una experiencia activa.</p>
          </motion.article>
          <motion.article className="landing-feature landing-feature--green" variants={riseItem} whileHover={{ y: -9, rotate: -0.5 }}>
            <span><BrainIcon size={32} weight="duotone" /></span>
            <small>03 · COMPRENDER</small>
            <h3>Pistas que hacen pensar</h3>
            <p>Cinco habilidades lectoras se practican con devoluciones amables y explicaciones claras.</p>
          </motion.article>
        </motion.div>
      </section>

      <section className="landing-adults" aria-labelledby="adults-title">
        <div className="page-width">
          <motion.div className="landing-adults__copy" initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <span className="eyebrow"><GraduationCapIcon /> Para quienes acompañan</span>
            <h2 id="adults-title">Vos proponés la misión. Lumi enciende la aventura.</h2>
            <p>Docentes y familias pueden crear propuestas de lectura, seguir avances y acompañar lo que cada niño necesita practicar.</p>
            <TransitionLink href={adultPath} className="button button--primary">
              Ver el espacio de adultos <ArrowRightIcon weight="bold" />
            </TransitionLink>
          </motion.div>
          <motion.div
            className="landing-adult-panel"
            initial={{ opacity: 0, y: 24, rotate: 1.2 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            whileHover={{ y: -6, rotate: .35 }}
            viewport={{ once: true, amount: .35 }}
            transition={{ type: "spring", stiffness: 145, damping: 20 }}
          >
            <header><span><ChartLineUpIcon size={28} weight="duotone" /></span><div><small>MISIÓN ACTIVA</small><strong>Exploradores del espacio</strong></div></header>
            <div className="landing-adult-panel__students">
              {studentProgress.map(({ name, skills, alert }) => (
                <div key={name} className={`landing-adult-panel__student${alert ? " landing-adult-panel__student--alert" : ""}`}>
                  <div className="landing-adult-panel__student-name">
                    <UserCircleIcon size={26} weight="duotone" />
                    <strong>{name}</strong>
                  </div>
                  {alert && (
                    <div className="landing-adult-panel__alert">
                      <ChatCircleDotsIcon size={16} weight="fill" />
                      <span>Comprensión por debajo del 40% · Revisá la misión</span>
                    </div>
                  )}
                  <div className="landing-adult-panel__student-skills">
                    {Object.entries(skills).map(([skill, pct]) => (
                      <div key={skill} className="landing-adult-panel__skill-row">
                        <span>{skill}</span>
                        <div className="landing-adult-panel__skill-track"><motion.i initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: .8, ease: "easeOut", delay: .15 }} style={{ width: `${pct}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <motion.section
        className="landing-skills page-width"
        id="habilidades"
        aria-labelledby="skills-title"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: .25 }}
        variants={staggerContainer}
      >
        <motion.div variants={riseItem}>
          <span className="eyebrow">Comprensión que se puede ver</span>
          <h2 id="skills-title">Cinco habilidades, una forma más linda de practicarlas</h2>
        </motion.div>
        <motion.div className="landing-skill-list" variants={staggerContainer}>
          {learningSkills.map((skill, index) => (
            <motion.span key={skill} variants={riseItem} whileHover={{ x: 8, scale: 1.01 }}>
              <b>{index + 1}</b>{skill}<CheckCircleIcon weight="fill" />
            </motion.span>
          ))}
        </motion.div>
      </motion.section>

      <section className="landing-partners" aria-labelledby="partners-title">
        <div className="page-width">
          <motion.div
            className="landing-partners__heading"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.span className="eyebrow" variants={riseItem}>Comunidad y tecnología</motion.span>
            <motion.h2 id="partners-title" variants={riseItem}>Un proyecto con impulso y una nube preparada para crecer</motion.h2>
            <motion.p variants={riseItem}>Story Teacher reúne comunidad, educación y servicios de AWS para convertir cada idea en una experiencia de lectura segura y disponible online.</motion.p>
          </motion.div>
          <motion.div
            className="landing-partners__grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: .25 }}
          >
            <motion.article className="landing-partner-card" variants={riseItem} whileHover={{ y: -6 }}>
              <div className="landing-partner-card__logo landing-partner-card__logo--codigofacilito">
                <img src={codigofacilito} alt="codigofacilito" loading="lazy" decoding="async" />
              </div>
              <div>
                <span>COMUNIDAD QUE IMPULSA</span>
                <h3>Código Facilito</h3>
                <p>El espacio desde el que este proyecto une aprendizaje, creatividad y tecnología.</p>
              </div>
            </motion.article>
            <motion.article className="landing-partner-card" variants={riseItem} whileHover={{ y: -6 }}>
              <div className="landing-partner-card__logo landing-partner-card__logo--kiro">
                <img src={kiro} alt="Kiro - IDE de desarrollo asistido por IA" loading="lazy" decoding="async" />
              </div>
              <div>
                <span>DESARROLLO ASISTIDO POR IA</span>
                <h3>Kiro</h3>
                <p>IDE de desarrollo asistido por inteligencia artificial que aceleró la creación de este proyecto.</p>
              </div>
            </motion.article>
            <motion.article className="landing-partner-card" variants={riseItem} whileHover={{ y: -6 }}>
              <div className="landing-partner-card__logo landing-partner-card__logo--aws">
                <img src={poweredByAwsLogo} alt="Powered by AWS" loading="lazy" decoding="async" />
              </div>
              <div>
                <span>INFRAESTRUCTURA EN LA NUBE</span>
                <h3>Powered by AWS</h3>
                <p>Amazon Bedrock, Cognito, Lambda, DynamoDB y Amplify sostienen la experiencia online.</p>
              </div>
            </motion.article>
          </motion.div>
        </div>
      </section>

      <section className="landing-faq" id="preguntas" aria-labelledby="landing-faq-title">
        <div className="page-width">
          <motion.div
            className="landing-faq__heading"
            initial={{ opacity: 0, x: -22 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="landing-faq__icon"><ChatCircleDotsIcon size={38} weight="duotone" /></span>
            <span className="eyebrow">Antes de empezar</span>
            <h2 id="landing-faq-title">Preguntas reales, respuestas claras</h2>
            <p>Cómo funciona la IA, qué pueden hacer los adultos y de qué manera cuidamos cada aventura.</p>
            <Lumi compact mood="encouraging" message="Abrí cada pregunta para conocer la respuesta." />
          </motion.div>
          <motion.div
            className="landing-faq__list"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: .12 }}
          >
            <AnimatedFaqItems items={landingFrequentlyAskedQuestions} />
            <motion.div className="landing-faq__more" variants={riseItem}>
              <TransitionLink href="/preguntas-frecuentes">
                Ver todas las preguntas <ArrowRightIcon size={18} weight="bold" />
              </TransitionLink>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <motion.section
        className="landing-final page-width"
        aria-labelledby="final-title"
        initial={{ opacity: 0, y: 30, scale: .98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: .4 }}
        transition={{ type: "spring", stiffness: 135, damping: 20 }}
      >
        <motion.div
          className="landing-final__art"
          aria-hidden="true"
          whileHover={{ rotate: 5, scale: 1.08 }}
          transition={{ type: "spring", stiffness: 240, damping: 16 }}
        >
          <StoryThemeIcon theme="Fantasía" size={96} />
        </motion.div>
        <div>
          <span className="eyebrow"><SparkleIcon weight="fill" /> La próxima historia empieza acá</span>
          <h2 id="final-title">¿Qué mundo imaginamos hoy?</h2>
          <p>Entrá a la demo y creá una aventura en pocos pasos.</p>
        </div>
        <TransitionLink href={createPath} className="button button--yellow">
          {isAdult ? "Ir a mis cursos" : "Empezar una aventura"} <ArrowRightIcon weight="bold" />
        </TransitionLink>
      </motion.section>

      <div className="landing-secondary-link">
        <TransitionLink href={studentPath}>Ya tengo un perfil · Entrar a mi mundo <ArrowRightIcon size={18} /></TransitionLink>
      </div>
    </div>
  );
}
