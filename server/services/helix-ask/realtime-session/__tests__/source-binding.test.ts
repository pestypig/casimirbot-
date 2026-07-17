import { describe, expect, it } from "vitest";
import {
  mergeRealtimeWorkstationSourceBinding,
  readSafeRealtimeSourceBinding,
} from "../source-binding";

describe("Realtime workstation source binding", () => {
  it("refreshes panel/document context without replacing the admitted source identity", () => {
    expect(mergeRealtimeWorkstationSourceBinding({
      base: {
        thread_id: "helix-ask:desktop",
        source_id: "helix-ask:desktop",
        source_kind: "helix_ask_workstation",
        focus_panel_id: "account-session",
        document_ref: "docs/old.md",
      },
      current: {
        thread_id: "helix-ask:spoofed",
        source_id: "spoofed",
        source_kind: "spoofed",
        focus_panel_id: "scientific-calculator",
      },
    })).toEqual({
      thread_id: "helix-ask:desktop",
      source_id: "helix-ask:desktop",
      source_kind: "helix_ask_workstation",
      focus_panel_id: "scientific-calculator",
    });
  });

  it("drops unsafe values at the route boundary", () => {
    expect(readSafeRealtimeSourceBinding({
      focus_panel_id: "docs-viewer",
      document_ref: "Authorization: Bearer secret-token-value",
    })).toEqual({ focus_panel_id: "docs-viewer" });
  });
});
