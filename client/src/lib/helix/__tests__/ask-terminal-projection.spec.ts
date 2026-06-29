import { describe, expect, it } from "vitest";
import {
  isInvalidTerminalAnswerText,
  normalizeTerminalAnswerText,
} from "@/lib/helix/ask-terminal-projection";

describe("Helix Ask terminal projection", () => {
  it("normalizes terminal answer text and recognizes invalid placeholders", () => {
    expect(normalizeTerminalAnswerText(" \u00a0No final answer returned.  ")).toBe("No final answer returned.");
    expect(isInvalidTerminalAnswerText("")).toBe(true);
    expect(isInvalidTerminalAnswerText("No final answer returned.")).toBe(true);
    expect(isInvalidTerminalAnswerText("I could not produce a substantive direct answer for this background-only turn.")).toBe(
      true,
    );
    expect(isInvalidTerminalAnswerText("I couldn't produce a final answer for that turn. Please retry once.")).toBe(true);
    expect(isInvalidTerminalAnswerText("  grounded answer ready  ")).toBe(false);
  });
});
