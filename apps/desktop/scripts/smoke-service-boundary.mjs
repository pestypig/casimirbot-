import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const desktopRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const repoRoot = path.resolve(desktopRoot, "..", "..");
const serverEntry = path.join(desktopRoot, "dist", "service.mjs");
const sessionHeader = "X-Casimir-Desktop-Session";
const secret = randomBytes(32).toString("base64url");

const reserveLoopbackPort = () =>
  new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Unable to reserve smoke-test port"));
        return;
      }
      server.close((error) =>
        error ? reject(error) : resolve(address.port),
      );
    });
  });

const isolatedEnvironment = () => {
  const keys = [
    "SystemRoot",
    "WINDIR",
    "COMSPEC",
    "PATHEXT",
    "PATH",
    "TEMP",
    "TMP",
    "USERPROFILE",
    "APPDATA",
    "LOCALAPPDATA",
    "PROGRAMDATA",
    "PROCESSOR_ARCHITECTURE",
    "NUMBER_OF_PROCESSORS",
  ];
  const env = {};
  for (const key of keys) {
    if (process.env[key]) env[key] = process.env[key];
  }
  return env;
};

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const waitForServiceReady = async (origin, child) => {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Desktop smoke child exited with ${child.exitCode}`);
    }
    try {
      const response = await fetch(`${origin}/api/ready`, {
        headers: { [sessionHeader]: secret },
        signal: AbortSignal.timeout(1_000),
      });
      if (response.status === 200) return;
    } catch {}
    await delay(200);
  }
  throw new Error("Desktop smoke child did not finish mounting API routes");
};

const expectStatus = async (url, expected, headers = {}) => {
  const response = await fetch(url, {
    cache: "no-store",
    headers,
    signal: AbortSignal.timeout(2_000),
  });
  if (response.status !== expected) {
    throw new Error(
      `Expected ${expected} from ${new URL(url).pathname}, received ${response.status}`,
    );
  }
  return response;
};

await access(serverEntry);
const smokeStateRoot = await mkdtemp(
  path.join(tmpdir(), "casimir-desktop-smoke-"),
);
const localDatabasePath = path.join(
  smokeStateRoot,
  "state",
  "helix-local-pg-mem.json",
);
const port = await reserveLoopbackPort();
const origin = `http://127.0.0.1:${port}`;
let captured = "";
const child = spawn(
  process.execPath,
  ["--max-old-space-size=1024", serverEntry],
  {
    cwd: repoRoot,
    env: {
      ...isolatedEnvironment(),
      NODE_ENV: "production",
      HOST: "0.0.0.0",
      PORT: String(port),
      FAST_BOOT: "0",
      SKIP_MODULE_INIT: "1",
      SKIP_VITE_MIDDLEWARE: "1",
      CASIMIR_DESKTOP_HOST: "1",
      CASIMIR_DESKTOP_SESSION_SECRET: secret,
      CASIMIR_SKIP_LOCAL_ENV_FILE: "1",
      HELIX_LOCAL_DB_PATH: localDatabasePath,
      HELIX_LOCAL_PG_MEM_PERSIST: "1",
      HELIX_LOCAL_PG_MEM_WRITE_MODE: "immediate",
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  },
);

const capture = (chunk) => {
  if (captured.length >= 12_000) return;
  captured += String(chunk).replaceAll(secret, "[redacted]");
};
child.stdout.on("data", capture);
child.stderr.on("data", capture);

try {
  await waitForServiceReady(origin, child);
  await expectStatus(`${origin}/health`, 401);
  await expectStatus(`${origin}/health`, 401, {
    [sessionHeader]: `${secret}-wrong`,
  });
  await expectStatus(`${origin}/health`, 200, {
    [sessionHeader]: secret,
  });
  const version = await expectStatus(`${origin}/version`, 200, {
    [sessionHeader]: secret,
  });
  const payload = await version.json();
  if (!payload || payload.service !== "casimirbot") {
    throw new Error("Desktop version response did not identify CasimirBot");
  }
  const releaseStatus = await expectStatus(
    `${origin}/api/desktop-release/latest`,
    200,
    { [sessionHeader]: secret },
  );
  if (!releaseStatus.headers.get("cache-control")?.includes("no-store")) {
    throw new Error("Desktop release status response was cacheable");
  }
  const releasePayload = await releaseStatus.json();
  const expectedReleasePayload = JSON.stringify({
    schemaVersion: "casimir_desktop_release_status/1",
    available: false,
    approved: false,
    reason: "not_configured",
  });
  if (JSON.stringify(releasePayload) !== expectedReleasePayload) {
    throw new Error("Desktop release status did not fail closed");
  }

  const signInResponse = await fetch(`${origin}/api/account/session/sign-in`, {
    method: "POST",
    cache: "no-store",
    headers: {
      [sessionHeader]: secret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      profile_id: "desktop-smoke-owner",
      display_name: "Desktop Smoke Owner",
    }),
    signal: AbortSignal.timeout(5_000),
  });
  if (signInResponse.status !== 200) {
    throw new Error(
      `Expected 200 from desktop local sign-in, received ${signInResponse.status}`,
    );
  }
  const setCookie = signInResponse.headers.get("set-cookie") ?? "";
  const sessionCookie = setCookie.split(";", 1)[0];
  if (!sessionCookie.startsWith("helix_session=")) {
    throw new Error("Desktop local sign-in did not issue a Helix session cookie");
  }
  const sessionPayload = await signInResponse.json();
  if (
    sessionPayload?.session?.profile?.account_type !== "user" ||
    sessionPayload?.session?.profile?.profile_id !== "desktop-smoke-owner"
  ) {
    throw new Error("Desktop local sign-in did not preserve the public user boundary");
  }

  await expectStatus(
    `${origin}/api/agi/environment-connectors/devices`,
    403,
    {
      [sessionHeader]: secret,
      Cookie: sessionCookie,
    },
  );
  await access(localDatabasePath);
  const snapshot = await readFile(localDatabasePath, "utf8");
  if (
    !snapshot.includes('"schema":"helix.local_pg_mem_snapshot.v1"') ||
    !snapshot.includes("desktop-smoke-owner")
  ) {
    throw new Error("Desktop local session was not written to the isolated snapshot");
  }
  if (snapshot.includes(secret)) {
    throw new Error("Desktop session boundary secret entered the local database snapshot");
  }
  console.log(
    `[desktop-smoke] PASS loopback=${origin} missing=401 wrong=401 authorized=200 release=closed local_state=isolated device_check=policy_closed`,
  );
} catch (error) {
  if (captured.trim()) console.error(captured.trim());
  throw error;
} finally {
  if (child.exitCode === null) child.kill();
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    delay(5_000),
  ]);
  await rm(smokeStateRoot, {
    recursive: true,
    force: true,
    maxRetries: 3,
    retryDelay: 100,
  });
}
