import type {
  Nhm2SemiclassicalV2PairAgreementReceiptV1,
  Nhm2SemiclassicalV2PairEmptyOutputPrestateV1,
  Nhm2SemiclassicalV2PairEnrollmentCapabilityBindingV1,
  Nhm2SemiclassicalV2PairImplementationLineageV1,
  Nhm2SemiclassicalV2PairLaunchSealServerReceiptV1,
  Nhm2SemiclassicalV2PairLaunchSealV1,
  Nhm2SemiclassicalV2PairOsIsolationAttestationV1,
  Nhm2SemiclassicalV2PairRole,
  Nhm2SemiclassicalV2PairRootLeaseV1,
  Nhm2SemiclassicalV2PairScientificPresealPersistedArtifactBindingV1,
} from "../../../shared/contracts/nhm2-semiclassical-v2-pair-agreement.v1";
import type { Nhm2SemiclassicalV2ScientificPresealV1 } from "../../../shared/contracts/nhm2-semiclassical-v2-scientific-preseal.v1";
import type {
  Nhm2SemiclassicalV2RunReplayerInput,
} from "./nhm2-semiclassical-v2-run-replayer";
import type { Nhm2SemiclassicalV2ScientificPresealServerReceiptV1 } from "./nhm2-semiclassical-v2-scientific-presealer";

export const NHM2_SEMICLASSICAL_V2_PAIR_EXECUTION_CATALOG_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_pair_execution_catalog/v1" as const;

export const NHM2_SEMICLASSICAL_V2_PAIR_EXECUTION_CATALOG_BLOCKERS = [
  "pair_enrollment_id_invalid",
  "scientific_preseal_reference_invalid",
  "trusted_pair_enrollment_not_registered",
  "trusted_os_isolation_backend_not_configured",
  "trusted_catalog_resolution_failed",
] as const;

export type Nhm2SemiclassicalV2PairExecutionCatalogBlocker =
  (typeof NHM2_SEMICLASSICAL_V2_PAIR_EXECUTION_CATALOG_BLOCKERS)[number];

export type Nhm2SemiclassicalV2PairCatalogAuthorityScope =
  | "production_server_installed"
  | "test_fixture_non_authoritative";

export type Nhm2SemiclassicalV2PairCatalogResolveRequestV1 = Readonly<{
  opaquePairEnrollmentId: string;
  scientificPresealReceiptId: string;
  scientificPresealArtifactId: string;
}>;

export type Nhm2SemiclassicalV2PairPersistedReadbackV1<T> = Readonly<{
  persistenceState: "created_exclusively" | "exact_idempotent_readback";
  value: Readonly<T>;
  persistedAtMonotonicNs: string;
  readbackObservedAt: string;
  readbackObservedAtMonotonicNs: string;
  canonicalSha256: string;
  artifact: Readonly<{
    absolutePath: string;
    sha256: string;
    sizeBytes: string;
    filesystemIdentity: Readonly<{
      dev: string;
      ino: string;
      sizeBytes: string;
      mtimeNs: string;
      ctimeNs: string;
    }>;
  }>;
}>;

export type Nhm2SemiclassicalV2PairLaneExecutionObservationV1 = Readonly<{
  runId: string;
  replayerInput: Readonly<Nhm2SemiclassicalV2RunReplayerInput>;
}>;

export type Nhm2SemiclassicalV2PairFrozenLaneSnapshotV1 = Readonly<{
  writersRevokedAt: string;
  outputMadeReadOnlyAt: string;
  writerCapabilityRevoked: true;
  outputReadOnlyVerifiedByServer: true;
  outputRootAbsolutePath: string;
}>;

export type Nhm2SemiclassicalV2PairLaneExecutionCapabilityV1 = Readonly<{
  role: Nhm2SemiclassicalV2PairRole;
  enrollmentCapability: Readonly<Nhm2SemiclassicalV2PairEnrollmentCapabilityBindingV1>;
  rootLease: Readonly<Nhm2SemiclassicalV2PairRootLeaseV1>;
  implementationLineage: Readonly<Nhm2SemiclassicalV2PairImplementationLineageV1>;
  absoluteRoots: Readonly<{
    scientific: string;
    implementation: string;
    output: string;
  }>;
  observeEmptyOutputPrestate: () => Promise<
    Readonly<Nhm2SemiclassicalV2PairEmptyOutputPrestateV1>
  >;
  establishOsIsolation: () => Promise<
    Readonly<Nhm2SemiclassicalV2PairOsIsolationAttestationV1>
  >;
  executeAfterPersistedLaunchSeal: (input: Readonly<{
    launchSealSha256: string;
    scientificPresealReceiptSha256: string;
  }>) => Promise<Nhm2SemiclassicalV2PairLaneExecutionObservationV1>;
  revokeWritersAndFreezeOutput: (input: Readonly<{
    runId: string;
  }>) => Promise<Nhm2SemiclassicalV2PairFrozenLaneSnapshotV1>;
}>;

export type Nhm2SemiclassicalV2PairResolvedEnrollmentV1 = Readonly<{
  opaquePairEnrollmentId: string;
  pairId: string;
  pairAgreementId: string;
  launchSealId: string;
  candidate: Readonly<{
    candidateId: string;
    candidateManifestId: string;
    candidateFrozenAt: string;
  }>;
  scientificPreseal: Readonly<{
    receiptId: string;
    artifactId: string;
    receipt: Readonly<Nhm2SemiclassicalV2ScientificPresealServerReceiptV1>;
    artifactBinding: Readonly<Nhm2SemiclassicalV2PairScientificPresealPersistedArtifactBindingV1>;
    parsedArtifact: Readonly<Nhm2SemiclassicalV2ScientificPresealV1>;
  }>;
  lanes: readonly [
    Nhm2SemiclassicalV2PairLaneExecutionCapabilityV1,
    Nhm2SemiclassicalV2PairLaneExecutionCapabilityV1,
  ];
  /**
   * The persistence provider chooses the observed timestamp, asks the
   * coordinator to bind it into the hash, then exclusively persists and
   * rereads the exact object before resolving.
   */
  persistLaunchSeal: (
    build: (persistedAt: string) => Readonly<Nhm2SemiclassicalV2PairLaunchSealV1>,
  ) => Promise<
    Nhm2SemiclassicalV2PairPersistedReadbackV1<Nhm2SemiclassicalV2PairLaunchSealV1> &
      Readonly<{
        serverReceipt: Readonly<Nhm2SemiclassicalV2PairLaunchSealServerReceiptV1>;
      }>
  >;
  persistPairAgreementReceipt: (
    receipt: Readonly<Nhm2SemiclassicalV2PairAgreementReceiptV1>,
  ) => Promise<
    Nhm2SemiclassicalV2PairPersistedReadbackV1<Nhm2SemiclassicalV2PairAgreementReceiptV1>
  >;
  /** A trusted server clock, not a producer timestamp. */
  now: () => Date;
}>;

export type Nhm2SemiclassicalV2PairCatalogResolutionV1 =
  | Readonly<{
      status: "resolved";
      enrollment: Readonly<Nhm2SemiclassicalV2PairResolvedEnrollmentV1>;
    }>
  | Readonly<{
      status: "blocked";
      blocker: Nhm2SemiclassicalV2PairExecutionCatalogBlocker;
      detail: string;
    }>;

export interface Nhm2SemiclassicalV2PairExecutionCatalogResolverV1 {
  readonly contractVersion: typeof NHM2_SEMICLASSICAL_V2_PAIR_EXECUTION_CATALOG_CONTRACT_VERSION;
  resolve(
    request: Nhm2SemiclassicalV2PairCatalogResolveRequestV1,
  ): Promise<Nhm2SemiclassicalV2PairCatalogResolutionV1>;
}

type CatalogRegistration = Readonly<{
  request: Nhm2SemiclassicalV2PairCatalogResolveRequestV1;
  enrollment: Readonly<Nhm2SemiclassicalV2PairResolvedEnrollmentV1>;
}>;

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._@-]{0,511}$/;
const REQUEST_KEYS = [
  "opaquePairEnrollmentId",
  "scientificPresealReceiptId",
  "scientificPresealArtifactId",
] as const;
const trustedCatalogScopes = new WeakMap<
  Nhm2SemiclassicalV2PairExecutionCatalogResolverV1,
  Nhm2SemiclassicalV2PairCatalogAuthorityScope
>();
/** Never exported or stored on a catalog instance. */
const SERVER_CATALOG_CONSTRUCTION_CAPABILITY = Symbol(
  "nhm2-semiclassical-v2-server-catalog-construction-capability",
);

const requestKey = (
  request: Nhm2SemiclassicalV2PairCatalogResolveRequestV1,
): string =>
  `${request.opaquePairEnrollmentId}\n${request.scientificPresealReceiptId}\n${request.scientificPresealArtifactId}`;

const snapshotCatalogRequest = (
  request: unknown,
): Nhm2SemiclassicalV2PairCatalogResolveRequestV1 | null => {
  if (
    request == null ||
    typeof request !== "object" ||
    Array.isArray(request) ||
    Object.getPrototypeOf(request) !== Object.prototype
  ) {
    return null;
  }
  const ownKeys = Reflect.ownKeys(request);
  if (
    ownKeys.length !== REQUEST_KEYS.length ||
    ownKeys.some(
      (key) =>
        typeof key !== "string" ||
        !(REQUEST_KEYS as readonly string[]).includes(key),
    )
  ) {
    return null;
  }
  const descriptors = Object.getOwnPropertyDescriptors(request);
  const values: Record<string, string> = {};
  for (const key of REQUEST_KEYS) {
    const descriptor = descriptors[key];
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      typeof descriptor.value !== "string" ||
      !IDENTIFIER.test(descriptor.value)
    ) {
      return null;
    }
    values[key] = descriptor.value;
  }
  return Object.freeze({
    opaquePairEnrollmentId: values.opaquePairEnrollmentId,
    scientificPresealReceiptId: values.scientificPresealReceiptId,
    scientificPresealArtifactId: values.scientificPresealArtifactId,
  });
};

const freezeCapabilityTree = <T>(
  value: T,
  seen = new WeakSet<object>(),
): T => {
  if (
    value == null ||
    (typeof value !== "object" && typeof value !== "function")
  ) {
    return value;
  }
  const object = value as object;
  if (seen.has(object)) return value;
  seen.add(object);
  for (const child of Object.values(value as Record<string, unknown>)) {
    freezeCapabilityTree(child, seen);
  }
  return Object.isFrozen(value) ? value : Object.freeze(value);
};

class ServerOwnedPairExecutionCatalog
  implements Nhm2SemiclassicalV2PairExecutionCatalogResolverV1
{
  readonly contractVersion =
    NHM2_SEMICLASSICAL_V2_PAIR_EXECUTION_CATALOG_CONTRACT_VERSION;
  readonly #registrations: ReadonlyMap<string, CatalogRegistration>;
  readonly resolve: Nhm2SemiclassicalV2PairExecutionCatalogResolverV1["resolve"];

  constructor(
    constructionCapability: symbol,
    scope: Nhm2SemiclassicalV2PairCatalogAuthorityScope,
    registrations: readonly CatalogRegistration[],
  ) {
    if (constructionCapability !== SERVER_CATALOG_CONSTRUCTION_CAPABILITY) {
      throw new TypeError(
        "nhm2_pair_catalog_construction_capability_required",
      );
    }
    this.#registrations = new Map(
      registrations.map((registration) => {
        const request = snapshotCatalogRequest(registration.request);
        if (request == null) {
          throw new TypeError("nhm2_pair_catalog_registration_request_invalid");
        }
        return [
          requestKey(request),
          Object.freeze({
            request,
            enrollment: freezeCapabilityTree(registration.enrollment),
          }),
        ];
      }),
    );
    // Own frozen closure: a consumer cannot replace a shared prototype method
    // while retaining this object's WeakMap authority identity.
    this.resolve = async (
      request: Nhm2SemiclassicalV2PairCatalogResolveRequestV1,
    ): Promise<Nhm2SemiclassicalV2PairCatalogResolutionV1> => {
      const requestSnapshot = snapshotCatalogRequest(request);
      if (requestSnapshot == null) {
        return Object.freeze({
          status: "blocked" as const,
          blocker: "pair_enrollment_id_invalid" as const,
          detail:
            "The pair enrollment and preseal references must be opaque identifiers.",
        });
      }
      const registration = this.#registrations.get(requestKey(requestSnapshot));
      if (registration == null) {
        return Object.freeze({
          status: "blocked" as const,
          blocker: "trusted_pair_enrollment_not_registered" as const,
          detail:
            "No server-installed OS-isolated pair capability is registered for these opaque references.",
        });
      }
      // Functions stay catalog-owned and the complete capability tree was
      // frozen at installation. Do not clone capabilities here.
      return Object.freeze({
        status: "resolved" as const,
        enrollment: registration.enrollment,
      });
    };
    trustedCatalogScopes.set(this, scope);
    Object.freeze(this);
  }
}

/**
 * Production deliberately starts empty. Installing an audited OS backend is a
 * code-owned server wiring operation; there is no public registration method
 * and no environment/HTTP path that can smuggle roots or commands into it.
 */
const defaultProductionCatalog = new ServerOwnedPairExecutionCatalog(
  SERVER_CATALOG_CONSTRUCTION_CAPABILITY,
  "production_server_installed",
  [],
);

export const getDefaultNhm2SemiclassicalV2PairExecutionCatalog =
  (): Nhm2SemiclassicalV2PairExecutionCatalogResolverV1 =>
    defaultProductionCatalog;

export const getNhm2SemiclassicalV2PairCatalogAuthorityScope = (
  catalog: Nhm2SemiclassicalV2PairExecutionCatalogResolverV1,
): Nhm2SemiclassicalV2PairCatalogAuthorityScope | null =>
  trustedCatalogScopes.get(catalog) ?? null;

/**
 * Explicit test-only catalog. It can exercise ordering and failure handling,
 * but the coordinator labels every result non-authoritative and will never
 * publish its preview as a pair-agreement artifact.
 */
export const createTestOnlyNhm2SemiclassicalV2PairExecutionCatalog = (
  registrations: readonly CatalogRegistration[],
): Nhm2SemiclassicalV2PairExecutionCatalogResolverV1 =>
  new ServerOwnedPairExecutionCatalog(
    SERVER_CATALOG_CONSTRUCTION_CAPABILITY,
    "test_fixture_non_authoritative",
    registrations,
  );

/** Type-only helper for test fixtures; it confers no production authority. */
export type Nhm2SemiclassicalV2PairTestCatalogRegistrationV1 =
  CatalogRegistration;
