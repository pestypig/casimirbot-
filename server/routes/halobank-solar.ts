import { Router } from "express";
import { z } from "zod";
import {
  loadSolarKernelBundle,
  loadSolarThresholds,
  verifyKernelBundleSignature,
  isCanonicalEvidenceRef,
  validateKernelBundleAssets,
} from "../modules/halobank-solar/config";
import { buildSolarVectorBundle, DEFAULT_VECTOR_TARGETS, resolveSupportedBody } from "../modules/halobank-solar/ephemeris-core";
import { runDerivedModule, type DerivedModuleId } from "../modules/halobank-solar/derived";
import { computeSolarTimeScales } from "../modules/halobank-solar/time-core";
import type { SolarGate, SolarGateDelta, SolarObserver } from "../modules/halobank-solar/types";
import { hashStableJson } from "../utils/information-boundary";

export const halobankSolarRouter = Router();

const VECTOR_GATE_ID = "halobank.solar.vectors.consistency.v1";
const DERIVED_GATE_ID = "halobank.solar.derived.consistency.v1";

const DerivedBody = z
  .object({
    module: z.enum(["mercury_precession", "earth_moon_eclipse_timing", "resonance_libration"]),
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
    const observer = parseObserver(req.query.observer);
    const requestedTargets = parseCsvNumbers(req.query.targets);
    const targetIds = Array.from(new Set((requestedTargets.length ? requestedTargets : [...DEFAULT_VECTOR_TARGETS]).filter((id) => resolveSupportedBody(id))));
    const evidenceRefs = parseEvidenceRefs({ evidenceRef: req.query.evidence_ref, evidenceRefs: req.query.evidence_refs });

    const bundleManifest = await loadSolarKernelBundle();
    const signature = verifyKernelBundleSignature(bundleManifest);
    const assets = await validateKernelBundleAssets(bundleManifest);
    const timeScales = computeSolarTimeScales(tsIso);
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
      states: bundle.states,
      frame,
      aberration,
      center: centerId,
    });
    const vectorsArtifactRef = `artifact:halobank.solar.vectors:${vectorsArtifactHash.slice(7, 23)}`;
    const provenance = {
      kernel_bundle_id: bundleManifest.bundle_id,
      source_class: signature.ok && assets.ok ? "kernel_bundle" : "fallback",
      claim_tier: "diagnostic" as const,
      certifying: false as const,
      evidence_refs: Array.from(new Set([...canonicalEvidenceRefs, vectorsArtifactRef])),
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
        frame,
        aberration,
        observer: observer ?? null,
        strict_provenance: strictProvenance,
      },
      time_scales: timeScales,
      states: bundle.states,
      provenance,
      gate,
      artifacts: [
        {
          id: "vectors",
          ref: vectorsArtifactRef,
          content_hash: vectorsArtifactHash,
        },
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
    const thresholds = await loadSolarThresholds();
    const signature = verifyKernelBundleSignature(bundleManifest);
    const assets = await validateKernelBundleAssets(bundleManifest);
    const result = runDerivedModule({
      module: body.module as DerivedModuleId,
      input: body.input ?? {},
      thresholds,
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
      input: body.input ?? {},
    });
    const proofArtifactRef = `artifact:halobank.solar.derived:${result.module}:${proofHash.slice(7, 23)}`;
    const equationRefsByModule: Record<DerivedModuleId, string[]> = {
      mercury_precession: ["uncertainty_propagation"],
      earth_moon_eclipse_timing: ["runtime_safety_gate"],
      resonance_libration: ["uncertainty_propagation"],
    };
    const provenance = {
      kernel_bundle_id: bundleManifest.bundle_id,
      source_class: signature.ok && assets.ok ? "kernel_bundle" : "fallback",
      claim_tier: "diagnostic" as const,
      certifying: false as const,
      evidence_refs: Array.from(new Set([...evidenceRefs.filter((entry) => isCanonicalEvidenceRef(entry)), result.artifact_ref, proofArtifactRef])),
      signature_ok: signature.ok,
      epoch_window: thresholds.epoch_window,
      note: gate.verdict === "PASS" ? "Derived module passed deterministic diagnostic gate." : "Derived module failed deterministic diagnostic gate.",
    };

    return res.json({
      module: result.module,
      result: result.result,
      provenance,
      gate,
      artifacts: [
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
