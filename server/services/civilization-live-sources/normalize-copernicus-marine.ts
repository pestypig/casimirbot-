import {
  buildCivilizationSourceMeasurementCollectionV1,
  buildCivilizationSourceMeasurementV1,
  type CivilizationSourceMeasurementCollectionV1,
} from "@shared/civilization-source-measurement";
import type { CivilizationLiveSourceRequest } from "./source-registry";

export type CopernicusMarinePointSample = {
  sampleId: string;
  observedAt: string;
  lat: number;
  lon: number;
  depthMeters?: number | null;
  u?: number | null;
  v?: number | null;
  speed?: number | null;
  directionDegrees?: number | null;
  variable?: string;
  unit?: string;
  sourceRecordRef?: string;
};

const finiteOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export function normalizeCopernicusMarinePointSamples(
  samples: CopernicusMarinePointSample[],
  request: Extract<CivilizationLiveSourceRequest, { sourceId: "copernicus_marine_toolbox" }>,
  options?: { fetchedAt?: string; collectionId?: string },
): CivilizationSourceMeasurementCollectionV1 {
  const fetchedAt = options?.fetchedAt ?? new Date().toISOString();
  const measurements = samples.map((sample) => {
    const u = finiteOrNull(sample.u);
    const v = finiteOrNull(sample.v);
    const speed = finiteOrNull(sample.speed) ?? (u != null && v != null ? Math.sqrt(u * u + v * v) : null);
    return buildCivilizationSourceMeasurementV1({
      measurementId: `measurement:copernicus-marine:${request.params.datasetId}:${sample.sampleId}`,
      sourceKind: "copernicus_marine",
      sourceId: request.sourceId,
      sourceUrl: request.url,
      fetchedAt,
      observedAt: sample.observedAt,
      domain: "ocean_current",
      label: `Copernicus Marine ${sample.variable ?? request.params.variable ?? "current"} sample`,
      geometry: {
        kind: "point",
        refId: `geometry:copernicus-marine:${sample.sampleId}`,
        label: "Copernicus Marine point sample",
        coordinates: {
          lat: sample.lat,
          lon: sample.lon,
          depthKm: sample.depthMeters == null ? null : sample.depthMeters / 1000,
        },
      },
      quantity: {
        name: sample.variable ?? request.params.variable ?? "ocean_current",
        value: speed,
        unit: sample.unit ?? "m/s",
        vector: {
          speed,
          directionDegrees: finiteOrNull(sample.directionDegrees),
          u,
          v,
        },
      },
      confidence: 0.58,
      uncertainty: 0.34,
      sourceRefs: request.sourceRefs,
      evidenceRefs: [
        "source:copernicus-marine-toolbox",
        `dataset:${request.params.datasetId}`,
      ],
      rawRecordRefs: [sample.sourceRecordRef ?? `copernicus-marine:sample:${sample.sampleId}`],
      missingEvidence: speed == null ? ["ocean_current_speed"] : [],
    });
  });
  return buildCivilizationSourceMeasurementCollectionV1({
    collectionId: options?.collectionId ?? `measurement-collection:copernicus-marine:${request.params.datasetId}:${fetchedAt}`,
    generatedAt: fetchedAt,
    sourceKind: "copernicus_marine",
    sourceId: request.sourceId,
    sourceUrl: request.url,
    measurements,
    missingEvidence: samples.length === 0 ? ["copernicus_marine_samples"] : [],
  });
}

