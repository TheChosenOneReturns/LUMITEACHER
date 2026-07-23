import { getConfig } from "./config";
import type { StoryApplicationService } from "./domain/models";
import { BedrockStoryGenerator } from "./generators/bedrockStoryGenerator";
import { FixtureStoryGenerator } from "./generators/fixtureStoryGenerator";
import { DynamoStoryRepository } from "./repositories/dynamoStoryRepository";
import { StoryService } from "./services/storyService";
import { PlatformService } from "./platform/platformService";

let service: StoryApplicationService | undefined;
let platformService: PlatformService | undefined;
let sharedRepository: DynamoStoryRepository | undefined;

export function getStoryService(): StoryApplicationService {
  if (service) {
    return service;
  }

  const config = getConfig();
  const repository = sharedRepository ?? new DynamoStoryRepository(config);
  sharedRepository = repository;
  const generator =
    config.generatorMode === "bedrock"
      ? new BedrockStoryGenerator(config)
      : new FixtureStoryGenerator();
  service = new StoryService(generator, repository, repository, config);
  return service;
}

export function getPlatformService(): PlatformService {
  if (platformService) return platformService;
  const config = getConfig();
  const repository = sharedRepository ?? new DynamoStoryRepository(config);
  sharedRepository = repository;
  platformService = new PlatformService(
    repository.documentClient,
    config,
    getStoryService(),
  );
  return platformService;
}
