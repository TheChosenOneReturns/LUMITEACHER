export const frequentlyAskedQuestions = [
  {
    question: "¿Para qué edades está pensado Story Teacher?",
    answer:
      "Está diseñado para niñas y niños de 6 a 12 años. La edad elegida adapta la extensión, el vocabulario y la complejidad de las pistas de cada aventura.",
  },
  {
    question: "¿Cómo crea Lumi cada aventura?",
    answer:
      "Lumi combina la edad, el mundo, el protagonista, la dificultad y el objetivo educativo elegidos. Amazon Bedrock genera la historia y el backend comprueba su estructura, extensión y actividades antes de guardarla.",
  },
  {
    question: "¿Los cuentos son siempre iguales?",
    answer:
      "No. Cada lector puede elegir qué quiere explorar y aprender. En las historias interactivas, además, dos decisiones cambian el recorrido y conducen a cuatro finales posibles.",
  },
  {
    question: "¿Qué habilidades se practican?",
    answer:
      "Las actividades trabajan comprensión literal, inferencias, vocabulario, secuencias y causa–efecto. Las devoluciones explican cada respuesta sin usar mensajes punitivos.",
  },
  {
    question: "¿Qué pueden hacer docentes y familias?",
    answer:
      "Pueden organizar cursos, proponer misiones de lectura, consultar avances por habilidad y enviar reconocimientos para acompañar el proceso de cada estudiante.",
  },
  {
    question: "¿Cómo se cuida el contenido generado con IA?",
    answer:
      "La experiencia no es un chat libre. Los temas tienen límites, AWS aplica Guardrails y cada respuesta debe superar validaciones automáticas. Aun así, la IA puede equivocarse y el acompañamiento adulto sigue siendo importante.",
  },
  {
    question: "¿Qué datos se guardan?",
    answer:
      "Se guardan los datos necesarios para la cuenta, el perfil lector, las historias y el progreso. Las credenciales se gestionan con Amazon Cognito y la IP nunca se almacena en texto: sólo se conserva una huella técnica de sesión.",
  },
  {
    question: "¿Necesito crear una cuenta?",
    answer:
      "Sí, para usar la versión online necesitás registrarte y confirmar tu correo. Los perfiles sin contraseña quedan reservados al entorno local de demostración y desarrollo.",
  },
  {
    question: "¿Se puede leer en español y en inglés?",
    answer:
      "Sí. Las aventuras pueden generarse en español o en inglés y el dispositivo puede narrarlas con las voces disponibles en el navegador.",
  },
  {
    question: "¿Hay publicidad o desafíos por velocidad?",
    answer:
      "No. Story Teacher no incluye publicidad y sus recompensas no dependen de responder rápido. El foco está puesto en leer, pensar y animarse a volver a intentar.",
  },
] as const;

export const landingFrequentlyAskedQuestions =
  frequentlyAskedQuestions.slice(0, 6);
