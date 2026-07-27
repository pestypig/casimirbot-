import express, {
  type ErrorRequestHandler,
  type RequestHandler,
} from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  inferPublicRoomSourceIngressKind,
  publicRoomSourceIngressParserErrorHandler,
} from "../public-source-ingress";
import { projectRoomSourceRequestId } from "../../services/situation-room/room-source-ingress-security";

const downstreamErrorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  const candidate = error as {
    message?: unknown;
    status?: unknown;
    statusCode?: unknown;
    type?: unknown;
  };
  const status =
    typeof candidate.status === "number"
      ? candidate.status
      : typeof candidate.statusCode === "number"
        ? candidate.statusCode
        : 500;
  res.status(status).json({
    downstream: true,
    type: candidate.type ?? null,
    message: candidate.message ?? null,
  });
};

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json({ limit: "64b" }));
  const injectUnrelatedError: RequestHandler = (req, _res, next) => {
    if (req.get("x-test-unrelated-error") === "1") {
      next(new Error("unrelated"));
      return;
    }
    next();
  };
  app.use(injectUnrelatedError);
  app.use(publicRoomSourceIngressParserErrorHandler);
  app.post("*", (_req, res) => res.status(204).end());
  app.use(downstreamErrorHandler);
  return app;
};

const BINDING_ID = "room_source_binding:test";
const ingressPath = (suffix: string): string =>
  `/api/room-ingress/v1/bindings/${encodeURIComponent(BINDING_ID)}/${suffix}`;

describe("public room source ingress parser errors", () => {
  it.each([
    ["world-events/batch", "world_event_batch"],
    ["manifest", "manifest"],
    ["heartbeat", "heartbeat"],
    ["probes/pending", "probe_requests"],
    ["probes/result", "probe_result"],
    ["status", "status"],
  ] as const)("infers %s as %s", (suffix, kind) => {
    expect(inferPublicRoomSourceIngressKind(ingressPath(suffix))).toBe(kind);
  });

  it("returns a nonterminal ingress receipt for malformed JSON", async () => {
    const response = await request(createApp())
      .post(ingressPath("manifest"))
      .set("Content-Type", "application/json")
      .set("X-Helix-Request-Id", "request:valid_123")
      .send('{"broken":')
      .expect(400);

    expect(response.body).toEqual({
      schema: "helix.room_source_ingress_receipt.v1",
      ok: false,
      error: "room_source_payload_invalid",
      message: "Room source ingress payload contains malformed JSON.",
      binding_id: null,
      room_id: null,
      source_id: null,
      world_id: null,
      request_id: projectRoomSourceRequestId({
        bindingId: BINDING_ID,
        requestId: "request:valid_123",
      }),
      kind: "manifest",
      accepted: false,
      replayed: false,
      content_role: "source_observation_not_assistant_answer",
      reentry_required: true,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  });

  it("never echoes a bearer-shaped request id from parser failures", async () => {
    const bearer = `helix_room_src_${"z".repeat(43)}`;
    const response = await request(createApp())
      .post(ingressPath("manifest"))
      .set("Content-Type", "application/json")
      .set("X-Helix-Request-Id", bearer)
      .send('{"broken":')
      .expect(400);

    expect(response.body.request_id).toBe(
      projectRoomSourceRequestId({
        bindingId: BINDING_ID,
        requestId: bearer,
      }),
    );
    expect(JSON.stringify(response.body)).not.toContain(bearer);
  });

  it("never echoes a room-source claim from oversized parser failures", async () => {
    const claimHandle = `room_source_claim_${"c".repeat(43)}`;
    const response = await request(createApp())
      .post(ingressPath("world-events/batch"))
      .set("Content-Type", "application/json")
      .set("X-Helix-Request-Id", claimHandle)
      .send(JSON.stringify({ payload: "x".repeat(128) }))
      .expect(413);

    expect(response.body).toMatchObject({
      schema: "helix.room_source_ingress_receipt.v1",
      ok: false,
      error: "room_source_payload_too_large",
      request_id: projectRoomSourceRequestId({
        bindingId: BINDING_ID,
        requestId: claimHandle,
      }),
      kind: "world_event_batch",
      accepted: false,
      replayed: false,
      content_role: "source_observation_not_assistant_answer",
      reentry_required: true,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
    expect(JSON.stringify(response.body)).not.toContain(claimHandle);
  });

  it("passes parser failures on other routes through unchanged", async () => {
    const response = await request(createApp())
      .post("/api/not-room-ingress")
      .set("Content-Type", "application/json")
      .send('{"broken":')
      .expect(400);

    expect(response.body).toMatchObject({
      downstream: true,
      type: "entity.parse.failed",
    });
  });

  it("passes unrelated errors on ingress routes through unchanged", async () => {
    const response = await request(createApp())
      .post(ingressPath("heartbeat"))
      .set("X-Test-Unrelated-Error", "1")
      .expect(500);

    expect(response.body).toEqual({
      downstream: true,
      type: null,
      message: "unrelated",
    });
  });
});
