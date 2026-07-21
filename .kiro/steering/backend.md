---
inclusion: fileMatch
fileMatchPattern: "backend/**/*.ts"
---

# Convenciones backend

- Handlers pequeños; reglas educativas dentro del dominio/servicios.
- Validar toda entrada y salida con los esquemas compartidos.
- AWS SDK v3, IAM mínimo y ninguna credencial en el repositorio.
- Logs estructurados sin cuentos, prompts completos ni datos personales.
- Fixture local y Bedrock deben implementar la misma interfaz.
- Máximo un reintento ante respuesta de modelo inválida.

