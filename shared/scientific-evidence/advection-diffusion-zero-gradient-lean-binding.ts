import {
  buildCasimirSemanticToLeanBindingV1,
  type CasimirSemanticToLeanBindingV1,
} from "../contracts/casimir-semantic-to-lean-binding.v1";
import { computeCasimirSpecValueSha256V1 } from "../contracts/casimir-spec-scientific-claim-ir.v1";
import {
  ADVECTION_DIFFUSION_FORMAL_PROFILE_ID,
  ADVECTION_DIFFUSION_LANYON_SPEC_PATH,
  ADVECTION_DIFFUSION_LANYON_SPEC_SHA256,
  ADVECTION_DIFFUSION_ZERO_GRADIENT_CLAIM_ID,
  ADVECTION_DIFFUSION_ZERO_GRADIENT_SOURCE_PATH,
  ADVECTION_DIFFUSION_ZERO_GRADIENT_SOURCE_SHA256,
  ADVECTION_DIFFUSION_ZERO_GRADIENT_THEOREM_NAME,
  buildAdvectionDiffusionZeroGradientFormalSpecV1,
} from "./advection-diffusion-zero-gradient-formal-spec";

export const ADVECTION_DIFFUSION_LANYON_REPOSITORY_URI =
  "https://github.com/lanyonai/AdvectionDiffusion" as const;
export const ADVECTION_DIFFUSION_LANYON_COMMIT_SHA =
  "3d19be11e101121d8187230977f5a5aeba0daefe" as const;
export const ADVECTION_DIFFUSION_EMITTED_FORMAL_ARTIFACT_ID =
  "formal:scientific-evidence-closure-v1:advection-diffusion-zero-gradient" as const;
export const ADVECTION_DIFFUSION_EMITTED_THEOREM_MODULE =
  "ScientificEvidenceClosureV1.AdvectionDiffusionZeroGradient" as const;
export const ADVECTION_DIFFUSION_EMITTED_SOURCE_PATH =
  "formal/scientific-evidence-closure-v1/ScientificEvidenceClosureV1/AdvectionDiffusionZeroGradient.lean" as const;
export const ADVECTION_DIFFUSION_EMITTED_SOURCE_SHA256 =
  "5899000330d47089487b40f14218009210b1656b89ec210e24ce90b682c6e555" as const;
export const ADVECTION_DIFFUSION_UPSTREAM_DECLARATION_SHA256 =
  "418b24afc0a137dd880c749c22a9695d1fb2a5217ffe739d53044dab53353967" as const;
export const ADVECTION_DIFFUSION_UPSTREAM_PROPOSITION_SOURCE_SHA256 =
  "ba239bcc2e41014e25e89946011130154525f06d7b0658d11d694b466ee28a96" as const;
export const ADVECTION_DIFFUSION_OBSERVED_THEOREM_TYPE_SHA256 =
  "f9fb23df32de68474b1afee4f9430ae4510cc6812bd5ab5da733f3e0653d1310" as const;
export const ADVECTION_DIFFUSION_LEAN_KERNEL_SHA256 =
  "9b216deb50d37c32c829d1efaaa5bafd5560417d382df35a815489e31a31593f" as const;
export const ADVECTION_DIFFUSION_MATHLIB_LOCK_SHA256 =
  "74872897930e9ab15c051fb44b4c4fed14a605387ff763aa896a8c80e9fdae71" as const;
export const ADVECTION_DIFFUSION_MATHLIB_REAL_BASIC_SOURCE_SHA256 =
  "21830eaa26fbfed5b28f30ebc7d973c9b2b0941266b8adf5eef451ec759b94f1" as const;
export const ADVECTION_DIFFUSION_ZERO_GRADIENT_BINDING_ID =
  "binding:advection-diffusion-zero-gradient:lanyon-to-lean:v1" as const;
export const ADVECTION_DIFFUSION_ZERO_GRADIENT_REVIEW_POLICY_ID =
  "review-policy:scientific-evidence-contract-correspondence:v1" as const;

export const ADVECTION_DIFFUSION_ZERO_GRADIENT_CHECKED_TYPE =
  [
    "advection_diffusion_full_1d.xDiffusiveFluxConsistency (C : Coordinates) (U : State) (P : Parameters) :",
    "  have DU := { f_x := 0 };",
    "  (xDiffusiveFluxExprs C P U DU).diffusive_flux_f = 0",
  ].join("\n");

export type AdvectionDiffusionZeroGradientBindingArtifactsV1 = {
  binding: CasimirSemanticToLeanBindingV1;
  sourceAuditArtifactSha256: string;
  environmentPolicySha256: string;
  reviewArtifactSha256: string;
};

/**
 * Builds the reviewed identity bridge between the pinned Lanyon declaration,
 * the Casimir Spec proposition, and the dependency-minimal Lean replay slice.
 * The review is correspondence review only: it does not claim proof, solver
 * correctness, empirical support, or physical truth.
 */
export async function buildAdvectionDiffusionZeroGradientLeanBindingV1(
  generatedAt = "2026-07-30T00:00:00.000Z",
): Promise<AdvectionDiffusionZeroGradientBindingArtifactsV1> {
  const spec =
    await buildAdvectionDiffusionZeroGradientFormalSpecV1(generatedAt);
  const claim = spec.claims.find(
    (candidate) =>
      candidate.claimId === ADVECTION_DIFFUSION_ZERO_GRADIENT_CLAIM_ID,
  );
  if (!claim) throw new Error("zero-gradient semantic claim is missing");

  const sourceAudit = {
    repositoryUri: ADVECTION_DIFFUSION_LANYON_REPOSITORY_URI,
    commitSha: ADVECTION_DIFFUSION_LANYON_COMMIT_SHA,
    specification: {
      path: ADVECTION_DIFFUSION_LANYON_SPEC_PATH,
      sha256: ADVECTION_DIFFUSION_LANYON_SPEC_SHA256,
    },
    upstreamFormalSource: {
      path: ADVECTION_DIFFUSION_ZERO_GRADIENT_SOURCE_PATH,
      sha256: ADVECTION_DIFFUSION_ZERO_GRADIENT_SOURCE_SHA256,
      theoremName: ADVECTION_DIFFUSION_ZERO_GRADIENT_THEOREM_NAME,
      declarationSha256: ADVECTION_DIFFUSION_UPSTREAM_DECLARATION_SHA256,
      propositionSourceSha256:
        ADVECTION_DIFFUSION_UPSTREAM_PROPOSITION_SOURCE_SHA256,
    },
    emittedReplaySource: {
      path: ADVECTION_DIFFUSION_EMITTED_SOURCE_PATH,
      sha256: ADVECTION_DIFFUSION_EMITTED_SOURCE_SHA256,
      theoremName: ADVECTION_DIFFUSION_ZERO_GRADIENT_THEOREM_NAME,
      observedTheoremTypeSha256:
        ADVECTION_DIFFUSION_OBSERVED_THEOREM_TYPE_SHA256,
    },
  };
  const sourceAuditArtifactSha256 =
    await computeCasimirSpecValueSha256V1({
      domain: "scientific-evidence-formal-source-audit/v1",
      value: sourceAudit,
    });

  const environmentPolicy = {
    policyId: ADVECTION_DIFFUSION_FORMAL_PROFILE_ID,
    prover: "lean4",
    leanVersion: "4.31.0",
    mathlibVersion: "4.31.0",
    kernelBinarySha256: ADVECTION_DIFFUSION_LEAN_KERNEL_SHA256,
    dependencyLockSha256: ADVECTION_DIFFUSION_MATHLIB_LOCK_SHA256,
    imports: [
      {
        module: "Mathlib.Data.Real.Basic",
        sourceSha256: ADVECTION_DIFFUSION_MATHLIB_REAL_BASIC_SOURCE_SHA256,
      },
    ],
    replayCount: 2,
    productionCertificateRequiresExternalSandbox: true,
    hostWorkstationExecutionAllowed: false,
  };
  const environmentPolicySha256 =
    await computeCasimirSpecValueSha256V1({
      domain: "scientific-evidence-formal-environment-policy/v1",
      value: environmentPolicy,
    });

  const correspondence = {
    sourceDefinition: "F_diff = Dxx * f_x",
    semanticAssumption: "f_x = 0",
    semanticConclusion: "F_diff = 0",
    leanDefinition:
      "xDiffusiveFluxExprs ... { f_x := 0 } has diffusive_flux_f = Dxx * 0",
    leanConclusion:
      "(xDiffusiveFluxExprs C P U DU).diffusive_flux_f = 0",
    signConvention: "positive Dxx times f_x, exactly as pinned by Lanyon",
  };
  const correspondenceSha256 =
    await computeCasimirSpecValueSha256V1({
      domain: "scientific-evidence-translation-correspondence/v1",
      value: correspondence,
    });
  const assumptionCorrespondenceSha256 =
    await computeCasimirSpecValueSha256V1({
      domain: "scientific-evidence-assumption-correspondence/v1",
      value: {
        semantic: "f_x = 0",
        lean: "let DU : SpatialGradient := { f_x := 0 }",
      },
    });
  const unitsAndFramesCorrespondenceSha256 =
    await computeCasimirSpecValueSha256V1({
      domain: "scientific-evidence-units-frames-correspondence/v1",
      value: {
        Dxx: "m^2 s^-1",
        f_x: "m^-1",
        diffusiveFlux: "m s^-1",
        frame: "one-dimensional source-coordinate contract",
        theoremErasesUnitsAtFormalBoundary: true,
      },
    });
  const reviewerPolicySha256 =
    await computeCasimirSpecValueSha256V1({
      domain: "scientific-evidence-reviewer-policy/v1",
      value: {
        policyId:
          ADVECTION_DIFFUSION_ZERO_GRADIENT_REVIEW_POLICY_ID,
        requiredChecks: [
          "exact-source-hashes",
          "explicit-assumption-correspondence",
          "explicit-claim-ceiling",
          "observed-theorem-type",
          "sign-convention",
          "units-and-frame-correspondence",
        ].sort(),
        reviewDoesNotConferProofAuthority: true,
      },
    });
  const reviewArtifactId =
    "review:advection-diffusion-zero-gradient-correspondence:v1";
  const reviewArtifactSha256 =
    await computeCasimirSpecValueSha256V1({
      domain: "scientific-evidence-binding-review/v1",
      value: {
        reviewArtifactId,
        bindingId: ADVECTION_DIFFUSION_ZERO_GRADIENT_BINDING_ID,
        sourceAuditArtifactSha256,
        semanticPropositionSha256: claim.propositionSha256,
        correspondenceSha256,
        assumptionCorrespondenceSha256,
        unitsAndFramesCorrespondenceSha256,
        observedTheoremTypeSha256:
          ADVECTION_DIFFUSION_OBSERVED_THEOREM_TYPE_SHA256,
        disposition: "reviewed_correspondence_only",
      },
    });

  const binding = await buildCasimirSemanticToLeanBindingV1({
    generatedAt,
    bindingId: ADVECTION_DIFFUSION_ZERO_GRADIENT_BINDING_ID,
    status: "reviewed",
    casimirSpec: {
      specId: spec.specId,
      schemaVersion: spec.schemaVersion,
      semanticSha256: spec.semanticSha256,
      artifactSha256: spec.artifactSha256,
    },
    semanticClaim: {
      claimId: claim.claimId,
      propositionSha256: claim.propositionSha256,
    },
    formalArtifact: {
      formalArtifactId:
        ADVECTION_DIFFUSION_EMITTED_FORMAL_ARTIFACT_ID,
      sourceAuditArtifactSha256,
      sourceSha256: ADVECTION_DIFFUSION_EMITTED_SOURCE_SHA256,
      theoremName: ADVECTION_DIFFUSION_ZERO_GRADIENT_THEOREM_NAME,
      theoremModule: ADVECTION_DIFFUSION_EMITTED_THEOREM_MODULE,
      declarationSha256:
        ADVECTION_DIFFUSION_UPSTREAM_DECLARATION_SHA256,
      propositionSourceSha256:
        ADVECTION_DIFFUSION_UPSTREAM_PROPOSITION_SOURCE_SHA256,
      observedTheoremTypeSha256:
        ADVECTION_DIFFUSION_OBSERVED_THEOREM_TYPE_SHA256,
      environmentPolicySha256,
    },
    translation: {
      kind: "reviewed_translation_mapping",
      correspondenceSha256,
      assumptionCorrespondenceSha256,
      unitsAndFramesCorrespondenceSha256,
    },
    review: {
      reviewerPolicyId:
        ADVECTION_DIFFUSION_ZERO_GRADIENT_REVIEW_POLICY_ID,
      reviewerPolicySha256,
      reviewArtifactId,
      reviewArtifactSha256,
      reviewedAt: generatedAt,
    },
    limitations: [
      "The binding does not establish numerical implementation correctness.",
      "The binding does not establish the complete advection-diffusion PDE.",
      "The binding does not establish theory truth, empirical validity, or a physical mechanism.",
      "The local replay observation is not a production certificate without the enrolled external sandbox.",
    ].sort(),
  });
  return {
    binding,
    sourceAuditArtifactSha256,
    environmentPolicySha256,
    reviewArtifactSha256,
  };
}
