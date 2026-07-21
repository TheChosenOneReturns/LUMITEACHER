# Plan de entrega de cinco días

## 1. Fechas y regla de prioridad

| Día | Fecha | Objetivo |
|---:|---|---|
| 1 | martes 21/07/2026 | cerrar alcance y probar el mayor riesgo: Bedrock |
| 2 | miércoles 22/07/2026 | completar backend vertical y persistencia |
| 3 | jueves 23/07/2026 | completar recorrido frontend integrado |
| 4 | viernes 24/07/2026 | seguridad, pruebas, responsive y despliegue |
| 5 | sábado 25/07/2026 | congelar, ensayar y presentar |

Regla: si algo P1 amenaza una tarea P0, se elimina P1. Ningún efecto visual vale más que poder completar el recorrido.

## 2. Roles sugeridos

Si el equipo tiene cuatro personas:

- **Producto/UX:** alcance, copy, QA educativa y pitch.
- **Frontend:** React, Tailwind, responsive y estados.
- **Backend/IA:** Lambdas, Bedrock, validación y DynamoDB.
- **Cloud/QA:** SAM, despliegues, observabilidad, pruebas y demo.

Con menos personas, mantener estos frentes como “sombreros” y trabajar en este orden:

1. Backend/IA prueba de riesgo.
2. Contrato API.
3. Frontend vertical mínimo.
4. Persistencia y corrección.
5. Despliegue y QA.
6. Pulido visual.

## 3. Día 1 — martes 21/07: decisiones y prueba de riesgo

### Resultado del día

Bedrock genera en la cuenta real un cuento español con cinco preguntas parseables; repositorio y contratos quedan listos para que frontend y backend trabajen en paralelo.

### Primeras dos horas

- Confirmar fecha/hora exacta de entrega del sábado.
- Elegir un responsable que pueda acceder a Billing y Bedrock.
- Verificar saldo/plan Free Tier y crear budget de USD 1, 5 y 10.
- Seleccionar `us-east-1`.
- Abrir Bedrock, comprobar acceso a Nova 2 Lite y ejecutar el prompt v1 en Playground.
- Probar los temas `espacio`, `dragones` y un caso bloqueable.
- Registrar latencia y estructura, no sólo “se ve bien”.

Este checkpoint no se mueve al día 2: el acceso/modelo es el principal riesgo externo.

### Producto/UX

- Congelar P0/P1/P2 usando `01_PRODUCTO_MVP.md`.
- Confirmar Story Teacher como marca y Lumi como mascota.
- Unificar copy en español.
- Elegir tres temas de la demo.
- Definir mensajes de error y resultados.
- Revisar derechos de los activos de Stitch; marcar cuáles pueden incluirse.

### Frontend

- Crear Vite React TypeScript.
- Configurar Tailwind y tokens del sistema visual.
- Crear layout responsive, header y navegación mobile.
- Crear rutas vacías y mocks tipados desde OpenAPI.
- Implementar primero configurador + validación local.

### Backend/IA

- Crear proyecto TypeScript y handlers.
- Implementar schema Zod/JSON Schema.
- Probar prompt con el modelo real.
- Definir `GeneratedStoryInternal` y `StoryPublic`.
- Crear test de eliminación de `correctAnswer`/`explanation`.

### Cloud/QA

- Instalar/verificar AWS CLI y SAM CLI.
- Crear `template.yaml` mínimo con HTTP API, Lambda health y tabla.
- Desplegar `/health` a una stack `story-teacher-dev`.
- Configurar tags y retención de logs.

### Definition of Done del día

- [ ] `/health` desplegado devuelve 200.
- [ ] Bedrock real devuelve al menos 3 resultados.
- [ ] El contrato JSON parsea un resultado real.
- [ ] P0/P1/P2 no tiene dudas abiertas.
- [ ] Frontend inicia y muestra el configurador en mobile/desktop.
- [ ] Budget y región confirmados.

## 4. Día 2 — miércoles 22/07: backend vertical

### Resultado del día

Los endpoints reales permiten generar, guardar, listar, abrir y corregir una historia mediante curl/Postman/cliente HTTP.

### Backend/IA

- Implementar validación de entrada.
- Integrar Guardrail de entrada/salida.
- Implementar prompt `story-v1`.
- Parsear, validar y ejecutar un solo reintento de reparación.
- Guardar el item completo en DynamoDB.
- Crear DTO público sin clave.
- Implementar `GET /stories` y `GET /stories/{id}`.
- Implementar `POST /stories/{id}/attempts`.
- Agregar errores comunes y logs estructurados.

### Frontend

- Implementar landing, carga y biblioteca con mocks.
- Implementar pantalla de lectura.
- Implementar cuestionario local con datos mock.
- Implementar resultado local.
- Cubrir empty/loading/error en componentes principales.

### Producto/QA

- Crear matriz de 15 casos de IA.
- Revisar 10 generaciones manualmente.
- Confirmar que preguntas y explicaciones son correctas.
- Ajustar prompt una vez de forma versionada; evitar cambios informales continuos.

### Cloud

- Permisos IAM mínimos por función.
- CORS para localhost.
- Variables y outputs de stack.
- Smoke script o colección de requests.

### Definition of Done del día

- [ ] Recorrido de API completo con un cuento real.
- [ ] Un cuento se ve en DynamoDB y puede recuperarse.
- [ ] `GET story` no expone respuestas.
- [ ] Un intento de cinco respuestas se corrige en backend.
- [ ] Caso bloqueado y salida inválida tienen errores controlados.
- [ ] Pruebas unitarias del dominio pasan.

## 5. Día 3 — jueves 23/07: frontend integrado

### Resultado del día

Una persona completa el recorrido real desde el navegador local contra AWS.

### Frontend

- Conectar configurador a `POST /stories`.
- Manejar demora, timeout, bloqueo y reintento.
- Conectar biblioteca y lectura.
- Conectar envío del cuestionario.
- Mostrar resultado y explicaciones.
- Proteger refresh y rutas inexistentes.
- Persistir sólo el perfil demo en `localStorage`.
- Verificar 375 px, 768 px y 1280 px.

### Backend/Cloud

- Resolver bugs de contrato sin cambiar nombres arbitrariamente.
- Agregar idempotencia mínima y escrituras condicionales.
- Medir latencia con 150/300/500 palabras.
- Agregar límite de generaciones por usuario/día.
- Preparar tres historias semilla/backup.

### Producto/UX/QA

- Test moderado con una persona ajena al código.
- Observar si entiende qué configurar y cómo empezar el desafío.
- Revisar legibilidad y copy.
- Registrar bugs como P0/P1/P2.

### Definition of Done del día

- [ ] Flujo completo real desde navegador local.
- [ ] Refresh de lectura no pierde el cuento.
- [ ] Loading/error/blocked se ven correctamente.
- [ ] No hay claves de respuesta en Network antes de enviar.
- [ ] Mobile no tiene scroll horizontal ni contenido tapado.
- [ ] Tres historias backup guardadas como fixture autorizado.

## 6. Día 4 — viernes 24/07: endurecer y desplegar

### Resultado del día

La aplicación está en una URL pública estable, probada por otra persona y lista para congelar.

### Cloud

- Desplegar frontend en Amplify Hosting.
- Restringir CORS a localhost y URL pública.
- Ejecutar smoke tests contra producción demo.
- Confirmar alarmas/budget y costos observados.
- Documentar despliegue y rollback.

### Calidad técnica

- Unit tests del dominio y componentes críticos.
- Tests de integración con Bedrock simulado.
- Smoke real con Bedrock.
- Revisar logs sin payload sensible.
- Probar doble click, refresh, back/forward, offline y timeout.
- Probar títulos y opciones largas.

### Calidad educativa y seguridad

- Ejecutar matriz completa de IA.
- Probar prompt injection y contenido inapropiado.
- Revisar que el objetivo se refleje en el cuento.
- Confirmar cinco skills únicas.
- Confirmar que explicaciones coinciden con la clave.

### UX/accesibilidad

- Teclado, foco y labels.
- Contraste y reduced motion.
- 375, 390, 768, 1280 y 1440 px.
- Unificar idioma y marca.
- Sustituir cualquier activo remoto riesgoso.

### Definition of Done del día

- [ ] URL pública funciona en incógnito.
- [ ] 10 recorridos consecutivos terminan o fallan de forma controlada.
- [ ] No hay errores críticos en consola.
- [ ] Contenido bloqueado no se guarda.
- [ ] Costos y logs revisados.
- [ ] Guion de demo y contingencias preparados.

## 7. Día 5 — sábado 25/07: congelar y presentar

### Regla de congelamiento

No se agregan features. Sólo se corrigen defectos que bloquean la demo, comprometen seguridad o destruyen legibilidad.

### Mañana

- Crear tag/release `hackathon-demo`.
- Desplegar la versión congelada.
- Ejecutar smoke completo desde la red/dispositivo de presentación.
- Comprobar Bedrock, créditos y límites.
- Precargar el escenario de demo sin respuestas.
- Exportar/capturar un video de respaldo.

### Ensayo

- Ensayar guion de 3 minutos tres veces con cronómetro.
- Una persona opera; otra presenta si el equipo lo permite.
- Practicar rutas A/B/C de contingencia.
- Preparar respuestas a arquitectura, seguridad, costo e impacto.

### 30 minutos antes

- No desplegar.
- Verificar URL, batería, conexión y zoom.
- Abrir la app en la landing y una pestaña con el backup.
- Confirmar que el perfil demo y biblioteca estén limpios/ordenados.

### Definition of Done final

- [ ] URL pública y video backup disponibles.
- [ ] Recorrido P0 completo.
- [ ] Arquitectura explicable en 30 segundos.
- [ ] Costo y seguridad explicables con datos.
- [ ] Repositorio/documentación listos para evaluación.

## 8. Tablero mínimo

Columnas:

```text
Backlog → Hoy → En curso → Review → Hecho → Recortado
```

Cada issue debe tener:

- resultado observable;
- responsable;
- prioridad P0/P1/P2;
- criterio de aceptación;
- enlace a PR/commit si aplica.

Límite: una tarea en curso por persona. Bugs encontrados después del día 3 desplazan trabajo de pulido, no se acumulan encima.

## 9. Definition of Done del producto

Una historia está “hecha” cuando:

- funciona con API real;
- tiene estados de carga, éxito y error;
- está validada en backend;
- es usable en mobile y desktop;
- no expone datos privados de corrección;
- tiene al menos una prueba relevante;
- está desplegada, no sólo local;
- puede demostrarse sin explicación técnica adicional.

## 10. Orden de recorte si el tiempo se complica

1. Quitar animaciones y celebración.
2. Quitar filtros de biblioteca.
3. Quitar lectura en voz alta.
4. Reducir temas preset.
5. Convertir dashboard e inicio en una sola pantalla.
6. Limitar longitud máxima a 300–400 palabras si hay timeout.

Nunca recortar:

- validación de salida de IA;
- moderación infantil;
- corrección en backend;
- manejo de error;
- historia de respaldo;
- despliegue y ensayo.

## 11. Riesgos y mitigación

| Riesgo | Prob. | Impacto | Mitigación/trigger |
|---|---|---|---|
| Bedrock/modelo no habilitado | media | crítico | verificar en las primeras 2 h; tener modelo Nova alternativo |
| generación supera timeout | media | alto | medir día 1; limitar longitud si p95 >25 s |
| JSON inválido | media | alto | schema + reglas + un retry + fixture backup |
| contenido inapropiado | baja/media | crítico | Guardrails entrada/salida + prompt + pruebas adversariales |
| Stitch depende de imágenes remotas | alta | medio | usar activos locales autorizados/gradientes |
| equipo intenta construir gamificación | media | alto | P2 congelado y tablero de recortes |
| costo inesperado | baja | alto | budgets, rate limit, sin imágenes ni extras |
| demo sin internet | baja/media | crítico | video y cuento fixture ya cargado |
| respuestas visibles en cliente | media | alto | DTO público y corrección server-side |

