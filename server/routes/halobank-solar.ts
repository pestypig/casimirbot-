import { Router } from "express";
import { z } from "zod";
import {
  buildSolarMetricContext,
  loadSolarKernelBundle,
  loadSolarLocalRestReferenceManifest,
  loadSolarMetricContextManifest,
  loadSolarThresholds,
  verifyKernelBundleSignature,
  isCanonicalEvidenceRef,
  validateKernelBundleAssets,
} from "../modules/halobank-solar/config";
import { buildSolarVectorBundle, DEFAULT_VECTOR_TARGETS, getBaryState, resolveSupportedBody } from "../modules/halobank-solar/ephemeris-core";
import { runDerivedModule, runLocalRestAnchorCalibration, type DerivedModuleId } from "../modules/halobank-solar/derived";
import { computeSolarTimeScales } from "../modules/halobank-solar/time-core";
import { buildLocalRestSnapshot, velocityGalacticFromICRS } from "../modules/stellar/local-rest";
import type { SolarGate, SolarGateDelta, SolarMetricContext, SolarObserver } from "../modules/halobank-solar/types";
import { hashStableJson } from "../utils/information-boundary";

export const halobankSolarRouter = Router();

const VECTOR_GATE_ID = "halobank.solar.vectors.consistency.v1";
const DERIVED_GATE_ID = "halobank.solar.derived.consistency.v1";
const AU_PER_DAY_TO_KM_PER_S = 149_597_870_700 / 1000 / 86_400;
const GALACTIC_AXES = "U_toward_gc,V_rotation,W_toward_ngp" as const;

type Vec3 = [number, number, number];

type LocalRestCalibrationSummary = {
  status: "pass" | "fail" | "unavailable";
  semantics: "solar_peculiar_reference_residual";
  selected_reference_id: string | null;
  reference_id: string | null;
  reference_label?: string | null;
  source_class?: string | null;
  citation?: string | null;
  doi?: string | null;
  url?: string | null;
  published?: string | null;
  solar_peculiar_runtime_kms?: Vec3 | null;
  solar_peculiar_reference_kms?: Vec3 | null;
  component_abs_delta_km_s?: Vec3 | null;
  max_component_abs_delta_km_s?: number | null;
  tolerance_km_s?: number | null;
  random_uncertainty_kms?: Vec3 | null;
  systematic_uncertainty_kms?: Vec3 | null;
  artifact_ref?: string;
  fail_id?:
    | "HALOBANK_SOLAR_LOCAL_REST_REFERENCE_UNAVAILABLE"
    | "HALOBANK_SOLAR_LOCAL_REST_REFERENCE_MISMATCH";
  reasons?: string[];
  error?: string;
};

type LocalRestLinkedSummary = {
  status: "linked";
  semantics: "outer_reference_only";
  radius_pc: number;
  with_oort: boolean;
  velocity_avg_kms: Vec3;
  velocity_disp_kms: Vec3;
  solar_peculiar_kms: Vec3;
  provenance_class: string;
  claim_tier: string;
  certifying: boolean;
  gate: unknown;
  source: string;
  ssb_offset_km_s?: Vec3;
  projection_contract?: string;
  calibration?: LocalRestCalibrationSummary;
  calibration_artifact_ref?: string;
  projection_of_resolved_reference?: {
    body: number;
    semantics: "resolved_reference_minus_declared_local_rest";
    uvw_km_s: Vec3;
    axes: typeof GALACTIC_AXES;
  };
};

type LocalRestUnavailableSummary = {
  status: "unavailable";
  semantics: "outer_reference_only";
  error: string;
  fail_id: "HALOBANK_SOLAR_LOCAL_REST_UNAVAILABLE";
};

type LocalRestSummary = LocalRestLinkedSummary | LocalRestUnavailableSummary | null;

const DerivedBody = z
  .object({
    module: z.enum([
      "mercury_precession",
      "earth_moon_eclipse_timing",
      "resonance_libration",
      "saros_cycle",
      "jovian_moon_event_timing",
      "solar_light_deflection",
      "inner_solar_metric_parity",
      "local_rest_anchor_calibration",
    ]),
    input: z.record(z.string(), z.unknown()).optional(),
    strict_provenance: z.boolean().optional(),
    evidence_refs: z.array(z.string()).optional(),
    evidence_ref: z.string().optional(),
  })
  .strict();

const parseBool = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
};

const parseNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseCsvNumbers = (raw: unknown): number[] => {
  if (typeof raw !== "string" || raw.trim().length === 0) return [];
  return raw
    .split(",")
    .map((entry) => Number(entry.trim()))
    .filter((entry) => Number.isFinite(entry))
    .map((entry) => Math.floor(entry));
};

const parseEvidenceRefs = (args: { evidenceRef?: unknown; evidenceRefs?: unknown }): string[] => {
  const refs: string[] = [];
  if (typeof args.evidenceRef === "string" && args.evidenceRef.trim()) refs.push(args.evidenceRef.trim());
  if (typeof args.evidenceRefs === "string" && args.evidenceRefs.trim()) {
    refs.push(
      ...args.evidenceRefs
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
    );
  }
  return Array.from(new Set(refs));
};

function parseObserver(raw: unknown): SolarObserver | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (parsed.mode === "geocenter") {
    return { mode: "geocenter" };
  }
  if (parsed.mode === "body-fixed") {
    return {
      mode: "body-fixed",
      body: parseNumber(parsed.body, NaN),
      lon_deg: parseNumber(parsed.lon_deg, NaN),
      lat_deg: parseNumber(parsed.lat_deg, NaN),
      height_m: parseNumber(parsed.height_m, 0),
    };
  }
  throw new Error("Invalid observer payload");
}

function firstFailFromDeltas(deltas: Array<SolarGateDelta & { failId?: string }>): string | null {
  const failed = deltas.find((entry) => !entry.pass);
  return failed?.failId ?? null;
}

function withFailId(delta: SolarGateDelta, failId: string): SolarGateDelta & { failId: string } {
  return { ...delta, failId };
}

function isWithinWindow(iso: string, startIso: string, endIso: string): boolean {
  const t = Date.parse(iso);
  return Number.isFinite(t) && t >= Date.parse(startIso) && t <= Date.parse(endIso);
}

const toVec3 = (x: number, y: number, z: number): Vec3 => [x, y, z];
const vecAdd = (a: Vec3, b: Vec3): Vec3 => toVec3(a[0] + b[0], a[1] + b[1], a[2] + b[2]);
const vecSub = (a: Vec3, b: Vec3): Vec3 => toVec3(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const vecNeg = (a: Vec3): Vec3 => toVec3(-a[0], -a[1], -a[2]);

function isLinkedLocalRest(summary: LocalRestSummary): summary is LocalRestLinkedSummary {
  return summary !== null && summary.status === "linked";
}

function baryVelocityToGalacticKmS(vel: Vec3): Vec3 {
  return velocityGalacticFromICRS([
    vel[0] * AU_PER_DAY_TO_KM_PER_S,
    vel[1] * AU_PER_DAY_TO_KM_PER_S,
    vel[2] * AU_PER_DAY_TO_KM_PER_S,
  ]);
}

function normalizeDerivedGate(args: {
  baseGate: SolarGate;
  signatureOk: boolean;
  kernelAssetsPresentOk: boolean;
  kernelAssetsDigestOk: boolean;
  strictProvenance: boolean;
  evidenceRefs: string[];
  epochInWindow: boolean;
}): SolarGate {
  const deltas: Array<SolarGateDelta & { failId?: string }> = [
    withFailId(
      {
        id: "kernel_signature_ok",
        comparator: ">=",
        value: args.signatureOk ? 1 : 0,
        limit: 1,
        pass: args.signatureOk,
      },
      "HALOBANK_SOLAR_KERNEL_MANIFEST_INTEGRITY_FAIL",
    ),
    withFailId(
      {
        id: "kernel_assets_present",
        comparator: ">=",
        value: args.kernelAssetsPresentOk ? 1 : 0,
        limit: 1,
        pass: args.kernelAssetsPresentOk,
      },
      "HALOBANK_SOLAR_KERNEL_ASSET_MISSING",
    ),
    withFailId(
      {
        id: "kernel_assets_digest_ok",
        comparator: ">=",
        value: args.kernelAssetsDigestOk ? 1 : 0,
        limit: 1,
        pass: args.kernelAssetsDigestOk,
      },
      "HALOBANK_SOLAR_KERNEL_ASSET_DIGEST_MISMATCH",
    ),
    withFailId(
      {
        id: "epoch_window_in_range",
        comparator: ">=",
        value: args.epochInWindow ? 1 : 0,
        limit: 1,
        pass: args.epochInWindow,
      },
      "HALOBANK_SOLAR_EPOCH_OUT_OF_RANGE",
    ),
  ];

  if (args.strictProvenance) {
    const canonical = args.evidenceRefs.filter((entry) => isCanonicalEvidenceRef(entry));
    deltas.push(
      withFailId(
        {
          id: "strict_provenance_evidence_refs",
          comparator: ">=",
          value: canonical.length,
          limit: 1,
          pass: canonical.length >= 1,
        },
        canonical.length >= 1 ? "HALOBANK_SOLAR_EVIDENCE_REF_INVALID" : "HALOBANK_SOLAR_STRICT_PROVENANCE_MISSING",
      ),
    );
  }

  deltas.push(
    ...args.baseGate.deltas.map((entry) =>
      withFailId(
        entry,
        args.baseGate.firstFail ?? "HALOBANK_SOLAR_DERIVED_MODULE_FAIL",
      ),
    ),
  );

  const firstFail = firstFailFromDeltas(deltas) ?? args.baseGate.firstFail;
  return {
    gate: DERIVED_GATE_ID,
    verdict: firstFail ? "FAIL" : "PASS",
    firstFail,
    deterministic: true,
    deltas: deltas.map(({ failId: _failId, ...rest }) => rest),
    reasons:
      firstFail === null
        ? [...args.baseGate.reasons, "Derived module passed strict deterministic consistency contract."]
        : [...args.baseGate.reasons, "Derived module failed deterministic consistency contract."],
  };
}

halobankSolarRouter.get("/horizons/vectors", async (req, res) => {
  try {
    const tsIso = typeof req.query.ts === "string" && req.query.ts.trim().length > 0 ? req.query.ts.trim() : new Date().toISOString();
    const frame = (typeof req.query.frame === "string" ? req.query.frame.toUpperCase() : "BCRS") as "BCRS" | "GCRS";
    const aberration = (typeof req.query.aberration === "string" ? req.query.aberration : "lt+s") as "none" | "lt" | "lt+s";
    const centerId = Math.floor(parseNumber(req.query.center, 0));
    const strictProvenance = parseBool(req.query.strict_provenance);
    const includeLocalRest = parseBool(req.query.include_local_rest);
    const localRestRadiusPc = Math.max(1, parseNumber(req.query.local_rest_radius_pc, 50));
    const localRestWithOort = parseBool(req.query.local_rest_with_oort);
    const observer = parseObserver(req.query.observer);
    const requestedTargets = parseCsvNumbers(req.query.targets);
    const targetIds = Array.from(new Set((requestedTargets.length ? requestedTargets : [...DEFAULT_VECTOR_TARGETS]).filter((id) => resolveSupportedBody(id))));
    const evidenceRefs = parseEvidenceRefs({ evidenceRef: req.query.evidence_ref, evidenceRefs: req.query.evidence_refs });

    const bundleManifest = await loadSolarKernelBundle();
    const metricContextManifest = await loadSolarMetricContextManifest();
    const signature = verifyKernelBundleSignature(bundleManifest);
    const assets = await validateKernelBundleAssets(bundleManifest);
    const thresholds = includeLocalRest ? await loadSolarThresholds() : null;
    const timeScales = computeSolarTimeScales(tsIso);
    const metricContext: SolarMetricContext = buildSolarMetricContext(metricContextManifest, frame);
    const bundle = buildSolarVectorBundle({
      tsIso,
      targetIds,
      centerId,
      frame,
      aberration,
      observer,
    });

    const canonicalEvidenceRefs = evidenceRefs.filter((entry) => isCanonicalEvidenceRef(entry));
    const inEpochWindow = isWithinWindow(timeScales.utc, bundleManifest.epoch_range.start_iso, bundleManifest.epoch_range.end_iso);
    let localRestSummary: LocalRestSummary = null;
    let localRestCalibration: ReturnType<typeof runLocalRestAnchorCalibration> | null = null;
    let localRestCalibrationError: string | null = null;

    if (includeLocalRest) {
      try {
        const snap = await buildLocalRestSnapshot(
          {
            epoch: timeScales.utc,
            radius_pc: localRestRadiusPc,
            per_page: 100,
            with_oort: localRestWithOort,
          },
          {
            provenance: {
              provenance_class: "inferred",
              claim_tier: "diagnostic",
              certifying: false,
            },
            hasExplicitProvenance: true,
          },
        );
        localRestSummary = {
          status: "linked",
          semantics: "outer_reference_only",
          radius_pc: snap.meta.radiusPc,
          with_oort: Boolean(snap.meta.oort),
          velocity_avg_kms: snap.meta.velocityAvg_kms,
          velocity_disp_kms: snap.meta.velocityDisp_kms,
          solar_peculiar_kms: snap.meta.solarPeculiar_kms,
          provenance_class: snap.provenance_class,
          claim_tier: snap.claim_tier,
          certifying: snap.certifying,
          gate: snap.gate ?? null,
          source: snap.meta.source,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        localRestSummary = {
          status: "unavailable",
          semantics: "outer_reference_only",
          error: message,
          fail_id: "HALOBANK_SOLAR_LOCAL_REST_UNAVAILABLE",
        };
      }

      if (isLinkedLocalRest(localRestSummary) && thresholds) {
        try {
          const localRestReferenceManifest = await loadSolarLocalRestReferenceManifest();
          localRestCalibration = runLocalRestAnchorCalibration({
            input: {},
            thresholds: thresholds.modules.local_rest_anchor_calibration,
            referenceManifest: localRestReferenceManifest,
          });
        } catch (error) {
          localRestCalibrationError = error instanceof Error ? error.message : String(error);
        }
      }
    }

    const responseStates = bundle.states.map((state) => ({
      ...state,
      kinematics: { ...state.kinematics },
    }));
    const responseReferenceOriginState = {
      ...bundle.referenceOriginState,
    };

    if (includeLocalRest) {
      if (isLinkedLocalRest(localRestSummary)) {
        const sunBaryState = getBaryState(10, new Date(timeScales.utc));
        const sunBaryGalacticKmS = baryVelocityToGalacticKmS(sunBaryState.vel);
        const ssbOffsetKmS = vecSub(vecNeg(localRestSummary.solar_peculiar_kms), sunBaryGalacticKmS);
        const resolvedReferenceLocalRest = vecAdd(responseReferenceOriginState.galactic_uvw_km_s, ssbOffsetKmS);
        const calibrationSummary: LocalRestCalibrationSummary = localRestCalibration
          ? {
              status: localRestCalibration.gate.verdict === "PASS" ? "pass" : "fail",
              semantics: "solar_peculiar_reference_residual",
              selected_reference_id: (localRestCalibration.result.selected_reference_id as string | null) ?? null,
              reference_id: (localRestCalibration.result.reference_id as string | null) ?? null,
              reference_label: (localRestCalibration.result.reference_label as string | null) ?? null,
              source_class: (localRestCalibration.result.source_class as string | null) ?? null,
              citation: (localRestCalibration.result.citation as string | null) ?? null,
              doi: (localRestCalibration.result.doi as string | null) ?? null,
              url: (localRestCalibration.result.url as string | null) ?? null,
              published: (localRestCalibration.result.published as string | null) ?? null,
              solar_peculiar_runtime_kms: (localRestCalibration.result.solar_peculiar_runtime_kms as Vec3 | null) ?? null,
              solar_peculiar_reference_kms: (localRestCalibration.result.solar_peculiar_reference_kms as Vec3 | null) ?? null,
              component_abs_delta_km_s: (localRestCalibration.result.component_abs_delta_km_s as Vec3 | null) ?? null,
              max_component_abs_delta_km_s:
                (localRestCalibration.result.max_component_abs_delta_km_s as number | null) ?? null,
              tolerance_km_s: (localRestCalibration.result.tolerance_km_s as number | null) ?? null,
              random_uncertainty_kms: (localRestCalibration.result.random_uncertainty_kms as Vec3 | null) ?? null,
              systematic_uncertainty_kms:
                (localRestCalibration.result.systematic_uncertainty_kms as Vec3 | null) ?? null,
              artifact_ref: localRestCalibration.artifact_ref,
              fail_id:
                localRestCalibration.gate.firstFail === "HALOBANK_SOLAR_LOCAL_REST_REFERENCE_MISMATCH"
                  || localRestCalibration.gate.firstFail === "HALOBANK_SOLAR_LOCAL_REST_REFERENCE_UNAVAILABLE"
                  ? localRestCalibration.gate.firstFail
                  : undefined,
              reasons: localRestCalibration.gate.reasons,
            }
          : {
              status: "unavailable",
              semantics: "solar_peculiar_reference_residual",
              selected_reference_id: null,
              reference_id: null,
              fail_id: "HALOBANK_SOLAR_LOCAL_REST_REFERENCE_UNAVAILABLE",
              error: localRestCalibrationError ?? "Pinned local-rest reference manifest could not be loaded.",
            };

        responseReferenceOriginState.local_rest = {
          status: "projected",
          semantics: "resolved_reference_minus_declared_local_rest",
          uvw_km_s: resolvedReferenceLocalRest,
          axes: GALACTIC_AXES,
          solar_peculiar_kms: localRestSummary.solar_peculiar_kms,
          ssb_offset_km_s: ssbOffsetKmS,
          provenance_class: localRestSummary.provenance_class,
          claim_tier: localRestSummary.claim_tier,
          certifying: localRestSummary.certifying,
          source: localRestSummary.source,
        };

        for (const state of responseStates) {
          state.kinematics.local_rest = {
            status: "projected",
            semantics: "translation_invariant_relative_velocity",
            uvw_km_s: state.kinematics.galactic_uvw_km_s,
            axes: GALACTIC_AXES,
            solar_peculiar_kms: localRestSummary.solar_peculiar_kms,
            provenance_class: localRestSummary.provenance_class,
            claim_tier: localRestSummary.claim_tier,
            certifying: localRestSummary.certifying,
            source: localRestSummary.source,
          };
        }

        localRestSummary = {
          ...localRestSummary,
          ssb_offset_km_s: ssbOffsetKmS,
          projection_contract:
            "v_local_rest = v_barycentric_galactic + ssb_offset_km_s; target-center relative deltas are translation invariant.",
          calibration: calibrationSummary,
          calibration_artifact_ref: localRestCalibration?.artifact_ref,
          projection_of_resolved_reference: {
            body: responseReferenceOriginState.body,
            semantics: "resolved_reference_minus_declared_local_rest",
            uvw_km_s: resolvedReferenceLocalRest,
            axes: GALACTIC_AXES,
          },
        };
      } else {
        responseReferenceOriginState.local_rest = {
          status: "unavailable",
          semantics: "resolved_reference_minus_declared_local_rest",
          fail_id: "HALOBANK_SOLAR_LOCAL_REST_UNAVAILABLE",
          error: localRestSummary?.error ?? "Local rest reference could not be loaded.",
        };

        for (const state of responseStates) {
          state.kinematics.local_rest = {
            status: "unavailable",
            semantics: "translation_invariant_relative_velocity",
            fail_id: "HALOBANK_SOLAR_LOCAL_REST_UNAVAILABLE",
            error: localRestSummary?.error ?? "Local rest reference could not be loaded.",
          };
        }
      }
    }

    const deltas: Array<SolarGateDelta & { failId?: string }> = [
      withFailId(
        {
          id: "kernel_signature_ok",
          comparator: ">=",
          value: signature.ok ? 1 : 0,
          limit: 1,
          pass: signature.ok,
        },
        "HALOBANK_SOLAR_KERNEL_MANIFEST_INTEGRITY_FAIL",
      ),
      withFailId(
        {
          id: "kernel_assets_present",
          comparator: ">=",
          value: assets.missing.length === 0 ? 1 : 0,
          limit: 1,
          pass: assets.missing.length === 0,
        },
        "HALOBANK_SOLAR_KERNEL_ASSET_MISSING",
      ),
      withFailId(
        {
          id: "kernel_assets_digest_ok",
          comparator: ">=",
          value: assets.digestMismatch.length === 0 ? 1 : 0,
          limit: 1,
          pass: assets.digestMismatch.length === 0,
        },
        "HALOBANK_SOLAR_KERNEL_ASSET_DIGEST_MISMATCH",
      ),
      withFailId(
        {
          id: "epoch_window_in_range",
          comparator: ">=",
          value: inEpochWindow ? 1 : 0,
          limit: 1,
          pass: inEpochWindow,
        },
        "HALOBANK_SOLAR_EPOCH_OUT_OF_RANGE",
      ),
      withFailId(
        {
          id: "observer_kernel_ready",
          comparator: ">=",
          value: bundle.warnings.includes("HALOBANK_SOLAR_ORIENTATION_KERNEL_MISSING") ? 0 : 1,
          limit: 1,
          pass: !bundle.warnings.includes("HALOBANK_SOLAR_ORIENTATION_KERNEL_MISSING"),
        },
        "HALOBANK_SOLAR_ORIENTATION_KERNEL_MISSING",
      ),
    ];

    if (includeLocalRest) {
      deltas.push(
        withFailId(
          {
            id: "local_rest_projection_ready",
            comparator: ">=",
            value: isLinkedLocalRest(localRestSummary) ? 1 : 0,
            limit: 1,
            pass: isLinkedLocalRest(localRestSummary),
          },
          "HALOBANK_SOLAR_LOCAL_REST_UNAVAILABLE",
        ),
      );
      if (isLinkedLocalRest(localRestSummary)) {
        deltas.push(
          withFailId(
            {
              id: "local_rest_reference_ready",
              comparator: ">=",
              value: localRestCalibrationError === null ? 1 : 0,
              limit: 1,
              pass: localRestCalibrationError === null,
            },
            "HALOBANK_SOLAR_LOCAL_REST_REFERENCE_UNAVAILABLE",
          ),
        );
        if (localRestCalibration) {
          deltas.push(
            ...localRestCalibration.gate.deltas.map((entry) =>
              withFailId(
                entry,
                localRestCalibration.gate.firstFail ?? "HALOBANK_SOLAR_LOCAL_REST_REFERENCE_MISMATCH",
              ),
            ),
          );
        }
      }
    }

    if (strictProvenance) {
      deltas.push(
        withFailId(
          {
            id: "strict_provenance_evidence_refs",
            comparator: ">=",
            value: canonicalEvidenceRefs.length,
            limit: 1,
            pass: canonicalEvidenceRefs.length >= 1,
          },
          canonicalEvidenceRefs.length >= 1 ? "HALOBANK_SOLAR_EVIDENCE_REF_INVALID" : "HALOBANK_SOLAR_STRICT_PROVENANCE_MISSING",
        ),
      );
    }

    const firstFail = firstFailFromDeltas(deltas);
    const gate: SolarGate = {
      gate: VECTOR_GATE_ID,
      verdict: firstFail ? "FAIL" : "PASS",
      firstFail,
      deterministic: true,
      deltas: deltas.map(({ failId: _failId, ...rest }) => rest),
      reasons: firstFail
        ? ["Vectors request failed deterministic consistency gate."]
        : ["Vectors request passed deterministic consistency gate."],
    };

    const vectorsArtifactHash = hashStableJson({
      time_scales: timeScales,
      metric_context: metricContext,
      reference_origin_state: responseReferenceOriginState,
      states: responseStates,
      reference: bundle.reference,
      local_rest: localRestSummary,
      frame,
      aberration,
      center: centerId,
    });
    const vectorsArtifactRef = `artifact:halobank.solar.vectors:${vectorsArtifactHash.slice(7, 23)}`;
    const metricContextHash = hashStableJson(metricContext);
    const metricContextArtifactRef = `artifact:halobank.solar.metric_context:${metricContextHash.slice(7, 23)}`;
    const localRestCalibrationHash = localRestCalibration
      ? hashStableJson({ result: localRestCalibration.result, gate: localRestCalibration.gate })
      : null;
    const provenance = {
      kernel_bundle_id: bundleManifest.bundle_id,
      source_class: signature.ok && assets.ok ? "kernel_bundle" : "fallback",
      claim_tier: "diagnostic" as const,
      certifying: false as const,
      evidence_refs: Array.from(
        new Set([
          ...canonicalEvidenceRefs,
          vectorsArtifactRef,
          metricContextArtifactRef,
          ...(localRestCalibration ? [localRestCalibration.artifact_ref] : []),
        ]),
      ),
      signature_ok: signature.ok,
      epoch_window: {
        start_iso: bundleManifest.epoch_range.start_iso,
        end_iso: bundleManifest.epoch_range.end_iso,
      },
      note: signature.ok && assets.ok
        ? "Pinned kernel bundle path; diagnostic claim tier."
        : "Kernel bundle integrity checks failed; fallback diagnostic posture.",
    };

    return res.json({
      request: {
        ts: timeScales.utc,
        targets: targetIds,
        center: centerId,
        resolved_center: bundle.reference.resolved_center,
        frame,
        aberration,
        observer: observer ?? null,
        strict_provenance: strictProvenance,
        include_local_rest: includeLocalRest,
      },
      time_scales: timeScales,
      metric_context: metricContext,
      reference: bundle.reference,
      reference_origin_state: responseReferenceOriginState,
      reference_chain: {
        resolved_reference: bundle.reference,
        solar_system_barycenter: {
          id: 0,
          frame,
          semantics: "frame_origin_anchor",
        },
        local_rest: localRestSummary,
      },
      states: responseStates,
      provenance,
      gate,
      artifacts: [
        {
          id: "metric_context",
          ref: metricContextArtifactRef,
          content_hash: metricContextHash,
        },
        {
          id: "vectors",
          ref: vectorsArtifactRef,
          content_hash: vectorsArtifactHash,
        },
        ...(localRestCalibration && localRestCalibrationHash
          ? [
              {
                id: "local_rest_calibration",
                ref: localRestCalibration.artifact_ref,
                content_hash: localRestCalibrationHash,
                claim_id: "claim:halobank.solar:local_rest_anchor_calibration",
                equation_refs: ["uncertainty_propagation"],
                falsifier_ids: localRestCalibration.gate.firstFail ? [localRestCalibration.gate.firstFail] : [],
              },
            ]
          : []),
      ],
      earth: bundle.compatibility.earth,
      moon: bundle.compatibility.moon,
      sunObs: bundle.compatibility.sunObs,
      moonObs: bundle.compatibility.moonObs,
      planets: bundle.compatibility.planets,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(400).json({
      error: "halobank_solar_vectors_invalid_request",
      message,
    });
  }
});

halobankSolarRouter.post("/halobank/derived", async (req, res) => {
  const parsed = DerivedBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      error: "halobank_solar_derived_invalid_request",
      details: parsed.error.flatten(),
    });
  }

  try {
    const body = parsed.data;
    const strictProvenance = body.strict_provenance === true;
    const evidenceRefs = Array.from(new Set([...(body.evidence_refs ?? []), ...(body.evidence_ref ? [body.evidence_ref] : [])]));
    const bundleManifest = await loadSolarKernelBundle();
    const metricContextManifest = await loadSolarMetricContextManifest();
    const thresholds = await loadSolarThresholds();
    const localRestReferenceManifest = body.module === "local_rest_anchor_calibration"
      ? await loadSolarLocalRestReferenceManifest()
      : undefined;
    const metricContext = buildSolarMetricContext(metricContextManifest, "BCRS");
    const signature = verifyKernelBundleSignature(bundleManifest);
    const assets = await validateKernelBundleAssets(bundleManifest);
    const result = runDerivedModule({
      module: body.module as DerivedModuleId,
      input: body.input ?? {},
      thresholds,
      referenceManifest: localRestReferenceManifest,
      metricContextManifest,
    });

    const startIso = typeof result.result.start_iso === "string" ? result.result.start_iso : thresholds.epoch_window.start_iso;
    const endIso = typeof result.result.end_iso === "string" ? result.result.end_iso : thresholds.epoch_window.end_iso;
    const epochInWindow = isWithinWindow(startIso, thresholds.epoch_window.start_iso, thresholds.epoch_window.end_iso)
      && isWithinWindow(endIso, thresholds.epoch_window.start_iso, thresholds.epoch_window.end_iso);
    const gate = normalizeDerivedGate({
      baseGate: result.gate,
      signatureOk: signature.ok,
      kernelAssetsPresentOk: assets.missing.length === 0,
      kernelAssetsDigestOk: assets.digestMismatch.length === 0,
      strictProvenance,
      evidenceRefs,
      epochInWindow,
    });

    const proofHash = hashStableJson({
      module: result.module,
      result: result.result,
      gate,
      metric_context: metricContext,
      input: body.input ?? {},
    });
    const proofArtifactRef = `artifact:halobank.solar.derived:${result.module}:${proofHash.slice(7, 23)}`;
    const metricContextHash = hashStableJson(metricContext);
    const metricContextArtifactRef = `artifact:halobank.solar.metric_context:${metricContextHash.slice(7, 23)}`;
    const equationRefsByModule: Record<DerivedModuleId, string[]> = {
      mercury_precession: ["uncertainty_propagation"],
      earth_moon_eclipse_timing: ["runtime_safety_gate"],
      resonance_libration: ["uncertainty_propagation"],
      saros_cycle: ["periodicity_commensurability"],
      jovian_moon_event_timing: ["line_of_sight_occultation_geometry"],
      solar_light_deflection: ["uncertainty_propagation"],
      inner_solar_metric_parity: ["uncertainty_propagation"],
      local_rest_anchor_calibration: ["uncertainty_propagation"],
    };
    const provenance = {
      kernel_bundle_id: bundleManifest.bundle_id,
      source_class: signature.ok && assets.ok ? "kernel_bundle" : "fallback",
      claim_tier: "diagnostic" as const,
      certifying: false as const,
      evidence_refs: Array.from(
        new Set([
          ...evidenceRefs.filter((entry) => isCanonicalEvidenceRef(entry)),
          metricContextArtifactRef,
          result.artifact_ref,
          proofArtifactRef,
        ]),
      ),
      signature_ok: signature.ok,
      epoch_window: thresholds.epoch_window,
      note: gate.verdict === "PASS" ? "Derived module passed deterministic diagnostic gate." : "Derived module failed deterministic diagnostic gate.",
    };

    return res.json({
      module: result.module,
      result: result.result,
      metric_context: metricContext,
      provenance,
      gate,
      artifacts: [
        {
          id: "metric_context",
          ref: metricContextArtifactRef,
          content_hash: metricContextHash,
        },
        {
          id: `${result.module}:raw`,
          ref: result.artifact_ref,
          content_hash: hashStableJson({ result: result.result, gate: result.gate }),
        },
        {
          id: `${result.module}:proof`,
          ref: proofArtifactRef,
          content_hash: proofHash,
        },
      ],
      tree_dag: {
        node_family: `halobank.solar.${result.module}.v1`,
        claim_id: `claim:halobank.solar:${result.module}`,
        equation_refs: equationRefsByModule[result.module],
        falsifier_ids: gate.firstFail ? [gate.firstFail] : [],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      error: "halobank_solar_derived_failed",
      message,
    });
  }
});
