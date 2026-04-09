import type { AstronomyProvenanceClass } from "../../../shared/contracts/astronomy-frame.v1";

export const summarizeAstronomyProvenance = (
  classes: AstronomyProvenanceClass[],
): Record<AstronomyProvenanceClass, number> => {
  const summary: Record<AstronomyProvenanceClass, number> = {
    observed: 0,
    synthetic_truth: 0,
    synthetic_observed: 0,
    inferred: 0,
  };
  for (const value of classes) {
    summary[value] += 1;
  }
  return summary;
};

