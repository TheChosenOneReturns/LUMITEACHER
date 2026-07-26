# Story Teacher

Story Teacher es una plataforma local de lectura para niñas y niños de 6 a 12 años. Crea cuentos personalizados, evalúa cinco habilidades de comprensión y conecta a estudiantes con docentes o familias mediante cursos, misiones, seguimiento y felicitaciones.

El hito actual funciona en dos carriles. En local, React consume SAM/Node, DynamoDB Local persiste los datos y los fixtures permiten desarrollar sin costo. En AWS, Amplify Hosting consume API Gateway, Cognito protege las rutas, Lambda invoca Bedrock con Guardrails y DynamoDB guarda perfiles, sesiones seudónimas, historias e intentos.

## Qué incluye

- Dos tipos de perfil demo: `student` y `adult`. Profesor/a y familia comparten permisos adultos.
- Creador de perfiles infantiles propios con nombre, edad, tema favorito y avatares de animales o niños.
- Varios cursos por adulto y varias membresías por estudiante.
- Invitaciones reutilizables durante siete días por enlace y QR, revocables e idempotentes.
- Misiones creadas por adultos y cuentos libres que el estudiante puede asociar a un curso.
- Estudio narrativo visual con vista previa en vivo, modo clásico o interactivo, dos decisiones y cuatro finales por aventura.
- Narración pausada mediante las voces del dispositivo y contenido fixture completo en español o inglés.
- El recorrido elegido acompaña al quiz de cinco habilidades y vuelve a aparecer en el resultado.
- Registro de apertura, inicio de quiz e intentos completos.
- Dashboard de curso con actualización cada 15 segundos, promedio, completitud, habilidades y actividad.
- Historial completo por estudiante, incluyendo respuesta elegida, respuesta correcta y explicación.
- Postales moderadas de hasta 160 caracteres, sin impacto académico.
- Recompensas académicamente neutras: el primer intento entrega `5 + aciertos` estrellas y cualquier intento con 60% domina el cuento, avanza uno de los 24 hitos y entrega una carga de carta para minijuegos.
- Diez minijuegos cognitivos visuales y 24 poderes de carta únicos para entrenar inferencia, memoria, secuencia, planificación, emociones, vocabulario, evidencia, causalidad, perspectiva y orientación espacial.
- Partidas rejugables en niveles Explorador, Aventurero y Maestro: cada sesión reorganiza desafíos, respuestas, tableros, rutas y distractores sin depender de velocidad.
- Tres desafíos cognitivos de inferencia, vocabulario, asociación semántica y secuencia causal, con devolución explicada.
- Seis cuentos fixture y 15 escenarios automáticos para local; en AWS Bedrock/Nova genera cuentos clásicos e interactivos detrás de la misma interfaz validada.

## Arranque local

Requisitos: Node.js 22+, Docker Desktop y los puertos 5173, 3000 y 8000 disponibles.

```powershell
npm install
npm run local
```

`npm run local` inicia DynamoDB, crea `StoryTeacherLocal`, siembra datos de manera idempotente y levanta API + frontend:

- Web: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:3000`
- DynamoDB Local: `http://127.0.0.1:8000`

Para reconstruir exclusivamente la tabla local y volver a sembrarla:

```powershell
npm run local:fresh
```

Para detener DynamoDB:

```powershell
npm run db:down
```

## Perfiles y datos sembrados

| Perfil | Tipo | Estado inicial |
|---|---|---|
| Lucía | Adulto · Profesor/a | Dueña de Lectores del cuarto B |
| Sofía | Estudiante | Miembro, misión completada y recompensas |
| Mateo | Estudiante | Miembro, cuento libre e intento |
| Valentina | Estudiante | Disponible para probar una invitación |
| Luna | Estudiante | Demo `Todo desbloqueado`: 999 estrellas, 24 hitos, cartas, personajes y minijuegos |

También se pueden crear nuevos exploradores desde el login. En local, la sesión conserva solamente `story-teacher:demo-user-id`. En AWS, Cognito emite JWT breves y rotables guardados en `sessionStorage`; perfiles, cursos, membresías, historias, intentos, actividad, recompensas y postales viven en DynamoDB.

## Comandos

```powershell
npm run local          # base + seed + API + web
npm run local:fresh    # reinicio seguro de StoryTeacherLocal + entorno
npm run ai:test        # 15 escenarios del generador fixture
npm run test:e2e       # reinicia StoryTeacherLocal y ejecuta el recorrido Playwright
npm run verify         # typecheck + tests + builds
npm run sam:validate   # validación de infraestructura
npm run sam:build      # bundle de Lambdas
```

`npm run test:e2e` elimina únicamente la tabla local `StoryTeacherLocal`, vuelve a sembrarla y usa Chrome instalado para reproducir el flujo adulto → invitación → estudiante → misión → recompensa → postal.

## IA

`StoryGenerator` mantiene separados el dominio y el proveedor:

- `fixture`: modo local por defecto, determinista y gratuito.
- `bedrock`: modelo configurable mediante Converse. El despliegue actual usa Claude Sonnet 4.5 para aventuras libres, Guardrails de entrada/salida, validación Zod y un único intento de reparación.

El prompt efectivo se construye en `backend/src/generators/prompt.ts`. Los
archivos de `prompts/` son referencias editoriales y actualmente no se cargan
en runtime. La explicación completa está en
[Implementación actual de IA](docs/14_IA_IMPLEMENTACION_ACTUAL.md).

Variables relevantes:

- `STORY_GENERATOR_MODE=fixture|bedrock`
- `BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-5-20250929-v1:0`
- `BEDROCK_GUARDRAIL_ID`
- `BEDROCK_GUARDRAIL_VERSION`
- `DYNAMODB_ENDPOINT=http://127.0.0.1:8000` sólo en local
- `VITE_API_URL` para la URL desplegada de API Gateway
- `VITE_AUTH_MODE=demo|cognito`
- `VITE_COGNITO_USER_POOL_ID` y `VITE_COGNITO_USER_POOL_CLIENT_ID`
- `AUTH_MODE=demo|cognito`
- `SESSION_IP_POLICY=off|observe|strict`

No se deben versionar claves AWS ni archivos `.env` con secretos. Los créditos de Kiro aceleran desarrollo y revisión; no pagan llamadas de Bedrock.

## Contratos y documentación

- [Contrato OpenAPI](contracts/openapi.yaml)
- [JSON Schema de la IA](contracts/story-generation.schema.json)
- [Prompt Story v1 (referencia editorial)](prompts/story-v1.txt)
- [Contrato JSON de cuentos interactivos](contracts/interactive-story.schema.json)
- [Prompt de cuentos interactivos v2 (referencia editorial)](prompts/story-interactive-v2.txt)
- [Producto y alcance](docs/01_PRODUCTO_MVP.md)
- [Arquitectura, API y datos](docs/02_ARQUITECTURA_API_DATOS.md)
- [IA y seguridad](docs/03_IA_SEGURIDAD.md)
- [UX/UI](docs/04_UX_UI.md)
- [AWS y costos](docs/05_AWS_COSTOS.md)
- [Flujo con Kiro](docs/08_KIRO_WORKFLOW.md)
- [Cursos, seguimiento y recompensas locales](docs/09_CURSOS_RECOMPENSAS_LOCAL.md)
- [Arte generado para las 24 cartas](docs/10_ARTE_CARTAS_GENERADO.md)
- [Generación de cuentos interactivos con IA](docs/12_IA_CUENTOS_INTERACTIVOS.md)
- [AWS, Amplify, Cognito y sesiones](docs/13_AWS_AMPLIFY_COGNITO.md)
- [Implementación actual de IA: prompts, Bedrock, validación y operación](docs/14_IA_IMPLEMENTACION_ACTUAL.md)

## Arquitectura

```text
Amplify (React + Motion)
        │ HTTPS + JWT Cognito
API Gateway HTTP API
        │ authorizer + throttling
Lambda (Node + TypeScript)
        ├── StoryGenerator ── Amazon Bedrock + Guardrails
        └── tabla PK/SK ───── DynamoDB
```

SAM local conserva `X-Demo-User-Id` sólo para desarrollo. La infraestructura desplegada usa Cognito, API Gateway HTTP API, Lambda, Bedrock, CloudWatch Logs y DynamoDB. La IP se registra únicamente como huella HMAC de contexto y nunca sustituye la autenticación.
