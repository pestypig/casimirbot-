#!/usr/bin/env node

import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { verifyReplitBuildMeta } from "./replit-build-meta.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const timeoutMs = Math.max(10_000, Number(process.env.REPLIT_PRODUCTION_SMOKE_TIMEOUT_MS ?? 240_000));
const maxLogCharacters = 80_000;

const getFreePort = () => new Promise((resolve, reject) => {
  const server = net.createServer();
  server.unref();
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : null;
    server.close((error) => error ? reject(error) : resolve(port));
  });
});

const sanitizeEnvironment = (port) => {
  const env = { ...process.env };
  for (const key of [
    "OPENAI_API_KEY",
    "LLM_HTTP_API_KEY",
    "ELEVENLABS_API_KEY",
    "DATABASE_URL",
    "PGDATABASE",
    "PGHOST",
    "PGPASSWORD",
    "PGPORT",
    "PGUSER",
    "DEFAULT_OBJECT_STORAGE_BUCKET_ID",
    "PUBLIC_OBJECT_SEARCH_PATHS",
    "PRIVATE_OBJECT_DIR",
    "LLM_LOCAL_INDEX_OBJECT_KEY",
    "LLM_LOCAL_MODEL_OBJECT_KEY",
    "LLM_LOCAL_LORA_OBJECT_KEY",
  ]) {
    delete env[key];
  }
  return {
    ...env,
    PORT: String(port),
    HOST: "127.0.0.1",
    NODE_ENV: "production",
    SKIP_VITE_MIDDLEWARE: "1",
    FAST_BOOT: "0",
    REPLIT_DEPLOYMENT: "0",
    DEPLOYMENT: "0",
    ENABLE_AGI: "1",
    ENABLE_ESSENCE: "1",
    HELIX_ASK_GOLDEN_PATH_RUNTIME: "0",
    LLM_POLICY: "http",
    LLM_RUNTIME: "http",
    DATABASE_URL: "pg-mem://replit-production-smoke",
    LLM_LOCAL_STOP_FLAG: "1",
    NOISEGEN_STORAGE_BACKEND: "memory",
    HELIX_BUILD_META_PATH: "dist/build-meta.json",
  };
};

const fetchWithTimeout = async (url, init = {}, requestTimeoutMs = 15_000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const readJson = async (baseUrl, pathname) => {
  const response = await fetchWithTimeout(`${baseUrl}${pathname}`, {
    headers: { Accept: "application/json" },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${pathname} returned HTTP ${response.status}: ${text.slice(0, 800)}`);
  return JSON.parse(text);
};

const waitForFingerprint = async ({ baseUrl, child, logs }) => {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`compiled server exited with code ${child.exitCode}\n${logs.value.slice(-12_000)}`);
    }
    try {
      return await readJson(baseUrl, "/api/agi/runtime-parity/fingerprint");
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error(`compiled server did not become ready: ${String(lastError)}\n${logs.value.slice(-12_000)}`);
};

const stopChild = async (child) => {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
  if (child.exitCode === null) child.kill("SIGKILL");
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const main = async () => {
  const metadataVerification = verifyReplitBuildMeta();
  if (!metadataVerification.ok) {
    throw new Error(`build metadata verification failed: ${metadataVerification.errors.join("; ")}`);
  }
  const meta = metadataVerification.meta;
  if (meta.git_authority?.strict === true) {
    assert(meta.git_authority?.verified === true, "strict build metadata is not Git-authority verified");
    assert(
      meta.git_authority?.worktree_clean_at_authority_check === true,
      "strict build metadata was not produced from a clean authoritative checkout",
    );
  }
  const port = await getFreePort();
  assert(typeof port === "number", "Failed to allocate a production smoke port.");
  const logs = { value: "" };
  const child = spawn(process.execPath, ["--max-old-space-size=4096", "dist/index.js"], {
    cwd: repoRoot,
    env: sanitizeEnvironment(port),
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  const appendLog = (chunk) => {
    logs.value = `${logs.value}${chunk.toString("utf8")}`.slice(-maxLogCharacters);
  };
  child.stdout.on("data", appendLog);
  child.stderr.on("data", appendLog);
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const fingerprint = await waitForFingerprint({ baseUrl, child, logs });
    const desktopResponse = await fetchWithTimeout(`${baseUrl}/desktop`);
    const desktopHtml = await desktopResponse.text();
    assert(desktopResponse.ok, `/desktop returned HTTP ${desktopResponse.status}`);
    assert(/<!doctype html/i.test(desktopHtml), "/desktop did not return the compiled client shell");
    assert(!/API routes are still mounting/i.test(desktopHtml), "/desktop returned the bootstrap fallback");

    const documentResponse = await fetchWithTimeout(`${baseUrl}/docs/helix-ask-flow.md`, {
      headers: { Accept: "text/markdown, text/plain" },
    });
    const documentText = await documentResponse.text();
    assert(documentResponse.ok, `/docs/helix-ask-flow.md returned HTTP ${documentResponse.status}`);
    assert(documentText.includes("# Helix Ask Flow"), "production Markdown route returned unexpected content");

    const session = await readJson(baseUrl, "/api/account/session");
    const pipeline = await readJson(baseUrl, "/api/helix/pipeline");
    assert(fingerprint.build?.execution_mode === "compiled_production", "fingerprint is not compiled_production");
    assert(
      fingerprint.build?.source_commit === meta.source.commit,
      `runtime commit ${String(fingerprint.build?.source_commit)} does not match build ${meta.source.commit}`,
    );
    assert(
      fingerprint.build?.server_bundle_commit === meta.source.commit,
      "running server bundle commit marker does not match build metadata",
    );
    assert(
      fingerprint.build?.client_bundle_build_id === meta.source.build_id,
      "compiled client build id does not match build metadata",
    );
    assert(
      fingerprint.build?.artifact_contract_sha256 === meta.artifact_contract_sha256,
      "runtime artifact contract does not match dist/build-meta.json",
    );
    assert(
      fingerprint.build?.client_tree_sha256 === meta.artifacts.client_tree.sha256,
      "runtime client tree fingerprint does not match dist/build-meta.json",
    );

    const result = {
      schema: "casimir.replit_production_smoke.v1",
      ok: true,
      source_commit: meta.source.commit,
      artifact_contract_sha256: meta.artifact_contract_sha256,
      experience_contract_sha256: fingerprint.experience_contract_sha256,
      deployment_contract_sha256: fingerprint.deployment_contract_sha256,
      git_authority: meta.git_authority,
      endpoints: {
        desktop: desktopResponse.status,
        documentation_markdown: documentResponse.status,
        account_session: session.ok === false ? "response_error" : 200,
        helix_pipeline: pipeline.ok === false ? "response_error" : 200,
        runtime_parity_fingerprint: 200,
      },
      secrets_injected: false,
    };
    const outputDirectory = path.resolve(
      repoRoot,
      process.env.REPLIT_PRODUCTION_SMOKE_OUT ?? "artifacts/replit-production-smoke",
    );
    await fs.mkdir(outputDirectory, { recursive: true });
    await fs.writeFile(path.join(outputDirectory, "latest.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log(`[replit] production smoke passed: commit=${result.source_commit} contract=${result.artifact_contract_sha256}`);
  } finally {
    await stopChild(child);
  }
};

main().catch((error) => {
  console.error(`[replit] production smoke failed: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
  process.exitCode = 1;
});
