export interface AppConfig {
  tableName: string;
  region: string;
  dynamoEndpoint?: string;
  generatorMode: "fixture" | "bedrock";
  authMode: "demo" | "cognito";
  sessionIpPolicy: "off" | "observe" | "strict";
  modelId: string;
  guardrailId?: string;
  guardrailVersion?: string;
  allowedOrigin: string;
  promptVersion: string;
  maxGenerationsPerDay: number;
  generationWorkerFunctionName?: string;
}

export function getConfig(): AppConfig {
  const generatorMode = process.env.STORY_GENERATOR_MODE ?? "fixture";
  if (generatorMode !== "fixture" && generatorMode !== "bedrock") {
    throw new Error(`STORY_GENERATOR_MODE inválido: ${generatorMode}`);
  }
  const authMode = process.env.AUTH_MODE ?? "demo";
  if (authMode !== "demo" && authMode !== "cognito") {
    throw new Error(`AUTH_MODE inválido: ${authMode}`);
  }
  const sessionIpPolicy = process.env.SESSION_IP_POLICY ?? "off";
  if (
    sessionIpPolicy !== "off" &&
    sessionIpPolicy !== "observe" &&
    sessionIpPolicy !== "strict"
  ) {
    throw new Error(`SESSION_IP_POLICY inválido: ${sessionIpPolicy}`);
  }

  return {
    tableName: process.env.TABLE_NAME ?? "StoryTeacherLocal",
    region: process.env.AWS_REGION ?? "us-east-1",
    ...(process.env.DYNAMODB_ENDPOINT
      ? { dynamoEndpoint: process.env.DYNAMODB_ENDPOINT }
      : {}),
    generatorMode,
    authMode,
    sessionIpPolicy,
    modelId:
      process.env.BEDROCK_MODEL_ID ??
      "us.anthropic.claude-sonnet-4-5-20250929-v1:0",
    ...(process.env.BEDROCK_GUARDRAIL_ID
      ? { guardrailId: process.env.BEDROCK_GUARDRAIL_ID }
      : {}),
    ...(process.env.BEDROCK_GUARDRAIL_VERSION
      ? { guardrailVersion: process.env.BEDROCK_GUARDRAIL_VERSION }
      : {}),
    allowedOrigin: process.env.ALLOWED_ORIGIN ?? "http://localhost:5173",
    promptVersion: "story-v1",
    maxGenerationsPerDay: Number.parseInt(
      process.env.MAX_GENERATIONS_PER_USER_PER_DAY ?? "20",
      10,
    ),
    ...(process.env.GENERATION_WORKER_FUNCTION_NAME
      ? {
          generationWorkerFunctionName:
            process.env.GENERATION_WORKER_FUNCTION_NAME,
        }
      : {}),
  };
}
