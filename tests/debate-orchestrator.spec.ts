import { describe, it, expect, beforeEach } from "vitest";
import {
  __resetDebateStore,
  getDebateSnapshot,
  startDebate,
  type DebateSnapshot,
} from "../server/services/debate/orchestrator";

const waitFor = async <T>(fn: () => T | null, timeoutMs = 4000, stepMs = 20): Promise<T> => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const result = fn();
    if (result) {
      return result;
    }
    await new Promise((resolve) => setTimeout(resolve, stepMs));
  }
  throw new Error("timeout");
};

describe("debate orchestrator", () => {
  beforeEach(() => {
    __resetDebateStore();
  });

  it("produces turns and a verdict within configured bounds", async () => {
    const { debateId } = await startDebate({
      goal: "Should we prefer math.expr or math.sum for small programs?",
      persona_id: "persona:test",
      max_rounds: 2,
      max_wall_ms: 3000,
      verifiers: ["math.sympy.verify"],
    });

    const snapshot = await waitFor<DebateSnapshot | null>(() => {
      const snap = getDebateSnapshot(debateId);
      if (!snap) return null;
      const hasReferee = snap.turns.some((turn) => turn.role === "referee");
      if (hasReferee && snap.outcome) {
        return snap;
      }
      return null;
    });

    const proponentTurns = snapshot.turns.filter((turn) => turn.role === "proponent");
    const skepticTurns = snapshot.turns.filter((turn) => turn.role === "skeptic");
    expect(proponentTurns.length).toBeGreaterThan(0);
    expect(skepticTurns.length).toBeGreaterThan(0);
    expect(snapshot.outcome).not.toBeNull();
    expect(typeof snapshot.outcome?.verdict).toBe("string");
  });
});
