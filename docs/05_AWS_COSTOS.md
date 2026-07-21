# AWS: capa gratuita, costos y controles

Investigación realizada el **21/07/2026** sobre documentación oficial de AWS. Los precios, elegibilidad, regiones y modelos pueden cambiar; la consola de Billing de la cuenta del hackathon es la fuente definitiva.

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
| DynamoDB Standard | 25 GB, 25 RCU y 25 WCU provisionadas al mes, además de límites de Streams | usar provisionado 5/5, sin extras |
| Amazon Bedrock | pago por tokens según proveedor/modelo; créditos pueden aplicarse | fijar límite de generaciones y modelo económico |
| Bedrock Guardrails | pago por unidades de texto para filtros; word filters y regex figuran sin cargo | usar filtros necesarios y medir |
| Amplify Hosting | elegible para créditos; su página lista hasta 1.000 min de build, 5 GB almacenados y 15 GB de salida/mes en la oferta | hosting recomendado |
| CloudWatch | puede facturar por logs/métricas fuera de sus franquicias | logs breves, sin payload y retención 7 días |

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

El MVP usa 5 WCU/5 RCU y no habilita Streams, PITR, DAX, exportaciones ni tablas globales.

### Amplify Hosting

La página de precios lista durante su oferta gratuita:

- 1.000 minutos de build por mes;
- 5 GB almacenados en CDN;
- 15 GB de transferencia de salida por mes;
- SSL público sin costo adicional.

El sitio será SPA estática, sin SSR, para evitar request/duration de SSR.

## 5. Bedrock no es “always free”

Bedrock cobra por tokens de entrada y salida y el valor depende del modelo, modalidad, región y tier. Para este caso:

- usar un modelo Amazon Nova de bajo costo;
- usar on-demand estándar;
- no usar Provisioned Throughput;
- no usar imágenes, Knowledge Bases, Agents, Flows ni evaluación automática;
- limitar el cuento a 500 palabras y `maxTokens`;
- registrar contadores de uso, nunca el contenido completo.

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
- deshabilitar el endpoint mediante variable/configuración si se alcanza el tope;
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
- [ ] Región única `us-east-1`.
- [ ] Sin NAT Gateway ni VPC para Lambdas.
- [ ] Sin Provisioned Concurrency.
- [ ] DynamoDB provisionado 5/5.
- [ ] Sin PITR, DAX, Streams ni Global Tables.
- [ ] Bedrock on-demand.
- [ ] Sin generación de imágenes.
- [ ] Amplify SPA, no SSR.
- [ ] Logs sin payload y retención de 7 días.
- [ ] Recursos etiquetados `Project=StoryTeacher`, `Environment=hackathon`.
- [ ] `sam delete` documentado para después del evento.

## 10. Conclusión

Sí, AWS ofrece suficientes créditos y franquicias para que el prototipo sea viable a costo muy bajo. No, toda la solución no pertenece a una capa gratuita permanente: Bedrock y Guardrails son los componentes facturables que deben medirse y limitarse.

