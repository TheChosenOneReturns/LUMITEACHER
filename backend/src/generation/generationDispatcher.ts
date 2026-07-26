import {
  InvocationType,
  InvokeCommand,
  LambdaClient,
} from "@aws-sdk/client-lambda";
import type { AppConfig } from "../config";
import type { GenerationWorkerEvent } from "./generationJobs";

export class GenerationDispatcher {
  private readonly client: LambdaClient;

  constructor(private readonly config: AppConfig) {
    this.client = new LambdaClient({ region: config.region });
  }

  async dispatch(event: GenerationWorkerEvent): Promise<void> {
    if (!this.config.generationWorkerFunctionName) {
      throw new Error("GENERATION_WORKER_FUNCTION_NAME no está configurado.");
    }
    const response = await this.client.send(
      new InvokeCommand({
        FunctionName: this.config.generationWorkerFunctionName,
        InvocationType: InvocationType.Event,
        Payload: Buffer.from(JSON.stringify(event)),
      }),
    );
    if (response.StatusCode !== 202) {
      throw new Error(
        `AWS Lambda rechazó la generación asíncrona (${response.StatusCode ?? "sin estado"}).`,
      );
    }
  }
}
