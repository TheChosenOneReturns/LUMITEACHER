import type { Activity, CourseDashboard, CourseSummary } from "@story-teacher/shared";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiClientError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import {
  ArrowRightIcon,
  BellIcon,
  ChartLineUpIcon,
  ClockIcon,
  GraduationCapIcon,
  MagicWandIcon,
  PlusIcon,
  SparkleIcon,
  UsersThreeIcon,
} from "../components/icons";
import { ErrorState, LoadingState } from "../components/PageState";
import { AnimatedNumber } from "../components/AnimatedNumber";

export function AdultDashboardPage() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [dashboards, setDashboards] = useState<CourseDashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const nextCourses = await api.listCourses();
      setCourses(nextCourses);
      const results = await Promise.allSettled(nextCourses.map((course) => api.getDashboard(course.courseId)));
      setDashboards(results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []));
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof ApiClientError ? loadError.message : "No pudimos abrir tus cursos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  if (loading) return <LoadingState message="Preparando el panel del curso…" />;
  if (error && !courses.length) return <ErrorState message={error} onRetry={load} />;

  const students = courses.reduce((sum, course) => sum + course.memberCount, 0);
  const missions = courses.reduce((sum, course) => sum + course.missionCount, 0);
  const activities = dashboards
    .flatMap((dashboard) => dashboard.recentActivity.map((activity) => ({ ...activity, courseName: dashboard.course.name })))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 6);
  const inactiveStudents = dashboards.flatMap((dashboard) =>
    dashboard.students.filter((student) => !student.lastActivityAt).map((student) => ({ ...student, course: dashboard.course })),
  );
  const studentsToSupport = dashboards.flatMap((dashboard) =>
    dashboard.students.filter((student) => student.lastActivityAt && student.averageScore < 60).map((student) => ({ ...student, course: dashboard.course })),
  );
  const coursesWithoutMissions = courses.filter((course) => course.missionCount === 0);
  const firstCourse = courses[0];

  return (
    <div className="page-width page-section adult-dashboard">
      <motion.section className="adult-hero" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}>
        <div><span className="eyebrow"><GraduationCapIcon weight="duotone" /> Panel adulto</span><h1>Hola, {profile!.displayName}</h1><p>Todo lo que ocurre en tus grupos, explicado con claridad.</p></div>
        <motion.div className="adult-hero__orb" initial={{ opacity: 0, scale: .78, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 4 }} transition={{ type: "spring", stiffness: 170, damping: 15 }}><ChartLineUpIcon size={62} weight="duotone" /><SparkleIcon size={24} weight="fill" /></motion.div>
      </motion.section>

      <section className="adult-kpi-grid">
        <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><UsersThreeIcon size={30} weight="duotone" /><span>Alumnos</span><AnimatedNumber value={students}/></motion.article>
        <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .06 }}><GraduationCapIcon size={30} weight="duotone" /><span>Cursos</span><AnimatedNumber value={courses.length}/></motion.article>
        <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .12 }}><ChartLineUpIcon size={30} weight="duotone" /><span>Misiones</span><AnimatedNumber value={missions}/></motion.article>
      </section>

      <section className="adult-quick-actions" aria-labelledby="quick-actions-title">
        <div className="section-heading">
          <div><span className="eyebrow">Siguiente paso</span><h2 id="quick-actions-title">Acciones rápidas</h2></div>
        </div>
        <div>
          <Link to="/adulto/cursos"><span><PlusIcon weight="bold" /></span><strong>Crear un curso</strong><small>Prepará un nuevo espacio</small><ArrowRightIcon /></Link>
          {firstCourse ? (
            <>
              <Link to={`/adulto/cursos/${firstCourse.courseId}/crear-mision`}><span><MagicWandIcon weight="duotone" /></span><strong>Crear una misión</strong><small>Para {firstCourse.name}</small><ArrowRightIcon /></Link>
              <Link to={`/adulto/cursos/${firstCourse.courseId}`}><span><ChartLineUpIcon weight="duotone" /></span><strong>Ver seguimiento</strong><small>Actividad y avances</small><ArrowRightIcon /></Link>
            </>
          ) : (
            <>
              <div className="is-disabled"><span><MagicWandIcon weight="duotone" /></span><strong>Crear una misión</strong><small>Primero creá un curso</small></div>
              <div className="is-disabled"><span><ChartLineUpIcon weight="duotone" /></span><strong>Ver seguimiento</strong><small>Primero creá un curso</small></div>
            </>
          )}
        </div>
      </section>

      <div className="adult-overview-grid">
        <section className="adult-panel adult-alerts">
          <div className="panel-title"><BellIcon size={27} weight="duotone" /><div><span className="eyebrow">Para revisar</span><h2>Alertas y oportunidades</h2></div></div>
          <div className="adult-alert-list">
            {!courses.length ? <DashboardNotice tone="info" title="Creá tu primer curso" copy="Así podrás invitar estudiantes y publicar misiones." to="/adulto/cursos" /> : null}
            {coursesWithoutMissions.slice(0, 2).map((course) => <DashboardNotice key={`mission-${course.courseId}`} tone="yellow" title={`${course.name} no tiene misiones`} copy="Creá una actividad para que el grupo pueda empezar." to={`/adulto/cursos/${course.courseId}/crear-mision`} />)}
            {inactiveStudents.slice(0, 2).map((student) => <DashboardNotice key={`inactive-${student.course.courseId}-${student.userId}`} tone="blue" title={`${student.displayName} todavía no comenzó`} copy={`Podés acompañar su inicio en ${student.course.name}.`} to={`/adulto/cursos/${student.course.courseId}/alumnos/${student.userId}`} />)}
            {studentsToSupport.slice(0, 2).map((student) => <DashboardNotice key={`support-${student.course.courseId}-${student.userId}`} tone="rose" title={`${student.displayName} puede necesitar apoyo`} copy={`Su promedio actual es ${student.averageScore}% en ${student.course.name}.`} to={`/adulto/cursos/${student.course.courseId}/alumnos/${student.userId}`} />)}
            {courses.length > 0 && !coursesWithoutMissions.length && !inactiveStudents.length && !studentsToSupport.length ? <div className="adult-all-clear"><SparkleIcon weight="fill" /><div><strong>Todo al día</strong><p>No encontramos situaciones que requieran atención inmediata.</p></div></div> : null}
          </div>
        </section>

        <section className="adult-panel adult-global-activity">
          <div className="panel-title"><ClockIcon size={27} weight="duotone" /><div><span className="eyebrow">Todos los cursos</span><h2>Actividad reciente</h2></div></div>
          {activities.length ? (
            <ol className="activity-feed">
              {activities.map((activity) => <ActivityItem key={`${activity.activityId}-${activity.createdAt}`} activity={activity} />)}
            </ol>
          ) : (
            <div className="adult-no-activity"><ClockIcon size={36} weight="duotone" /><p>La actividad de tus estudiantes aparecerá acá.</p></div>
          )}
        </section>
      </div>

      <section className="adult-recent-courses">
          <div className="section-heading">
            <div><span className="eyebrow">Acceso rápido</span><h2>Cursos recientes</h2></div>
            <Link className="text-link" to="/adulto/cursos">Ver todos los cursos <ArrowRightIcon /></Link>
          </div>
          {courses.length ? (
          <div className="adult-course-grid">
            {courses.slice(0, 3).map((course, index) => (
              <motion.article key={course.courseId} className="adult-course-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }} whileHover={{ y: -5 }}>
                <span className="adult-course-card__number">{String(index + 1).padStart(2, "0")}</span>
                <h3>{course.name}</h3><p>{course.description}</p>
                <div><span><UsersThreeIcon /> {course.memberCount} alumnos</span><span><ChartLineUpIcon /> {course.missionCount} misiones</span></div>
                <Link className="button button--primary" to={`/adulto/cursos/${course.courseId}`}>Abrir panel <ArrowRightIcon /></Link>
              </motion.article>
            ))}
          </div>
          ) : (
            <div className="adult-empty-courses adult-empty-courses--dashboard">
              <GraduationCapIcon size={42} weight="duotone" />
              <div><h3>Todavía no hay cursos</h3><p>Creá el primero para empezar a organizar tu grupo.</p></div>
              <Link className="button button--yellow" to="/adulto/cursos">Crear un curso <ArrowRightIcon /></Link>
            </div>
          )}
      </section>
    </div>
  );
}

function DashboardNotice({ tone, title, copy, to }: { tone: "info" | "yellow" | "blue" | "rose"; title: string; copy: string; to: string }) {
  return <Link className={`adult-notice adult-notice--${tone}`} to={to}><span /><div><strong>{title}</strong><p>{copy}</p></div><ArrowRightIcon /></Link>;
}

function ActivityItem({ activity }: { activity: Activity & { courseName: string } }) {
  const action = activity.type === "attempt_completed"
    ? `completó un desafío${activity.scorePercent == null ? "" : ` con ${activity.scorePercent}%`}`
    : activity.type === "quiz_started" ? "comenzó un desafío" : "abrió una historia";
  return (
    <li>
      <span />
      <div><strong>{activity.displayName}</strong><p>{action} · {activity.courseName}</p><small>{new Date(activity.createdAt).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</small></div>
    </li>
  );
}
