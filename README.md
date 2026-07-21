# Story Teacher

Story Teacher es una aplicación educativa para niñas y niños de 6 a 12 años. Genera cuentos personalizados con Amazon Bedrock y, al terminar la lectura, presenta exactamente cinco preguntas de opción múltiple para evaluar comprensión literal, inferencia, vocabulario en contexto, orden de acontecimientos y causa/consecuencia.

Este repositorio contiene actualmente las referencias visuales exportadas desde Google Stitch y la documentación ejecutable del MVP para el hackathon de cinco días, del **martes 21 al sábado 25 de julio de 2026**.

## Decisiones cerradas para el MVP

- Producto visible: **Story Teacher**.
- Mascota y guía: **Lumi**.
- Público: estudiantes de **6 a 12 años**.
- Idioma del MVP: español.
- Frontend: React, TypeScript, Vite y Tailwind CSS.
- Backend: Node.js y TypeScript sobre AWS Lambda.
- API: Amazon API Gateway **HTTP API**.
- Persistencia: Amazon DynamoDB, una tabla.
- IA: Amazon Bedrock con un modelo Amazon Nova de bajo costo.
- Login: perfil simulado `demo-sofia`; no representa autenticación real.
- Infraestructura: AWS SAM.
- Hosting recomendado: AWS Amplify Hosting.
- El MVP no genera ilustraciones con IA: usa fondos, íconos y arte temático estático autorizado.

## Recorrido principal

1. La persona entra con el perfil de demostración.
2. Selecciona edad, tema, dificultad, objetivo educativo, extensión y protagonista opcional.
3. Bedrock devuelve un cuento y cinco preguntas validadas.
4. El cuento se guarda en DynamoDB.
5. El estudiante lee y responde las cinco preguntas.
6. El backend corrige, explica y guarda el intento.
7. La pantalla de resultados muestra puntaje total y desempeño por habilidad.

## Documentación

| Documento | Propósito |
|---|---|
| [Producto y alcance](docs/01_PRODUCTO_MVP.md) | Problema, usuarios, alcance, recorrido y criterios de aceptación |
| [Arquitectura, API y datos](docs/02_ARQUITECTURA_API_DATOS.md) | Componentes AWS, endpoints, DynamoDB, errores y observabilidad |
| [IA y seguridad](docs/03_IA_SEGURIDAD.md) | Prompt, esquema de salida, validación, moderación y privacidad infantil |
| [UX/UI](docs/04_UX_UI.md) | Auditoría de Stitch, sistema visual, estados y responsive |
| [AWS: capa gratuita y costos](docs/05_AWS_COSTOS.md) | Elegibilidad, límites, presupuesto y controles de gasto |
| [Plan de cinco días](docs/06_PLAN_5_DIAS.md) | Cronograma fechado, responsables sugeridos y Definition of Done |
| [Demo y pitch](docs/07_DEMO_PITCH.md) | Guion, datos de demo, métricas y contingencias |
| [Flujo con Kiro](docs/08_KIRO_WORKFLOW.md) | Instalación, tareas acotadas, hooks, privacidad y uso de créditos |
| [Contrato interno de IA](contracts/story-generation.schema.json) | JSON Schema de la respuesta cruda de Bedrock |
| [Contrato HTTP](contracts/openapi.yaml) | Especificación OpenAPI del MVP |
| [Prompt v1](prompts/story-v1.txt) | Prompt versionado listo para interpolar en backend |
| [Ejemplo válido](contracts/story-generation.example.json) | Fixture completo con las cinco habilidades |

## Arranque local

Requisitos: Node.js 22 o superior y Docker Desktop iniciado.

```powershell
npm install
npm run local
```

El comando crea la tabla `StoryTeacherLocal`, inicia la API local en
`http://127.0.0.1:3000` y Vite en `http://localhost:5173`. El generador
predeterminado usa el fixture validado; no necesita una cuenta AWS ni genera
costos. Para detener la base, ejecutar `npm run db:down`.

Cada tarea realizada con Kiro debe terminar con:

```powershell
npm run verify
```

## Variables y despliegue

- `STORY_GENERATOR_MODE=fixture|bedrock` selecciona el generador.
- `DYNAMODB_ENDPOINT=http://127.0.0.1:8000` se usa únicamente en local.
- `VITE_API_URL` apunta a la URL pública de API Gateway en Amplify.
- `BEDROCK_MODEL_ID` identifica el modelo o inference profile configurado.
- `BEDROCK_GUARDRAIL_ID` y `BEDROCK_GUARDRAIL_VERSION` activan moderación.

No se deben versionar credenciales ni archivos `.env`. Para desplegar, configurar
AWS CLI y SAM CLI y ejecutar `npm run sam:validate`, `npm run sam:build` y
`sam deploy --guided`. El primer despliegue debe conservar el modo `fixture`;
Bedrock se activa después de probar Nova y Guardrails. Amplify usa `amplify.yml`
y debe recibir `VITE_API_URL` y la redirección SPA `/* /index.html 200`.

## Estructura implementada

```text
.
├── frontend/                 # React + TypeScript + Tailwind
├── backend/                  # Lambdas, dominio y adaptadores AWS
├── contracts/                # JSON Schema y OpenAPI
├── prompts/                  # Prompts versionados de Bedrock
├── docs/                     # Plan y decisiones del producto
├── template.yaml             # Infraestructura AWS SAM
└── stitch_story_teacher_ai_platform/ # Referencias visuales originales
```

## Principio de entrega

La demo se considera completa cuando una persona puede crear un cuento, leerlo, responder las cinco preguntas, ver el resultado y encontrar el cuento en su biblioteca desde una URL pública. Elementos como chat libre con Lumi, imágenes generadas, rachas, monedas, logros, portal de padres y autenticación real quedan explícitamente fuera del MVP.
