import type { CourseDashboard, Invite, Mission } from "@story-teacher/shared";
import { AnimatePresence, motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiClientError } from "../api/client";
import {
  ArrowClockwiseIcon,
  ArrowRightIcon,
  ChartLineUpIcon,
  CopyIcon,
  GraduationCapIcon,
  MagicWandIcon,
  QrCodeIcon,
  SparkleIcon,
  UsersThreeIcon,
} from "../components/icons";
import { ErrorState, LoadingState } from "../components/PageState";
import { AnimatedNumber } from "../components/AnimatedNumber";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { skillLabels, skillValues } from "@story-teacher/shared";

export function AdultCoursePage() {
  const { courseId = "" } = useParams();
  const [dashboard, setDashboard] = useState<CourseDashboard | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [nextDashboard, nextMissions] = await Promise.all([
        api.getDashboard(courseId),
        api.listMissions(courseId),
      ]);
      setDashboard(nextDashboard);
      setMissions(nextMissions);
      setLastUpdated(new Date());
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof ApiClientError ? loadError.message : "No pudimos abrir el curso.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(true), 15_000);
    return () => window.clearInterval(interval);
  }, [load]);

  const inviteLink = useMemo(
    () => invite ? `${window.location.origin}/unirse/${invite.token}` : "",
    [invite],
  );

  async function generateInvite() {
    try { setInvite(await api.createInvite(courseId)); } catch (inviteError) {
      setError(inviteError instanceof ApiClientError ? inviteError.message : "No pudimos crear la invitación.");
    }
  }

  async function revokeInvite() {
    await api.revokeInvite(courseId);
    setInvite(null);
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function downloadQr() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `invitacion-${dashboard?.course.name ?? "curso"}.svg`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  if (loading) return <LoadingState message="Leyendo la actividad del curso…" />;
  if (!dashboard || error) return <ErrorState message={error ?? "No encontramos el curso."} onRetry={() => load()} />;

  return (
    <div className="page-width page-section course-dashboard-page">
      <section className="course-dashboard-header">
        <div><span className="eyebrow"><GraduationCapIcon /> Curso activo</span><h1>{dashboard.course.name}</h1><p>{dashboard.course.description}</p></div>
        <div className="course-header-actions">
          {lastUpdated ? <motion.small key={lastUpdated.getTime()} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>Actualizado {lastUpdated.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</motion.small> : null}
          <button className="button button--outline" type="button" onClick={() => void load()}><ArrowClockwiseIcon /> Actualizar</button>
          <Link className="button button--yellow" to={`/adulto/cursos/${courseId}/crear-mision`}><MagicWandIcon /> Nueva misión</Link>
        </div>
      </section>

      <section className="adult-kpi-grid adult-kpi-grid--course">
        <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><UsersThreeIcon /><span>Alumnos</span><AnimatedNumber value={dashboard.course.memberCount}/></motion.article>
        <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .05 }}><ChartLineUpIcon /><span>Promedio</span><AnimatedNumber value={dashboard.averageScore} suffix="%"/></motion.article>
        <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}><SparkleIcon /><span>Completado</span><AnimatedNumber value={dashboard.completionPercent} suffix="%"/></motion.article>
        <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }}><GraduationCapIcon /><span>Activos</span><AnimatedNumber value={dashboard.activeStudents}/></motion.article>
      </section>

      <div className="course-dashboard-grid">
        <section className="dashboard-panel dashboard-panel--wide">
          <div className="panel-title"><UsersThreeIcon size={26} weight="duotone" /><div><span className="eyebrow">Seguimiento</span><h2>Progreso por alumno</h2></div></div>
          <div className="student-progress-table">
            {dashboard.students.map((student, index) => (
              <motion.div key={student.userId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * .05 }}>
              <Link to={`/adulto/cursos/${courseId}/alumnos/${student.userId}`}>
                <span className="student-avatar-mini"><CharacterAvatar avatarId={student.avatarId} size={39}/></span>
                <span><strong>{student.displayName}</strong><small>{student.completedMissions} misiones · foco: {student.focusSkill ? skillLabels[student.focusSkill] : "sin datos"}</small></span>
                <strong>{student.averageScore}%</strong><ArrowRightIcon />
              </Link>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="dashboard-panel skill-chart-panel">
          <div className="panel-title"><ChartLineUpIcon size={26} weight="duotone" /><div><span className="eyebrow">Habilidades</span><h2>Precisión del grupo</h2></div></div>
          <div className="skill-bars">
            {skillValues.map((skill) => <div key={skill}><span>{skillLabels[skill]}</span><div><motion.i initial={{ width: 0 }} animate={{ width: `${dashboard.skillAccuracy[skill] ?? 0}%` }} /></div><strong>{dashboard.skillAccuracy[skill] ?? 0}%</strong></div>)}
          </div>
        </section>

        <section className="dashboard-panel invite-panel">
          <div className="panel-title"><QrCodeIcon size={27} weight="duotone" /><div><span className="eyebrow">Invitación</span><h2>Sumar alumnos</h2></div></div>
          {!invite ? (
            <><p>Creá un enlace reutilizable durante siete días y compartilo por QR.</p><button className="button button--green" type="button" onClick={() => void generateInvite()}>Generar invitación</button></>
          ) : (
            <motion.div className="invite-ready" initial={{ opacity: 0, scale: .94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}>
              <div className="invite-qr" ref={qrRef}><QRCodeSVG value={inviteLink} size={150} bgColor="#ffffff" fgColor="#174b69" level="M" /></div>
              <input value={inviteLink} readOnly aria-label="Enlace de invitación" />
              <div><button type="button" onClick={() => void copyInvite()}><CopyIcon /> {copied ? "Copiado" : "Copiar"}</button><button type="button" onClick={downloadQr}><QrCodeIcon /> Descargar QR</button></div>
              <button className="text-action" type="button" onClick={() => void revokeInvite()}>Revocar invitación</button>
            </motion.div>
          )}
        </section>

        <section className="dashboard-panel activity-panel">
          <div className="panel-title"><SparkleIcon size={26} weight="duotone" /><div><span className="eyebrow">Últimos minutos</span><h2>Actividad reciente</h2></div></div>
          <ol className="activity-feed"><AnimatePresence initial={false}>
            {dashboard.recentActivity.slice(0, 8).map((activity) => <motion.li key={`${activity.activityId}-${activity.createdAt}`} layout initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }}><span /><div><strong>{activity.displayName}</strong><p>{activity.type === "attempt_completed" ? `completó un desafío con ${activity.scorePercent}%` : activity.type === "quiz_started" ? "comenzó un desafío" : "abrió una historia"}</p><small>{new Date(activity.createdAt).toLocaleString("es-AR", { hour: "2-digit", minute: "2-digit" })}</small></div></motion.li>)}
          </AnimatePresence>
          </ol>
        </section>
      </div>

      <section className="missions-strip">
        <div className="section-heading"><div><span className="eyebrow">Biblioteca del curso</span><h2>Misiones publicadas</h2></div><span className="count-badge">{missions.length}</span></div>
        <div>{missions.map((mission) => <article key={mission.missionId}><span>{mission.theme}</span><h3>{mission.title}</h3><p>{mission.educationalObjective}</p></article>)}</div>
      </section>
    </div>
  );
}
