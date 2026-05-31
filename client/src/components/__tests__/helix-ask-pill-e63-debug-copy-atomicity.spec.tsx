import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";

let copyDebugPayloadToClipboard: typeof import("@/components/helix/HelixAskPill").copyDebugPayloadToClipboard;

beforeAll(async () => {
  (globalThis as Record<string, unknown>).__HELIX_ASK_JOB_TIMEOUT_MS__ = "1200000";
  ({ copyDebugPayloadToClipboard } = await import("@/components/helix/HelixAskPill"));
});

describe("Helix Ask E63 debug copy atomicity", () => {
  it("copies a nonempty parseable debug payload on the first write", async () => {
    const originalNavigator = globalThis.navigator;
    const writes: string[] = [];
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        clipboard: {
          writeText: vi.fn(async (text: string) => {
            writes.push(text);
          }),
          readText: vi.fn(async () => writes.at(-1) ?? ""),
        },
      },
    });

    const payload = JSON.stringify({
      active_turn_id: "turn-e63",
      selected_final_answer: "visible final",
      visible_projection_invariant: {
        violations: [],
      },
    });
    const result = await copyDebugPayloadToClipboard(payload);

    expect(result.ok).toBe(true);
    expect(result.copied_text_length).toBeGreaterThan(0);
    expect(writes).toHaveLength(1);
    expect(JSON.parse(writes[0] ?? "{}")).toMatchObject({
      active_turn_id: "turn-e63",
      selected_final_answer: "visible final",
    });

    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: originalNavigator,
    });
  });

  it("keeps the debug copy button single-shot instead of pointer-down plus click", () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "client/src/components/helix/HelixAskPill.tsx"),
      "utf8",
    );

    expect(source).toContain("debugCopyInFlightRef");
    expect(source).not.toContain("onPointerDown={() => void handleCopyReplyMasterDebug");
  });
});
