import type {
  HullRenderCertificateV1,
  HullScientificAtlasPaneId,
  HullScientificAtlasSidecarV1,
} from "@shared/hull-render-contract";
import { HULL_SCIENTIFIC_ATLAS_PANES } from "@shared/hull-render-contract";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

export const HULL_SCIENTIFIC_ATLAS_REQUIRED_PANES = [
  ...HULL_SCIENTIFIC_ATLAS_PANES,
] as const satisfies readonly HullScientificAtlasPaneId[];

export const HULL_SCIENTIFIC_ATLAS_PANE_CHANNEL_SETS: Record<
  HullScientificAtlasPaneId,
  string[]
> = {
  hull: ["hull_sdf", "tile_support_mask", "region_class"],
  adm: [
    "alpha",
    "beta_x",
    "beta_y",
    "beta_z",
    "gamma_xx",
    "gamma_xy",
    "gamma_xz",
    "gamma_yy",
    "gamma_yz",
    "gamma_zz",
    "K_xx",
    "K_xy",
    "K_xz",
    "K_yy",
    "K_yz",
    "K_zz",
    "K_trace",
  ],
  derived: [
    "theta",
    "rho",
    "H_constraint",
    "M_constraint_x",
    "M_constraint_y",
    "M_constraint_z",
  ],
  causal: ["alpha", "beta_z", "hull_sdf", "tile_support_mask", "region_class"],
  optical: [
    "alpha",
    "beta_x",
    "beta_y",
    "beta_z",
    "gamma_xx",
    "gamma_xy",
    "gamma_xz",
    "gamma_yy",
    "gamma_yz",
    "gamma_zz",
    "theta",
    "rho",
  ],
};

export type HullScientificAtlasValidationReason =
  | "scientific_atlas_certificate_mismatch"
  | "scientific_atlas_pane_missing"
  | "scientific_atlas_channel_contract_missing"
  | "scientific_atlas_convention_mismatch"
  | "scientific_atlas_timestamp_mismatch"
  | "scientific_atlas_optical_causal_desync";

export const isValidScientificAtlasSidecar = (
  value: unknown,
): value is HullScientificAtlasSidecarV1 => {
  if (!isRecord(value)) return false;
  if (value.atlas_view !== "full-atlas") return false;
  if (typeof value.certificate_hash !== "string" || value.certificate_hash.length === 0) {
    return false;
  }
  if (!Array.isArray(value.pane_ids)) return false;
  if (!isRecord(value.pane_status) || !isRecord(value.pane_channel_sets) || !isRecord(value.pane_meta)) {
    return false;
  }
  return true;
};

export const validateScientificAtlasAgainstCertificate = (
  atlas: unknown,
  certificate: HullRenderCertificateV1,
): { ok: true } | { ok: false; reason: HullScientificAtlasValidationReason } => {
  if (!isValidScientificAtlasSidecar(atlas)) {
    return { ok: false, reason: "scientific_atlas_pane_missing" };
  }

  for (const paneId of HULL_SCIENTIFIC_ATLAS_REQUIRED_PANES) {
    if (!atlas.pane_ids.includes(paneId)) {
      return { ok: false, reason: "scientific_atlas_pane_missing" };
    }
    if (atlas.pane_status[paneId] !== "ok") {
      return { ok: false, reason: "scientific_atlas_pane_missing" };
    }
  }

  if (
    atlas.certificate_hash !== certificate.certificate_hash ||
    atlas.metric_ref_hash !== certificate.metric_ref_hash ||
    atlas.certificate_schema_version !== certificate.certificate_schema_version
  ) {
    return { ok: false, reason: "scientific_atlas_certificate_mismatch" };
  }
  if (
    atlas.chart !== certificate.chart ||
    atlas.observer !== certificate.observer ||
    atlas.theta_definition !== certificate.theta_definition ||
    atlas.kij_sign_convention !== certificate.kij_sign_convention ||
    atlas.unit_system !== certificate.unit_system
  ) {
    return { ok: false, reason: "scientific_atlas_convention_mismatch" };
  }
  const certTimestamp = Number(certificate.timestamp_ms);
  if (!Number.isFinite(atlas.timestamp_ms) || Number(atlas.timestamp_ms) !== certTimestamp) {
    return { ok: false, reason: "scientific_atlas_timestamp_mismatch" };
  }

  for (const paneId of HULL_SCIENTIFIC_ATLAS_REQUIRED_PANES) {
    const requiredChannels = HULL_SCIENTIFIC_ATLAS_PANE_CHANNEL_SETS[paneId] ?? [];
    const paneChannelSet = Array.isArray(atlas.pane_channel_sets[paneId])
      ? atlas.pane_channel_sets[paneId]
      : [];
    const paneMetaRaw = atlas.pane_meta[paneId];
    if (!isRecord(paneMetaRaw)) {
      return { ok: false, reason: "scientific_atlas_pane_missing" };
    }
    const missingRequiredChannel = requiredChannels.some(
      (channelId) => !paneChannelSet.includes(channelId),
    );
    if (missingRequiredChannel) {
      return { ok: false, reason: "scientific_atlas_channel_contract_missing" };
    }
    const paneHashes = isRecord(paneMetaRaw.channel_hashes)
      ? (paneMetaRaw.channel_hashes as Record<string, unknown>)
      : null;
    if (!paneHashes) {
      return { ok: false, reason: "scientific_atlas_channel_contract_missing" };
    }
    const missingOrMismatchedRequiredHash = requiredChannels.some((channelId) => {
      const observed = paneHashes[channelId];
      const expected = certificate.channel_hashes[channelId];
      if (typeof observed !== "string" || observed.trim().length === 0) return true;
      if (typeof expected !== "string" || expected.trim().length === 0) return true;
      return observed !== expected;
    });
    if (missingOrMismatchedRequiredHash) {
      return { ok: false, reason: "scientific_atlas_channel_contract_missing" };
    }
    if (
      paneMetaRaw.metric_ref_hash !== certificate.metric_ref_hash ||
      paneMetaRaw.chart !== certificate.chart ||
      paneMetaRaw.observer !== certificate.observer ||
      paneMetaRaw.theta_definition !== certificate.theta_definition ||
      paneMetaRaw.kij_sign_convention !== certificate.kij_sign_convention ||
      paneMetaRaw.unit_system !== certificate.unit_system
    ) {
      return { ok: false, reason: "scientific_atlas_convention_mismatch" };
    }
    if (
      !Number.isFinite(Number(paneMetaRaw.timestamp_ms)) ||
      Number(paneMetaRaw.timestamp_ms) !== certTimestamp
    ) {
      return { ok: false, reason: "scientific_atlas_timestamp_mismatch" };
    }
  }

  const causalMeta = atlas.pane_meta.causal as unknown;
  const opticalMeta = atlas.pane_meta.optical as unknown;
  if (!isRecord(causalMeta) || !isRecord(opticalMeta)) {
    return { ok: false, reason: "scientific_atlas_optical_causal_desync" };
  }
  if (
    causalMeta.metric_ref_hash !== opticalMeta.metric_ref_hash ||
    Number(causalMeta.timestamp_ms) !== Number(opticalMeta.timestamp_ms) ||
    String(opticalMeta.integrator ?? "").trim().length === 0
  ) {
    return { ok: false, reason: "scientific_atlas_optical_causal_desync" };
  }

  return { ok: true };
};
