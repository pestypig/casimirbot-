import { beforeEach, describe, expect, it } from "vitest";

import {
  validateCasimirFormalVerificationPreparationReceiptIntegrityV1,
  type CasimirFormalVerificationPreparationReceiptV1,
} from "@shared/contracts/casimir-formal-verification-preparation.v1";

import { resetCasimirFormalVerificationPreparationStoreForTests } from "../../../theory/casimir-formal-verification-preparer";
import {
  THEORY_FORMAL_VERIFIER_PLAN_CAPABILITY,
  THEORY_FORMAL_VERIFIER_PREPARE_REQUEST_CAPABILITY,
  executeTheoryFormalVerifierGatewayCapability,
} from "../theory-formal-verifier";

describe("theory formal verifier prepared-request gate", () => {
  beforeEach(() => {
    resetCasimirFormalVerificationPreparationStoreForTests();
  });

  it("reports a malformed missing-requirements field without throwing", async () => {
    const issues =
      await validateCasimirFormalVerificationPreparationReceiptIntegrityV1({
        artifactId:
          "casimir_formal_verification_preparation_receipt/v1",
        schemaVersion: "1.0.0",
        generatedAt: new Date(0).toISOString(),
        preparedRequestId: "prepared:malformed",
        sourceTurnId: "turn:malformed",
        disposition: "blocked",
        bindings: {},
        missingRequirements: null,
        preparedSealedInputSha256: null,
        authority: {},
        receiptSha256: "0".repeat(64),
      });

    expect(issues).toEqual(
      expect.arrayContaining([
        "preparation_missing_requirements_invalid",
        "blocked_preparation_missing_reason",
      ]),
    );
  });

  it("keeps the current Lanyon Mathlib case blocked with typed closure requirements", async () => {
    const prepared =
      await executeTheoryFormalVerifierGatewayCapability({
        capabilityId:
          THEORY_FORMAL_VERIFIER_PREPARE_REQUEST_CAPABILITY,
        args: {
          procedure_artifact_ref: "procedure-artifact:lanyon",
          procedure_id: "procedure:lanyon:advection-diffusion",
          procedure_sha256: "a".repeat(64),
          semantic_admission_artifact_ref:
            "semantic-admission:lanyon",
          artifact_generation_artifact_ref:
            "artifact-generation:lanyon",
          claim_id: "claim:advection-diffusion",
          formal_artifact_id:
            "lanyon:advection_diffusion_full_1d",
          theorem_name: "xFluxConsistency",
          environment_policy_id: "lean4-mathlib:lanyon",
        },
        accountType: "developer",
        profileId: "profile:formal-preparation",
        turnId: "ask:test:formal-preparation",
        authoritativeEvidenceArtifacts: [],
      });

    expect(prepared).toMatchObject({
      ok: false,
      status: "blocked",
      admissionReason: "formal_prepared_request_blocked",
    });
    const observation = prepared.observation as Record<string, any>;
    const receipt =
      observation.preparation_receipt as CasimirFormalVerificationPreparationReceiptV1;
    expect(observation).toMatchObject({
      disposition: "blocked",
      next_affordances: [],
      terminal_eligible: false,
      assistant_answer: false,
    });
    expect(
      receipt.missingRequirements.map((entry) => entry.code),
    ).toEqual(
      expect.arrayContaining([
        "authoritative_procedure_artifact_not_admitted",
        "semantic_admission_artifact_not_admitted",
        "artifact_generation_receipt_not_admitted",
        "formal_claim_selection_required",
        "formal_theorem_selection_unregistered",
        "formal_theorem_type_digest_required",
        "semantic_to_lean_binding_required",
        "formal_import_closure_required",
        "formal_environment_policy_catalog_unconfigured",
        "formal_graph_snapshot_required",
        "formal_source_root_unconfigured",
      ]),
    );
    expect(
      await validateCasimirFormalVerificationPreparationReceiptIntegrityV1(
        receipt,
      ),
    ).toEqual([]);

    const plan =
      await executeTheoryFormalVerifierGatewayCapability({
        capabilityId: THEORY_FORMAL_VERIFIER_PLAN_CAPABILITY,
        args: {
          prepared_request_id: receipt.preparedRequestId,
        },
        accountType: "developer",
        profileId: "profile:formal-preparation",
        turnId: "ask:test:formal-plan",
      });
    expect(plan).toMatchObject({
      ok: false,
      status: "blocked",
      blockedReason: "formal_prepared_request_not_ready",
      error: "formal_prepared_request_not_ready",
    });
  });

  it("does not let an unrelated True theorem and self-hashed caller policy reach plan preflight", async () => {
    const result =
      await executeTheoryFormalVerifierGatewayCapability({
        capabilityId: THEORY_FORMAL_VERIFIER_PLAN_CAPABILITY,
        args: {
          request: {
            claim: {
              claimId: "claim:unrelated-scientific-proposition",
              propositionSha256: "c".repeat(64),
            },
            formalArtifact: {
              theoremName: "unrelatedTrue",
              statementSha256: "c".repeat(64),
            },
          },
          policy: {
            policyId: "caller-self-hashed-policy",
            artifactSha256: "d".repeat(64),
          },
          theorem_source_path: "C:\\caller\\UnrelatedTrue.lean",
          import_source_paths: {},
        },
        accountType: "developer",
        profileId: "profile:formal-preparation",
        turnId: "ask:test:unrelated-true",
      });

    expect(result).toMatchObject({
      ok: false,
      status: "missing_input",
      admissionReason:
        "formal_verifier_prepared_request_gate_blocked",
      blockedReason: "formal_prepared_request_required",
      error: "formal_prepared_request_required",
    });
    expect(
      (result.observation as Record<string, any>).next_affordances,
    ).toEqual([]);
  });
});
