import { describe, expect, it } from "vitest";
import type { StoryPublic } from "@story-teacher/shared";
import { buildInteractiveAdventure, clearJourney, loadJourney, resolveStoryWorld, saveJourney } from "./interactiveStory";

function story(language: "es" | "en" = "es", theme = "Espacio"): StoryPublic {
  return {
    storyId: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    createdAt: "2026-07-22T12:00:00.000Z",
    input: { age: 8, theme, difficulty: "media", educationalObjective: "Comprender decisiones", maxWords: 300, mainCharacter: null, storyMode: "interactive", language },
    title: "Historia",
    story: "Una historia de prueba.",
    source: "free",
    courseId: null,
    missionId: null,
    questions: ["literal", "inference", "vocabulary", "sequence", "cause_effect"].map((skill, index) => ({ questionId: `q${index + 1}`, statement: `Pregunta ${index + 1}`, options: ["A", "B", "C", "D"], skill: skill as StoryPublic["questions"][number]["skill"] })),
  };
}

describe("interactive story experience", () => {
  it("creates two decisions leading to four different endings", () => {
    const adventure = buildInteractiveAdventure(story());
    expect(adventure.scenes).toHaveLength(7);
    expect(adventure.scenes.filter((scene) => scene.ending)).toHaveLength(4);
    expect(adventure.scenes.find((scene) => scene.id === "opening")?.choices).toHaveLength(2);
    expect(adventure.scenes.find((scene) => scene.id === "route-0")?.choices).toHaveLength(2);
    expect(adventure.scenes.find((scene) => scene.id === "opening")?.checkpoint?.options).toHaveLength(4);
    expect(adventure.scenes.find((scene) => scene.id === "route-0")?.checkpoint?.skill).toBe("inference");
    expect(adventure.scenes.find((scene) => scene.id === "ending-0-0")?.checkpoint).toBeNull();
    const completePath = ["opening", "route-0", "ending-0-0"]
      .map((sceneId) => adventure.scenes.find((scene) => scene.id === sceneId)?.text ?? "")
      .join(" ");
    expect(completePath.split(/\s+/u).length).toBeGreaterThan(900);
  });

  it("localizes the complete route in English", () => {
    const adventure = buildInteractiveAdventure(story("en", "Océano"));
    expect(adventure.language).toBe("en");
    expect(adventure.title).toBe("The Song Beneath the Reef");
    expect(adventure.scenes[0]?.choices[0]?.label).toMatch(/follow/i);
  });

  it("persists the selected journey for the contextual quiz", () => {
    const journey = { storyId: story().storyId, adventureTitle: "La señal", language: "es" as const, decisions: [{ sceneId: "opening", sceneTitle: "Inicio", choiceId: "route-0", choiceLabel: "Seguir la canción", consequence: "Investigar sonidos" }], endingTitle: "Final", endingText: "El equipo encontró el camino.", checkpointStars: 2, checkpointResults: [{ checkpointId: "checkpoint-opening", correct: true }], completedAt: "2026-07-22T12:00:00.000Z" };
    saveJourney(journey);
    expect(loadJourney(journey.storyId)).toEqual(journey);
    clearJourney(journey.storyId);
    expect(loadJourney(journey.storyId)).toBeNull();
  });

  it("maps every configured world to its illustration family", () => {
    expect(resolveStoryWorld("Ciudad de inventos")).toBe("inventions");
    expect(resolveStoryWorld("Bosque secreto")).toBe("jungle");
    expect(resolveStoryWorld("Tema completamente nuevo")).toBe("mystery");
  });
});
