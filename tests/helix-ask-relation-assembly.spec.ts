import { describe, expect, it } from "vitest";
import { buildRelationAssemblyPacket, relationTopologyAvailable } from "../server/services/helix-ask/relation-assembly";

describe("relation assembly packet", () => {
  it("builds dual-domain packet with deterministic bridge claims", () => {
    const packet = buildRelationAssemblyPacket({
      question: "How does warp bubble relate to mission ethos?",
      docBlocks: [
        { path: "docs/knowledge/warp/warp-bubble-overview.md", block: "Warp bubble is a spacetime geometry concept constrained by GR and QI checks." },
        { path: "docs/ethos/ideology.json", block: "Mission ethos defines stewardship, verification discipline, and governance bounds." },
      ],
      contextFiles: ["docs/knowledge/warp/warp-bubble-overview.md", "docs/ethos/ideology.json"],
      evidenceText: "docs/knowledge/warp/warp-bubble-overview.md\ndocs/ethos/ideology.json",
      treeWalk: "warp -> mission ethos",
    });

    expect(packet.evidence.some((entry) => entry.domain === "warp")).toBe(true);
    expect(packet.evidence.some((entry) => entry.domain === "ethos")).toBe(true);
    expect(packet.bridge_claims.length).toBeGreaterThanOrEqual(2);
    expect(relationTopologyAvailable({ packet, relationIntent: true, treeWalk: "warp + ethos" })).toBe(true);
  });
});
