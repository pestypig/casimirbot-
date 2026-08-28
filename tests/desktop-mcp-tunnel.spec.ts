import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildMcpTunnelEnvironment,
  DesktopMcpTunnelController,
  parseMcpTunnelCredentials,
  type SecureStoragePort,
} from "../apps/desktop/src/mcp-tunnel";
import { parseDesktopMcpTunnelState } from "../shared/desktop-mcp-tunnel";

const roots: string[] = [];
const validCredentials = {
  tunnelId: "tunnel_0123456789abcdef0123456789abcdef",
  runtimeApiKey: "sk-runtime_test_0123456789abcdef",
};

const fakeStorage: SecureStoragePort = {
  isEncryptionAvailable: () => true,
  encryptString: (value) => Buffer.from(`encrypted:${value}`, "utf16le"),
  decryptString: (value) => {
    const decoded = value.toString("utf16le");
    if (!decoded.startsWith("encrypted:")) throw new Error("invalid ciphertext");
    return decoded.slice("encrypted:".length);
  },
};

const makeController = async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "casimir-mcp-tunnel-"));
  roots.push(root);
  const binaryPath = path.join(root, "tunnel-client.exe");
  const bytes = Buffer.from("verified tunnel binary fixture");
  await writeFile(binaryPath, bytes);
  return {
    root,
    controller: new DesktopMcpTunnelController({
      binaryPath,
      expectedBinarySha256: createHash("sha256").update(bytes).digest("hex"),
      binaryVersion: "test",
      userDataPath: root,
      runtimeOrigin: "http://127.0.0.1:43123",
      desktopSessionSecret: "desktop-secret-that-never-leaves-the-child-environment",
      storage: fakeStorage,
    }),
  };
};

describe("desktop Secure MCP Tunnel boundary", () => {
  afterEach(async () => {
    await Promise.all(
      roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
    );
  });

  it("admits only the exact tunnel ID and restricted runtime-key shape", () => {
    expect(parseMcpTunnelCredentials(validCredentials)).toEqual(validCredentials);
    expect(() =>
      parseMcpTunnelCredentials({ ...validCredentials, tunnelId: "organization-secret" }),
    ).toThrow();
    expect(() =>
      parseMcpTunnelCredentials({ ...validCredentials, runtimeApiKey: "admin key" }),
    ).toThrow();
    expect(() =>
      parseMcpTunnelCredentials({ ...validCredentials, extra: "not admitted" }),
    ).toThrow();
  });

  it("builds a narrow child environment without ambient OpenAI, database, proxy, or Node secrets", () => {
    const environment = buildMcpTunnelEnvironment({
      processEnv: {
        SystemRoot: "C:\\Windows",
        TEMP: "C:\\Temp",
        PATH: "untrusted-path",
        OPENAI_API_KEY: "ambient-openai-secret",
        OPENAI_ADMIN_KEY: "ambient-admin-secret",
        DATABASE_URL: "database-secret",
        NODE_OPTIONS: "--inspect",
        HTTPS_PROXY: "http://user:password@proxy.invalid",
      },
      credentials: validCredentials,
      runtimeOrigin: "http://127.0.0.1:43123",
      desktopSessionSecret: "desktop-session-secret",
      healthUrlFile: "C:\\state\\health.url",
    });

    expect(environment).toMatchObject({
      SystemRoot: "C:\\Windows",
      CONTROL_PLANE_TUNNEL_ID: validCredentials.tunnelId,
      CONTROL_PLANE_API_KEY: validCredentials.runtimeApiKey,
      MCP_SERVER_URL:
        "http://127.0.0.1:43123/mcp/local-supervisor-coordination",
      MCP_EXTRA_HEADERS:
        "X-Casimir-Desktop-Session: env:CASIMIR_TUNNEL_DESKTOP_SESSION_SECRET",
      MCP_DISCOVERY_EXTRA_HEADERS:
        "X-Casimir-Desktop-Session: env:CASIMIR_TUNNEL_DESKTOP_SESSION_SECRET",
      HEALTH_LISTEN_ADDR: "127.0.0.1:0",
      ALLOW_REMOTE_UI: "false",
    });
    for (const excluded of [
      "PATH",
      "OPENAI_API_KEY",
      "OPENAI_ADMIN_KEY",
      "DATABASE_URL",
      "NODE_OPTIONS",
      "HTTPS_PROXY",
    ]) {
      expect(environment).not.toHaveProperty(excluded);
    }
  });

  it("stores credentials only through the OS-bound vault and never projects them into state", async () => {
    const { root, controller } = await makeController();
    expect(controller.getState()).toMatchObject({
      status: "unconfigured",
      configured: false,
      vaultAvailable: true,
      binaryVersion: "test",
    });
    const state = controller.configure(validCredentials);
    expect(parseDesktopMcpTunnelState(state)).toEqual(state);
    expect(state).toMatchObject({ status: "stopped", configured: true });
    expect(state.scope).toBe(
      "local_supervisor_coordination_and_device_check",
    );
    expect(JSON.stringify(state)).not.toContain(validCredentials.tunnelId);
    expect(JSON.stringify(state)).not.toContain(validCredentials.runtimeApiKey);

    const vault = await readFile(
      path.join(root, "mcp-tunnel", "credentials.dpapi"),
    );
    expect(vault.toString("utf8")).not.toContain(validCredentials.runtimeApiKey);

    const cleared = await controller.clear();
    expect(cleared).toMatchObject({ status: "unconfigured", configured: false });
  });

  it("fails closed when the bundled executable hash is wrong", async () => {
    const { root } = await makeController();
    const binaryPath = path.join(root, "tampered.exe");
    await writeFile(binaryPath, "tampered");
    const controller = new DesktopMcpTunnelController({
      binaryPath,
      expectedBinarySha256: "0".repeat(64),
      binaryVersion: "test",
      userDataPath: root,
      runtimeOrigin: "http://127.0.0.1:43123",
      desktopSessionSecret: "desktop-session-secret-long-enough",
      storage: fakeStorage,
    });
    expect(controller.getState()).toMatchObject({
      status: "blocked",
      failureCode: "binary_invalid",
      binaryVersion: null,
    });
  });
});
