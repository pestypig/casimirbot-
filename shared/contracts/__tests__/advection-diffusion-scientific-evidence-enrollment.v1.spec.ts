import { describe, expect, it } from "vitest";

import { validateScientificEvidenceConformanceManifestV1 } from "../scientific-evidence-conformance-manifest.v1";
import {
  ADVECTION_DIFFUSION_INDEPENDENT_LINEAGE_ID,
  ADVECTION_DIFFUSION_PRIMARY_LINEAGE_ID,
  buildAdvectionDiffusionScientificEvidenceEnrollmentV1,
} from "../../scientific-evidence/advection-diffusion-scientific-evidence-enrollment";

describe("advection-diffusion scientific evidence enrollment", () => {
  it("seals source, semantic, graph, formal, and numerical identities", async () => {
    const enrollment =
      await buildAdvectionDiffusionScientificEvidenceEnrollmentV1();
    expect(
      await validateScientificEvidenceConformanceManifestV1(
        enrollment.manifest,
      ),
    ).toEqual([]);
    expect(enrollment.graphSnapshot.badgeIds).toHaveLength(3);
    expect(enrollment.manifest.numericalContract.primaryLineageId).toBe(
      ADVECTION_DIFFUSION_PRIMARY_LINEAGE_ID,
    );
    expect(enrollment.manifest.numericalContract.independentLineageId).toBe(
      ADVECTION_DIFFUSION_INDEPENDENT_LINEAGE_ID,
    );
    expect(
      enrollment.manifest.semanticBindings.formalCasimirSpec.artifactSha256,
    ).not.toBe(
      enrollment.manifest.semanticBindings.numericalCasimirSpec.artifactSha256,
    );
    expect(enrollment.manifest.authority.terminalEligible).toBe(false);
  });

  it("is deterministic at a fixed enrollment timestamp", async () => {
    const first =
      await buildAdvectionDiffusionScientificEvidenceEnrollmentV1();
    const second =
      await buildAdvectionDiffusionScientificEvidenceEnrollmentV1();
    expect(second.manifest.artifactSha256).toBe(
      first.manifest.artifactSha256,
    );
    expect(second.graphSnapshot.artifactSha256).toBe(
      first.graphSnapshot.artifactSha256,
    );
  });
});
