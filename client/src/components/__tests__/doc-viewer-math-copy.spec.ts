import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  dispatchScientificCalculatorMathPicked,
  type ScientificCalculatorMathPickedDetail
} from "@/lib/scientific-calculator/events";

let handleDocMathPick: typeof import("@/components/DocViewerPanel").handleDocMathPick;

beforeAll(async () => {
  (globalThis as Record<string, unknown>).__HELIX_ASK_JOB_TIMEOUT_MS__ = "1200000";
  ({ handleDocMathPick } = await import("@/components/DocViewerPanel"));
});

describe("doc viewer math interaction", () => {
  it("dispatches scientific calculator ingest event and copies latex", () => {
    const clipboardWrite = vi.fn(async () => undefined);
    const events: ScientificCalculatorMathPickedDetail[] = [];
    const dispatch = vi.fn((detail: { latex: string; sourcePath: string | null; anchor: string | null }) => {
      events.push(
        dispatchScientificCalculatorMathPicked({
          latex: detail.latex,
          sourcePath: detail.sourcePath,
          anchor: detail.anchor,
        }),
      );
    });

    handleDocMathPick({
      latex: "x^2-4=0",
      currentPath: "/docs/research/sample.md",
      anchor: "eq-1",
      clipboardWrite,
      dispatchEvent: dispatch,
    });

    expect(clipboardWrite).toHaveBeenCalledWith("x^2-4=0");
    expect(dispatch).toHaveBeenCalledOnce();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      latex: "x^2-4=0",
      sourcePath: "/docs/research/sample.md",
      anchor: "eq-1",
    });
  });
});
