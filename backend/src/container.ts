import { getConfig } from "./config";
import type { StoryApplicationService } from "./domain/models";
import { BedrockStoryGenerator } from "./generators/bedrockStoryGenerator";
import { FixtureStoryGenerator } from "./generators/fixtureStoryGenerator";
import { DynamoStoryRepository } from "./repositories/dynamoStoryRepository";
import { StoryService } from "./services/storyService";

let service: StoryApplicationService | undefined;

export function getStoryService(): StoryApplicationService {
  if (service) {
    return service;
  }

  const config = getConfig();
  const repository = new DynamoStoryRepository(config);
  const generator =
    config.generatorMode === "bedrock"
      ? new BedrockStoryGenerator(config)
      : new FixtureStoryGenerator();
  service = new StoryService(generator, repository, repository, config);
  return service;
}

