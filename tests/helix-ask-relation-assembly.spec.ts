import { describe, expect, it } from "vitest";
import {
  buildRelationAssemblyPacket,
  evaluateRelationPacketFloors,
  resolveRelationTopologySignal,
} from "../server/services/helix-ask/relation-assembly";

describe("relation assembly packet", () => {
  it("builds warp+ethos packet with deterministic bridge claims", () => {
    const packet = buildRelationAssemblyPacket({
      question: "How does a warp bubble fit in with the mission ethos?",
      contextFiles: ["docs/knowledge/warp/warp-bubble.md", "docs/ethos/ideology.json"],
      contextText: "warp bubble constraints and mission ethos stewardship",
      docBlocks: [
        { path: "docs/knowledge/warp/warp-bubble.md", block: "Warp bubble geometry is constrained by viability gates." },
        { path: "docs/ethos/why.md", block: "Mission ethos binds capability to stewardship." },
      ],
      graphPack: null,
    });
    expect(packet.domains).toEqual(["ethos", "warp"]);
    expect(packet.bridge_claims.length).toBeGreaterThanOrEqual(2);
    expect(packet.evidence.some((entry) => entry.domain === "warp")).toBe(true);
    expect(packet.evidence.some((entry) => entry.domain === "ethos")).toBe(true);
  });

  it("reports missing anchors when relation topology is single-domain", () => {
    const signal = resolveRelationTopologySignal({
      question: "How does warp relate to mission ethos?",
      relationIntent: true,
      contextFiles: ["docs/knowledge/warp/warp-bubble.md"],
      graphPack: null,
    });
    expect(signal.dualDomainAnchors).toBe(false);
    expect(signal.missingAnchors).toContain("ethos");
  });


  it("enforces relation packet floors with structured fail reasons", () => {
    const lowBridgePacket = {
      question: "q",
      domains: ["warp", "ethos"],
      definitions: { warp_definition: "w", ethos_definition: "e" },
      bridge_claims: ["only-one"],
      constraints: [],
      falsifiability_hooks: [],
      evidence: [
        {
          evidence_id: "ev_1",
          path: "docs/knowledge/warp/warp-bubble.md",
          span: "L1-L1",
          snippet: "warp",
          domain: "warp" as const,
        },
      ],
      source_map: { ev_1: "docs/knowledge/warp/warp-bubble.md#L1-L1" },
    };
    const bridgeFail = evaluateRelationPacketFloors(lowBridgePacket, { minBridges: 2, minEvidence: 2 });
    expect(bridgeFail.ok).toBe(false);
    expect(bridgeFail.failReason).toBe("bridge_count_low");

    const evidenceFail = evaluateRelationPacketFloors(
      { ...lowBridgePacket, bridge_claims: ["a", "b"] },
      { minBridges: 2, minEvidence: 2 },
    );
    expect(evidenceFail.ok).toBe(false);
    expect(evidenceFail.failReason).toBe("evidence_count_low");
  });
});
