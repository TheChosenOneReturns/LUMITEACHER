# Cursos, seguimiento y recompensas locales

## Objetivo

Este hito amplía Story Teacher desde un lector individual a una experiencia acompañada. Un adulto crea cursos y misiones; estudiantes se incorporan por invitación, completan historias y reciben una devolución académica separada de sus recompensas motivacionales.

## Roles y permisos

| Acción | Estudiante | Adulto propietario |
|---|:---:|:---:|
| Crear cuento libre | Sí | No |
| Asociar cuento libre a un curso propio | Sí | No |
| Crear curso y misión | No | Sí |
| Aceptar invitación | Sí | No |
| Leer historias del curso | Sí | Sí |
| Ver dashboard e historial de respuestas | No | Sí |
| Enviar felicitación | No | Sí |
| Ver y elegir recompensas propias | Sí | No |

El backend verifica rol, propiedad y membresía. `X-Demo-User-Id` sólo identifica un perfil sembrado y no reemplaza una autenticación real.

## Modelo de tabla única

La tabla conserva las claves `PK/SK` y usa estas entidades:

- `USER`: perfil y proyección para el selector demo.
- `COURSE`: metadatos del curso.
- `MEMBERSHIP`: proyecciones bidireccionales usuario→curso y curso→usuario.
- `INVITE`: invitación canónica y proyección por curso.
- `MISSION`: misión dentro del curso y referencia a la historia.
- `STORY`: contenido canónico, clave de respuestas y proyecciones de acceso.
- `ATTEMPT`: historial completo por usuario e intento.
- `ACTIVITY`: eventos de apertura, inicio y finalización.
- `REWARD_STATE`: estrellas, dominio por mundo, inventario de cartas, personajes, insignias y accesorios.
- `REWARD_GRANT`: concesión asociada al primer intento recompensado.
- `CONGRATULATION`: postal recibida por un estudiante.

Un marcador `COMPLETION#storyId` evita repetir estrellas y un marcador `MASTERY#storyId` permite que un reintento alcance el 60% y avance el mundo una sola vez. La corrección persiste todos los reintentos, pero el dashboard calcula las métricas actuales con el intento más reciente por estudiante e historia.

## Invitaciones

1. El propietario genera un token aleatorio con vencimiento de siete días.
2. La interfaz construye `/unirse/:token`, ofrece copiar y genera un QR local.
3. Un perfil estudiante acepta la invitación.
4. El backend escribe ambas membresías con claves deterministas; repetir la operación devuelve el mismo resultado.
5. Revocar marca la invitación y evita nuevas uniones.

No hay correo ni servicio externo de QR.

## Seguimiento

Se almacenan sólo eventos de producto explícitos:

- `story_opened`
- `quiz_started`
- `attempt_completed`

No se mide tiempo de permanencia ni comportamiento invasivo. El dashboard consulta cada 15 segundos y también ofrece actualización manual.

## Recompensas

En el primer intento de una historia:

- estrellas: `5 + respuestas correctas`;
- insignias: primer cuento, puntaje perfecto, cinco cuentos, tres días y dominio por habilidad;
- accesorios: 10, 25, 45 y 70 estrellas.

El primer intento que alcance 60%, incluso si es un reintento, domina el cuento y avanza uno de cuatro hitos del mundo temático. Cada hito descubre una carta, suma una carga consumible y los hitos 2–4 desbloquean un personaje. Tras completar un mundo, nuevas historias dominadas recargan sus cuatro cartas en rotación sin ampliar los 24 hitos del atlas.

Los seis mundos son Órbita Curiosa, Reino de los Porqués, Arrecife de Pistas, Selva de las Voces, Ciudad de Inventos y Portal de Historias. El álbum permanente conserva 24 cartas aunque sus cargas lleguen a cero; 18 personajes se suman a los seis iniciales.

Cada sesión de minijuego admite una carta compatible. `POST /me/rewards/cards/{cardId}/consume` descuenta la carga atómicamente y registra `CARD_USE#sessionId`, por lo que repetir la petición es idempotente. Las ayudas nunca cambian quizzes ni métricas académicas. Una postal tampoco cambia puntajes ni recompensas.

### Identidad, vestidor y desafíos

El acceso local permite crear perfiles infantiles propios, además de usar los perfiles sembrados. Cada niño elige nombre, edad, tema favorito y un personaje entre animales o niños con distintas apariencias. El personaje se compone con SVG, por lo que la ropa y los accesorios obtenidos pueden superponerse sin generar una imagen diferente por combinación.

El perfil funciona como estudio personal: permite editar identidad, cambiar de personaje y equipar los looks desbloqueados. El identificador de sesión se guarda en el navegador, mientras que el perfil y su progreso permanecen en DynamoDB Local.

Los minijuegos recompensan comprensión y razonamiento, no velocidad de clic:

- `Detectives del cuento`: inferencia, vocabulario en contexto y causa-consecuencia sobre microhistorias.
- `Conexiones secretas`: asociación semántica entre conceptos y pistas.
- `El taller de la historia`: reconstrucción de una secuencia narrativa causal.
- `Laberinto de decisiones`: planificación de rutas a partir de pistas y consecuencias.
- `Teatro de emociones`: lectura de gestos, pensamientos implícitos e intenciones.
- `Fábrica de palabras`: construcción morfológica y vocabulario en contexto.
- `Mural de evidencias`: conexión explícita entre pruebas e hipótesis.
- `Máquina de causas`: armado de cadenas de causa, puente y consecuencia.
- `Prisma de perspectivas`: comparación de narradores y conocimientos previos.
- `Expedición de pistas`: orientación espacial, reglas y planificación de recorridos.

Los nueve juegos posteriores a Detectives se desbloquean progresivamente con estrellas. El catálogo contiene 24 poderes diferentes: ninguna carta repite efecto, cada una tiene una función visual y cognitiva específica y sólo aparece en juegos compatibles. Los desafíos explican las decisiones para mantener el objetivo educativo incluso fuera del quiz principal.

Cada partida recibe una semilla nueva y ofrece tres dificultades. `Explorador` reduce cantidad de distractores, muestra más señales y permite mayor margen de error; `Aventurero` usa el equilibrio estándar; `Maestro` amplía casos, parejas, escenas, piezas, pruebas y obstáculos. Los bancos de contenido, el orden de opciones, los tableros, los expedientes y las rutas se recombinan al volver a jugar. La dificultad nunca se implementa con cronómetros: se incrementa la profundidad cognitiva, no la presión por velocidad.

## Moderación de postales

Las plantillas y mensajes libres comparten un límite de 160 caracteres. El moderador local rechaza contenido sexual, violento, discriminatorio o insultante, además de correos, teléfonos y enlaces. Un mensaje rechazado no se escribe en DynamoDB.

## Generador de historias

El modo `fixture` elige entre seis historias validadas según tema, edad, dificultad y extensión. La matriz automática ejecuta 15 escenarios, incluidos texto de inyección y HTML. El DTO público nunca incluye `correctAnswer` ni `explanation`.

El adaptador Bedrock conserva Nova 2 Lite, Converse, temperatura 0.2, Guardrails, validación Zod y un único reintento de reparación. Activarlo requiere cuenta y facturación AWS; este hito no realiza llamadas reales.

## Estudio narrativo e historias ramificadas

- `Crear cuento` funciona como un estudio en cuatro pasos con ilustración y resumen actualizados en vivo.
- El modo interactivo presenta dos decisiones consecutivas y cuatro finales alternativos por mundo; el clásico mantiene lectura continua.
- Los seis mundos cuentan con una ilustración panorámica original y una aventura localizada en español e inglés.
- La narración utiliza `SpeechSynthesis` del navegador con ritmo 0.86, pausa, reanudación, detención y elección de voz compatible.
- Las decisiones se conservan durante la sesión, aparecen antes de las cinco preguntas y se resumen nuevamente junto al resultado académico.
- El quiz continúa calificando exclusivamente comprensión literal, inferencia, vocabulario, secuencia y causa/consecuencia; las elecciones narrativas no se califican como correctas o incorrectas.

## Validación de aceptación

Desde una tabla vacía:

1. ejecutar `npm run local:fresh`;
2. entrar como Lucía, abrir el curso y generar una invitación;
3. salir, entrar como Valentina desde el enlace y unirse;
4. abrir una misión, completar el quiz y revisar las recompensas;
5. volver como Lucía, actualizar el dashboard, abrir la ficha y enviar una postal;
6. volver como Valentina y comprobar la postal;
7. ejecutar `npm run verify`.

El recorrido completo también está automatizado en `e2e/course-reward-flow.spec.ts`. `npm run test:e2e` reinicia de forma explícita sólo `StoryTeacherLocal`, levanta o reutiliza los servidores locales y ejecuta la prueba en Chrome.
