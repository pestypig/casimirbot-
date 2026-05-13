import { beforeEach, describe, expect, it } from "vitest";
import { useWorkstationActionExecutionStore } from "@/store/useWorkstationActionExecutionStore";

describe("useWorkstationActionExecutionStore", () => {
  beforeEach(() => {
    useWorkstationActionExecutionStore.getState().reset();
  });

  it("records lifecycle status, receipt, and state observation", () => {
    const execution = useWorkstationActionExecutionStore.getState().startExecution({
      panel_id: "scientific-calculator",
      action_id: "solve_with_steps",
      affordance_id: "scientific-calculator.solve_with_steps",
      args: { expression: "x^2-4=0" },
    });

    useWorkstationActionExecutionStore.getState().markStatus(execution.execution_id, "dispatched");
    useWorkstationActionExecutionStore.getState().observeState(execution.execution_id, { proof: "artifact" });
    useWorkstationActionExecutionStore.getState().attachReceipt(execution.execution_id, {
      schema: "helix.workstation_action_receipt.v1",
      ok: true,
    });
    useWorkstationActionExecutionStore.getState().markStatus(execution.execution_id, "completed");

    const stored = useWorkstationActionExecutionStore.getState().executions[execution.execution_id];
    expect(stored.status).toBe("completed");
    expect(stored.state_observed).toBe(true);
    expect(stored.receipt).toEqual(expect.objectContaining({ ok: true }));
  });
});

