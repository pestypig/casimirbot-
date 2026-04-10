import { OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY } from "./observable-universe-accordion-projections-constants";

export const OBSERVABLE_UNIVERSE_ACCORDION_CATALOG_CONTRACT_VERSION = 1 as const;

export const OBSERVABLE_UNIVERSE_ACCORDION_CATALOG_PRESET_NEARBY_LOCAL_REST_SMALL =
  "nearby_local_rest_small" as const;

export type ObservableUniverseAccordionCatalogPresetId =
  typeof OBSERVABLE_UNIVERSE_ACCORDION_CATALOG_PRESET_NEARBY_LOCAL_REST_SMALL;

export type ObservableUniverseAccordionCatalogSupportPolicy =
  "explicit_nhm2_contract_only";

export type ObservableUniverseAccordionCatalogEtaContractState =
  | "explicit_nhm2_projection_contract"
  | "render_only_pending_explicit_projection_contract";

export type ObservableUniverseAccordionCatalogSupportEvidence = {
  evidenceKind: "explicit_nhm2_projection_artifact_bundle";
  policySource: "OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY";
  targetId: string;
  targetFrame: "heliocentric-icrs";
  defaultOperatingProfileId: string;
  supportedBandFloorProfileId: string;
  supportedBandCeilingProfileId: string;
  evidenceFloorProfileId: string;
  sourceBoundaryArtifactPath: string;
  sourceDefaultMissionTimeComparisonArtifactPath: string;
  sourceSupportedFloorMissionTimeComparisonArtifactPath: string;
  sourceSupportedBandCeilingReferenceArtifactPath: string;
  sourceEvidenceFloorMissionTimeComparisonArtifactPath: string;
};

export type ObservableUniverseAccordionCatalogContractEntry = {
  id: string;
  label: string;
  visibleByDefault: boolean;
  displayOrder: number;
  etaContractState: ObservableUniverseAccordionCatalogEtaContractState;
  etaEligible: boolean;
  etaSelectable: boolean;
  supportPolicy: ObservableUniverseAccordionCatalogSupportPolicy;
  supportEvidence: ObservableUniverseAccordionCatalogSupportEvidence | null;
  supportReason: string;
  notes?: string;
};

const EXPLICIT_NHM2_PROJECTION_SUPPORT_EVIDENCE: ObservableUniverseAccordionCatalogSupportEvidence =
  {
    evidenceKind: "explicit_nhm2_projection_artifact_bundle",
    policySource: "OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY",
    targetId: "alpha-cen-a",
    targetFrame: "heliocentric-icrs",
    defaultOperatingProfileId: OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY.defaultOperatingProfileId,
    supportedBandFloorProfileId:
      OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY.supportedBandFloorProfileId,
    supportedBandCeilingProfileId:
      OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY.supportedBandCeilingProfileId,
    evidenceFloorProfileId: OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY.evidenceFloorProfileId,
    sourceBoundaryArtifactPath:
      OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY.sourceBoundaryArtifactPath,
    sourceDefaultMissionTimeComparisonArtifactPath:
      OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY.sourceDefaultMissionTimeComparisonArtifactPath,
    sourceSupportedFloorMissionTimeComparisonArtifactPath:
      OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY
        .sourceSupportedFloorMissionTimeComparisonArtifactPath,
    sourceSupportedBandCeilingReferenceArtifactPath:
      OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY.sourceSupportedBandCeilingReferenceArtifactPath,
    sourceEvidenceFloorMissionTimeComparisonArtifactPath:
      OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY
        .sourceEvidenceFloorMissionTimeComparisonArtifactPath,
  };

const OBSERVABLE_UNIVERSE_ACCORDION_NEARBY_CATALOG_V1: readonly ObservableUniverseAccordionCatalogContractEntry[] =
  [
    {
      id: "alpha-cen-a",
      label: "Alpha Centauri A",
      visibleByDefault: true,
      displayOrder: 10,
      etaContractState: "explicit_nhm2_projection_contract",
      etaEligible: true,
      etaSelectable: true,
      supportPolicy: "explicit_nhm2_contract_only",
      supportEvidence: EXPLICIT_NHM2_PROJECTION_SUPPORT_EVIDENCE,
      supportReason:
        "Explicit NHM2 accordion projection evidence is registered for this target.",
      notes: "Current explicit NHM2 contract-backed nearby target.",
    },
    {
      id: "proxima",
      label: "Proxima Centauri",
      visibleByDefault: true,
      displayOrder: 20,
      etaContractState: "render_only_pending_explicit_projection_contract",
      etaEligible: false,
      etaSelectable: false,
      supportPolicy: "explicit_nhm2_contract_only",
      supportEvidence: null,
      supportReason:
        "Visible nearby target, but the current accordion policy bundle does not register an explicit NHM2 trip-estimate artifact for this entry.",
      notes:
        "Visible nearby target; render-only until an explicit NHM2 accordion projection artifact exists.",
    },
    {
      id: "barnard",
      label: "Barnard's Star",
      visibleByDefault: true,
      displayOrder: 30,
      etaContractState: "render_only_pending_explicit_projection_contract",
      etaEligible: false,
      etaSelectable: false,
      supportPolicy: "explicit_nhm2_contract_only",
      supportEvidence: null,
      supportReason:
        "Visible nearby target, but no explicit NHM2 accordion trip-estimate artifact has been registered for this entry.",
      notes:
        "Visible nearby target; render-only until an explicit NHM2 accordion projection artifact exists.",
    },
  ] as const;

const compareCatalogEntries = (
  left: ObservableUniverseAccordionCatalogContractEntry,
  right: ObservableUniverseAccordionCatalogContractEntry,
): number =>
  left.displayOrder - right.displayOrder || left.label.localeCompare(right.label);

const normalizeCatalogId = (value: string | null | undefined): string =>
  (value ?? "").trim().toLowerCase();

export const getObservableUniverseAccordionNearbyCatalog = (): ObservableUniverseAccordionCatalogContractEntry[] =>
  [...OBSERVABLE_UNIVERSE_ACCORDION_NEARBY_CATALOG_V1].sort(compareCatalogEntries);

export const getObservableUniverseAccordionVisibleNearbyCatalog =
  (): ObservableUniverseAccordionCatalogContractEntry[] =>
    getObservableUniverseAccordionNearbyCatalog().filter((entry) => entry.visibleByDefault);

export const getObservableUniverseAccordionEtaEligibleNearbyCatalog =
  (): ObservableUniverseAccordionCatalogContractEntry[] =>
    getObservableUniverseAccordionVisibleNearbyCatalog().filter((entry) => entry.etaEligible);

export const getObservableUniverseAccordionEtaSelectableNearbyCatalog =
  (): ObservableUniverseAccordionCatalogContractEntry[] =>
    getObservableUniverseAccordionVisibleNearbyCatalog().filter(
      (entry) => entry.etaSelectable,
    );

export const getObservableUniverseAccordionDefaultActiveEtaCatalogEntry =
  (): ObservableUniverseAccordionCatalogContractEntry | null =>
    getObservableUniverseAccordionEtaSelectableNearbyCatalog()[0] ?? null;

export const getObservableUniverseAccordionCatalogEntryById = (
  id: string | null | undefined,
): ObservableUniverseAccordionCatalogContractEntry | null => {
  const normalizedId = normalizeCatalogId(id);
  return (
    getObservableUniverseAccordionNearbyCatalog().find(
      (entry) => entry.id === normalizedId,
    ) ?? null
  );
};

export const isObservableUniverseAccordionEtaSelectableNearbyTarget = (
  id: string | null | undefined,
): boolean => getObservableUniverseAccordionCatalogEntryById(id)?.etaSelectable ?? false;
