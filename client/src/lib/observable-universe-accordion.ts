import type {
  AstronomyAstrometricState,
  AstronomyProvenanceClass,
  AstronomyReferenceFrameId,
  AstronomyTimeScale,
} from "@shared/contracts/astronomy-frame.v1";
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
  catalog: ObservableUniverseAccordionCatalogSeed[];
};

export const DEFAULT_OBSERVABLE_UNIVERSE_RENDER_EPOCH_TCB_JY = 2016.0;

export const OBSERVABLE_UNIVERSE_SUPPORTED_TARGET: ObservableUniverseAccordionCatalogSeed = {
  id: "alpha-cen-a",
  label: "Alpha Centauri A",
  frame_id: "ICRS",
  reference_epoch_tcb_jy: 2016.0,
  time_scale: "TCB",
  provenance_class: "observed",
  astrometry: {
    ra_deg: 219.9021,
    dec_deg: -60.8339,
    parallax_mas: 747.17,
    proper_motion_ra_masyr: -3619.4,
    proper_motion_dec_masyr: 686.1,
    radial_velocity_kms: -22.4,
  },
};

export const buildObservableUniverseAccordionRequest = (
  estimateKind: ObservableUniverseSupportedEtaMode = "proper_time",
): ObservableUniverseAccordionProjectRequest => ({
  projectionKind: "sun_centered_accessibility",
  sourceModel: "warp_worldline_route_time",
  etaMode: estimateKind,
  renderEpoch_tcb_jy: DEFAULT_OBSERVABLE_UNIVERSE_RENDER_EPOCH_TCB_JY,
  catalog: [OBSERVABLE_UNIVERSE_SUPPORTED_TARGET],
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
