# UX/UI y adaptación de las pantallas de Stitch

## 1. Dirección visual

Las referencias de `stitch_story_teacher_ai_platform` ya definen una identidad fuerte: “Modern Playful Tactility”, con botones físicos, bordes gruesos, geometría redondeada, azul cielo, amarillo de recompensa, verde de logro y Nunito Sans.

La implementación debe conservar:

- personalidad alegre y segura;
- controles grandes;
- tarjetas táctiles;
- sombras desplazadas, no efectos de vidrio;
- fondos claros con patrones suaves;
- mascota Lumi como acompañante, no como chat abierto.

## 2. Auditoría de las referencias

### Lo que funciona

- Jerarquía visual clara y apropiada para público infantil.
- Botones de acción grandes y fáciles de reconocer.
- Flujo completo representado: landing, dashboard, configuración, lectura, desafío y resultado.
- Buen uso de color para separar tipos de contenido.
- Versiones móviles existentes que reducen trabajo de exploración.

### Ajustes obligatorios

1. **Idioma:** varias pantallas mezclan `My Stories`, `Library`, `Quests`, `Profile`, `Let's build a story` y `Ask Lumi` con español. El MVP queda 100% en español.
2. **Edad:** mobile ofrece `3–5` y `6–8`, mientras desktop ofrece 6–12. El público aprobado es 6–12 y se elige una edad exacta.
3. **Objetivo educativo:** falta en ambos configuradores; se agrega como campo obligatorio.
4. **Dificultad:** la versión mobile no la muestra; se agrega fácil, media y desafío.
5. **Navegación:** el panel derecho de desktop tapa tarjetas. Se elimina para el MVP; Lumi aparece dentro del contenido cuando aporta ayuda.
6. **Resultados:** una sola pregunta por habilidad sólo permite 0% o 100% en ese intento. Porcentajes como 85% no deben inventarse; se muestran `Logrado`/`A practicar`.
7. **Contraste de lectura:** la referencia desktop parece tener una capa gris sobre el cuento. El estado normal debe ser blanco/azul muy claro con texto oscuro; el overlay sólo aparece al cargar.
8. **Activos externos:** varios HTML dependen de URLs de Google. Se deben descargar sólo activos con permiso o sustituirlos por arte propio/local para que la demo no dependa de terceros.
9. **Marca:** usar Story Teacher como nombre y Lumi como mascota en todas las pantallas.

## 3. Arquitectura de navegación

### Desktop

Header simple:

- logo Story Teacher;
- `Inicio`;
- `Biblioteca`;
- botón `Crear historia`;
- avatar demo.

No se muestran por ahora `Misiones`, `Consejos`, `Logros`, fuego, estrellas ni tienda porque no tienen funcionalidad P0.

### Mobile

Barra inferior:

- `Inicio`;
- `Crear` como acción central destacada;
- `Biblioteca`.

Se evitan cuatro pestañas con secciones vacías.

## 4. Pantallas y criterios visuales

### Landing

Contenido:

- logo;
- hero local de libro/aventura;
- título `¡Cada historia es una nueva aventura!`;
- subtítulo de una línea;
- botón primario `Crear mi historia`;
- botón secundario `Explorar historias`.

En mobile el texto aparece antes o inmediatamente después del hero, y las dos acciones quedan visibles sin depender de scroll excesivo.

### Inicio/biblioteca

- saludo `¡Hola, Sofía!`;
- CTA `Crear una nueva aventura`;
- grilla de cuentos reales del backend;
- tarjeta vacía si todavía no hay cuentos;
- skeletons durante la carga;
- cada tarjeta muestra título, tema, edad y fecha, sin imágenes generadas.

### Configurador

Orden recomendado:

1. edad exacta 6–12;
2. tema con presets y opción escrita;
3. objetivo educativo;
4. dificultad;
5. extensión;
6. protagonista opcional;
7. crear.

El layout desktop puede mostrar dificultad y extensión en dos columnas. En mobile todo va en una columna, excepto selecciones compactas.

Copy de ayuda del objetivo:

> ¿Qué te gustaría practicar o aprender? Ej.: colaborar, cuidar el ambiente o reconocer emociones.

Advertencia breve:

> No escribas nombres completos ni datos personales.

### Generación

- overlay o pantalla dedicada con Lumi;
- texto inicial `Lumi está imaginando tu aventura…`;
- cambios suaves cada pocos segundos: `Preparando los personajes`, `Creando el desafío`;
- spinner accesible y `aria-live="polite"`;
- sin barra de porcentaje falsa;
- botón cancelar no es necesario si no cancela realmente el request.

### Lectura

- tarjeta tipo libro, pero con una sola columna de texto legible;
- ancho del texto entre 55 y 70 caracteres por línea;
- párrafos cortos;
- tema visual como gradiente/ícono estático;
- botón `Comenzar desafío` al final;
- opcional P1: `Escuchar cuento` mediante síntesis del navegador.

### Desafío

- `Pregunta 1 de 5` y barra de progreso;
- statement grande pero no mayor que el contenido visible;
- opciones A–D como tarjetas de mínimo 56 px de alto;
- estado seleccionado inequívoco que no dependa sólo del color;
- botones `Anterior` y `Siguiente`; en la quinta, `Ver resultado`;
- no usar ilustraciones decorativas distintas por opción: pueden dar pistas accidentales.

### Resultado

- celebración corta que respete `prefers-reduced-motion`;
- `4 de 5 correctas` como dato principal;
- mensaje de Lumi según rango, nunca punitivo;
- cinco filas `Logrado`/`A practicar`;
- acordeón con pregunta, respuesta y explicación;
- `Crear otra aventura` y `Ver biblioteca`.

Mensajes sugeridos:

| Resultado | Mensaje |
|---|---|
| 5/5 | `¡Excelente lectura! Encontraste todas las pistas.` |
| 3–4/5 | `¡Muy buen trabajo! Cada historia te ayuda a mejorar.` |
| 0–2/5 | `¡Buen intento! Revisemos las pistas y probemos otra vez.` |

## 5. Tokens

Usar como fuente el `DESIGN.md` existente. Selección principal:

```css
--color-bg: #f6fafe;
--color-primary: #00658e;
--color-primary-soft: #c7e7ff;
--color-yellow: #fdd73b;
--color-green: #79d453;
--color-text: #181c1f;
--color-text-muted: #3f484f;
--color-border: #bec8d0;
--color-error: #ba1a1a;
--radius-card: 16px;
--radius-control: 24px;
--control-min-height: 56px;
```

Tipografía:

- familia: Nunito Sans;
- título desktop: 48/56, 900;
- título mobile: 32/40, 900;
- subtítulo: 24/32, 800;
- cuerpo de lectura: 18–20 px, line-height 1.5;
- labels: 16 px, 800.

## 6. Estados obligatorios por pantalla

| Estado | Tratamiento |
|---|---|
| Vacío | explicación + CTA principal |
| Cargando | skeleton o spinner con texto |
| Error recuperable | mensaje + reintentar |
| Contenido bloqueado | explicación neutra + editar tema |
| Sin conexión | conservar formulario y ofrecer reintento |
| Éxito | confirmación visible, no sólo color |
| Focus | outline de al menos 2 px |
| Disabled | contraste suficiente y cursor coherente |

## 7. Accesibilidad P0

- Navegación completa por teclado.
- Orden de foco igual al visual.
- `label` explícito en todos los controles.
- Área táctil mínima 44×44 px; objetivo visual 56 px.
- Contraste WCAG AA para texto y controles.
- No transmitir correcto/incorrecto sólo con verde/rojo: incluir ícono y texto.
- `aria-live` para generación y resultado.
- `prefers-reduced-motion` desactiva rebotes, confeti y jitter.
- Emojis decorativos llevan `aria-hidden="true"`.
- El cuento se presenta como texto HTML seleccionable, no como imagen.
- Errores de formulario quedan vinculados al campo con `aria-describedby`.

## 8. Responsive

Breakpoints de verificación:

- 375×667: teléfono pequeño;
- 390×844: teléfono común;
- 768×1024: tablet vertical;
- 1280×800: laptop;
- 1440×900: desktop.

Reglas:

- max-width de contenido: 1280 px;
- margen mobile: 16 px;
- margen desktop: 48 px;
- una columna debajo de 768 px;
- dos o tres columnas de tarjetas según ancho;
- ninguna navegación fija debe tapar el contenido;
- considerar `padding-bottom` por la barra inferior mobile.

## 9. Animación

- Botón presionado: traslación vertical de 3–4 px y sombra reducida.
- Hover sólo en dispositivos que lo soporten.
- Duración habitual: 120–220 ms.
- Lumi puede flotar suavemente durante carga.
- Evitar movimiento continuo durante lectura y preguntas.
- Confeti máximo 1,5 segundos, sin bloquear interacción.

## 10. Checklist visual antes de la demo

- Todo el texto visible está en español.
- No quedan enlaces `#` ni acciones falsas.
- Logo y arte cargan desde el proyecto o hosting controlado.
- El nombre del producto es consistente.
- No hay contenido tapado a ningún breakpoint.
- Los textos largos de Bedrock no desbordan tarjetas.
- Se probó un título largo y opciones de dos líneas.
- El estado de error se ve tan cuidado como el estado exitoso.
- La demo funciona con animaciones reducidas.

