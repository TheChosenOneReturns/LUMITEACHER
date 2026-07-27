# AWS, Amplify, Cognito y sesiones

Para los comandos reproducibles de despliegue, diagnóstico, control de costos
y retiro de recursos consultar el
[runbook de operación AWS](15_AWS_RUNBOOK_OPERACIONES.md).

## Objetivo

El entorno desplegado usa una única ruta productiva:

```text
Amplify Hosting
  -> HTTPS + Authorization: Bearer <access token>
API Gateway HTTP API
  -> JWT authorizer de Cognito
Lambda
  -> Bedrock + Guardrails
  -> DynamoDB
```

Los fixtures y `X-Demo-User-Id` quedan limitados al entorno local. No son un
mecanismo de autenticación de producción.

## Autenticación

- Cognito User Pools administra registro, confirmación por correo, ingreso,
  revocación y renovación.
- El cliente web es público y no tiene `client secret`.
- Los access e ID tokens duran 15 minutos.
- El refresh token dura 7 días y rota con 10 segundos de gracia.
- El frontend conserva los tokens en `sessionStorage`, no en `localStorage`.
- API Gateway valida firma, issuer, audience y expiración antes de invocar las
  rutas privadas.
- El backend usa únicamente el claim estable `sub` como identificador de
  cuenta.
- El perfil educativo se crea en DynamoDB después del primer ingreso.
- Los correos de verificación y de recuperación de contraseña usan la plantilla
  `VerificationMessageTemplate` del `template.yaml`: asunto y cuerpo HTML en
  español con la marca LUMI. La imagen del encabezado se sirve desde el hosting
  de Amplify (`/email/lumi-mail.png`, archivo en `frontend/public/email/`).

Una dirección IP no identifica de forma confiable a una persona. Puede cambiar
al alternar Wi-Fi/datos móviles y puede compartirse mediante NAT. Por eso la IP
no reemplaza al JWT. `SESSION_IP_POLICY` agrega una segunda señal:

- `off`: no persiste contexto de red.
- `observe`: recomendado; registra una huella HMAC seudónima y advierte cambios.
- `strict`: rechaza la sesión si cambia la IP. Sólo conviene en una red
  administrada y estable.

DynamoDB nunca recibe la IP ni el user agent en claro. Guarda hashes ligados al
`origin_jti` de la sesión y los elimina mediante TTL al vencer el token.

## Contenido

En AWS, `StoryGeneratorMode=bedrock` obliga a que cuentos clásicos e
interactivos provengan de Amazon Bedrock. El frontend utiliza
`story.adventure`, validado por Zod y privado de respuestas correctas.

La aventura hardcodeada se conserva exclusivamente como fixture local y como
compatibilidad opcional. Amplify no define
`VITE_ALLOW_LOCAL_STORY_FALLBACK=true`, por lo que una historia productiva sin
payload Bedrock se rechaza en lugar de mostrar contenido simulado.

## Despliegue del backend

Requisitos: credenciales AWS válidas, SAM CLI y permisos para CloudFormation,
Lambda, API Gateway, Cognito, DynamoDB, CloudWatch Logs, IAM y Bedrock.

```powershell
sam validate --lint
sam build
sam deploy
```

`samconfig.toml` despliega en `us-east-2`, activa Bedrock, aplica el Guardrail
configurado, permite el origen actual de Amplify y usa observación de IP.

CloudFormation devuelve:

- `ApiUrl`
- `TableName`
- `UserPoolId`
- `UserPoolClientId`

La tabla usa capacidad on-demand, cifrado, TTL, point-in-time recovery y
políticas de retención para evitar borrados accidentales.

## Configuración de Amplify

En la rama `main` de Amplify deben existir estas variables:

```text
AMPLIFY_MONOREPO_APP_ROOT=frontend
VITE_API_URL=<ApiUrl de CloudFormation>
VITE_COGNITO_USER_POOL_ID=<UserPoolId>
VITE_COGNITO_USER_POOL_CLIENT_ID=<UserPoolClientId>
```

`VITE_AUTH_MODE=cognito` se fija en `amplify.yml`. Ninguna variable `VITE_*`
debe contener credenciales, claves privadas ni secretos: todo su contenido
queda visible en el bundle del navegador.

El build falla de forma intencional si falta alguno de los tres valores. El
archivo `customHttp.yml` agrega CSP, HSTS, anti-clickjacking, política de
referer y restricciones de permisos.

## SAM local

SAM local conserva la demo para poder trabajar sin cuentas Cognito:

```powershell
npm run db:up
npm run db:init
npm run db:seed
npm run sam:build
npm run api:sam
```

`env.local.json` fuerza:

```text
AUTH_MODE=demo
SESSION_IP_POLICY=off
STORY_GENERATOR_MODE=fixture
```

El API queda en `http://127.0.0.1:3000`. Para probar Bedrock real desde SAM,
se debe crear un archivo local ignorado por Git que cambie únicamente
`STORY_GENERATOR_MODE` y los identificadores de Guardrails; las credenciales
se obtienen de la cadena estándar de AWS y nunca se escriben en el repositorio.
