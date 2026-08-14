import { z } from "zod";
import type { HelixEnvironmentDomain } from "./helix-environment-state-snapshot";
import type {
  HelixEnvironmentManifestProbeType,
  HelixEnvironmentSnapshotSection,
  HelixEnvironmentSourceModality,
} from "./helix-environment-source-manifest";

export const HELIX_ENVIRONMENT_ADAPTER_PROFILE_SCHEMA =
  "helix.environment_adapter_profile.v1" as const;
export const HELIX_ENVIRONMENT_ADAPTER_ADMISSION_SCHEMA =
  "helix.environment_adapter_admission.v1" as const;

export const HELIX_MINECRAFT_ADAPTER_PROFILE_ID =
  "game.minecraft.readonly.v1" as const;
export const HELIX_SYNTHETIC_GAME_ADAPTER_PROFILE_ID =
  "game.synthetic_fixture.readonly.v1" as const;
export const HELIX_SYSTEM_CLOCK_ADAPTER_PROFILE_ID =
  "system.clock.readonly.v1" as const;

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(256)
  .regex(/^[a-zA-Z0-9:._/-]+$/);
const sha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const environmentDomainSchema = z.enum([
  "minecraft",
  "game",
  "virtual_world",
  "browser_app",
  "desktop_app",
  "robotics",
  "real_world",
  "custom",
]);
const modalitySchema = z.enum([
  "environment_state",
  "environment_affordance",
  "procedure_graph",
  "simulation_stream",
  "visual_frame",
  "audio_transcript",
]);
const snapshotSectionSchema = z.enum([
  "actor_state",
  "inventory_state",
  "object_state",
  "local_map",
  "chunk_snapshot_summary",
  "focus",
  "affordances",
  "domain_specific",
]);
const probeTypeSchema = z.enum([
  "actor_status",
  "nearby_entities",
  "route_feasibility",
  "reachability",
  "line_of_sight",
  "container_freshness",
  "crop_state",
  "hazard_check",
  "inventory_check",
  "local_map_summary",
  "spatial_region",
  "registry_fact",
  "recipe_fact",
]);

export const helixEnvironmentMechanicsCollectionRefSchema = z
  .object({
    collection_id: identifierSchema,
    collection_version: z.number().int().positive(),
    game_id: identifierSchema,
    game_versions: z.array(identifierSchema).min(1).max(64),
    adapter_ids: z.array(identifierSchema).min(1).max(64),
    retrieval_namespace: identifierSchema,
    document_paths: z
      .array(z.string().regex(/^docs\/[a-zA-Z0-9._/-]+\.md$/))
      .min(1)
      .max(64),
  })
  .strict();

export const helixEnvironmentAdapterProfileSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_ADAPTER_PROFILE_SCHEMA),
    profile_id: identifierSchema,
    profile_version: z.number().int().positive(),
    domain: environmentDomainSchema,
    source_family: identifierSchema,
    accepted_domain_adapters: z.array(identifierSchema).min(1).max(64),
    world_id_prefixes: z.array(identifierSchema).min(1).max(64),
    protocol_versions: z.array(identifierSchema).min(1).max(32),
    required_modalities: z.array(modalitySchema).min(1).max(16),
    required_snapshot_sections: z.array(snapshotSectionSchema).min(1).max(32),
    allowed_probe_types: z.array(probeTypeSchema).max(32),
    required_probe_types: z.array(probeTypeSchema).max(32),
    subject_directory: z
      .object({
        supported: z.boolean(),
        subject_kind: identifierSchema.nullable(),
        ui_label_plural: z.string().trim().min(1).max(80).nullable(),
        stable_identity_field: z
          .enum(["stable_actor_id", "actor_id"])
          .nullable(),
        verification_methods: z
          .array(z.enum([
            "self_claim",
            "owner_assigned",
            "connector_challenge",
            "server_auth",
          ]))
          .max(8),
      })
      .strict(),
    observation_schemas: z
      .object({
        world_event: identifierSchema,
        environment_snapshot: identifierSchema,
        manifest: identifierSchema,
        heartbeat: identifierSchema,
        probe_result: identifierSchema,
        normalized_evidence: identifierSchema,
      })
      .strict(),
    freshness: z
      .object({
        heartbeat_max_age_ms: z.number().int().positive(),
        ingress_request_max_age_ms: z.number().int().positive(),
        observation_max_age_ms: z.number().int().positive(),
      })
      .strict(),
    payload_policy: z
      .object({
        max_manifest_bytes: z.number().int().positive(),
        max_event_batch_bytes: z.number().int().positive(),
        max_snapshot_bytes: z.number().int().positive(),
        raw_payload_included: z.literal(false),
      })
      .strict(),
    mechanics_collections: z
      .array(helixEnvironmentMechanicsCollectionRefSchema)
      .max(32),
    normalizer: z
      .object({
        normalizer_id: identifierSchema,
        output_schema: identifierSchema,
        server_owned: z.literal(true),
        producer_code_loaded: z.literal(false),
      })
      .strict(),
    execution_policy: z
      .object({
        may_execute_live_actions: z.literal(false),
        may_perform_read_only_probes: z.literal(true),
        action_credential_reused: z.literal(false),
      })
      .strict(),
    lifecycle: z
      .object({
        status: z.enum(["enabled", "deprecated", "disabled", "fixture_only"]),
        replacement_profile_id: identifierSchema.nullable(),
      })
      .strict(),
    assistant_answer: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict()
  .superRefine((profile, context) => {
    const allowed = new Set(profile.allowed_probe_types);
    for (const required of profile.required_probe_types) {
      if (!allowed.has(required)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["required_probe_types"],
          message: `Required probe ${required} is not admitted by allowed_probe_types.`,
        });
      }
    }
    for (const collection of profile.mechanics_collections) {
      for (const adapterId of collection.adapter_ids) {
        if (!profile.accepted_domain_adapters.includes(adapterId)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["mechanics_collections"],
            message: `Mechanics collection ${collection.collection_id} names unregistered adapter ${adapterId}.`,
          });
        }
      }
    }
    if (
      profile.subject_directory.supported &&
      (!profile.subject_directory.subject_kind ||
        !profile.subject_directory.ui_label_plural ||
        !profile.subject_directory.stable_identity_field ||
        profile.subject_directory.verification_methods.length === 0)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["subject_directory"],
        message:
          "Supported subject directories require a kind, UI label, stable identity field, and verification method.",
      });
    }
    if (
      !profile.subject_directory.supported &&
      (profile.subject_directory.subject_kind !== null ||
        profile.subject_directory.ui_label_plural !== null ||
        profile.subject_directory.stable_identity_field !== null ||
        profile.subject_directory.verification_methods.length > 0)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["subject_directory"],
        message:
          "Unsupported subject directories must not advertise identity semantics.",
      });
    }
  });

export type HelixEnvironmentMechanicsCollectionRef = z.infer<
  typeof helixEnvironmentMechanicsCollectionRefSchema
>;
export type HelixEnvironmentAdapterProfile = z.infer<
  typeof helixEnvironmentAdapterProfileSchema
> & {
  domain: HelixEnvironmentDomain;
  required_modalities: HelixEnvironmentSourceModality[];
  required_snapshot_sections: HelixEnvironmentSnapshotSection[];
  allowed_probe_types: HelixEnvironmentManifestProbeType[];
  required_probe_types: HelixEnvironmentManifestProbeType[];
};

export const helixEnvironmentAdapterAdmissionProjectionSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_ADAPTER_ADMISSION_SCHEMA),
    admission_id: identifierSchema,
    adapter_profile_id: identifierSchema,
    adapter_profile_version: z.number().int().positive(),
    adapter_contract_hash: sha256Schema,
    manifest_id: identifierSchema,
    manifest_hash: sha256Schema,
    producer_epoch_ref: identifierSchema,
    source_family: identifierSchema,
    mechanics_collection_ids: z.array(identifierSchema).max(32),
    admitted_at: z.string().datetime({ offset: true }),
    content_role: z.literal("adapter_admission_not_assistant_answer"),
    reentry_required: z.literal(true),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export type HelixEnvironmentAdapterAdmissionProjection = z.infer<
  typeof helixEnvironmentAdapterAdmissionProjectionSchema
>;

export type HelixEnvironmentAdapterRegistryRecord = {
  profile: HelixEnvironmentAdapterProfile;
  contract_hash: `sha256:${string}`;
};
