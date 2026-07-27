import { Amplify } from "aws-amplify";
import {
  fetchAuthSession,
  signIn,
  signOut,
} from "aws-amplify/auth";

const required = [
  "SMOKE_EMAIL",
  "SMOKE_PASSWORD",
  "SMOKE_API_URL",
  "SMOKE_USER_POOL_ID",
  "SMOKE_USER_POOL_CLIENT_ID",
];
for (const name of required) {
  if (!process.env[name]) throw new Error(`Falta ${name}.`);
}

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.SMOKE_USER_POOL_ID,
      userPoolClientId: process.env.SMOKE_USER_POOL_CLIENT_ID,
      loginWith: { email: true },
    },
  },
});

const apiUrl = process.env.SMOKE_API_URL.replace(/\/$/u, "");

async function api(path, init = {}) {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error("Cognito no devolvió un ID token.");
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      `${init.method ?? "GET"} ${path} respondió ${response.status}: ${JSON.stringify(body)}`,
    );
  }
  return body;
}

try {
  const signInResult = await signIn({
    username: process.env.SMOKE_EMAIL,
    password: process.env.SMOKE_PASSWORD,
  });
  if (!signInResult.isSignedIn) {
    throw new Error(
      `Cognito requiere un paso adicional: ${signInResult.nextStep.signInStep}`,
    );
  }

  await api("/me/bootstrap", {
    method: "POST",
    body: JSON.stringify({
      role: "student",
      displayName: "Prueba Lumi",
      age: 8,
      avatarId: "animal-fox",
      favoriteTheme: "Espacio",
    }),
  });

  const accepted = await api("/stories", {
    method: "POST",
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify({
      age: 8,
      theme: "Espacio",
      difficulty: "media",
      educationalObjective:
        "Comprender por qué colaborar ayuda a resolver problemas",
      maxWords: 800,
      mainCharacter: "Lumi",
      storyMode: "interactive",
      language: "es",
    }),
  });
  if (accepted.status !== "pending" || !accepted.generationId) {
    throw new Error(`Respuesta de creación inesperada: ${JSON.stringify(accepted)}`);
  }

  let completed;
  for (let attempt = 0; attempt < 132; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2_500));
    const status = await api(`/generations/${accepted.generationId}`);
    if (status.status === "failed") {
      throw new Error(`La generación falló: ${JSON.stringify(status.error)}`);
    }
    if (status.status === "completed") {
      completed = status;
      break;
    }
  }
  if (!completed) throw new Error("La generación no terminó en 330 segundos.");

  const scenes = completed.story.adventure?.scenes ?? [];
  const pageWordCounts = scenes.flatMap((scene) =>
    scene.pages.map((page) => page.text.trim().split(/\s+/u).length),
  );
  if (
    scenes.length !== 7 ||
    new Set(scenes.map((scene) => scene.title.toLocaleLowerCase("es"))).size !==
      7 ||
    pageWordCounts.length !== 14
  ) {
    throw new Error(
      `La aventura no cumple el contrato: ${JSON.stringify({
        scenes: scenes.length,
        uniqueTitles: new Set(scenes.map((scene) => scene.title)).size,
        pages: pageWordCounts.length,
      })}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        generationId: accepted.generationId,
        storyId: completed.story.storyId,
        title: completed.story.title,
        sceneTitles: scenes.map((scene) => scene.title),
        pageWordCounts,
      },
      null,
      2,
    ),
  );
} finally {
  await signOut().catch(() => undefined);
}
