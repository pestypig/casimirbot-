import { beforeAll, describe, expect, it } from "vitest";

let tokenizeHelixAskMathTokens: typeof import("@/components/helix/HelixAskPill").tokenizeHelixAskMathTokens;

beforeAll(async () => {
  (globalThis as Record<string, unknown>).__HELIX_ASK_JOB_TIMEOUT_MS__ = "1200000";
  ({ tokenizeHelixAskMathTokens } = await import("@/components/helix/HelixAskPill"));
});

describe("tokenizeHelixAskMathTokens", () => {
  it("tokenizes inline and display math delimiters", () => {
    const tokens = tokenizeHelixAskMathTokens("Energy $E=mc^2$ and $$\\int_0^1 x^2 dx$$ done.");
    expect(tokens).toHaveLength(5);
    expect(tokens[0]).toMatchObject({ kind: "text", text: "Energy " });
    expect(tokens[1]).toMatchObject({ kind: "math", text: "E=mc^2", displayMode: false });
    expect(tokens[2]).toMatchObject({ kind: "text", text: " and " });
    expect(tokens[3]).toMatchObject({ kind: "math", text: "\\int_0^1 x^2 dx", displayMode: true });
    expect(tokens[4]).toMatchObject({ kind: "text", text: " done." });
  });

  it("keeps escaped dollar signs as text", () => {
    const tokens = tokenizeHelixAskMathTokens("Price is \\$5 and equation $x+y$.");
    const mathTokens = tokens.filter((token) => token.kind === "math");
    expect(mathTokens).toHaveLength(1);
    expect(mathTokens[0]).toMatchObject({ text: "x+y", displayMode: false });
    expect(tokens[0]).toMatchObject({ kind: "text", text: "Price is \\$5 and equation " });
  });

  it("falls back to text when delimiters are unmatched", () => {
    const tokens = tokenizeHelixAskMathTokens("Path client/src/app.tsx and dangling \\(x+y.");
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({
      kind: "text",
      text: "Path client/src/app.tsx and dangling \\(x+y.",
    });
  });
});
