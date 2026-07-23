import type { PlatformCatalog, RewardState, UserProfile } from "@story-teacher/shared";
import { motion } from "motion/react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { avatarOptions } from "../catalog/avatars";
import { CharacterAvatar } from "../components/CharacterAvatar";
import {
  CheckCircleIcon,
  FloppyDiskIcon,
  GiftIcon,
  GraduationCapIcon,
  LockKeyOpenIcon,
  ShieldCheckIcon,
  SignOutIcon,
  SparkleIcon,
  StarFourIcon,
  TrophyIcon,
} from "../components/icons";

const themes = ["Espacio", "Fantasía", "Océano", "Selva", "Inventos"];

export function ProfilePage() {
  const { profile, updateProfile, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<UserProfile>(profile!);
  const [rewards, setRewards] = useState<RewardState | null>(null);
  const [catalog, setCatalog] = useState<PlatformCatalog | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [characterKind, setCharacterKind] = useState<"all" | "animal" | "kid">("all");
  const [characterWorld, setCharacterWorld] = useState("all");
  const [characterStatus, setCharacterStatus] = useState<"all" | "available" | "locked">("all");
  const isStudent = profile!.role === "student";
  const filteredAvatars = useMemo(() => avatarOptions.filter((avatar) => {
    const unlocked = avatar.base || Boolean(rewards?.unlockedAvatarIds.includes(avatar.id));
    return (characterKind === "all" || avatar.kind === characterKind)
      && (characterWorld === "all" || (characterWorld === "base" ? avatar.base : avatar.worldId === characterWorld))
      && (characterStatus === "all" || (characterStatus === "available" ? unlocked : !unlocked));
  }), [characterKind, characterStatus, characterWorld, rewards]);

  useEffect(() => {
    if (!isStudent) return;
    void Promise.all([api.getRewards(), api.getCatalog()])
      .then(([nextRewards, nextCatalog]) => { setRewards(nextRewards); setCatalog(nextCatalog); })
      .catch(() => setError("No pudimos abrir todas tus recompensas."));
  }, [isStudent]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const displayName = draft.displayName.trim().slice(0, 40);
    if (displayName.length < 2) { setError("Escribí un nombre de al menos dos caracteres."); return; }
    try {
      const next = await updateProfile({
        displayName,
        avatarId: draft.avatarId,
        favoriteTheme: draft.favoriteTheme,
        ...(draft.role === "student" ? { age: draft.age } : { adultLabel: draft.adultLabel }),
      });
      setDraft(next);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } catch { setError("No pudimos guardar los cambios."); }
  }

  async function selectOutfit(outfitId: string | null) {
    setError(null);
    try {
      const next = await api.selectAccessory(outfitId);
      setRewards(next);
      setDraft((current) => ({ ...current, selectedAccessoryId: outfitId }));
      await refreshProfile();
    } catch { setError("Ese look todavía no está disponible."); }
  }

  function exit() { logout(); navigate("/", { replace: true }); }

  return (
    <div className="profile-page profile-studio page-width page-section">
      <motion.section className="profile-studio-hero" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}>
        <div className="profile-character-stage">
          {isStudent ? <CharacterAvatar avatarId={draft.avatarId} outfitId={draft.selectedAccessoryId} size={218} animated /> : <div className="adult-profile-emblem"><GraduationCapIcon size={86} weight="duotone" /></div>}
          <motion.span animate={{ rotate: [0, 12, -8, 0], scale: [1, 1.12, 1] }} transition={{ duration: 3.4, repeat: Infinity }}><SparkleIcon weight="fill" /></motion.span>
        </div>
        <div className="profile-studio-hero__copy">
          <span className="eyebrow">{isStudent ? profile!.profileBadge ?? "Mi identidad aventurera" : profile!.adultLabel ?? "Perfil adulto"}</span>
          <h1>{isStudent ? `Este mundo es de ${profile!.displayName}` : `Hola, ${profile!.displayName}`}</h1>
          <p>{isStudent ? "Cambiá tu personaje, probá la ropa que ganaste y elegí el próximo mundo que querés explorar." : "Configurá cómo te ven los alumnos y administrá tu acceso local."}</p>
        </div>
        {isStudent ? <div className="profile-studio-stats"><article><StarFourIcon weight="fill" /><strong>{rewards?.totalStars ?? 0}</strong><small>estrellas</small></article><article><TrophyIcon weight="duotone" /><strong>{rewards?.unlockedBadgeIds.length ?? 0}</strong><small>insignias</small></article><article><GiftIcon weight="duotone" /><strong>{rewards?.unlockedAvatarIds.length ?? 6}</strong><small>personajes</small></article></div> : <div className="profile-level"><GraduationCapIcon size={30} weight="duotone"/><div><small>Tipo de acceso</small><strong>Acompañante</strong></div></div>}
      </motion.section>

      <div className="profile-studio-grid">
        <motion.form className="profile-editor" onSubmit={submit} initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }}>
          <div className="studio-section-heading"><span>01</span><div><small>Tu identidad</small><h2>{isStudent ? "Diseñá tu explorador" : "Datos del perfil"}</h2></div></div>
          <div className="profile-name-row">
            <label className="text-field"><span>Nombre o apodo</span><input value={draft.displayName} minLength={2} maxLength={40} onChange={(event) => setDraft({ ...draft, displayName: event.target.value })}/></label>
            {isStudent ? <label className="text-field"><span>Edad</span><select value={draft.age ?? 8} onChange={(event) => setDraft({ ...draft, age: Number(event.target.value) })}>{[6,7,8,9,10,11,12].map((value) => <option key={value} value={value}>{value} años</option>)}</select></label> : <label className="text-field"><span>Rol visible</span><select value={draft.adultLabel ?? "Profesor/a"} onChange={(event) => setDraft({ ...draft, adultLabel: event.target.value as "Profesor/a" | "Familia" })}><option>Profesor/a</option><option>Familia</option></select></label>}
          </div>

          {isStudent ? <fieldset className="profile-character-picker"><legend>Elegí un animal o una persona</legend><div className="character-filters"><select aria-label="Tipo de personaje" value={characterKind} onChange={(event) => setCharacterKind(event.target.value as typeof characterKind)}><option value="all">Todos</option><option value="animal">Animales</option><option value="kid">Niñas y niños</option></select><select aria-label="Mundo del personaje" value={characterWorld} onChange={(event) => setCharacterWorld(event.target.value)}><option value="all">Todos los mundos</option><option value="base">Iniciales</option>{catalog?.worlds.map((world) => <option key={world.id} value={world.id}>{world.label}</option>)}</select><select aria-label="Estado del personaje" value={characterStatus} onChange={(event) => setCharacterStatus(event.target.value as typeof characterStatus)}><option value="all">Disponibles y bloqueados</option><option value="available">Disponibles</option><option value="locked">Por descubrir</option></select></div><div>{filteredAvatars.map((avatar) => {
            const unlocked = avatar.base || Boolean(rewards?.unlockedAvatarIds.includes(avatar.id));
            const world = catalog?.worlds.find((candidate) => candidate.id === avatar.worldId);
            return <motion.button key={avatar.id} type="button" disabled={!unlocked} className={`${draft.avatarId === avatar.id ? "is-selected" : ""} ${unlocked ? "is-unlocked" : "is-locked"}`} aria-label={unlocked ? avatar.label : `${avatar.label}, bloqueado`} aria-pressed={draft.avatarId === avatar.id} onClick={() => setDraft({ ...draft, avatarId: avatar.id })} whileHover={unlocked ? { y: -5 } : {}} whileTap={unlocked ? { scale: .96 } : {}}><span className="character-picker-art"><CharacterAvatar avatarId={avatar.id} size={88}/>{!unlocked ? <span className="character-lock"><StarFourIcon weight="fill" /> {world?.label} · hito {avatar.milestone}</span> : null}</span><small>{avatar.label}</small>{draft.avatarId === avatar.id ? <CheckCircleIcon weight="fill" /> : null}</motion.button>;
          })}</div></fieldset> : null}

          <fieldset className="profile-theme-picker"><legend>Tu mundo favorito</legend><div>{themes.map((theme) => <button key={theme} type="button" className={draft.favoriteTheme === theme ? "is-selected" : ""} aria-pressed={draft.favoriteTheme === theme} onClick={() => setDraft({ ...draft, favoriteTheme: theme })}>{theme}</button>)}</div></fieldset>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="button button--primary profile-save" type="submit">{saved ? <CheckCircleIcon weight="fill"/> : <FloppyDiskIcon weight="bold"/>}{saved ? "¡Tu personaje quedó listo!" : "Guardar mi personaje"}</button>
        </motion.form>

        <motion.aside className="profile-wardrobe" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}>
          {isStudent ? <>
            <div className="studio-section-heading"><span>02</span><div><small>Recompensas</small><h2>Mi vestidor</h2></div></div>
            <p className="wardrobe-intro">La ropa se desbloquea leyendo cuentos. Tus estrellas nunca se gastan.</p>
            <div className="profile-outfit-preview"><CharacterAvatar avatarId={draft.avatarId} outfitId={draft.selectedAccessoryId} size={190} animated /><span>{draft.selectedAccessoryId ? "Look equipado" : "Look clásico"}</span></div>
            <div className="profile-outfit-grid">
              <button type="button" className={!draft.selectedAccessoryId ? "is-selected" : ""} onClick={() => void selectOutfit(null)}><span className="outfit-swatch outfit-swatch--classic"/><span><strong>Look clásico</strong><small>Siempre disponible</small></span><CheckCircleIcon weight="fill" /></button>
              {catalog?.accessories.map((outfit) => {
                const unlocked = rewards?.unlockedAccessoryIds.includes(outfit.id) ?? false;
                const selected = draft.selectedAccessoryId === outfit.id;
                return <button key={outfit.id} type="button" disabled={!unlocked} className={selected ? "is-selected" : ""} onClick={() => void selectOutfit(selected ? null : outfit.id)}><span className={`outfit-swatch outfit-swatch--${outfit.id}`}><GiftIcon weight={unlocked ? "fill" : "duotone"}/></span><span><strong>{outfit.label}</strong><small>{unlocked ? (selected ? "En uso" : "Usar este look") : `${outfit.threshold} estrellas`}</small></span>{unlocked ? <LockKeyOpenIcon weight="duotone" /> : <StarFourIcon weight="fill" />}</button>;
              })}
            </div>
          </> : null}
          <section className="profile-security"><ShieldCheckIcon size={28} weight="duotone"/><div><h2>Tu espacio es local</h2><p>Los datos de cursos y progreso viven únicamente en DynamoDB Local.</p></div></section>
          <button className="logout-button" type="button" onClick={exit}><SignOutIcon weight="bold" /> Cerrar este perfil</button>
        </motion.aside>
      </div>
    </div>
  );
}
