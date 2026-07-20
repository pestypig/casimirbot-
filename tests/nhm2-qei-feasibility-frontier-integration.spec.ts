import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validateTheoryRuntimeEntrypointV1 } from "../shared/contracts/theory-runtime-entrypoint.v1";
import {
  buildNhm2FullSolveTheoryBadgesV1,
} from "../shared/theory/nhm2-full-solve-theory-badges";
import { getNhm2RuntimeFieldBinding } from "../shared/theory/nhm2-runtime-field-map";
import {
  isTheoryRuntimeDedicatedExecutableId,
  isTheoryRuntimeExecutableId,
} from "../shared/theory/runtime-execution-policy";
import {
  findTheoryRuntimeEntrypointsForBadge,
  getTheoryRuntimeEntrypoint,
} from "../shared/theory/runtime-entrypoints";

const RUNTIME_ID = "nhm2.qei.feasibility_frontier";
const BADGE_ID = "nhm2.qei.feasibility_frontier";
const SCRIPT_NAME = "nhm2:evaluate-qei-feasibility-frontier";

describe("NHM2 QEI feasibility-frontier metadata integration", () => {
  it("registers a diagnostic-only qei_worldline runtime without generic execution authority", () => {
    const entrypoint = getTheoryRuntimeEntrypoint(RUNTIME_ID);

    expect(entrypoint).not.toBeNull();
    expect(validateTheoryRuntimeEntrypointV1(entrypoint)).toEqual([]);
    expect(entrypoint).toMatchObject({
      runtimeId: RUNTIME_ID,
      family: "qei_worldline",
      command: `npm run ${SCRIPT_NAME}`,
      ownedBadgeIds: [BADGE_ID],
      claimBoundary: {
        currentTier: "diagnostic",
        maximumTier: "diagnostic",
        promotionAllowed: false,
      },
    });
    expect(entrypoint?.argsSchema).toMatchObject({
      required: ["frontier"],
      additionalProperties: false,
    });
    expect(entrypoint?.outputArtifactGlobs).toEqual([
      "artifacts/research/full-solve/qei-feasibility-frontier-runs/*/qei-feasibility-frontier-evaluation.json",
    ]);
    expect(entrypoint?.description).toMatch(
      /diagnostic-only.*cannot satisfy.*worldline-QEI dossier.*theory-closure.*universal no-go.*physical viability/i,
    );
    expect(isTheoryRuntimeExecutableId(RUNTIME_ID)).toBe(false);
    expect(isTheoryRuntimeDedicatedExecutableId(RUNTIME_ID)).toBe(false);
  });

  it("binds the package command and concrete implementation sources", () => {
    const packageJson = JSON.parse(
      readFileSync("package.json", "utf8"),
    ) as { scripts?: Record<string, string> };
    const entrypoint = getTheoryRuntimeEntrypoint(RUNTIME_ID);

    expect(packageJson.scripts?.[SCRIPT_NAME]).toBe(
      "tsx tools/nhm2/evaluate-qei-feasibility-frontier.ts",
    );
    expect(entrypoint?.sourceRefs.map((ref) => ref.path)).toEqual(
      expect.arrayContaining([
        "tools/nhm2/evaluate-qei-feasibility-frontier.ts",
        "server/services/theory/nhm2-qei-feasibility-frontier-evaluator.ts",
        "shared/contracts/nhm2-qei-feasibility-frontier.v1.ts",
      ]),
    );
    for (const sourceRef of entrypoint?.sourceRefs ?? []) {
      expect(existsSync(sourceRef.path), sourceRef.path).toBe(true);
    }
  });

  it("exposes a simulation-specific diagnostic badge with no calculator or closure authority edge", () => {
    const { badges, edges } = buildNhm2FullSolveTheoryBadgesV1();
    const badge = badges.find((candidate) => candidate.id === BADGE_ID);
    const prohibitedAuthorityTargets = new Set([
      "nhm2.qei.worldline_dossier",
      "nhm2.meta.experiment_ready_theory_closure",
    ]);

    expect(badge).toMatchObject({
      id: BADGE_ID,
      level: "simulation_specific",
      status: "diagnostic",
      calculatorPayloads: [],
      claimBoundary: {
        diagnosticOnly: true,
        doesValidateNHM2: false,
        validationClaimAllowed: false,
        physicalMechanismClaimAllowed: false,
        promotionAllowed: false,
      },
    });
    expect(badge?.assumptions.join(" ")).toMatch(
      /finite domain.*not a universal QEI no-go/i,
    );
    expect(badge?.assumptions.join(" ")).toMatch(
      /cannot satisfy the worldline-QEI dossier or experiment-ready theory-closure gate/i,
    );
    expect(
      edges.filter(
        (edge) =>
          edge.from === BADGE_ID && prohibitedAuthorityTargets.has(edge.to),
      ),
    ).toEqual([]);
    expect(
      findTheoryRuntimeEntrypointsForBadge(BADGE_ID).map(
        (entrypoint) => entrypoint.runtimeId,
      ),
    ).toEqual([RUNTIME_ID]);
  });

  it("projects the frontier as a non-authoritative runtime output with an explicit closure lock", () => {
    const binding = getNhm2RuntimeFieldBinding(BADGE_ID);

    expect(binding).toMatchObject({
      badgeId: BADGE_ID,
      kind: "runtime_bound_output",
      runtimeId: RUNTIME_ID,
      laneId: "qei_stress_energy",
      scalarCuts: [],
    });
    expect(binding?.artifactFields).toEqual(
      expect.arrayContaining([
        "nhm2QeiFeasibilityFrontier.provenance.run.runId",
        "nhm2QeiFeasibilityFrontier.provenance.runtimeReceipt.sha256",
        "nhm2QeiFeasibilityFrontier.candidates[].coverage.complete",
        "nhm2QeiFeasibilityFrontier.candidates[].evaluations[].sensitivity.theoremCrossoverTauSeconds",
        "nhm2QeiFeasibilityFrontier.summary.closestCandidateWorstMargin",
        "nhm2QeiFeasibilityFrontier.verdict",
        "nhm2QeiFeasibilityFrontier.claimBoundary.filesystemVerificationRequired",
        "nhm2QeiFeasibilityFrontier.claimBoundary.cannotSatisfyWorldlineQeiClosure",
        "nhm2QeiFeasibilityFrontier.claimBoundary.sensitivityDoesNotAuthorizeParameterScaling",
      ]),
    );
    expect(binding?.gates).toEqual(
      expect.arrayContaining([
        "qei_frontier_filesystem_verification",
        "qei_frontier_cartesian_coverage",
        "qei_frontier_same_epoch_provenance",
      ]),
    );
    expect(binding?.requiredEvidence).toEqual(
      expect.arrayContaining([
        "qei_frontier_runtime_receipt",
        "qei_frontier_run_manifest",
        "qei_frontier_raw_evaluation_evidence",
        "qei_frontier_quadrature_evidence",
      ]),
    );
    expect(binding?.requiredEvidence).not.toContain("qei_worldline_dossier");
    expect(binding?.claimBoundaryNotes.join(" ")).toMatch(
      /cannotSatisfyWorldlineQeiClosure.*cannot satisfy.*worldline-QEI dossier.*theory-closure/i,
    );
  });
});
