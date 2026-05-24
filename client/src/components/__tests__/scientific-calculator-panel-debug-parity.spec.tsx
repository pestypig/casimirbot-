import { describe, expect, it } from "vitest";

import { resolveScientificCalculatorVisibleDebugEvents } from "@/components/panels/ScientificCalculatorPanel";
import type { ScientificCalculatorDebugEvent } from "@/store/useScientificCalculatorStore";

const event = (
  id: string,
  compoundRunId: string | null,
  compoundSubgoalId: string | null,
): ScientificCalculatorDebugEvent => ({
  id,
  ts: `2026-05-24T00:00:0${id}.000Z`,
  panel_id: "scientific-calculator",
  action_id: "solve_expression",
  source: "workstation_action",
  ok: true,
  input_latex: `x+${id}`,
  compound_run_id: compoundRunId,
  compound_subgoal_id: compoundSubgoalId,
});

describe("ScientificCalculatorPanel debug parity filtering", () => {
  it("shows only the current compound run in the visible debug event state", () => {
    const state = resolveScientificCalculatorVisibleDebugEvents([
      event("3", "compound:new", "sg:2"),
      event("2", "compound:old", "sg:1"),
      event("1", null, null),
    ]);

    expect(state.currentCompoundRunId).toBe("compound:new");
    expect(state.visibleEvents.map((entry) => entry.id)).toEqual(["3"]);
    expect(state.visibleCompoundRunIds).toEqual(["compound:new"]);
    expect(state.staleCompoundRunVisible).toBe(false);
  });

  it("falls back to normal event history when no compound run exists", () => {
    const state = resolveScientificCalculatorVisibleDebugEvents([event("2", null, null), event("1", null, null)], 1);

    expect(state.currentCompoundRunId).toBeNull();
    expect(state.visibleEvents.map((entry) => entry.id)).toEqual(["2"]);
    expect(state.visibleCompoundRunIds).toEqual([]);
    expect(state.staleCompoundRunVisible).toBe(false);
  });
});
