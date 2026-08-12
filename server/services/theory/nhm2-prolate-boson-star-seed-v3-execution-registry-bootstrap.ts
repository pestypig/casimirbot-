import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_SCHEMA_BINDINGS,
} from "../../../shared/contracts/nhm2-prolate-boson-star-newtonian-seed-run-plan.v3";
import {
  NHM2_PROLATE_BOSON_STAR_SEED_V3_EXECUTION_TARGET,
  installNhm2ProlateBosonStarSeedV3ProviderBehindTrustedServerHandle,
  revokeNhm2ProlateBosonStarSeedV3TrustedServerLaunchHandle,
  type Nhm2ProlateBosonStarSeedV3TrustedServerLaunchHandle,
} from "./nhm2-prolate-boson-star-seed-v3-provider-preflight";

export const NHM2_PROLATE_BOSON_STAR_SEED_V3_EXECUTION_REGISTRY_BOOTSTRAP_STATUS_VERSION =
  "nhm2_prolate_boson_star_seed_execution_registry_bootstrap_status/v3" as const;

export type Nhm2ProlateBosonStarSeedV3CapabilityCatalogEntry = Readonly<{
  providerId: string;
  executionTarget: typeof NHM2_PROLATE_BOSON_STAR_SEED_V3_EXECUTION_TARGET;
  runPlanBinding: typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_BINDING;
  evidenceSchemaRegistryBinding: typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_BINDING;
  verifierPrelaunchContextRejectionSchemaBinding: (typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_SCHEMA_BINDINGS)["verifierPrelaunchContextRejection"];
  sealedRootAndRegistryValidated: true;
  preflightRequiredBeforeLaunch: true;
  launchApiExposed: false;
  trustedServerHandleExposed: false;
  defaultLaunchAllowed: false;
  currentHostFallbackAllowed: false;
  executionAuthorityGranted: false;
  artifactAuthorityGranted: false;
  scientificAuthorityGranted: false;
  physicalAuthorityGranted: false;
}>;

export type Nhm2ProlateBosonStarSeedV3ExecutionRegistryBootstrapStatus =
  Readonly<{
    statusVersion: typeof NHM2_PROLATE_BOSON_STAR_SEED_V3_EXECUTION_REGISTRY_BOOTSTRAP_STATUS_VERSION;
    trustedServerCompositionOnly: true;
    configured: boolean;
    catalogConfigured: boolean;
    catalogEntryCount: number;
    providersSubmitted: number;
    providersInstalledBehindOpaqueHandles: number;
    trustedServerHandlesIssued: number;
    launchResolverInstalled: boolean;
    launchAttempted: false;
    launchAttemptCount: 0;
    catalogIssues: readonly string[];
    blockerCodes: readonly string[];
    authorityLocks: typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3.claimLocks;
  }>;

export type Nhm2ProlateBosonStarSeedV3ExecutionRegistryBootstrapInput =
  Readonly<{
    providers?: readonly unknown[];
  }>;

export type Nhm2ProlateBosonStarSeedV3TrustedServerHandleEntry = Readonly<{
  providerId: string;
  handle: Nhm2ProlateBosonStarSeedV3TrustedServerLaunchHandle;
}>;

export type Nhm2ProlateBosonStarSeedV3ExecutionRegistryBootstrapResult =
  Readonly<{
    status: Nhm2ProlateBosonStarSeedV3ExecutionRegistryBootstrapStatus;
    /** Authority-bearing output for the trusted server composer only. */
    trustedServerHandles: readonly Nhm2ProlateBosonStarSeedV3TrustedServerHandleEntry[];
  }>;

const MAXIMUM_PROVIDER_COUNT = 8;
const SHA256 = /^[0-9a-f]{64}$/;

let installedCatalog = Object.freeze(
  [] as readonly Nhm2ProlateBosonStarSeedV3CapabilityCatalogEntry[],
);
let installedHandles = Object.freeze(
  [] as readonly Nhm2ProlateBosonStarSeedV3TrustedServerHandleEntry[],
);

const exactDataRecord = (
  value: unknown,
  expectedKeys: readonly string[],
): Readonly<Record<string, unknown>> | null => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  try {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const keys = Reflect.ownKeys(value);
    if (
      keys.length !== expectedKeys.length ||
      keys.some((key) => typeof key !== "string") ||
      !expectedKeys.every((key) => keys.includes(key))
    ) {
      return null;
    }
    const snapshot = Object.create(null) as Record<string, unknown>;
    for (const key of expectedKeys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        !descriptor.enumerable
      )
        return null;
      snapshot[key] = descriptor.value;
    }
    return Object.freeze(snapshot);
  } catch {
    return null;
  }
};

const snapshotProviderList = (
  input: unknown,
):
  | Readonly<{ ok: true; providers: readonly unknown[] }>
  | Readonly<{ ok: false; issue: string }> => {
  if (input === undefined) {
    return Object.freeze({ ok: true, providers: Object.freeze([]) });
  }
  const record = exactDataRecord(input, ["providers"]);
  if (record == null) {
    return Object.freeze({
      ok: false,
      issue: "exact_v3_bootstrap_input_surface_required",
    });
  }
  if (!Array.isArray(record.providers)) {
    return Object.freeze({ ok: false, issue: "provider_array_required" });
  }
  let length: number;
  try {
    length = record.providers.length;
  } catch {
    return Object.freeze({ ok: false, issue: "provider_array_unreadable" });
  }
  if (!Number.isSafeInteger(length) || length > MAXIMUM_PROVIDER_COUNT) {
    return Object.freeze({
      ok: false,
      issue: "provider_count_limit_exceeded",
    });
  }
  const providers: unknown[] = [];
  try {
    for (let index = 0; index < length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(
        record.providers,
        index,
      );
      if (descriptor == null || !("value" in descriptor)) {
        return Object.freeze({
          ok: false,
          issue: "dense_data_provider_array_required",
        });
      }
      providers.push(descriptor.value);
    }
  } catch {
    return Object.freeze({ ok: false, issue: "provider_array_unreadable" });
  }
  return Object.freeze({ ok: true, providers: Object.freeze(providers) });
};

const clearInstalledV3Providers = (): void => {
  for (const entry of installedHandles) {
    revokeNhm2ProlateBosonStarSeedV3TrustedServerLaunchHandle(entry.handle);
  }
  installedHandles = Object.freeze([]);
  installedCatalog = Object.freeze([]);
};

const makeStatus = (
  providersSubmitted: number,
  catalogIssues: readonly string[],
  blockerCodes: readonly string[],
): Nhm2ProlateBosonStarSeedV3ExecutionRegistryBootstrapStatus => {
  const issues = Object.freeze([...catalogIssues].sort());
  const catalogConfigured =
    installedCatalog.length > 0 &&
    installedHandles.length === installedCatalog.length &&
    issues.length === 0;
  const blockers = Object.freeze(
    [
      ...new Set([
        ...blockerCodes,
        ...(catalogConfigured
          ? [
              "exact_v3_runtime_evidence_interpretation_and_admission_token_absent",
            ]
          : []),
      ]),
    ].sort(),
  );
  return Object.freeze({
    statusVersion:
      NHM2_PROLATE_BOSON_STAR_SEED_V3_EXECUTION_REGISTRY_BOOTSTRAP_STATUS_VERSION,
    trustedServerCompositionOnly: true,
    configured: false,
    catalogConfigured,
    catalogEntryCount: installedCatalog.length,
    providersSubmitted,
    providersInstalledBehindOpaqueHandles: installedHandles.length,
    trustedServerHandlesIssued: installedHandles.length,
    launchResolverInstalled: false,
    launchAttempted: false,
    launchAttemptCount: 0,
    catalogIssues: issues,
    blockerCodes: blockers,
    authorityLocks:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3.claimLocks,
  });
};

/**
 * The default invocation clears and revokes the lane. A real provider is
 * installed only when trusted server composition explicitly supplies it. The
 * returned handles are never copied into the metadata catalog.
 */
export const installNhm2ProlateBosonStarSeedExecutionRegistryAtServerBootstrapV3 =
  (
    input?: Nhm2ProlateBosonStarSeedV3ExecutionRegistryBootstrapInput,
  ): Nhm2ProlateBosonStarSeedV3ExecutionRegistryBootstrapResult => {
    clearInstalledV3Providers();
    const providerList = snapshotProviderList(input);
    if (providerList.ok === false) {
      return Object.freeze({
        status: makeStatus(0, [providerList.issue], ["provider_input_invalid"]),
        trustedServerHandles: Object.freeze([]),
      });
    }
    if (providerList.providers.length === 0) {
      return Object.freeze({
        status: makeStatus(0, [], ["v3_isolated_worker_provider_unconfigured"]),
        trustedServerHandles: Object.freeze([]),
      });
    }

    const candidateCatalog: Nhm2ProlateBosonStarSeedV3CapabilityCatalogEntry[] =
      [];
    const candidateHandles: Nhm2ProlateBosonStarSeedV3TrustedServerHandleEntry[] =
      [];
    const issues: string[] = [];
    const seen = new Set<string>();
    for (let index = 0; index < providerList.providers.length; index += 1) {
      const installed =
        installNhm2ProlateBosonStarSeedV3ProviderBehindTrustedServerHandle(
          providerList.providers[index],
        );
      if (installed.ok === false) {
        issues.push(
          ...installed.issues.map((issue) => `provider_${index}:${issue}`),
        );
        continue;
      }
      if (seen.has(installed.providerId)) {
        revokeNhm2ProlateBosonStarSeedV3TrustedServerLaunchHandle(
          installed.handle,
        );
        issues.push(`provider_${index}:duplicate_provider_id`);
        continue;
      }
      seen.add(installed.providerId);
      candidateHandles.push(
        Object.freeze({
          providerId: installed.providerId,
          handle: installed.handle,
        }),
      );
      candidateCatalog.push(
        Object.freeze({
          providerId: installed.providerId,
          executionTarget: NHM2_PROLATE_BOSON_STAR_SEED_V3_EXECUTION_TARGET,
          runPlanBinding:
            NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_BINDING,
          evidenceSchemaRegistryBinding:
            NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_BINDING,
          verifierPrelaunchContextRejectionSchemaBinding:
            NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_SCHEMA_BINDINGS.verifierPrelaunchContextRejection,
          sealedRootAndRegistryValidated: true,
          preflightRequiredBeforeLaunch: true,
          launchApiExposed: false,
          trustedServerHandleExposed: false,
          defaultLaunchAllowed: false,
          currentHostFallbackAllowed: false,
          executionAuthorityGranted: false,
          artifactAuthorityGranted: false,
          scientificAuthorityGranted: false,
          physicalAuthorityGranted: false,
        }),
      );
    }

    if (
      issues.length > 0 ||
      candidateCatalog.length !== providerList.providers.length
    ) {
      for (const entry of candidateHandles) {
        revokeNhm2ProlateBosonStarSeedV3TrustedServerLaunchHandle(entry.handle);
      }
      return Object.freeze({
        status: makeStatus(providerList.providers.length, issues, [
          "v3_provider_installation_incomplete",
        ]),
        trustedServerHandles: Object.freeze([]),
      });
    }
    installedCatalog = Object.freeze(candidateCatalog);
    installedHandles = Object.freeze(candidateHandles);
    return Object.freeze({
      status: makeStatus(providerList.providers.length, [], []),
      trustedServerHandles: Object.freeze([...installedHandles]),
    });
  };

export const inspectNhm2ProlateBosonStarSeedCapabilityCatalogV3 = (): Readonly<{
  catalogVersion: "nhm2_prolate_boson_star_seed_capability_catalog/v3";
  /** Metadata-only configuration; never implies launch readiness. */
  configured: boolean;
  configurationScope: "metadata_only";
  executionConfigured: false;
  launchResolverInstalled: false;
  entries: readonly Nhm2ProlateBosonStarSeedV3CapabilityCatalogEntry[];
  launchApi: null;
  trustedServerHandle: null;
  authorityLocks: typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3.claimLocks;
}> =>
  Object.freeze({
    catalogVersion: "nhm2_prolate_boson_star_seed_capability_catalog/v3",
    configured: installedCatalog.length > 0,
    configurationScope: "metadata_only",
    executionConfigured: false,
    launchResolverInstalled: false,
    entries: Object.freeze([...installedCatalog]),
    launchApi: null,
    trustedServerHandle: null,
    authorityLocks:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3.claimLocks,
  });

/** Metadata-only lookup; it cannot return a function or trusted handle. */
export const resolveNhm2ProlateBosonStarSeedCapabilityCatalogEntryV3 = (
  input: Readonly<{
    providerId: string;
    runPlanSha256: string;
    evidenceRegistrySha256: string;
  }>,
): Nhm2ProlateBosonStarSeedV3CapabilityCatalogEntry | null => {
  const record = exactDataRecord(input, [
    "providerId",
    "runPlanSha256",
    "evidenceRegistrySha256",
  ]);
  if (
    record == null ||
    typeof record.providerId !== "string" ||
    typeof record.runPlanSha256 !== "string" ||
    !SHA256.test(record.runPlanSha256) ||
    typeof record.evidenceRegistrySha256 !== "string" ||
    !SHA256.test(record.evidenceRegistrySha256)
  ) {
    return null;
  }
  return (
    installedCatalog.find(
      (entry) =>
        entry.providerId === record.providerId &&
        entry.runPlanBinding.sha256 === record.runPlanSha256 &&
        entry.evidenceSchemaRegistryBinding.sha256 ===
          record.evidenceRegistrySha256,
    ) ?? null
  );
};

export const inspectDefaultNhm2ProlateBosonStarSeedV3ProviderStatus =
  (): Readonly<{
    supported: false;
    code:
      | "current_windows_host_ineligible"
      | "external_linux_provider_unconfigured";
    currentPlatform: NodeJS.Platform;
    provider: null;
    launchApi: null;
    launchAttempted: false;
    launchAttemptCount: 0;
    authorityLocks: typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3.claimLocks;
  }> =>
    Object.freeze({
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
      authorityLocks:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3.claimLocks,
    });
