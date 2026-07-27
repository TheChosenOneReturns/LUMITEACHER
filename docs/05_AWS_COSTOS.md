# AWS: capa gratuita, costos y controles

Investigación realizada el **21/07/2026** sobre documentación oficial de AWS. Los precios, elegibilidad, regiones y modelos pueden cambiar; la consola de Billing de la cuenta del hackathon es la fuente definitiva.

> Estado operativo actualizado el **26/07/2026**. La arquitectura real está en
> `us-east-2`, usa DynamoDB `PAY_PER_REQUEST` con point-in-time recovery y
> Claude Sonnet 4.5 mediante un perfil de inferencia. Las decisiones históricas
> de 5 RCU/5 WCU, `us-east-1`, Nova y ausencia de PITR ya no describen el stack
> desplegado.

## 1. Respuesta corta

El stack puede operar con costo muy bajo durante el hackathon, pero **no debe prometerse costo cero**:

- Lambda y DynamoDB tienen franquicias mensuales amplias para un prototipo.
- API Gateway y Amplify pueden quedar cubiertos por la oferta/créditos de una cuenta nueva.
- Amazon Bedrock y sus Guardrails se cobran por uso; no tienen una franquicia permanente equivalente a Lambda. Los créditos promocionales pueden cubrirlos si la cuenta es elegible.
- AWS SAM no tiene precio propio, pero crea recursos que sí pueden facturar.

## 2. Cambio de AWS Free Tier

Para cuentas creadas después del 15/07/2025, AWS entrega USD 100 en créditos al registrarse y permite obtener hasta USD 100 adicionales mediante actividades. El plan gratuito dura hasta seis meses o hasta agotar los créditos, lo que ocurra primero. También existen más de 30 ofertas “always free”.

Fuentes oficiales:

- [AWS Free Tier para cuentas posteriores al 15/07/2025](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier.html)
- [Anuncio de hasta USD 200 en créditos](https://aws.amazon.com/about-aws/whats-new/2025/07/aws-free-tier-credits-month-free-plan/)
- [Preguntas frecuentes](https://aws.amazon.com/free/free-tier-faqs/)

No se suman automáticamente todos los beneficios publicados. Antes de desplegar:

1. abrir Billing → Free Tier;
2. comprobar fecha y tipo de plan de la cuenta;
3. comprobar saldo y vencimiento de créditos;
4. confirmar que Bedrock y el modelo elegido están habilitados;
5. crear alertas de presupuesto.

## 3. Servicio por servicio

| Servicio | Situación gratuita | Decisión para el MVP |
|---|---|---|
| React/TypeScript/Tailwind/Node | herramientas open source, sin cargo de licencia | usar |
| AWS SAM/CloudFormation | SAM no agrega cargo; recursos subyacentes sí | usar SAM |
| Lambda | la página de precios incluye 1 millón de requests y 400.000 GB-seg por mes | dentro del límite con holgura |
| API Gateway | elegible para créditos; la página también publica 1 millón de llamadas HTTP/REST mensuales para ofertas de nuevos clientes | usar HTTP API y verificar elegibilidad en Billing |
| DynamoDB Standard | el costo depende del modo, almacenamiento y protecciones activadas | `PAY_PER_REQUEST`, TTL, cifrado y PITR |
| Amazon Bedrock | pago por tokens según proveedor/modelo; créditos pueden aplicarse | Claude Sonnet 4.5 on-demand, máximo 20 generaciones por usuario/día |
| Bedrock Guardrails | pago por unidades de texto para filtros; word filters y regex figuran sin cargo | usar filtros necesarios y medir |
| Amplify Hosting | elegible para créditos; su página lista hasta 1.000 min de build, 5 GB almacenados y 15 GB de salida/mes en la oferta | hosting recomendado |
| CloudWatch y X-Ray | pueden facturar por ingestión, almacenamiento y trazas | access logs de API 30 días; falta fijar retención de logs Lambda |

Fuentes:

- [AWS Lambda Pricing](https://aws.amazon.com/lambda/pricing/)
- [Amazon API Gateway Pricing](https://aws.amazon.com/api-gateway/pricing/)
- [Amazon DynamoDB Pricing](https://aws.amazon.com/dynamodb/pricing/)
- [Amazon Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)
- [AWS Amplify Pricing](https://aws.amazon.com/amplify/pricing/)

## 4. Límites relevantes

### Lambda

La oferta mensual publicada incluye:

- 1.000.000 requests;
- 400.000 GB-segundos de cómputo.

Una demo con cientos de generaciones y funciones de 512–1024 MB queda normalmente muy por debajo. El costo de la inferencia de Bedrock se factura aparte del tiempo de Lambda.

### API Gateway

La página de precios publica para su free tier:

- 1 millón de llamadas REST;
- 1 millón de llamadas HTTP;
- límites separados para WebSocket.

El nuevo programa de cuentas posteriores al 15/07/2025 se basa principalmente en créditos y un plan de hasta seis meses. Por prudencia, el presupuesto considera API Gateway elegible para créditos y no asume que dos promociones se acumulen.

### DynamoDB

La oferta gratuita publicada para Standard provisionado incluye por región y cuenta pagadora:

- 25 WCU;
- 25 RCU;
- 25 GB de almacenamiento;
- 2,5 millones de lecturas de DynamoDB Streams.

El stack actual no usa capacidad provisionada. Utiliza `PAY_PER_REQUEST`,
habilita TTL y point-in-time recovery, y no habilita Streams, DAX ni tablas
globales. PITR agrega protección ante borrados o escrituras accidentales, pero
también es un componente facturable según el tamaño de la tabla.

### Amplify Hosting

La página de precios lista durante su oferta gratuita:

- 1.000 minutos de build por mes;
- 5 GB almacenados en CDN;
- 15 GB de transferencia de salida por mes;
- SSL público sin costo adicional.

El sitio será SPA estática, sin SSR, para evitar request/duration de SSR.

## 5. Bedrock no es “always free”

Bedrock cobra por tokens de entrada y salida y el valor depende del modelo, modalidad, región y tier. Para este caso:

- el despliegue actual usa
  `us.anthropic.claude-sonnet-4-5-20250929-v1:0`;
- usar on-demand estándar;
- no usar Provisioned Throughput;
- no usar imágenes, Knowledge Bases, Agents, Flows ni evaluación automática;
- limitar palabras, tokens y generaciones por usuario;
- registrar contadores de uso, nunca el contenido completo.

Una salida inválida puede provocar un único intento de reparación. Por eso una
acción de usuario puede generar hasta dos invocaciones de modelo y dos
aplicaciones del Guardrail.

Fórmula de estimación:

```text
costo_modelo =
  (tokens_entrada / 1.000.000 × precio_entrada_por_millón) +
  (tokens_salida / 1.000.000 × precio_salida_por_millón)
```

Antes de la prueba pública, copiar de la página de precios de Bedrock el valor vigente del modelo y región realmente configurados y completar una planilla simple con 100, 500 y 1.000 generaciones.

## 6. Costo de Guardrails

La página oficial consultada publica, entre otros:

- content filter de texto: USD 0,15 por 1.000 unidades de texto;
- denied topics: USD 0,15 por 1.000 unidades;
- sensitive information: USD 0,10 por 1.000 unidades;
- regex de información sensible: sin cargo;
- word filters: sin cargo.

Una unidad admite hasta 1.000 caracteres y se redondea hacia arriba. Ejemplo conservador por generación:

```text
entrada: 1 unidad
salida: 5 unidades
total content filter: 6 × 0,15 / 1.000 = USD 0,0009
500 generaciones: aproximadamente USD 0,45 sólo por content filter
```

Activar también `denied topics` duplica aproximadamente esa parte. No incluye el costo del modelo.

## 7. Presupuesto del hackathon

Presupuesto operativo recomendado, aunque existan créditos:

| Tope | Acción |
|---:|---|
| USD 1 | aviso al responsable técnico |
| USD 5 | revisar Bedrock, logs y tráfico |
| USD 10 | detener generación pública y usar historias precargadas |

Configurar AWS Budgets con alertas por correo y revisar Cost Explorer cada día. Un budget alerta; no corta gasto automáticamente. El corte real del MVP se implementa con:

- `MAX_GENERATIONS_PER_USER_PER_DAY=20`;
- cambiar temporalmente `StoryGeneratorMode=fixture` para detener Bedrock sin
  retirar el resto de la aplicación;
- reservar tres historias precargadas para la demo;
- no publicar el endpoint sin CORS y límites lógicos.

## 8. Estimación de carga de la demo

Escenario: 50 asistentes, cada uno genera dos historias.

| Recurso | Aproximación |
|---|---:|
| Generaciones Bedrock | 100 |
| Requests API totales | menos de 1.000 |
| Invocaciones Lambda | menos de 1.000 |
| Historias DynamoDB | 100 |
| Intentos DynamoDB | hasta 100 |
| Almacenamiento | muy por debajo de 25 GB |

En ese escenario, el costo variable dominante será Bedrock/Guardrails, no Lambda, API Gateway ni DynamoDB.

## 9. Checklist anti-sorpresas

- [ ] Billing Alerts activadas en la cuenta root.
- [ ] Budget de USD 1/5/10 configurado.
- [x] Región única `us-east-2`.
- [ ] Sin NAT Gateway ni VPC para Lambdas.
- [ ] Sin Provisioned Concurrency.
- [x] DynamoDB `PAY_PER_REQUEST`.
- [x] Sin DAX, Streams ni Global Tables.
- [ ] Revisar si PITR debe continuar activo después del evento.
- [x] Bedrock on-demand, sin Provisioned Throughput.
- [x] Sin generación de imágenes.
- [x] Amplify SPA, no SSR.
- [x] Logs sin payload completo.
- [ ] Fijar retención para los grupos automáticos de Lambda.
- [x] Recursos principales etiquetados `Project=StoryTeacher`,
  `Environment=hackathon`.
- [x] Procedimiento de pausa y `sam delete` documentado en
  [Runbook AWS](15_AWS_RUNBOOK_OPERACIONES.md).

## 10. Conclusión

Sí, AWS ofrece suficientes créditos y franquicias para que el prototipo sea viable a costo muy bajo. No, toda la solución no pertenece a una capa gratuita permanente: Bedrock y Guardrails son los componentes facturables que deben medirse y limitarse.

El segundo grupo de costos a vigilar en el estado actual es DynamoDB PITR,
CloudWatch Logs sin retención para Lambda y trazas X-Ray. Consultar el
[runbook de operación AWS](15_AWS_RUNBOOK_OPERACIONES.md) antes de pausar o
eliminar recursos.
