import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { hashStableJson } from "../../utils/information-boundary";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const cadenceUnitSchema = z.enum(["s", "min", "hour", "day", "carrington_rotation", "snapshot"]);

const solarReferenceDocSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  note: z.string().min(1),
});

const solarReferenceAnchorSchema = z.object({
  id: z.string().min(1),
  reference_basis: z.string().min(1),
  product_family: z.string().min(1),
  expected_summary: z.record(z.string(), z.unknown()),
  reference_doc_ids: z.array(z.string().min(1)).min(1),
});

const cadenceExpectationSchema = z.object({
  required: z.boolean(),
  allowed_units: z.array(cadenceUnitSchema).min(1),
  note: z.string().min(1),
});

const solarReferencePackSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  docs: z.record(z.string(), solarReferenceDocSchema),
  product_semantics: z.object({
    coordinate_frame: z.string().min(1),
    carrington_rotation_spread_max: z.number().nonnegative(),
    require_overlapping_time_ranges: z.boolean(),
    section_instrument_keywords: z.record(z.string(), z.array(z.string().min(1)).min(1)),
    section_cadence_expectations: z.record(z.string(), cadenceExpectationSchema),
  }),
  anchors: z.object({
    interior: z.object({
      convection_zone_depth: solarReferenceAnchorSchema,
      envelope_helium_fraction: solarReferenceAnchorSchema,
      low_degree_mode_support: solarReferenceAnchorSchema,
      neutrino_constraint_vector: solarReferenceAnchorSchema,
    }),
    structural_residuals: z.object({
      hydrostatic_balance_context: solarReferenceAnchorSchema,
      sound_speed_residual_context: solarReferenceAnchorSchema,
      rotation_residual_context: solarReferenceAnchorSchema,
      pressure_scale_height_continuity_context: solarReferenceAnchorSchema,
      neutrino_seismic_consistency_context: solarReferenceAnchorSchema,
      residual_metadata_coherence_context: solarReferenceAnchorSchema,
    }),
    local_helio: z.object({
      dopplergram_context: solarReferenceAnchorSchema,
      travel_time_or_holography_context: solarReferenceAnchorSchema,
      sunquake_event_context: solarReferenceAnchorSchema,
    }),
    cycle: z.object({
      cycle_indices: solarReferenceAnchorSchema,
      chronology_window: solarReferenceAnchorSchema,
      polarity_reversal_context: solarReferenceAnchorSchema,
      butterfly_history: solarReferenceAnchorSchema,
      axial_dipole_history: solarReferenceAnchorSchema,
      magnetogram_context: solarReferenceAnchorSchema,
      active_region_context: solarReferenceAnchorSchema,
      irradiance_continuity: solarReferenceAnchorSchema,
    }),
    surface_flow: z.object({
      differential_rotation_context: solarReferenceAnchorSchema,
      meridional_flow_context: solarReferenceAnchorSchema,
      surface_transport_proxy_context: solarReferenceAnchorSchema,
      active_region_geometry_context: solarReferenceAnchorSchema,
    }),
    coronal_field: z.object({
      pfss_context: solarReferenceAnchorSchema,
      synoptic_boundary_context: solarReferenceAnchorSchema,
      open_field_topology_context: solarReferenceAnchorSchema,
      source_region_linkage_context: solarReferenceAnchorSchema,
      metadata_coherence_context: solarReferenceAnchorSchema,
      euv_coronal_context: solarReferenceAnchorSchema,
    }),
    magnetic_memory: z.object({
      axial_dipole_continuity_context: solarReferenceAnchorSchema,
      polar_field_continuity_context: solarReferenceAnchorSchema,
      reversal_linkage_context: solarReferenceAnchorSchema,
      active_region_polarity_ordering_context: solarReferenceAnchorSchema,
      hemisphere_bipolar_coverage_context: solarReferenceAnchorSchema,
      bipolar_region_proxy_context: solarReferenceAnchorSchema,
    }),
    spot_region: z.object({
      sunspot_catalog_context: solarReferenceAnchorSchema,
      spot_geometry_context: solarReferenceAnchorSchema,
      spot_region_linkage_context: solarReferenceAnchorSchema,
      bipolar_grouping_context: solarReferenceAnchorSchema,
      polarity_tilt_context: solarReferenceAnchorSchema,
    }),
    event_linkage: z.object({
      flare_region_linkage_context: solarReferenceAnchorSchema,
      cme_region_linkage_context: solarReferenceAnchorSchema,
      sunquake_flare_region_linkage_context: solarReferenceAnchorSchema,
      event_chronology_alignment_context: solarReferenceAnchorSchema,
      region_identifier_consistency_context: solarReferenceAnchorSchema,
    }),
    topology_linkage: z.object({
      spot_region_corona_context: solarReferenceAnchorSchema,
      open_flux_polar_field_continuity_context: solarReferenceAnchorSchema,
      event_topology_context: solarReferenceAnchorSchema,
      topology_role_context: solarReferenceAnchorSchema,
      chronology_alignment_context: solarReferenceAnchorSchema,
      identifier_consistency_context: solarReferenceAnchorSchema,
    }),
    cross_layer_consistency: z.object({
      interior_residual_coherence: solarReferenceAnchorSchema,
      mode_residual_coherence: solarReferenceAnchorSchema,
      rotation_residual_coherence: solarReferenceAnchorSchema,
      cycle_memory_topology_coherence: solarReferenceAnchorSchema,
      event_topology_identifier_coherence: solarReferenceAnchorSchema,
      chronology_metadata_alignment: solarReferenceAnchorSchema,
    }),
    eruptive: z.object({
      flare_catalog: solarReferenceAnchorSchema,
      cme_catalog: solarReferenceAnchorSchema,
      irradiance_continuity: solarReferenceAnchorSchema,
      source_region_linkage: solarReferenceAnchorSchema,
    }),
    consistency: z.object({
      source_region_overlap: solarReferenceAnchorSchema,
      magnetogram_active_region_linkage: solarReferenceAnchorSchema,
      irradiance_context_consistency: solarReferenceAnchorSchema,
      phase_metadata_coherence: solarReferenceAnchorSchema,
    }),
  }),
});

export type StarSimSolarReferenceDoc = z.infer<typeof solarReferenceDocSchema>;
export type StarSimSolarReferenceAnchor = z.infer<typeof solarReferenceAnchorSchema>;
export type StarSimSolarReferencePack = z.infer<typeof solarReferencePackSchema>;
export type StarSimSolarReferenceCadenceExpectation = z.infer<typeof cadenceExpectationSchema>;

export interface StarSimSolarReferencePackIdentity {
  id: string;
  version: string;
  content_hash: string;
  ref: string;
}

export interface LoadedStarSimSolarReferencePack extends StarSimSolarReferencePackIdentity {
  pack: StarSimSolarReferencePack;
}

export const SOLAR_REFERENCE_PACK_RELATIVE_PATH = "data/starsim/solar-reference-pack.v1.json" as const;

let solarReferencePackOverride: LoadedStarSimSolarReferencePack | null = null;
let cachedSolarReferencePack: LoadedStarSimSolarReferencePack | null = null;

const normalizeRef = (filePath: string): string => path.relative(process.cwd(), filePath).replace(/\\/g, "/");

const getAllAnchors = (pack: StarSimSolarReferencePack): StarSimSolarReferenceAnchor[] => [
  ...Object.values(pack.anchors.interior),
  ...Object.values(pack.anchors.structural_residuals),
  ...Object.values(pack.anchors.local_helio),
  ...Object.values(pack.anchors.cycle),
  ...Object.values(pack.anchors.surface_flow),
  ...Object.values(pack.anchors.coronal_field),
  ...Object.values(pack.anchors.magnetic_memory),
  ...Object.values(pack.anchors.spot_region),
  ...Object.values(pack.anchors.event_linkage),
  ...Object.values(pack.anchors.topology_linkage),
  ...Object.values(pack.anchors.cross_layer_consistency),
  ...Object.values(pack.anchors.eruptive),
  ...Object.values(pack.anchors.consistency),
];

const validateSolarReferencePack = (
  packCandidate: unknown,
  sourceLabel: string,
): StarSimSolarReferencePack => {
  const parsed = solarReferencePackSchema.safeParse(packCandidate);
  if (!parsed.success) {
    throw new Error(`Invalid solar reference pack at ${sourceLabel}: ${parsed.error.message}`);
  }
  const pack = parsed.data;
  const docIds = new Set(Object.keys(pack.docs));
  for (const [docKey, doc] of Object.entries(pack.docs)) {
    if (doc.id !== docKey) {
      throw new Error(`Invalid solar reference pack at ${sourceLabel}: doc key ${docKey} must match doc.id ${doc.id}.`);
    }
  }
  const seenAnchorIds = new Set<string>();
  for (const anchor of getAllAnchors(pack)) {
    if (seenAnchorIds.has(anchor.id)) {
      throw new Error(`Invalid solar reference pack at ${sourceLabel}: duplicate anchor id ${anchor.id}.`);
    }
    seenAnchorIds.add(anchor.id);
    for (const referenceDocId of anchor.reference_doc_ids) {
      if (!docIds.has(referenceDocId)) {
        throw new Error(
          `Invalid solar reference pack at ${sourceLabel}: anchor ${anchor.id} references unknown doc id ${referenceDocId}.`,
        );
      }
    }
  }
  return pack;
};

const finalizeLoadedPack = (pack: StarSimSolarReferencePack, ref: string): LoadedStarSimSolarReferencePack => ({
  id: pack.id,
  version: pack.version,
  content_hash: hashStableJson(pack),
  ref,
  pack,
});

export const loadSolarReferencePackFromPath = (filePath: string): LoadedStarSimSolarReferencePack => {
  const sourceLabel = path.resolve(filePath);
  let raw: string;
  try {
    raw = fs.readFileSync(sourceLabel, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read solar reference pack at ${sourceLabel}: ${message}`);
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse solar reference pack JSON at ${sourceLabel}: ${message}`);
  }

  const pack = validateSolarReferencePack(parsedJson, sourceLabel);
  return finalizeLoadedPack(pack, normalizeRef(sourceLabel));
};

const loadDefaultSolarReferencePack = (): LoadedStarSimSolarReferencePack => {
  const absolutePath = path.resolve(process.cwd(), SOLAR_REFERENCE_PACK_RELATIVE_PATH);
  return loadSolarReferencePackFromPath(absolutePath);
};

const getLoadedSolarReferencePack = (): LoadedStarSimSolarReferencePack => {
  if (solarReferencePackOverride) {
    return clone(solarReferencePackOverride);
  }
  if (!cachedSolarReferencePack) {
    cachedSolarReferencePack = loadDefaultSolarReferencePack();
  }
  return clone(cachedSolarReferencePack);
};

export const getSolarReferencePack = (): StarSimSolarReferencePack => getLoadedSolarReferencePack().pack;

export const getSolarReferencePackIdentity = (): StarSimSolarReferencePackIdentity => {
  const loaded = getLoadedSolarReferencePack();
  return {
    id: loaded.id,
    version: loaded.version,
    content_hash: loaded.content_hash,
    ref: loaded.ref,
  };
};

export const __setSolarReferencePackForTest = (pack: StarSimSolarReferencePack | null): void => {
  solarReferencePackOverride = pack
    ? finalizeLoadedPack(validateSolarReferencePack(clone(pack), "test override"), "test:override")
    : null;
};

export const __resetSolarReferencePackForTest = (): void => {
  solarReferencePackOverride = null;
  cachedSolarReferencePack = null;
};
