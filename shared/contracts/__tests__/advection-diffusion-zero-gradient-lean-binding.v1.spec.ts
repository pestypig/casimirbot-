import { describe, expect, it } from "vitest";

import { validateCasimirSemanticToLeanBindingV1 } from "../casimir-semantic-to-lean-binding.v1";
import {
  ADVECTION_DIFFUSION_OBSERVED_THEOREM_TYPE_SHA256,
  ADVECTION_DIFFUSION_ZERO_GRADIENT_BINDING_ID,
  buildAdvectionDiffusionZeroGradientLeanBindingV1,
} from "../../scientific-evidence/advection-diffusion-zero-gradient-lean-binding";

describe("advection-diffusion zero-gradient Lean binding", () => {
  it("binds the reviewed semantic claim to the exact observed theorem type", async () => {
    const artifacts =
      await buildAdvectionDiffusionZeroGradientLeanBindingV1();
    expect(await validateCasimirSemanticToLeanBindingV1(artifacts.binding)).toEqual(
      [],
    );
    expect(artifacts.binding.bindingId).toBe(
      ADVECTION_DIFFUSION_ZERO_GRADIENT_BINDING_ID,
    );
    expect(artifacts.binding.formalArtifact.observedTheoremTypeSha256).toBe(
      ADVECTION_DIFFUSION_OBSERVED_THEOREM_TYPE_SHA256,
    );
    expect(artifacts.binding.status).toBe("reviewed");
    expect(artifacts.binding.authority.formalPropositionChecked).toBe(false);
    expect(artifacts.binding.authority.terminalEligible).toBe(false);
  });

  it("is deterministic for a fixed review timestamp", async () => {
    const first =
      await buildAdvectionDiffusionZeroGradientLeanBindingV1();
    const second =
      await buildAdvectionDiffusionZeroGradientLeanBindingV1();
    expect(second.binding.artifactSha256).toBe(
      first.binding.artifactSha256,
    );
    expect(second.sourceAuditArtifactSha256).toBe(
      first.sourceAuditArtifactSha256,
    );
  });
});
