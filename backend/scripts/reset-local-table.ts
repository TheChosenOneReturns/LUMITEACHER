import { DeleteTableCommand, DynamoDBClient, ResourceNotFoundException } from "@aws-sdk/client-dynamodb";

const tableName = process.env.TABLE_NAME ?? "StoryTeacherLocal";
if (tableName !== "StoryTeacherLocal") {
  throw new Error(`Por seguridad sólo se puede reiniciar StoryTeacherLocal; recibido: ${tableName}`);
}

const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  endpoint: process.env.DYNAMODB_ENDPOINT ?? "http://127.0.0.1:8000",
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
});

try {
  await client.send(new DeleteTableCommand({ TableName: tableName }));
  console.log(`Tabla local eliminada: ${tableName}`);
} catch (error) {
  if (!(error instanceof ResourceNotFoundException)) throw error;
  console.log(`La tabla local todavía no existía: ${tableName}`);
}
