import { describe, expect, it } from "vitest";
import {
  buildRelationAssemblyPacket,
  ensureRelationAssemblyPacketFallback,
  ensureRelationFallbackDomainAnchors,
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

  it("fills incomplete relation packets with deterministic fallback fields", () => {
    const repaired = ensureRelationAssemblyPacketFallback(
      {
        question: "",
        domains: [],
        definitions: { warp_definition: "", ethos_definition: "" },
        bridge_claims: [],
        constraints: [],
        falsifiability_hooks: [],
        evidence: [],
        source_map: {},
      },
      "How does warp relate to mission ethos?",
    );
    expect(repaired.question).toBe("How does warp relate to mission ethos?");
    expect(repaired.definitions.warp_definition.length).toBeGreaterThan(10);
    expect(repaired.definitions.ethos_definition.length).toBeGreaterThan(10);
    expect(repaired.bridge_claims.length).toBeGreaterThanOrEqual(2);
    expect(repaired.constraints.length).toBeGreaterThanOrEqual(2);
    expect(repaired.falsifiability_hooks.length).toBeGreaterThanOrEqual(1);
  });

  it("injects deterministic dual-domain anchors for relation fallback packets", () => {
    const anchored = ensureRelationFallbackDomainAnchors(
      ensureRelationAssemblyPacketFallback(
        {
          question: "How does warp relate to mission ethos?",
          domains: ["warp"],
          definitions: {
            warp_definition: "warp definition",
            ethos_definition: "ethos definition",
          },
          bridge_claims: ["bridge claim"],
          constraints: ["constraint"],
          falsifiability_hooks: ["hook"],
          evidence: [
            {
              evidence_id: "ev_existing",
              path: "docs/knowledge/warp/warp-bubble.md",
              span: "L1-L1",
              snippet: "warp",
              domain: "warp",
            },
          ],
          source_map: { ev_existing: "docs/knowledge/warp/warp-bubble.md#L1-L1" },
        },
        "How does warp relate to mission ethos?",
      ),
    );
    expect(anchored.domains).toEqual(["ethos", "warp"]);
    expect(anchored.evidence.some((entry) => entry.domain === "warp")).toBe(true);
    expect(anchored.evidence.some((entry) => entry.domain === "ethos")).toBe(true);
    expect(Object.values(anchored.source_map)).toContain("docs/ethos/ideology.json#L1-L1");
  });

});
