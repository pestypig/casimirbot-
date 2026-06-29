import { describe, expect, it } from "vitest";

import {
  CONVERGENCE_MATURITY_LABEL,
  CONVERGENCE_PROOF_LABEL,
  CONVERGENCE_SOURCE_LABEL,
} from "@/lib/helix/ask-convergence-display";

describe("ask convergence display", () => {
  it("formats context-capsule convergence source labels", () => {
    expect(CONVERGENCE_SOURCE_LABEL).toEqual({
      atlas_exact: "atlas exact",
      repo_exact: "repo exact",
      open_world: "open-world",
      unknown: "unknown",
    });
  });

  it("formats context-capsule convergence proof labels", () => {
    expect(CONVERGENCE_PROOF_LABEL).toEqual({
      confirmed: "confirmed",
      reasoned: "reasoned",
      hypothesis: "hypothesis",
      unknown: "unknown",
      fail_closed: "fail-closed",
    });
  });

  it("formats context-capsule convergence maturity labels", () => {
    expect(CONVERGENCE_MATURITY_LABEL).toEqual({
      exploratory: "exploratory",
      reduced_order: "reduced-order",
      diagnostic: "diagnostic",
      certified: "certified",
    });
  });
});
