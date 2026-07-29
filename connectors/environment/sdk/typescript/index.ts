import crypto from "node:crypto";
import {
  HELIX_ENVIRONMENT_PROBE_RESULT_V1_SCHEMA,
  HELIX_ENVIRONMENT_PROBE_SUBMISSION_SCHEMA,
  compileEnvironmentConnectorSchema,
  helixEnvironmentConnectorProbeRequestSchema,
  helixEnvironmentPairingSessionSchema,
  helixEnvironmentSourceManifestSchema,
  type HelixEnvironmentConstrainedJsonSchema,
  type HelixEnvironmentSourceManifest,
  type HelixEnvironmentConnectorProbeRequest,
  type HelixEnvironmentConnectorProbeResult,
  type HelixEnvironmentPairingSession,
  type HelixEnvironmentProbeSubmission,
} from "../../contract/v1";

export const validateConnectorManifest = (
  value: unknown,
): HelixEnvironmentSourceManifest =>
  helixEnvironmentSourceManifestSchema.parse(
    value,
  ) as HelixEnvironmentSourceManifest;

export const compileConstrainedConnectorSchema = (
  schema: HelixEnvironmentConstrainedJsonSchema,
) => compileEnvironmentConnectorSchema(schema);

export type ConnectorFetch = typeof fetch;

export type ConnectorLease = {
  schema: "helix.environment_connector.probe_lease.v1";
  probe_attempt_id: string;
  lease_token: string;
  lease_expires_at: string;
  capability_id: string;
  capability_version: number;
  catalog_snapshot_id: string;
  capability_request: HelixEnvironmentConnectorProbeRequest;
  request: null;
};

export type ConnectorPairingIdentity = {
  publicKeyPem: string;
  privateKey: crypto.KeyObject;
  publicKeyHash: `sha256:${string}`;
};

export type ConnectorPairingClaimReceipt = {
  deviceId: string;
  installationId: string;
  environmentBindingId: string;
  catalogSnapshotId: string;
  deviceCredentialExpiresAt: string;
  scopes: string[];
};

export type ConnectorHeartbeatReceipt = {
  health: string;
  commandExecution: "command_execution_not_enabled";
};

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalize(item)]),
  );
};

export const connectorSha256 = (value: unknown): `sha256:${string}` =>
  `sha256:${crypto
    .createHash("sha256")
    .update(JSON.stringify(canonicalize(value)), "utf8")
    .digest("hex")}`;

export const createConnectorPairingIdentity = (): ConnectorPairingIdentity => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey
    .export({ format: "pem", type: "spki" })
    .toString();
  const publicKeyHash = connectorSha256({
    namespace: "helix_environment_connector_device_key.v1",
    spki_der_base64: publicKey
      .export({ format: "der", type: "spki" })
      .toString("base64"),
  });
  return { publicKeyPem, privateKey, publicKeyHash };
};

export const pairingStartMessage = (input: {
  packageVersionId: string;
  deviceNonce: string;
  requestedCapabilityIds: string[];
  devicePublicKeyHash: string;
}): string =>
  [
    "helix.environment_connector.pairing.start.v1",
    input.packageVersionId,
    input.deviceNonce,
    connectorSha256(
      [...input.requestedCapabilityIds].sort((a, b) => a.localeCompare(b)),
    ),
    input.devicePublicKeyHash,
  ].join("\n");

export const pairingClaimMessage = (input: {
  pairingSessionId: string;
  claimChallenge: string;
}): string =>
  [
    "helix.environment_connector.pairing.claim.v1",
    input.pairingSessionId,
    input.claimChallenge,
  ].join("\n");

const sign = (privateKey: crypto.KeyObject, message: string): string =>
  crypto
    .sign(null, Buffer.from(message, "utf8"), privateKey)
    .toString("base64url");

const readJson = async (response: Response): Promise<unknown> => {
  const value = (await response.json()) as unknown;
  if (!response.ok) {
    const message =
      value &&
      typeof value === "object" &&
      typeof (value as { message?: unknown }).message === "string"
        ? (value as { message: string }).message
        : `Connector request failed with HTTP ${response.status}.`;
    throw new Error(message);
  }
  return value;
};

export class HelixEnvironmentConnectorClient {
  #deviceCredential: string | null;

  constructor(
    private readonly baseUrl: string,
    private readonly fetchImpl: ConnectorFetch = fetch,
    deviceCredential: string | null = null,
  ) {
    this.#deviceCredential = deviceCredential;
  }

  setDeviceCredentialOnce(value: string): void {
    if (this.#deviceCredential) {
      throw new Error("device_credential_already_configured");
    }
    if (!value.startsWith("helix_env_device_")) {
      throw new Error("device_credential_invalid");
    }
    this.#deviceCredential = value;
  }

  async startPairing(input: {
    packageVersionId: string;
    identity: ConnectorPairingIdentity;
    requestedCapabilityIds: string[];
    deviceNonce?: string;
  }): Promise<{
    session: HelixEnvironmentPairingSession;
    claimChallenge: string;
  }> {
    const deviceNonce =
      input.deviceNonce ?? crypto.randomBytes(24).toString("base64url");
    const message = pairingStartMessage({
      packageVersionId: input.packageVersionId,
      deviceNonce,
      requestedCapabilityIds: input.requestedCapabilityIds,
      devicePublicKeyHash: input.identity.publicKeyHash,
    });
    const raw = (await readJson(
      await this.fetchImpl(
        `${this.baseUrl}/api/environment-connectors/v1/pairing/start`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            package_version_id: input.packageVersionId,
            device_public_key_pem: input.identity.publicKeyPem,
            device_nonce: deviceNonce,
            requested_capability_ids: input.requestedCapabilityIds,
            proof_signature: sign(input.identity.privateKey, message),
          }),
        },
      ),
    )) as Record<string, unknown>;
    const session = helixEnvironmentPairingSessionSchema.parse({
      schema: raw.schema,
      pairing_session_id: raw.pairing_session_id,
      verification_uri: raw.verification_uri,
      user_code: raw.user_code,
      expires_at: raw.expires_at,
      interval_seconds: raw.interval_seconds,
      status: raw.status,
      requested_capability_ids: raw.requested_capability_ids,
      credential_included: raw.credential_included,
      assistant_answer: raw.assistant_answer,
      raw_content_included: raw.raw_content_included,
    });
    if (typeof raw.claim_challenge !== "string") {
      throw new Error("pairing_claim_challenge_missing");
    }
    return { session, claimChallenge: raw.claim_challenge };
  }

  async claimPairing(input: {
    pairingSessionId: string;
    claimChallenge: string;
    identity: ConnectorPairingIdentity;
  }): Promise<ConnectorPairingClaimReceipt> {
    const message = pairingClaimMessage(input);
    const raw = (await readJson(
      await this.fetchImpl(
        `${this.baseUrl}/api/environment-connectors/v1/pairing/claim`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            pairing_session_id: input.pairingSessionId,
            claim_challenge: input.claimChallenge,
            proof_signature: sign(input.identity.privateKey, message),
          }),
        },
      ),
    )) as Record<string, unknown>;
    if (typeof raw.device_credential !== "string") {
      throw new Error("pairing_device_credential_missing");
    }
    if (
      typeof raw.device_id !== "string" ||
      typeof raw.installation_id !== "string" ||
      typeof raw.environment_binding_id !== "string" ||
      typeof raw.device_credential_expires_at !== "string" ||
      !Array.isArray(raw.scopes) ||
      !raw.scopes.every((scope) => typeof scope === "string") ||
      !raw.catalog_snapshot ||
      typeof raw.catalog_snapshot !== "object" ||
      typeof (raw.catalog_snapshot as { catalog_snapshot_id?: unknown })
        .catalog_snapshot_id !== "string"
    ) {
      throw new Error("pairing_claim_receipt_invalid");
    }
    this.setDeviceCredentialOnce(raw.device_credential);
    return {
      deviceId: raw.device_id,
      installationId: raw.installation_id,
      environmentBindingId: raw.environment_binding_id,
      catalogSnapshotId: (
        raw.catalog_snapshot as { catalog_snapshot_id: string }
      ).catalog_snapshot_id,
      deviceCredentialExpiresAt: raw.device_credential_expires_at,
      scopes: [...raw.scopes] as string[],
    };
  }

  async poll(limit = 1): Promise<ConnectorLease[]> {
    const raw = (await readJson(
      await this.fetchImpl(
        `${this.baseUrl}/api/environment-connectors/v1/device/probes/pending?limit=${Math.max(1, Math.min(16, Math.floor(limit)))}`,
        { headers: this.authorizationHeaders() },
      ),
    )) as { leases?: unknown };
    if (!Array.isArray(raw.leases)) {
      throw new Error("pending_probe_leases_invalid");
    }
    return raw.leases.map((candidate) => {
      const value = candidate as ConnectorLease;
      helixEnvironmentConnectorProbeRequestSchema.parse(
        value.capability_request,
      );
      if (
        typeof value.probe_attempt_id !== "string" ||
        typeof value.lease_token !== "string" ||
        value.request !== null
      ) {
        throw new Error("pending_probe_lease_invalid");
      }
      return value;
    });
  }

  async submit(
    lease: ConnectorLease,
    result: HelixEnvironmentConnectorProbeResult,
  ): Promise<void> {
    const submission: HelixEnvironmentProbeSubmission = {
      schema: HELIX_ENVIRONMENT_PROBE_SUBMISSION_SCHEMA,
      probe_attempt_id: lease.probe_attempt_id,
      lease_token: lease.lease_token,
      result,
      submitted_at: new Date().toISOString(),
    };
    await readJson(
      await this.fetchImpl(
        `${this.baseUrl}/api/environment-connectors/v1/device/probes/result`,
        {
          method: "POST",
          headers: {
            ...this.authorizationHeaders(),
            "content-type": "application/json",
          },
          body: JSON.stringify(submission),
        },
      ),
    );
  }

  async heartbeat(): Promise<ConnectorHeartbeatReceipt> {
    const raw = (await readJson(
      await this.fetchImpl(
        `${this.baseUrl}/api/environment-connectors/v1/device/heartbeat`,
        {
          method: "POST",
          headers: {
            ...this.authorizationHeaders(),
            "content-type": "application/json",
          },
          body: "{}",
        },
      ),
    )) as Record<string, unknown>;
    if (
      typeof raw.health !== "string" ||
      raw.command_execution !== "command_execution_not_enabled"
    ) {
      throw new Error("connector_heartbeat_receipt_invalid");
    }
    return {
      health: raw.health,
      commandExecution: raw.command_execution,
    };
  }

  private authorizationHeaders(): Record<string, string> {
    if (!this.#deviceCredential) {
      throw new Error("device_credential_not_configured");
    }
    return { authorization: `Bearer ${this.#deviceCredential}` };
  }
}

export const createSucceededProbeResult = (input: {
  request: HelixEnvironmentConnectorProbeRequest;
  summary: string;
  result: Record<string, unknown>;
  now?: Date;
}): HelixEnvironmentConnectorProbeResult => ({
  schema: HELIX_ENVIRONMENT_PROBE_RESULT_V1_SCHEMA,
  probe_request_id: input.request.probe_request_id,
  capability_id: input.request.capability_id,
  capability_version: input.request.capability_version,
  outcome: "succeeded",
  summary: input.summary,
  result: input.result,
  side_effects_performed: false,
  commands_executed: [],
  environment_mutation_performed: false,
  deterministic: true,
  model_invoked: false,
  assistant_answer: false,
  raw_content_included: false,
  created_at: (input.now ?? new Date()).toISOString(),
});
