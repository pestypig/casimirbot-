import { describe, expect, it, vi } from "vitest";
import {
  __testOnlyResolveCrossLaneUncertaintyValidation,
  __testOnlyResolveMaturityCeilingValidation,
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

  it("fails deterministically when runtime-eligible cross-lane rows miss uncertainty models", async () => {
    const fs = await import("node:fs");
    const existsSpy = vi.spyOn(fs.default ?? fs, "existsSync").mockReturnValue(true);
    const readSpy = vi.spyOn(fs.default ?? fs, "readFileSync").mockReturnValue(
      JSON.stringify({
        rows: [
          {
            id: "physics_spacetime_gr__curvature_unit_proxy_contract",
            runtime_safety_eligible: true,
            cross_lane_bridge: true,
            uncertainty_model_id: "",
          },
        ],
      }) as any,
    );

    const result = __testOnlyResolveCrossLaneUncertaintyValidation();
    expect(result.referenced).toBe(true);
    expect(result.pass).toBe(false);
    expect(result.failReason).toBe("FAIL_MISSING_UNCERTAINTY_MODEL");
    expect(result.summary).toContain("cross_lane_uncertainty=missing_uncertainty_metadata:");

    readSpy.mockRestore();
    existsSpy.mockRestore();
  });

  it("sets explicit packet fail_reason when cross-lane uncertainty metadata is missing", async () => {
    const fs = await import("node:fs");
    const fsMod = fs.default ?? fs;
    const realExistsSync = fsMod.existsSync.bind(fsMod);
    const realReadFileSync = fsMod.readFileSync.bind(fsMod);
    const existsSpy = vi.spyOn(fsMod, "existsSync").mockImplementation((target: any) => {
      const path = String(target ?? "");
      if (path.endsWith("configs/math-congruence-matrix.v1.json")) return true;
      return realExistsSync(target);
    });
    const readSpy = vi.spyOn(fsMod, "readFileSync").mockImplementation((target: any, ...args: any[]) => {
      const path = String(target ?? "");
      if (path.endsWith("configs/math-congruence-matrix.v1.json")) {
        return JSON.stringify({
          rows: [
            {
              id: "runtime_cross_lane_proxy",
              runtime_safety_eligible: true,
              cross_lane_bridge: true,
              provenance_class: "proxy",
              uncertainty_model_id: "proxy_v1",
              falsifier: {},
            },
          ],
        }) as any;
      }
      return realReadFileSync(target, ...(args as [any]));
    });

    const packet = buildRelationAssemblyPacket({
      question: "How does runtime safety handle proxy bridge evidence?",
      contextFiles: ["docs/knowledge/warp/warp-bubble.md", "docs/ethos/ideology.json"],
      contextText: "runtime safety assembly",
      docBlocks: [
        { path: "docs/knowledge/warp/warp-bubble.md", block: "Warp runtime safety rail." },
        { path: "docs/ethos/ideology.json", block: "Ethos runtime stewardship rail." },
      ],
      graphPack: null,
    });

    expect(packet.fail_reason).toBe("FAIL_MISSING_UNCERTAINTY_MODEL");
    expect(packet.falsifiability_hooks.some((entry) => entry.includes("cross_lane_uncertainty=missing_uncertainty_metadata:runtime_cross_lane_proxy"))).toBe(true);

    readSpy.mockRestore();
    existsSpy.mockRestore();
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

  it("blocks over-promotion above diagnostic maturity ceiling", () => {
    const result = __testOnlyResolveMaturityCeilingValidation([
      {
        evidence_id: "ev_cert",
        path: "docs/knowledge/warp/warp-bubble.md",
        span: "L1-L1",
        snippet: "certified lane statement",
        domain: "warp",
        claim_tier: "certified",
      },
    ]);

    expect(result.referenced).toBe(true);
    expect(result.pass).toBe(false);
    expect(result.failReason).toBe("FAIL_MATURITY_CEILING_VIOLATION");
  });

  it("blocks diagnostic/proxy upstream evidence from implying certified surfaces", async () => {
    const fs = await import("node:fs");
    const fsMod = fs.default ?? fs;
    const realExistsSync = fsMod.existsSync.bind(fsMod);
    const realReadFileSync = fsMod.readFileSync.bind(fsMod);
    const existsSpy = vi.spyOn(fsMod, "existsSync").mockImplementation((target: any) => {
      const filePath = String(target ?? "");
      if (filePath.endsWith("configs/physics-root-leaf-manifest.v1.json")) return true;
      return realExistsSync(target);
    });
    const readSpy = vi.spyOn(fsMod, "readFileSync").mockImplementation((target: any, ...args: any[]) => {
      const filePath = String(target ?? "");
      if (filePath.endsWith("configs/physics-root-leaf-manifest.v1.json")) {
        return JSON.stringify({
          claim_tier_ceiling: "certified",
          maturity_propagation_policy: {
            enabled: true,
            no_over_promotion: true,
            strict_fail_reason: "FAIL_MATURITY_CEILING_VIOLATION",
            default_max_claim_tier: "certified",
            upstream_claim_tier_blocklist_for_certified: ["diagnostic", "reduced-order"],
            upstream_provenance_blocklist_for_certified: ["proxy", "inferred"],
          },
        }) as any;
      }
      return realReadFileSync(target, ...(args as [any]));
    });

    const result = __testOnlyResolveMaturityCeilingValidation([
      {
        evidence_id: "ev_upstream_proxy",
        path: "docs/knowledge/warp/warp-bubble.md",
        span: "L1-L1",
        snippet: "proxy upstream diagnostic",
        domain: "warp",
        provenance_class: "proxy",
        claim_tier: "diagnostic",
      },
      {
        evidence_id: "ev_surface_cert",
        path: "docs/ethos/ideology.json",
        span: "L1-L1",
        snippet: "certified downstream output",
        domain: "ethos",
        provenance_class: "measured",
        claim_tier: "certified",
      },
    ]);

    expect(result.referenced).toBe(true);
    expect(result.pass).toBe(false);
    expect(result.failReason).toBe("FAIL_MATURITY_CEILING_VIOLATION");
    expect(result.summary).toContain("maturity_ceiling=upstream_to_certified_violation");

    readSpy.mockRestore();
    existsSpy.mockRestore();
  });
});
