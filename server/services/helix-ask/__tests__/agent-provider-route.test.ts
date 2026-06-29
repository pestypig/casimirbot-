import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { agentProvidersRouter } from "../../../routes/agi.agent-providers";

const ENV_KEYS = [
  "HELIX_ASK_AGENT_RUNTIME",
  "ENABLE_CODEX_AGENT",
  "ENABLE_FUTURE_AGENT",
] as const;
const originalEnv = new Map<string, string | undefined>();

for (const key of ENV_KEYS) {
  originalEnv.set(key, process.env[key]);
}

afterEach(() => {
  for (const key of ENV_KEYS) {
    const original = originalEnv.get(key);
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  }
});

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json({ limit: "256kb" }));
  app.use("/api/agi", agentProvidersRouter);
  return app;
};

describe("AGI agent provider route", () => {
  it("lists provider descriptors and resolves the default through provider availability", async () => {
    delete process.env.HELIX_ASK_AGENT_RUNTIME;
    delete process.env.ENABLE_CODEX_AGENT;
    delete process.env.ENABLE_FUTURE_AGENT;

    const response = await request(createApp())
      .get("/api/agi/agent-providers")
      .expect(200);

    expect(response.body).toMatchObject({
      schema: "helix.agent_providers.v1",
      default_provider: "helix",
      default_provider_label: "Helix Ask Native",
    });
    expect(response.body.providers).toContainEqual(
      expect.objectContaining({
        id: "helix",
        enabled: true,
        experimental: false,
        permission_profile: expect.objectContaining({
          id: "helix-native",
        }),
      }),
    );
    expect(response.body.providers).toContainEqual(
      expect.objectContaining({
        id: "codex",
        enabled: true,
        experimental: true,
        permission_profile: expect.objectContaining({
          id: "read-observe-act",
          allows: expect.objectContaining({
            read: true,
            act: true,
            write: false,
            shell: false,
            codeMutation: false,
          }),
        }),
        runtime_status: expect.objectContaining({
          launchable: expect.any(Boolean),
          args: expect.any(Array),
        }),
      }),
    );
    expect(response.body.providers).toContainEqual(
      expect.objectContaining({
        id: "future",
        enabled: false,
        experimental: true,
        permission_profile: expect.objectContaining({
          id: "read-observe",
        }),
      }),
    );
  });

  it("advertises enabled Codex and Future defaults only when their providers are enabled", async () => {
    process.env.HELIX_ASK_AGENT_RUNTIME = "codex";
    delete process.env.ENABLE_CODEX_AGENT;

    const codexResponse = await request(createApp())
      .get("/api/agi/agent-providers")
      .expect(200);

    expect(codexResponse.body).toMatchObject({
      default_provider: "codex",
      default_provider_label: "Codex Workstation Mode",
    });
    expect(codexResponse.body.providers).toContainEqual(
      expect.objectContaining({
        id: "codex",
        enabled: true,
      }),
    );

    process.env.HELIX_ASK_AGENT_RUNTIME = "future";
    process.env.ENABLE_FUTURE_AGENT = "1";

    const futureResponse = await request(createApp())
      .get("/api/agi/agent-providers")
      .expect(200);

    expect(futureResponse.body).toMatchObject({
      default_provider: "future",
      default_provider_label: "Future Agent Wrapper",
    });
    expect(futureResponse.body.providers).toContainEqual(
      expect.objectContaining({
        id: "future",
        enabled: true,
        permission_profile: expect.objectContaining({
          id: "read-observe",
        }),
      }),
    );
  });
});
