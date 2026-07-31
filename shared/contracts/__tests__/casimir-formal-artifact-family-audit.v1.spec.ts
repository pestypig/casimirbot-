import { describe, expect, it } from "vitest";

import auditJson from "../../../configs/research/casimir-formal-theorem-audits/lanyon-gr-maxwell-b13da44.v1.json";
import {
  CASIMIR_FORMAL_DENIED_PROMOTIONS,
  buildCasimirFormalArtifactFamilyAuditV1,
  validateCasimirFormalArtifactFamilyAuditV1,
  type CasimirFormalArtifactFamilyAuditV1,
} from "../casimir-formal-artifact-family-audit.v1";

const audit = auditJson as CasimirFormalArtifactFamilyAuditV1;

describe("casimir formal artifact family audit v1", () => {
  it("admits the exact GR-Maxwell source family without granting theorem authority", async () => {
    expect(await validateCasimirFormalArtifactFamilyAuditV1(audit)).toEqual([]);
    expect(audit.repository).toMatchObject({
      uri: "https://github.com/lanyonai/GeneralRelativisticMaxwell",
      commitSha: "b13da44d9e93e9f3c8dbdab48590fc2e08a8bff3",
      selectedSourceTreeSha256:
        "0ff049323382600bac8ef7a24d97fe07c19adad27d66634e7fb136be7a7ecb7c",
      canonicalByteSource: "git_blob",
      selectedArtifactCount: 18,
    });
    expect(audit.cases).toHaveLength(6);
    expect(audit.theorems).toHaveLength(156);
    expect(audit.environment.replayEligible).toBe(false);
    expect(audit.authority).toMatchObject({
      sourceAdmissionAuthority: true,
      formalPropositionChecked: false,
      scientificAuthority: false,
      numericalAuthority: false,
      empiricalAuthority: false,
      physicalAuthority: false,
      assistantAnswer: false,
      terminalEligible: false,
    });
  });

  it("classifies exact Hyperbolicity declarations as typed Real witnesses", () => {
    const namedHyperbolicity = audit.theorems.filter((theorem) =>
      theorem.theoremName.endsWith("Hyperbolicity"),
    );
    expect(namedHyperbolicity).toHaveLength(12);
    expect(
      namedHyperbolicity.every(
        (theorem) =>
          theorem.propertyKind === "real_typed_expression_witness" &&
          theorem.claimCeiling === "definition_well_typed" &&
          theorem.deniedPromotions.includes("mathematical_hyperbolicity") &&
          theorem.deniedPromotions.includes("pde_solution"),
      ),
    ).toBe(true);
  });

  it("binds every theorem to exact source and denies broad promotions", () => {
    expect(
      audit.theorems.every(
        (theorem) =>
          theorem.declarationSha256.length === 64 &&
          theorem.propositionSourceSha256.length === 64 &&
          theorem.sourceRange.startLine > 0 &&
          theorem.sourceRange.endLine >= theorem.sourceRange.startLine &&
          CASIMIR_FORMAL_DENIED_PROMOTIONS.every((promotion) =>
            theorem.deniedPromotions.includes(promotion),
          ),
      ),
    ).toBe(true);
  });

  it("fails closed when the artifact payload is substituted", async () => {
    const substituted = structuredClone(audit);
    substituted.theorems[0].theoremName = "FullGRMaxwellSolved";
    expect(
      await validateCasimirFormalArtifactFamilyAuditV1(substituted),
    ).toContain("artifactSha256 does not match canonical audit payload");
  });

  it("rejects over-promotion even when the attacker recomputes the artifact hash", async () => {
    const {
      artifactSha256: _artifactSha256,
      ...withoutHash
    } = structuredClone(audit);
    withoutHash.theorems[0].propertyKind = "declared_wave_speed_bound";
    withoutHash.theorems[0].claimCeiling = "declared_algebraic_identity";
    withoutHash.theorems[0].deniedPromotions =
      withoutHash.theorems[0].deniedPromotions.filter(
        (promotion) => promotion !== "physical_truth",
      );
    const rehashed = await buildCasimirFormalArtifactFamilyAuditV1(withoutHash);
    expect(await validateCasimirFormalArtifactFamilyAuditV1(rehashed)).toContain(
      `theorem is missing denied promotions: ${rehashed.theorems[0].theoremId}`,
    );
  });

  it("rejects an attempted replay projection while the environment is unpinned", async () => {
    const {
      artifactSha256: _artifactSha256,
      ...withoutHash
    } = structuredClone(audit);
    withoutHash.environment.replayEligible = true as false;
    const rehashed = await buildCasimirFormalArtifactFamilyAuditV1(withoutHash);
    expect(await validateCasimirFormalArtifactFamilyAuditV1(rehashed)).toContain(
      "unpinned environment must remain replay-ineligible",
    );
  });
});
