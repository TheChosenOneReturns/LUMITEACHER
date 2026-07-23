import type { UserProfile, UserRole } from "@story-teacher/shared";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, ApiClientError } from "../api/client";
import { useAuth, type AvatarId } from "../auth/AuthContext";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  GraduationCapIcon,
  PlusIcon,
  SparkleIcon,
  UserCircleIcon,
} from "../components/icons";
import { Lumi } from "../components/Lumi";
import { riseItem, staggerContainer } from "../components/MotionPrimitives";
import { useTransition } from "../components/motion/TransitionContext";
import { ProfileAvatar } from "../components/VisualIcons";
import { CreateProfileModal } from "../components/CreateProfileModal";

function safeNext(value: string | null, role: UserRole): string {
  if (value?.startsWith("/") && !value.startsWith("//")) return value;
  return role === "adult" ? "/adulto" : "/inicio";
}

export function LoginPage() {
  const { login } = useAuth();
  const { startTransition } = useTransition();
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState<UserRole>("student");
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creatingProfile, setCreatingProfile] = useState(false);

  useEffect(() => {
    api.listDemoProfiles()
      .then(setProfiles)
      .catch((loadError) => setError(
        loadError instanceof ApiClientError ? loadError.message : "No pudimos cargar los perfiles demo.",
      ))
      .finally(() => setLoading(false));
  }, []);

  const visibleProfiles = useMemo(
    () => profiles.filter((profile) => profile.role === role),
    [profiles, role],
  );

  async function enter(profile: UserProfile) {
    setEntering(profile.userId);
    setError(null);
    try {
      const next = await login(profile.userId);
      startTransition(safeNext(searchParams.get("next"), next.role));
    } catch (enterError) {
      setError(enterError instanceof ApiClientError ? enterError.message : "No pudimos abrir el perfil.");
      setEntering(null);
    }
  }

  async function useCreatedProfile(profile: UserProfile) {
    setProfiles((current) => [...current, profile]);
    setCreatingProfile(false);
    await enter(profile);
  }

  return (
    <div className="login-page page-width">
      <motion.section className="login-intro" variants={staggerContainer} initial="hidden" animate="visible">
        <motion.div className="login-intro__copy" variants={riseItem}>
          <span className="pill"><SparkleIcon weight="fill" /> Ingresar a Story Teacher</span>
          <h1>¿Quién va a aprender hoy?</h1>
          <p>Elegí si entrás para jugar y leer, o para acompañar el progreso. En esta demo no necesitás contraseña.</p>
          <ol className="login-steps" aria-label="Pasos para ingresar">
            <li className="is-current"><span>1</span><strong>Elegí tu modo</strong></li>
            <li><span>2</span><strong>Elegí tu perfil</strong></li>
            <li><span>3</span><strong>¡A explorar!</strong></li>
          </ol>
        </motion.div>
        <motion.div className="login-intro__lumi" variants={riseItem}>
          <span className="login-orbit login-orbit--one" aria-hidden="true"><SparkleIcon weight="fill" /></span>
          <span className="login-orbit login-orbit--two" aria-hidden="true"><SparkleIcon weight="fill" /></span>
          <Lumi mood="encouraging" message="¡Yo te acompaño! Primero elegí cómo querés entrar." />
        </motion.div>
      </motion.section>

      <motion.section className="login-card login-card--profiles" initial={{ opacity: 0, y: 28, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
        <div className="login-card__heading">
          <span className="login-step-number">1</span>
          <div><span className="eyebrow">Primero</span><h2>Elegí tu modo de entrada</h2></div>
        </div>

        <div className="role-switch" role="tablist" aria-label="Tipo de perfil">
          <button type="button" role="tab" aria-label="Alumno" aria-selected={role === "student"} className={role === "student" ? "is-active" : ""} onClick={() => setRole("student")}>
            <span><UserCircleIcon size={30} weight="duotone" /></span>
            <strong>Quiero aprender</strong>
            <small>Leer cuentos, superar desafíos y ganar premios</small>
            <CheckCircleIcon className="role-switch__check" weight="fill" />
          </button>
          <button type="button" role="tab" aria-label="Adulto" aria-selected={role === "adult"} className={role === "adult" ? "is-active" : ""} onClick={() => setRole("adult")}>
            <span><GraduationCapIcon size={30} weight="duotone" /></span>
            <strong>Quiero acompañar</strong>
            <small>Crear cursos, enviar misiones y ver avances</small>
            <CheckCircleIcon className="role-switch__check" weight="fill" />
          </button>
        </div>

        <div className="profile-picker-heading">
          <span className="login-step-number">2</span>
          <div><span className="eyebrow">Después</span><h3>Elegí quién sos</h3></div>
          <span className="demo-mode-badge">Demo sin contraseña</span>
        </div>

        {role === "student" ? <motion.button className="create-profile-button" type="button" onClick={() => setCreatingProfile(true)} whileHover={{ y: -3 }} whileTap={{ scale: .98 }}><span><PlusIcon weight="bold" /></span><span><strong>Crear mi propio explorador</strong><small>Elegí un animal o personaje y personalizalo</small></span><ArrowRightIcon weight="bold" /></motion.button> : null}

        {loading ? <p className="profile-picker-status">Preparando perfiles…</p> : null}
        <div className="profile-picker-grid">
          {visibleProfiles.map((profile, index) => (
            <motion.button
              key={profile.userId}
              type="button"
              className="profile-login-card"
              onClick={() => void enter(profile)}
              disabled={Boolean(entering)}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              whileHover={{ y: -5, rotate: index % 2 ? 0.6 : -0.6 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="profile-login-card__avatar">
                <ProfileAvatar avatarId={profile.avatarId as AvatarId} size={42} />
              </span>
              <span className="profile-login-card__copy">
                <strong>{profile.displayName}</strong>
                <small>{profile.role === "adult" ? profile.adultLabel : `Le gustan: ${profile.favoriteTheme}`}</small>
                <b>{entering === profile.userId ? "Abriendo su mundo…" : `Entrar como ${profile.displayName}`}</b>
              </span>
              <span className="profile-login-card__arrow"><ArrowRightIcon size={20} weight="bold" /></span>
            </motion.button>
          ))}
        </div>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <p className="login-privacy"><CheckCircleIcon weight="fill" /> Todo el progreso de esta demo queda guardado únicamente en tu computadora.</p>
      </motion.section>
      <AnimatePresence>{creatingProfile ? <CreateProfileModal onClose={() => setCreatingProfile(false)} onCreated={useCreatedProfile} /> : null}</AnimatePresence>
    </div>
  );
}
