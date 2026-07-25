import type { CourseSummary } from "@story-teacher/shared";
import { motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, ApiClientError } from "../api/client";
import {
  ArrowRightIcon,
  ChartLineUpIcon,
  GraduationCapIcon,
  PlusIcon,
  UsersThreeIcon,
} from "../components/icons";
import { ErrorState, LoadingState } from "../components/PageState";

export function AdultCoursesPage() {
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
      setError(null);
    } catch (createError) {
      setError(createError instanceof ApiClientError ? createError.message : "No pudimos crear el curso.");
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <LoadingState message="Preparando tus cursos…" />;
  if (error && !courses.length) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="page-width page-section adult-dashboard">
      <motion.section className="courses-hero" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <span className="eyebrow"><GraduationCapIcon weight="duotone" /> Cursos</span>
          <h1>Tus cursos y grupos</h1>
          <p>Creá espacios, organizá alumnos y entrá al seguimiento de cada grupo.</p>
        </div>
        <span className="courses-hero__count">{courses.length}<small>{courses.length === 1 ? "curso" : "cursos"}</small></span>
      </motion.section>

      <div className="adult-layout">
        <section>
          <div className="section-heading">
            <div><span className="eyebrow">Todos tus espacios</span><h2>Cursos</h2></div>
          </div>
          {courses.length ? (
            <div className="adult-course-grid">
              {courses.map((course, index) => (
                <motion.article key={course.courseId} className="adult-course-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }} whileHover={{ y: -5 }}>
                  <span className="adult-course-card__number">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{course.name}</h3><p>{course.description}</p>
                  <div><span><UsersThreeIcon /> {course.memberCount} alumnos</span><span><ChartLineUpIcon /> {course.missionCount} misiones</span></div>
                  <Link className="button button--primary" to={`/adulto/cursos/${course.courseId}`}>Administrar curso <ArrowRightIcon /></Link>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="adult-empty-courses">
              <GraduationCapIcon size={44} weight="duotone" />
              <h3>Creá tu primer curso</h3>
              <p>Después podrás invitar estudiantes y preparar misiones para el grupo.</p>
            </div>
          )}
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
