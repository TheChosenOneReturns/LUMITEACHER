# Flujo de trabajo con Kiro

Kiro es un acelerador de ingeniería para este repositorio. Sus créditos cubren
las funciones de IA de Kiro, no las invocaciones ni el consumo de Amazon
Bedrock. La integración con Bedrock debe activarse solamente cuando la cuenta
AWS, los presupuestos y Guardrails estén listos.

## Primer inicio

1. Abrir Kiro IDE y seleccionar esta carpeta como workspace.
2. Iniciar sesión con la cuenta que recibió los bonus credits.
3. Revisar la configuración de privacidad y desactivar el uso del contenido
   para mejora del servicio si esa es la decisión del equipo.
4. Confirmar que Kiro detecta `.kiro/steering/` y el hook
   `.kiro/hooks/verify.json`.
5. Trabajar sobre una rama o tarea de Git por vez.

La CLI agente de Kiro es opcional. En Windows se instala con:

```powershell
irm 'https://cli.kiro.dev/install.ps1' | iex
kiro-cli --version
```

Después puede iniciarse con el agente versionado del proyecto:

```powershell
kiro-cli --agent story-teacher
```

## Fuentes canónicas

Kiro debe leer antes de modificar:

- `contracts/openapi.yaml` para el contrato HTTP;
- `contracts/story-generation.schema.json` para la salida de Bedrock;
- `prompts/story-v1.txt` para el prompt de producción;
- `packages/shared/src/index.ts` para los esquemas ejecutables;
- `docs/` para decisiones de producto, seguridad y UX;
- `.kiro/steering/` para reglas persistentes.

Si dos fuentes se contradicen, no se debe improvisar: primero se actualiza la
decisión y luego todos los contratos afectados.

## Secuencia de trabajo recomendada

Cada conversación de Kiro debe contener una sola tarea, sus archivos permitidos
y un criterio verificable. Ejemplo:

```text
Implementá únicamente el estado vacío de la biblioteca.
Podés modificar frontend/src/pages/HomePage.tsx, sus componentes y pruebas.
No cambies contratos ni backend. Conservá el diseño y los textos en español.
Terminá solo cuando npm run verify pase.
```

Orden sugerido para gastar los créditos:

1. componentes y pruebas responsive del frontend;
2. casos límite de validación y DTO público;
3. revisión de IAM, SAM y variables de despliegue;
4. accesibilidad, foco, errores y estados de carga;
5. revisión final de seguridad y código.

Reservar aproximadamente 15% para integración y errores de los últimos dos
días. Evitar pedir rediseños generales o explicaciones que ya están documentadas.

## Guardas de seguridad

- Nunca incluir credenciales, claves, cookies, `.env` ni datos personales.
- No permitir edición simultánea del mismo archivo por Kiro y otro agente.
- Revisar todo cambio de IAM, CORS, Guardrails y acceso a DynamoDB.
- Mantener `STORY_GENERATOR_MODE=fixture` hasta aprobar la cuenta AWS.
- No aceptar cambios si fallan tipos, pruebas o build.

El hook `story-teacher-verify-on-stop` ejecuta `npm run verify` al finalizar una
tarea en Kiro IDE. El agente CLI incorpora el mismo comando con un timeout de
tres minutos.

## Tareas listas para delegar

- Agregar pruebas de accesibilidad con axe sin cambiar el diseño.
- Revisar foco de teclado y anuncios `aria-live` en generación y errores.
- Agregar pruebas HTTP de validación para los cinco endpoints.
- Revisar el mínimo privilegio de `template.yaml`.
- Preparar el despliegue `fixture` y verificar CORS con el dominio de Amplify.
- Revisar el adaptador Bedrock con trazas seguras y sin registrar cuentos.

No delegar todavía autenticación real, generación de imágenes, chat libre,
portal de padres, monedas o logros: están fuera del MVP de cinco días.

## Referencias oficiales

- [Steering de Kiro](https://kiro.dev/docs/steering/)
- [Hooks de Kiro IDE](https://kiro.dev/docs/hooks/)
- [Agentes personalizados de Kiro CLI](https://kiro.dev/docs/cli/custom-agents/)
- [Protección de datos](https://kiro.dev/docs/privacy-and-security/data-protection/)
- [Precios y créditos](https://kiro.dev/pricing/)
