import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING,
} from "../../../shared/contracts/nhm2-prolate-boson-star-newtonian-seed-run-plan.v1";
import {
  NHM2_PROLATE_BOSON_STAR_SEED_RUN_SERVER_AUTHORITY_LOCKS,
  type Nhm2ProlateBosonStarSeedRunControlPlaneBindingV1,
} from "./nhm2-prolate-boson-star-seed-run-evidence-interpreter";

export const NHM2_PROLATE_BOSON_STAR_SEED_ISOLATED_WORKER_PROVIDER_VERSION =
  "nhm2_prolate_boson_star_seed_isolated_worker_provider/v1" as const;

export const NHM2_PROLATE_BOSON_STAR_SEED_ISOLATED_WORKER_EXECUTION_TARGET =
  "external_linux_oci_cgroup_v2_worker" as const;

export const NHM2_PROLATE_BOSON_STAR_SEED_ISOLATED_WORKER_CAPABILITY_PROFILE =
  "isolatedWorkerCapability" as const;

export type Nhm2ProlateBosonStarSeedIsolatedWorkerCapabilityEvidenceV1 =
  Readonly<{
    canonicalUtf8Bytes: Uint8Array;
    binding: Nhm2ProlateBosonStarSeedRunControlPlaneBindingV1;
  }>;

export type Nhm2ProlateBosonStarSeedIsolatedWorkerLaunchRequestV1 = Readonly<{
  runPlan: typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1;
  runPlanBinding: typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING;
  sealedRunRequestCanonicalUtf8Bytes: Uint8Array;
  sealedRunRequestBinding: Nhm2ProlateBosonStarSeedRunControlPlaneBindingV1;
}>;

/**
 * A future native-Linux provider may return raw evidence only. Nothing at this
 * interface boundary accepts the evidence as an artifact or scientific result.
 */
export type Nhm2ProlateBosonStarSeedIsolatedWorkerRawResultV1 = Readonly<{
  status: "raw_evidence_only" | "provider_failed";
  rawEvidenceCanonicalUtf8Bytes: readonly Uint8Array[];
  issues: readonly string[];
  authorityLocks: typeof NHM2_PROLATE_BOSON_STAR_SEED_RUN_SERVER_AUTHORITY_LOCKS;
}>;

/**
 * Server-composed provider interface for the exact Linux execution target in
 * the sealed run plan. Implementations must be injected by trusted composition;
 * this module has no host-process, WSL, Docker CLI, HTTP, or environment fallback.
 */
export type Nhm2ProlateBosonStarSeedIsolatedWorkerProviderV1 = Readonly<{
  providerVersion: typeof NHM2_PROLATE_BOSON_STAR_SEED_ISOLATED_WORKER_PROVIDER_VERSION;
  providerId: string;
  executionTarget: typeof NHM2_PROLATE_BOSON_STAR_SEED_ISOLATED_WORKER_EXECUTION_TARGET;
  platform: "linux";
  capabilityProfile: typeof NHM2_PROLATE_BOSON_STAR_SEED_ISOLATED_WORKER_CAPABILITY_PROFILE;
  runPlan: typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1;
  runPlanBinding: typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING;
  inspectCapabilityEvidence: () => Promise<Nhm2ProlateBosonStarSeedIsolatedWorkerCapabilityEvidenceV1>;
  launchSealedRun: (
    request: Nhm2ProlateBosonStarSeedIsolatedWorkerLaunchRequestV1,
  ) => Promise<Nhm2ProlateBosonStarSeedIsolatedWorkerRawResultV1>;
}>;

export type Nhm2ProlateBosonStarSeedIsolatedWorkerProviderSnapshotV1 =
  Readonly<{
    providerId: string;
    inspectCapabilityEvidence: Nhm2ProlateBosonStarSeedIsolatedWorkerProviderV1["inspectCapabilityEvidence"];
    launchSealedRun: Nhm2ProlateBosonStarSeedIsolatedWorkerProviderV1["launchSealedRun"];
  }>;

const PROVIDER_KEYS = Object.freeze([
  "providerVersion",
  "providerId",
  "executionTarget",
  "platform",
  "capabilityProfile",
  "runPlan",
  "runPlanBinding",
  "inspectCapabilityEvidence",
  "launchSealedRun",
] as const);

const PROVIDER_ID = /^[a-z0-9](?:[a-z0-9._-]{0,126}[a-z0-9])?$/;

const snapshotExactFrozenDataObject = (
  value: unknown,
): Readonly<Record<string, unknown>> | null => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  try {
    const prototype = Object.getPrototypeOf(value);
    if (
      (prototype !== Object.prototype && prototype !== null) ||
      !Object.isFrozen(value)
    ) {
      return null;
    }
    const keys = Reflect.ownKeys(value);
    if (
      keys.length !== PROVIDER_KEYS.length ||
      keys.some((key) => typeof key !== "string") ||
      !PROVIDER_KEYS.every((key) => keys.includes(key))
    ) {
      return null;
    }
    const snapshot = Object.create(null) as Record<string, unknown>;
    for (const key of PROVIDER_KEYS) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true ||
        descriptor.configurable !== false ||
        descriptor.writable !== false
      ) {
        return null;
      }
      snapshot[key] = descriptor.value;
    }
    return Object.freeze(snapshot);
  } catch {
    return null;
  }
};

/**
 * Takes a hostile-surface-safe snapshot without invoking accessors. The exact
 * authoritative run-plan singleton identities are mandatory; semantic copies
 * cannot enroll a provider.
 */
export const snapshotNhm2ProlateBosonStarSeedIsolatedWorkerProviderV1 = (
  value: unknown,
):
  | Readonly<{
      ok: true;
      snapshot: Nhm2ProlateBosonStarSeedIsolatedWorkerProviderSnapshotV1;
    }>
  | Readonly<{ ok: false; issues: readonly string[] }> => {
  const record = snapshotExactFrozenDataObject(value);
  if (record == null) {
    return Object.freeze({
      ok: false,
      issues: Object.freeze(["exact_frozen_plain_data_provider_required"]),
    });
  }
  const issues: string[] = [];
  if (
    record.providerVersion !==
    NHM2_PROLATE_BOSON_STAR_SEED_ISOLATED_WORKER_PROVIDER_VERSION
  ) {
    issues.push("provider_version_mismatch");
  }
  if (
    typeof record.providerId !== "string" ||
    !PROVIDER_ID.test(record.providerId)
  ) {
    issues.push("provider_id_invalid");
  }
  if (
    record.executionTarget !==
    NHM2_PROLATE_BOSON_STAR_SEED_ISOLATED_WORKER_EXECUTION_TARGET
  ) {
    issues.push("execution_target_mismatch");
  }
  if (record.platform !== "linux") issues.push("linux_platform_required");
  if (
    record.capabilityProfile !==
    NHM2_PROLATE_BOSON_STAR_SEED_ISOLATED_WORKER_CAPABILITY_PROFILE
  ) {
    issues.push("capability_profile_mismatch");
  }
  if (record.runPlan !== NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1) {
    issues.push("authoritative_run_plan_singleton_required");
  }
  if (
    record.runPlanBinding !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_BINDING
  ) {
    issues.push("authoritative_run_plan_binding_singleton_required");
  }
  if (typeof record.inspectCapabilityEvidence !== "function") {
    issues.push("capability_inspector_required");
  }
  if (typeof record.launchSealedRun !== "function") {
    issues.push("sealed_launch_function_required");
  }
  if (issues.length > 0) {
    return Object.freeze({ ok: false, issues: Object.freeze(issues.sort()) });
  }
  return Object.freeze({
    ok: true,
    snapshot: Object.freeze({
      providerId: record.providerId as string,
      inspectCapabilityEvidence:
        record.inspectCapabilityEvidence as Nhm2ProlateBosonStarSeedIsolatedWorkerProviderV1["inspectCapabilityEvidence"],
      launchSealedRun:
        record.launchSealedRun as Nhm2ProlateBosonStarSeedIsolatedWorkerProviderV1["launchSealedRun"],
    }),
  });
};

export type Nhm2ProlateBosonStarSeedDefaultProviderStatusV1 = Readonly<{
  statusVersion: "nhm2_prolate_boson_star_seed_default_provider_status/v1";
  supported: false;
  code:
    "current_windows_host_ineligible" | "external_linux_provider_unconfigured";
  currentPlatform: NodeJS.Platform;
  provider: null;
  launchApi: null;
  launchAttempted: false;
  launchAttemptCount: 0;
  authorityLocks: typeof NHM2_PROLATE_BOSON_STAR_SEED_RUN_SERVER_AUTHORITY_LOCKS;
}>;

/**
 * The built-in/default path never launches. Windows is explicitly ineligible;
 * other hosts remain blocked until trusted composition supplies a provider.
 */
export const inspectDefaultNhm2ProlateBosonStarSeedIsolatedWorkerProviderV1 =
  (): Nhm2ProlateBosonStarSeedDefaultProviderStatusV1 =>
    Object.freeze({
      statusVersion: "nhm2_prolate_boson_star_seed_default_provider_status/v1",
      supported: false,
      code:
        process.platform === "win32"
          ? "current_windows_host_ineligible"
          : "external_linux_provider_unconfigured",
      currentPlatform: process.platform,
      provider: null,
      launchApi: null,
      launchAttempted: false,
      launchAttemptCount: 0,
      authorityLocks: NHM2_PROLATE_BOSON_STAR_SEED_RUN_SERVER_AUTHORITY_LOCKS,
    });
