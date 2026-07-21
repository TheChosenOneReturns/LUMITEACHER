import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceInUseException,
} from "@aws-sdk/client-dynamodb";

const tableName = process.env.TABLE_NAME ?? "StoryTeacherLocal";
const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  endpoint: process.env.DYNAMODB_ENDPOINT ?? "http://127.0.0.1:8000",
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
});

await waitForDynamo();

try {
  await client.send(
    new CreateTableCommand({
      TableName: tableName,
      AttributeDefinitions: [
        { AttributeName: "PK", AttributeType: "S" },
        { AttributeName: "SK", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "PK", KeyType: "HASH" },
        { AttributeName: "SK", KeyType: "RANGE" },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    }),
  );
  console.log(`Tabla local creada: ${tableName}`);
} catch (error) {
  if (error instanceof ResourceInUseException) {
    console.log(`Tabla local ya disponible: ${tableName}`);
  } else {
    throw error;
  }
}

async function waitForDynamo(): Promise<void> {
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    try {
      await client.send(new DescribeTableCommand({ TableName: tableName }));
      return;
    } catch (error) {
      if (
        error instanceof Error &&
        error.name !== "ResourceNotFoundException"
      ) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }
      if (error instanceof Error && error.name === "ResourceNotFoundException") {
        return;
      }
    }
  }
  throw new Error("DynamoDB Local no respondió a tiempo.");
}

