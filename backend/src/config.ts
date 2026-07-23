export interface AppConfig {
  tableName: string;
  region: string;
  dynamoEndpoint?: string;
  generatorMode: "fixture" | "bedrock";
  modelId: string;
  guardrailId?: string;
  guardrailVersion?: string;
  allowedOrigin: string;
  promptVersion: string;
}

export function getConfig(): AppConfig {
  const generatorMode = process.env.STORY_GENERATOR_MODE ?? "fixture";
  if (generatorMode !== "fixture" && generatorMode !== "bedrock") {
    throw new Error(`STORY_GENERATOR_MODE inválido: ${generatorMode}`);
  }

  return {
    tableName: process.env.TABLE_NAME ?? "StoryTeacherLocal",
    region: process.env.AWS_REGION ?? "us-east-1",
    ...(process.env.DYNAMODB_ENDPOINT
      ? { dynamoEndpoint: process.env.DYNAMODB_ENDPOINT }
      : {}),
    generatorMode,
    modelId:
      process.env.BEDROCK_MODEL_ID ?? "us.amazon.nova-2-lite-v1:0",
    ...(process.env.BEDROCK_GUARDRAIL_ID
      ? { guardrailId: process.env.BEDROCK_GUARDRAIL_ID }
      : {}),
    ...(process.env.BEDROCK_GUARDRAIL_VERSION
      ? { guardrailVersion: process.env.BEDROCK_GUARDRAIL_VERSION }
      : {}),
    allowedOrigin: process.env.ALLOWED_ORIGIN ?? "http://localhost:5173",
    promptVersion: "story-v1",
  };
}
