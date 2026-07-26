import { getConfig } from "./config";
import type { StoryApplicationService } from "./domain/models";
import { BedrockStoryGenerator } from "./generators/bedrockStoryGenerator";
import { FixtureStoryGenerator } from "./generators/fixtureStoryGenerator";
import { DynamoStoryRepository } from "./repositories/dynamoStoryRepository";
import { StoryService } from "./services/storyService";
import { PlatformService } from "./platform/platformService";
import { SessionIpGuard } from "./security/sessionIpGuard";
import { DynamoGenerationJobRepository } from "./generation/generationJobs";
import { GenerationDispatcher } from "./generation/generationDispatcher";

let service: StoryApplicationService | undefined;
let platformService: PlatformService | undefined;
let sharedRepository: DynamoStoryRepository | undefined;
let sessionIpGuard: SessionIpGuard | undefined;
let generationJobRepository: DynamoGenerationJobRepository | undefined;
let generationDispatcher: GenerationDispatcher | undefined;

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
  );
  return platformService;
}

export function getSessionIpGuard(): SessionIpGuard {
  if (sessionIpGuard) return sessionIpGuard;
  const config = getConfig();
  const repository = sharedRepository ?? new DynamoStoryRepository(config);
  sharedRepository = repository;
  sessionIpGuard = new SessionIpGuard(repository.documentClient, config);
  return sessionIpGuard;
}

export function getGenerationJobRepository(): DynamoGenerationJobRepository {
  if (generationJobRepository) return generationJobRepository;
  const config = getConfig();
  const repository = sharedRepository ?? new DynamoStoryRepository(config);
  sharedRepository = repository;
  generationJobRepository = new DynamoGenerationJobRepository(
    repository.documentClient,
    config,
  );
  return generationJobRepository;
}

export function getGenerationDispatcher(): GenerationDispatcher {
  if (generationDispatcher) return generationDispatcher;
  generationDispatcher = new GenerationDispatcher(getConfig());
  return generationDispatcher;
}
