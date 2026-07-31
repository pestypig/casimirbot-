import { describe, expect, it } from "vitest";
import { describeHelixAskRealtimeFailure } from "@/components/helix/ask-console/HelixAskRealtimeFailurePresentation";

describe("Helix Ask Realtime failure presentation", () => {
  it.each([
    [
      "openai_realtime_authentication_failed_invalid_api_key",
      "OpenAI rejected the Realtime credential",
      false,
    ],
    ["openai_realtime_access_forbidden", "OpenAI denied Realtime access", false],
    ["openai_realtime_rate_limited", "OpenAI Realtime is rate limited", true],
    [
      "openai_realtime_transport_network_error",
      "OpenAI Realtime could not be reached",
      true,
    ],
    ["microphone_permission_denied", "Microphone permission was denied", true],
    [
      "openai_realtime_provider_http_400_invalid_request_error",
      "OpenAI rejected the Realtime session setup",
      false,
    ],
  ] as const)("maps %s to an actionable typed status", (code, label, retryable) => {
    expect(describeHelixAskRealtimeFailure(code)).toMatchObject({
      code,
      label,
      retryable,
    });
  });

  it("does not project arbitrary provider text into the visible failure code", () => {
    expect(describeHelixAskRealtimeFailure("invalid key: sk-sensitive-material")).toEqual({
      code: "realtime_session_start_failed",
      label: "GPT Live could not start",
      detail: "Review the typed Realtime failure in Helix diagnostics, then retry after correcting it.",
      retryable: false,
    });
  });

  it("returns no presentation when no failure exists", () => {
    expect(describeHelixAskRealtimeFailure(null)).toBeNull();
    expect(describeHelixAskRealtimeFailure("  ")).toBeNull();
  });
});
