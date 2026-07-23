import { countWords, parseGeneratedStory, type GeneratedStory, type GenerateStoryInput } from "@story-teacher/shared";
import type { StoryGenerator } from "../domain/models";
import { fixtureStories, type StoryFixture } from "./fixtureCatalog";
import { englishFixtureStories } from "./fixtureCatalogEnglish";

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/gu, "").toLocaleLowerCase("es");
}

function score(fixture: StoryFixture, input: GenerateStoryInput): number {
  const requestedTheme = normalize(input.theme);
  const themeMatch = fixture.themes.some((theme) => requestedTheme.includes(normalize(theme)) || normalize(theme).includes(requestedTheme));
  return (themeMatch ? 100 : 0)
    + (fixture.difficulty === input.difficulty ? 22 : 0)
    + (fixture.targetWords === input.maxWords ? 12 : 0)
    - Math.abs(fixture.age - input.age) * 2;
}

function expandLongReading(story: string, input: GenerateStoryInput): string {
  if (input.maxWords < 800) return story;
  const language = input.language ?? "es";
  const sentences = story.match(/[^.!?]+[.!?]+|[^.!?]+$/gu)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [story];
  const firstBreak = Math.max(1, Math.ceil(sentences.length / 3));
  const secondBreak = Math.max(firstBreak + 1, Math.ceil(sentences.length * 2 / 3));
  const first = sentences.slice(0, firstBreak).join(" ");
  const middle = sentences.slice(firstBreak, secondBreak).join(" ");
  const last = sentences.slice(secondBreak).join(" ");
  const hero = input.mainCharacter?.trim() || (language === "en" ? "the explorer" : "el protagonista");
  const expansions = language === "en" ? [
    `Before the discovery, ${hero} had spent the morning learning the place's ordinary sounds, colors, and routines. That patient attention would matter, because a change is easier to notice when you remember how things usually are.`,
    `At first, the clue seemed exciting but incomplete. The group wrote down what they knew, what they only suspected, and which questions still needed an answer. Nobody wanted a confident guess to be mistaken for evidence.`,
    `A small setback forced everyone to slow down. One idea explained the beginning of the problem but not what happened next, while another matched two details and contradicted a third. They returned to the scene and looked again.`,
    `Each companion described the clue in different words. By comparing those descriptions, they separated observations from opinions and found a pattern that none of them had noticed alone.`,
    `Before acting, ${hero} imagined the possible consequences of each plan. The quickest route could create a new problem; the careful route required more cooperation, but it protected everyone involved.`,
    `The team tested its plan in one small, reversible step. When the result matched their prediction, they continued; when something changed, they adjusted without blaming the person who had offered the idea.`,
    `On the way home, they reconstructed the adventure from beginning to end. They named the decisive clue, the moment their thinking changed, and the cause that finally made the solution possible.`,
    `The place itself seemed to answer through small details: a shadow moved, a sound returned, and one color appeared where nobody had noticed it before. The group learned to let the setting become part of the evidence.`,
    `A quieter companion asked everyone to explain the same event from another character's point of view. The facts did not change, but the reasons behind several actions suddenly became easier to understand.`,
    `They also chose one unfamiliar word from the clues and inferred its meaning from the sentences around it. Understanding that word changed the way they interpreted an earlier moment in the adventure.`,
    `Halfway through, they stopped for water and retold the events in order. That short pause revealed a missing connection between the first discovery and the newest consequence.`,
    `When disagreement appeared, each person had one minute to present an idea and one question to ask someone else. Listening did not erase the differences, but it made the final plan much stronger.`,
    `The solution improved more than the immediate problem. It left the place safer, gave future visitors a useful record, and reminded the group that careful thinking can be both slow and exciting.`,
  ] : [
    `Antes del hallazgo, ${hero} había pasado la mañana conociendo los sonidos, colores y rutinas normales del lugar. Esa atención paciente sería importante, porque es más fácil notar un cambio cuando se recuerda cómo son las cosas habitualmente.`,
    `Al principio, la pista resultaba emocionante pero incompleta. El grupo anotó qué sabía, qué solamente sospechaba y qué preguntas todavía necesitaban respuesta. Nadie quería confundir una suposición segura de sí misma con una evidencia verdadera.`,
    `Un pequeño contratiempo obligó a todos a bajar el ritmo. Una idea explicaba el comienzo del problema pero no lo que ocurría después; otra coincidía con dos detalles y contradecía un tercero. Entonces regresaron a observar.`,
    `Cada compañero describió la pista con palabras diferentes. Al comparar esas descripciones, separaron las observaciones de las opiniones y encontraron un patrón que ninguno había advertido por su cuenta.`,
    `Antes de actuar, ${hero} imaginó las posibles consecuencias de cada plan. La ruta más rápida podía crear un problema nuevo; la ruta cuidadosa exigía más colaboración, pero protegía a todos los involucrados.`,
    `El equipo probó su plan con un paso pequeño y reversible. Cuando el resultado coincidió con la predicción, continuaron; cuando algo cambió, ajustaron la idea sin culpar a quien la había propuesto.`,
    `De regreso, reconstruyeron la aventura desde el comienzo hasta el final. Nombraron la pista decisiva, el momento en que cambió su manera de pensar y la causa que finalmente hizo posible la solución.`,
    `El propio lugar parecía responder mediante detalles pequeños: una sombra se movió, un sonido regresó y apareció un color donde nadie lo había notado. El grupo aprendió a convertir el escenario en parte de la evidencia.`,
    `Un compañero más silencioso propuso explicar el mismo hecho desde la mirada de otro personaje. Los datos no cambiaron, pero las razones detrás de varias acciones se volvieron mucho más comprensibles.`,
    `También eligieron una palabra desconocida entre las pistas y dedujeron su significado por las oraciones que la rodeaban. Comprenderla transformó la manera en que interpretaban un momento anterior de la aventura.`,
    `A mitad del recorrido se detuvieron a tomar agua y contaron los acontecimientos en orden. Esa pausa breve reveló una conexión ausente entre el primer hallazgo y la consecuencia más reciente.`,
    `Cuando apareció un desacuerdo, cada persona tuvo un minuto para presentar una idea y formular una pregunta a otra. Escuchar no eliminó las diferencias, pero volvió mucho más fuerte el plan final.`,
    `La solución mejoró algo más que el problema inmediato. Dejó el lugar más seguro, ofreció un registro útil a futuros visitantes y recordó al grupo que pensar con cuidado puede ser lento y emocionante a la vez.`,
  ];
  const expanded = [
    expansions[0],
    expansions[7],
    first,
    expansions[1],
    expansions[8],
    expansions[2],
    expansions[9],
    middle,
    expansions[3],
    expansions[10],
    expansions[4],
    expansions[11],
    last,
    expansions[5],
    expansions[12],
    expansions[6],
  ].filter(Boolean).join("\n\n");
  return countWords(expanded) <= input.maxWords ? expanded : expanded.split(/\s+/u).slice(0, input.maxWords).join(" ");
}

export class FixtureStoryGenerator implements StoryGenerator {
  readonly modelId = "fixture:catalog-v2";

  async generate(input: GenerateStoryInput): Promise<GeneratedStory> {
    const selected = [...fixtureStories].sort((left, right) => score(right, input) - score(left, input))[0]!;
    const candidate = structuredClone(input.language === "en" ? englishFixtureStories[selected.id] ?? selected.output : selected.output);
    candidate.story = expandLongReading(candidate.story, input);
    if (countWords(candidate.story) > input.maxWords) {
      candidate.story = candidate.story.split(/\s+/u).slice(0, input.maxWords).join(" ");
    }
    return parseGeneratedStory(candidate, input.maxWords);
  }
}
