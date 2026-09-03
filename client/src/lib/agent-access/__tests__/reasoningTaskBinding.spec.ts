// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { resolveReasoningSteeringConversationId } from
  "../reasoningTaskBinding";

describe("reasoning steering conversation selection", () => {
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
