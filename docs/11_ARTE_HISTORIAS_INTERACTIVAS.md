# Arte de historias interactivas

Las seis escenas fueron creadas con el modo integrado de generación de imágenes y luego convertidas a WebP de 1536 px, calidad 82.

## Especificación compartida

- Caso de uso: `illustration-story`.
- Activo: escenario panorámico para una historia infantil interactiva.
- Estilo: ilustración 3D original de libro infantil, formas redondeadas, materiales suaves y calidad de aplicación educativa.
- Composición: paisaje 3:2, personajes cerca del centro izquierdo y dos caminos ambientales legibles hacia la derecha.
- Tono: curioso, seguro, optimista y sin peligro.
- Restricciones: sin texto, letras, números, logos, marcas de agua ni personajes reconocibles de otras franquicias.
- Paleta: azul profundo y celeste, violeta mítico, amarillo luminoso y pequeños acentos coral.

## Prompts de escena

1. **Espacio:** explorador joven y robot amistoso encuentran un cristal azul junto a una nave escolar; un camino conduce a un satélite musical y otro a una cueva luminosa.
2. **Fantasía:** narrador joven y dragón lector encuentran un libro plateado; las escaleras se separan hacia una torre solar y una sala lunar de páginas flotantes.
3. **Océano:** inventor joven y tortuga encuentran una caracola musical junto a un submarino; burbujas de eco llevan a una familia de ballenas y el coral a una estación científica.
4. **Selva:** exploradora joven y capibara encuentran una semilla violeta tras la lluvia; un puente de hojas lleva al jardín y el arroyo a una tortuga jardinera.
5. **Inventos:** inventor joven y ardilla mecánica descubren un engranaje transparente; una ruta sigue prototipos y otra cruza hacia un laboratorio comunitario.
6. **Portal:** dos narradores y un camaleón encuentran tinta luminosa junto a un libro portal; una ruta usa páginas musicales y otra piedras con escenas ilustradas.

Los archivos finales viven en `frontend/src/assets/story-scenes/` y se usan tanto en la vista previa como en la lectura inmersiva.

## Experiencia de lectura por capítulos

- Cada recorrido tiene tres actos: descubrimiento, investigación y resolución.
- La apertura presenta dos rutas; cada ruta presenta dos decisiones finales. Se conservan cuatro finales coherentes por mundo.
- Los textos extensos se dividen en párrafos con entrada escalonada, un ancho de lectura centrado y alineación interna a la izquierda para no sacrificar legibilidad.
- Las opciones de profundidad son 300, 800 y 1200 palabras. Los valores antiguos de 150 y 500 siguen siendo válidos en el contrato para datos ya existentes.
- Los recorridos extensos incluyen dos paradas de comprensión: una literal y otra de inferencia o causa/consecuencia.
- Cada parada correcta entrega dos estrellas. Las cuatro estrellas posibles se acreditan una sola vez cuando se envía el primer intento del desafío final.
- El desafío final conserva las cinco habilidades académicas y muestra antes el camino y el final elegidos.

## Narradores mágicos

- El control de narración es flotante y puede arrastrarse por la ventana.
- En español sólo se ofrecen Amancay y Nahuel; el motor prioriza voces instaladas `es-AR` y recurre a otra voz en español si no existe una regional.
- En inglés sólo se ofrecen Lyra y Orion, porque el idioma queda fijado antes de crear el libro.
- Los nombres del sistema operativo y los selectores técnicos de voces no se muestran al niño.
- La narración usa Web Speech API, ritmo pausado y controles mínimos de reproducir, pausar y detener.
- El control respeta movimiento reducido y desaparece si el navegador no ofrece síntesis de voz.
