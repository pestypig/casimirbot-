import fs from "node:fs/promises";
import path from "node:path";
import { Router, type Request } from "express";
import type {
  HullScientificExportFailureReason,
  HullScientificExportParityCheckId,
  HullScientificExportParityCheckResultV1,
  HullScientificExportParityReportV1,
  HullScientificExportRequestV1,
  HullScientificExportResponseV1,
  HullScientificExportSidecarV1,
} from "@shared/hull-export-contract";
import {
  HULL_SCIENTIFIC_EXPORT_FORMAT,
  HULL_SCIENTIFIC_EXPORT_FORMAT_VERSION,
  HULL_SCIENTIFIC_EXPORT_OPTIONAL_CHANNELS,
  HULL_SCIENTIFIC_EXPORT_REQUIRED_CHANNELS,
  HULL_SCIENTIFIC_EXPORT_SCHEMA_VERSION,
  HULL_SCIENTIFIC_EXPORT_STORAGE_ORDER,
  isHullScientificExportRequestV1,
} from "@shared/hull-export-contract";
import type {
  HullRenderCertificateV1,
} from "@shared/hull-render-contract";
import { HULL_RENDER_CERTIFICATE_SCHEMA_VERSION } from "@shared/hull-render-contract";
import {
  computeSnapshotChannelHashes,
  computeSnapshotConstraintRms,
  computeSnapshotSupportCoveragePct,
  loadHullScientificSnapshot,
  resolveMetricRefHash,
} from "../lib/hull-scientific-snapshot";
import {
  validateScientificAtlasAgainstCertificate,
  type HullScientificAtlasValidationReason,
} from "../lib/hull-scientific-atlas-validation";
import { sha256Hex } from "../utils/information-boundary";
import { runPythonScript } from "../utils/run-python";
import { stableJsonStringify } from "../utils/stable-json";

const router = Router();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const toFiniteNumber = (value: unknown, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const asTrimmedString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 ? text : null;
};

const uniqueStrings = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const entry of value) {
    const text = asTrimmedString(entry);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
  }
  return out;
};

const ensureDirectory = async (targetPath: string): Promise<void> => {
  await fs.mkdir(targetPath, { recursive: true });
};

const writeJsonFile = async (targetPath: string, value: unknown): Promise<void> => {
  await fs.writeFile(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const fileSha256OrNull = async (targetPath: string): Promise<string | null> => {
  try {
    const payload = await fs.readFile(targetPath);
    return sha256Hex(payload);
  } catch {
    return null;
  }
};

const defaultParityChecks = (): Record<
  HullScientificExportParityCheckId,
  HullScientificExportParityCheckResultV1
> => ({
  field_hash_parity: { status: "skipped", detail: "not_evaluated" },
  metadata_parity: { status: "skipped", detail: "not_evaluated" },
  slice_parity: { status: "skipped", detail: "phase3a_external_slice_parity_deferred" },
  constraint_parity: { status: "skipped", detail: "not_evaluated" },
  support_mask_parity: { status: "skipped", detail: "not_evaluated" },
  optical_diagnostics_parity: {
    status: "skipped",
    detail: "phase3a_optical_parity_deferred",
  },
  timestamp_certificate_linkage: { status: "skipped", detail: "not_evaluated" },
});

const buildParityReport = (certificateHash: string, metricRefHash: string | null) => ({
  version: 1 as const,
  metric_ref_hash: metricRefHash,
  certificate_hash: certificateHash,
  checks: defaultParityChecks(),
});

const parseParityTolerance = (
  payload: HullScientificExportRequestV1,
  key: "sliceLinf" | "constraintRms" | "opticalResidual",
  fallback: number,
) =>
  Math.max(
    0,
    toFiniteNumber(payload.parity?.tolerance?.[key], fallback),
  );

const isValidRenderCertificate = (value: unknown): value is HullRenderCertificateV1 => {
  if (!isRecord(value)) return false;
  if (value.certificate_schema_version !== HULL_RENDER_CERTIFICATE_SCHEMA_VERSION) return false;
  if (typeof value.certificate_hash !== "string" || value.certificate_hash.trim().length === 0) {
    return false;
  }
  if (!isRecord(value.channel_hashes)) return false;
  if (!isRecord(value.render)) return false;
  if (!isRecord(value.diagnostics)) return false;
  return true;
};

const validateRenderCertificateHash = (
  certificate: HullRenderCertificateV1,
): boolean => {
  const { certificate_hash, ...body } = certificate;
  const expected = sha256Hex(stableJsonStringify(body));
  return expected === certificate_hash;
};

const currentRequestBaseUrl = (req: Request): string => {
  const host = req.get("host") ?? "127.0.0.1";
  return `${req.protocol}://${host}`;
};

const failResponse = (
  reason: HullScientificExportFailureReason,
  message: string,
  parityReport: HullScientificExportParityReportV1,
): HullScientificExportResponseV1 => ({
  version: 1,
  ok: false,
  failureReason: reason,
  message,
  parityReport,
});

const mapAtlasValidationReasonToExportFailure = (
  reason: HullScientificAtlasValidationReason,
): HullScientificExportFailureReason => {
  switch (reason) {
    case "scientific_atlas_channel_contract_missing":
      return "scientific_export_channel_hash_mismatch";
    case "scientific_atlas_convention_mismatch":
    case "scientific_atlas_timestamp_mismatch":
    case "scientific_atlas_optical_causal_desync":
      return "scientific_export_metadata_mismatch";
    case "scientific_atlas_certificate_mismatch":
    case "scientific_atlas_pane_missing":
    default:
      return "scientific_export_certificate_mismatch";
  }
};

router.post("/dataset", async (req, res) => {
  const rawPayload = req.body as unknown;
  if (!isHullScientificExportRequestV1(rawPayload)) {
    return res.status(400).json({
      version: 1,
      ok: false,
      message: "invalid_hull_scientific_export_request_v1",
    } satisfies HullScientificExportResponseV1);
  }
  const payload: HullScientificExportRequestV1 = rawPayload;
  const strictScientific = payload.strictScientific !== false;
  const certificate = payload.renderCertificate;
  const expectedMetricRefHash = resolveMetricRefHash(payload.metricVolumeRef);
  const parityReport = buildParityReport(certificate.certificate_hash, expectedMetricRefHash);

  if (!isValidRenderCertificate(certificate)) {
    return res.status(422).json(
      failResponse(
        "scientific_export_certificate_missing",
        "missing_or_invalid_render_certificate",
        parityReport,
      ),
    );
  }
  if (!validateRenderCertificateHash(certificate)) {
    return res.status(422).json(
      failResponse(
        "scientific_export_certificate_mismatch",
        "render_certificate_hash_mismatch",
        parityReport,
      ),
    );
  }
  if (certificate.metric_ref_hash !== expectedMetricRefHash) {
    return res.status(422).json(
      failResponse(
        "scientific_export_certificate_mismatch",
        "render_certificate_metric_ref_hash_mismatch",
        parityReport,
      ),
    );
  }
  const atlas = payload.scientificAtlas ?? null;
  if (strictScientific && !atlas) {
    return res.status(422).json(
      failResponse(
        "scientific_export_certificate_mismatch",
        "scientific_atlas_required_for_strict_export",
        parityReport,
      ),
    );
  }
  if (atlas) {
    const atlasValidation = validateScientificAtlasAgainstCertificate(atlas, certificate);
    if (!atlasValidation.ok) {
      const failureReason = mapAtlasValidationReasonToExportFailure(
        atlasValidation.reason,
      );
      return res.status(422).json(
        failResponse(
          failureReason,
          `scientific_atlas_validation_failed:${atlasValidation.reason}`,
          parityReport,
        ),
      );
    }
  }

  let snapshot;
  try {
    snapshot = await loadHullScientificSnapshot(payload.metricVolumeRef, {
      baseUrl: currentRequestBaseUrl(req),
      timeoutMs: Math.max(
        5_000,
        Math.min(300_000, toFiniteNumber(process.env.HULL_EXPORT_FETCH_TIMEOUT_MS, 45_000)),
      ),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(502).json({
      version: 1,
      ok: false,
      message: `metric_snapshot_load_failed:${message}`,
      parityReport,
    } satisfies HullScientificExportResponseV1);
  }

  const requiredChannels = Array.from(
    new Set([
      ...HULL_SCIENTIFIC_EXPORT_REQUIRED_CHANNELS,
      ...uniqueStrings(payload.requiredChannels),
    ]),
  );
  const optionalChannels = Array.from(
    new Set([
      ...HULL_SCIENTIFIC_EXPORT_OPTIONAL_CHANNELS,
      ...uniqueStrings(payload.optionalChannels),
    ]),
  ).filter((channelId) => !requiredChannels.includes(channelId));

  const snapshotHashes = computeSnapshotChannelHashes(snapshot);
  const missingRequiredChannels = requiredChannels.filter(
    (channelId) =>
      !snapshot.channels[channelId] ||
      typeof snapshotHashes[channelId] !== "string" ||
      snapshotHashes[channelId].length === 0,
  );
  if (missingRequiredChannels.length > 0) {
    parityReport.checks.field_hash_parity = {
      status: "fail",
      detail: `missing_required_channels:${missingRequiredChannels.join(",")}`,
      failureReason: "scientific_export_channel_hash_mismatch",
    };
    return res.status(422).json(
      failResponse(
        "scientific_export_channel_hash_mismatch",
        `missing_required_channels:${missingRequiredChannels.join(",")}`,
        parityReport,
      ),
    );
  }

  const channelHashMismatches = requiredChannels.filter((channelId) => {
    const expected = asTrimmedString(certificate.channel_hashes[channelId]);
    const observed = asTrimmedString(snapshotHashes[channelId]);
    return !expected || !observed || expected !== observed;
  });
  if (channelHashMismatches.length > 0) {
    parityReport.checks.field_hash_parity = {
      status: "fail",
      detail: `channel_hash_mismatch:${channelHashMismatches.join(",")}`,
      failureReason: "scientific_export_channel_hash_mismatch",
    };
    return res.status(422).json(
      failResponse(
        "scientific_export_channel_hash_mismatch",
        `channel_hash_mismatch:${channelHashMismatches.join(",")}`,
        parityReport,
      ),
    );
  }
  parityReport.checks.field_hash_parity = {
    status: "pass",
    detail: `channels_verified=${requiredChannels.length}`,
  };

  const metadataMismatchReasons: string[] = [];
  if (certificate.metric_ref_hash !== snapshot.metricRefHash) {
    metadataMismatchReasons.push("metric_ref_hash");
  }
  const snapshotChart = snapshot.chart ?? payload.metricVolumeRef.chart ?? null;
  if (snapshotChart && certificate.chart && snapshotChart !== certificate.chart) {
    metadataMismatchReasons.push("chart");
  }
  const refUpdatedAt =
    payload.metricVolumeRef.updatedAt == null
      ? null
      : toFiniteNumber(payload.metricVolumeRef.updatedAt, Number.NaN);
  const maxTimestampDriftMs = Math.max(
    0,
    Math.min(
      24 * 60 * 60 * 1000,
      toFiniteNumber(process.env.HULL_EXPORT_MAX_TIMESTAMP_DRIFT_MS, 300_000),
    ),
  );
  const timestampDeltaMs =
    refUpdatedAt == null || !Number.isFinite(refUpdatedAt)
      ? null
      : Math.abs(toFiniteNumber(certificate.timestamp_ms, 0) - refUpdatedAt);
  if (timestampDeltaMs != null && timestampDeltaMs > maxTimestampDriftMs) {
    metadataMismatchReasons.push("timestamp_linkage");
  }
  if (metadataMismatchReasons.length > 0) {
    parityReport.checks.metadata_parity = {
      status: "fail",
      detail: `metadata_mismatch:${metadataMismatchReasons.join(",")}`,
      failureReason: "scientific_export_metadata_mismatch",
    };
    parityReport.checks.timestamp_certificate_linkage = {
      status: metadataMismatchReasons.includes("timestamp_linkage") ? "fail" : "pass",
      observed: timestampDeltaMs,
      expected: maxTimestampDriftMs,
      detail:
        timestampDeltaMs == null
          ? "metric_ref_updatedAt_missing"
          : "timestamp_delta_ms",
      failureReason: metadataMismatchReasons.includes("timestamp_linkage")
        ? "scientific_export_metadata_mismatch"
        : null,
    };
    return res.status(422).json(
      failResponse(
        "scientific_export_metadata_mismatch",
        `metadata_mismatch:${metadataMismatchReasons.join(",")}`,
        parityReport,
      ),
    );
  }
  parityReport.checks.metadata_parity = { status: "pass", detail: "certificate_identity_locked" };
  parityReport.checks.timestamp_certificate_linkage = {
    status: "pass",
    observed: timestampDeltaMs,
    expected: maxTimestampDriftMs,
    detail:
      timestampDeltaMs == null ? "metric_ref_updatedAt_missing" : "timestamp_delta_ms",
  };

  const constraintTolerance = parseParityTolerance(payload, "constraintRms", 1e-6);
  const observedConstraintRms = computeSnapshotConstraintRms(snapshot);
  const expectedConstraintRms =
    certificate.diagnostics.constraint_rms == null
      ? null
      : toFiniteNumber(certificate.diagnostics.constraint_rms, Number.NaN);
  if (
    observedConstraintRms != null &&
    expectedConstraintRms != null &&
    Number.isFinite(expectedConstraintRms)
  ) {
    const delta = Math.abs(observedConstraintRms - expectedConstraintRms);
    if (delta > constraintTolerance) {
      parityReport.checks.constraint_parity = {
        status: "fail",
        tolerance: constraintTolerance,
        observed: observedConstraintRms,
        expected: expectedConstraintRms,
        detail: "constraint_rms_delta_exceeds_tolerance",
        failureReason: "scientific_export_constraint_parity_fail",
      };
      if (strictScientific) {
        return res.status(422).json(
          failResponse(
            "scientific_export_constraint_parity_fail",
            "constraint_rms_parity_fail",
            parityReport,
          ),
        );
      }
    } else {
      parityReport.checks.constraint_parity = {
        status: "pass",
        tolerance: constraintTolerance,
        observed: observedConstraintRms,
        expected: expectedConstraintRms,
      };
    }
  } else {
    parityReport.checks.constraint_parity = {
      status: "skipped",
      detail: "constraint_rms_missing",
    };
  }

  const supportCoverageTolerancePct = Math.max(
    0,
    toFiniteNumber(process.env.HULL_EXPORT_SUPPORT_COVERAGE_TOLERANCE_PCT, 0.5),
  );
  const observedSupportCoverage = computeSnapshotSupportCoveragePct(snapshot);
  const expectedSupportCoverage =
    certificate.diagnostics.support_coverage_pct == null
      ? null
      : toFiniteNumber(certificate.diagnostics.support_coverage_pct, Number.NaN);
  if (
    observedSupportCoverage != null &&
    expectedSupportCoverage != null &&
    Number.isFinite(expectedSupportCoverage)
  ) {
    const delta = Math.abs(observedSupportCoverage - expectedSupportCoverage);
    if (delta > supportCoverageTolerancePct) {
      parityReport.checks.support_mask_parity = {
        status: "fail",
        tolerance: supportCoverageTolerancePct,
        observed: observedSupportCoverage,
        expected: expectedSupportCoverage,
        detail: "support_coverage_delta_exceeds_tolerance",
        failureReason: "scientific_export_metadata_mismatch",
      };
      if (strictScientific) {
        return res.status(422).json(
          failResponse(
            "scientific_export_metadata_mismatch",
            "support_mask_parity_fail",
            parityReport,
          ),
        );
      }
    } else {
      parityReport.checks.support_mask_parity = {
        status: "pass",
        tolerance: supportCoverageTolerancePct,
        observed: observedSupportCoverage,
        expected: expectedSupportCoverage,
      };
    }
  } else {
    parityReport.checks.support_mask_parity = {
      status: "skipped",
      detail: "support_coverage_missing",
    };
  }

  const exportRoot = path.resolve(
    process.cwd(),
    "artifacts",
    "research",
    "hull-export",
    certificate.certificate_hash,
  );
  const rawDir = path.join(exportRoot, "raw");
  await ensureDirectory(rawDir);

  const exportChannels = [
    ...requiredChannels,
    ...optionalChannels.filter((channelId) => !!snapshot.channels[channelId]),
  ];
  const shapeZyx: [number, number, number] = [
    snapshot.dims[2],
    snapshot.dims[1],
    snapshot.dims[0],
  ];
  const fieldManifest: Array<{
    name: string;
    raw_path: string;
    shape_zyx: [number, number, number];
    dtype: "float32";
  }> = [];

  for (const channelId of exportChannels) {
    const channel = snapshot.channels[channelId];
    if (!channel?.data) continue;
    const rawPath = path.join(rawDir, `${channelId}.f32`);
    const bytes = Buffer.from(
      channel.data.buffer,
      channel.data.byteOffset,
      channel.data.byteLength,
    );
    await fs.writeFile(rawPath, bytes);
    fieldManifest.push({
      name: channelId,
      raw_path: rawPath,
      shape_zyx: shapeZyx,
      dtype: "float32",
    });
  }

  const datasetPath = path.join(exportRoot, "dataset.h5");
  const xdmfPath = path.join(exportRoot, "dataset.xdmf");
  const sidecarPath = path.join(exportRoot, "export-sidecar.json");
  const parityPath = path.join(exportRoot, "parity-report.json");
  const manifestPath = path.join(exportRoot, "writer-manifest.json");
  const origin = snapshot.origin_m ?? [0, 0, 0];
  const sidecar: HullScientificExportSidecarV1 = {
    export_schema_version: HULL_SCIENTIFIC_EXPORT_SCHEMA_VERSION,
    export_format: HULL_SCIENTIFIC_EXPORT_FORMAT,
    export_format_version: HULL_SCIENTIFIC_EXPORT_FORMAT_VERSION,
    metadata: {
      metric_ref_hash: certificate.metric_ref_hash,
      certificate_hash: certificate.certificate_hash,
      certificate_schema_version: certificate.certificate_schema_version,
      chart: certificate.chart,
      observer: certificate.observer,
      theta_definition: certificate.theta_definition,
      kij_sign_convention: certificate.kij_sign_convention,
      unit_system: certificate.unit_system,
      timestamp_ms: certificate.timestamp_ms,
      coordinate: {
        dims: [snapshot.dims[0], snapshot.dims[1], snapshot.dims[2]],
        spacing_m: [snapshot.voxelSize_m[0], snapshot.voxelSize_m[1], snapshot.voxelSize_m[2]],
        axes: ["x", "y", "z"],
        storage_order: HULL_SCIENTIFIC_EXPORT_STORAGE_ORDER,
        origin_m: [origin[0], origin[1], origin[2]],
      },
    },
    field_hashes: snapshotHashes,
    required_channels: requiredChannels,
    optional_channels: optionalChannels.filter((channelId) => !!snapshot.channels[channelId]),
  };

  const writerManifest = {
    version: 1,
    storage_order: HULL_SCIENTIFIC_EXPORT_STORAGE_ORDER,
    output: {
      dataset_h5: datasetPath,
      dataset_xdmf: xdmfPath,
    },
    coordinate: {
      dims_xyz: sidecar.metadata.coordinate.dims,
      origin_xyz: sidecar.metadata.coordinate.origin_m,
      spacing_xyz: sidecar.metadata.coordinate.spacing_m,
    },
    fields: fieldManifest,
    metadata: {
      metric_ref_hash: sidecar.metadata.metric_ref_hash,
      certificate_hash: sidecar.metadata.certificate_hash,
      chart: sidecar.metadata.chart,
      observer: sidecar.metadata.observer,
      theta_definition: sidecar.metadata.theta_definition,
      kij_sign_convention: sidecar.metadata.kij_sign_convention,
      unit_system: sidecar.metadata.unit_system,
      timestamp_ms: sidecar.metadata.timestamp_ms,
    },
  };
  await writeJsonFile(manifestPath, writerManifest);

  try {
    const writerResult = await runPythonScript("scripts/hull-export-writer.py", {
      args: ["--manifest", manifestPath],
      timeoutMs: Math.max(
        5_000,
        Math.min(300_000, toFiniteNumber(process.env.HULL_EXPORT_WRITER_TIMEOUT_MS, 120_000)),
      ),
      pythonBin: process.env.HULL_EXPORT_PYTHON_BIN,
    });
    if (!isRecord(writerResult) || writerResult.ok !== true) {
      const detail =
        isRecord(writerResult) && typeof writerResult.message === "string"
          ? writerResult.message
          : "writer_reported_failure";
      return res.status(500).json({
        version: 1,
        ok: false,
        message: `scientific_export_writer_failed:${detail}`,
        parityReport,
      } satisfies HullScientificExportResponseV1);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      version: 1,
      ok: false,
      message: `scientific_export_writer_failed:${message}`,
      parityReport,
    } satisfies HullScientificExportResponseV1);
  }

  await writeJsonFile(sidecarPath, sidecar);
  await writeJsonFile(parityPath, parityReport);

  const artifacts = [
    { kind: "hdf5" as const, path: datasetPath, sha256: await fileSha256OrNull(datasetPath) },
    { kind: "xdmf" as const, path: xdmfPath, sha256: await fileSha256OrNull(xdmfPath) },
    {
      kind: "sidecar-json" as const,
      path: sidecarPath,
      sha256: await fileSha256OrNull(sidecarPath),
    },
    {
      kind: "parity-report-json" as const,
      path: parityPath,
      sha256: await fileSha256OrNull(parityPath),
    },
  ];

  return res.json({
    version: 1,
    ok: true,
    artifacts,
    exportSidecar: sidecar,
    parityReport,
  } satisfies HullScientificExportResponseV1);
});

router.post("/parity", async (_req, res) => {
  return res.status(501).json({
    version: 1,
    ok: false,
    message: "phase3b_external_parity_endpoint_not_implemented",
  } satisfies HullScientificExportResponseV1);
});

export const hullExportRouter = router;
export default router;
