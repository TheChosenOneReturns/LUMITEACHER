# Producto y alcance del MVP

## 1. Resumen ejecutivo

**Story Teacher** convierte intereses infantiles en práctica guiada de comprensión lectora. Un estudiante elige parámetros sencillos; la aplicación genera un cuento apropiado para su edad y luego evalúa cinco habilidades mediante una pregunta por habilidad.

La propuesta para el hackathon no es “un generador de cuentos” aislado. El valor está en el ciclo educativo completo:

```text
interés personal → cuento apropiado → lectura → evaluación → explicación → progreso
```

Fecha de inicio: **21/07/2026**. Al contar hoy como día 1, el quinto día es el **25/07/2026**.

## 2. Problema

- Los ejercicios genéricos de comprensión suelen tener baja conexión con los intereses del estudiante.
- Crear material personalizado y preguntas consistentes consume tiempo docente.
- Un cuento entretenido no garantiza que se practiquen habilidades lectoras concretas.
- Una salida de IA sin validación puede ser inadecuada, incoherente o imposible de corregir automáticamente.

## 3. Hipótesis

Si un estudiante puede elegir el tema y protagonista de una historia apropiada para su edad, aumentará su disposición a leer; si después recibe cinco preguntas con explicación, la actividad se convierte en una experiencia de aprendizaje observable y repetible.

## 4. Usuarios

### Usuario principal: estudiante

- Edad objetivo: 6 a 12 años.
- Lee de forma autónoma o con acompañamiento.
- Necesita texto legible, instrucciones cortas, botones grandes y feedback amable.
- No necesita conocer conceptos técnicos como “inferencia”; Lumi los traduce a lenguaje sencillo.

### Usuario secundario: docente o adulto acompañante

- Configura el objetivo educativo o ayuda al estudiante a elegirlo.
- Quiere comprobar que las preguntas cubren habilidades distintas.
- Dispone de un portal separado para cursos, misiones, seguimiento por habilidad y postales.

### Perfiles de demostración

- Estudiantes: Sofía, Mateo y Valentina.
- Adulto: Lucía, con etiqueta visual Profesor/a o Familia.
- No se guarda nombre completo, correo, fecha de nacimiento ni información escolar real.

## 5. Propuesta de valor

> Cuentos que parten de lo que a cada niño le interesa y terminan mostrando lo que comprendió.

El diferenciador demostrable es la conexión entre personalización y evaluación estructurada: cada historia produce exactamente una pregunta de cada una de las cinco habilidades.

## 6. Objetivos del hackathon

1. Completar el recorrido principal de punta a punta desde una URL pública.
2. Generar contenido en español apropiado para edades de 6 a 12 años.
3. Garantizar una estructura JSON válida antes de guardar o mostrar el contenido.
4. Evitar contenido violento, sexual, discriminatorio, insultante o impropio para menores.
5. Guardar historias e intentos para que la biblioteca sea real, no una maqueta.
6. Poder ejecutar una demo estable aun si Bedrock falla durante la presentación.

## 7. Alcance priorizado

### Debe estar (P0)

- Perfil/login simulado.
- Landing con llamada a crear historia.
- Dashboard o biblioteca de historias del perfil demo.
- Configurador con edad, tema, dificultad, objetivo educativo, extensión y protagonista opcional.
- Estado de generación con mensajes de Lumi.
- Generación con Bedrock y validación del resultado.
- Pantalla de lectura.
- Cuestionario de cinco preguntas, una por vez.
- Envío del intento y corrección en backend.
- Resultado total, feedback y resultado por habilidad.
- Persistencia en DynamoDB.
- Cursos, membresías, invitaciones por enlace/QR y misiones.
- Dashboard adulto, ficha de progreso, postales moderadas y recompensas.
- Manejo de carga, error, contenido bloqueado y reintento.
- Diseño responsive básico para 375 px y desktop.
- Despliegue reproducible con AWS SAM y frontend público.

### Conviene tener (P1)

- Filtros de biblioteca por tema.
- Lectura en voz alta usando Web Speech API del navegador, con selección de voces en español o inglés, pausa y detención.
- Historias interactivas con dos decisiones, cuatro finales seguros e historial del recorrido integrado al quiz.
- Un cuento de ejemplo precargado.
- Animaciones discretas y celebración accesible.
- Botón para repetir el cuestionario.

### Fuera del MVP (P2/post-hackathon)

- Login real, Amazon Cognito y cuentas múltiples.
- Chat libre con Lumi.
- Generación de imágenes por historia en tiempo de ejecución.
- Monedas, ranking o economía intercambiable.
- Recomendaciones adaptativas avanzadas.
- Edición colaborativa, compartir públicamente o moderación humana.
- Analítica educativa longitudinal fuera de los intentos guardados.
- Aplicación móvil nativa.

## 8. Configuración de una historia

| Campo | Tipo | Reglas MVP | Ejemplo |
|---|---|---|---|
| `age` | entero | 6–12 | `8` |
| `theme` | texto/preset | 2–60 caracteres | `Exploración espacial` |
| `difficulty` | enum | `facil`, `media`, `desafio` | `media` |
| `educationalObjective` | texto | 5–160 caracteres | `Reconocer la importancia de cooperar` |
| `maxWords` | entero/preset | 150, 300, 500, 800 o 1200 | `800` |
| `mainCharacter` | texto opcional | máximo 60 caracteres | `Luna, una gata astronauta` |

Mapeo visible de extensión:

- Corta: máximo 150 palabras.
- Media: máximo 300 palabras.
- Larga: máximo 500 palabras.

## 9. Recorrido funcional

### 9.1 Entrada

- La landing explica en una frase qué hace el producto.
- `Crear mi historia` entra al configurador.
- `Explorar historias` entra a la biblioteca del perfil demo.
- No se pide información personal.

### 9.2 Configuración

- Los valores tienen una selección inicial válida para reducir fricción.
- El objetivo educativo es obligatorio y debe verse como un campo principal.
- Al tocar `Crear aventura`, el frontend valida antes de llamar a la API.
- Un segundo toque no genera duplicados: el botón queda deshabilitado mientras carga.

### 9.3 Generación

- La interfaz informa que Lumi está preparando el cuento.
- Meta de experiencia: respuesta en menos de 20 segundos; límite de interfaz: 30 segundos.
- Si el contenido se bloquea, se muestra un mensaje neutro y se conservan los campos.
- Si hay un error técnico, se ofrece reintentar.

### 9.4 Lectura

- Se muestra título, cuento y tema visual, sin exponer respuestas correctas.
- El texto usa al menos 18 px, interlineado cercano a 1.5 y ancho de línea limitado.
- `Comenzar desafío` se habilita de inmediato; no se intenta medir si el niño realmente terminó de leer.

### 9.5 Cuestionario

- Se presenta una pregunta por pantalla y cuatro opciones grandes.
- La selección puede cambiarse antes de avanzar.
- El progreso visible va de 1/5 a 5/5.
- Las respuestas se envían juntas al final para que el backend haga la corrección.
- Hasta finalizar, el cliente no recibe `correctAnswer` ni `explanation`.

### 9.6 Resultado

- Puntaje: cantidad correcta y porcentaje total.
- Cada habilidad muestra `Logrado` o `A practicar` en un intento individual.
- Los porcentajes por habilidad sólo se muestran cuando existan varios intentos agregados.
- Se muestran explicaciones breves de las respuestas.
- Acciones: `Crear otra aventura` y `Ver biblioteca`.

## 10. Reglas educativas

La respuesta de IA contiene exactamente cinco preguntas en este orden:

1. `literal`: información expresada directamente.
2. `inference`: conclusión apoyada por pistas del cuento.
3. `vocabulary`: significado de una palabra o expresión dentro del contexto.
4. `sequence`: orden de acontecimientos.
5. `cause_effect`: relación causal entre hechos.

Cada pregunta debe:

- poder responderse sólo con el cuento;
- tener una única opción claramente correcta;
- incluir cuatro opciones plausibles y distintas;
- evitar ambigüedad, dobles negaciones y “todas las anteriores”;
- usar vocabulario compatible con la edad y dificultad;
- tener una explicación que cite la evidencia del cuento sin inventar hechos.

## 11. Criterios de aceptación P0

### Crear cuento

```gherkin
Dado el perfil demo y un formulario válido
Cuando la persona crea una aventura
Entonces recibe un cuento que no supera la extensión elegida
Y la historia queda guardada
Y contiene exactamente cinco preguntas válidas
Y cada habilidad aparece exactamente una vez
```

### Contenido inválido o bloqueado

```gherkin
Dado un tema que activa las protecciones de contenido
Cuando se intenta crear una aventura
Entonces no se guarda contenido parcial
Y se muestra un mensaje apropiado para menores
Y el usuario puede modificar el tema y reintentar
```

### Corrección

```gherkin
Dado un cuento guardado y cinco respuestas
Cuando se envía el intento
Entonces el puntaje se calcula en el backend
Y se devuelve una explicación por pregunta
Y el intento queda asociado al perfil y al cuento
```

### Biblioteca

```gherkin
Dado que el perfil creó al menos un cuento
Cuando abre la biblioteca
Entonces ve los cuentos del más reciente al más antiguo
Y puede abrir cualquiera por su identificador
```

## 12. Métricas de éxito del hackathon

- 10 de 10 ejecuciones de prueba producen JSON válido o un error controlado.
- 100% de historias de prueba contienen cinco habilidades únicas.
- 0 respuestas correctas expuestas antes de enviar el intento.
- Recorrido completo sin intervención técnica en menos de 3 minutos.
- Pantallas P0 utilizables a 375 px y 1280 px.
- Despliegue desde cero documentado y repetible.

## 13. Decisiones que no deben reabrirse durante los cinco días

- Se usa AWS SAM, no se implementan SAM y Serverless Framework en paralelo.
- Se usa HTTP API, no REST API, mientras no aparezca un requisito incompatible.
- Se usa una tabla DynamoDB.
- El login es una simulación explícita.
- No se generan imágenes.
- No hay chat libre con Lumi.
- El producto y navegación visible quedan íntegramente en español.
