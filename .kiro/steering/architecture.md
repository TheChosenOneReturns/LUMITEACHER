---
inclusion: auto
name: story-teacher-architecture
description: Apply when changing backend, API, DynamoDB, AWS SAM, Bedrock or shared types.
---

# Arquitectura y contratos

Fuentes canónicas:

- #[[file:docs/02_ARQUITECTURA_API_DATOS.md]]
- #[[file:docs/09_CURSOS_RECOMPENSAS_LOCAL.md]]
- #[[file:contracts/openapi.yaml]]
- #[[file:contracts/story-generation.schema.json]]
- #[[file:prompts/story-v1.txt]]

La clave de respuestas se guarda únicamente en backend. Nunca devolver `correctAnswer` o `explanation` antes de enviar el intento. Mantener una sola tabla DynamoDB, membresías bidireccionales, escrituras idempotentes y despliegue AWS SAM en `us-east-1`.
