import { expect, it } from "vitest";
import { helixEnvironmentSessionMcpSchema, helixEnvironmentSessionMcpCommandSchema } from "../helix-environment-session-request";

const selection = {
  client_continuation_ref: "task:a", reasoning_binding_id: "binding:a",
  binding_epoch: 1, helix_conversation_id: "chat:a", mission_id: null,
  run_id: "run:a", request_id: "request:a",
};

it("requires an exclusive caller-authored creation or existing-run selection for preparation", () => {
  const base = { operation: "prepare_run", client_continuation_ref: "task:a", intent_id: "intent:a" };
  for (const choice of [{ run_id: "run:a" }, { objective: "Prepare session" }]) {
    expect(helixEnvironmentSessionMcpCommandSchema.safeParse({ ...base, ...choice }).success).toBe(true);
  }
  for (const choice of [{}, { run_id: "run:a", objective: "Prepare" }, { objective: "Prepare", room_id: "foreign" },
    { objective: "Prepare", requested_duration_seconds: 604800 }]) {
    expect(helixEnvironmentSessionMcpCommandSchema.safeParse({ ...base, ...choice }).success).toBe(false);
  }
});

it("accepts pre-binding discovery but rejects identity and preparation overrides", () => {
  const discovery = { operation: "discover_runs", client_continuation_ref: "task:a", room_id: "room:a" };
  expect(helixEnvironmentSessionMcpCommandSchema.parse(discovery)).toEqual(discovery);
  for (const extra of [{ profile_id: "foreign" }, { participant_id: "foreign" },
    { run_id: "run:override" }, { request_id: "request:a" }, { reasoning_binding_id: "binding:a" }]) {
    expect(helixEnvironmentSessionMcpCommandSchema.safeParse({ ...discovery, ...extra }).success).toBe(false);
  }
});

it("publishes object fields and accepts exact automatic preparation", () => {
  expect(helixEnvironmentSessionMcpSchema.shape.request_id).toBeDefined();
  expect(helixEnvironmentSessionMcpCommandSchema.parse(selection)).toEqual(selection);
});

it.each([
  { ...selection, profile_id: "foreign" },
  { ...selection, room_id: "room:override" },
  { ...selection, request_id: undefined },
  { ...selection, client_continuation_ref: undefined },
  { ...selection, run_id: undefined },
  { ...selection, binding_epoch: 0 },
])("rejects mixed, incomplete or caller-owned identity arguments %#", input => {
  expect(helixEnvironmentSessionMcpCommandSchema.safeParse(input).success).toBe(false);
});
