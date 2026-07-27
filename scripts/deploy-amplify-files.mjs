import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

const appId = process.env.AMPLIFY_APP_ID;
const branchName = process.env.AMPLIFY_BRANCH_NAME ?? "main";
const region = process.env.AWS_REGION ?? "us-east-2";
const distRoot = resolve(process.env.AMPLIFY_DIST_ROOT ?? "frontend/dist");
const siteUrl = (
  process.env.AMPLIFY_SITE_URL ??
  `https://${branchName}.${appId}.amplifyapp.com`
).replace(/\/$/u, "");

if (!appId) throw new Error("Falta AMPLIFY_APP_ID.");

function aws(args) {
  if (process.platform === "win32") {
    const userProfile = process.env.USERPROFILE;
    const python = join(
      process.env.LOCALAPPDATA ?? "",
      "pipx",
      "pipx",
      "venvs",
      "awscli",
      "Scripts",
      "python.exe",
    );
    const cliScript = join(userProfile ?? "", ".local", "bin", "aws.cmd");
    if (existsSync(python) && existsSync(cliScript)) {
      return execFileSync(python, ["-x", cliScript, ...args], {
        encoding: "utf8",
      });
    }
  }
  return execFileSync("aws", args, { encoding: "utf8" });
}

const branch = JSON.parse(
  aws([
    "amplify",
    "get-branch",
    "--app-id",
    appId,
    "--branch-name",
    branchName,
    "--region",
    region,
    "--output",
    "json",
  ]),
);
const hostedEnvironment = branch.branch?.environmentVariables ?? {};
const requiredBuildVariables = [
  "VITE_API_URL",
  "VITE_AUTH_MODE",
  "VITE_COGNITO_USER_POOL_ID",
  "VITE_COGNITO_USER_POOL_CLIENT_ID",
];
for (const name of requiredBuildVariables) {
  if (!hostedEnvironment[name]) {
    throw new Error(`Falta ${name} en la rama de Amplify.`);
  }
}
if (hostedEnvironment.VITE_AUTH_MODE !== "cognito") {
  throw new Error("La rama de producción no está configurada para Cognito.");
}

if (process.env.AMPLIFY_SKIP_BUILD !== "1") {
  const buildCommand =
    process.platform === "win32"
      ? {
          file: process.env.ComSpec ?? "cmd.exe",
          args: [
            "/d",
            "/s",
            "/c",
            "npm run build -w @story-teacher/frontend",
          ],
        }
      : {
          file: "npm",
          args: ["run", "build", "-w", "@story-teacher/frontend"],
        };
  execFileSync(buildCommand.file, buildCommand.args, {
    cwd: resolve("."),
    stdio: "inherit",
    env: { ...process.env, ...hostedEnvironment },
  });
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? listFiles(path) : [path];
    }),
  );
  return nested.flat();
}

const files = await listFiles(distRoot);
const uploads = await Promise.all(
  files.map(async (absolutePath) => {
    const content = await readFile(absolutePath);
    const path = relative(distRoot, absolutePath).split(sep).join("/");
    return {
      absolutePath,
      content,
      path,
      md5: createHash("md5").update(content).digest("hex"),
    };
  }),
);
if (
  !uploads.some(({ path }) => path === "index.html") ||
  !uploads.some(({ path }) => path.startsWith("assets/"))
) {
  throw new Error("El artefacto no contiene index.html y assets.");
}
const compiledText = uploads
  .filter(({ path }) => path.endsWith(".js") || path === "index.html")
  .map(({ content }) => content.toString("utf8"))
  .join("\n");
for (const name of requiredBuildVariables) {
  const value = hostedEnvironment[name];
  if (!compiledText.includes(value)) {
    throw new Error(
      `El artefacto no contiene ${name}; se canceló el despliegue para no publicar el modo demo.`,
    );
  }
}

async function waitForDeployment(jobId) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const job = JSON.parse(
      aws([
        "amplify",
        "get-job",
        "--app-id",
        appId,
        "--branch-name",
        branchName,
        "--job-id",
        jobId,
        "--region",
        region,
        "--output",
        "json",
      ]),
    );
    const status = job.job?.summary?.status;
    if (status === "SUCCEED") return;
    if (status === "FAILED" || status === "CANCELLED") {
      throw new Error(`Amplify terminó el job ${jobId} como ${status}.`);
    }
    await new Promise((resolvePromise) =>
      setTimeout(resolvePromise, 2_000),
    );
  }
  throw new Error(`Amplify no terminó el job en 120 segundos.`);
}

async function verifyPublished(jobId) {
  let missing = [];
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const checks = await Promise.all(
      uploads.flatMap(({ path }) => [
        fetch(`${siteUrl}/${path}`, { method: "HEAD" }),
        fetch(`${siteUrl}/${path}?deployment=${jobId}`, { method: "HEAD" }),
      ]),
    );
    missing = checks
      .map((response, index) => ({
        status: response.status,
        path: uploads[Math.floor(index / 2)]?.path,
        cacheBusted: index % 2 === 1,
      }))
      .filter(({ status }) => status !== 200);
    if (missing.length === 0) return;
    await new Promise((resolvePromise) =>
      setTimeout(resolvePromise, 2_000),
    );
  }
  throw new Error(
    `Amplify dejó archivos inaccesibles: ${JSON.stringify(missing.slice(0, 10))}`,
  );
}

if (process.env.AMPLIFY_VERIFY_ONLY === "1") {
  const jobId = process.env.AMPLIFY_JOB_ID ?? "verify";
  await verifyPublished(jobId);
  console.log(JSON.stringify({ jobId, status: "VERIFIED", files: uploads.length }));
} else {
  const fileMap = Object.fromEntries(
    uploads.map(({ path, md5 }) => [path, md5]),
  );
  const deployment = JSON.parse(
    aws([
      "amplify",
      "create-deployment",
      "--app-id",
      appId,
      "--branch-name",
      branchName,
      "--file-map",
      JSON.stringify(fileMap),
      "--region",
      region,
      "--output",
      "json",
    ]),
  );

  const uploadUrls = deployment.fileUploadUrls ?? {};
  if (Object.keys(uploadUrls).length !== uploads.length) {
    throw new Error(
      `Amplify devolvió ${Object.keys(uploadUrls).length} URLs para ${uploads.length} archivos.`,
    );
  }

  await Promise.all(
    uploads.map(async ({ content, path }) => {
      const response = await fetch(uploadUrls[path], {
        method: "PUT",
        body: content,
      });
      if (!response.ok) {
        throw new Error(`Falló la carga de ${path}: ${response.status}.`);
      }
    }),
  );

  const started = JSON.parse(
    aws([
      "amplify",
      "start-deployment",
      "--app-id",
      appId,
      "--branch-name",
      branchName,
      "--job-id",
      deployment.jobId,
      "--region",
      region,
      "--output",
      "json",
    ]),
  );

  await waitForDeployment(deployment.jobId);
  await verifyPublished(deployment.jobId);

  console.log(
    JSON.stringify({
      jobId: deployment.jobId,
      status: started.jobSummary?.status,
      verified: true,
      files: uploads.length,
    }),
  );
}
