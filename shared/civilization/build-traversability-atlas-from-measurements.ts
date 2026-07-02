import {
  buildCivilizationTraversabilityAtlasV1,
  type CivilizationFieldLayerV1,
  type CivilizationTraversabilityAtlasV1,
  type CivilizationTraversabilityFieldLayerKindV1,
} from "../civilization-traversability-atlas";
import type {
  CivilizationMeasurementDomainV1,
  CivilizationSourceMeasurementCollectionV1,
  CivilizationSourceMeasurementV1,
} from "../civilization-source-measurement";

export type BuildTraversabilityAtlasFromMeasurementsInput = {
  scenarioId: string;
  title?: string;
  generatedAt?: string;
  atlasId?: string;
  collections: CivilizationSourceMeasurementCollectionV1[];
};

function domainToFieldKind(domain: CivilizationMeasurementDomainV1): CivilizationTraversabilityFieldLayerKindV1 {
  switch (domain) {
    case "seismic_activity":
      return "seismic_activity";
    case "tide_height":
      return "tide_height";
    case "water_level":
      return "water_level";
    case "current_velocity":
    case "ocean_current":
      return "ocean_current";
    case "wind_vector":
      return "atmospheric_wind";
    case "weather_alert":
      return "weather_alert";
    case "temperature_gradient":
    case "atmospheric_observation":
    default:
      return "climate_hazard";
  }
}

function safeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9:_-]+/g, "-").replace(/^-+|-+$/g, "") || "measurement";
}

function layerFromMeasurement(measurement: CivilizationSourceMeasurementV1): CivilizationFieldLayerV1 {
  const fieldLayerId = `field:measurement:${safeId(measurement.measurementId)}`;
  return {
    fieldLayerId,
    kind: domainToFieldKind(measurement.domain),
    label: measurement.label,
    temporalFrame: {
      observedAt: measurement.observedAt,
      ...(measurement.validFrom ? { validFrom: measurement.validFrom } : {}),
      ...(measurement.validTo ? { validTo: measurement.validTo } : {}),
      cadence: "near_real_time",
    },
    geometryRef: {
      refId: measurement.geometry.refId,
      kind: measurement.geometry.kind === "station" ? "point" : measurement.geometry.kind,
      description: measurement.geometry.label,
      sourceRefs: measurement.sourceRefs,
    },
    units: measurement.quantity.unit,
    resolution: measurement.geometry.kind === "station" ? "station observation" : measurement.geometry.kind,
    confidence: measurement.confidence,
    uncertainty: measurement.uncertainty,
    evidenceRefs: measurement.evidenceRefs,
    missingEvidence: measurement.missingEvidence,
    claimTier: "source_backed_observation",
  };
}

export function buildTraversabilityAtlasFromMeasurements(
  input: BuildTraversabilityAtlasFromMeasurementsInput,
): CivilizationTraversabilityAtlasV1 {
  const measurements = input.collections.flatMap((collection) => collection.measurements);
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const firstObservedAt = measurements[0]?.observedAt ?? generatedAt;
  const fieldLayers = measurements.map(layerFromMeasurement);
  return buildCivilizationTraversabilityAtlasV1({
    generatedAt,
    atlasId: input.atlasId ?? `civilization-traversability:measurements:${safeId(input.scenarioId)}`,
    scenarioId: input.scenarioId,
    title: input.title ?? "Planetary Traversability Measurement Atlas",
    temporalFrame: {
      observedAt: firstObservedAt,
      validFrom: measurements
        .map((measurement) => measurement.validFrom ?? measurement.observedAt)
        .sort()[0],
      validTo: measurements
        .map((measurement) => measurement.validTo ?? measurement.observedAt)
        .sort()
        .at(-1),
      cadence: "near_real_time",
    },
    fieldLayers,
    infrastructureNodes: [],
    routeCandidates: [],
    observedFlows: [],
  });
}

