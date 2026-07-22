import {
  ArrowRightIcon,
  CheckCircleIcon,
  LockKeyOpenIcon,
  MagicWandIcon,
  ShieldCheckIcon,
  SparkleIcon,
} from "../components/icons";
import { motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  demoProfile,
  useAuth,
  type AvatarId,
  type DemoProfile,
} from "../auth/AuthContext";
import { useTransition } from "../components/motion/TransitionContext";
import { FloatingShape, riseItem, staggerContainer } from "../components/MotionPrimitives";
import { ProfileAvatar } from "../components/VisualIcons";
import heroImage from "../../../stitch_story_teacher_ai_platform/a_giant_magical_open_book_for_a_kids_app_landing_page._from_the_pages_friendly/screen.png";

const avatarOptions: Array<{ id: AvatarId; label: string }> = [
  { id: "explorer", label: "Explorador" },
  { id: "dreamer", label: "Soñador" },
  { id: "inventor", label: "Inventor" },
];

function safeNext(value: string | null): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/inicio";
}

export function LoginPage() {
  const { login, profile } = useAuth();
  const { startTransition } = useTransition();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState(profile?.name ?? "");
  const [favoriteTheme, setFavoriteTheme] = useState(profile?.favoriteTheme ?? "Espacio");
  const [avatarId, setAvatarId] = useState<AvatarId>(profile?.avatarId ?? "explorer");
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      setError("Escribí un nombre o apodo de al menos 2 letras.");
      return;
    }
    const nextProfile: DemoProfile = {
      name: cleanName.slice(0, 30),
      age: profile?.age ?? demoProfile.age,
      favoriteTheme,
      avatarId,
    };
    login(nextProfile);
    startTransition(safeNext(searchParams.get("next")));
  }

  function enterAsSofia() {
    login(demoProfile);
    startTransition(safeNext(searchParams.get("next")));
  }

  return (
    <div className="login-page page-width">
      <motion.section
        className="login-world"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="login-world__copy" variants={riseItem}>
          <span className="pill"><SparkleIcon weight="fill" /> Tu aventura empieza acá</span>
          <h1>Tu puerta secreta a miles de historias</h1>
          <p>
            Creá un perfil de exploración para que Lumi recuerde cómo te gusta
            aprender en este dispositivo.
          </p>
          <div className="login-benefits">
            <span><CheckCircleIcon weight="fill" /> Cuentos a tu medida</span>
            <span><CheckCircleIcon weight="fill" /> Desafíos de comprensión</span>
            <span><CheckCircleIcon weight="fill" /> Biblioteca personal</span>
          </div>
        </motion.div>

        <motion.div className="login-portal" variants={riseItem} aria-hidden="true">
          <motion.div
            className="login-portal__ring"
            animate={{ rotate: 360 }}
            transition={{ duration: 26, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
          <img src={heroImage} alt="" />
          <FloatingShape className="login-float login-float--one"><MagicWandIcon weight="duotone" /></FloatingShape>
          <FloatingShape className="login-float login-float--two" delay={0.8}><SparkleIcon weight="fill" /></FloatingShape>
        </motion.div>
      </motion.section>

      <motion.section
        className="login-card"
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 150, damping: 21, delay: 0.12 }}
      >
        <div className="login-card__heading">
          <span className="login-card__icon"><LockKeyOpenIcon size={28} weight="duotone" /></span>
          <div>
            <span className="eyebrow">Acceso de demostración</span>
            <h2>¿Quién va a explorar hoy?</h2>
          </div>
        </div>

        <div className="demo-notice">
          <ShieldCheckIcon size={24} weight="duotone" />
          <p><strong>Sin contraseña ni cuenta real.</strong> Este perfil se guarda solamente en este navegador.</p>
        </div>

        <form onSubmit={submit} className="login-form">
          <label className="text-field">
            <span>Nombre o apodo</span>
            <input
              value={name}
              minLength={2}
              maxLength={30}
              autoComplete="nickname"
              placeholder="Ej.: Vale"
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <label className="text-field">
            <span>Mundo favorito</span>
            <select value={favoriteTheme} onChange={(event) => setFavoriteTheme(event.target.value)}>
              {[
                "Espacio",
                "Fantasía",
                "Océano",
                "Selva",
                "Inventos",
              ].map((theme) => <option key={theme}>{theme}</option>)}
            </select>
          </label>

          <fieldset className="avatar-picker">
            <legend>Elegí tu insignia</legend>
            <div>
              {avatarOptions.map((option) => (
                <motion.button
                  key={option.id}
                  type="button"
                  className={avatarId === option.id ? "is-selected" : ""}
                  aria-pressed={avatarId === option.id}
                  onClick={() => setAvatarId(option.id)}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ProfileAvatar avatarId={option.id} size={34} />
                  <span>{option.label}</span>
                </motion.button>
              ))}
            </div>
          </fieldset>

          {error ? <p className="form-error" role="alert">{error}</p> : null}

          <motion.button
            className="button button--yellow login-submit"
            type="submit"
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ y: 3, scale: 0.98 }}
          >
            Abrir mi mundo <ArrowRightIcon size={22} weight="bold" />
          </motion.button>
          <button className="login-quick" type="button" onClick={enterAsSofia}>
            Probar rápidamente como Sofía
          </button>
        </form>
      </motion.section>
    </div>
  );
}
