import { describe, expect, it } from "vitest";
import { auditHelixPromptForPoison } from "../services/helix-ask/prompt-poison-audit";

describe("helix ask prompt poison audit", () => {
  it("fails when visual evidence metadata is appended into user text", () => {
    const audit = auditHelixPromptForPoison({
      userText:
        "describe this image\n\nAttached visual evidence summary (compact context only; raw image not included; assistant_answer=false): slime in boat",
      turnInputItems: [],
    });

    expect(audit.ok).toBe(false);
    expect(audit.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "evidence_summary_in_user_text" }),
      ]),
    );
  });

  it("passes when visual evidence remains a typed input item", () => {
    const audit = auditHelixPromptForPoison({
      userText: "describe this image",
      turnInputItems: [
        { type: "text", text: "describe this image", source: "user" },
        {
          type: "evidence_ref",
          evidence_id: "visual_evidence:1",
          evidence_kind: "visual_frame_evidence",
          compact_summary: "slime in boat",
          assistant_answer: false,
          raw_content_included: false,
        },
      ],
    });

    expect(audit.ok).toBe(true);
    expect(audit.evidence_ref_count).toBe(1);
  });
});

