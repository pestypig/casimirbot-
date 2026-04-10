import type {
  AstronomyAstrometricState,
  AstronomyProvenanceClass,
  AstronomyReferenceFrameId,
  AstronomyTimeScale,
} from "@shared/contracts/astronomy-frame.v1";
import {
  OBSERVABLE_UNIVERSE_ACCORDION_CATALOG_PRESET_NEARBY_LOCAL_REST_SMALL,
  type ObservableUniverseAccordionCatalogPresetId,
  getObservableUniverseAccordionDefaultActiveEtaCatalogEntry,
  getObservableUniverseAccordionEtaSelectableNearbyCatalog,
  getObservableUniverseAccordionVisibleNearbyCatalog,
} from "@shared/observable-universe-accordion-catalog.v1";
import type { ObservableUniverseSupportedEtaMode } from "@shared/observable-universe-accordion-projections-constants";
import type { ObservableUniverseAccordionEtaSurfaceResult } from "@shared/observable-universe-accordion-surfaces";

export type ObservableUniverseAccordionCatalogSeed = {
  id: string;
  label: string;
  frame_id: AstronomyReferenceFrameId;
  reference_epoch_tcb_jy: number;
  time_scale: AstronomyTimeScale;
  provenance_class: AstronomyProvenanceClass;
  astrometry: AstronomyAstrometricState;
};

export type ObservableUniverseAccordionProjectRequest = {
  projectionKind: "sun_centered_accessibility";
  sourceModel: "warp_worldline_route_time";
  etaMode: ObservableUniverseSupportedEtaMode;
  renderEpoch_tcb_jy: number;
  catalogPreset?: ObservableUniverseAccordionCatalogPresetId;
  catalog?: ObservableUniverseAccordionCatalogSeed[];
};

export const DEFAULT_OBSERVABLE_UNIVERSE_RENDER_EPOCH_TCB_JY = 2016.0;

const DEFAULT_ACTIVE_TARGET =
  getObservableUniverseAccordionDefaultActiveEtaCatalogEntry() ??
  getObservableUniverseAccordionVisibleNearbyCatalog()[0];

export const OBSERVABLE_UNIVERSE_ACTIVE_TARGET = DEFAULT_ACTIVE_TARGET
  ? {
      id: DEFAULT_ACTIVE_TARGET.id,
      label: DEFAULT_ACTIVE_TARGET.label,
    }
  : {
      id: "alpha-cen-a",
      label: "Alpha Centauri A",
    };

export const OBSERVABLE_UNIVERSE_NEARBY_VISIBLE_TARGETS =
  getObservableUniverseAccordionVisibleNearbyCatalog().map((entry) => ({
    id: entry.id,
    label: entry.label,
  }));

export const OBSERVABLE_UNIVERSE_ETA_SELECTABLE_TARGETS =
  getObservableUniverseAccordionEtaSelectableNearbyCatalog().map((entry) => ({
    id: entry.id,
    label: entry.label,
  }));

export const buildObservableUniverseAccordionRequest = (
  estimateKind: ObservableUniverseSupportedEtaMode = "proper_time",
): ObservableUniverseAccordionProjectRequest => ({
  projectionKind: "sun_centered_accessibility",
  sourceModel: "warp_worldline_route_time",
  etaMode: estimateKind,
  renderEpoch_tcb_jy: DEFAULT_OBSERVABLE_UNIVERSE_RENDER_EPOCH_TCB_JY,
  catalogPreset: OBSERVABLE_UNIVERSE_ACCORDION_CATALOG_PRESET_NEARBY_LOCAL_REST_SMALL,
});

export async function fetchObservableUniverseAccordionSurface(
  request: ObservableUniverseAccordionProjectRequest,
  signal?: AbortSignal,
): Promise<ObservableUniverseAccordionEtaSurfaceResult> {
  const response = await fetch("/api/helix/relativistic-map/project", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Observable universe accordion request failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    projection?: ObservableUniverseAccordionEtaSurfaceResult;
  };

  if (!payload?.projection || payload.projection.kind !== "observable_universe_accordion_eta_surface") {
    throw new Error("Observable universe accordion surface missing from route response");
  }

  return payload.projection;
}
