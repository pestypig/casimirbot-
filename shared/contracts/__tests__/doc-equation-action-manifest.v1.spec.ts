import { describe, expect, it } from "vitest";
import nhm2WhitepaperActions from "../../../docs/research/nhm2-current-status-whitepaper-2026-05-02.equation-actions.json";
import {
  isDocEquationActionManifestV1,
  validateDocEquationActionManifestV1,
} from "../doc-equation-action-manifest.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../../theory/nhm2-theory-badges";

describe("doc_equation_actions/v1", () => {
  it("validates the NHM2 whitepaper sidecar", () => {
    expect(validateDocEquationActionManifestV1(nhm2WhitepaperActions)).toEqual([]);
    expect(isDocEquationActionManifestV1(nhm2WhitepaperActions)).toBe(true);
  });

  it("binds closure-stack equations to diagnostic runtime actions without scalar payload overreach", () => {
    expect(isDocEquationActionManifestV1(nhm2WhitepaperActions)).toBe(true);
    if (!isDocEquationActionManifestV1(nhm2WhitepaperActions)) return;

    const fullTensor = nhm2WhitepaperActions.entries.find(
      (entry) => entry.equationId === "nhm2-same-chart-full-tensor-ledger",
    );
    const materialReceipt = nhm2WhitepaperActions.entries.find(
      (entry) => entry.equationId === "casimir-material-receipt-ledger",
    );
    const wall = nhm2WhitepaperActions.entries.find(
      (entry) => entry.equationId === "nhm2-wall-t00-source-residual",
    );

    expect(fullTensor?.actions.map((action) => action.kind)).toEqual(["artifact_backed_theory_run"]);
    expect(fullTensor?.actions[0]?.preferredBadgeId).toBe("nhm2.tensor.same_chart_full_tensor");
    expect(materialReceipt?.actions.map((action) => action.kind)).toEqual(["artifact_backed_theory_run"]);
    expect(materialReceipt?.actions[0]?.preferredBadgeId).toBe("casimir.material.lifshitz_receipt");
    expect(wall?.actions.some((action) => action.calculatorPayloadRef?.payloadId === "wall_t00_source_residual_payload"))
      .toBe(true);
  });

  it("resolves referenced badges and calculator payloads against the current theory graph", () => {
    expect(isDocEquationActionManifestV1(nhm2WhitepaperActions)).toBe(true);
    if (!isDocEquationActionManifestV1(nhm2WhitepaperActions)) return;

    const graph = buildNhm2TheoryBadgeGraphV1();
    const badgesById = new Map(graph.badges.map((badge) => [badge.id, badge]));
    const runtimeReferenceOnlyBadgeIds = new Set([
      "nhm2.tensor.same_chart_full_tensor",
      "nhm2.energy_condition.observer_robust_gate",
      "nhm2.qei.worldline_dossier",
      "casimir.material.lifshitz_receipt",
      "casimir.geometry.beyond_pfa_validity",
      "nhm2.natario.invariant_audit",
    ]);

    for (const entry of nhm2WhitepaperActions.entries) {
      for (const action of entry.actions) {
        for (const badgeId of action.badgeIds ?? []) {
          expect(badgesById.has(badgeId), `${entry.equationId} references missing badge ${badgeId}`).toBe(true);
        }
        if (action.preferredBadgeId) {
          expect(
            badgesById.has(action.preferredBadgeId),
            `${entry.equationId} references missing preferred badge ${action.preferredBadgeId}`,
          ).toBe(true);
        }
        if (!action.calculatorPayloadRef) continue;
        const badge = badgesById.get(action.calculatorPayloadRef.badgeId);
        expect(badge, `${entry.equationId} references missing calculator badge`).toBeDefined();
        expect(
          badge?.calculatorPayloads.some((payload) => payload.id === action.calculatorPayloadRef?.payloadId),
          `${entry.equationId} references missing calculator payload ${action.calculatorPayloadRef.payloadId}`,
        ).toBe(true);
      }
    }

    for (const badgeId of runtimeReferenceOnlyBadgeIds) {
      expect(badgesById.get(badgeId)?.calculatorPayloads, `${badgeId} must remain runtime/reference-only`).toEqual([]);
    }
  });
});
