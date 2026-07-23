# Contrato de IA para cuentos interactivos largos

## Objetivo

Este documento define cómo el backend deberá pedir a Amazon Bedrock un cuento largo y ramificado. El frontend actual usa fixtures deterministas, pero la respuesta futura de Bedrock deberá conservar exactamente la misma experiencia: páginas, decisiones, checkpoints, cuatro finales, narración y quiz final.

La fuente ejecutable del prompt es `prompts/story-interactive-v2.txt` y la forma de la respuesta vive en `contracts/interactive-story.schema.json`.

## Información que recibe Bedrock

El backend construye la entrada; el navegador nunca envía un prompt libre directamente al modelo.

```json
{
  "age": 9,
  "language": "es",
  "theme": "Una biblioteca sobre dos lunas",
  "difficulty": "desafio",
  "educationalObjective": "Inferir causas a partir de pistas",
  "maxWordsPerPath": 1200,
  "mainCharacter": "Mara y un dragón lector",
  "readingMode": "interactive",
  "narrativeSpec": {
    "chaptersPerPath": 3,
    "openingChoices": 2,
    "endingChoicesPerRoute": 2,
    "totalEndings": 4,
    "targetWordsPerPage": {"min": 110, "max": 170},
    "checkpoints": 2,
    "checkpointRewardStars": 2,
    "finalQuizQuestions": 5
  }
}
```

No se envían nombre real del alumno, curso, resultados anteriores, voz elegida, correo ni ningún otro dato personal. Si se personaliza el protagonista, el backend debe moderarlo y tratarlo como texto no confiable.

## Respuesta esperada

Bedrock devuelve sólo JSON:

- `opening`: capítulo común, páginas, checkpoint literal y dos rutas.
- `routes[2]`: capítulo propio, páginas, checkpoint inferencial y dos finales.
- `endings[2]` por ruta: resolución con páginas propias.
- `finalQuestions[5]`: literal, inferencia, vocabulario, secuencia y causa/consecuencia.
- `sourceSceneIds`: evidencia narrativa utilizada por cada pregunta.

Un recorrido completo se arma así:

```text
opening → route-a → ending-a1
        ↘ route-b → ending-b2
```

Cada combinación opening–route–ending debe alcanzar entre 85% y 100% de `maxWordsPerPath`. Las páginas contienen idealmente 110–170 palabras para que la interfaz pueda girarlas y narrarlas sin bloques excesivos.

## Pipeline de Bedrock

1. Validar y moderar la entrada.
2. Separar instrucciones del sistema de los valores suministrados por el usuario.
3. Invocar `us.amazon.nova-2-lite-v1:0` mediante Converse con temperatura `0.2`, modelo configurable y Guardrail de entrada.
4. Extraer JSON y validarlo contra el JSON Schema y su equivalente Zod.
5. Comprobar reglas semánticas:
   - IDs y referencias válidas;
   - dos rutas y cuatro finales;
   - páginas y límites de palabras;
   - opciones únicas e índice correcto;
   - checkpoints distintos;
   - cinco skills finales únicas;
   - cada pregunta tiene evidencia en la ruta;
   - idioma consistente;
   - contenido seguro.
6. Aplicar Guardrail de salida.
7. Si falla, realizar como máximo un reintento de reparación enviando exclusivamente los errores de validación y el JSON anterior.
8. Guardar la respuesta privada completa en DynamoDB.
9. Eliminar `correctAnswer` y `explanation` de checkpoints y quiz en el DTO público.
10. Corregir las respuestas únicamente en backend.

## Narración y resaltado

Bedrock genera texto, no audio. El frontend divide el texto en páginas y usa Web Speech API:

- español: intenta `es-AR-Elena` para Amancay y `es-AR-Tomas` para Nahuel;
- inglés: intenta una voz femenina para Lyra y masculina para Orion;
- los eventos de límite de palabra actualizan el rango resaltado;
- si el navegador no informa límites, se utiliza un temporizador aproximado;
- al terminar una página, la narración solicita la siguiente, reproduce el sonido sintetizado de papel y continúa.

En producción conviene reemplazar Web Speech API por Amazon Polly o un proveedor TTS con marcas temporales de palabras. Esas marcas permiten sincronización exacta entre audio, página y resaltado en todos los dispositivos.

## Versionado

- `story-v1`: cuento lineal y cinco preguntas.
- `story-interactive-v2`: tres capítulos por recorrido, páginas, dos decisiones, cuatro finales y checkpoints.

Cada historia debe guardar `promptVersion`, `modelId`, locale, fecha y resultado de validación para poder reproducir errores sin almacenar datos personales.
