import type { CourseSummary } from "@story-teacher/shared";
import { motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, ApiClientError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import {
  ArrowRightIcon,
  ChartLineUpIcon,
  GraduationCapIcon,
  PlusIcon,
  SparkleIcon,
  UsersThreeIcon,
} from "../components/icons";
import { ErrorState, LoadingState } from "../components/PageState";
import { AnimatedNumber } from "../components/AnimatedNumber";

export function AdultDashboardPage() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function load() {
    try {
      setCourses(await api.listCourses());
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof ApiClientError ? loadError.message : "No pudimos abrir tus cursos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    try {
      const course = await api.createCourse({ name, description });
      setCourses((current) => [course, ...current]);
      setName("");
      setDescription("");
    } catch (createError) {
      setError(createError instanceof ApiClientError ? createError.message : "No pudimos crear el curso.");
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <LoadingState message="Preparando el panel del curso…" />;
  if (error && !courses.length) return <ErrorState message={error} onRetry={load} />;

  const students = courses.reduce((sum, course) => sum + course.memberCount, 0);
  const missions = courses.reduce((sum, course) => sum + course.missionCount, 0);

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

      <div className="adult-layout">
        <section>
          <div className="section-heading"><div><span className="eyebrow">Tus espacios</span><h2>Cursos y grupos</h2></div></div>
          <div className="adult-course-grid">
            {courses.map((course, index) => (
              <motion.article key={course.courseId} className="adult-course-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }} whileHover={{ y: -5 }}>
                <span className="adult-course-card__number">{String(index + 1).padStart(2, "0")}</span>
                <h3>{course.name}</h3><p>{course.description}</p>
                <div><span><UsersThreeIcon /> {course.memberCount} alumnos</span><span><ChartLineUpIcon /> {course.missionCount} misiones</span></div>
                <Link className="button button--primary" to={`/adulto/cursos/${course.courseId}`}>Abrir panel <ArrowRightIcon /></Link>
              </motion.article>
            ))}
          </div>
        </section>

        <form className="create-course-panel" onSubmit={submit}>
          <span className="create-course-panel__icon"><PlusIcon size={29} weight="bold" /></span>
          <span className="eyebrow">Nuevo espacio</span><h2>Crear un curso</h2>
          <label className="text-field"><span>Nombre</span><input value={name} minLength={2} maxLength={80} placeholder="Ej.: Lectores del cuarto B" onChange={(event) => setName(event.target.value)} /></label>
          <label className="text-field"><span>Descripción</span><textarea value={description} maxLength={240} placeholder="Una frase para reconocer el grupo" onChange={(event) => setDescription(event.target.value)} /></label>
          <button className="button button--yellow" type="submit" disabled={creating || name.trim().length < 2}>{creating ? "Creando…" : "Crear curso"}</button>
          {error ? <p className="form-error">{error}</p> : null}
        </form>
      </div>
    </div>
  );
}
