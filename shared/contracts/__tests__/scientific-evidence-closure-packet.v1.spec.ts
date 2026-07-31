import { describe, expect, it } from "vitest";

import {
  SCIENTIFIC_EVIDENCE_CLOSURE_AXES,
  buildScientificEvidenceClosurePacketV1,
  validateScientificEvidenceClosurePacketIntegrityV1,
  validateScientificEvidenceClosurePacketShapeV1,
} from "../scientific-evidence-closure-packet.v1";

const hash = (character: string) => character.repeat(64);
const ref = (artifactId: string, character: string) => ({
  artifactId,
  schemaVersion: `${artifactId}/v1`,
  artifactSha256: hash(character),
});

const build = () =>
  buildScientificEvidenceClosurePacketV1({
    generatedAt: "2026-07-30T12:30:00.000Z",
    packetId: "closure:advection-diffusion:dxx-0.02",
    status: "satisfied",
    turnBinding: {
      turnId: "turn:scientist-1",
      planId: "plan:scientific-evidence-1",
      executionPlanArtifactSha256: hash("0"),
      confirmationReceiptSha256: hash("a"),
      currentTurnEvidenceReentryRequired: true,
    },
    enrollment: {
      manifestId: "scientific-evidence:advection-diffusion-dxx:v1",
      schemaVersion: "scientific_evidence_conformance_manifest/v1",
      artifactSha256: hash("b"),
      orientationId: "orientation:advection-diffusion-dxx-closure",
      selectedBadgeIds: [
        "science.evidence.advection_diffusion_diffusivity_intervention",
        "science.transport.advection_diffusion_full_1d",
        "science.transport.zero_gradient_diffusive_flux_contract",
      ],
    },
    intervention: {
      parameterId: "parameter:diffusivity",
      sourceSymbol: "Dxx",
      unit: "m^2 s^-1",
      baselineValue: "0.01",
      interventionValue: "0.02",
      frozenInputsSha256: hash("c"),
    },
    evidence: {
      sourceClaim: ref("registered_source_claim", "d"),
      semanticBinding: ref("casimir_semantic_to_lean_binding", "e"),
      graphSnapshot: ref("theory_badge_graph_snapshot", "f"),
      formalCertificate: {
        ...ref("casimir_formal_verification_certificate", "1"),
        status: "passed",
        theoremName:
          "advection_diffusion_full_1d.xDiffusiveFluxConsistency",
        theoremTypeSha256: hash("2"),
      },
      baselineNumericalCertificate: {
        ...ref(
          "casimir_independent_numerical_verification_certificate",
          "3",
        ),
        status: "passed",
        caseId: "advection_diffusion_full_1d:dxx=0.01",
        primaryLineageId: "lanyon-generated-kernel-with-casimir-driver",
        independentLineageId: "casimir-centered-method-of-lines-rk2",
        independenceEstablished: true,
      },
      interventionNumericalCertificate: {
        ...ref(
          "casimir_independent_numerical_verification_certificate",
          "4",
        ),
        status: "passed",
        caseId: "advection_diffusion_full_1d:dxx=0.02",
        primaryLineageId: "lanyon-generated-kernel-with-casimir-driver",
        independentLineageId: "casimir-centered-method-of-lines-rk2",
        independenceEstablished: true,
      },
    },
    axisResults: SCIENTIFIC_EVIDENCE_CLOSURE_AXES.map((axis, index) => ({
      axis,
      status: "passed" as const,
      evidenceSha256: hash(String((index + 5) % 10)),
      issueCodes: [],
    })),
    comparison: {
      policyId: "comparison:advection-diffusion-dxx:v1",
      policySha256: hash("9"),
      observables: [
        {
          observableId: "solution_decay_amplitude",
          unit: "1",
          baselineValue: 0.245,
          interventionValue: 0.24,
          delta: -0.005,
          absoluteTolerance: 0.01,
          relativeTolerance: 0.05,
          withinTolerance: true,
        },
      ],
      gateDeltas: [
        {
          gateId: "formal_contract",
          baselineStatus: "passed",
          interventionStatus: "passed",
          changed: false,
        },
      ],
    },
    blockers: [],
    claimBoundary: {
      establishes: [
        "The exact enrolled formal contract replayed successfully.",
        "Two distinct numerical solver lineages agreed within the frozen comparison policy.",
      ],
      doesNotEstablish: [
        "It does not establish empirical validity or physical truth.",
        "It does not prove either numerical implementation correct.",
      ],
      maximumClaim:
        "bounded synthetic comparison within the exact enrolled case",
    },
  });

describe("scientific_evidence_closure_packet/v1", () => {
  it("seals a satisfied packet as canonical only within its enrollment", async () => {
    const packet = await build();
    expect(
      await validateScientificEvidenceClosurePacketIntegrityV1(packet),
    ).toEqual([]);
    expect(packet.authority.canonicalWithinEnrollment).toBe(true);
    expect(packet.authority.empiricalAuthority).toBe(false);
    expect(packet.authority.assistantAnswer).toBe(false);
    expect(packet.authority.terminalEligible).toBe(false);
  });

  it("rejects stale/tampered evidence and false closure promotion", async () => {
    const packet = await build();
    const tampered = structuredClone(packet);
    tampered.turnBinding.turnId = "turn:stale";
    expect(
      await validateScientificEvidenceClosurePacketIntegrityV1(tampered),
    ).toContain("artifactSha256 does not match closure packet content");

    const promoted = structuredClone(packet) as unknown as {
      authority: { terminalEligible: boolean };
    };
    promoted.authority.terminalEligible = true;
    expect(
      validateScientificEvidenceClosurePacketShapeV1(promoted).some((issue) =>
        issue.includes("terminalEligible"),
      ),
    ).toBe(true);
  });

  it("cannot be satisfied when either numerical lane lacks independence", async () => {
    const packet = await build();
    const invalid = structuredClone(packet);
    invalid.evidence.interventionNumericalCertificate.independenceEstablished =
      false;
    expect(
      validateScientificEvidenceClosurePacketShapeV1(invalid).some((issue) =>
        issue.includes("satisfied requires"),
      ),
    ).toBe(true);
  });
});
