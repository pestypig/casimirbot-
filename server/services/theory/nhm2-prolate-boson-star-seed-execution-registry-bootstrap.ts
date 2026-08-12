import {
  NHM2_PROLATE_BOSON_STAR_SEED_RUN_SERVER_AUTHORITY_LOCKS,
  interpretNhm2ProlateBosonStarSeedRunEvidenceV1,
  type Nhm2ProlateBosonStarSeedRunControlPlaneBindingV1,
} from "./nhm2-prolate-boson-star-seed-run-evidence-interpreter";
import {
  NHM2_PROLATE_BOSON_STAR_SEED_ISOLATED_WORKER_CAPABILITY_PROFILE,
  NHM2_PROLATE_BOSON_STAR_SEED_ISOLATED_WORKER_EXECUTION_TARGET,
  snapshotNhm2ProlateBosonStarSeedIsolatedWorkerProviderV1,
} from "./nhm2-prolate-boson-star-seed-isolated-worker-provider";

export const NHM2_PROLATE_BOSON_STAR_SEED_EXECUTION_REGISTRY_BOOTSTRAP_STATUS_VERSION =
  "nhm2_prolate_boson_star_seed_execution_registry_bootstrap_status/v1" as const;

export type Nhm2ProlateBosonStarSeedCapabilityCatalogEntryV1 = Readonly<{
  providerId: string;
  executionTarget: typeof NHM2_PROLATE_BOSON_STAR_SEED_ISOLATED_WORKER_EXECUTION_TARGET;
  capabilityProfile: typeof NHM2_PROLATE_BOSON_STAR_SEED_ISOLATED_WORKER_CAPABILITY_PROFILE;
  capabilityBinding: Nhm2ProlateBosonStarSeedRunControlPlaneBindingV1;
  supportedClosedSchemaValidated: true;
  canonicalUtf8AndDomainHashValidated: true;
  descriptiveCrossFieldInvariantsIndependentlyReplayed: false;
  launchApiExposed: false;
  executionAuthorityGranted: false;
  artifactAuthorityGranted: false;
  physicalAuthorityGranted: false;
}>;

export type Nhm2ProlateBosonStarSeedExecutionRegistryBootstrapStatusV1 =
  Readonly<{
    statusVersion: typeof NHM2_PROLATE_BOSON_STAR_SEED_EXECUTION_REGISTRY_BOOTSTRAP_STATUS_VERSION;
    trustedServerCompositionOnly: true;
    catalogConfigured: boolean;
    catalogEntryCount: number;
    providersSubmitted: number;
    capabilityEvidencePreflighted: number;
    launchAttempted: false;
    launchAttemptCount: 0;
    launchResolverInstalled: false;
    catalogIssues: readonly string[];
    blockerCodes: readonly string[];
    authorityLocks: typeof NHM2_PROLATE_BOSON_STAR_SEED_RUN_SERVER_AUTHORITY_LOCKS;
  }>;

export type Nhm2ProlateBosonStarSeedExecutionRegistryBootstrapInputV1 =
  Readonly<{
    providers?: readonly unknown[];
  }>;

const MAXIMUM_PROVIDER_COUNT = 8;
const SHA256 = /^[0-9a-f]{64}$/;

let installedCatalog = Object.freeze(
  [] as readonly Nhm2ProlateBosonStarSeedCapabilityCatalogEntryV1[],
);

const exactDataRecord = (
  value: unknown,
  expectedKeys: readonly string[],
  requireFrozen: boolean,
): Readonly<Record<string, unknown>> | null => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  try {
    const prototype = Object.getPrototypeOf(value);
    if (
      (prototype !== Object.prototype && prototype !== null) ||
      (requireFrozen && !Object.isFrozen(value))
    ) {
      return null;
    }
    const keys = Reflect.ownKeys(value);
    if (
      keys.length !== expectedKeys.length ||
      keys.some((key) => typeof key !== "string") ||
      !expectedKeys.every((key) => keys.includes(key))
    ) {
      return null;
    }
    const output = Object.create(null) as Record<string, unknown>;
    for (const key of expectedKeys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      ) {
        return null;
      }
      output[key] = descriptor.value;
    }
    return Object.freeze(output);
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
  const record = exactDataRecord(input, ["providers"], false);
  if (record == null) {
    return Object.freeze({
      ok: false,
      issue: "exact_bootstrap_input_surface_required",
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

const snapshotCapabilityEvidence = (
  value: unknown,
):
  | Readonly<{
      ok: true;
      bytes: Buffer;
      binding: unknown;
    }>
  | Readonly<{ ok: false; issue: string }> => {
  const record = exactDataRecord(
    value,
    ["canonicalUtf8Bytes", "binding"],
    true,
  );
  if (record == null || !(record.canonicalUtf8Bytes instanceof Uint8Array)) {
    return Object.freeze({
      ok: false,
      issue: "exact_frozen_capability_evidence_surface_required",
    });
  }
  try {
    return Object.freeze({
      ok: true,
      bytes: Buffer.from(record.canonicalUtf8Bytes),
      binding: record.binding,
    });
  } catch {
    return Object.freeze({
      ok: false,
      issue: "capability_evidence_snapshot_failed",
    });
  }
};

const status = (
  providersSubmitted: number,
  capabilityEvidencePreflighted: number,
  catalogIssues: readonly string[],
  blockerCodes: readonly string[],
): Nhm2ProlateBosonStarSeedExecutionRegistryBootstrapStatusV1 =>
  Object.freeze({
    statusVersion:
      NHM2_PROLATE_BOSON_STAR_SEED_EXECUTION_REGISTRY_BOOTSTRAP_STATUS_VERSION,
    trustedServerCompositionOnly: true,
    catalogConfigured:
      installedCatalog.length > 0 &&
      catalogIssues.length === 0 &&
      blockerCodes.length === 0,
    catalogEntryCount: installedCatalog.length,
    providersSubmitted,
    capabilityEvidencePreflighted,
    launchAttempted: false,
    launchAttemptCount: 0,
    launchResolverInstalled: false,
    catalogIssues: Object.freeze([...catalogIssues]),
    blockerCodes: Object.freeze([...new Set(blockerCodes)].sort()),
    authorityLocks: NHM2_PROLATE_BOSON_STAR_SEED_RUN_SERVER_AUTHORITY_LOCKS,
  });

/**
 * Trusted server-composition boundary. Installation is all-or-nothing and
 * preflight invokes only capability inspection. The provider launch function
 * is deliberately neither called nor retained in the installed catalog.
 */
export const installNhm2ProlateBosonStarSeedExecutionRegistryAtServerBootstrapV1 =
  async (
    input?: Nhm2ProlateBosonStarSeedExecutionRegistryBootstrapInputV1,
  ): Promise<Nhm2ProlateBosonStarSeedExecutionRegistryBootstrapStatusV1> => {
    installedCatalog = Object.freeze([]);
    const providerList = snapshotProviderList(input);
    if (providerList.ok === false) {
      return status(0, 0, [providerList.issue], ["provider_input_invalid"]);
    }
    if (providerList.providers.length === 0) {
      return status(0, 0, [], ["isolated_worker_provider_unconfigured"]);
    }

    const candidateEntries: Nhm2ProlateBosonStarSeedCapabilityCatalogEntryV1[] =
      [];
    const issues: string[] = [];
    const seenProviderIds = new Set<string>();
    let preflighted = 0;

    for (let index = 0; index < providerList.providers.length; index += 1) {
      const providerResult =
        snapshotNhm2ProlateBosonStarSeedIsolatedWorkerProviderV1(
          providerList.providers[index],
        );
      if (providerResult.ok === false) {
        issues.push(
          ...providerResult.issues.map((issue) => `provider_${index}:${issue}`),
        );
        continue;
      }
      const provider = providerResult.snapshot;
      if (seenProviderIds.has(provider.providerId)) {
        issues.push(`provider_${index}:duplicate_provider_id`);
        continue;
      }
      seenProviderIds.add(provider.providerId);

      let evidenceValue: unknown;
      try {
        evidenceValue = await Reflect.apply(
          provider.inspectCapabilityEvidence,
          undefined,
          [],
        );
      } catch {
        issues.push(`provider_${index}:capability_inspection_failed`);
        continue;
      }
      const evidence = snapshotCapabilityEvidence(evidenceValue);
      if (evidence.ok === false) {
        issues.push(`provider_${index}:${evidence.issue}`);
        continue;
      }
      const interpretation = interpretNhm2ProlateBosonStarSeedRunEvidenceV1(
        NHM2_PROLATE_BOSON_STAR_SEED_ISOLATED_WORKER_CAPABILITY_PROFILE,
        evidence.bytes,
        evidence.binding,
      );
      if (interpretation.ok === false) {
        issues.push(
          `provider_${index}:capability_evidence_${interpretation.code}`,
        );
        continue;
      }
      preflighted += 1;
      candidateEntries.push(
        Object.freeze({
          providerId: provider.providerId,
          executionTarget:
            NHM2_PROLATE_BOSON_STAR_SEED_ISOLATED_WORKER_EXECUTION_TARGET,
          capabilityProfile:
            NHM2_PROLATE_BOSON_STAR_SEED_ISOLATED_WORKER_CAPABILITY_PROFILE,
          capabilityBinding: interpretation.binding,
          supportedClosedSchemaValidated: true,
          canonicalUtf8AndDomainHashValidated: true,
          descriptiveCrossFieldInvariantsIndependentlyReplayed: false,
          launchApiExposed: false,
          executionAuthorityGranted: false,
          artifactAuthorityGranted: false,
          physicalAuthorityGranted: false,
        }),
      );
    }

    if (
      issues.length > 0 ||
      candidateEntries.length !== providerList.providers.length
    ) {
      return status(providerList.providers.length, preflighted, issues.sort(), [
        "capability_attestation_preflight_incomplete",
      ]);
    }
    installedCatalog = Object.freeze([...candidateEntries]);
    return status(providerList.providers.length, preflighted, [], []);
  };

export const inspectNhm2ProlateBosonStarSeedCapabilityCatalogV1 = (): Readonly<{
  catalogVersion: "nhm2_prolate_boson_star_seed_capability_catalog/v1";
  configured: boolean;
  entries: readonly Nhm2ProlateBosonStarSeedCapabilityCatalogEntryV1[];
  launchApi: null;
  authorityLocks: typeof NHM2_PROLATE_BOSON_STAR_SEED_RUN_SERVER_AUTHORITY_LOCKS;
}> =>
  Object.freeze({
    catalogVersion: "nhm2_prolate_boson_star_seed_capability_catalog/v1",
    configured: installedCatalog.length > 0,
    entries: Object.freeze([...installedCatalog]),
    launchApi: null,
    authorityLocks: NHM2_PROLATE_BOSON_STAR_SEED_RUN_SERVER_AUTHORITY_LOCKS,
  });

/** Metadata-only lookup: no provider function or launch authority is exposed. */
export const resolveNhm2ProlateBosonStarSeedCapabilityCatalogEntryV1 = (
  input: Readonly<{ providerId: string; capabilitySha256: string }>,
): Nhm2ProlateBosonStarSeedCapabilityCatalogEntryV1 | null => {
  const record = exactDataRecord(
    input,
    ["providerId", "capabilitySha256"],
    false,
  );
  if (
    record == null ||
    typeof record.providerId !== "string" ||
    typeof record.capabilitySha256 !== "string" ||
    !SHA256.test(record.capabilitySha256)
  ) {
    return null;
  }
  return (
    installedCatalog.find(
      (entry) =>
        entry.providerId === record.providerId &&
        entry.capabilityBinding.sha256 === record.capabilitySha256,
    ) ?? null
  );
};
