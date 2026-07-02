import {
  buildCivilizationSourceMeasurementCollectionV1,
  buildCivilizationSourceMeasurementV1,
  type CivilizationMeasurementDomainV1,
  type CivilizationSourceMeasurementCollectionV1,
} from "@shared/civilization-source-measurement";
import type { CivilizationLiveSourceRequest } from "./source-registry";

type CoopsDataRow = {
  t?: unknown;
  v?: unknown;
  s?: unknown;
  d?: unknown;
  b?: unknown;
  q?: unknown;
};

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const rowsFromPayload = (payload: unknown): CoopsDataRow[] => {
  const record = payload as { data?: unknown; predictions?: unknown; current_predictions?: unknown };
  if (Array.isArray(record.data)) return record.data as CoopsDataRow[];
  if (Array.isArray(record.predictions)) return record.predictions as CoopsDataRow[];
  if (Array.isArray(record.current_predictions)) return record.current_predictions as CoopsDataRow[];
  return [];
};

function productDomain(product: string): CivilizationMeasurementDomainV1 {
  if (product === "currents") return "current_velocity";
  if (product === "predictions") return "tide_height";
  return "water_level";
}

export function normalizeNoaaCoopsData(
  payload: unknown,
  request: Extract<CivilizationLiveSourceRequest, { sourceId: "noaa_coops_data_api" }>,
  options?: { fetchedAt?: string; collectionId?: string; stationLabel?: string; lat?: number; lon?: number },
): CivilizationSourceMeasurementCollectionV1 {
  const fetchedAt = options?.fetchedAt ?? new Date().toISOString();
  const rows = rowsFromPayload(payload);
  const domain = productDomain(request.params.product);
  const measurements = rows.map((row, index) => {
    const observedAt = typeof row.t === "string" && row.t.trim().length > 0 ? row.t : fetchedAt;
    const value = asNumber(row.v ?? row.s);
    const directionDegrees = asNumber(row.d);
    const bin = asNumber(row.b);
    return buildCivilizationSourceMeasurementV1({
      measurementId: `measurement:noaa-coops:${request.params.station}:${request.params.product}:${index}`,
      sourceKind: "noaa_coops",
      sourceId: request.sourceId,
      sourceUrl: request.url,
      fetchedAt,
      observedAt,
      domain,
      label: `${options?.stationLabel ?? request.params.station} ${request.params.product}`,
      geometry: {
        kind: "station",
        refId: `station:noaa-coops:${request.params.station}`,
        label: options?.stationLabel ?? `NOAA CO-OPS station ${request.params.station}`,
        coordinates:
          typeof options?.lat === "number" && typeof options?.lon === "number"
            ? { lat: options.lat, lon: options.lon }
            : null,
      },
      quantity: {
        name: domain === "current_velocity" ? "current_speed" : request.params.product,
        value,
        unit: request.params.units === "english" ? "english" : "metric",
        vector: domain === "current_velocity"
          ? { speed: value, directionDegrees }
          : undefined,
        qualifier: bin == null ? undefined : `bin:${bin}`,
      },
      confidence: row.q === "v" ? 0.82 : 0.62,
      uncertainty: row.q === "v" ? 0.18 : 0.34,
      sourceRefs: request.sourceRefs,
      evidenceRefs: ["source:noaa-coops-data-api", `station:${request.params.station}`],
      rawRecordRefs: [`noaa-coops:${request.params.station}:${index}`],
      missingEvidence: value == null ? [`${request.params.product}_value`] : [],
    });
  });
  return buildCivilizationSourceMeasurementCollectionV1({
    collectionId: options?.collectionId ?? `measurement-collection:noaa-coops:${request.params.station}:${fetchedAt}`,
    generatedAt: fetchedAt,
    sourceKind: "noaa_coops",
    sourceId: request.sourceId,
    sourceUrl: request.url,
    measurements,
    missingEvidence: rows.length === 0 ? ["noaa_coops_data_rows"] : [],
  });
}

