import { describe, expect, it } from "vitest";

import {
  STARSIM_FUSION_CLAIM_IDS,
  STARSIM_FUSION_CLAIM_SOURCES,
  STARSIM_FUSION_CLAIM_SOURCE_ROLES,
  STARSIM_FUSION_CLAIM_UNCERTAINTY_NOTES,
  STARSIM_FUSION_CLAIM_VALIDITY_DOMAINS,
  STARSIM_FUSION_SOURCE_REFERENCES,
  citationsForStarSimFusionClaims,
  sourceRolesForStarSimFusionClaims,
  uncertaintyNotesForStarSimFusionClaims,
  validityDomainsForStarSimFusionClaims,
  type StarSimFusionClaimId,
} from "../shared/starsim-fusion-claims";

describe("StarSim fusion claim provenance", () => {
  const claimIds = Object.values(STARSIM_FUSION_CLAIM_IDS) as StarSimFusionClaimId[];

  it("tracks reusable source references for future patches", () => {
    expect(Object.keys(STARSIM_FUSION_SOURCE_REFERENCES).length).toBeGreaterThanOrEqual(8);
    for (const source of Object.values(STARSIM_FUSION_SOURCE_REFERENCES)) {
      expect(source.id).toBeTruthy();
      expect(source.title).toBeTruthy();
      expect(source.url).toMatch(/^https?:\/\//);
      expect(source.note).toBeTruthy();
    }
  });

  it("gives every claim a citation, source role, uncertainty note, and validity domain", () => {
    for (const claimId of claimIds) {
      expect(STARSIM_FUSION_CLAIM_SOURCES[claimId].length).toBeGreaterThan(0);
      expect(STARSIM_FUSION_CLAIM_SOURCE_ROLES[claimId]).toBeTruthy();
      expect(STARSIM_FUSION_CLAIM_UNCERTAINTY_NOTES[claimId]).toBeTruthy();
      expect(STARSIM_FUSION_CLAIM_VALIDITY_DOMAINS[claimId].system).toBeTruthy();
      expect(STARSIM_FUSION_CLAIM_VALIDITY_DOMAINS[claimId].constraints).toContain(
        "proxy-only",
      );
    }
  });

  it("materializes source roles, uncertainty notes, validity domains, and citations from claim IDs", () => {
    const subset = [
      STARSIM_FUSION_CLAIM_IDS.ppChainFusionRateMicrophysics,
      STARSIM_FUSION_CLAIM_IDS.stellarMicrophysicsNotDirectErEprEvidence,
    ];

    expect(citationsForStarSimFusionClaims(subset).length).toBeGreaterThanOrEqual(2);
    expect(Object.keys(sourceRolesForStarSimFusionClaims(subset))).toEqual(subset);
    expect(uncertaintyNotesForStarSimFusionClaims(subset)).toHaveLength(2);
    expect(Object.keys(validityDomainsForStarSimFusionClaims(subset))).toEqual(subset);
  });
});
