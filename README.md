# Story Teacher

Story Teacher es una plataforma local de lectura para niñas y niños de 6 a 12 años. Crea cuentos personalizados, evalúa cinco habilidades de comprensión y conecta a estudiantes con docentes o familias mediante cursos, misiones, seguimiento y felicitaciones.

El hito actual funciona de punta a punta sin credenciales AWS: React consume una API Node/TypeScript, DynamoDB Local persiste todos los datos y un catálogo de seis cuentos sustituye temporalmente a Amazon Bedrock.

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
- Seis cuentos fixture y 15 escenarios automáticos; Bedrock/Nova y Guardrails quedan listos detrás de la misma interfaz, sin invocaciones reales.

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

También se pueden crear nuevos exploradores desde el login. La sesión del navegador conserva solamente `story-teacher:demo-user-id`. Perfiles, cursos, membresías, historias, intentos, actividad, recompensas y postales viven en DynamoDB Local.

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
- `bedrock`: Amazon Nova 2 Lite mediante Converse, temperatura `0.2`, prompt versionado, Guardrails de entrada/salida, validación Zod y un reintento de reparación.

Variables relevantes:

- `STORY_GENERATOR_MODE=fixture|bedrock`
- `BEDROCK_MODEL_ID=us.amazon.nova-2-lite-v1:0`
- `BEDROCK_GUARDRAIL_ID`
- `BEDROCK_GUARDRAIL_VERSION`
- `DYNAMODB_ENDPOINT=http://127.0.0.1:8000` sólo en local
- `VITE_API_URL` para la URL desplegada de API Gateway

No se deben versionar claves AWS ni archivos `.env` con secretos. Los créditos de Kiro aceleran desarrollo y revisión; no pagan llamadas de Bedrock.

## Contratos y documentación

- [Contrato OpenAPI](contracts/openapi.yaml)
- [JSON Schema de la IA](contracts/story-generation.schema.json)
- [Prompt Story v1](prompts/story-v1.txt)
- [Contrato JSON de cuentos interactivos](contracts/interactive-story.schema.json)
- [Prompt de cuentos interactivos v2](prompts/story-interactive-v2.txt)
- [Producto y alcance](docs/01_PRODUCTO_MVP.md)
- [Arquitectura, API y datos](docs/02_ARQUITECTURA_API_DATOS.md)
- [IA y seguridad](docs/03_IA_SEGURIDAD.md)
- [UX/UI](docs/04_UX_UI.md)
- [AWS y costos](docs/05_AWS_COSTOS.md)
- [Flujo con Kiro](docs/08_KIRO_WORKFLOW.md)
- [Cursos, seguimiento y recompensas locales](docs/09_CURSOS_RECOMPENSAS_LOCAL.md)
- [Arte generado para las 24 cartas](docs/10_ARTE_CARTAS_GENERADO.md)
- [Generación de cuentos interactivos con IA](docs/12_IA_CUENTOS_INTERACTIVOS.md)

## Arquitectura

```text
frontend (React + Motion)
        │ HTTP + X-Demo-User-Id
backend (Node + TypeScript)
        ├── StoryGenerator ── Fixture / Amazon Bedrock
        └── tabla PK/SK ───── DynamoDB Local / DynamoDB
```

La infraestructura desplegable usa AWS SAM, API Gateway HTTP API, Lambda y una tabla DynamoDB. El login continúa siendo una simulación y no debe utilizarse como autenticación de producción.
