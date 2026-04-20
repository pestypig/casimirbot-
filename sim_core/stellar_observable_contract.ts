import type {
  ObservableContractV1,
  ObservableDomainSpecV1,
  SharedObservableCoverageMode,
} from "../shared/contracts/observable-contract.v1";
import { SHARED_OBSERVABLE_CONTRACT_SCHEMA_VERSION } from "../shared/contracts/observable-contract.v1";
import type {
  StellarBenchmarkObservable,
  StellarCoverageMode,
  StellarSpectrumObservation,
} from "./stellar_viability";

export interface StellarObservableContractV1 extends ObservableContractV1 {
  lane_id: "stellar_radiation";
  coverage_mode: SharedObservableCoverageMode;
  benchmark_id: string | null;
  reference_kind: string | null;
  intended_observables: StellarBenchmarkObservable[];
}

function toCoverageMode(mode: StellarCoverageMode | undefined): SharedObservableCoverageMode {
  if (mode === "band_limited") {
    return "band_limited";
  }
  return "full_spectrum";
}

function inferDomain(observation: StellarSpectrumObservation): ObservableDomainSpecV1 | undefined {
  if (observation.valid_domain) {
    return {
      axis_id: "wavelength_m",
      min: observation.valid_domain.lambda_min_m,
      max: observation.valid_domain.lambda_max_m,
    };
  }
  if (!observation.wavelength_m || observation.wavelength_m.length === 0) {
    return undefined;
  }
  return {
    axis_id: "wavelength_m",
    min: Number(observation.wavelength_m[0]) || 0,
    max: Number(observation.wavelength_m[observation.wavelength_m.length - 1]) || 0,
  };
}

export function toStellarObservableContract(
  observation: StellarSpectrumObservation,
  options: {
    observable_id?: string;
    values_ref?: string;
    source_url?: string;
  } = {},
): StellarObservableContractV1 {
  const coverageMode = toCoverageMode(observation.coverage_mode);
  const benchmarkId = observation.benchmark_id ?? null;
  const referenceKind = observation.reference_kind ?? null;
  const provenanceClass = referenceKind ? "observed" : "synthetic_observed";
  const domain = inferDomain(observation);
  const intendedObservables = observation.intended_observables
    ? [...observation.intended_observables]
    : ([] as StellarBenchmarkObservable[]);
  const axes: StellarObservableContractV1["axes"] = [
    {
      axis_id: "wavelength_m",
      role: "wavelength",
      unit: "m",
      monotonic: true,
    },
  ];
  if (observation.mu_grid && observation.mu_grid.length > 0) {
    axes.push({
      axis_id: "mu",
      role: "mu",
      unit: "dimensionless",
      monotonic: true,
    });
  }

  return {
    schema_version: SHARED_OBSERVABLE_CONTRACT_SCHEMA_VERSION,
    observable_id: options.observable_id ?? benchmarkId ?? "stellar_observation",
    lane_id: "stellar_radiation",
    modality: "spectrum",
    axes,
    units: "arb_intensity_units",
    values_ref: options.values_ref,
    values: observation.intensity,
    valid_mask: observation.quality_mask
      ? Array.from(observation.quality_mask, (value) => Boolean(value))
      : undefined,
    raw_mask_semantics: observation.quality_mask ? "native" : undefined,
    coverage_mode: coverageMode,
    valid_domain: domain,
    error:
      observation.uncertainty || observation.quality_mask
        ? {
            sigma: observation.uncertainty,
            quality_mask: observation.quality_mask,
            quality_label: observation.quality_label,
          }
        : undefined,
    response_model: {
      id: "stellar_radiative_transfer_forward_model",
      kind: "radiative_transfer",
      notes: "Maps atmosphere and closure assumptions into synthetic spectral observables.",
    },
    provenance: {
      source_id: benchmarkId ?? "stellar_fixture_or_synthetic_observation",
      source_family: referenceKind ?? undefined,
      source_url: options.source_url,
      citation_refs: [],
    },
    claim_tier: "diagnostic",
    provenance_class: provenanceClass,
    intended_observables: intendedObservables,
    benchmark_id: benchmarkId,
    reference_kind: referenceKind,
  };
}
