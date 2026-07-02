import {
  buildCivilizationSourceMeasurementCollectionV1,
  buildCivilizationSourceMeasurementV1,
  type CivilizationSourceMeasurementCollectionV1,
} from "@shared/civilization-source-measurement";
import type { CivilizationLiveSourceRequest } from "./source-registry";

type UsgsFeature = {
  id?: unknown;
  properties?: {
    mag?: unknown;
    place?: unknown;
    time?: unknown;
    updated?: unknown;
    status?: unknown;
    type?: unknown;
    url?: unknown;
  };
  geometry?: {
    type?: unknown;
    coordinates?: unknown;
  };
};

const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const isoFromEpoch = (value: unknown, fallback: string): string => {
  const numeric = asNumber(value);
  if (numeric == null) return fallback;
  const date = new Date(numeric);
  return Number.isFinite(date.getTime()) ? date.toISOString() : fallback;
};

export function normalizeUsgsEarthquakeGeoJson(
  payload: unknown,
  request: Extract<CivilizationLiveSourceRequest, { sourceId: "usgs_earthquake_catalog" }>,
  options?: { fetchedAt?: string; collectionId?: string },
): CivilizationSourceMeasurementCollectionV1 {
  const fetchedAt = options?.fetchedAt ?? new Date().toISOString();
  const features = Array.isArray((payload as { features?: unknown })?.features)
    ? ((payload as { features: UsgsFeature[] }).features)
    : [];
  const measurements = features.flatMap((feature, index) => {
    const coordinates = Array.isArray(feature.geometry?.coordinates)
      ? feature.geometry.coordinates
      : [];
    const lon = asNumber(coordinates[0]);
    const lat = asNumber(coordinates[1]);
    if (lat == null || lon == null) return [];
    const depthKm = asNumber(coordinates[2]);
    const eventId = asString(feature.id) ?? `event-${index}`;
    const observedAt = isoFromEpoch(feature.properties?.time, fetchedAt);
    const updatedAt = isoFromEpoch(feature.properties?.updated, observedAt);
    const magnitude = asNumber(feature.properties?.mag);
    const sourceUrl = asString(feature.properties?.url) ?? request.url;
    return [
      buildCivilizationSourceMeasurementV1({
        measurementId: `measurement:usgs:earthquake:${eventId}`,
        sourceKind: "usgs_earthquake",
        sourceId: request.sourceId,
        sourceUrl,
        fetchedAt,
        observedAt,
        validFrom: observedAt,
        validTo: updatedAt,
        domain: "seismic_activity",
        label: asString(feature.properties?.place) ?? `USGS earthquake ${eventId}`,
        geometry: {
          kind: "point",
          refId: `geometry:usgs:earthquake:${eventId}`,
          label: "USGS earthquake epicenter",
          coordinates: { lat, lon, depthKm },
        },
        quantity: {
          name: "earthquake_magnitude",
          value: magnitude,
          unit: "magnitude",
          qualifier: asString(feature.properties?.type) ?? "earthquake",
        },
        confidence: feature.properties?.status === "reviewed" ? 0.82 : 0.64,
        uncertainty: feature.properties?.status === "reviewed" ? 0.18 : 0.36,
        sourceRefs: request.sourceRefs,
        evidenceRefs: ["source:usgs-earthquake-catalog", `usgs:event:${eventId}`],
        rawRecordRefs: [`usgs:feature:${eventId}`],
        missingEvidence: magnitude == null ? ["earthquake_magnitude"] : [],
      }),
    ];
  });
  return buildCivilizationSourceMeasurementCollectionV1({
    collectionId: options?.collectionId ?? `measurement-collection:usgs:${fetchedAt}`,
    generatedAt: fetchedAt,
    sourceKind: "usgs_earthquake",
    sourceId: request.sourceId,
    sourceUrl: request.url,
    measurements,
    missingEvidence: features.length === 0 ? ["usgs_geojson_features"] : [],
  });
}

