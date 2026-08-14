import { NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING } from "../../../shared/contracts/nhm2-spherical-boson-star-v2-preexecution-profile.v2";
import { NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING } from "../../../shared/contracts/nhm2-spherical-boson-star-v2-run-artifact-wire.v2";
import { NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BINDING } from "../../../shared/contracts/nhm2-spherical-boson-star-v2-scientific-preseal-envelope.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_REQUIRED_DEPENDENCY_BINDINGS,
} from "../../../shared/contracts/nhm2-spherical-boson-star-v2-scientific-preseal-persistence-receipt.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_REQUIRED_DEPENDENCY_BINDINGS,
} from "../../../shared/contracts/nhm2-spherical-boson-star-v2-execution-preseal-wire.v1";

type CanonicalStageId =
  "A" | "S" | "SR" | "P" | "PR" | "F" | "FR" | "O" | "OR" | "E" | "ER";

type EnrollmentInputBlocker =
  | "enrollment_id_primitive_string_required"
  | "enrollment_id_empty"
  | "enrollment_id_code_unit_limit_exceeded"
  | "enrollment_id_utf8_limit_exceeded"
  | "enrollment_id_not_canonical";

type PreexecutionProviderBlocker =
  | "current_platform_not_linux"
  | "server_private_enrollment_allocator_not_installed"
  | "exact_12_role_static_input_instance_absent"
  | "scientific_preseal_p_allocation_absent"
  | "runtime_control_artifact_allocation_absent"
  | "paired_output_root_allocation_absent"
  | "linux_native_observation_provider_not_installed"
  | "openat2_beneath_observer_not_installed"
  | "statx_identity_observer_not_installed"
  | "clock_monotonic_raw_observer_not_installed"
  | "directory_fsync_observer_not_installed"
  | "runtime_loader_observer_not_installed"
  | "syscall_trace_observer_not_installed"
  | "launch_envelope_provider_not_installed"
  | "remaining_mean_noise_constraint_science_instances_absent"
  | "exact_68_file_atomic_publisher_not_installed"
  | "execution_not_authorized";

type PreexecutionBlocker = EnrollmentInputBlocker | PreexecutionProviderBlocker;

type CapabilityBlocker =
  | "server_minted_preexecution_capability_required"
  | "preexecution_capability_already_consumed"
  | "server_private_preexecution_provider_not_installed";

type ServerCapabilityState = {
  consumed: boolean;
};

const SERVER_CAPABILITY_STATES = new WeakMap<object, ServerCapabilityState>();

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value === null || typeof value !== "object" || Object.isFrozen(value))
    return value as Readonly<T>;
  for (const child of Object.values(value as Record<string, unknown>))
    deepFreeze(child);
  return Object.freeze(value);
};

const EXPECTED_SEALS = deepFreeze({
  A: {
    sha256: "dce4c293d09224e4b7d79bd8b04b46542875f0306eecee84c35bb4c10bf68cb8",
    canonicalSizeBytes: 11_663,
  },
  S: {
    sha256: "d681751c9f0cec9e10336f98bb4c6a2657411bc74d612313660692363202971d",
    canonicalSizeBytes: 11_117,
  },
  P: {
    sha256: "b832aefb663b08cc9982d7ffb6ee0d21eea4a3453aa4aec6c22ab3cd6d2ccbca",
    canonicalSizeBytes: 10_551,
  },
  PR: {
    sha256: "4c4112703dc13778d7053287fa03f0a22fb532ea09c9dad5b0b7046757140605",
    canonicalSizeBytes: 8_306,
  },
  E: {
    sha256: "b9ef8ec056ce931e23aca660ab978f7861a2222d6658772e52e6cdca66a57987",
    canonicalSizeBytes: 13_524,
  },
} as const);

const CURRENT_PLATFORM = process.platform;

const PROVIDER_BLOCKER_ORDER = Object.freeze([
  "server_private_enrollment_allocator_not_installed",
  "exact_12_role_static_input_instance_absent",
  "scientific_preseal_p_allocation_absent",
  "runtime_control_artifact_allocation_absent",
  "paired_output_root_allocation_absent",
  "linux_native_observation_provider_not_installed",
  "openat2_beneath_observer_not_installed",
  "statx_identity_observer_not_installed",
  "clock_monotonic_raw_observer_not_installed",
  "directory_fsync_observer_not_installed",
  "runtime_loader_observer_not_installed",
  "syscall_trace_observer_not_installed",
  "launch_envelope_provider_not_installed",
  "remaining_mean_noise_constraint_science_instances_absent",
  "exact_68_file_atomic_publisher_not_installed",
  "execution_not_authorized",
] as const satisfies readonly PreexecutionProviderBlocker[]);

const PUBLIC_BLOCKERS = Object.freeze(
  CURRENT_PLATFORM === "linux"
    ? [...PROVIDER_BLOCKER_ORDER]
    : (["current_platform_not_linux", ...PROVIDER_BLOCKER_ORDER] as const),
) satisfies readonly PreexecutionProviderBlocker[];

const CANONICAL_CHRONOLOGY = Object.freeze([
  "A_pre_preseal_static_closure",
  "S_preexecution_skeleton",
  "SR_skeleton_persistence_receipt",
  "P_scientific_preseal",
  "PR_scientific_preseal_persistence_receipt",
  "F_execution_freshness_evidence_bundle",
  "FR_execution_freshness_receipt",
  "O_output_root_absence_inventory",
  "OR_output_root_absence_receipt",
  "E_diagnostic_execution_preseal",
  "ER_execution_preseal_persistence_receipt",
] as const);

const STAGES = deepFreeze([
  { id: "A", instance: null, executed: false },
  { id: "S", instance: null, executed: false },
  { id: "SR", instance: null, executed: false },
  { id: "P", instance: null, executed: false },
  { id: "PR", instance: null, executed: false },
  { id: "F", instance: null, executed: false },
  { id: "FR", instance: null, executed: false },
  { id: "O", instance: null, executed: false },
  { id: "OR", instance: null, executed: false },
  { id: "E", instance: null, executed: false },
  { id: "ER", instance: null, executed: false },
] as const satisfies readonly Readonly<{
  id: CanonicalStageId;
  instance: null;
  executed: false;
}>[]);

const PROVIDER_REQUIREMENTS = deepFreeze(
  [
    "server_private_enrollment_allocator",
    "exact_12_role_static_input_allocator",
    "scientific_preseal_p_allocator",
    "runtime_control_artifact_allocator",
    "paired_output_root_allocator",
    "linux_native_observation_provider",
    "openat2_beneath_observer",
    "statx_identity_observer",
    "clock_monotonic_raw_observer",
    "directory_fsync_observer",
    "runtime_loader_observer",
    "syscall_trace_observer",
    "launch_envelope_provider",
    "exact_68_file_atomic_publisher",
  ].map((providerId) => ({
    providerId,
    required: true as const,
    installed: false as const,
    instance: null,
    callerInstallationAllowed: false as const,
    executionPerformed: false as const,
  })),
);

const assertContractPins = (): void => {
  if (
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING.sha256 !==
      EXPECTED_SEALS.A.sha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING.canonicalSizeBytes !==
      EXPECTED_SEALS.A.canonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING.sha256 !==
      EXPECTED_SEALS.S.sha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING.canonicalSizeBytes !==
      EXPECTED_SEALS.S.canonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BINDING.sha256 !==
      EXPECTED_SEALS.P.sha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BINDING.canonicalSizeBytes !==
      EXPECTED_SEALS.P.canonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_BINDING.sha256 !==
      EXPECTED_SEALS.PR.sha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_BINDING.canonicalSizeBytes !==
      EXPECTED_SEALS.PR.canonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_BINDING.sha256 !==
      EXPECTED_SEALS.E.sha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_BINDING.canonicalSizeBytes !==
      EXPECTED_SEALS.E.canonicalSizeBytes
  )
    throw new Error("spherical_v2_preexecution_evidence_contract_seal_drift");

  const pr =
    NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_REQUIRED_DEPENDENCY_BINDINGS;
  const e =
    NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_REQUIRED_DEPENDENCY_BINDINGS;
  if (
    pr.preexecutionProfileV2.sha256 !== EXPECTED_SEALS.A.sha256 ||
    pr.preexecutionProfileV2.canonicalSizeBytes !==
      EXPECTED_SEALS.A.canonicalSizeBytes ||
    pr.runArtifactWireV2.sha256 !== EXPECTED_SEALS.S.sha256 ||
    pr.runArtifactWireV2.canonicalSizeBytes !==
      EXPECTED_SEALS.S.canonicalSizeBytes ||
    pr.scientificPresealEnvelopeV1.sha256 !== EXPECTED_SEALS.P.sha256 ||
    pr.scientificPresealEnvelopeV1.canonicalSizeBytes !==
      EXPECTED_SEALS.P.canonicalSizeBytes ||
    e.preexecutionProfileV2.sha256 !== EXPECTED_SEALS.A.sha256 ||
    e.preexecutionProfileV2.canonicalSizeBytes !==
      EXPECTED_SEALS.A.canonicalSizeBytes ||
    e.runArtifactWireV2.sha256 !== EXPECTED_SEALS.S.sha256 ||
    e.runArtifactWireV2.canonicalSizeBytes !==
      EXPECTED_SEALS.S.canonicalSizeBytes ||
    e.scientificPresealEnvelopeV1.sha256 !== EXPECTED_SEALS.P.sha256 ||
    e.scientificPresealEnvelopeV1.canonicalSizeBytes !==
      EXPECTED_SEALS.P.canonicalSizeBytes ||
    e.scientificPresealPersistenceReceiptV1.sha256 !==
      EXPECTED_SEALS.PR.sha256 ||
    e.scientificPresealPersistenceReceiptV1.canonicalSizeBytes !==
      EXPECTED_SEALS.PR.canonicalSizeBytes
  )
    throw new Error(
      "spherical_v2_preexecution_evidence_required_dependency_drift",
    );
};

assertContractPins();

export const NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_EVIDENCE_BOUNDARY =
  deepFreeze({
    artifactId:
      "nhm2.spherical_boson_star_v2_preexecution_evidence_boundary" as const,
    contractVersion:
      "nhm2_spherical_boson_star_v2_preexecution_evidence_boundary/v1" as const,
    phase:
      "blocked_server_evidence_boundary_without_private_allocator_or_native_provider" as const,
    publicIngress: {
      exactArity: 1,
      field: "enrollmentId",
      primitiveStringOnly: true,
      callerObjectAccepted: false,
      minimumCodeUnits: 1,
      maximumCodeUnits: 128,
      maximumUtf8Bytes: 256,
      canonicalGrammar: "^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$",
      callerPathsAccepted: false,
      callerBytesAccepted: false,
      callerReceiptsAccepted: false,
      callerTimestampsAccepted: false,
      callerStatsAccepted: false,
      callerArgvAccepted: false,
      callerEnvironmentAccepted: false,
      callerOutputsAccepted: false,
      callerProvidersAccepted: false,
    },
    exactContractSeals: EXPECTED_SEALS,
    exactContractBindings: {
      A: NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_PROFILE_V2_BINDING,
      S: NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING,
      P: NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_ENVELOPE_BINDING,
      PR: NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_BINDING,
      E: NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_BINDING,
    },
    exactRequiredDependencyBindings: {
      PR: NHM2_SPHERICAL_BOSON_STAR_V2_SCIENTIFIC_PRESEAL_PERSISTENCE_RECEIPT_REQUIRED_DEPENDENCY_BINDINGS,
      E: NHM2_SPHERICAL_BOSON_STAR_V2_EXECUTION_PRESEAL_WIRE_REQUIRED_DEPENDENCY_BINDINGS,
    },
    dependencyObservation: {
      exactLiteralPinsCheckedAtModuleLoad: true,
      callerDependencyBytesAccepted: false,
      callerDependencyBindingsAccepted: false,
      rawDependencyBytesObserved: false,
    },
    platform: {
      required: "linux" as const,
      current: CURRENT_PLATFORM,
      nativeProviderInstalled: false,
      nativeObservationPerformed: false,
    },
    stateMachine: {
      exactCanonicalChronology: CANONICAL_CHRONOLOGY,
      stages: STAGES,
      chronologyRequirements: {
        ABeforeSFreeze: true,
        SFrozenStrictlyBeforeSRPersisted: true,
        SRPersistedStrictlyBeforePCreated: true,
        PCreatedStrictlyBeforePRPersisted: true,
        PRPersistedLessThanOrEqualToPRObserved: true,
        PRObservedStrictlyBeforeEveryFreshnessWallObservation: true,
        PRObservedStrictlyBeforeEveryAbsenceWallObservation: true,
        latestFreshnessWallStrictlyBeforeFRObserved: true,
        FRObservedStrictlyBeforeECreatedWall: true,
        latestAbsenceWallStrictlyBeforeORObserved: true,
        ORObservedStrictlyBeforeECreatedWall: true,
        ECreatedStrictlyBeforeERPersisted: true,
        ERPersistedLessThanOrEqualToERObserved: true,
        everyFreshnessAndAbsenceMonotonicStrictlyBeforeECreatedMonotonic: true,
        wallTimeComparedToMonotonicTime: false,
        FROrOROrderingRequired: false,
      },
      chronologyObserved: false,
      chronologySatisfied: false,
    },
    plainReceiptAuthentication: {
      SR: false,
      PR: false,
      FR: false,
      OR: false,
      ER: false,
      genericReceiptPromotionAllowed: false,
    },
    capabilityBoundary: {
      storage: "module_private_WeakMap" as const,
      identityAuthenticatedOnly: true,
      oneShotConsumptionRequired: true,
      publicPopulationPathInstalled: false,
      publicProviderInstallationAllowed: false,
      genericReceiptPromotionAllowed: false,
      productionSuccessPathInstalled: false,
    },
    providerRequirements: PROVIDER_REQUIREMENTS,
    publicBlockerOrder: PUBLIC_BLOCKERS,
    instances: {
      enrollmentAllocation: null,
      exact12RoleStaticInputSet: null,
      scientificPresealPAllocation: null,
      runtimeControlArtifactAllocation: null,
      pairedOutputRootAllocation: null,
      nativeObservation: null,
      runtimeLoader: null,
      syscallTrace: null,
      launchEnvelope: null,
      atomicPublisher68File: null,
    },
    outcomes: {
      launchAuthorized: false,
      launchPerformed: false,
      executionAuthorized: false,
      executionPerformed: false,
      replayClosed: false,
      viability: null,
      authority: null,
    },
    lamps: {
      persistence: false,
      nativeObservation: false,
      launch: false,
      execution: false,
      replay: false,
      viability: false,
      authority: false,
    },
  } as const);

export type Nhm2SphericalBosonStarV2PreexecutionEvidenceAssessment = Readonly<{
  artifactId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_EVIDENCE_BOUNDARY.artifactId;
  contractVersion: typeof NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_EVIDENCE_BOUNDARY.contractVersion;
  status: "blocked";
  phase: "preexecution_evidence_not_issued";
  enrollmentIdAccepted: boolean;
  currentPlatform: NodeJS.Platform;
  blockers: readonly PreexecutionBlocker[];
  launchAuthorized: false;
  launchPerformed: false;
  executionAuthorized: false;
  executionPerformed: false;
  replayClosed: false;
  viability: null;
  authority: null;
}>;

const enrollmentIdViolation = (
  value: unknown,
): EnrollmentInputBlocker | null => {
  if (typeof value !== "string")
    return "enrollment_id_primitive_string_required";
  if (value.length === 0) return "enrollment_id_empty";
  if (
    value.length >
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_EVIDENCE_BOUNDARY.publicIngress
      .maximumCodeUnits
  )
    return "enrollment_id_code_unit_limit_exceeded";
  if (
    Buffer.byteLength(value, "utf8") >
    NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_EVIDENCE_BOUNDARY.publicIngress
      .maximumUtf8Bytes
  )
    return "enrollment_id_utf8_limit_exceeded";
  if (
    value.normalize("NFC") !== value ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value)
  )
    return "enrollment_id_not_canonical";
  return null;
};

const blockedAssessment = (
  enrollmentIdAccepted: boolean,
  blockers: readonly PreexecutionBlocker[],
): Nhm2SphericalBosonStarV2PreexecutionEvidenceAssessment =>
  Object.freeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_EVIDENCE_BOUNDARY.artifactId,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_PREEXECUTION_EVIDENCE_BOUNDARY.contractVersion,
    status: "blocked",
    phase: "preexecution_evidence_not_issued",
    enrollmentIdAccepted,
    currentPlatform: CURRENT_PLATFORM,
    blockers,
    launchAuthorized: false,
    launchPerformed: false,
    executionAuthorized: false,
    executionPerformed: false,
    replayClosed: false,
    viability: null,
    authority: null,
  });

export const assessNhm2SphericalBosonStarV2PreexecutionEvidenceRequest = (
  enrollmentId: unknown,
): Nhm2SphericalBosonStarV2PreexecutionEvidenceAssessment => {
  const violation = enrollmentIdViolation(enrollmentId);
  if (violation !== null)
    return blockedAssessment(false, Object.freeze([violation]));
  return blockedAssessment(true, PUBLIC_BLOCKERS);
};

export type Nhm2SphericalBosonStarV2PreexecutionCapabilityConsumption =
  Readonly<{
    status: "blocked";
    capabilityAuthenticated: boolean;
    capabilityConsumed: boolean;
    blocker: CapabilityBlocker;
    launchAuthorized: false;
    executionAuthorized: false;
    authority: null;
  }>;

const blockedCapabilityConsumption = (
  blocker: CapabilityBlocker,
  capabilityAuthenticated = false,
  capabilityConsumed = false,
): Nhm2SphericalBosonStarV2PreexecutionCapabilityConsumption =>
  Object.freeze({
    status: "blocked",
    capabilityAuthenticated,
    capabilityConsumed,
    blocker,
    launchAuthorized: false,
    executionAuthorized: false,
    authority: null,
  });

export const consumeNhm2SphericalBosonStarV2PreexecutionCapability = (
  value: unknown,
): Nhm2SphericalBosonStarV2PreexecutionCapabilityConsumption => {
  if (
    value === null ||
    (typeof value !== "object" && typeof value !== "function")
  )
    return blockedCapabilityConsumption(
      "server_minted_preexecution_capability_required",
    );
  const state = SERVER_CAPABILITY_STATES.get(value);
  if (state === undefined)
    return blockedCapabilityConsumption(
      "server_minted_preexecution_capability_required",
    );
  if (state.consumed)
    return blockedCapabilityConsumption(
      "preexecution_capability_already_consumed",
      true,
    );
  state.consumed = true;
  return blockedCapabilityConsumption(
    "server_private_preexecution_provider_not_installed",
    true,
    true,
  );
};
