// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { issueReasoningBindingClaim, resolveReasoningSteeringConversationId } from
  "../reasoningTaskBinding";

describe("reasoning steering conversation selection", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("carries only an explicit run selection in the browser claim request", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({
      claim_handle: "test-handle", binding: { reasoning_binding_id: "binding-test",
        helix_conversation_id: "chat-test", binding_epoch: 1, status: "pending_claim",
        continuation_transport: "polling" },
    }), { status: 201 }));
    vi.stubGlobal("fetch", fetch);
    const input = { clientSessionRef: "client-test", helixConversationId: "chat-test" };
    await issueReasoningBindingClaim(input);
    expect(JSON.parse((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as string))
      .toEqual({ client_session_ref: "client-test", helix_conversation_id: "chat-test" });
    await issueReasoningBindingClaim({ ...input,
      runAssociation: { run_id: "run-test", verification_ref: "verification-test" } });
    expect(JSON.parse((fetch.mock.calls[1] as unknown as [string, RequestInit])[1].body as string))
      .toEqual({ client_session_ref: "client-test", helix_conversation_id: "chat-test",
        run_id: "run-test", run_verification_ref: "verification-test" });
  });

  it("uses the operator-selected chat before the shell context fallback", () => {
    expect(resolveReasoningSteeringConversationId(
      "selected-chat",
      "context-chat",
    )).toBe("selected-chat");
  });

  it("uses the shell context only when no chat is selected", () => {
    expect(resolveReasoningSteeringConversationId(null, "context-chat"))
      .toBe("context-chat");
  });
});
