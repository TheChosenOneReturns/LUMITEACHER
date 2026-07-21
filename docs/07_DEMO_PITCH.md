# Demo y pitch del hackathon

## 1. Mensaje central

> Story Teacher convierte lo que a un niño le interesa en una aventura de lectura y convierte esa aventura en evidencia concreta de comprensión.

No presentar el proyecto como “le pedimos un cuento a una IA”. Mostrar el ciclo completo y el control educativo.

## 2. Guion de tres minutos

### 0:00–0:25 — problema

“A muchos chicos les cuesta engancharse con ejercicios de lectura genéricos, y crear material personalizado con buenas preguntas lleva tiempo. Story Teacher une interés, lectura y evaluación en una sola experiencia segura.”

### 0:25–0:50 — configuración

Abrir `Crear historia` y usar:

- edad: 8;
- tema: espacio;
- dificultad: media;
- objetivo: `Comprender por qué colaborar ayuda a resolver problemas`;
- extensión: corta o media;
- protagonista: `Luna, una gata astronauta`.

Explicar: “No sólo elegimos un tema. También fijamos edad, dificultad, objetivo y longitud.”

### 0:50–1:25 — IA y lectura

Mientras genera:

“Una Lambda valida los datos, aplica Bedrock Guardrails, invoca Amazon Nova y verifica el JSON. Si faltan preguntas, se repite una habilidad o el cuento excede la longitud, no llega al niño.”

Mostrar título y dos párrafos. Evitar leer todo.

### 1:25–2:05 — desafío

Mostrar rápidamente que hay cinco preguntas y mencionar las habilidades. Responder dos en vivo y usar respuestas ya preparadas para terminar sin demoras.

Frase: “La clave no llega al navegador hasta que enviamos el intento; la corrección se hace en el backend.”

### 2:05–2:35 — resultado y persistencia

Mostrar puntaje, `Logrado/A practicar`, una explicación y luego biblioteca.

“Cada cuento e intento queda guardado en DynamoDB, por lo que no es una maqueta. Hoy mostramos un perfil simulado; la arquitectura está preparada para incorporar autenticación real.”

### 2:35–3:00 — arquitectura e impacto

“React y Tailwind forman la experiencia; API Gateway y Lambda ejecutan el backend; DynamoDB conserva el aprendizaje y Bedrock genera contenido protegido. Es serverless, desplegable con SAM y puede empezar a costo muy bajo. En cinco días priorizamos un ciclo educativo completo y seguro.”

Cerrar con el mensaje central.

## 3. Datos de demo

Preparar tres historias válidas en la biblioteca:

1. `Luna y la estrella perdida` — espacio, edad 8, cooperación.
2. `El secreto del arrecife` — océano, edad 10, cuidado ambiental.
3. `El puente de hojas` — selva, edad 6, reconocer emociones.

La historia generada en vivo debe ser corta o media. “Larga” se muestra, pero no se usa en el pitch por latencia.

## 4. Planes de contingencia

### Plan A — todo funciona

Generación real, quiz real, resultado y biblioteca.

### Plan B — Bedrock tarda o falla

- Mostrar el mensaje de error bien diseñado.
- Decir: “La aplicación falla de forma controlada y no guarda contenido parcial”.
- Abrir una de las historias precargadas y continuar el flujo.

### Plan C — AWS o internet no responde

- Reproducir el video corto del recorrido.
- Mostrar localmente el diagrama y documentación.
- No perder tiempo reintentando frente al jurado.

## 5. Video de respaldo

Grabar el día 5, luego del freeze:

- 60–90 segundos;
- 1080p;
- sin notificaciones ni datos de cuenta AWS;
- mostrar configuración, carga, lectura, una pregunta, resultado y biblioteca;
- guardar copia local y otra accesible al equipo.

## 6. Preguntas esperables del jurado

### “¿Cómo garantizan que sea seguro para niños?”

Respuesta: límites de entrada, prompt infantil cerrado, Guardrails en entrada/salida, validación estructural, reglas semánticas, sin chat libre, sin publicación y sin datos personales. Aclarar que un producto real requeriría revisión legal y controles parentales adicionales.

### “¿Cómo saben que las preguntas son buenas?”

Respuesta: se exige exactamente una pregunta por habilidad, se valida estructura e índice, se prueba una matriz de edades/temas y la explicación debe apoyarse sólo en el cuento. La siguiente etapa incluye evaluación docente sistemática.

### “¿Por qué DynamoDB?”

Respuesta: patrón de acceso simple por usuario, contenido autocontenido, escala serverless, baja operación y buen encaje con Lambda. Una tabla resuelve historias e intentos sin joins.

### “¿Por qué Bedrock?”

Respuesta: acceso administrado a modelos, integración IAM, Guardrails y posibilidad de cambiar de modelo sin modificar la experiencia del producto.

### “¿Es gratis?”

Respuesta: Lambda y DynamoDB tienen franquicias amplias; una cuenta nueva puede tener créditos para API/hosting/Bedrock. Bedrock y Guardrails son por uso, por eso hay límites, budgets y un modelo económico. No afirmar costo cero.

### “¿Qué pasa si la IA devuelve JSON malo?”

Respuesta: nunca se guarda directamente. Se parsea, valida contra schema, se aplican reglas como cinco skills únicas y extensión, y se hace un solo intento de reparación. Si vuelve a fallar, el usuario recibe un error controlado.

### “¿Por qué login simulado?”

Respuesta: el objetivo de cinco días es validar la experiencia educativa y el pipeline seguro. El perfil demo está rotulado y no almacena PII; Cognito es la siguiente capa antes de un piloto real.

## 7. Evidencia para mostrar en el repositorio

- arquitectura Mermaid;
- OpenAPI;
- JSON Schema;
- prompt versionado;
- matriz/test de IA;
- infraestructura SAM;
- tests del DTO público y corrección;
- capturas responsive;
- URL pública y video.

## 8. Métricas futuras

No inventar impacto. Distinguir métricas de producto y aprendizaje:

- tasa de historias que llegan al final del quiz;
- tiempo de lectura;
- repetición voluntaria;
- errores de generación/bloqueos;
- mejora por habilidad en varios intentos;
- evaluación cualitativa de docentes y estudiantes.

El resultado de una pregunta por habilidad en una sola historia no demuestra dominio; sólo ofrece una señal inicial.

## 9. Frases que conviene evitar

- “La IA garantiza contenido perfecto”.
- “Cumplimos COPPA/GDPR” sin revisión legal.
- “Es totalmente gratis”.
- “Medimos comprensión con precisión” a partir de cinco preguntas.
- “El login es seguro” cuando es simulado.
- “Los porcentajes muestran progreso” si provienen de un solo intento.

## 10. Cierre sugerido

> Hoy Lumi no reemplaza a un docente: le da al estudiante una razón personal para leer y convierte cada cuento en una oportunidad concreta para comprender mejor.

