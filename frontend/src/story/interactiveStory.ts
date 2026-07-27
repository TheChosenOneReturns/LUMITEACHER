import type { Skill, StoryLanguage, StoryPublic } from "@story-teacher/shared";
import fantasyScene from "../assets/story-scenes/scene-fantasy.webp";
import inventionsScene from "../assets/story-scenes/scene-inventions.webp";
import jungleScene from "../assets/story-scenes/scene-jungle.webp";
import mysteryScene from "../assets/story-scenes/scene-mystery.webp";
import oceanScene from "../assets/story-scenes/scene-ocean.webp";
import spaceScene from "../assets/story-scenes/scene-space.webp";

export type StoryWorldId = "space" | "fantasy" | "ocean" | "jungle" | "inventions" | "mystery";

export interface StoryChoice {
  id: string;
  label: string;
  consequence: string;
  nextSceneId: string;
}

export interface InteractiveScene {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  sensoryCue: string;
  choices: StoryChoice[];
  ending: boolean;
  checkpoint: StoryCheckpoint | null;
}

export interface StoryCheckpoint {
  id: string;
  statement: string;
  options: string[];
  correctAnswer: number;
  skill: Skill;
  explanation: string;
}

export interface InteractiveAdventure {
  id: string;
  language: StoryLanguage;
  worldId: StoryWorldId;
  image: string;
  title: string;
  startSceneId: string;
  scenes: InteractiveScene[];
}

export interface JourneyDecision {
  sceneId: string;
  sceneTitle: string;
  choiceId: string;
  choiceLabel: string;
  consequence: string;
}

export interface StoredJourney {
  storyId: string;
  adventureTitle: string;
  language: StoryLanguage;
  decisions: JourneyDecision[];
  endingTitle: string;
  endingText: string;
  checkpointStars: number;
  checkpointResults: Array<{ checkpointId: string; correct: boolean }>;
  completedAt: string;
}

interface LocalizedWorldScript {
  title: string;
  openingTitle: string;
  opening: string;
  sensory: string;
  routes: Array<{
    label: string;
    consequence: string;
    title: string;
    text: string;
    sensory: string;
    endings: Array<{ label: string; consequence: string; title: string; text: string }>;
  }>;
}

const sceneImages: Record<StoryWorldId, string> = {
  space: spaceScene,
  fantasy: fantasyScene,
  ocean: oceanScene,
  jungle: jungleScene,
  inventions: inventionsScene,
  mystery: mysteryScene,
};

const scripts: Record<StoryWorldId, Record<StoryLanguage, LocalizedWorldScript>> = {
  space: {
    es: {
      title: "La señal del planeta azul", openingTitle: "Un mensaje entre estrellas",
      opening: "El cristal azul late como un corazón diminuto. A un lado, un satélite repite una melodía; al otro, una cueva responde con destellos. La tripulación espera tu decisión.", sensory: "Escuchás tres notas suaves y sentís una vibración bajo las botas.",
      routes: [
        { label: "Seguir la canción del satélite", consequence: "Vas a investigar un patrón de sonidos.", title: "La órbita musical", text: "El satélite canta tres notas y guarda silencio. El robot descubre que la pausa también forma parte del mensaje.", sensory: "Las notas se encienden como pequeñas luciérnagas.", endings: [
          { label: "Repetir el ritmo con paciencia", consequence: "Usás observación y memoria.", title: "Un puente de frecuencias", text: "Al repetir ritmo y pausa, aparece una ruta segura. El equipo rescata al explorador sin alterar la órbita." },
          { label: "Pedir al equipo que compare señales", consequence: "Elegís colaborar antes de actuar.", title: "El coro de antenas", text: "Cada compañero aporta una parte del patrón. Juntas, las antenas convierten la señal en un mapa luminoso." },
        ] },
        { label: "Explorar la cueva luminosa", consequence: "Vas a leer pistas escondidas en las paredes.", title: "La cueva que recuerda", text: "Los cristales proyectan escenas antiguas. Una muestra un puente roto y otra, un robot esperando ayuda.", sensory: "La luz azul dibuja huellas que aparecen y desaparecen.", endings: [
          { label: "Ordenar las imágenes antes de avanzar", consequence: "Reconstruís la secuencia del problema.", title: "El mapa de los recuerdos", text: "Las escenas ordenadas revelan el camino firme. La tripulación llega al robot siguiendo cada pista." },
          { label: "Construir una baliza de regreso", consequence: "Priorizás una ruta segura para todos.", title: "La estrella que guía", text: "La baliza marca cada curva y permite volver juntos. El cristal brilla al reconocer una decisión cuidadosa." },
        ] },
      ],
    },
    en: {
      title: "The Signal from the Blue Planet", openingTitle: "A message among the stars",
      opening: "The blue crystal pulses like a tiny heart. A satellite repeats a melody on one side, while a cave answers with flashes on the other. The crew waits for your decision.", sensory: "You hear three soft notes and feel a gentle vibration under your boots.",
      routes: [
        { label: "Follow the satellite's song", consequence: "You will investigate a sound pattern.", title: "The musical orbit", text: "The satellite sings three notes and becomes quiet. The robot notices that the pause is part of the message too.", sensory: "The notes glow like tiny fireflies.", endings: [
          { label: "Repeat the rhythm patiently", consequence: "You use observation and memory.", title: "A bridge of frequencies", text: "When you repeat the rhythm and pause, a safe route appears. The team rescues the explorer without changing the orbit." },
          { label: "Ask the crew to compare signals", consequence: "You choose teamwork before action.", title: "The antenna choir", text: "Each teammate finds one part of the pattern. Together, the antennas turn the signal into a glowing map." },
        ] },
        { label: "Explore the glowing cave", consequence: "You will read clues hidden on the walls.", title: "The cave that remembers", text: "The crystals project old scenes. One shows a broken bridge and another shows a robot waiting for help.", sensory: "Blue light draws footprints that appear and disappear.", endings: [
          { label: "Put the images in order first", consequence: "You rebuild the sequence of the problem.", title: "The map of memories", text: "The ordered scenes reveal the strong path. The crew reaches the robot by following every clue." },
          { label: "Build a return beacon", consequence: "You make a safe route for everyone.", title: "The guiding star", text: "The beacon marks every turn and lets everyone return together. The crystal shines at the careful decision." },
        ] },
      ],
    },
  },
  fantasy: {
    es: {
      title: "La biblioteca de las dos lunas", openingTitle: "El libro que abre caminos", opening: "El libro plateado despierta dos escaleras: una sube hacia una torre bañada por el sol y otra desciende a una sala donde las páginas flotan bajo la luna.", sensory: "Las páginas huelen a vainilla y una campanita marca cada cambio de luz.",
      routes: [
        { label: "Subir a la torre del reloj", consequence: "Buscarás pistas en la luz y las sombras.", title: "La hora escondida", text: "Las ventanas proyectan símbolos diferentes. Sólo uno se repite cuando el reloj y el sol quedan alineados.", sensory: "Una franja dorada recorre lentamente el suelo.", endings: [
          { label: "Esperar y comparar las sombras", consequence: "Elegís observar antes de responder.", title: "La sala del mediodía", text: "La sombra correcta abre una biblioteca secreta. Sus libros regresan a los estantes cuando explicás el patrón." },
          { label: "Invitar a los aprendices a medir juntos", consequence: "Convertís la pista en una investigación grupal.", title: "El reloj de muchas miradas", text: "Cada medida completa una parte del acertijo. La torre celebra con pequeñas luces doradas." },
        ] },
        { label: "Entrar a la sala de páginas", consequence: "Seguirás una historia que cambia de orden.", title: "El río de papel", text: "Las páginas flotan mezcladas: una muestra una llave, otra una puerta y otra a alguien compartiendo el hallazgo.", sensory: "El aire mueve las hojas como si respiraran.", endings: [
          { label: "Ordenar las páginas por causa y efecto", consequence: "Buscás qué acción produce cada cambio.", title: "El final que faltaba", text: "El orden correcto revela que la llave funciona cuando todos leen una línea. La puerta se abre sin apuro." },
          { label: "Leer cada página desde otra perspectiva", consequence: "Comparás lo que sabe cada personaje.", title: "La historia de las cuatro voces", text: "Las voces distintas completan los huecos del relato. El libro crea un final nuevo donde nadie queda afuera." },
        ] },
      ],
    },
    en: {
      title: "The Library of Two Moons", openingTitle: "The book that opens paths", opening: "The silver book wakes two stairways: one climbs to a sunlit clock tower, while the other descends to a room where pages float beneath the moon.", sensory: "The pages smell like vanilla, and a tiny bell marks every change of light.",
      routes: [
        { label: "Climb to the clock tower", consequence: "You will search for clues in light and shadow.", title: "The hidden hour", text: "The windows project different symbols. Only one repeats when the clock and the sun become aligned.", sensory: "A golden stripe moves slowly across the floor.", endings: [
          { label: "Wait and compare the shadows", consequence: "You choose to observe before answering.", title: "The noon room", text: "The correct shadow opens a secret library. Its books return to the shelves when you explain the pattern." },
          { label: "Invite the apprentices to measure together", consequence: "You turn the clue into a group investigation.", title: "The clock of many views", text: "Each measurement completes part of the riddle. The tower celebrates with tiny golden lights." },
        ] },
        { label: "Enter the room of pages", consequence: "You will follow a story that changes order.", title: "The paper river", text: "The pages float out of order: one shows a key, another a door, and another someone sharing the discovery.", sensory: "The air moves the sheets as if they were breathing.", endings: [
          { label: "Order the pages by cause and effect", consequence: "You look for the action behind every change.", title: "The missing ending", text: "The correct order reveals that the key works when everyone reads one line. The door opens gently." },
          { label: "Read each page from another perspective", consequence: "You compare what every character knows.", title: "The story of four voices", text: "The different voices fill the gaps in the tale. The book creates a new ending where nobody is left out." },
        ] },
      ],
    },
  },
  ocean: {
    es: {
      title: "La canción bajo el arrecife", openingTitle: "Una melodía en el agua", opening: "La caracola reproduce un canto pausado. Las burbujas de colores viajan hacia una familia de ballenas, mientras un sendero de coral conduce a la estación científica.", sensory: "El agua vibra con una nota grave y tranquila.",
      routes: [
        { label: "Seguir las burbujas de eco", consequence: "Compararás sonidos sin acercarte demasiado.", title: "El idioma de las ballenas", text: "Cada color acompaña una nota. La ballena pequeña responde, pero falta el sonido que indica dónde está su grupo.", sensory: "Las burbujas cosquillean al pasar junto al submarino.", endings: [
          { label: "Crear boyas con el ritmo correcto", consequence: "Usás tecnología sin molestar a los animales.", title: "El camino de las canciones", text: "Las boyas repiten el canto suavemente. La ballena reconoce la ruta y vuelve con su familia." },
          { label: "Esperar una nueva respuesta", consequence: "Elegís reunir más evidencia.", title: "La pausa que respondió", text: "Después del silencio llega una nota lejana. Al seguirla con paciencia, encuentran al grupo detrás del arrecife." },
        ] },
        { label: "Visitar la estación del coral", consequence: "Consultarás registros y pedirás ayuda.", title: "El archivo de corrientes", text: "Los mapas muestran que el sonido cambia con la temperatura. Una corriente cálida puede haber desviado el canto.", sensory: "Pequeñas luces verdes recorren el mapa submarino.", endings: [
          { label: "Comparar el mapa con la melodía", consequence: "Combinás dos fuentes de información.", title: "La ruta azul", text: "El mapa y el canto señalan el mismo canal. El equipo guía a la ballena con luces suaves." },
          { label: "Pedir consejo a la tortuga cartógrafa", consequence: "Sumás la experiencia de otro explorador.", title: "La brújula coral", text: "La tortuga recuerda un paso seguro entre las rocas. Todos avanzan despacio y encuentran a la familia." },
        ] },
      ],
    },
    en: {
      title: "The Song Beneath the Reef", openingTitle: "A melody in the water", opening: "The shell plays a slow song. Colorful echo bubbles travel toward a whale family, while a coral path leads to the research station.", sensory: "The water vibrates with one deep, peaceful note.",
      routes: [
        { label: "Follow the echo bubbles", consequence: "You will compare sounds from a safe distance.", title: "The language of whales", text: "Each color travels with one note. The young whale answers, but the sound that reveals its family's location is missing.", sensory: "The bubbles tickle as they pass the submarine.", endings: [
          { label: "Build buoys with the correct rhythm", consequence: "You use technology without disturbing the animals.", title: "The path of songs", text: "The buoys repeat the song softly. The whale recognizes the route and returns to its family." },
          { label: "Wait for another answer", consequence: "You choose to gather more evidence.", title: "The pause that answered", text: "After the silence, a distant note arrives. By following it patiently, the team finds the group beyond the reef." },
        ] },
        { label: "Visit the coral station", consequence: "You will check records and ask for help.", title: "The current archive", text: "The maps show that sound changes with temperature. A warm current may have moved the song away.", sensory: "Tiny green lights travel across the underwater map.", endings: [
          { label: "Compare the map with the melody", consequence: "You combine two sources of information.", title: "The blue route", text: "The map and the song point to the same channel. The team guides the whale with gentle lights." },
          { label: "Ask the turtle mapmaker", consequence: "You add another explorer's experience.", title: "The coral compass", text: "The turtle remembers a safe passage between the rocks. Everyone moves slowly and finds the family." },
        ] },
      ],
    },
  },
  jungle: {
    es: {
      title: "La semilla de las voces", openingTitle: "Después de la lluvia", opening: "Una semilla violeta brilla junto al río. Un puente de hojas conduce al jardín comunitario y el arroyo lleva hasta la tortuga jardinera.", sensory: "Las gotas caen de las hojas con un ritmo tranquilo.",
      routes: [
        { label: "Cruzar al jardín", consequence: "Investigarás qué necesita cada planta.", title: "El jardín que escucha", text: "Las plantas inclinan sus hojas hacia zonas diferentes. La luz, el agua y el suelo cuentan pistas distintas.", sensory: "Un aroma dulce aparece cerca de la tierra más oscura.", endings: [
          { label: "Comparar los tres lugares", consequence: "Observás antes de plantar.", title: "La raíz paciente", text: "El lugar más firme protege la semilla de la corriente. Pronto nace un brote que sostiene la orilla." },
          { label: "Preguntar a quienes cuidan el jardín", consequence: "Construís una decisión compartida.", title: "El círculo de semillas", text: "Cada cuidador aporta una observación. Juntos crean un refugio donde la nueva planta puede crecer." },
        ] },
        { label: "Seguir el arroyo", consequence: "Buscarás la experiencia de la tortuga.", title: "El mapa del agua", text: "La tortuga muestra marcas de antiguas lluvias. Algunas raíces resistieron porque crecían lejos de la curva más rápida.", sensory: "El agua refleja pequeñas líneas doradas sobre las piedras.", endings: [
          { label: "Dibujar primero el recorrido del agua", consequence: "Planificás usando causas y consecuencias.", title: "La orilla protegida", text: "El dibujo revela una zona tranquila. Allí la semilla crece y sus raíces dan hogar a muchos insectos." },
          { label: "Crear una barrera de hojas", consequence: "Probás una solución pequeña y reversible.", title: "El refugio verde", text: "Las hojas reducen la fuerza del agua. La semilla queda segura y el equipo aprende del cambio." },
        ] },
      ],
    },
    en: {
      title: "The Seed of Many Voices", openingTitle: "After the rain", opening: "A violet seed glows beside the river. A leafy bridge leads to the community garden, while the stream leads to the turtle gardener.", sensory: "Drops fall from the leaves in a peaceful rhythm.",
      routes: [
        { label: "Cross to the garden", consequence: "You will investigate what each plant needs.", title: "The garden that listens", text: "The plants tilt their leaves toward different places. Light, water, and soil each offer a different clue.", sensory: "A sweet scent appears near the darkest soil.", endings: [
          { label: "Compare all three places", consequence: "You observe before planting.", title: "The patient root", text: "The strongest place protects the seed from the current. Soon a sprout holds the riverbank together." },
          { label: "Ask the garden keepers", consequence: "You build a shared decision.", title: "The seed circle", text: "Every keeper adds an observation. Together, they make a shelter where the new plant can grow." },
        ] },
        { label: "Follow the stream", consequence: "You will seek the turtle's experience.", title: "The water map", text: "The turtle shows marks left by old rains. Some roots survived because they grew far from the fastest bend.", sensory: "The water reflects tiny golden lines on the stones.", endings: [
          { label: "Draw the water's route first", consequence: "You plan with causes and consequences.", title: "The protected bank", text: "The drawing reveals a quiet area. The seed grows there, and its roots give insects a home." },
          { label: "Build a barrier of leaves", consequence: "You test a small, reversible solution.", title: "The green shelter", text: "The leaves soften the water's force. The seed stays safe, and the team learns from the change." },
        ] },
      ],
    },
  },
  inventions: {
    es: {
      title: "El engranaje de las buenas preguntas", openingTitle: "La pieza transparente", opening: "El engranaje enciende dos rutas del taller: una cinta lleva prototipos con pequeños errores y un puente conduce al laboratorio donde otros inventores esperan.", sensory: "Las máquinas hacen clic con un ritmo alegre y suave.",
      routes: [
        { label: "Revisar los prototipos", consequence: "Buscarás patrones entre varios errores.", title: "La cinta de las ideas", text: "Tres máquinas fallan de maneras distintas, pero todas se detienen después de la misma luz amarilla.", sensory: "Una bombilla parpadea justo antes de cada pausa.", endings: [
          { label: "Registrar cada señal", consequence: "Convertís errores en datos útiles.", title: "El cuaderno transparente", text: "El registro revela un cable flojo. Al repararlo, las máquinas vuelven a funcionar sin desperdiciar energía." },
          { label: "Cambiar una sola pieza por vez", consequence: "Probás hipótesis de forma ordenada.", title: "La prueba perfecta", text: "Cada cambio descarta una causa. El equipo encuentra la pieza correcta y aprende cómo repetir la solución." },
        ] },
        { label: "Cruzar al laboratorio", consequence: "Compartirás el problema con otros creadores.", title: "El puente de preguntas", text: "Cada inventor mira el engranaje desde un ángulo. Una pregunta sobre el ruido cambia la investigación.", sensory: "Pequeñas luces se encienden cuando alguien aporta una idea.", endings: [
          { label: "Combinar dos ideas compatibles", consequence: "Buscás una solución colaborativa.", title: "La máquina que aprendió a escuchar", text: "El nuevo diseño reduce el ruido y ahorra energía. El taller guarda el plano para futuros inventos." },
          { label: "Construir una maqueta segura", consequence: "Elegís probar en pequeño antes de decidir.", title: "La ciudad en miniatura", text: "La maqueta permite ver la consecuencia de cada ajuste. El diseño final funciona con calma y precisión." },
        ] },
      ],
    },
    en: {
      title: "The Gear of Good Questions", openingTitle: "The transparent piece", opening: "The gear lights two workshop routes: a conveyor carries prototypes with tiny mistakes, while a bridge leads to a lab where other inventors wait.", sensory: "The machines click in a cheerful, gentle rhythm.",
      routes: [
        { label: "Inspect the prototypes", consequence: "You will search for patterns across several errors.", title: "The idea conveyor", text: "Three machines fail in different ways, but all of them stop after the same yellow light.", sensory: "A bulb flashes just before every pause.", endings: [
          { label: "Record every signal", consequence: "You turn errors into useful data.", title: "The transparent notebook", text: "The record reveals a loose cable. Once repaired, the machines work again without wasting energy." },
          { label: "Change one piece at a time", consequence: "You test ideas in an organized way.", title: "The perfect test", text: "Each change removes one possible cause. The team finds the right piece and learns how to repeat the solution." },
        ] },
        { label: "Cross to the laboratory", consequence: "You will share the problem with other creators.", title: "The bridge of questions", text: "Each inventor sees the gear from a different angle. One question about the noise changes the investigation.", sensory: "Tiny lights turn on whenever someone adds an idea.", endings: [
          { label: "Combine two matching ideas", consequence: "You look for a collaborative solution.", title: "The machine that learned to listen", text: "The new design lowers the noise and saves energy. The workshop keeps the plan for future inventions." },
          { label: "Build a safe small model", consequence: "You test on a small scale before deciding.", title: "The miniature city", text: "The model shows the result of every adjustment. The final design works with calm precision." },
        ] },
      ],
    },
  },
  mystery: {
    es: {
      title: "El portal de los finales", openingTitle: "Una página todavía vacía", opening: "La tinta brillante despierta dos caminos: páginas musicales flotan hacia una isla y piedras con escenas iluminadas cruzan las nubes.", sensory: "La tinta cambia de color cuando imaginás una pregunta.",
      routes: [
        { label: "Caminar por las páginas musicales", consequence: "Descubrirás una historia guiada por sonidos.", title: "La melodía incompleta", text: "Cada página toca una nota y muestra una acción. Falta la nota que une el problema con su solución.", sensory: "El camino vibra suavemente bajo cada paso.", endings: [
          { label: "Escuchar otra vez desde el comienzo", consequence: "Revisás el orden completo.", title: "El puente de la escucha", text: "La secuencia correcta completa la melodía. La isla se acerca y todos pueden cruzar." },
          { label: "Invitar a otro personaje a continuar", consequence: "Abrís espacio para una idea diferente.", title: "La canción compartida", text: "La nueva voz encuentra la nota que faltaba. El portal guarda ambas versiones como finales posibles." },
        ] },
        { label: "Cruzar las piedras de escenas", consequence: "Reconstruirás una aventura con imágenes.", title: "El sendero de los recuerdos", text: "Cada piedra muestra un momento, pero una imagen parece estar en el lugar equivocado.", sensory: "Las escenas brillan al acercar la mano.", endings: [
          { label: "Ordenar las escenas por pistas", consequence: "Usás tiempo, causa y consecuencia.", title: "El archivo luminoso", text: "El orden revela un final coherente. El camaleón archiva la ruta para que otros lectores puedan explorarla." },
          { label: "Elegir una escena y cambiar su decisión", consequence: "Explorás cómo una elección transforma el relato.", title: "El final inesperado", text: "La nueva decisión abre una isla que nadie había visto. El libro recuerda que una historia puede tener más de un buen final." },
        ] },
      ],
    },
    en: {
      title: "The Portal of Endings", openingTitle: "A page that is still blank", opening: "The glowing ink wakes two paths: musical pages float toward an island, while stones filled with story scenes cross the clouds.", sensory: "The ink changes color whenever you imagine a question.",
      routes: [
        { label: "Walk across the musical pages", consequence: "You will discover a story guided by sound.", title: "The unfinished melody", text: "Each page plays one note and shows one action. The note connecting the problem to its solution is missing.", sensory: "The path vibrates gently under every step.", endings: [
          { label: "Listen again from the beginning", consequence: "You review the complete order.", title: "The bridge of listening", text: "The correct sequence completes the melody. The island moves closer, and everyone can cross." },
          { label: "Invite another character to continue", consequence: "You make room for a different idea.", title: "The shared song", text: "The new voice finds the missing note. The portal saves both versions as possible endings." },
        ] },
        { label: "Cross the stones of scenes", consequence: "You will rebuild an adventure from images.", title: "The path of memories", text: "Every stone shows one moment, but one image seems to be in the wrong place.", sensory: "The scenes glow when you move your hand closer.", endings: [
          { label: "Order the scenes using clues", consequence: "You use time, cause, and consequence.", title: "The glowing archive", text: "The order reveals a clear ending. The chameleon saves the route so other readers can explore it." },
          { label: "Change one decision in a scene", consequence: "You explore how a choice transforms the tale.", title: "The unexpected ending", text: "The new decision opens an island nobody had seen. The book remembers that a story can have more than one good ending." },
        ] },
      ],
    },
  },
};

interface NarrativeLore {
  setting: string;
  tension: string;
  investigation: string;
  resolution: string;
  refrain: string;
}

const narrativeLore: Record<StoryWorldId, Record<StoryLanguage, NarrativeLore>> = {
  space: {
    es: {
      setting: "Más allá de las ventanas, el planeta parecía una canica azul rodeada por nubes violetas. La nave avanzaba despacio para no alterar los satélites antiguos que giraban a su alrededor desde hacía siglos.",
      tension: "La señal se debilitaba cada nueve minutos y, si desaparecía, el equipo perdería la única pista para encontrar al explorador. Nadie podía adivinar: debían observar, comparar y explicar cada decisión.",
      investigation: "En la mesa de navegación registraron sonidos, destellos y pausas. Descubrieron que una pista aislada podía engañarlos, pero dos pistas que coincidían contaban una historia mucho más confiable.",
      resolution: "Cuando el peligro pasó, la tripulación guardó el registro para futuros viajeros. Comprendieron que la curiosidad abre caminos, pero la paciencia y el trabajo compartido permiten recorrerlos sin dejar a nadie atrás.",
      refrain: "Mirar, comparar, volver a preguntar: ésa era la brújula de la tripulación.",
    },
    en: {
      setting: "Beyond the windows, the planet looked like a blue marble wrapped in violet clouds. The ship moved slowly so it would not disturb the ancient satellites that had circled it for centuries.",
      tension: "The signal weakened every nine minutes, and if it vanished, the crew would lose its only clue to the missing explorer. Nobody could simply guess; every decision needed evidence and an explanation.",
      investigation: "At the navigation table, they recorded sounds, flashes, and pauses. One clue alone could be misleading, but two clues that agreed could tell a much more reliable story.",
      resolution: "When the danger had passed, the crew saved the record for future travelers. Curiosity opened the route, but patience and teamwork made it safe enough for everyone to return.",
      refrain: "Look, compare, ask once more: that was the crew's true compass.",
    },
  },
  fantasy: {
    es: {
      setting: "La biblioteca era tan grande que algunas nubes dormían entre sus estantes. Cada libro conservaba la voz de quien lo había leído y las dos lunas cambiaban la tinta según la hora y el ánimo del lector.",
      tension: "Alguien había mezclado los capítulos del Gran Libro de los Porqués. Si no reconstruían su sentido antes del anochecer, los personajes olvidarían qué deseaban, qué temían y por qué habían comenzado sus viajes.",
      investigation: "El grupo buscó repeticiones, causas y pequeñas diferencias entre las versiones. No bastaba con encontrar una llave o una puerta: tenían que comprender quién la necesitaba y qué podía ocurrir al usarla.",
      resolution: "Los estantes recuperaron sus colores y cada personaje volvió a reconocer su historia. El libro dejó una página en blanco para recordarles que comprender otra mirada también puede cambiar un final.",
      refrain: "Una buena pregunta ilumina más que cien respuestas apuradas.",
    },
    en: {
      setting: "The library was so tall that clouds slept between its shelves. Every book kept the voice of its readers, and the two moons changed the ink according to the hour and the reader's feelings.",
      tension: "Someone had mixed the chapters of the Great Book of Whys. Unless they rebuilt its meaning before nightfall, the characters would forget what they wanted, what they feared, and why their journeys had begun.",
      investigation: "The group searched for repeated details, causes, and small differences between versions. Finding a key was not enough; they needed to understand who required it and what using it might change.",
      resolution: "The shelves recovered their colors, and every character recognized their own story again. The book left one page blank to remind them that understanding another point of view can transform an ending.",
      refrain: "One thoughtful question can shine brighter than a hundred hurried answers.",
    },
  },
  ocean: {
    es: {
      setting: "El arrecife despertaba con miles de colores mientras el submarino se deslizaba sin tocar los corales. Peces diminutos ordenaban sus cardúmenes y, a lo lejos, una ballena joven repetía una melodía incompleta.",
      tension: "Una corriente cálida estaba cambiando el recorrido de los sonidos. Si actuaban con demasiada rapidez podían asustar a los animales; si esperaban sin investigar, la ballena se alejaría todavía más de su familia.",
      investigation: "El equipo comparó mapas, temperaturas y ecos. Aprendió a dejar pausas para escuchar una respuesta y a distinguir una coincidencia de un patrón que se repetía de verdad.",
      resolution: "El canto de la familia volvió a atravesar el agua como un abrazo. Antes de partir, los exploradores anotaron cómo habían ayudado sin invadir el arrecife ni interrumpir la vida de sus habitantes.",
      refrain: "En el océano, escuchar también es una forma de avanzar.",
    },
    en: {
      setting: "The reef woke in thousands of colors while the submarine glided without touching the coral. Tiny fish arranged their schools, and far away a young whale repeated an unfinished melody.",
      tension: "A warm current was changing the path of every sound. Moving too quickly might frighten the animals, but waiting without investigating could carry the whale even farther from its family.",
      investigation: "The team compared maps, temperatures, and echoes. They learned to leave quiet spaces for an answer and to tell a coincidence from a pattern that truly repeated.",
      resolution: "The family's song crossed the water again like an embrace. Before leaving, the explorers recorded how they had helped without invading the reef or interrupting the lives around it.",
      refrain: "In the ocean, listening is another way of moving forward.",
    },
  },
  jungle: {
    es: {
      setting: "Después de la tormenta, la selva olía a tierra nueva. Las hojas grandes conservaban gotas redondas y cada animal recorría la orilla para descubrir qué había cambiado durante la noche.",
      tension: "El río crecía alrededor de la semilla violeta. Plantarla en el primer lugar disponible podía salvarla por un rato, pero una mala elección dañaría sus raíces y también el refugio de muchos insectos.",
      investigation: "Los cuidadores observaron la luz, la inclinación del terreno y las marcas dejadas por lluvias anteriores. Cada dato explicaba una parte, y juntos formaban un mapa de causas y consecuencias.",
      resolution: "Semanas después, las nuevas raíces afirmaron la orilla y aparecieron flores pequeñas. La comunidad comprendió que cuidar no significa decidir por la naturaleza, sino aprender a leer sus señales.",
      refrain: "La selva habla bajito; para entenderla hay que mirar sin apuro.",
    },
    en: {
      setting: "After the storm, the jungle smelled of new soil. Broad leaves held round drops of water, and every animal explored the riverbank to discover what had changed overnight.",
      tension: "The river was rising around the violet seed. Planting it in the first available place might help for a moment, but a poor choice could harm its roots and the shelter of many insects.",
      investigation: "The keepers observed the light, the slope of the ground, and marks left by earlier rains. Each detail explained one piece, and together they formed a map of causes and effects.",
      resolution: "Weeks later, new roots strengthened the riverbank and tiny flowers appeared. The community learned that caring does not mean deciding for nature; it means learning to read its signals.",
      refrain: "The jungle speaks softly, so understanding it takes an unhurried eye.",
    },
  },
  inventions: {
    es: {
      setting: "En la Ciudad de Inventos, las veredas producían energía con cada paso y los talleres compartían sus planos. Esa mañana, sin embargo, varias máquinas se detuvieron al mismo tiempo después de una luz amarilla.",
      tension: "La feria comenzaría al atardecer y todos querían reparar las máquinas enseguida. Pero cambiar muchas piezas a la vez ocultaría la causa del problema y podía crear errores todavía más difíciles de comprender.",
      investigation: "Los inventores anotaron qué ocurría antes, durante y después de cada falla. Probaron una variable por vez, escucharon hipótesis diferentes y descartaron explicaciones cuando la evidencia no las sostenía.",
      resolution: "La feria abrió con máquinas más silenciosas y eficientes. En lugar de esconder los errores, el equipo exhibió su cuaderno de pruebas para que otros niños pudieran aprender del recorrido completo.",
      refrain: "Equivocarse da una pista; investigar la convierte en conocimiento.",
    },
    en: {
      setting: "In Invention City, sidewalks made energy from every step, and workshops shared their plans. That morning, however, several machines stopped at exactly the same moment after a yellow light.",
      tension: "The fair would open at sunset, and everyone wanted a quick repair. Yet changing many parts at once would hide the cause and might create mistakes that were even harder to understand.",
      investigation: "The inventors recorded what happened before, during, and after each failure. They tested one variable at a time, listened to different ideas, and rejected explanations that the evidence did not support.",
      resolution: "The fair opened with quieter, more efficient machines. Instead of hiding their mistakes, the team displayed its testing notebook so other children could learn from the entire process.",
      refrain: "A mistake offers a clue; investigation turns it into knowledge.",
    },
  },
  mystery: {
    es: {
      setting: "El Portal de Historias flotaba entre islas hechas de recuerdos. Algunas guardaban risas, otras preguntas sin respuesta, y todas se conectaban mediante páginas que aparecían sólo cuando alguien leía con atención.",
      tension: "La tinta estaba perdiendo sus colores porque varias escenas habían quedado fuera de orden. Si el portal se cerraba, los relatos conservarían hechos sueltos, pero nadie podría comprender por qué sucedían.",
      investigation: "Los viajeros relacionaron personajes, lugares, tiempos y decisiones. Cada escena debía encajar no sólo por lo que mostraba, sino también por lo que causaba en la escena siguiente.",
      resolution: "El portal recuperó su brillo y guardó todos los caminos explorados. Las rutas eran diferentes, pero cada una tenía sentido porque sus decisiones dejaban consecuencias visibles.",
      refrain: "Una historia cambia de camino, pero nunca debe perder su hilo.",
    },
    en: {
      setting: "The Portal of Stories floated among islands made of memories. Some held laughter, others unanswered questions, and all were joined by pages that appeared only when someone read carefully.",
      tension: "The ink was losing its colors because several scenes had fallen out of order. If the portal closed, the tales would keep isolated facts, but nobody would understand why they happened.",
      investigation: "The travelers connected characters, places, times, and decisions. Each scene had to fit not only because of what it showed, but also because of what it caused in the scene that followed.",
      resolution: "The portal recovered its glow and saved every explored path. The routes were different, but each made sense because its decisions left visible consequences.",
      refrain: "A story may change its route, but it should never lose its thread.",
    },
  },
};

export function resolveStoryWorld(theme: string): StoryWorldId {
  const normalized = theme.normalize("NFD").replace(/[\u0300-\u036f]/gu, "").toLowerCase();
  if (/espacio|planeta|estrella|space/u.test(normalized)) return "space";
  if (/fantasia|castillo|magia|fantasy/u.test(normalized)) return "fantasy";
  if (/oceano|mar|ballena|ocean/u.test(normalized)) return "ocean";
  if (/selva|bosque|naturaleza|jungle/u.test(normalized)) return "jungle";
  if (/invento|ciencia|tecnologia|robot/u.test(normalized)) return "inventions";
  return "mystery";
}

export function getStorySceneImage(theme: string): string {
  return sceneImages[resolveStoryWorld(theme)];
}

function reorderOptions(correct: string, distractors: string[], offset: number): { options: string[]; correctAnswer: number } {
  const uniqueOptions = [correct, ...distractors.filter((option) => option !== correct)].slice(0, 4);
  const rotation = offset % uniqueOptions.length;
  const options = [...uniqueOptions.slice(rotation), ...uniqueOptions.slice(0, rotation)];
  return { options, correctAnswer: options.indexOf(correct) };
}

function openingCheckpoint(script: LocalizedWorldScript, language: StoryLanguage): StoryCheckpoint {
  const correct = language === "en"
    ? `${script.routes[0]!.label} or ${script.routes[1]!.label}`
    : `${script.routes[0]!.label} o ${script.routes[1]!.label}`;
  const answer = reorderOptions(correct, language === "en"
    ? ["Close the book and wait", "Choose without looking at the clues", "Return before the adventure begins"]
    : ["Cerrar el libro y esperar", "Elegir sin mirar ninguna pista", "Regresar antes de que empiece la aventura"], 1);
  return {
    id: "checkpoint-opening",
    statement: language === "en" ? "Which two possible routes did the story present?" : "¿Qué dos caminos posibles presentó el cuento?",
    ...answer,
    skill: "literal",
    explanation: language === "en" ? "Both routes were introduced before the crew made its first decision." : "Los dos caminos aparecieron antes de que el equipo tomara su primera decisión.",
  };
}

function routeCheckpoint(route: LocalizedWorldScript["routes"][number], routeIndex: number, language: StoryLanguage): StoryCheckpoint {
  const correct = route.consequence;
  const answer = reorderOptions(correct, language === "en"
    ? ["Act immediately without checking the clues.", "Ignore what the other characters have observed.", "Choose the fastest answer even if it has no evidence."]
    : ["Actuar de inmediato sin revisar las pistas.", "Ignorar lo que observaron los demás personajes.", "Elegir la respuesta más rápida aunque no tenga evidencia."], routeIndex + 2);
  return {
    id: `checkpoint-route-${routeIndex}`,
    statement: language === "en" ? "Which strategy best describes what the team is doing now?" : "¿Qué estrategia describe mejor lo que está haciendo el equipo?",
    ...answer,
    skill: routeIndex === 0 ? "inference" : "cause_effect",
    explanation: language === "en" ? `The clues show this strategy: ${route.consequence}` : `Las pistas muestran esta estrategia: ${route.consequence}`,
  };
}

function openingDepth(hero: string, language: StoryLanguage): string[] {
  return language === "en" ? [
    `The journey had not begun with an alarm or a race. ${hero} first met the rest of the crew, learned what each person knew, and listened to why this place mattered to them.`,
    `They walked around the scene once without touching anything. They noticed the direction of the light, the rhythm of nearby sounds, and the tiny marks that a hurried visitor might have overlooked.`,
    `One companion proposed an immediate answer. It was possible, but ${hero} asked what evidence supported it. When nobody could name two matching clues, they agreed to keep the idea as a hypothesis rather than a fact.`,
    `Uncertainty made the youngest member of the group nervous. Instead of hiding that feeling, the team used it as a signal to slow down, breathe, and divide the problem into smaller questions.`,
    `On a transparent board they drew three columns: what we know, what we imagine, and what we need to discover. Moving a note from one column to another became a small celebration.`,
    `Time still mattered. The world around them was changing little by little, so they chose a moment to decide. Until then, every observation had to help explain the problem, not merely decorate it.`,
  ] : [
    `El viaje no había empezado con una alarma ni con una carrera. ${hero} conoció primero al resto del equipo, descubrió qué sabía cada integrante y escuchó por qué aquel lugar era importante para ellos.`,
    `Recorrieron la escena una vez sin tocar nada. Observaron la dirección de la luz, el ritmo de los sonidos cercanos y las marcas diminutas que una visita apurada habría pasado por alto.`,
    `Un compañero propuso una respuesta inmediata. Era posible, pero ${hero} preguntó qué evidencia la sostenía. Como nadie pudo nombrar dos pistas coincidentes, decidieron conservarla como hipótesis y no como certeza.`,
    `La incertidumbre puso nervioso al integrante más joven. En lugar de ocultar esa emoción, el equipo la usó como señal para bajar el ritmo, respirar y dividir el problema en preguntas más pequeñas.`,
    `En una pizarra transparente dibujaron tres columnas: lo que sabemos, lo que imaginamos y lo que necesitamos descubrir. Mover una nota de una columna a otra se convirtió en una pequeña celebración.`,
    `El tiempo seguía siendo importante. El mundo a su alrededor cambiaba poco a poco, así que eligieron un momento límite para decidir. Hasta entonces, cada observación debía ayudar a explicar el problema y no sólo adornarlo.`,
  ];
}

function routeDepth(hero: string, route: LocalizedWorldScript["routes"][number], lore: NarrativeLore, language: StoryLanguage): string[] {
  return language === "en" ? [
    `Choosing to ${route.label.toLowerCase()} changed more than the landscape. It determined which clues they could reach, which voices they would hear, and which questions they would have to leave for another route.`,
    `${hero} repeated the sensory clue aloud: ${route.sensory} The group described it without interpreting it first, because careful readers separate what they notice from what they think it means.`,
    `Two explanations competed for their attention. One was simple and attractive; the other was less obvious but connected the beginning of the problem with what had just changed. They looked for a way to test both.`,
    `Their first experiment did not produce the expected result. Nobody treated it as a defeat. They recorded the difference, adjusted one detail, and tried again without changing everything at once.`,
    `A quiet character then pointed to a clue that had appeared much earlier. The detail had seemed unimportant on the first page, yet now it explained why the newest event could not be a coincidence.`,
    `Before the second decision, everyone predicted one benefit and one possible consequence for each option. A good choice, they agreed, should solve the problem while caring for the people and places around it.`,
  ] : [
    `Elegir ${route.label.toLowerCase()} cambió algo más que el paisaje. Determinó a qué pistas podían acercarse, qué voces escucharían y qué preguntas tendrían que dejar para otro camino.`,
    `${hero} repitió en voz alta la pista sensorial: ${route.sensory} El grupo la describió sin interpretarla todavía, porque un lector atento separa primero lo que observa de lo que cree que significa.`,
    `Dos explicaciones compitieron por su atención. Una era sencilla y atractiva; la otra resultaba menos evidente, pero conectaba el comienzo del problema con el cambio más reciente. Buscaron una manera de probar ambas.`,
    `El primer experimento no produjo el resultado esperado. Nadie lo consideró una derrota. Registraron la diferencia, ajustaron un solo detalle y volvieron a probar sin modificar todo al mismo tiempo.`,
    `Entonces un personaje silencioso señaló una pista que había aparecido mucho antes. En la primera página parecía poco importante, pero ahora explicaba por qué el acontecimiento más reciente no podía ser una coincidencia.`,
    `Antes de la segunda decisión, todos anticiparon un beneficio y una consecuencia posible para cada opción. Una buena elección, acordaron, debía resolver el problema y al mismo tiempo cuidar a quienes lo rodeaban.`,
  ];
}

function endingDepth(
  hero: string,
  route: LocalizedWorldScript["routes"][number],
  ending: LocalizedWorldScript["routes"][number]["endings"][number],
  language: StoryLanguage,
): string[] {
  return language === "en" ? [
    `${hero} explained the final plan step by step before anyone moved. Choosing to ${ending.label.toLowerCase()} required remembering the evidence gathered along the route rather than trusting the excitement of the moment.`,
    `The plan met one last obstacle. For an instant, the old solution seemed easier, but it would have ignored a consequence they already knew about. The team changed its timing without abandoning its purpose.`,
    `Each companion completed a different task. One watched for the original clue, another protected the return path, and a third recorded what changed. Cooperation made the solution understandable and repeatable.`,
    `When the result appeared, they did not celebrate immediately. First they checked whether it had truly solved the initial problem, whether anyone had been left behind, and whether the surrounding world remained safe.`,
    `Only then did the relief arrive. They laughed, shared what had surprised them, and wrote a short message for the next explorers: a conclusion is stronger when it can explain the journey that produced it.`,
    `There were still other endings hidden in the unchosen route. ${hero} imagined how one different decision could have changed the evidence, the relationships, and the lesson without turning either path into a wrong story.`,
  ] : [
    `${hero} explicó el plan final paso a paso antes de que nadie se moviera. Elegir ${ending.label.toLowerCase()} exigía recordar la evidencia reunida durante el camino y no dejarse llevar solamente por la emoción del momento.`,
    `El plan encontró un último obstáculo. Por un instante, la solución anterior pareció más fácil, pero habría ignorado una consecuencia que ya conocían. El equipo cambió el ritmo sin abandonar su propósito.`,
    `Cada compañero completó una tarea diferente. Uno vigiló la pista original, otro protegió el camino de regreso y un tercero registró qué cambiaba. La colaboración volvió la solución comprensible y repetible.`,
    `Cuando apareció el resultado, no festejaron de inmediato. Primero comprobaron si realmente había resuelto el problema inicial, si nadie había quedado atrás y si el mundo que los rodeaba continuaba a salvo.`,
    `Recién entonces llegó el alivio. Rieron, compartieron qué los había sorprendido y escribieron un mensaje para los próximos exploradores: una conclusión es más fuerte cuando puede explicar el recorrido que la produjo.`,
    `Todavía quedaban otros finales escondidos en la ruta no elegida. ${hero} imaginó cómo una decisión diferente habría cambiado las pistas, los vínculos y el aprendizaje sin convertir ninguno de los caminos en una historia equivocada.`,
  ];
}

function openingText(story: StoryPublic, script: LocalizedWorldScript, lore: NarrativeLore, language: StoryLanguage): string {
  const hero = story.input.mainCharacter?.trim() || (language === "en" ? "the young explorer" : "el joven explorador");
  const opening = `${language === "en" ? `${hero} steps into the adventure. ` : `${hero} entra en la aventura. `}${script.opening}`;
  const depth = openingDepth(hero, language);
  const learning = language === "en"
    ? `${hero} remembered the mission for this journey: ${story.input.educationalObjective}. Instead of treating it like a school instruction, the group turned it into a question that could guide every clue.`
    : `${hero} recordó la misión de este viaje: ${story.input.educationalObjective}. En lugar de tomarla como una consigna escolar, el grupo la convirtió en una pregunta capaz de guiar cada pista.`;
  const choice = language === "en"
    ? `Two routes were now possible. Before choosing, everyone described what they could see, what they still did not know, and what risk each path might bring. ${lore.refrain}`
    : `Ahora había dos rutas posibles. Antes de elegir, todos describieron qué podían ver, qué todavía ignoraban y qué riesgo podía traer cada camino. ${lore.refrain}`;
  return [opening, lore.setting, depth[0], depth[1], learning, depth[2], depth[3], depth[4], lore.tension, depth[5], choice].join("\n\n");
}

function routeText(story: StoryPublic, route: LocalizedWorldScript["routes"][number], lore: NarrativeLore, language: StoryLanguage): string {
  const hero = story.input.mainCharacter?.trim() || (language === "en" ? "the explorer" : "el explorador");
  const depth = routeDepth(hero, route, lore, language);
  const pause = language === "en"
    ? `${hero} paused and asked the others to explain their ideas. The first answer sounded convincing, but the group found one detail that did not fit and decided to investigate before moving on.`
    : `${hero} hizo una pausa y pidió a los demás que explicaran sus ideas. La primera respuesta parecía convincente, pero el grupo encontró un detalle que no encajaba y decidió investigar antes de avanzar.`;
  const evidence = language === "en"
    ? `They returned to the original problem—${story.input.educationalObjective.toLowerCase()}—and tested it against what they had just discovered. A useful answer needed to explain both the clue and its consequence.`
    : `Volvieron al problema original —${story.input.educationalObjective.toLowerCase()}— y lo compararon con lo que acababan de descubrir. Una respuesta útil debía explicar tanto la pista como su consecuencia.`;
  const decision = language === "en"
    ? `A new choice appeared, but this time it was more difficult: both options could work, although they valued different things. The team would have to predict what might happen next.`
    : `Apareció una nueva decisión, pero esta vez era más difícil: las dos opciones podían funcionar, aunque valoraban cosas distintas. El equipo tendría que anticipar qué podía ocurrir después.`;
  return [route.text, depth[0], lore.investigation, depth[1], pause, depth[2], depth[3], evidence, depth[4], depth[5], decision].join("\n\n");
}

function endingText(story: StoryPublic, route: LocalizedWorldScript["routes"][number], ending: LocalizedWorldScript["routes"][number]["endings"][number], lore: NarrativeLore, language: StoryLanguage): string {
  const hero = story.input.mainCharacter?.trim() || (language === "en" ? "the explorer" : "el explorador");
  const depth = endingDepth(hero, route, ending, language);
  const consequences = language === "en"
    ? `The result was not an accident. First the group chose to ${route.label.toLowerCase()}; later it decided to ${ending.label.toLowerCase()}. The second decision was possible because of what they had learned from the first.`
    : `El resultado no fue casual. Primero el grupo decidió ${route.label.toLowerCase()}; después eligió ${ending.label.toLowerCase()}. La segunda decisión fue posible gracias a lo aprendido en la primera.`;
  const reflection = language === "en"
    ? `Before leaving, each traveler named one clue that had changed their mind. Together they explained how the journey helped them practice this goal: ${story.input.educationalObjective}.`
    : `Antes de partir, cada viajero nombró una pista que le había hecho cambiar de idea. Entre todos explicaron cómo el recorrido los ayudó a practicar este objetivo: ${story.input.educationalObjective}.`;
  const close = language === "en"
    ? `${lore.refrain} The path remained open, ready for a reader who might choose differently and discover another meaningful ending.`
    : `${lore.refrain} El camino quedó abierto, esperando a otro lector que eligiera de manera diferente y descubriera un final nuevo, pero igualmente coherente.`;
  return [ending.text, depth[0], depth[1], consequences, depth[2], lore.resolution, depth[3], depth[4], reflection, depth[5], close].join("\n\n");
}

export function adventureFromApi(story: StoryPublic): InteractiveAdventure | null {
  const apiAdventure = story.adventure ?? null;
  if (!apiAdventure || apiAdventure.scenes.length === 0) return null;
  const { language, worldId } = apiAdventure;
  let endingCount = 0;
  const scenes: InteractiveScene[] = apiAdventure.scenes.map((scene) => {
    const eyebrow = scene.ending
      ? language === "en"
        ? `Ending ${++endingCount} of 4`
        : `Final ${++endingCount} de 4`
      : scene.id === "opening"
        ? language === "en"
          ? "Chapter 1 · The discovery"
          : "Capítulo 1 · El descubrimiento"
        : language === "en"
          ? "Chapter 2 · Your route"
          : "Capítulo 2 · Tu camino";
    return {
      id: scene.id,
      eyebrow,
      title: cleanStoryTitle(scene.title),
      text: scene.pages.map((page) => page.text).join("\n\n"),
      sensoryCue: scene.pages[0]?.sensoryCue ?? "",
      choices: scene.choices,
      ending: scene.ending,
      checkpoint: scene.checkpoint,
    };
  });
  return {
    id: `${worldId}-${language}-api`,
    language,
    worldId,
    image: sceneImages[worldId],
    title: cleanStoryTitle(apiAdventure.title),
    startSceneId: "opening",
    scenes,
  };
}

export function cleanStoryTitle(title: string): string {
  const withoutFallback = title.split(
    /\s*[·•]\s*(?:final alternativo|alternative ending)\b/iu,
  )[0]!;
  const cleaned = withoutFallback
    .replace(
      /^(?:escena\s*\d+|apertura|ruta\s*[ab12]|final\s*[ab0-9-]+)\s*[:\-–—]\s*/iu,
      "",
    )
    .replace(/[<>]/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
  return cleaned || (title.trim() ? title.trim().slice(0, 80) : "Un nuevo capítulo");
}

export function buildInteractiveAdventure(story: StoryPublic): InteractiveAdventure {
  const language = story.input.language ?? "es";
  const worldId = resolveStoryWorld(story.input.theme);
  const script = scripts[worldId][language];
  const lore = narrativeLore[worldId][language];
  const scenes: InteractiveScene[] = [{ id: "opening", eyebrow: language === "en" ? "Chapter 1 · The discovery" : "Capítulo 1 · El descubrimiento", title: script.openingTitle, text: openingText(story, script, lore, language), sensoryCue: script.sensory, ending: false, checkpoint: openingCheckpoint(script, language), choices: script.routes.map((route, routeIndex) => ({ id: `route-${routeIndex}`, label: route.label, consequence: route.consequence, nextSceneId: `route-${routeIndex}` })) }];

  script.routes.forEach((route, routeIndex) => {
    scenes.push({ id: `route-${routeIndex}`, eyebrow: language === "en" ? "Chapter 2 · Your route" : "Capítulo 2 · Tu camino", title: route.title, text: routeText(story, route, lore, language), sensoryCue: route.sensory, ending: false, checkpoint: routeCheckpoint(route, routeIndex, language), choices: route.endings.map((ending, endingIndex) => ({ id: `ending-${routeIndex}-${endingIndex}`, label: ending.label, consequence: ending.consequence, nextSceneId: `ending-${routeIndex}-${endingIndex}` })) });
    route.endings.forEach((ending, endingIndex) => scenes.push({ id: `ending-${routeIndex}-${endingIndex}`, eyebrow: language === "en" ? `Ending ${routeIndex * 2 + endingIndex + 1} of 4` : `Final ${routeIndex * 2 + endingIndex + 1} de 4`, title: ending.title, text: endingText(story, route, ending, lore, language), sensoryCue: language === "en" ? "Your decisions are now part of this story." : "Tus decisiones ya son parte de este cuento.", ending: true, checkpoint: null, choices: [] }));
  });

  return { id: `${worldId}-${language}`, language, worldId, image: sceneImages[worldId], title: script.title, startSceneId: "opening", scenes };
}

const journeyKey = (storyId: string) => `story-teacher:journey:${storyId}`;

export function saveJourney(journey: StoredJourney): void {
  sessionStorage.setItem(journeyKey(journey.storyId), JSON.stringify(journey));
}

export function loadJourney(storyId: string): StoredJourney | null {
  try {
    const raw = sessionStorage.getItem(journeyKey(storyId));
    if (!raw) return null;
    const journey = JSON.parse(raw) as Partial<StoredJourney>;
    if (!journey.storyId || !journey.adventureTitle || !journey.language || !journey.endingTitle || !journey.endingText || !journey.completedAt) return null;
    return {
      ...journey,
      storyId: journey.storyId,
      adventureTitle: journey.adventureTitle,
      language: journey.language,
      decisions: Array.isArray(journey.decisions) ? journey.decisions : [],
      endingTitle: journey.endingTitle,
      endingText: journey.endingText,
      checkpointStars: typeof journey.checkpointStars === "number" ? journey.checkpointStars : 0,
      checkpointResults: Array.isArray(journey.checkpointResults) ? journey.checkpointResults : [],
      completedAt: journey.completedAt,
    };
  } catch {
    return null;
  }
}

export function clearJourney(storyId: string): void {
  sessionStorage.removeItem(journeyKey(storyId));
}
