# Implementación actual de IA

Este documento describe el comportamiento ejecutable del apartado de IA de
Story Teacher. La fuente de verdad es el código que llega a Lambda, no los
archivos de diseño aislados.

## 1. Respuesta corta: dónde está el system prompt

El prompt que utiliza la aplicación en producción se construye en:

- `backend/src/generators/prompt.ts`
  - `buildStoryPrompt`: cuentos clásicos.
  - `buildRepairPrompt`: segundo intento de cuentos clásicos.
  - `buildFlatInteractiveStoryPrompt`: aventuras interactivas actuales.
- `backend/src/generators/bedrockStoryGenerator.ts`
  - selecciona el constructor correspondiente;
  - configura el modelo, temperatura, tokens, Guardrail y herramienta;
  - envía la solicitud a Amazon Bedrock.

Actualmente no se usa el campo `system` de la API Converse. Todo el texto de
instrucciones se envía dentro de:

```ts
messages: [
  {
    role: "user",
    content: [{ text: prompt }],
  },
]
```

Por lo tanto, cuando en el proyecto se habla de “system prompt”, se está
hablando del conjunto de instrucciones de `prompt.ts`, pero técnicamente
Bedrock las recibe como un mensaje de usuario.

Los archivos siguientes son especificaciones editoriales y documentación, pero
el runtime no los carga:

- `prompts/story-v1.txt`
- `prompts/story-interactive-v2.txt`

Editar solamente uno de esos `.txt` no modifica la aplicación desplegada.

## 2. Fuentes de verdad

| Responsabilidad | Fuente ejecutable |
| --- | --- |
| Prompt clásico | `backend/src/generators/prompt.ts` → `buildStoryPrompt` |
| Prompt interactivo | `backend/src/generators/prompt.ts` → `buildFlatInteractiveStoryPrompt` |
| Solicitud Converse | `backend/src/generators/bedrockStoryGenerator.ts` |
| Entrada permitida | `packages/shared/src/index.ts` → `storyInputSchema` |
| Salida clásica | `packages/shared/src/index.ts` → `generatedStorySchema` |
| Salida interactiva final | `packages/shared/src/index.ts` → `generatedInteractiveStorySchema` |
| Salida plana de la herramienta | `backend/src/generators/bedrockStoryGenerator.ts` → `flatInteractiveStorySchema` |
| Modelo y Guardrail | `backend/src/config.ts`, `template.yaml`, `samconfig.toml` |
| Persistencia | `backend/src/services/storyService.ts` y repositorios DynamoDB |
| Estado asíncrono | `backend/src/generation/` |
| Consumo desde React | `frontend/src/api/client.ts` |

Los JSON Schema de `contracts/` son útiles como contrato y documentación, pero
la validación que efectivamente decide si una respuesta se acepta está
implementada con Zod.

## 3. Configuración actual

### Producción desplegada

Configuración verificada contra CloudFormation y las Lambdas desplegadas el
26 de julio de 2026:

```text
Región: us-east-2
Modo: bedrock
Modelo: us.anthropic.claude-sonnet-4-5-20250929-v1:0
Guardrail: fbqdxds2765e
Versión del Guardrail: 2
Límite: 20 generaciones por usuario y día
```

El ID del modelo es un inference profile de Bedrock. Lambda no contiene claves
AWS: recibe permisos temporales mediante su rol IAM.

### Resolución de configuración

`backend/src/config.ts` traduce variables de entorno a `AppConfig`:

| Variable | Uso |
| --- | --- |
| `STORY_GENERATOR_MODE` | `fixture` o `bedrock` |
| `BEDROCK_MODEL_ID` | modelo o inference profile |
| `BEDROCK_GUARDRAIL_ID` | Guardrail opcional |
| `BEDROCK_GUARDRAIL_VERSION` | versión del Guardrail |
| `AWS_REGION` | región de Bedrock y DynamoDB |
| `MAX_GENERATIONS_PER_USER_PER_DAY` | cuota diaria |
| `GENERATION_WORKER_FUNCTION_NAME` | Lambda asíncrona |
| `AUTH_MODE` | autenticación demo o Cognito |
| `SESSION_IP_POLICY` | `off`, `observe` o `strict` |

Si no existe `BEDROCK_MODEL_ID`, el código usa Claude Sonnet 4.5 como valor por
defecto.

### Diferencia entre aventuras libres y misiones

Los dos recorridos usan el mismo pipeline asíncrono y el mismo modelo:

1. un estudiante usa `POST /stories` para crear una aventura libre;
2. el dueño adulto de un curso usa el mismo endpoint con `courseId` para crear
   una vista previa privada de misión;
3. ambos casos crean un `GENERATION_JOB` y son procesados por
   `GenerationWorkerFunction`;
4. la misión sólo se vuelve visible para el curso cuando el adulto confirma la
   vista previa mediante `POST /courses/{courseId}/missions`.

`PlatformFunction` ya no invoca Bedrock ni conserva permisos
`bedrock:InvokeModel`. Su responsabilidad es validar que el job completado, el
cuento, el identificador de misión y el curso pertenezcan al mismo adulto, y
guardar el registro publicado.

## 4. Datos que recibe la IA

El navegador nunca manda un prompt libre directamente a Bedrock. Envía un
objeto validado por `storyInputSchema`:

```json
{
  "age": 8,
  "theme": "Espacio",
  "difficulty": "media",
  "educationalObjective": "Comprender por qué colaborar ayuda a resolver problemas",
  "maxWords": 800,
  "mainCharacter": "Lumi",
  "storyMode": "interactive",
  "language": "es"
}
```

Restricciones:

| Campo | Restricción |
| --- | --- |
| `age` | entero de 6 a 12 |
| `theme` | 2 a 60 caracteres |
| `difficulty` | valor del catálogo compartido |
| `educationalObjective` | 5 a 160 caracteres |
| `maxWords` | 150, 300, 500, 800 o 1200 |
| `mainCharacter` | hasta 60 caracteres, nulo u omitido |
| `storyMode` | `classic` o `interactive` |
| `language` | `es` o `en` |

El backend serializa este objeto con `JSON.stringify` dentro de las etiquetas
`<student_input>`. El prompt declara explícitamente que esos datos no son
instrucciones. Esto reduce el riesgo de prompt injection, aunque no reemplaza
los demás controles.

## 5. Flujo de una aventura libre

```mermaid
sequenceDiagram
    participant UI as React / Amplify
    participant API as API Gateway
    participant Create as CreateStoryFunction
    participant DB as DynamoDB
    participant Worker as GenerationWorkerFunction
    participant BR as Bedrock + Guardrail

    UI->>API: POST /stories + JWT + Idempotency-Key
    API->>Create: Evento autorizado
    Create->>Create: Valida sesión, perfil e input
    Create->>DB: Crea job pending
    Create-->>Worker: Invoke Event asíncrono
    Create-->>UI: 202 {generationId, status: pending}
    Worker->>DB: Verifica idempotencia y cuota diaria
    Worker->>BR: Converse
    BR-->>Worker: Texto JSON o toolUse
    Worker->>Worker: Zod + reglas semánticas
    alt salida inválida
        Worker->>BR: Un único intento de reparación
        BR-->>Worker: Respuesta completa corregida
    end
    Worker->>DB: Guarda historia y marca job completed
    loop cada 2,5 segundos
        UI->>API: GET /generations/{generationId}
        API-->>UI: pending, completed o failed
    end
```

### 5.1 Autenticación y autorización

Antes de iniciar la IA:

1. API Gateway valida el JWT de Cognito.
2. `requireUser` obtiene `sub`, `origin_jti`/`jti` y expiración.
3. `SessionIpGuard` compara huellas HMAC de IP y user-agent según la política.
4. Se valida el perfil; sólo un perfil de estudiante puede crear aventuras
   libres.
5. Si hay `courseId`, se comprueba la membresía.

Ni la IP ni el user-agent sin procesar se guardan. Se conservan huellas HMAC
ligadas al identificador de sesión.

### 5.2 Idempotencia

El frontend genera `Idempotency-Key` con `crypto.randomUUID()`.

El backend calcula:

```text
generationId = primeros 32 hex de SHA-256(userId + NUL + idempotencyKey)
```

El job se inserta condicionalmente. Repetir exactamente la misma solicitud con
la misma clave no vuelve a iniciar Bedrock.

`StoryService` realiza una segunda defensa consultando la historia por
`idempotencyKey` antes de consumir una cuota.

### 5.3 Trabajo asíncrono

`CreateStoryFunction` invoca `GenerationWorkerFunction` con
`InvocationType.Event`. API Gateway no espera los varios minutos que puede
necesitar una aventura interactiva.

El job tiene tres estados:

- `pending`;
- `completed`, con `storyId`;
- `failed`, con código y mensaje seguro.

Los jobs vencen en DynamoDB después de 24 horas mediante `ttl`.

### 5.4 Polling del frontend

`frontend/src/api/client.ts` consulta el estado cada 2,5 segundos, hasta 132
veces. El tiempo máximo del cliente es aproximadamente 330 segundos.

Cuando el job termina:

- `completed`: valida la historia pública y navega a su lectura;
- `failed`: convierte el error del job en `ApiClientError`;
- todavía `pending` después del límite: muestra `GENERATION_TIMEOUT`.

El porcentaje y los cuatro mensajes animados de la pantalla de creación son una
estimación visual. No representan fases informadas por Bedrock.

## 6. Flujo de una misión de curso

La misión tiene dos estados separados: borrador generado y publicación.

```text
POST /stories + courseId + Idempotency-Key
  → CreateStoryFunction
  → verifica que el usuario sea dueño del curso
  → crea GENERATION_JOB pending con source=mission y missionId
  → invoca GenerationWorkerFunction de forma asíncrona
  → Bedrock genera y StoryService guarda el cuento
  → GET /generations/{generationId} devuelve la vista previa

POST /courses/{courseId}/missions + generationId
  → PlatformFunction
  → vuelve a verificar dueño, curso, source y missionId
  → guarda misión
  → responde 201
```

Mientras sólo exista el cuento de preview, `listMissions` no lo devuelve. El
repositorio también exige que exista una misión activa antes de permitir que un
miembro estudiante abra un cuento cuyo `source` sea `mission`. El autor adulto
sí puede leerlo para previsualizarlo.

La publicación es idempotente: el sort key se deriva de `createdAt` y
`missionId`. Repetir la confirmación del mismo job devuelve la misma misión y no
vuelve a invocar IA.

## 7. Selección del generador

`backend/src/container.ts` crea una implementación de `StoryGenerator`:

- `FixtureStoryGenerator` si `STORY_GENERATOR_MODE=fixture`;
- `BedrockStoryGenerator` si `STORY_GENERATOR_MODE=bedrock`.

El dominio no conoce el proveedor. `StoryService` llama:

- `generator.generate(input)` para lectura clásica;
- `generator.generateInteractive(input)` para aventura interactiva, cuando el
  generador implementa ese método.

El fixture actual sólo implementa `generate`. Por eso el modo local no reproduce
todo el árbol interactivo real de Bedrock; puede caer al formato clásico.

## 8. Generación clásica

### 8.1 Prompt efectivo

`buildStoryPrompt` incluye:

- rol de autor infantil y pedagógico;
- idioma y adecuación a edad;
- reglas de seguridad;
- sección `NIVEL DEL LECTOR` con bandas etarias 6-7, 8-9 y 10-12 calibradas
  con el marco pedagógico (Piaget para el techo cognitivo, Chall para la
  etapa lectora): longitud de oración, vocabulario, recursos narrativos
  permitidos y nivel de exigencia de cada habilidad del quiz;
- modulación por dificultad (piso, centro o techo de la banda) y un
  recordatorio de zona de desarrollo próximo (1 o 2 elementos de
  estiramiento andamiables);
- límite total de palabras;
- objetivo educativo integrado en la acción;
- cinco habilidades obligatorias y ordenadas;
- cuatro opciones por pregunta con distractores plausibles y homogéneos;
- una única respuesta correcta, no deducible por longitud ni posición;
- prohibición de Markdown y texto fuera del JSON;
- delimitación de la entrada como datos no confiables.

La misma sección `NIVEL DEL LECTOR` se inyecta en los prompts interactivos
(`buildFlatInteractiveStoryPrompt` y `buildInteractiveStoryPrompt`), más una
regla de calibración de las decisiones ramificadas según la banda.

### 8.2 Solicitud a Bedrock

```text
API: Bedrock Runtime Converse
maxTokens: 2500
temperature inicial: 0.2
timeout del cliente: 120 segundos (intento + reparación caben en los 300 s
del worker; los 11 s originales pertenecían al flujo síncrono de API Gateway)
Guardrail: configurado en la solicitud, si existe ID y versión
```

La respuesta esperada es texto JSON:

```json
{
  "title": "Título",
  "story": "Relato completo",
  "questions": [
    {
      "statement": "Pregunta",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "skill": "literal",
      "explanation": "Justificación"
    }
  ]
}
```

El backend tolera bloques Markdown delimitados por triple acento grave, con o
sin la etiqueta `json`, pero no texto adicional.

### 8.3 Validación y reparación

La salida pasa por:

1. `JSON.parse`;
2. `generatedStorySchema`;
3. verificación de cuatro opciones distintas;
4. exactamente cinco preguntas;
5. skills en orden:
   `literal`, `inference`, `vocabulary`, `sequence`, `cause_effect`;
6. preguntas no repetidas;
7. conteo real de palabras del cuento.

Si falla:

1. se construye `buildRepairPrompt`;
2. se agregan hasta los motivos de validación;
3. se vuelve a pedir el objeto completo;
4. la temperatura de reparación es `0`;
5. no existe un tercer intento.

## 9. Generación interactiva

La aventura interactiva utiliza un mecanismo distinto para reducir JSON roto y
referencias inventadas.

### 9.1 Prompt efectivo

`buildFlatInteractiveStoryPrompt` pide:

- un título narrativo;
- siete escenas en orden fijo;
- dos páginas por escena;
- seis decisiones en orden fijo;
- cinco preguntas;
- continuidad de personajes, pistas y reglas;
- decisiones razonables;
- cuatro finales diferentes;
- detalles sensoriales, acción y diálogo;
- reglas infantiles y de seguridad.

El modelo no genera IDs ni enlaces. Esa parte la controla el backend.

### 9.2 Tool use forzado

La solicitud Converse incluye una herramienta:

```text
Nombre: submit_interactive_story
toolChoice: obligatorio
strict: true para Claude Sonnet 4.5 y Claude Haiku 4.5
maxTokens: 8000
temperature: 0.3
timeout del cliente: 270 segundos
```

Bedrock debe responder mediante `toolUse.input`, no mediante texto libre.

El schema de la herramienta se deriva de Zod con `toJSONSchema`. Antes de
enviarlo a Bedrock se eliminan palabras de JSON Schema que no son compatibles
con todos los modelos:

```text
$schema, minLength, maxLength, pattern, minItems, maxItems,
minimum, maximum, multipleOf
```

Esas restricciones no se pierden como control: el backend las aplica después
de recibir el objeto.

### 9.3 Forma plana solicitada al modelo

```text
title
scenes[7]
  ├── title
  ├── pageOne { text, sensoryCue }
  └── pageTwo { text, sensoryCue }
choices[6]
  ├── label
  └── consequence
finalQuestions[5]
  ├── statement
  ├── optionA ... optionD
  ├── correctOption
  └── explanation
```

El orden tiene significado:

```text
scenes:
0 opening
1 routeA
2 endingA1
3 endingA2
4 routeB
5 endingB1
6 endingB2

choices:
0 openingA
1 openingB
2 routeA1
3 routeA2
4 routeB1
5 routeB2
```

### 9.4 Normalización determinista

`parseFlatInteractiveStory` transforma la salida:

- crea IDs estables como `route-1`, `ending-1-1` y
  `opening-page-1`;
- construye todos los `nextSceneId`;
- asigna las cinco skills por posición;
- usa preguntas existentes para crear checkpoints;
- limpia etiquetas técnicas de títulos;
- elige `worldId` desde `theme` con reglas del backend, no desde una decisión
  libre del modelo.

Así se evita el problema anterior de títulos como “Final alternativo -3” y de
enlaces rotos entre escenas.

### 9.5 Validaciones de calidad

Antes de aceptar la aventura:

- deben existir exactamente siete escenas planas;
- cada escena tiene dos páginas;
- deben existir seis decisiones;
- deben existir cinco preguntas;
- los siete títulos deben ser diferentes;
- se rechazan títulos vacíos o “Final alternativo”;
- ninguna página puede repetirse;
- se controla la longitud de cada página;
- la estructura final debe tener dos rutas y dos finales por ruta;
- todas las decisiones deben apuntar a destinos existentes;
- cada recorrido apertura → ruta → final debe respetar `maxWords`;
- las skills finales deben estar en el orden canónico.

El límite de palabras por página se adapta al total solicitado:

```text
maxWordsPerPage = min(110, max(20, floor(maxWords / 6) - 5))
minWordsPerPage = min(45, max(15, floor(maxWordsPerPage × 0.55)))
tolerancia máxima de validación = ceil(maxWordsPerPage × 1.25)
```

Si la salida estructurada falla, se realiza un solo segundo intento con los
motivos de rechazo. La temperatura continúa en `0.3`.

## 10. Guardrails y seguridad de contenido

Si están configurados `BEDROCK_GUARDRAIL_ID` y
`BEDROCK_GUARDRAIL_VERSION`, cada llamada Converse contiene:

```ts
guardrailConfig: {
  guardrailIdentifier,
  guardrailVersion,
  trace: "enabled",
}
```

Cuando Bedrock devuelve `stopReason = "guardrail_intervened"`, el backend genera
`CONTENT_BLOCKED` y muestra un mensaje seguro. No intenta reparar contenido
bloqueado.

La defensa está compuesta por varias capas:

1. límites y enums Zod sobre la entrada;
2. JWT Cognito y permisos por perfil/curso;
3. instrucciones anti-inyección y delimitadores en el prompt;
4. Bedrock Guardrails sobre entrada y salida;
5. tool use o JSON cerrado;
6. validación estructural y semántica del backend;
7. cuota diaria;
8. IAM de mínimo alcance para Lambda;
9. respuesta pública sin la clave del quiz final.

El prompt no debe considerarse una barrera de seguridad suficiente por sí solo.

## 11. Qué se guarda y qué se entrega

### Generation job

Durante un máximo aproximado de 24 horas se guarda:

- identificador;
- usuario;
- input completo;
- clave de idempotencia;
- contexto de curso/misión;
- estado;
- error seguro o `storyId`.

### Historia

La historia persistida contiene:

- input;
- cuento y aventura;
- preguntas completas, respuestas correctas y explicaciones;
- `modelId`;
- `promptVersion`;
- fecha, usuario e idempotencia;
- relación opcional con curso y misión.

No se guarda el prompt final concatenado ni la respuesta cruda de Bedrock.

### Respuesta pública

Para el quiz final, `toPublicStory` elimina `correctAnswer` y `explanation`.
Estos datos vuelven después de que el estudiante envía su intento.

En la estructura pública de aventuras, los checkpoints sí contienen actualmente
`correctAnswer` y `explanation`. Esto permite corregirlos en el cliente, pero
también significa que una persona puede ver esas respuestas en la respuesta de
red. Debe considerarse una deuda de seguridad/antitrampa.

## 12. Errores

| Código | Significado |
| --- | --- |
| `CONTENT_BLOCKED` | intervino el Guardrail |
| `GENERATION_TIMEOUT` | Bedrock excedió el timeout |
| `GENERATION_FAILED` | JSON, tool use, validación o proveedor falló |
| `GENERATION_LIMIT` | se agotó la cuota diaria |
| `GENERATION_NOT_FOUND` | el job no existe o no pertenece al usuario |
| `VALIDATION_ERROR` | entrada o identificador inválido |
| `UNAUTHORIZED` | JWT o contexto de sesión inválido |
| `FORBIDDEN` | el perfil no puede ejecutar esa operación |
| `INTERNAL_ERROR` | error de infraestructura no clasificado |

En generación asíncrona, `GET /generations/{id}` devuelve HTTP 200 con
`status: "failed"`. El frontend transforma ese estado en un `ApiClientError`
local con estado 502 para mostrar el mensaje.

## 13. Observabilidad

Eventos estructurados relevantes:

| Evento | Emisor | Contenido |
| --- | --- | --- |
| `generation.structured_repair` | generador | modelo y problemas de validación |
| `generation.validation_failed` | generador | modelo y hasta diez problemas |
| `generation.worker_failed` | worker | generationId, código y clase del error |
| `request.failed` | handlers HTTP | requestId, código, clase, mensaje acotado y AWS request ID |

No se registran deliberadamente prompts completos, historias completas ni
respuestas crudas del modelo.

API Gateway tiene access logs con retención de 30 días. `template.yaml` no
declara actualmente retención explícita para los grupos de logs automáticos de
Lambda.

Grupos principales:

```text
/aws/lambda/<stack>-CreateStoryFunction-...
/aws/lambda/<stack>-GenerationWorkerFunction-...
/aws/lambda/<stack>-GetGenerationFunction-...
/aws/lambda/<stack>-PlatformFunction-...
```

Para un fallo de creación libre, el primer lugar a revisar es
`GenerationWorkerFunction`. Si `POST /stories` devuelve 500 antes de crear un
job, se revisa `CreateStoryFunction`.

## 14. IAM e infraestructura

`GenerationWorkerFunction` tiene:

- 1024 MB;
- timeout de 300 segundos;
- lectura/escritura sobre la tabla DynamoDB;
- `bedrock:InvokeModel` sólo sobre los modelos/perfiles declarados;
- `bedrock:ApplyGuardrail` sólo si el stack recibe un Guardrail.

`CreateStoryFunction` no tiene permiso de Bedrock. Sólo escribe el job e invoca
el worker. Esta separación impide que una petición HTTP mantenga abierta la
generación interactiva.

API Gateway:

- valida Cognito;
- limita el tráfico a 25 solicitudes/segundo y burst 50;
- permite únicamente el origen de Amplify configurado;
- autoriza los headers `Authorization`, `Content-Type` e `Idempotency-Key`.

## 15. Pruebas

Pruebas principales:

```text
backend/src/generators/bedrockStoryGenerator.test.ts
packages/shared/src/index.test.ts
backend/src/services/storyService.test.ts
```

Cubren:

- JSON clásico válido;
- un único intento de reparación;
- fallo después de reparar;
- intervención del Guardrail;
- timeout;
- tool use interactivo;
- IDs y enlaces deterministas;
- rechazo de aventura estructurada inválida;
- límites de palabras y contratos públicos.

Comandos:

```bash
npm test --workspace backend -- --run src/generators/bedrockStoryGenerator.test.ts
npm test --workspace @story-teacher/shared
npm run typecheck --workspace backend
npm run sam:validate
sam build --no-cached --parallel
sam deploy
```

`backend/scripts/probe-bedrock.ts` permite una prueba directa del adaptador con
credenciales AWS válidas. Una prueba real consume tokens y puede generar costo.

## 16. Cómo cambiar el prompt correctamente

1. Editar la función efectiva en `backend/src/generators/prompt.ts`.
2. Actualizar la especificación equivalente dentro de `prompts/`.
3. Incrementar una versión de prompt real y diferenciada.
4. Agregar casos válidos, adversariales y de reparación.
5. Ejecutar tests y typecheck.
6. Ejecutar un smoke controlado con Bedrock.
7. Construir y desplegar el backend con SAM.
8. Confirmar en una historia guardada qué `modelId` y `promptVersion` produjo
   el resultado.

Hoy `promptVersion` está fijo como `story-v1`, incluso para aventuras
interactivas. Cambiar texto sin incrementar esa versión impide rastrear con
precisión qué instrucciones generaron una historia.

## 17. Cómo cambiar el modelo correctamente

1. Confirmar que el modelo está disponible en la región.
2. Confirmar acceso al modelo o inference profile en la cuenta.
3. Actualizar `BedrockModelId` en `samconfig.toml` o como parámetro de deploy.
4. Revisar los ARNs permitidos en `template.yaml`.
5. Verificar compatibilidad con Converse, tool use, tool choice y strict mode.
6. Ajustar tokens y timeout según latencia.
7. Probar respuestas clásicas e interactivas.
8. Ejecutar `sam build` y `sam deploy`.

Cambiar `.env.example` no cambia AWS. Cambiar `samconfig.toml` tampoco modifica
una función ya desplegada hasta ejecutar `sam deploy`.

## 18. Deudas técnicas conocidas

Estas observaciones describen el estado actual; no significan que el sistema
esté detenido.

1. No existe un `system` nativo: las reglas viajan como mensaje `user`.
2. Los `.txt` de `prompts/` no son cargados por el runtime y pueden divergir.
3. `promptVersion` no diferencia clásico de interactivo ni cambia con el
   contenido real.
4. El contrato interactivo documental y la herramienta plana ejecutable no son
   la misma estructura.
5. Los checkpoints públicos exponen respuestas y explicaciones.
6. El fixture local no reproduce la aventura interactiva completa.
7. `.env.example` y algunos documentos históricos todavía nombran Nova 2 Lite,
   mientras el despliegue principal usa Claude Sonnet 4.5.
8. La UI muestra fases estimadas; el backend sólo expone
   `pending/completed/failed`.
9. No hay una política explícita de retención para logs de Lambda en SAM.

## 19. Recomendación de consolidación

La evolución más segura es:

1. guardar prompts versionados como archivos;
2. cargarlos o empaquetarlos desde un único módulo;
3. separar `system` de los datos `user` en Converse;
4. usar versiones como `story-classic-v2` y `story-interactive-v3`;
5. generar el JSON Schema documental desde los mismos esquemas Zod;
6. ocultar respuestas de checkpoints hasta su envío;
7. guardar métricas de tokens, latencia, modelo, versión y resultado de
   validación sin registrar contenido infantil.
