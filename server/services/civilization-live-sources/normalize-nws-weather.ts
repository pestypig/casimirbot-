import {
  buildCivilizationSourceMeasurementCollectionV1,
  buildCivilizationSourceMeasurementV1,
  type CivilizationSourceMeasurementCollectionV1,
} from "@shared/civilization-source-measurement";
import type { CivilizationLiveSourceRequest } from "./source-registry";

type NwsObservation = {
  properties?: {
    station?: unknown;
    timestamp?: unknown;
    textDescription?: unknown;
    temperature?: { value?: unknown; unitCode?: unknown };
    windSpeed?: { value?: unknown; unitCode?: unknown };
    windDirection?: { value?: unknown; unitCode?: unknown };
  };
  geometry?: {
    coordinates?: unknown;
  };
};

type NwsAlertFeature = {
  id?: unknown;
  properties?: {
    id?: unknown;
    sent?: unknown;
    effective?: unknown;
    expires?: unknown;
    event?: unknown;
    severity?: unknown;
    areaDesc?: unknown;
  };
};

const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const severityScore = (severity: string | null): number | null => {
  switch (severity?.toLowerCase()) {
    case "extreme":
      return 1;
    case "severe":
      return 0.8;
    case "moderate":
      return 0.55;
    case "minor":
      return 0.3;
    default:
      return null;
  }
};

export function normalizeNwsLatestObservation(
  payload: unknown,
  request: Extract<CivilizationLiveSourceRequest, { sourceId: "nws_weather_api" }>,
  options?: { fetchedAt?: string; collectionId?: string },
): CivilizationSourceMeasurementCollectionV1 {
  const fetchedAt = options?.fetchedAt ?? new Date().toISOString();
  const observation = payload as NwsObservation;
  const coordinates = Array.isArray(observation.geometry?.coordinates)
    ? observation.geometry.coordinates
    : [];
  const lon = asNumber(coordinates[0]);
  const lat = asNumber(coordinates[1]);
  const observedAt = asString(observation.properties?.timestamp) ?? fetchedAt;
  const stationId = request.params.stationId ?? asString(observation.properties?.station) ?? "unknown-station";
  const temperature = asNumber(observation.properties?.temperature?.value);
  const windSpeed = asNumber(observation.properties?.windSpeed?.value);
  const windDirection = asNumber(observation.properties?.windDirection?.value);
  const measurements = [
    buildCivilizationSourceMeasurementV1({
      measurementId: `measurement:nws:${stationId}:temperature:${observedAt}`,
      sourceKind: "nws_weather",
      sourceId: request.sourceId,
      sourceUrl: request.url,
      fetchedAt,
      observedAt,
      domain: "atmospheric_observation",
      label: `NWS temperature observation ${stationId}`,
      geometry: {
        kind: "station",
        refId: `station:nws:${stationId}`,
        label: `NWS station ${stationId}`,
        coordinates: lat != null && lon != null ? { lat, lon } : null,
      },
      quantity: {
        name: "temperature",
        value: temperature,
        unit: asString(observation.properties?.temperature?.unitCode) ?? "wmoUnit:degC",
        qualifier: asString(observation.properties?.textDescription) ?? undefined,
      },
      confidence: 0.68,
      uncertainty: 0.28,
      sourceRefs: request.sourceRefs,
      evidenceRefs: ["source:nws-weather-api", `station:${stationId}`],
      rawRecordRefs: [`nws:observation:${stationId}:${observedAt}`],
      missingEvidence: temperature == null ? ["temperature_value"] : [],
    }),
    buildCivilizationSourceMeasurementV1({
      measurementId: `measurement:nws:${stationId}:wind:${observedAt}`,
      sourceKind: "nws_weather",
      sourceId: request.sourceId,
      sourceUrl: request.url,
      fetchedAt,
      observedAt,
      domain: "wind_vector",
      label: `NWS wind observation ${stationId}`,
      geometry: {
        kind: "station",
        refId: `station:nws:${stationId}`,
        label: `NWS station ${stationId}`,
        coordinates: lat != null && lon != null ? { lat, lon } : null,
      },
      quantity: {
        name: "wind_vector",
        value: windSpeed,
        unit: asString(observation.properties?.windSpeed?.unitCode) ?? "wmoUnit:m_s-1",
        vector: { speed: windSpeed, directionDegrees: windDirection },
      },
      confidence: 0.66,
      uncertainty: 0.3,
      sourceRefs: request.sourceRefs,
      evidenceRefs: ["source:nws-weather-api", `station:${stationId}`],
      rawRecordRefs: [`nws:observation:${stationId}:${observedAt}`],
      missingEvidence: [
        ...(windSpeed == null ? ["wind_speed"] : []),
        ...(windDirection == null ? ["wind_direction"] : []),
      ],
    }),
  ];
  return buildCivilizationSourceMeasurementCollectionV1({
    collectionId: options?.collectionId ?? `measurement-collection:nws:${stationId}:${fetchedAt}`,
    generatedAt: fetchedAt,
    sourceKind: "nws_weather",
    sourceId: request.sourceId,
    sourceUrl: request.url,
    measurements,
    missingEvidence: [],
  });
}

export function normalizeNwsAlerts(
  payload: unknown,
  request: Extract<CivilizationLiveSourceRequest, { sourceId: "nws_weather_api" }>,
  options?: { fetchedAt?: string; collectionId?: string },
): CivilizationSourceMeasurementCollectionV1 {
  const fetchedAt = options?.fetchedAt ?? new Date().toISOString();
  const features = Array.isArray((payload as { features?: unknown })?.features)
    ? ((payload as { features: NwsAlertFeature[] }).features)
    : [];
  const measurements = features.map((feature, index) => {
    const alertId = asString(feature.properties?.id) ?? asString(feature.id) ?? `alert-${index}`;
    const severity = asString(feature.properties?.severity);
    return buildCivilizationSourceMeasurementV1({
      measurementId: `measurement:nws:alert:${alertId}`,
      sourceKind: "nws_weather",
      sourceId: request.sourceId,
      sourceUrl: request.url,
      fetchedAt,
      observedAt: asString(feature.properties?.sent) ?? fetchedAt,
      validFrom: asString(feature.properties?.effective) ?? undefined,
      validTo: asString(feature.properties?.expires) ?? undefined,
      domain: "weather_alert",
      label: asString(feature.properties?.event) ?? `NWS weather alert ${alertId}`,
      geometry: {
        kind: "external",
        refId: `geometry:nws:alert:${alertId}`,
        label: asString(feature.properties?.areaDesc) ?? "NWS alert area",
        sourceGeometryRef: asString(feature.id),
      },
      quantity: {
        name: "alert_severity",
        value: severityScore(severity),
        unit: "severity_score",
        qualifier: severity ?? undefined,
      },
      confidence: 0.76,
      uncertainty: 0.24,
      sourceRefs: request.sourceRefs,
      evidenceRefs: ["source:nws-weather-api", `nws:alert:${alertId}`],
      rawRecordRefs: [`nws:alert:${alertId}`],
      missingEvidence: severity == null ? ["alert_severity"] : [],
    });
  });
  return buildCivilizationSourceMeasurementCollectionV1({
    collectionId: options?.collectionId ?? `measurement-collection:nws-alerts:${fetchedAt}`,
    generatedAt: fetchedAt,
    sourceKind: "nws_weather",
    sourceId: request.sourceId,
    sourceUrl: request.url,
    measurements,
    missingEvidence: features.length === 0 ? ["nws_alert_features"] : [],
  });
}

