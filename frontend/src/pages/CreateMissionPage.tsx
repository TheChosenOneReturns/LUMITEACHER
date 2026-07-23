import { storyInputSchema, type Difficulty, type GenerateStoryInput } from "@story-teacher/shared";
import { motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, ApiClientError } from "../api/client";
import { GraduationCapIcon, MagicWandIcon, ShieldCheckIcon } from "../components/icons";

export function CreateMissionPage() {
  const { courseId = "" } = useParams();
  const navigate = useNavigate();
  const [age, setAge] = useState(9);
  const [theme, setTheme] = useState("Espacio");
  const [difficulty, setDifficulty] = useState<Difficulty>("media");
  const [objective, setObjective] = useState("Distinguir causas y consecuencias en una aventura");
  const [maxWords, setMaxWords] = useState<GenerateStoryInput["maxWords"]>(800);
  const [character, setCharacter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(null);
    const input: GenerateStoryInput = { age, theme: theme.trim(), difficulty, educationalObjective: objective.trim(), maxWords, mainCharacter: character.trim() || null };
    const parsed = storyInputSchema.safeParse(input);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Revisá los datos de la misión."); return; }
    setLoading(true);
    try { await api.createMission(courseId, parsed.data); navigate(`/adulto/cursos/${courseId}`); }
    catch (createError) { setError(createError instanceof ApiClientError ? createError.message : "No pudimos crear la misión."); setLoading(false); }
  }

  return <div className="page-width page-section mission-create">
    <motion.div className="page-title" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}><span className="pill"><GraduationCapIcon weight="duotone"/> Misión para el curso</span><h1>Diseñá el próximo desafío</h1><p>Lumi convierte estos objetivos en un cuento y cinco preguntas.</p></motion.div>
    <form className="mission-form" onSubmit={submit}>
      <div className="mission-form__grid">
        <label className="text-field"><span>Edad orientativa</span><select value={age} onChange={(event) => setAge(Number(event.target.value))}>{[6,7,8,9,10,11,12].map((value) => <option key={value} value={value}>{value} años</option>)}</select></label>
        <label className="text-field"><span>Tema</span><input value={theme} maxLength={60} onChange={(event) => setTheme(event.target.value)} /></label>
        <label className="text-field"><span>Dificultad</span><select value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)}><option value="facil">Fácil</option><option value="media">Media</option><option value="desafio">Desafío</option></select></label>
        <label className="text-field"><span>Extensión</span><select value={maxWords} onChange={(event) => setMaxWords(Number(event.target.value) as GenerateStoryInput["maxWords"])}><option value={300}>Breve · hasta 300 palabras</option><option value={800}>Por capítulos · hasta 800</option><option value={1200}>Gran travesía · hasta 1200</option></select></label>
      </div>
      <label className="text-field"><span>Objetivo educativo</span><textarea rows={4} minLength={5} maxLength={160} value={objective} onChange={(event) => setObjective(event.target.value)} /></label>
      <label className="text-field"><span>Protagonista opcional</span><input maxLength={60} value={character} placeholder="Ej.: una zorra inventora llamada Nara" onChange={(event) => setCharacter(event.target.value)} /></label>
      <p className="privacy-hint"><ShieldCheckIcon weight="duotone" /> La historia se genera con datos pedagógicos, no con datos personales del alumnado.</p>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button button--yellow" disabled={loading} type="submit"><MagicWandIcon weight="duotone" /> {loading ? "Creando misión…" : "Crear y asignar misión"}</button>
    </form>
  </div>;
}
