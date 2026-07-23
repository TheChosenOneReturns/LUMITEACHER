import { skillLabels, type PlatformCatalog, type Skill, type StudentProgress } from "@story-teacher/shared";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { api, ApiClientError } from "../api/client";
import { ChartLineUpIcon, GiftIcon, MedalIcon, PaperPlaneTiltIcon, StarFourIcon } from "../components/icons";
import { ErrorState, LoadingState } from "../components/PageState";
import { ProfileAvatar } from "../components/VisualIcons";

const skills = Object.keys(skillLabels) as Skill[];

export function StudentProgressPage() {
  const { courseId = "", studentId = "" } = useParams();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [catalog, setCatalog] = useState<PlatformCatalog | null>(null);
  const [templateId, setTemplateId] = useState("brave-reader");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { const [nextProgress, nextCatalog] = await Promise.all([api.getStudentProgress(courseId, studentId), api.getCatalog()]); setProgress(nextProgress); setCatalog(nextCatalog); }
    catch (loadError) { setError(loadError instanceof ApiClientError ? loadError.message : "No pudimos abrir el progreso."); }
  }, [courseId, studentId]);
  useEffect(() => { void load(); }, [load]);

  const accuracy = useMemo(() => {
    const totals = Object.fromEntries(skills.map((skill) => [skill, { right: 0, total: 0 }])) as Record<Skill, { right: number; total: number }>;
    progress?.attempts.forEach((attempt) => attempt.results.forEach((result) => { totals[result.skill].total += 1; if (result.isCorrect) totals[result.skill].right += 1; }));
    return Object.fromEntries(skills.map((skill) => [skill, totals[skill].total ? Math.round(totals[skill].right / totals[skill].total * 100) : 0])) as Record<Skill, number>;
  }, [progress]);

  async function send(event: FormEvent) {
    event.preventDefault(); setError(null); setSent(false);
    const template = catalog?.congratulations.find((item) => item.id === templateId);
    try { await api.sendCongratulation(courseId, studentId, { templateId, ...(message.trim() ? { message: message.trim() } : {}), assetId: template?.assetId ?? "postcard-rocket" }); setMessage(""); setSent(true); }
    catch (sendError) { setError(sendError instanceof ApiClientError ? sendError.message : "No pudimos enviar la postal."); }
  }

  if (error && (!progress || !catalog)) return <ErrorState message={error} onRetry={load} />;
  if (!progress || !catalog) return <LoadingState message="Armando el recorrido del alumno…" />;

  return <div className="page-width page-section progress-page">
    <motion.section className="progress-hero" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <ProfileAvatar avatarId={progress.profile.avatarId as "explorer"} size={76}/><div><span className="eyebrow">Ficha de aprendizaje</span><h1>{progress.profile.displayName}</h1><p>{progress.attempts.length} intentos guardados · {progress.rewards.totalStars} estrellas</p></div>
      <span className="progress-hero__stars"><StarFourIcon weight="fill" /> {progress.rewards.totalStars}</span>
    </motion.section>

    <div className="progress-layout">
      <section className="adult-panel"><div className="panel-title"><ChartLineUpIcon size={27} weight="duotone"/><div><span className="eyebrow">Precisión histórica</span><h2>Habilidades</h2></div></div><div className="skill-bars">{skills.map((skill) => <div key={skill}><span>{skillLabels[skill]}</span><div><motion.i initial={{ width: 0 }} animate={{ width: `${accuracy[skill]}%` }} /></div><strong>{accuracy[skill]}%</strong></div>)}</div></section>
      <section className="adult-panel"><div className="panel-title"><GiftIcon size={27} weight="duotone"/><div><span className="eyebrow">Reconocimiento</span><h2>Enviar una postal</h2></div></div><form className="postcard-form" onSubmit={send}><label className="text-field"><span>Plantilla</span><select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>{catalog.congratulations.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label className="text-field"><span>Mensaje personal opcional</span><textarea rows={3} maxLength={160} value={message} placeholder={catalog.congratulations.find((item) => item.id === templateId)?.description} onChange={(event) => setMessage(event.target.value)} /></label><small>{message.length}/160</small>{sent ? <p className="status-success">Postal enviada</p> : null}{error ? <p className="form-error">{error}</p> : null}<button className="button button--yellow" type="submit"><PaperPlaneTiltIcon weight="duotone"/> Enviar felicitación</button></form></section>
    </div>

    <section className="adult-panel attempts-panel"><div className="panel-title"><MedalIcon size={27} weight="duotone"/><div><span className="eyebrow">Todos los intentos</span><h2>Respuestas y explicaciones</h2></div></div>{progress.attempts.length ? <div className="attempt-timeline">{progress.attempts.map((attempt) => <details key={attempt.attemptId}><summary><span><strong>{attempt.storyTitle}</strong><small>{new Date(attempt.createdAt).toLocaleString("es-AR")}</small></span><b>{attempt.scorePercent}%</b></summary><div>{attempt.results.map((result, index) => <article key={result.questionId} className={result.isCorrect ? "is-correct" : "is-wrong"}><strong>{index + 1}. {result.statement ?? skillLabels[result.skill]}</strong><small>{skillLabels[result.skill]}</small><span><b>Eligió:</b> {result.selectedOption ?? `Opción ${result.selectedAnswer + 1}`}</span>{!result.isCorrect ? <span><b>Correcta:</b> {result.correctOption ?? `Opción ${result.correctAnswer + 1}`}</span> : null}<p>{result.explanation}</p></article>)}</div></details>)}</div> : <p className="empty-copy">Todavía no hay intentos en este curso.</p>}</section>
  </div>;
}
