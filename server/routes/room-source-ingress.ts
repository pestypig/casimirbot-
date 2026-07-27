import crypto from "node:crypto";
import { Router, type Request, type Response } from "express";
import {
  helixEnvironmentSourceHeartbeatSchema,
  helixEnvironmentSourceManifestSchema,
  type HelixEnvironmentSourceHeartbeat,
  type HelixEnvironmentSourceManifest,
} from "@shared/helix-environment-source-manifest";
import {
  helixEnvironmentProbeResultSchema,
  type HelixEnvironmentProbeResult,
} from "@shared/helix-environment-probe";
import {
  HELIX_ROOM_SOURCE_ADMISSION_SCHEMA,
  HELIX_ROOM_SOURCE_INGRESS_RECEIPT_SCHEMA,
  type HelixRoomSourceBinding,
  type HelixRoomSourceAdmission,
  type HelixRoomSourceIngressKind,
  type HelixRoomSourceIngressReceipt,
  type HelixRoomSourceIngressScope,
} from "@shared/helix-room-source-ingress";
import type { HelixWorldEvent } from "@shared/helix-world-event";
import type {
  HelixEnvironmentAdapterAdmissionProjection,
  HelixEnvironmentAdapterRegistryRecord,
} from "@shared/helix-environment-adapter-profile";
import { auditEnvironmentSourceContract } from "../services/situation-room/environment-source-contract-validator";
import {
  getEnvironmentSourceManifest,
  registerEnvironmentSourceManifest,
} from "../services/situation-room/environment-source-registry";
import { recordEnvironmentSourceHeartbeat } from "../services/situation-room/environment-source-heartbeat-store";
import { projectEnvironmentSourceAvailability } from "../services/situation-room/environment-source-availability-projector";
import {
  listPendingEnvironmentProbeRequests,
  recordEnvironmentProbeResult,
} from "../services/situation-room/environment-probe-broker";
import {
  getWorldEventIngestHealth,
  ingestProtectedRoomSourceWorldEventBatch,
  worldEventBatchRequestSchema,
} from "../services/situation-room/world-event-ingest";
import {
  buildRoomSourceRequestEvidenceRefFromProjection,
  projectRoomSourceRequestId,
  redactProtectedRoomSourceSecrets,
} from "../services/situation-room/room-source-ingress-security";
import {
  claimRoomSourceIngressRequest,
  completeRoomSourceIngressRequest,
  isRoomSourceIngressError,
  RoomSourceIngressError,
  type RoomSourceIngressRequestClaim,
} from "../services/helix-ask/realtime-room/source-link-store";
import {
  recordEnvironmentAdapterAdmission,
  requireEnvironmentAdapterAdmission,
} from "../services/situation-room/environment-adapter-admission-store";
import {
  isEnvironmentAdapterRegistryError,
  resolveEnvironmentAdapterProfile,
} from "../services/situation-room/environment-adapter-registry";

type RequestWithRawBody = Request & { rawBody?: Buffer };

const MAX_ENVIRONMENT_PAYLOAD_BYTES = 64_000;
const MAX_WORLD_EVENT_PAYLOAD_BYTES = 512_000;
const DEFAULT_EVENT_MAX_AGE_MS = 10 * 60 * 1000;
const DEFAULT_EVENT_FUTURE_SKEW_MS = 2 * 60 * 1000;
const FORBIDDEN_SOURCE_AUTHORITY_KEYS = new Set([
  "account_id",
  "agent_run_id",
  "answer_authority",
  "assistant_answer",
  "browser_profile_id",
  "chat_id",
  "chat_session_id",
  "commander_profile_id",
  "conversation_id",
  "customer_id",
  "goal_id",
  "invoke_model",
  "linked_profile_id",
  "model",
  "model_id",
  "model_invoked",
  "owner_profile_id",
  "persona",
  "persona_id",
  "profile_id",
  "provider_goal_id",
  "provider_model",
  "provider_session_id",
  "provider_thread_id",
  "reasoning",
  "reasoning_id",
  "reasoning_mode",
  "reasoning_requested",
  "reasoning_trigger",
  "run_id",
  "session_id",
  "tenant_id",
  "terminal_eligible",
  "thread_id",
  "trace_id",
  "turn_id",
  "user_id",
]);

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const positiveInteger = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const rawBody = (req: RequestWithRawBody): Buffer => {
  if (req.rawBody) return req.rawBody;
  if (req.method === "GET" || req.method === "HEAD") return Buffer.alloc(0);
  return Buffer.from(JSON.stringify(req.body ?? {}), "utf8");
};

const bodyDigest = (req: RequestWithRawBody): string =>
  `sha-256=${crypto.createHash("sha256").update(rawBody(req)).digest("base64")}`;

const receipt = (input: {
  kind: HelixRoomSourceIngressKind;
  ok: boolean;
  error?: string | null;
  message: string;
  binding?: HelixRoomSourceBinding | null;
  requestId?: string | null;
  accepted?: boolean;
  replayed?: boolean;
  observationRef?: Record<string, unknown> | null;
  probeRequests?: unknown[];
}): HelixRoomSourceIngressReceipt =>
  redactProtectedRoomSourceSecrets({
    schema: HELIX_ROOM_SOURCE_INGRESS_RECEIPT_SCHEMA,
    ok: input.ok,
    error: input.error ?? null,
    message: input.message,
    binding_id: input.binding?.binding_id ?? null,
    room_id: input.binding?.room_id ?? null,
    source_id: input.binding?.source_id ?? null,
    world_id: input.binding?.world_id ?? null,
    request_id: input.requestId ?? null,
    kind: input.kind,
    accepted: input.accepted ?? input.ok,
    replayed: input.replayed ?? false,
    ...(input.observationRef !== undefined
      ? { observation_ref: input.observationRef }
      : {}),
    ...(input.probeRequests !== undefined
      ? { probe_requests: input.probeRequests }
      : {}),
    content_role: "source_observation_not_assistant_answer",
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });

const header = (req: Request, name: string): string | null =>
  normalize(req.get(name)) || null;

const claim = (
  req: RequestWithRawBody,
  requiredScope: HelixRoomSourceIngressScope,
  routeKey: string,
) =>
  claimRoomSourceIngressRequest({
    bindingId: req.params.bindingId,
    requiredScope,
    routeKey,
    authorization: req.headers.authorization,
    ingressVersion: header(req, "x-helix-ingress-version"),
    requestId: header(req, "x-helix-request-id"),
    producerEpoch: header(req, "x-helix-producer-epoch"),
    sequence: header(req, "x-helix-sequence"),
    sentAt: header(req, "x-helix-sent-at"),
    digest: header(req, "digest"),
    computedBodyDigest: bodyDigest(req),
    payloadForSecretScan: [rawBody(req).toString("utf8"), req.body ?? null],
  });

const payloadError = (
  code: ConstructorParameters<typeof RoomSourceIngressError>[0],
  statusCode: number,
  message: string,
): never => {
  throw new RoomSourceIngressError(code, statusCode, message);
};

const assertJsonPost = (req: RequestWithRawBody, maxBytes: number): void => {
  if (!req.is("application/json")) {
    payloadError(
      "room_source_payload_invalid",
      415,
      "Room source ingress requires application/json.",
    );
  }
  if (rawBody(req).byteLength > maxBytes) {
    payloadError(
      "room_source_payload_too_large",
      413,
      "Room source ingress payload exceeds the route limit.",
    );
  }
};

const assertBindingIdentity = (
  binding: HelixRoomSourceBinding,
  identity: {
    roomId?: unknown;
    sourceId?: unknown;
    worldId?: unknown;
    domainAdapter?: unknown;
  },
): void => {
  const mismatches: string[] = [];
  if (
    identity.roomId !== undefined &&
    normalize(identity.roomId) !== binding.room_id
  ) {
    mismatches.push("room_id");
  }
  if (
    identity.sourceId !== undefined &&
    normalize(identity.sourceId) !== binding.source_id
  ) {
    mismatches.push("source_id");
  }
  if (
    identity.worldId !== undefined &&
    normalize(identity.worldId) !== binding.world_id
  ) {
    mismatches.push("world_id");
  }
  if (
    identity.domainAdapter !== undefined &&
    normalize(identity.domainAdapter) !== binding.domain_adapter
  ) {
    mismatches.push("domain_adapter");
  }
  if (mismatches.length > 0) {
    payloadError(
      "room_source_identity_mismatch",
      403,
      `Ingress identity does not match its room binding: ${mismatches.join(", ")}.`,
    );
  }
};

const assertCurrentEventTimestamp = (
  timestamp: string,
  profileMaxAgeMs: number,
): void => {
  const parsed = Date.parse(timestamp);
  const now = Date.now();
  const maxAge = Math.min(
    positiveInteger(
      process.env.HELIX_ROOM_INGRESS_EVENT_MAX_AGE_MS,
      DEFAULT_EVENT_MAX_AGE_MS,
    ),
    profileMaxAgeMs,
  );
  const futureSkew = positiveInteger(
    process.env.HELIX_ROOM_INGRESS_EVENT_FUTURE_SKEW_MS,
    DEFAULT_EVENT_FUTURE_SKEW_MS,
  );
  if (
    !Number.isFinite(parsed) ||
    parsed < now - maxAge ||
    parsed > now + futureSkew
  ) {
    payloadError(
      "room_source_request_stale",
      408,
      "A world event is outside the accepted live-event time window.",
    );
  }
};

const adapterRecordForClaim = (
  activeClaim: RoomSourceIngressRequestClaim,
): HelixEnvironmentAdapterRegistryRecord => {
  try {
    return resolveEnvironmentAdapterProfile({
      domainAdapter: activeClaim.binding.domain_adapter,
      worldId: activeClaim.binding.world_id,
    });
  } catch (error) {
    if (isEnvironmentAdapterRegistryError(error)) {
      throw new RoomSourceIngressError(
        error.code,
        error.code === "environment_adapter_disabled" ? 409 : 400,
        error.message,
      );
    }
    throw error;
  }
};

const findForbiddenSourceAuthorityPath = (
  value: unknown,
  path = "meta",
  depth = 0,
): string | null => {
  if (depth > 12 || value === null || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findForbiddenSourceAuthorityPath(
        value[index],
        `${path}[${index}]`,
        depth + 1,
      );
      if (found) return found;
    }
    return null;
  }
  for (const [key, nested] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (FORBIDDEN_SOURCE_AUTHORITY_KEYS.has(key.toLowerCase())) {
      return `${path}.${key}`;
    }
    const found = findForbiddenSourceAuthorityPath(
      nested,
      `${path}.${key}`,
      depth + 1,
    );
    if (found) return found;
  }
  return null;
};

const sourceAdmission = (
  activeClaim: RoomSourceIngressRequestClaim,
  adapterAdmission: HelixEnvironmentAdapterAdmissionProjection | null = null,
): HelixRoomSourceAdmission => ({
  schema: HELIX_ROOM_SOURCE_ADMISSION_SCHEMA,
  transport: "room_source_ingress",
  binding_id: activeClaim.binding.binding_id,
  request_id: activeClaim.requestProjectionId,
  room_id: activeClaim.binding.room_id,
  source_id: activeClaim.binding.source_id,
  world_id: activeClaim.binding.world_id,
  domain_adapter: activeClaim.binding.domain_adapter,
  adapter_admission: adapterAdmission,
  evidence_refs: [
    activeClaim.binding.binding_id,
    buildRoomSourceRequestEvidenceRefFromProjection({
      bindingId: activeClaim.binding.binding_id,
      requestProjectionId: activeClaim.requestProjectionId,
    }),
    ...(adapterAdmission
      ? [
          adapterAdmission.admission_id,
          adapterAdmission.adapter_contract_hash,
          adapterAdmission.manifest_id,
          adapterAdmission.manifest_hash,
          adapterAdmission.producer_epoch_ref,
          ...adapterAdmission.mechanics_collection_ids,
        ]
      : []),
  ],
  content_role: "source_admission_not_assistant_answer",
  reentry_required: true,
  model_invoked: false,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const errorStatus = (error: unknown): number =>
  isRoomSourceIngressError(error) ? error.statusCode : 503;

const errorCode = (error: unknown): string =>
  isRoomSourceIngressError(error) ? error.code : "room_source_unavailable";

const errorMessage = (error: unknown): string =>
  isRoomSourceIngressError(error)
    ? error.message
    : "Room source ingress is temporarily unavailable.";

const route =
  (
    kind: HelixRoomSourceIngressKind,
    requiredScope: HelixRoomSourceIngressScope,
    routeKey: (req: Request) => string,
    handler: (
      req: RequestWithRawBody,
      activeClaim: RoomSourceIngressRequestClaim,
      adapterAdmission: HelixEnvironmentAdapterAdmissionProjection | null,
    ) => Promise<{
      statusCode?: number;
      message: string;
      observationRef?: Record<string, unknown> | null;
      probeRequests?: unknown[];
    }>,
  ) =>
  (req: Request, res: Response): void => {
    void (async () => {
      let activeClaim: RoomSourceIngressRequestClaim | null = null;
      let handlerCompleted = false;
      try {
        activeClaim = await claim(
          req as RequestWithRawBody,
          requiredScope,
          routeKey(req),
        );
        adapterRecordForClaim(activeClaim);
        const adapterAdmission =
          kind === "manifest" || kind === "status"
            ? null
            : await requireEnvironmentAdapterAdmission({
                claim: activeClaim,
              });
        if (activeClaim.replay) {
          res
            .status(activeClaim.replay.statusCode)
            .json(activeClaim.replay.receipt);
          return;
        }
        const result = await handler(
          req as RequestWithRawBody,
          activeClaim,
          adapterAdmission,
        );
        handlerCompleted = true;
        const acceptedReceipt = receipt({
          kind,
          ok: true,
          message: result.message,
          binding: activeClaim.binding,
          requestId: activeClaim.requestProjectionId,
          accepted: true,
          observationRef: result.observationRef,
          probeRequests: result.probeRequests,
        });
        const statusCode = result.statusCode ?? 200;
        try {
          await completeRoomSourceIngressRequest({
            claim: activeClaim,
            statusCode,
            receipt: acceptedReceipt,
          });
        } catch (error) {
          console.warn(
            "[room-source-ingress] durable receipt confirmation failed",
            redactProtectedRoomSourceSecrets(
              error instanceof Error ? error.message : "unknown",
            ),
          );
          throw new RoomSourceIngressError(
            "room_source_request_outcome_unknown",
            503,
            "The ingress operation completed, but its durable receipt could not be confirmed. Do not assume failure; send a fresh current-state observation with a new request ID and sequence.",
          );
        }
        res.status(statusCode).json(acceptedReceipt);
      } catch (error) {
        const responseError =
          activeClaim && !isRoomSourceIngressError(error)
            ? new RoomSourceIngressError(
                "room_source_request_outcome_unknown",
                503,
                "The ingress outcome cannot be proven. Do not assume failure; send a fresh current-state observation with a new request ID and sequence.",
              )
            : error;
        const statusCode = errorStatus(responseError);
        const rejectedReceipt = receipt({
          kind,
          ok: false,
          error: errorCode(responseError),
          message: errorMessage(responseError),
          binding: activeClaim?.binding ?? null,
          requestId:
            activeClaim?.requestProjectionId ??
            (() => {
              const requestId = header(req, "x-helix-request-id");
              return requestId
                ? projectRoomSourceRequestId({
                    bindingId: req.params.bindingId ?? "",
                    requestId,
                  })
                : null;
            })(),
          accepted: false,
        });
        if (
          activeClaim &&
          !activeClaim.replay &&
          !handlerCompleted &&
          isRoomSourceIngressError(error)
        ) {
          await completeRoomSourceIngressRequest({
            claim: activeClaim,
            statusCode,
            receipt: rejectedReceipt,
          }).catch(() => undefined);
        }
        if (!isRoomSourceIngressError(error)) {
          console.warn(
            "[room-source-ingress] request failed",
            redactProtectedRoomSourceSecrets(
              error instanceof Error ? error.message : "unknown",
            ),
          );
        }
        res.status(statusCode).json(rejectedReceipt);
      }
    })();
  };

export const roomSourceIngressRouter = Router();

roomSourceIngressRouter.post(
  "/v1/bindings/:bindingId/world-events/batch",
  route(
    "world_event_batch",
    "world_events:write",
    () => "world-events/batch",
    async (
      req: RequestWithRawBody,
      activeClaim: RoomSourceIngressRequestClaim,
      adapterAdmission: HelixEnvironmentAdapterAdmissionProjection | null,
    ) => {
      const adapterRecord = adapterRecordForClaim(activeClaim);
      assertJsonPost(
        req,
        Math.min(
          MAX_WORLD_EVENT_PAYLOAD_BYTES,
          adapterRecord.profile.payload_policy.max_event_batch_bytes,
        ),
      );
      const parsed = worldEventBatchRequestSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        throw new RoomSourceIngressError(
          "environment_adapter_observation_schema_invalid",
          400,
          `World-event batch does not match ${adapterRecord.profile.observation_schemas.world_event}.`,
        );
      }
      const batch = parsed.data!;
      if (
        batch.thread_id ||
        batch.turn_id ||
        batch.session_id ||
        batch.trace_id
      ) {
        payloadError(
          "room_source_execution_denied",
          403,
          "A room source cannot choose Ask thread, turn, session, or trace authority.",
        );
      }
      const maxBatch = getWorldEventIngestHealth().max_batch;
      if (batch.events.length === 0 || batch.events.length > maxBatch) {
        payloadError(
          "room_source_payload_invalid",
          400,
          `World-event batch must contain between 1 and ${maxBatch} events.`,
        );
      }
      for (const event of batch.events) {
        const forbiddenAuthorityPath = findForbiddenSourceAuthorityPath(
          event.meta,
        );
        if (forbiddenAuthorityPath) {
          payloadError(
            "room_source_execution_denied",
            403,
            `World-event metadata cannot select account or Ask authority (${forbiddenAuthorityPath}).`,
          );
        }
        assertBindingIdentity(activeClaim.binding, {
          roomId: event.room_id,
          sourceId: event.source_id ?? null,
          worldId: event.world_id,
          domainAdapter:
            event.meta && typeof event.meta.domain_adapter === "string"
              ? event.meta.domain_adapter
              : null,
        });
        assertCurrentEventTimestamp(
          event.ts,
          adapterRecord.profile.freshness.observation_max_age_ms,
        );
      }
      if (!adapterAdmission) {
        throw new RoomSourceIngressError(
          "environment_adapter_admission_required",
          409,
          "A durable adapter admission is required before world events are accepted.",
        );
      }
      const admission = sourceAdmission(activeClaim, adapterAdmission);
      const admittedEvents = batch.events.map((event: HelixWorldEvent) => ({
        ...event,
        meta: {
          ...(event.meta ?? {}),
          domain_adapter: activeClaim.binding.domain_adapter,
        },
      }));
      const ingested = ingestProtectedRoomSourceWorldEventBatch(
        admittedEvents,
        admission,
      );
      return {
        message:
          "World-event batch accepted into the protected observation-only lane.",
        observationRef: {
          schema: "helix.room_source_world_event_batch_observation.v1",
          event_count: ingested.event_count,
          appended_count: ingested.appended_count,
          suppressed_count: ingested.suppressed_count,
          signal_ids: ingested.results
            .map((result: { signal_id?: string | null }) => result.signal_id)
            .filter((value: string | null | undefined): value is string =>
              Boolean(value),
            ),
          source_admission: admission,
          content_role: "observation_not_assistant_answer",
          model_invoked: false,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
      };
    },
  ),
);

roomSourceIngressRouter.post(
  "/v1/bindings/:bindingId/manifest",
  route(
    "manifest",
    "manifest:write",
    () => "manifest",
    async (
      req: RequestWithRawBody,
      activeClaim: RoomSourceIngressRequestClaim,
      _adapterAdmission: HelixEnvironmentAdapterAdmissionProjection | null,
    ) => {
      const adapterRecord = adapterRecordForClaim(activeClaim);
      assertJsonPost(
        req,
        Math.min(
          MAX_ENVIRONMENT_PAYLOAD_BYTES,
          adapterRecord.profile.payload_policy.max_manifest_bytes,
        ),
      );
      const parsed = helixEnvironmentSourceManifestSchema.safeParse(req.body);
      if (!parsed.success) {
        payloadError(
          "room_source_payload_invalid",
          400,
          "Environment source manifest failed runtime schema validation.",
        );
      }
      const manifest = parsed.data as HelixEnvironmentSourceManifest;
      assertBindingIdentity(activeClaim.binding, {
        roomId: manifest?.room_id ?? null,
        sourceId: manifest?.source_id ?? null,
        domainAdapter: manifest?.domain_adapter ?? null,
      });
      if (
        manifest?.execution_policy?.may_execute_live_actions !== false ||
        manifest?.execution_policy?.may_perform_read_only_probes !== true ||
        manifest?.auth_policy?.bearer_required !== true
      ) {
        payloadError(
          "room_source_execution_denied",
          403,
          "The source manifest must remain bearer-authenticated and read-only.",
        );
      }
      const audit = auditEnvironmentSourceContract({ subject: manifest });
      if (!audit.ok) {
        payloadError(
          "room_source_payload_invalid",
          400,
          "Environment source manifest failed contract validation.",
        );
      }
      const adapterAdmission = await recordEnvironmentAdapterAdmission({
        claim: activeClaim,
        manifest,
      });
      const admission = sourceAdmission(activeClaim, adapterAdmission);
      const registered = registerEnvironmentSourceManifest(manifest, {
        sourceAdmission: admission,
      });
      return {
        message: "Environment source manifest registered.",
        observationRef: {
          schema: "helix.room_source_manifest_observation.v1",
          manifest_id: registered.manifest_id,
          source_id: registered.source_id,
          room_id: registered.room_id,
          domain_adapter: registered.domain_adapter,
          adapter_admission: adapterAdmission,
          audit_ok: audit.ok,
          content_role: "observation_not_assistant_answer",
          model_invoked: false,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
      };
    },
  ),
);

roomSourceIngressRouter.post(
  "/v1/bindings/:bindingId/heartbeat",
  route(
    "heartbeat",
    "heartbeat:write",
    () => "heartbeat",
    async (
      req: RequestWithRawBody,
      activeClaim: RoomSourceIngressRequestClaim,
      adapterAdmission: HelixEnvironmentAdapterAdmissionProjection | null,
    ) => {
      if (!adapterAdmission) {
        throw new RoomSourceIngressError(
          "environment_adapter_admission_required",
          409,
          "A durable adapter admission is required before heartbeats are accepted.",
        );
      }
      const admission = sourceAdmission(activeClaim, adapterAdmission);
      const adapterRecord = adapterRecordForClaim(activeClaim);
      assertJsonPost(
        req,
        Math.min(
          MAX_ENVIRONMENT_PAYLOAD_BYTES,
          adapterRecord.profile.payload_policy.max_manifest_bytes,
        ),
      );
      const parsed = helixEnvironmentSourceHeartbeatSchema.safeParse(req.body);
      if (!parsed.success) {
        payloadError(
          "room_source_payload_invalid",
          400,
          "Environment source heartbeat failed runtime schema validation.",
        );
      }
      const heartbeat = parsed.data as HelixEnvironmentSourceHeartbeat;
      assertBindingIdentity(activeClaim.binding, {
        roomId: heartbeat?.room_id ?? null,
        sourceId: heartbeat?.source_id ?? null,
        domainAdapter: heartbeat?.domain_adapter ?? null,
      });
      if (
        !getEnvironmentSourceManifest(activeClaim.binding.source_id, {
          sourceAdmission: admission,
        })
      ) {
        payloadError(
          "room_source_payload_invalid",
          409,
          "Register the bound source manifest before sending heartbeats.",
        );
      }
      const audit = auditEnvironmentSourceContract({ subject: heartbeat });
      if (!audit.ok) {
        payloadError(
          "room_source_payload_invalid",
          400,
          "Environment source heartbeat failed contract validation.",
        );
      }
      const recorded = recordEnvironmentSourceHeartbeat(heartbeat, {
        sourceAdmission: admission,
      });
      return {
        message: "Environment source heartbeat recorded.",
        observationRef: {
          schema: "helix.room_source_heartbeat_observation.v1",
          heartbeat_id: recorded.heartbeat_id,
          source_id: recorded.source_id,
          room_id: recorded.room_id,
          status: recorded.status,
          audit_ok: audit.ok,
          content_role: "observation_not_assistant_answer",
          model_invoked: false,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
      };
    },
  ),
);

roomSourceIngressRouter.get(
  "/v1/bindings/:bindingId/probes/pending",
  route(
    "probe_requests",
    "probe_requests:read",
    (req: Request) => {
      const parsed = Number(req.query.limit);
      const limit = Number.isFinite(parsed)
        ? Math.max(1, Math.min(16, parsed))
        : 8;
      return `probes/pending?limit=${limit}`;
    },
    async (
      req: RequestWithRawBody,
      activeClaim: RoomSourceIngressRequestClaim,
      adapterAdmission: HelixEnvironmentAdapterAdmissionProjection | null,
    ) => {
      if (!adapterAdmission) {
        throw new RoomSourceIngressError(
          "environment_adapter_admission_required",
          409,
          "A durable adapter admission is required before probes are listed.",
        );
      }
      const admission = sourceAdmission(activeClaim, adapterAdmission);
      const adapterRecord = adapterRecordForClaim(activeClaim);
      if (
        !getEnvironmentSourceManifest(activeClaim.binding.source_id, {
          sourceAdmission: admission,
        })
      ) {
        payloadError(
          "room_source_payload_invalid",
          409,
          "Register the bound source manifest before polling probes.",
        );
      }
      const parsed = Number(req.query.limit);
      const limit = Number.isFinite(parsed)
        ? Math.max(1, Math.min(16, parsed))
        : 8;
      const requests = listPendingEnvironmentProbeRequests({
        sourceId: activeClaim.binding.source_id,
        limit: 16,
        sourceAdmission: admission,
      })
        .filter((request: { probe_type: string }) =>
          adapterRecord.profile.allowed_probe_types.some(
            (probeType: string) => probeType === request.probe_type,
          ),
        )
        .filter(
          (request: { room_id: string }) =>
            request.room_id === activeClaim.binding.room_id,
        )
        .slice(0, limit);
      return {
        message: "Pending read-only probe requests listed.",
        probeRequests: requests,
        observationRef: {
          schema: "helix.room_source_probe_queue_observation.v1",
          pending_count: requests.length,
          source_id: activeClaim.binding.source_id,
          room_id: activeClaim.binding.room_id,
          content_role: "observation_not_assistant_answer",
          model_invoked: false,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
      };
    },
  ),
);

roomSourceIngressRouter.post(
  "/v1/bindings/:bindingId/probes/result",
  route(
    "probe_result",
    "probe_results:write",
    () => "probes/result",
    async (
      req: RequestWithRawBody,
      activeClaim: RoomSourceIngressRequestClaim,
      adapterAdmission: HelixEnvironmentAdapterAdmissionProjection | null,
    ) => {
      if (!adapterAdmission) {
        throw new RoomSourceIngressError(
          "environment_adapter_admission_required",
          409,
          "A durable adapter admission is required before probe results are accepted.",
        );
      }
      const admission = sourceAdmission(activeClaim, adapterAdmission);
      const adapterRecord = adapterRecordForClaim(activeClaim);
      assertJsonPost(
        req,
        Math.min(
          MAX_ENVIRONMENT_PAYLOAD_BYTES,
          adapterRecord.profile.payload_policy.max_snapshot_bytes,
        ),
      );
      const parsed = helixEnvironmentProbeResultSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new RoomSourceIngressError(
          "environment_adapter_observation_schema_invalid",
          400,
          `Environment probe result does not match ${adapterRecord.profile.observation_schemas.probe_result}.`,
        );
      }
      const result = parsed.data as HelixEnvironmentProbeResult;
      if (
        !adapterRecord.profile.allowed_probe_types.includes(result.probe_type)
      ) {
        throw new RoomSourceIngressError(
          "environment_adapter_observation_schema_invalid",
          400,
          `Probe ${result.probe_type} is not admitted by the active adapter profile.`,
        );
      }
      assertBindingIdentity(activeClaim.binding, {
        roomId: result?.room_id ?? null,
        sourceId: result?.source_id ?? null,
      });
      if (
        result?.side_effects_performed !== false ||
        result?.world_mutation_performed !== false ||
        !Array.isArray(result?.commands_executed) ||
        result.commands_executed.length !== 0
      ) {
        payloadError(
          "room_source_execution_denied",
          403,
          "Probe results that report commands or world mutation are not admitted.",
        );
      }
      const pending = listPendingEnvironmentProbeRequests({
        sourceId: activeClaim.binding.source_id,
        limit: 16,
        sourceAdmission: admission,
      }).find(
        (request: {
          probe_request_id: string;
          room_id: string;
          source_id: string;
          domain: string;
          probe_type: string;
        }) =>
          request.probe_request_id === result?.probe_request_id &&
          request.room_id === activeClaim.binding.room_id &&
          request.source_id === activeClaim.binding.source_id &&
          request.domain === result.domain &&
          request.probe_type === result.probe_type,
      );
      if (!pending) {
        throw new RoomSourceIngressError(
          "room_source_probe_not_pending",
          409,
          "Probe result does not match a pending request for this room source.",
        );
      }
      const correlatedResult: HelixEnvironmentProbeResult = {
        ...result,
        evidence_refs: Array.from(
          new Set([
            ...pending.evidence_refs,
            ...result.evidence_refs,
            `probe_request:${pending.probe_request_id}`,
          ]),
        ),
      };
      const recorded = recordEnvironmentProbeResult(correlatedResult, {
        sourceAdmission: admission,
      });
      if (!recorded.audit.ok) {
        payloadError(
          "room_source_payload_invalid",
          400,
          "Environment probe result failed contract validation.",
        );
      }
      return {
        message: "Read-only environment probe result recorded.",
        observationRef: {
          schema: "helix.room_source_probe_result_observation.v1",
          probe_request_id: recorded.result.probe_request_id,
          probe_result_id: recorded.result.probe_result_id,
          status: recorded.result.status,
          audit_ok: recorded.audit.ok,
          content_role: "observation_not_assistant_answer",
          model_invoked: false,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
      };
    },
  ),
);

roomSourceIngressRouter.get(
  "/v1/bindings/:bindingId/status",
  route(
    "status",
    "probe_requests:read",
    () => "status",
    async (
      _req: RequestWithRawBody,
      activeClaim: RoomSourceIngressRequestClaim,
      adapterAdmission: HelixEnvironmentAdapterAdmissionProjection | null,
    ) => {
      const adapterRecord = adapterRecordForClaim(activeClaim);
      const status = projectEnvironmentSourceAvailability({
        sourceId: activeClaim.binding.source_id,
        sourceAdmission: sourceAdmission(activeClaim, adapterAdmission),
        requiredModalities: adapterRecord.profile.required_modalities,
        requiredSnapshotSections:
          adapterRecord.profile.required_snapshot_sections,
        requiredProbeTypes: adapterRecord.profile.required_probe_types,
      });
      return {
        message: "Room source status projected.",
        observationRef: {
          ...status,
          binding_id: activeClaim.binding.binding_id,
          content_role: "observation_not_assistant_answer",
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
      };
    },
  ),
);
