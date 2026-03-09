import { describe, expect, it } from "vitest";

import { buildHelixAskEnvelope } from "../services/helix-ask/envelope";

describe("helix ask envelope practical paragraph promotion", () => {
  it("promotes 'In practical terms' paragraph into final answer while keeping tree walk in details", () => {
    const answer = [
      "Tree Walk: Warp Mechanics Walk (tree-derived; source: docs/knowledge/warp/warp-mechanics-tree.json)",
      "1. Walk: Warp Mechanics Tree - A walkable map of warp geometry, proxies, and control levers. (docs/knowledge/warp/warp-mechanics-tree.json)",
      "",
      "Negative energy density is a theoretical concept discussed in quantum field theory and GR thought experiments.",
      "",
      "In practical terms, negative energy density has not been observed in nature and remains a theoretical construct.",
      "",
      "The concept raises stability and causality concerns, so claims should stay bounded and uncertainty should remain explicit.",
      "",
      "Sources: open-world best-effort (no repo citations required).",
    ].join("\n");

    const envelope = buildHelixAskEnvelope({
      answer,
      format: "brief",
      tier: "F2",
      mode: "standard",
    });

    expect(envelope.answer).toContain(
      "In practical terms, negative energy density has not been observed in nature and remains a theoretical construct.",
    );
    expect(envelope.answer).toContain(
      "The concept raises stability and causality concerns, so claims should stay bounded and uncertainty should remain explicit.",
    );
    expect(envelope.sections?.some((section) => section.title === "Tree Walk")).toBe(true);
    const detailSections = (envelope.sections ?? []).filter((section) => section.layer === "details");
    expect(detailSections).toHaveLength(1);
    expect(detailSections[0]?.title).toBe("Tree Walk");
    const detailBodies = detailSections.map((section) => section.body.toLowerCase()).join("\n\n");
    expect(detailBodies).not.toContain("in practical terms");
  });

  it("does not duplicate practical paragraph when it is already in summary", () => {
    const answer = [
      "In practice, negative energy density remains hypothetical and should be treated as non-confirmed.",
      "",
      "Additional detail paragraph with bounded uncertainty and no direct observation in nature.",
    ].join("\n");

    const envelope = buildHelixAskEnvelope({
      answer,
      format: "brief",
      tier: "F1",
      mode: "standard",
    });

    const practiceMatches = envelope.answer.match(/in practice/gi) ?? [];
    expect(practiceMatches.length).toBe(1);
  });

  it("keeps non-tree-walk detail paragraphs in details for regular brief answers", () => {
    const answer = [
      "Negative energy density is a theoretical concept in physics tied to quantum effects.",
      "",
      "Additional explanatory paragraph that should remain in details when no tree walk block exists.",
    ].join("\n");

    const envelope = buildHelixAskEnvelope({
      answer,
      format: "brief",
      tier: "F1",
      mode: "standard",
    });

    expect(envelope.answer).toContain(
      "Negative energy density is a theoretical concept in physics tied to quantum effects.",
    );
    const detailsText = (envelope.sections ?? [])
      .filter((section) => section.layer === "details")
      .map((section) => section.body)
      .join("\n\n");
    expect(detailsText).toContain(
      "Additional explanatory paragraph that should remain in details when no tree walk block exists.",
    );
  });
});
