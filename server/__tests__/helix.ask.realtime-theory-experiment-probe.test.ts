import { describe, expect, it } from "vitest";

import {
  THEORY_EXPERIMENT_PROCEDURE_REALTIME_SCENARIO,
  isLoopbackRealtimeDocBaseUrl,
  resolveRealtimeDocProbeScenario,
} from "../../scripts/helix-ask-realtime-doc-conversation-probe";

describe("Helix Ask Realtime theory experiment probe contract", () => {
  it("permits automatic developer probe sessions only on loopback URLs", () => {
    expect(isLoopbackRealtimeDocBaseUrl("http://127.0.0.1:1522")).toBe(true);
    expect(isLoopbackRealtimeDocBaseUrl("http://localhost:1498")).toBe(true);
    expect(isLoopbackRealtimeDocBaseUrl("http://[::1]:1522")).toBe(true);
    expect(isLoopbackRealtimeDocBaseUrl("https://casimirbot.example")).toBe(false);
    expect(isLoopbackRealtimeDocBaseUrl("not-a-url")).toBe(false);
  });

  it("selects a developer-only two-turn procedure continuation", () => {
    const scenario = resolveRealtimeDocProbeScenario(
      "theory-experiment-procedure",
    );

    expect(scenario).toBe(THEORY_EXPERIMENT_PROCEDURE_REALTIME_SCENARIO);
    expect(scenario).toMatchObject({
      requiresDeveloper: true,
      focusPanelId: "workflow-demo-lab",
    });
    expect(scenario?.turns).toHaveLength(2);
    expect(scenario?.turns.map((turn) => turn.expectedCapabilities)).toEqual([
      ["theory-experiment-procedure.prepare"],
      ["theory-experiment-procedure.prepare"],
    ]);
    expect(scenario?.turns.every((turn) => turn.requireGroundedVoiceRelay))
      .toBe(true);
    expect(scenario?.turns[1]?.prompt).toMatch(/continue|same comparison/i);
    expect(scenario?.turns[1]?.prompt).toMatch(/current for this turn/i);
    expect(scenario?.turns[1]?.prompt).toMatch(/not proof|not.*validation/i);
  });

  it("leaves legacy scenario dispatch untouched", () => {
    expect(resolveRealtimeDocProbeScenario("conversation")).toBeNull();
    expect(resolveRealtimeDocProbeScenario("nhm-doc")).toBeNull();
  });
});
