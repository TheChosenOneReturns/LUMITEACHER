import {
  BooksIcon,
  CheckCircleIcon,
  FloppyDiskIcon,
  MagicWandIcon,
  ShieldCheckIcon,
  SignOutIcon,
  SparkleIcon,
  TrophyIcon,
} from "../components/icons";
import { motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type AvatarId, type DemoProfile } from "../auth/AuthContext";
import { riseItem, staggerContainer } from "../components/MotionPrimitives";
import { ProfileAvatar } from "../components/VisualIcons";

const avatars: AvatarId[] = ["explorer", "dreamer", "inventor"];

export function ProfilePage() {
  const { profile, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<DemoProfile>(profile!);
  const [saved, setSaved] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = { ...draft, name: draft.name.trim().slice(0, 30) };
    if (next.name.length < 2) return;
    updateProfile(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  function exit() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="profile-page page-width page-section">
      <motion.section
        className="profile-hero"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="profile-hero__avatar" variants={riseItem}>
          <motion.div
            animate={{ rotate: [0, -5, 5, 0], y: [0, -4, 0] }}
            transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <ProfileAvatar avatarId={profile!.avatarId} size={82} />
          </motion.div>
          <span><SparkleIcon weight="fill" /></span>
        </motion.div>
        <motion.div variants={riseItem}>
          <span className="eyebrow">Perfil de exploración</span>
          <h1>El mundo de {profile!.name}</h1>
          <p>Acá podés cambiar cómo querés vivir tus próximas aventuras.</p>
        </motion.div>
        <motion.div className="profile-level" variants={riseItem}>
          <TrophyIcon size={30} weight="duotone" />
          <div><small>Nivel actual</small><strong>Gran explorador</strong></div>
        </motion.div>
      </motion.section>

      <div className="profile-grid">
        <motion.form
          className="profile-panel"
          onSubmit={submit}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 150, damping: 22, delay: 0.16 }}
        >
          <div className="panel-title">
            <MagicWandIcon size={26} weight="duotone" />
            <div><span className="eyebrow">Tu identidad</span><h2>Personalizá tu perfil</h2></div>
          </div>

          <label className="text-field">
            <span>Nombre o apodo</span>
            <input
              value={draft.name}
              minLength={2}
              maxLength={30}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </label>
          <div className="login-form__row">
            <label className="text-field">
              <span>Edad</span>
              <select
                value={draft.age}
                onChange={(event) => setDraft({ ...draft, age: Number(event.target.value) })}
              >
                {[6, 7, 8, 9, 10, 11, 12].map((value) => (
                  <option key={value} value={value}>{value} años</option>
                ))}
              </select>
            </label>
            <label className="text-field">
              <span>Mundo favorito</span>
              <select
                value={draft.favoriteTheme}
                onChange={(event) => setDraft({ ...draft, favoriteTheme: event.target.value })}
              >
                {["Espacio", "Fantasía", "Océano", "Selva", "Inventos"].map((theme) => (
                  <option key={theme}>{theme}</option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className="avatar-picker avatar-picker--profile">
            <legend>Insignia</legend>
            <div>
              {avatars.map((avatarId) => (
                <motion.button
                  key={avatarId}
                  type="button"
                  className={draft.avatarId === avatarId ? "is-selected" : ""}
                  aria-label={`Elegir insignia ${avatarId}`}
                  aria-pressed={draft.avatarId === avatarId}
                  onClick={() => setDraft({ ...draft, avatarId })}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.94 }}
                >
                  <ProfileAvatar avatarId={avatarId} size={34} />
                </motion.button>
              ))}
            </div>
          </fieldset>

          <motion.button className="button button--primary" type="submit" whileTap={{ scale: 0.97 }}>
            {saved ? <CheckCircleIcon size={22} weight="fill" /> : <FloppyDiskIcon size={22} weight="bold" />}
            {saved ? "Cambios guardados" : "Guardar cambios"}
          </motion.button>
        </motion.form>

        <motion.aside
          className="profile-side"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 150, damping: 22, delay: 0.24 }}
        >
          <section className="profile-stat-card">
            <div className="panel-title">
              <BooksIcon size={27} weight="duotone" />
              <div><span className="eyebrow">Próxima misión</span><h2>Tu recorrido lector</h2></div>
            </div>
            <div className="profile-stats">
              <div><strong>5</strong><span>habilidades</span></div>
              <div><strong>1</strong><span>cuento por crear</span></div>
            </div>
            <p>Cada nueva historia entrena comprensión, inferencia, vocabulario, secuencia y causa.</p>
          </section>

          <section className="profile-security">
            <ShieldCheckIcon size={28} weight="duotone" />
            <div>
              <h2>Este acceso es una simulación</h2>
              <p>No hay contraseña ni cuenta online. Los datos del perfil viven solamente en este navegador.</p>
            </div>
          </section>

          <button className="logout-button" type="button" onClick={exit}>
            <SignOutIcon size={22} weight="bold" /> Cerrar perfil de demostración
          </button>
        </motion.aside>
      </div>
    </div>
  );
}
