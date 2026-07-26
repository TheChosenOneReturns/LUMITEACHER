import type { Invite } from "@story-teacher/shared";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, ApiClientError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { CheckCircleIcon, GraduationCapIcon, QrCodeIcon, UsersThreeIcon } from "../components/icons";
import { ErrorState, LoadingState } from "../components/PageState";

export function JoinCoursePage() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try { setInvite(await api.getInvite(token)); }
    catch (loadError) { setError(loadError instanceof ApiClientError ? loadError.message : "La invitación no está disponible."); }
  }, [token]);
  useEffect(() => { void load(); }, [load]);

  async function join() {
    setJoining(true); setError(null);
    try { await api.joinInvite(token); navigate("/inicio", { replace: true }); }
    catch (joinError) { setError(joinError instanceof ApiClientError ? joinError.message : "¡Ups! No pudimos unirte al curso. Probemos de nuevo."); setJoining(false); }
  }

  if (error && !invite) return <ErrorState message={error} onRetry={load} />;
  if (!invite) return <LoadingState message="Leyendo la invitación…" />;
  const inactive = invite.status !== "active";

  return <div className="join-page page-width page-section">
    <motion.section className="join-card" initial={{ opacity: 0, y: 24, rotate: -1 }} animate={{ opacity: 1, y: 0, rotate: 0 }}>
      <span className="join-card__seal"><QrCodeIcon size={40} weight="duotone" /></span>
      <span className="eyebrow">Invitación a un nuevo mundo</span>
      <h1>{invite.courseName}</h1>
      <p>Vas a encontrar misiones, historias y felicitaciones compartidas por quien acompaña el curso.</p>
      <div className="join-benefits"><span><UsersThreeIcon weight="duotone" /> Un espacio compartido</span><span><GraduationCapIcon weight="duotone" /> Tu progreso, a tu ritmo</span></div>
      {inactive ? <p className="form-error">Esta invitación fue revocada o ya venció.</p> : !profile ? <Link className="button button--yellow" to={`/login?role=student&next=${encodeURIComponent(`/unirse/${token}`)}`}>Elegir mi perfil</Link> : profile.role === "adult" ? <p className="form-error">Las invitaciones de curso son únicamente para perfiles de estudiante.</p> : <button className="button button--green" type="button" disabled={joining} onClick={() => void join()}><CheckCircleIcon weight="fill" /> {joining ? "Uniéndome…" : `Unirme como ${profile.displayName}`}</button>}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </motion.section>
  </div>;
}
