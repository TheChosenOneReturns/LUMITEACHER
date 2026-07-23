import { expect, test } from "@playwright/test";

const apiBase = "http://127.0.0.1:3000";
const headers = { "X-Demo-User-Id": "demo-valentina" };

test("un reintento con 60% avanza el mundo una sola vez sin repetir estrellas", async ({ request }) => {
  const runId = crypto.randomUUID();
  const before = await (await request.get(`${apiBase}/me/rewards`, { headers })).json();
  const createdResponse = await request.post(`${apiBase}/stories`, {
    headers: { ...headers, "Idempotency-Key": `e2e-mastery-${runId}` },
    data: {
      age: 8,
      theme: "Espacio",
      difficulty: "facil",
      educationalObjective: "Distinguir causas y consecuencias",
      maxWords: 300,
      mainCharacter: "Luna",
    },
  });
  expect(createdResponse.ok()).toBeTruthy();
  const story = await createdResponse.json();
  const correct = [0, 1, 2, 3, 1];

  const failed = await request.post(`${apiBase}/stories/${story.storyId}/attempts`, {
    headers,
    data: { attemptId: `below-${runId}`, answers: [correct[0], correct[1], 3, 0, 0] },
  });
  expect((await failed.json()).scorePercent).toBe(40);
  const afterFailed = await (await request.get(`${apiBase}/me/rewards`, { headers })).json();
  expect(afterFailed.worldMasteryCounts.space).toBe(before.worldMasteryCounts.space);
  expect(afterFailed.totalStars).toBe(before.totalStars + 7);

  const passed = await request.post(`${apiBase}/stories/${story.storyId}/attempts`, {
    headers,
    data: { attemptId: `passed-${runId}`, answers: [correct[0], correct[1], correct[2], 0, 0] },
  });
  expect((await passed.json()).scorePercent).toBe(60);
  const afterPassed = await (await request.get(`${apiBase}/me/rewards`, { headers })).json();
  expect(afterPassed.worldMasteryCounts.space).toBe(before.worldMasteryCounts.space + 1);
  expect(afterPassed.totalStars).toBe(afterFailed.totalStars);

  await request.post(`${apiBase}/stories/${story.storyId}/attempts`, {
    headers,
    data: { attemptId: `repeat-${runId}`, answers: correct },
  });
  const afterRepeat = await (await request.get(`${apiBase}/me/rewards`, { headers })).json();
  expect(afterRepeat.worldMasteryCounts.space).toBe(afterPassed.worldMasteryCounts.space);
  expect(afterRepeat.totalStars).toBe(afterPassed.totalStars);
});
