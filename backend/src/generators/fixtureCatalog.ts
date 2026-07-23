import type { Difficulty, GeneratedStory } from "@story-teacher/shared";

export interface StoryFixture {
  id: string;
  themes: string[];
  age: number;
  difficulty: Difficulty;
  targetWords: 150 | 300 | 500;
  output: GeneratedStory;
}

function questions(input: {
  hero: string;
  object: string;
  action: string;
  reason: string;
  word: string;
  meaning: string;
  before: string;
  after: string;
}): GeneratedStory["questions"] {
  return [
    { statement: `¿Qué objeto encontró ${input.hero}?`, options: [input.object, "Una llave dorada", "Un mapa vacío", "Una campana"], correctAnswer: 0, skill: "literal", explanation: `El cuento dice de manera directa que encontró ${input.object}.` },
    { statement: `¿Qué podemos deducir de la decisión de ${input.hero}?`, options: ["Que quería abandonar", `Que decidió ${input.action}`, "Que olvidó su misión", "Que actuó sin pensar"], correctAnswer: 1, skill: "inference", explanation: `Sus acciones permiten deducir que decidió ${input.action}.` },
    { statement: `¿Qué significa “${input.word}” en el cuento?`, options: ["Ruidoso", "Muy lejano", input.meaning, "Pesado"], correctAnswer: 2, skill: "vocabulary", explanation: `En este contexto, “${input.word}” significa ${input.meaning}.` },
    { statement: "¿Qué ocurrió primero?", options: [input.after, "Terminó la aventura", "Todos festejaron", input.before], correctAnswer: 3, skill: "sequence", explanation: `${input.before} ocurrió antes que ${input.after}.` },
    { statement: "¿Por qué el problema pudo resolverse?", options: ["Porque llegó la noche", input.reason, "Porque nadie hizo nada", "Porque el objeto desapareció"], correctAnswer: 1, skill: "cause_effect", explanation: `El resultado fue posible ${input.reason.toLocaleLowerCase("es")}.` },
  ];
}

export const fixtureStories: StoryFixture[] = [
  {
    id: "space-signal", themes: ["espacio", "planeta", "estrellas"], age: 8, difficulty: "media", targetWords: 300,
    output: { title: "La señal del planeta azul", story: "Luna viajaba en una pequeña nave escolar cuando encontró un cristal luminoso junto a un satélite. El cristal parpadeaba con un ritmo preciso. Luna anotó cada destello y comprendió que era una señal de ayuda. En lugar de seguir sola, decidió compartir el hallazgo con su equipo. Entre todos orientaron las antenas y descubrieron a un robot explorador atrapado en una cueva. La ruta era frágil, así que avanzaron con cuidado. Al combinar sus ideas construyeron un puente magnético y el robot pudo regresar. Luna entendió que una pregunta compartida puede iluminar más que una respuesta apresurada.", questions: questions({ hero: "Luna", object: "Un cristal luminoso", action: "compartir el hallazgo", reason: "Porque el equipo combinó sus ideas", word: "frágil", meaning: "Que puede romperse con facilidad", before: "Luna anotó los destellos", after: "El equipo construyó un puente" }) },
  },
  {
    id: "fantasy-library", themes: ["fantasía", "castillo", "magia"], age: 9, difficulty: "desafio", targetWords: 500,
    output: { title: "La biblioteca que cambiaba de lugar", story: "Mara llegó al castillo de las mil ventanas y encontró un libro plateado bajo una escalera. Cada vez que lo abría, la biblioteca aparecía en una torre diferente. La pista parecía confusa, pero Mara observó que las ilustraciones señalaban la posición del sol. Decidió esperar y comparar las sombras. Cuando la luz tocó la ventana redonda, el libro mostró el camino correcto. Mara llamó a los demás aprendices y juntos ordenaron las páginas según la hora del día. Así encontraron la sala perdida y devolvieron los libros a sus estantes. La paciencia convirtió un misterio enorme en una serie de pistas pequeñas.", questions: questions({ hero: "Mara", object: "Un libro plateado", action: "esperar y comparar las sombras", reason: "Porque ordenaron las páginas según la hora", word: "confusa", meaning: "Difícil de comprender", before: "Mara observó las ilustraciones", after: "Los aprendices ordenaron las páginas" }) },
  },
  {
    id: "ocean-song", themes: ["océano", "mar", "ballena"], age: 10, difficulty: "desafio", targetWords: 500,
    output: { title: "La canción bajo el arrecife", story: "Nico exploraba el arrecife en su submarino cuando encontró una caracola brillante. Al acercarla al oído escuchó una melodía pausada. Las notas coincidían con el canto de una ballena que no encontraba a su familia. Nico grabó el sonido, pero no quiso decidir solo. Consultó a una bióloga y compararon los ritmos sin molestar a los animales. Después ubicaron boyas que repetían la melodía a un volumen suave. La ballena siguió las señales hasta mar abierto y reconoció el canto de su grupo. Nico aprendió que observar con respeto también es una forma de ayudar.", questions: questions({ hero: "Nico", object: "Una caracola brillante", action: "consultar a una bióloga", reason: "Porque colocaron señales sonoras respetuosas", word: "pausada", meaning: "Lenta y tranquila", before: "Nico grabó el sonido", after: "Ubicaron las boyas" }) },
  },
  {
    id: "jungle-seed", themes: ["selva", "bosque", "naturaleza"], age: 7, difficulty: "facil", targetWords: 150,
    output: { title: "La semilla viajera", story: "Tilo caminaba por la selva después de la lluvia y encontró una semilla violeta. El suelo junto al río estaba húmedo, pero la corriente podía llevársela. Tilo pidió ayuda a una tortuga jardinera. Juntos eligieron una zona segura, aflojaron la tierra y cubrieron la semilla con hojas. Días después apareció un brote firme. Sus raíces sujetaron la orilla y dieron refugio a pequeños insectos. Tilo descubrió que cuidar algo pequeño puede mejorar todo un lugar.", questions: questions({ hero: "Tilo", object: "Una semilla violeta", action: "pedir ayuda", reason: "Porque eligieron un lugar seguro", word: "firme", meaning: "Estable y resistente", before: "Tilo encontró la semilla", after: "Apareció un brote" }) },
  },
  {
    id: "invention-clock", themes: ["inventos", "ciencia", "tecnología"], age: 11, difficulty: "media", targetWords: 300,
    output: { title: "El reloj de las buenas preguntas", story: "Ada construía un reloj para organizar el taller y encontró un engranaje transparente dentro de una caja antigua. Al colocarlo, el reloj no marcó la hora: mostró una pregunta diferente en cada vuelta. Ada primero pensó que estaba roto, pero decidió registrar los mensajes. Descubrió que cada pregunta ayudaba a revisar una parte del invento. Invitó a sus compañeros a responderlas y entre todos redujeron el ruido, acomodaron las piezas y mejoraron la energía. El reloj funcionó porque Ada transformó un error inesperado en una oportunidad para investigar.", questions: questions({ hero: "Ada", object: "Un engranaje transparente", action: "registrar los mensajes", reason: "Porque respondieron juntos las preguntas", word: "inesperado", meaning: "Que ocurre sin haberlo previsto", before: "Ada colocó el engranaje", after: "El grupo mejoró la energía" }) },
  },
  {
    id: "music-bridge", themes: ["música", "arte", "tema libre"], age: 6, difficulty: "facil", targetWords: 150,
    output: { title: "El puente de los sonidos", story: "Sol llegó a una plaza silenciosa y encontró un pequeño tambor azul. Al tocarlo, una baldosa se encendió. Probó sonidos suaves y descubrió que cada ritmo iluminaba una parte del camino. Sol invitó a otros niños a crear una secuencia. Primero escucharon, después tocaron por turnos y al final apareció un puente de colores. Todos cruzaron sin apurarse. Sol comprendió que una canción crece cuando cada persona deja espacio para escuchar a las demás.", questions: questions({ hero: "Sol", object: "Un pequeño tambor azul", action: "invitar a otros niños", reason: "Porque respetaron los turnos del ritmo", word: "secuencia", meaning: "Una serie ordenada", before: "Sol tocó el tambor", after: "Apareció el puente" }) },
  },
];
