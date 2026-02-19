import { describe, expect, it } from "vitest";
import { buildRelationAssemblyPacket, ensureDeterministicRelationPacket, resolveRelationTopologySignal } from "../server/services/helix-ask/relation-assembly";

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


  it("fills deterministic fallback fields for incomplete relation packets", () => {
    const packet = ensureDeterministicRelationPacket({
      question: "How does warp relate to mission ethos?",
      domains: ["warp"],
      definitions: {
        warp_definition: "",
        ethos_definition: "",
      },
      bridge_claims: [],
      constraints: [],
      falsifiability_hooks: [],
      evidence: [],
      source_map: {},
    });
    expect(packet.domains).toEqual(["ethos", "warp"]);
    expect(packet.bridge_claims.length).toBeGreaterThanOrEqual(2);
    expect(packet.constraints.length).toBeGreaterThanOrEqual(1);
    expect(packet.falsifiability_hooks.length).toBeGreaterThanOrEqual(1);
    expect(packet.evidence.length).toBeGreaterThan(0);
    expect(Object.keys(packet.source_map).length).toBeGreaterThan(0);
  });

});
