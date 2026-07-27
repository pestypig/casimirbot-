import crypto from "node:crypto";
import {
  HELIX_ENVIRONMENT_ADAPTER_PROFILE_SCHEMA,
  HELIX_MINECRAFT_ADAPTER_PROFILE_ID,
  HELIX_SYNTHETIC_GAME_ADAPTER_PROFILE_ID,
  helixEnvironmentAdapterProfileSchema,
  type HelixEnvironmentAdapterProfile,
  type HelixEnvironmentAdapterRegistryRecord,
} from "@shared/helix-environment-adapter-profile";
import {
  HELIX_ENVIRONMENT_SOURCE_HEARTBEAT_SCHEMA,
  HELIX_ENVIRONMENT_SOURCE_MANIFEST_SCHEMA,
  type HelixEnvironmentSourceManifest,
} from "@shared/helix-environment-source-manifest";
import { HELIX_ENVIRONMENT_PROBE_RESULT_SCHEMA } from "@shared/helix-environment-probe";
import { HELIX_ENVIRONMENT_STATE_SNAPSHOT_SCHEMA } from "@shared/helix-environment-state-snapshot";

export type EnvironmentAdapterRegistryErrorCode =
  | "environment_adapter_unknown"
  | "environment_adapter_disabled"
  | "environment_adapter_identity_mismatch"
  | "environment_adapter_protocol_unsupported"
  | "environment_adapter_manifest_incompatible"
  | "environment_adapter_contract_changed";

export class EnvironmentAdapterRegistryError extends Error {
  constructor(
    readonly code: EnvironmentAdapterRegistryErrorCode,
    message: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "EnvironmentAdapterRegistryError";
  }
}

export const isEnvironmentAdapterRegistryError = (
  error: unknown,
): error is EnvironmentAdapterRegistryError =>
  error instanceof EnvironmentAdapterRegistryError;

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left]: [string, unknown], [right]: [string, unknown]) =>
        left.localeCompare(right),
      )
      .map(([key, item]: [string, unknown]) => [key, canonicalize(item)]),
  );
};

export const environmentAdapterContractHash = (
  profile: HelixEnvironmentAdapterProfile,
): `sha256:${string}` =>
  `sha256:${crypto
    .createHash("sha256")
    .update(JSON.stringify(canonicalize(profile)), "utf8")
    .digest("hex")}`;

export const environmentAdapterManifestHash = (
  manifest: HelixEnvironmentSourceManifest,
): `sha256:${string}` =>
  `sha256:${crypto
    .createHash("sha256")
    .update(JSON.stringify(canonicalize(manifest)), "utf8")
    .digest("hex")}`;

const minecraftProfile = helixEnvironmentAdapterProfileSchema.parse({
  schema: HELIX_ENVIRONMENT_ADAPTER_PROFILE_SCHEMA,
  profile_id: HELIX_MINECRAFT_ADAPTER_PROFILE_ID,
  profile_version: 1,
  domain: "minecraft",
  source_family: "minecraft",
  accepted_domain_adapters: [
    "minecraft.paper_plugin.v1",
    "minecraft.minehut.v1",
    "minecraft.adapter.v1",
    "minecraft",
  ],
  world_id_prefixes: ["minecraft:"],
  protocol_versions: [
    "helix.environment.v1",
    HELIX_ENVIRONMENT_SOURCE_MANIFEST_SCHEMA,
  ],
  required_modalities: ["environment_state"],
  required_snapshot_sections: ["actor_state", "inventory_state"],
  allowed_probe_types: [
    "route_feasibility",
    "reachability",
    "line_of_sight",
    "container_freshness",
    "crop_state",
    "hazard_check",
    "inventory_check",
    "local_map_summary",
  ],
  required_probe_types: [
    "route_feasibility",
    "reachability",
    "inventory_check",
  ],
  observation_schemas: {
    world_event: "helix.world_event.v1",
    environment_snapshot: HELIX_ENVIRONMENT_STATE_SNAPSHOT_SCHEMA,
    manifest: HELIX_ENVIRONMENT_SOURCE_MANIFEST_SCHEMA,
    heartbeat: HELIX_ENVIRONMENT_SOURCE_HEARTBEAT_SCHEMA,
    probe_result: HELIX_ENVIRONMENT_PROBE_RESULT_SCHEMA,
    normalized_evidence: "helix.bound_room_evidence.observation.v1",
  },
  freshness: {
    heartbeat_max_age_ms: 30_000,
    ingress_request_max_age_ms: 120_000,
    observation_max_age_ms: 120_000,
  },
  payload_policy: {
    max_manifest_bytes: 64_000,
    max_event_batch_bytes: 512_000,
    max_snapshot_bytes: 64_000,
    raw_payload_included: false,
  },
  mechanics_collections: [
    {
      collection_id: "mechanics.minecraft.java.v1",
      collection_version: 1,
      game_id: "minecraft.java",
      game_versions: ["minecraft.java:1.20-1.21"],
      adapter_ids: [
        "minecraft.paper_plugin.v1",
        "minecraft.minehut.v1",
        "minecraft.adapter.v1",
        "minecraft",
      ],
      retrieval_namespace: "mechanics:minecraft:java",
      document_paths: ["docs/game-mechanics/minecraft-java-v1.md"],
    },
  ],
  normalizer: {
    normalizer_id: "helix.minecraft.world_event_normalizer.v1",
    output_schema: "helix.bound_room_evidence.observation.v1",
    server_owned: true,
    producer_code_loaded: false,
  },
  execution_policy: {
    may_execute_live_actions: false,
    may_perform_read_only_probes: true,
    action_credential_reused: false,
  },
  lifecycle: {
    status: "enabled",
    replacement_profile_id: null,
  },
  assistant_answer: false,
  raw_content_included: false,
}) as HelixEnvironmentAdapterProfile;

const syntheticGameFixtureProfile = helixEnvironmentAdapterProfileSchema.parse({
  schema: HELIX_ENVIRONMENT_ADAPTER_PROFILE_SCHEMA,
  profile_id: HELIX_SYNTHETIC_GAME_ADAPTER_PROFILE_ID,
  profile_version: 1,
  domain: "game",
  source_family: "synthetic_game",
  accepted_domain_adapters: ["synthetic_game.fixture.v1"],
  world_id_prefixes: ["synthetic-game:"],
  protocol_versions: ["helix.environment.v1"],
  required_modalities: ["environment_state"],
  required_snapshot_sections: ["actor_state"],
  allowed_probe_types: ["reachability", "hazard_check"],
  required_probe_types: ["reachability"],
  observation_schemas: {
    world_event: "helix.world_event.v1",
    environment_snapshot: HELIX_ENVIRONMENT_STATE_SNAPSHOT_SCHEMA,
    manifest: HELIX_ENVIRONMENT_SOURCE_MANIFEST_SCHEMA,
    heartbeat: HELIX_ENVIRONMENT_SOURCE_HEARTBEAT_SCHEMA,
    probe_result: HELIX_ENVIRONMENT_PROBE_RESULT_SCHEMA,
    normalized_evidence: "helix.bound_room_evidence.observation.v1",
  },
  freshness: {
    heartbeat_max_age_ms: 15_000,
    ingress_request_max_age_ms: 60_000,
    observation_max_age_ms: 60_000,
  },
  payload_policy: {
    max_manifest_bytes: 32_000,
    max_event_batch_bytes: 128_000,
    max_snapshot_bytes: 32_000,
    raw_payload_included: false,
  },
  mechanics_collections: [
    {
      collection_id: "mechanics.synthetic_game.fixture.v1",
      collection_version: 1,
      game_id: "synthetic_game.fixture",
      game_versions: ["synthetic_game.fixture:1"],
      adapter_ids: ["synthetic_game.fixture.v1"],
      retrieval_namespace: "mechanics:synthetic-game:fixture",
      document_paths: ["docs/game-mechanics/synthetic-game-fixture-v1.md"],
    },
  ],
  normalizer: {
    normalizer_id: "helix.generic.world_event_normalizer.v1",
    output_schema: "helix.bound_room_evidence.observation.v1",
    server_owned: true,
    producer_code_loaded: false,
  },
  execution_policy: {
    may_execute_live_actions: false,
    may_perform_read_only_probes: true,
    action_credential_reused: false,
  },
  lifecycle: {
    status: "fixture_only",
    replacement_profile_id: null,
  },
  assistant_answer: false,
  raw_content_included: false,
}) as HelixEnvironmentAdapterProfile;

const records: HelixEnvironmentAdapterRegistryRecord[] = [
  minecraftProfile,
  syntheticGameFixtureProfile,
].map(
  (
    profile: HelixEnvironmentAdapterProfile,
  ): HelixEnvironmentAdapterRegistryRecord => ({
    profile,
    contract_hash: environmentAdapterContractHash(profile),
  }),
);

const recordByAdapterId = new Map<
  string,
  HelixEnvironmentAdapterRegistryRecord
>();
const recordByProfileId = new Map<
  string,
  HelixEnvironmentAdapterRegistryRecord
>();

for (const record of records) {
  if (recordByProfileId.has(record.profile.profile_id)) {
    throw new Error(
      `Duplicate environment adapter profile ${record.profile.profile_id}.`,
    );
  }
  recordByProfileId.set(record.profile.profile_id, record);
  for (const adapterId of record.profile.accepted_domain_adapters) {
    if (recordByAdapterId.has(adapterId)) {
      throw new Error(`Duplicate environment adapter identity ${adapterId}.`);
    }
    recordByAdapterId.set(adapterId, record);
  }
}

const fixtureProfilesEnabled = (): boolean =>
  process.env.HELIX_ENVIRONMENT_ADAPTER_FIXTURES === "1" &&
  process.env.NODE_ENV !== "production";

const profileUsable = (
  profile: HelixEnvironmentAdapterProfile,
  includeFixtureProfiles: boolean,
): boolean =>
  profile.lifecycle.status === "enabled" ||
  profile.lifecycle.status === "deprecated" ||
  (profile.lifecycle.status === "fixture_only" && includeFixtureProfiles);

export const listEnvironmentAdapterProfiles = (
  options: {
    includeFixtureProfiles?: boolean;
    includeDisabled?: boolean;
  } = {},
): HelixEnvironmentAdapterRegistryRecord[] => {
  const includeFixtureProfiles =
    options.includeFixtureProfiles ?? fixtureProfilesEnabled();
  return records
    .filter(
      ({ profile }: HelixEnvironmentAdapterRegistryRecord) =>
        (options.includeDisabled || profile.lifecycle.status !== "disabled") &&
        (profile.lifecycle.status !== "fixture_only" || includeFixtureProfiles),
    )
    .map((record: HelixEnvironmentAdapterRegistryRecord) => ({
      profile: structuredClone(record.profile),
      contract_hash: record.contract_hash,
    }));
};

export const readEnvironmentAdapterProfileById = (
  profileId: string,
  options: { includeFixtureProfiles?: boolean } = {},
): HelixEnvironmentAdapterRegistryRecord | null => {
  const record = recordByProfileId.get(profileId.trim()) ?? null;
  if (!record) return null;
  const includeFixtureProfiles =
    options.includeFixtureProfiles ?? fixtureProfilesEnabled();
  if (!profileUsable(record.profile, includeFixtureProfiles)) return null;
  return {
    profile: structuredClone(record.profile),
    contract_hash: record.contract_hash,
  };
};

export const resolveEnvironmentAdapterProfile = (input: {
  domainAdapter: string;
  worldId: string;
  includeFixtureProfiles?: boolean;
}): HelixEnvironmentAdapterRegistryRecord => {
  const domainAdapter = input.domainAdapter.trim();
  const worldId = input.worldId.trim();
  const record = recordByAdapterId.get(domainAdapter);
  if (!record) {
    throw new EnvironmentAdapterRegistryError(
      "environment_adapter_unknown",
      `Environment adapter ${domainAdapter || "(missing)"} is not registered.`,
      { domain_adapter: domainAdapter || null },
    );
  }
  const includeFixtureProfiles =
    input.includeFixtureProfiles ?? fixtureProfilesEnabled();
  if (!profileUsable(record.profile, includeFixtureProfiles)) {
    throw new EnvironmentAdapterRegistryError(
      "environment_adapter_disabled",
      `Environment adapter ${domainAdapter} is not enabled for this deployment.`,
      {
        domain_adapter: domainAdapter,
        adapter_profile_id: record.profile.profile_id,
        lifecycle_status: record.profile.lifecycle.status,
      },
    );
  }
  if (
    !record.profile.world_id_prefixes.some((prefix: string) =>
      worldId.startsWith(prefix),
    )
  ) {
    throw new EnvironmentAdapterRegistryError(
      "environment_adapter_identity_mismatch",
      `World identity ${worldId || "(missing)"} is incompatible with ${domainAdapter}.`,
      {
        domain_adapter: domainAdapter,
        world_id: worldId || null,
        adapter_profile_id: record.profile.profile_id,
      },
    );
  }
  return {
    profile: structuredClone(record.profile),
    contract_hash: record.contract_hash,
  };
};

export type EnvironmentAdapterManifestValidation = {
  ok: boolean;
  issues: Array<{
    code: EnvironmentAdapterRegistryErrorCode;
    message: string;
  }>;
  record: HelixEnvironmentAdapterRegistryRecord;
  manifest_hash: `sha256:${string}`;
};

export const validateEnvironmentAdapterManifest = (input: {
  manifest: HelixEnvironmentSourceManifest;
  worldId: string;
  expectedContractHash?: string | null;
  includeFixtureProfiles?: boolean;
}): EnvironmentAdapterManifestValidation => {
  const record = resolveEnvironmentAdapterProfile({
    domainAdapter: input.manifest.domain_adapter,
    worldId: input.worldId,
    includeFixtureProfiles: input.includeFixtureProfiles,
  });
  const issues: EnvironmentAdapterManifestValidation["issues"] = [];
  const issue = (
    code: EnvironmentAdapterRegistryErrorCode,
    message: string,
  ): void => {
    issues.push({ code, message });
  };
  if (
    input.expectedContractHash &&
    input.expectedContractHash !== record.contract_hash
  ) {
    issue(
      "environment_adapter_contract_changed",
      "The durable adapter contract hash no longer matches the active registry profile.",
    );
  }
  if (input.manifest.domain !== record.profile.domain) {
    issue(
      "environment_adapter_identity_mismatch",
      `Manifest domain ${input.manifest.domain} does not match registered domain ${record.profile.domain}.`,
    );
  }
  if (
    !record.profile.protocol_versions.includes(input.manifest.protocol_version)
  ) {
    issue(
      "environment_adapter_protocol_unsupported",
      `Protocol ${input.manifest.protocol_version} is not admitted by ${record.profile.profile_id}.`,
    );
  }
  for (const modality of record.profile.required_modalities) {
    if (!input.manifest.modalities.includes(modality)) {
      issue(
        "environment_adapter_manifest_incompatible",
        `Manifest is missing required modality ${modality}.`,
      );
    }
  }
  for (const section of record.profile.required_snapshot_sections) {
    if (!input.manifest.supported_snapshot_sections.includes(section)) {
      issue(
        "environment_adapter_manifest_incompatible",
        `Manifest is missing required snapshot section ${section}.`,
      );
    }
  }
  for (const probeType of record.profile.required_probe_types) {
    if (!input.manifest.supported_probe_types.includes(probeType)) {
      issue(
        "environment_adapter_manifest_incompatible",
        `Manifest is missing required probe ${probeType}.`,
      );
    }
  }
  for (const probeType of input.manifest.supported_probe_types) {
    if (!record.profile.allowed_probe_types.includes(probeType)) {
      issue(
        "environment_adapter_manifest_incompatible",
        `Manifest advertises unadmitted probe ${probeType}.`,
      );
    }
  }
  if (
    input.manifest.execution_policy.may_execute_live_actions !== false ||
    input.manifest.execution_policy.may_perform_read_only_probes !== true ||
    input.manifest.auth_policy.bearer_required !== true
  ) {
    issue(
      "environment_adapter_manifest_incompatible",
      "Manifest execution or authentication policy exceeds the read-only adapter profile.",
    );
  }
  if (
    input.manifest.snapshot_policy.max_payload_bytes >
    record.profile.payload_policy.max_snapshot_bytes
  ) {
    issue(
      "environment_adapter_manifest_incompatible",
      "Manifest snapshot payload ceiling exceeds the registered adapter profile.",
    );
  }
  return {
    ok: issues.length === 0,
    issues,
    record,
    manifest_hash: environmentAdapterManifestHash(input.manifest),
  };
};

export const assertEnvironmentAdapterManifest = (input: {
  manifest: HelixEnvironmentSourceManifest;
  worldId: string;
  expectedContractHash?: string | null;
  includeFixtureProfiles?: boolean;
}): EnvironmentAdapterManifestValidation => {
  const validation = validateEnvironmentAdapterManifest(input);
  const first = validation.issues[0];
  if (first) {
    throw new EnvironmentAdapterRegistryError(first.code, first.message, {
      issues: validation.issues,
      adapter_profile_id: validation.record.profile.profile_id,
      adapter_contract_hash: validation.record.contract_hash,
    });
  }
  return validation;
};
