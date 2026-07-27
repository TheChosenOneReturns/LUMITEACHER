import type { UserProfile } from "@story-teacher/shared";
import { motion } from "motion/react";
import { useMemo, useState, type FormEvent } from "react";
import { api, ApiClientError } from "../api/client";
import { avatarOptions, type AvatarKind } from "../catalog/avatars";
import { CharacterAvatar } from "./CharacterAvatar";
import { CheckCircleIcon, SparkleIcon, XIcon } from "./icons";

const themes = ["Espacio", "Fantasía", "Océano", "Selva", "Inventos"];

export function CreateProfileModal({ onClose, onCreated }: { onClose: () => void; onCreated: (profile: UserProfile) => Promise<void> }) {
  const [kind, setKind] = useState<AvatarKind>("animal");
  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState(8);
  const [avatarId, setAvatarId] = useState("animal-fox");
  const [favoriteTheme, setFavoriteTheme] = useState("Espacio");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const visibleAvatars = useMemo(() => avatarOptions.filter((avatar) => avatar.base && avatar.kind === kind), [kind]);

  function chooseKind(next: AvatarKind) {
    setKind(next);
    setAvatarId(avatarOptions.find((avatar) => avatar.base && avatar.kind === next)!.id);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const profile = await api.createDemoProfile({ displayName, age, avatarId, favoriteTheme });
      await onCreated(profile);
    } catch (createError) {
      setError(createError instanceof ApiClientError ? createError.message : "No pudimos crear el perfil.");
      setSubmitting(false);
    }
  }

  return (
    <motion.div className="profile-creator" role="dialog" aria-modal="true" aria-labelledby="create-profile-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <motion.form className="profile-creator__card" onSubmit={submit} initial={{ opacity: 0, y: 34, scale: .92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: .95 }} transition={{ type: "spring", stiffness: 210, damping: 23 }}>
        <header><div><span><SparkleIcon weight="fill" /></span><div><small>Nuevo explorador</small><h2 id="create-profile-title">Creá tu personaje</h2></div></div><button type="button" aria-label="Cerrar creador de perfil" onClick={onClose}><XIcon weight="bold" /></button></header>
        <div className="profile-creator__layout">
          <motion.div className="profile-creator__preview" key={`${avatarId}-${favoriteTheme}`} initial={{ scale: .9, rotate: -3 }} animate={{ scale: 1, rotate: 0 }}>
            <CharacterAvatar avatarId={avatarId} size={220} animated />
            <strong>{displayName.trim() || "Tu nombre"}</strong>
            <small>Explorador de {favoriteTheme.toLocaleLowerCase("es")}</small>
          </motion.div>
          <div className="profile-creator__controls">
            <label className="text-field"><span>¿Cómo querés que te llamemos?</span><input autoFocus value={displayName} minLength={2} maxLength={24} placeholder="Nombre o apodo" onChange={(event) => setDisplayName(event.target.value)} /></label>
            <fieldset className="creator-age"><legend>¿Cuántos años tenés?</legend><div>{[6,7,8,9,10,11,12].map((value) => <button key={value} type="button" className={age === value ? "is-selected" : ""} aria-pressed={age === value} onClick={() => setAge(value)}>{value}</button>)}</div></fieldset>
            <fieldset className="creator-avatar"><legend>Elegí tu personaje</legend><div className="creator-kind" role="tablist" aria-label="Tipo de personaje"><button type="button" role="tab" aria-selected={kind === "animal"} className={kind === "animal" ? "is-selected" : ""} onClick={() => chooseKind("animal")}>Animales</button><button type="button" role="tab" aria-selected={kind === "kid"} className={kind === "kid" ? "is-selected" : ""} onClick={() => chooseKind("kid")}>Niñas y niños</button></div><div className="creator-avatar-grid">{visibleAvatars.map((avatar) => <motion.button key={avatar.id} type="button" className={avatarId === avatar.id ? "is-selected" : ""} aria-label={avatar.label} aria-pressed={avatarId === avatar.id} onClick={() => setAvatarId(avatar.id)} whileHover={{ y: -4 }}><CharacterAvatar avatarId={avatar.id} size={74}/><small>{avatar.label}</small></motion.button>)}</div></fieldset>
          </div>
        </div>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <footer><p><CheckCircleIcon weight="fill" /> Después vas a desbloquear ropa y accesorios con tus estrellas.</p><button className="button button--primary" type="submit" disabled={submitting || displayName.trim().length < 2}>{submitting ? "Creando tu mundo…" : "Crear y empezar"}</button></footer>
      </motion.form>
    </motion.div>
  );
}
