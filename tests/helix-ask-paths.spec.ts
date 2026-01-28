import { describe, expect, it } from "vitest";
import { extractFilePathsFromText } from "../server/services/helix-ask/paths";

describe("Helix Ask path extraction", () => {
  it("prefers .json when a .js variant does not exist", () => {
    const paths = extractFilePathsFromText(
      "Sources: docs/knowledge/sun-ledger.md, docs/ethos/ideology.js",
    );
    expect(paths).toContain("docs/ethos/ideology.json");
    expect(paths).not.toContain("docs/ethos/ideology.js");
  });
});

