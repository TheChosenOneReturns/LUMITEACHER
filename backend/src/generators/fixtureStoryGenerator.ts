import {
  parseGeneratedStory,
  type GeneratedStory,
  type GenerateStoryInput,
} from "@story-teacher/shared";
import fixture from "../../../contracts/story-generation.example.json" with {
  type: "json",
};
import type { StoryGenerator } from "../domain/models";

const shortEnding =
  " Había descubierto que pedir ayuda no hacía más pequeña su idea: permitía que dos ideas trabajaran juntas.";

export class FixtureStoryGenerator implements StoryGenerator {
  readonly modelId = "fixture:story-generation.example.json";

  async generate(input: GenerateStoryInput): Promise<GeneratedStory> {
    const candidate = structuredClone(fixture);
    if (input.maxWords === 150) {
      candidate.story = candidate.story.replace(shortEnding, "");
    }

    return parseGeneratedStory(candidate, input.maxWords);
  }
}

