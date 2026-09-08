import { expect, it } from "vitest";
import { helixEnvironmentSessionMcpSchema, helixEnvironmentSessionMcpCommandSchema } from "../helix-environment-session-request";

const selection = {
  client_continuation_ref: "task:a", reasoning_binding_id: "binding:a",
  binding_epoch: 1, helix_conversation_id: "chat:a", mission_id: null,
  run_id: "run:a", request_id: "request:a",
};

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
