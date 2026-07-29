import crypto from "node:crypto";
import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetDbClient } from "../../db/client";
import {
  environmentConnectorBrowserRouter,
  environmentConnectorPublicRouter,
} from "../environment-connector-platform";

describe("environment connector REST boundary", () => {
  beforeEach(async () => {
    vi.stubEnv(
      "DATABASE_URL",
      `pg-mem://environment-connector-route-${crypto.randomUUID()}`,
    );
    vi.stubEnv("HELIX_LOCAL_PG_MEM_PERSIST", "0");
    await resetDbClient();
  });

  afterEach(async () => {
    await resetDbClient();
    vi.unstubAllEnvs();
  });

  const app = () => {
    const instance = express();
    instance.use(environmentConnectorPublicRouter);
    instance.use("/api/agi", environmentConnectorBrowserRouter);
    return instance;
  };

  it("publishes package-only directory records with independent trust axes", async () => {
    const response = await request(app())
      .get("/api/environment-connectors/v1/directory/packages")
      .expect(200);
    expect(response.body).toMatchObject({
      schema: "helix.environment_connector.directory.v1",
      trust_axes: [
        "package_provenance",
        "security_review",
        "runtime_connection_health",
        "observation_quality",
      ],
      private_installation_data_included: false,
      user_evidence_included: false,
    });
    expect(response.body.packages).toHaveLength(3);
    expect(JSON.stringify(response.body)).not.toMatch(
      /owner_profile_id|room_id|device_credential|environment_binding_id/,
    );
  });

  it("returns typed bounded parser and device-credential failures", async () => {
    const malformed = await request(app())
      .post("/api/environment-connectors/v1/pairing/start")
      .set("content-type", "application/json")
      .send('{"bad":')
      .expect(400);
    expect(malformed.body).toMatchObject({
      error: "environment_connector_payload_invalid",
      credential_included: false,
    });

    const oversized = await request(app())
      .post("/api/environment-connectors/v1/pairing/start")
      .set("content-type", "application/json")
      .send({
        padding: "x".repeat(70_000),
      })
      .expect(413);
    expect(oversized.body).toMatchObject({
      error: "environment_connector_payload_too_large",
      credential_included: false,
      terminal_eligible: false,
    });

    const unauthorized = await request(app())
      .get("/api/environment-connectors/v1/device/probes/pending")
      .expect(401);
    expect(unauthorized.body).toMatchObject({
      error: "device_credential_invalid",
      credential_included: false,
      raw_content_included: false,
    });
  });

  it("requires exact same-origin browser context before pairing approval", async () => {
    const response = await request(app())
      .post("/api/agi/environment-connectors/pairing/approve")
      .set("content-type", "application/json")
      .send({
        user_code: "ABCD-EFGH",
        room_id: "shared_realtime_room:test",
        room_source_binding_id: "room_source_binding:test",
        approved_capability_ids: ["com.casimirbot.minecraft.inventory.check"],
      })
      .expect(403);
    expect(response.body.error).toBe(
      "environment_connector_browser_cross_origin_forbidden",
    );
  });
});
