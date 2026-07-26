import { BedrockStoryGenerator } from "../src/generators/bedrockStoryGenerator";

const generator = new BedrockStoryGenerator({
  tableName: "StoryTeacherLocal",
  region: process.env.AWS_REGION ?? "us-east-2",
  generatorMode: "bedrock",
  authMode: "cognito",
  sessionIpPolicy: "observe",
  modelId:
    process.env.BEDROCK_MODEL_ID ??
    "us.anthropic.claude-sonnet-4-5-20250929-v1:0",
  ...(process.env.BEDROCK_GUARDRAIL_ID
    ? { guardrailId: process.env.BEDROCK_GUARDRAIL_ID }
    : {}),
  ...(process.env.BEDROCK_GUARDRAIL_VERSION
    ? { guardrailVersion: process.env.BEDROCK_GUARDRAIL_VERSION }
    : {}),
  allowedOrigin: "http://localhost:5173",
  promptVersion: "story-v1",
  maxGenerationsPerDay: 20,
});

const started = Date.now();
const story = await generator.generateInteractive({
  age: 8,
  theme: "Espacio",
  difficulty: "media",
  educationalObjective:
    "Comprender por qué colaborar ayuda a resolver problemas",
  maxWords: 800,
  mainCharacter: "Lumi",
  storyMode: "interactive",
  language: "es",
});
const scenes = [
  story.opening,
  ...story.routes.flatMap((route) => [route, ...route.endings]),
];

console.log(
  JSON.stringify(
    {
      elapsedSeconds: (Date.now() - started) / 1_000,
      title: story.title,
      sceneTitles: scenes.map((scene) => scene.title),
      pageWords: scenes.flatMap((scene) =>
        scene.pages.map((page) => page.text.trim().split(/\s+/u).length),
      ),
      sample: story.opening.pages[0]?.text,
    },
    null,
    2,
  ),
);
