import { createHash } from "node:crypto";

import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN,
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN_CANONICAL_JSON,
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN_SHA256,
  nhm2ConformallyFlatNeedleScalarCandidatePackPlanViolations,
  type Nhm2ConformallyFlatNeedleScalarCandidatePackInputPlanV1,
  type Nhm2ConformallyFlatNeedleScalarCandidatePackPlanV1,
} from "../../../shared/contracts/nhm2-conformally-flat-needle-scalar-candidate-pack-plan.v1";
import type { Nhm2SemiclassicalV2ScientificNonSelfInputId } from "../../../shared/contracts/nhm2-semiclassical-v2-scientific-candidate-manifest.v1";

export type Nhm2ConformallyFlatNeedleScalarCandidatePackMaterializerErrorCode =
  | "materializer_integrity_failed"
  | "scientific_input_id_invalid"
  | "scientific_input_incomplete"
  | "candidate_pack_incomplete";

export class Nhm2ConformallyFlatNeedleScalarCandidatePackMaterializerError extends Error {
  readonly code: Nhm2ConformallyFlatNeedleScalarCandidatePackMaterializerErrorCode;
  readonly inputId: string | null;
  readonly blockers: readonly string[];

  constructor(
    code: Nhm2ConformallyFlatNeedleScalarCandidatePackMaterializerErrorCode,
    message: string,
    options: {
      inputId?: string | null;
      blockers?: readonly string[];
      cause?: unknown;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "Nhm2ConformallyFlatNeedleScalarCandidatePackMaterializerError";
    this.code = code;
    this.inputId = options.inputId ?? null;
    this.blockers = Object.freeze([...(options.blockers ?? [])]);
  }
}

export type Nhm2ConformallyFlatNeedleScalarReadyScienceInputV1 = Readonly<{
  plan: Nhm2ConformallyFlatNeedleScalarCandidatePackInputPlanV1;
  bytes: Buffer;
}>;

const fail = (
  code: Nhm2ConformallyFlatNeedleScalarCandidatePackMaterializerErrorCode,
  message: string,
  options: {
    inputId?: string | null;
    blockers?: readonly string[];
    cause?: unknown;
  } = {},
): never => {
  throw new Nhm2ConformallyFlatNeedleScalarCandidatePackMaterializerError(
    code,
    message,
    options,
  );
};

const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

const validatedPlan =
  (): Nhm2ConformallyFlatNeedleScalarCandidatePackPlanV1 => {
    const violations =
      nhm2ConformallyFlatNeedleScalarCandidatePackPlanViolations(
        NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN,
      );
    if (violations.length > 0) {
      return fail(
        "materializer_integrity_failed",
        `The frozen candidate-pack plan failed its own contract: ${violations.join(",")}`,
      );
    }
    return NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN;
  };

/**
 * Server-owned, deterministic, output-free materialization entry point.
 *
 * This intentionally returns a pure plan. It accepts no filesystem location,
 * timestamp, override, tensor, or producer-authored claim. The current frozen
 * scalar reference is scientifically incomplete, so no candidate-manifest or
 * preseal bytes are emitted.
 */
export const materializeNhm2ConformallyFlatNeedleScalarCandidatePackPlan =
  (): Nhm2ConformallyFlatNeedleScalarCandidatePackPlanV1 => validatedPlan();

/** Fresh canonical plan bytes for immutable storage or transport. */
export const readNhm2ConformallyFlatNeedleScalarCandidatePackPlanBytes =
  (): Buffer => {
    validatedPlan();
    const bytes = Buffer.from(
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN_CANONICAL_JSON,
      "utf8",
    );
    if (
      sha256(bytes) !==
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_CANDIDATE_PACK_PLAN_SHA256
    ) {
      return fail(
        "materializer_integrity_failed",
        "The canonical pure-plan byte binding failed in-memory readback.",
      );
    }
    return bytes;
  };

/**
 * Returns a fresh byte buffer for a ready frozen science input. Missing inputs
 * fail closed; callers cannot substitute bytes through this interface.
 */
export const readNhm2ConformallyFlatNeedleScalarReadyScienceInput = (
  inputId: Nhm2SemiclassicalV2ScientificNonSelfInputId,
): Nhm2ConformallyFlatNeedleScalarReadyScienceInputV1 => {
  const plan = validatedPlan();
  const entry = plan.inputPlans.find(
    (candidate) => candidate.inputId === inputId,
  );
  if (entry == null) {
    return fail(
      "scientific_input_id_invalid",
      `The input id ${String(inputId)} is not in the exact 22-input plan.`,
      { inputId: String(inputId) },
    );
  }
  if (
    entry.materializationStatus !== "canonical_science_bytes_ready" ||
    entry.canonicalBytesBase64 == null ||
    entry.sha256 == null ||
    entry.sizeBytes == null
  ) {
    return fail(
      "scientific_input_incomplete",
      `The frozen science input ${inputId} is unresolved and has no admitted bytes.`,
      {
        inputId,
        blockers: entry.blocker == null ? [] : [entry.blocker],
      },
    );
  }
  const bytes = Buffer.from(entry.canonicalBytesBase64, "base64");
  if (bytes.byteLength !== entry.sizeBytes || sha256(bytes) !== entry.sha256) {
    return fail(
      "materializer_integrity_failed",
      `The embedded byte binding for ${inputId} failed secure in-memory readback.`,
      { inputId },
    );
  }
  return Object.freeze({ plan: entry, bytes });
};

/**
 * There is deliberately no success branch while any scientific input is
 * absent. A future implementation must consume a newly frozen, fully closed
 * reference rather than mutating or filling this plan after the fact.
 */
export const materializeNhm2ConformallyFlatNeedleScalarCandidateManifestBytes =
  (): never => {
    const plan = validatedPlan();
    return fail(
      "candidate_pack_incomplete",
      "Candidate-manifest bytes are forbidden until all twenty-two scientific inputs are present and the candidate is freshly frozen.",
      { blockers: plan.authorityState.blockers },
    );
  };
