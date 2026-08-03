import {
  Router,
  json,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { z } from "zod";
import {
  helixEnvironmentProbeSubmissionSchema,
} from "@shared/helix-environment-connector";
import {
  HELIX_CONNECTOR_PAIRING_REDEMPTION_SCHEMA,
  HELIX_CONNECTOR_PAIRING_UNPAIR_RECEIPT_SCHEMA,
  helixConnectorPairingRedeemRequestSchema,
  helixConnectorUnpairRequestSchema,
} from "@shared/helix-connector-pairing";
import { buildWorkstationEntryUrl } from "@shared/workstation-link-meta";
import {
  leaseDurableEnvironmentProbesForClaim,
  submitDurableEnvironmentProbeResult,
  DurableEnvironmentProbeError,
} from "../services/environment-connectors/probe";
import {
  approveEnvironmentConnectorPairing,
  authenticateEnvironmentConnectorDevice,
  claimEnvironmentConnectorPairing,
  EnvironmentConnectorPairingError,
  revokeEnvironmentConnectorDevice,
  rotateEnvironmentConnectorDeviceCredential,
  startEnvironmentConnectorPairing,
  ConnectorBootstrapPairingError,
  redeemConnectorBootstrapPairing,
  unpairConnectorBootstrapBinding,
  type AuthenticatedEnvironmentConnectorDevice,
} from "../services/environment-connectors/pairing";
import type {
  RoomSourceIngressRequestClaim,
} from "../services/helix-ask/realtime-room/source-link-store";
import {
  isRoomSourceIngressError,
} from "../services/helix-ask/realtime-room/source-link-store";
import {
  readMembership,
  requireOwner,
  requireSharedRoomAccount,
} from "./agi.realtime-room/http-context";
import {
  FirstPartyCookieBoundary,
  FirstPartyCookieBoundaryError,
} from "../middleware/first-party-cookie-boundary";
import {
  redactProtectedRoomSourceSecrets,
} from "../services/situation-room/room-source-ingress-security";
import {
  listPublicEnvironmentConnectorDirectory,
} from "../services/environment-connectors/directory";

const identifier = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .regex(/^[a-zA-Z0-9:._/-]+$/);

const pairingStartSchema = z
  .object({
    package_version_id: identifier,
    device_public_key_pem: z.string().min(80).max(8_192),
    device_nonce: z.string().min(16).max(256),
    requested_capability_ids: z.array(identifier).min(1).max(64),
    proof_signature: z.string().min(32).max(512),
  })
  .strict();

const pairingClaimSchema = z
  .object({
    pairing_session_id: identifier,
    claim_challenge: z.string().min(32).max(512),
    proof_signature: z.string().min(32).max(512),
  })
  .strict();

const pairingApprovalSchema = z
  .object({
    user_code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/),
    room_id: identifier,
    room_source_binding_id: identifier,
    approved_capability_ids: z.array(identifier).min(1).max(64),
  })
  .strict();

const deviceManagementSchema = z
  .object({
    room_id: identifier,
  })
  .strict();

const publicBoundary = new FirstPartyCookieBoundary({
  codePrefix: "environment_connector_public",
  ipMax: Number(
    process.env.HELIX_ENVIRONMENT_CONNECTOR_PUBLIC_RATE_LIMIT ?? "120",
  ),
  accountMax: 120,
});

const browserBoundary = new FirstPartyCookieBoundary({
  codePrefix: "environment_connector_browser",
  ipMax: 120,
  accountMax: 60,
});

const errorPayload = (input: {
  code: string;
  message: string;
}): Record<string, unknown> => ({
  schema: "helix.environment_connector.error.v1",
  ok: false,
  error: input.code,
  message: input.message,
  credential_included: false,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const sendError = (res: Response, error: unknown): void => {
  const parserError =
    error && typeof error === "object"
      ? error as { type?: unknown; status?: unknown; statusCode?: unknown }
      : null;
  if (
    parserError?.type === "entity.parse.failed" ||
    parserError?.type === "entity.too.large"
  ) {
    const oversized = parserError.type === "entity.too.large";
    res.status(oversized ? 413 : 400).json(
      errorPayload({
        code: oversized
          ? "environment_connector_payload_too_large"
          : "environment_connector_payload_invalid",
        message: oversized
          ? "The environment connector payload exceeds the route limit."
          : "The environment connector payload contains malformed JSON.",
      }),
    );
    return;
  }
  if (error instanceof EnvironmentConnectorPairingError) {
    res
      .status(error.statusCode)
      .json(errorPayload({ code: error.code, message: error.message }));
    return;
  }
  if (error instanceof ConnectorBootstrapPairingError) {
    res
      .status(error.statusCode)
      .json(errorPayload({ code: error.code, message: error.message }));
    return;
  }
  if (isRoomSourceIngressError(error)) {
    res
      .status(error.statusCode)
      .json(errorPayload({ code: error.code, message: error.message }));
    return;
  }
  if (error instanceof DurableEnvironmentProbeError) {
    res
      .status(error.statusCode)
      .json(errorPayload({ code: error.code, message: error.message }));
    return;
  }
  if (error instanceof FirstPartyCookieBoundaryError) {
    if (error.retryAfterMs !== null) {
      res.setHeader(
        "Retry-After",
        String(Math.max(1, Math.ceil(error.retryAfterMs / 1_000))),
      );
    }
    res
      .status(error.statusCode)
      .json(errorPayload({ code: error.code, message: error.message }));
    return;
  }
  const message =
    error instanceof Error
      ? error.message
      : "environment_connector_unavailable";
  console.warn(
    "[environment-connector] request failed",
    redactProtectedRoomSourceSecrets(message),
  );
  res.status(503).json(
    errorPayload({
      code: "environment_connector_unavailable",
      message: "The environment connector service is temporarily unavailable.",
    }),
  );
};

const route = (
  handler: (req: Request, res: Response) => Promise<void>,
) => (req: Request, res: Response, _next: NextFunction): void => {
  void handler(req, res).catch((error) => sendError(res, error));
};

const invalid = (res: Response, message: string): void => {
  res
    .status(400)
    .json(errorPayload({ code: "pairing_request_invalid", message }));
};

const verificationUriForRequest = (req: Request): string => {
  const host = req.get("host")?.trim();
  if (!host || host.includes(",") || /\s/.test(host)) {
    throw new EnvironmentConnectorPairingError(
      "pairing_request_invalid",
      400,
      "A single valid Host header is required.",
    );
  }
  return buildWorkstationEntryUrl({
    baseUrl: `${req.protocol}://${host}`,
    search: "?focus=account-session",
    entry: "workstation",
  });
};

const pairingEndpointForRequest = (req: Request): string => {
  const host = req.get("host")?.trim();
  if (!host || host.includes(",") || /\s/.test(host)) {
    throw new ConnectorBootstrapPairingError(
      "connector_pairing_invalid",
      400,
      "A single valid Host header is required.",
    );
  }
  return `${req.protocol}://${host}/api/environment-connectors/v1/pairing/redeem`;
};

const readBearer = (req: Request): string => {
  const authorization = req.get("authorization")?.trim() ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(authorization);
  if (!match || match[1].length < 32 || match[1].length > 512) {
    throw new EnvironmentConnectorPairingError(
      "device_credential_invalid",
      401,
      "A valid scoped device credential is required.",
    );
  }
  return match[1];
};

const claimForDevice = (
  device: AuthenticatedEnvironmentConnectorDevice,
  routeKey: string,
): RoomSourceIngressRequestClaim => ({
  binding: device.binding,
  credentialId: device.binding.credential_id ?? "credential:server_resolved",
  requestProjectionId:
    `device_transport:${device.deviceCredentialId}:${cryptoSafeRoute(routeKey)}`,
  producerEpoch: device.admission.producer_epoch_ref,
  sequence: 0,
  routeKey,
  bodyDigest: "sha256:device_transport_server_authenticated",
  replay: null,
});

const cryptoSafeRoute = (value: string): string =>
  value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);

export const environmentConnectorPublicRouter = Router();

environmentConnectorPublicRouter.use(
  "/api/environment-connectors/v1",
  publicBoundary.noStore,
  publicBoundary.enforceIpRateLimit,
  json({ limit: "64kb" }),
);

environmentConnectorPublicRouter.post(
  "/api/environment-connectors/v1/pairing/start",
  route(async (req, res) => {
    const parsed = pairingStartSchema.safeParse(req.body);
    if (!parsed.success) {
      invalid(res, "The pairing start request is invalid.");
      return;
    }
    const result = await startEnvironmentConnectorPairing({
      packageVersionId: parsed.data.package_version_id,
      devicePublicKeyPem: parsed.data.device_public_key_pem,
      deviceNonce: parsed.data.device_nonce,
      requestedCapabilityIds: parsed.data.requested_capability_ids,
      proofSignature: parsed.data.proof_signature,
      verificationUri: verificationUriForRequest(req),
    });
    res.status(201).json({
      ...result.session,
      claim_challenge: result.claimChallenge,
      claim_challenge_included: true,
      device_credential_included: false,
      secret_stored_raw: false,
    });
  }),
);

environmentConnectorPublicRouter.get(
  "/api/environment-connectors/v1/directory/packages",
  route(async (_req, res) => {
    const packages = await listPublicEnvironmentConnectorDirectory();
    res.json({
      schema: "helix.environment_connector.directory.v1",
      packages,
      trust_axes: [
        "package_provenance",
        "security_review",
        "runtime_connection_health",
        "observation_quality",
      ],
      private_installation_data_included: false,
      user_evidence_included: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

environmentConnectorPublicRouter.post(
  "/api/environment-connectors/v1/pairing/claim",
  route(async (req, res) => {
    const parsed = pairingClaimSchema.safeParse(req.body);
    if (!parsed.success) {
      invalid(res, "The pairing claim request is invalid.");
      return;
    }
    const claimed = await claimEnvironmentConnectorPairing({
      pairingSessionId: parsed.data.pairing_session_id,
      claimChallenge: parsed.data.claim_challenge,
      proofSignature: parsed.data.proof_signature,
    });
    res.json({
      schema: "helix.environment_connector.device_credential_delivery.v1",
      ok: true,
      error: null,
      device_id: claimed.deviceId,
      installation_id: claimed.installationId,
      environment_binding_id: claimed.environmentBindingId,
      catalog_snapshot: claimed.catalogSnapshot,
      device_credential: claimed.deviceCredential,
      device_credential_expires_at: claimed.deviceCredentialExpiresAt,
      scopes: claimed.scopes,
      credential_included: true,
      credential_shown_once: true,
      secret_stored_raw: false,
      command_execution: "command_execution_not_enabled",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

environmentConnectorPublicRouter.post(
  "/api/environment-connectors/v1/pairing/redeem",
  route(async (req, res) => {
    const parsed = helixConnectorPairingRedeemRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      invalid(res, "The connector pairing redemption request is invalid.");
      return;
    }
    const redeemed = await redeemConnectorBootstrapPairing({
      pairingCode: parsed.data.pairing_code,
      redemptionNonce: parsed.data.redemption_nonce,
      domainAdapter: parsed.data.domain_adapter,
      connectorKind: parsed.data.connector_kind,
      connectorVersion: parsed.data.connector_version,
      pairingEndpoint: pairingEndpointForRequest(req),
    });
    res.json({
      schema: HELIX_CONNECTOR_PAIRING_REDEMPTION_SCHEMA,
      ok: true,
      error: null,
      message: redeemed.replayed
        ? "The idempotent connector pairing redemption was replayed."
        : redeemed.pluginConfig.pairing_mode === "command_only"
          ? "The connector command lane is paired. Its separate command credential was delivered only to the connector."
          : "The connector is paired. Its room-source credential was delivered only to the connector.",
      pairing_id: redeemed.pairingId,
      binding_id: redeemed.binding.binding_id,
      plugin_config: redeemed.pluginConfig,
      replayed: redeemed.replayed,
      credential_included: true,
      credential_shown_once: true,
      secret_stored_raw: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

environmentConnectorPublicRouter.post(
  "/api/environment-connectors/v1/pairing/unpair",
  route(async (req, res) => {
    const parsed = helixConnectorUnpairRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      invalid(res, "The connector unpair request is invalid.");
      return;
    }
    const binding = await unpairConnectorBootstrapBinding({
      bindingId: parsed.data.binding_id,
      bearerToken: readBearer(req),
    });
    res.json({
      schema: HELIX_CONNECTOR_PAIRING_UNPAIR_RECEIPT_SCHEMA,
      ok: true,
      error: null,
      message: "The connector source binding was revoked.",
      binding_id: binding.binding_id,
      status: "revoked",
      credential_included: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

environmentConnectorPublicRouter.get(
  "/api/environment-connectors/v1/device/probes/pending",
  route(async (req, res) => {
    const device = await authenticateEnvironmentConnectorDevice({
      bearerToken: readBearer(req),
      requiredScope: "probe.poll",
    });
    const leases = await leaseDurableEnvironmentProbesForClaim({
      claim: claimForDevice(device, "device.probes.pending"),
      adapterAdmission: device.admission,
      expectedDeviceId: device.deviceId,
      expectedEnvironmentBindingId: device.environmentBindingId,
      limit: Number(req.query.limit ?? 1),
    });
    res.json({
      schema: "helix.environment_connector.pending_leases.v1",
      leases: leases.map((lease) => ({
        ...lease,
        request: null,
      })),
      credential_included: false,
      private_routing_included: false,
      command_execution: "command_execution_not_enabled",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

environmentConnectorPublicRouter.post(
  "/api/environment-connectors/v1/device/probes/result",
  route(async (req, res) => {
    const parsed = helixEnvironmentProbeSubmissionSchema.safeParse(req.body);
    if (!parsed.success) {
      invalid(res, "The probe result envelope is invalid.");
      return;
    }
    const device = await authenticateEnvironmentConnectorDevice({
      bearerToken: readBearer(req),
      requiredScope: "probe.result",
    });
    const submitted = await submitDurableEnvironmentProbeResult({
      claim: claimForDevice(device, "device.probes.result"),
      adapterAdmission: device.admission,
      expectedDeviceId: device.deviceId,
      expectedEnvironmentBindingId: device.environmentBindingId,
      submission: parsed.data,
    });
    res.json({
      schema: "helix.environment_connector.probe_result_receipt.v1",
      ok: true,
      error: null,
      accepted: true,
      replayed: submitted.replayed,
      evidence_ref: submitted.observation.evidence_ref,
      outcome: submitted.observation.outcome,
      eligible_for_current_turn_reentry:
        submitted.observation.eligible_for_current_turn_reentry,
      credential_included: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

environmentConnectorPublicRouter.post(
  "/api/environment-connectors/v1/device/heartbeat",
  route(async (req, res) => {
    await authenticateEnvironmentConnectorDevice({
      bearerToken: readBearer(req),
      requiredScope: "health.write",
    });
    res.json({
      schema: "helix.environment_connector.health_receipt.v1",
      ok: true,
      error: null,
      health: "online",
      credential_included: false,
      command_execution: "command_execution_not_enabled",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

environmentConnectorPublicRouter.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): void => sendError(res, error),
);

export const environmentConnectorBrowserRouter = Router();

environmentConnectorBrowserRouter.use(
  "/environment-connectors",
  browserBoundary.noStore,
  browserBoundary.enforceIpRateLimit,
  browserBoundary.enforceSameOrigin,
  json({ limit: "32kb" }),
);

environmentConnectorBrowserRouter.post(
  "/environment-connectors/pairing/approve",
  route(async (req, res) => {
    const parsed = pairingApprovalSchema.safeParse(req.body);
    if (!parsed.success) {
      invalid(res, "The pairing approval request is invalid.");
      return;
    }
    const account = await requireSharedRoomAccount(req);
    browserBoundary.enforceAccountRateLimit(res, account.profileId);
    const membership = await readMembership(parsed.data.room_id, account);
    requireOwner(membership);
    const approved = await approveEnvironmentConnectorPairing({
      userCode: parsed.data.user_code,
      ownerProfileId: account.profileId,
      roomId: parsed.data.room_id,
      roomSourceBindingId: parsed.data.room_source_binding_id,
      approvedCapabilityIds: parsed.data.approved_capability_ids,
    });
    res.json({
      schema: "helix.environment_connector.pairing_approval.v1",
      ok: true,
      error: null,
      ...approved,
      credential_included: false,
      device_public_key_included: false,
      command_execution: "command_execution_not_enabled",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

environmentConnectorBrowserRouter.post(
  "/environment-connectors/devices/:deviceId/credentials/rotate",
  route(async (req, res) => {
    const parsed = deviceManagementSchema.safeParse(req.body);
    if (!parsed.success) {
      invalid(res, "The device credential rotation request is invalid.");
      return;
    }
    const account = await requireSharedRoomAccount(req);
    browserBoundary.enforceAccountRateLimit(res, account.profileId);
    const membership = await readMembership(parsed.data.room_id, account);
    requireOwner(membership);
    const rotated = await rotateEnvironmentConnectorDeviceCredential({
      ownerProfileId: account.profileId,
      deviceId: req.params.deviceId,
    });
    res.json({
      schema: "helix.environment_connector.device_credential_delivery.v1",
      ok: true,
      error: null,
      device_id: req.params.deviceId,
      device_credential: rotated.credential,
      device_credential_expires_at: rotated.expiresAt,
      credential_included: true,
      credential_shown_once: true,
      secret_stored_raw: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

environmentConnectorBrowserRouter.delete(
  "/environment-connectors/devices/:deviceId",
  route(async (req, res) => {
    const parsed = deviceManagementSchema.safeParse(req.body);
    if (!parsed.success) {
      invalid(res, "The device revocation request is invalid.");
      return;
    }
    const account = await requireSharedRoomAccount(req);
    browserBoundary.enforceAccountRateLimit(res, account.profileId);
    const membership = await readMembership(parsed.data.room_id, account);
    requireOwner(membership);
    await revokeEnvironmentConnectorDevice({
      ownerProfileId: account.profileId,
      deviceId: req.params.deviceId,
    });
    res.json({
      schema: "helix.environment_connector.device_revocation.v1",
      ok: true,
      error: null,
      device_id: req.params.deviceId,
      status: "revoked",
      credential_included: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }),
);

environmentConnectorBrowserRouter.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): void => sendError(res, error),
);
