import crypto from "node:crypto";
import {
  HELIX_ENVIRONMENT_CATALOG_SNAPSHOT_SCHEMA,
  HELIX_ENVIRONMENT_PAIRING_SESSION_SCHEMA,
  helixEnvironmentPairingSessionSchema,
  type HelixEnvironmentCapabilityDescriptor,
  type HelixEnvironmentCatalogSnapshot,
  type HelixEnvironmentPairingSession,
} from "@shared/helix-environment-connector";
import type {
  HelixEnvironmentAdapterAdmissionProjection,
} from "@shared/helix-environment-adapter-profile";
import type {
  HelixRoomSourceBinding,
} from "@shared/helix-room-source-ingress";
import {
  projectEnvironmentAdapterAdmission,
  type EnvironmentAdapterAdmissionRow,
} from "../../situation-room/environment-adapter-admission-store";
import {
  readSharedRealtimeRoomDatabase,
  withSharedRealtimeRoomTransaction,
} from "../../helix-ask/realtime-room/room-store/database";
import type {
  Queryable,
} from "../../helix-ask/realtime-room/room-store/types";
import {
  environmentConnectorSha256,
  listBuiltinEnvironmentConnectorPackages,
  readBuiltinEnvironmentConnectorPackage,
  type BuiltinEnvironmentConnectorPackage,
} from "../catalog";

const PAIRING_TTL_MS = 10 * 60 * 1_000;
const DEVICE_CREDENTIAL_TTL_MS = 30 * 24 * 60 * 60 * 1_000;
const MAX_PENDING_SESSIONS_PER_KEY = 5;
const DEVICE_SCOPES = ["probe.poll", "probe.result", "health.write"] as const;

export type EnvironmentConnectorPairingErrorCode =
  | "pairing_request_invalid"
  | "pairing_package_unknown"
  | "pairing_capability_denied"
  | "pairing_key_invalid"
  | "pairing_proof_invalid"
  | "pairing_replay"
  | "pairing_rate_limited"
  | "pairing_session_not_found"
  | "pairing_session_expired"
  | "pairing_session_not_approved"
  | "pairing_session_already_claimed"
  | "pairing_room_forbidden"
  | "pairing_binding_unavailable"
  | "device_credential_invalid"
  | "device_credential_expired"
  | "device_revoked";

export class EnvironmentConnectorPairingError extends Error {
  constructor(
    readonly code: EnvironmentConnectorPairingErrorCode,
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "EnvironmentConnectorPairingError";
  }
}

type PairingRow = {
  pairing_session_id: string;
  package_version_id: string;
  installation_id: string | null;
  device_public_key: string;
  device_public_key_hash: string;
  device_nonce_hash: string;
  claim_challenge_hash: string;
  user_code_hash: string;
  requested_capability_ids: unknown;
  approved_capability_ids: unknown;
  approved_room_id: string | null;
  approved_room_source_binding_id: string | null;
  approved_adapter_admission_id: string | null;
  approved_by_profile_id: string | null;
  status: string;
  attempt_count: number | string;
  expires_at: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
  claimed_at: Date | string | null;
};

type DeviceCredentialRow = {
  device_credential_id: string;
  device_id: string;
  token_hash: string;
  token_prefix: string;
  scopes: unknown;
  status: string;
  created_at: Date | string;
  expires_at: Date | string;
  last_used_at: Date | string | null;
  revoked_at: Date | string | null;
};

type DeviceTransportRow = DeviceCredentialRow & {
  installation_id: string;
  device_public_key_hash: string;
  producer_epoch_ref: string | null;
  device_status: string;
  environment_binding_id: string;
  environment_binding_status: string;
  room_source_binding_id: string;
  adapter_admission_id: string;
  owner_profile_id: string;
  room_id: string;
  source_id: string;
  world_id: string;
  consent_capability_ids: unknown;
  binding_status: string;
  domain_adapter: string;
  source_label: string;
  source_scopes: unknown;
  admission_credential_id: string;
  admission_producer_epoch: string;
  admission_room_id: string;
  admission_source_id: string;
  admission_world_id: string;
  admission_domain_adapter: string;
  adapter_profile_id: string;
  adapter_profile_version: number | string;
  adapter_contract_hash: string;
  manifest_id: string;
  manifest_hash: string;
  source_family: string;
  mechanics_collection_ids: unknown;
  admission_status: string;
  admitted_at: Date | string;
  admission_updated_at: Date | string;
  admission_revoked_at: Date | string | null;
};

export type AuthenticatedEnvironmentConnectorDevice = {
  deviceCredentialId: string;
  deviceId: string;
  installationId: string;
  environmentBindingId: string;
  scopes: string[];
  capabilityIds: string[];
  binding: HelixRoomSourceBinding;
  admission: HelixEnvironmentAdapterAdmissionProjection;
};

const parseStringArray = (value: unknown): string[] => {
  const parsed =
    typeof value === "string"
      ? (() => {
          try {
            return JSON.parse(value) as unknown;
          } catch {
            return [];
          }
        })()
      : value;
  return Array.isArray(parsed)
    ? Array.from(
        new Set(
          parsed
            .filter((entry): entry is string => typeof entry === "string")
            .map((entry) => entry.trim())
            .filter(Boolean),
        ),
      )
    : [];
};

const asIso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const randomId = (prefix: string): string => `${prefix}:${crypto.randomUUID()}`;

const canonicalPublicKey = (
  publicKeyPem: string,
): { key: crypto.KeyObject; pem: string; hash: `sha256:${string}` } => {
  try {
    const key = crypto.createPublicKey(publicKeyPem);
    if (key.asymmetricKeyType !== "ed25519") {
      throw new Error("unsupported_key_type");
    }
    const pem = key.export({ format: "pem", type: "spki" }).toString();
    const der = key.export({ format: "der", type: "spki" });
    return {
      key,
      pem,
      hash: environmentConnectorSha256({
        namespace: "helix_environment_connector_device_key.v1",
        spki_der_base64: der.toString("base64"),
      }),
    };
  } catch {
    throw new EnvironmentConnectorPairingError(
      "pairing_key_invalid",
      400,
      "Pairing requires a valid Ed25519 public key.",
    );
  }
};

const verifySignature = (
  key: crypto.KeyObject,
  message: string,
  signatureBase64Url: string,
): void => {
  let signature: Buffer;
  try {
    signature = Buffer.from(signatureBase64Url, "base64url");
  } catch {
    signature = Buffer.alloc(0);
  }
  if (
    signature.length !== 64 ||
    !crypto.verify(null, Buffer.from(message, "utf8"), key, signature)
  ) {
    throw new EnvironmentConnectorPairingError(
      "pairing_proof_invalid",
      401,
      "The connector did not prove possession of the submitted device key.",
    );
  }
};

export const environmentConnectorPairingStartMessage = (input: {
  packageVersionId: string;
  deviceNonce: string;
  requestedCapabilityIds: string[];
  devicePublicKeyHash: string;
}): string =>
  [
    "helix.environment_connector.pairing.start.v1",
    input.packageVersionId,
    input.deviceNonce,
    environmentConnectorSha256(
      [...input.requestedCapabilityIds].sort((a, b) => a.localeCompare(b)),
    ),
    input.devicePublicKeyHash,
  ].join("\n");

export const environmentConnectorPairingClaimMessage = (input: {
  pairingSessionId: string;
  claimChallenge: string;
}): string =>
  [
    "helix.environment_connector.pairing.claim.v1",
    input.pairingSessionId,
    input.claimChallenge,
  ].join("\n");

const hashPairingSecret = (
  namespace: string,
  value: string,
): `sha256:${string}` =>
  environmentConnectorSha256({ namespace, value });

const generateUserCode = (): string => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(8);
  const chars = Array.from(
    bytes,
    (byte) => alphabet[byte % alphabet.length],
  );
  return `${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
};

const packageContentHash = (
  pkg: BuiltinEnvironmentConnectorPackage,
): `sha256:${string}` =>
  environmentConnectorSha256({
    package_id: pkg.packageId,
    package_version: pkg.packageVersion,
    adapter_profile_id: pkg.adapterProfileId,
    host_compatibility: pkg.hostCompatibility,
    capability_descriptors: pkg.capabilityDescriptors,
  });

export const ensureBuiltinEnvironmentConnectorPackages = async (
  dbOverride?: Queryable,
): Promise<void> => {
  const db = dbOverride ?? (await readSharedRealtimeRoomDatabase());
  for (const pkg of listBuiltinEnvironmentConnectorPackages()) {
    await db.query(
      `
        INSERT INTO helix_environment_connector_packages (
          package_version_id,
          publisher_id,
          package_id,
          package_version,
          content_hash,
          host_compatibility,
          capability_descriptors,
          trust_classification,
          security_review_state
        ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, 'first_party', 'approved')
        ON CONFLICT (package_version_id) DO NOTHING;
      `,
      [
        pkg.packageVersionId,
        pkg.publisherId,
        pkg.packageId,
        pkg.packageVersion,
        packageContentHash(pkg),
        JSON.stringify(pkg.hostCompatibility),
        JSON.stringify(pkg.capabilityDescriptors),
      ],
    );
  }
};

const descriptorSubset = (
  pkg: BuiltinEnvironmentConnectorPackage,
  capabilityIds: string[],
): HelixEnvironmentCapabilityDescriptor[] => {
  const unique = Array.from(new Set(capabilityIds.map((value) => value.trim())));
  const descriptors = unique.map((capabilityId) => {
    const descriptor = pkg.capabilityDescriptors.find(
      (candidate) => candidate.capability_id === capabilityId,
    );
    if (!descriptor) {
      throw new EnvironmentConnectorPairingError(
        "pairing_capability_denied",
        403,
        "The requested capability is not part of the immutable connector package.",
      );
    }
    if (
      descriptor.capability_class !== "probe" ||
      !descriptor.read_only ||
      descriptor.side_effects_allowed
    ) {
      throw new EnvironmentConnectorPairingError(
        "pairing_capability_denied",
        403,
        "This release admits read-only probe capabilities only.",
      );
    }
    return descriptor;
  });
  if (descriptors.length === 0) {
    throw new EnvironmentConnectorPairingError(
      "pairing_request_invalid",
      400,
      "At least one package capability is required.",
    );
  }
  return descriptors;
};

const projectPairingSession = (
  input: {
    row: PairingRow;
    userCode: string;
    verificationUri: string;
  },
): HelixEnvironmentPairingSession =>
  helixEnvironmentPairingSessionSchema.parse({
    schema: HELIX_ENVIRONMENT_PAIRING_SESSION_SCHEMA,
    pairing_session_id: input.row.pairing_session_id,
    verification_uri: input.verificationUri,
    user_code: input.userCode,
    expires_at: asIso(input.row.expires_at),
    interval_seconds: 3,
    status: input.row.status,
    requested_capability_ids: parseStringArray(
      input.row.requested_capability_ids,
    ),
    credential_included: false,
    assistant_answer: false,
    raw_content_included: false,
  });

export const startEnvironmentConnectorPairing = async (input: {
  packageVersionId: string;
  devicePublicKeyPem: string;
  deviceNonce: string;
  requestedCapabilityIds: string[];
  proofSignature: string;
  verificationUri: string;
  now?: Date;
}): Promise<{
  session: HelixEnvironmentPairingSession;
  claimChallenge: string;
}> => {
  const now = input.now ?? new Date();
  const pkg = readBuiltinEnvironmentConnectorPackage(input.packageVersionId);
  if (!pkg) {
    throw new EnvironmentConnectorPairingError(
      "pairing_package_unknown",
      404,
      "The requested immutable connector package version is not registered.",
    );
  }
  descriptorSubset(pkg, input.requestedCapabilityIds);
  if (input.deviceNonce.length < 16 || input.deviceNonce.length > 256) {
    throw new EnvironmentConnectorPairingError(
      "pairing_request_invalid",
      400,
      "The device nonce must contain 16-256 characters.",
    );
  }
  const publicKey = canonicalPublicKey(input.devicePublicKeyPem);
  verifySignature(
    publicKey.key,
    environmentConnectorPairingStartMessage({
      packageVersionId: pkg.packageVersionId,
      deviceNonce: input.deviceNonce,
      requestedCapabilityIds: input.requestedCapabilityIds,
      devicePublicKeyHash: publicKey.hash,
    }),
    input.proofSignature,
  );
  const deviceNonceHash = hashPairingSecret(
    "helix_environment_connector_pairing_nonce.v1",
    input.deviceNonce,
  );
  const db = await readSharedRealtimeRoomDatabase();
  await ensureBuiltinEnvironmentConnectorPackages(db);
  const prior = await db.query<{ count: number | string }>(
    `
      SELECT count(*) AS count
      FROM helix_environment_pairing_sessions
      WHERE device_public_key_hash = $1
        AND status IN ('pending', 'approved')
        AND expires_at > $2;
    `,
    [publicKey.hash, now.toISOString()],
  );
  if (Number(prior.rows[0]?.count ?? 0) >= MAX_PENDING_SESSIONS_PER_KEY) {
    throw new EnvironmentConnectorPairingError(
      "pairing_rate_limited",
      429,
      "This device key has too many active pairing sessions.",
    );
  }
  const replay = await db.query<{ pairing_session_id: string }>(
    `
      SELECT pairing_session_id
      FROM helix_environment_pairing_sessions
      WHERE device_nonce_hash = $1
      LIMIT 1;
    `,
    [deviceNonceHash],
  );
  if (replay.rows[0]) {
    throw new EnvironmentConnectorPairingError(
      "pairing_replay",
      409,
      "This device nonce has already been used.",
    );
  }
  const pairingSessionId = randomId("environment_pairing");
  const userCode = generateUserCode();
  const claimChallenge = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + PAIRING_TTL_MS);
  const inserted = await db.query<PairingRow>(
    `
      INSERT INTO helix_environment_pairing_sessions (
        pairing_session_id,
        package_version_id,
        device_public_key,
        device_public_key_hash,
        device_nonce_hash,
        claim_challenge_hash,
        user_code_hash,
        requested_capability_ids,
        expires_at,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $10)
      RETURNING *;
    `,
    [
      pairingSessionId,
      pkg.packageVersionId,
      publicKey.pem,
      publicKey.hash,
      deviceNonceHash,
      hashPairingSecret(
        "helix_environment_connector_claim_challenge.v1",
        claimChallenge,
      ),
      hashPairingSecret(
        "helix_environment_connector_pairing_code.v1",
        userCode,
      ),
      JSON.stringify(input.requestedCapabilityIds),
      expiresAt.toISOString(),
      now.toISOString(),
    ],
  );
  return {
    session: projectPairingSession({
      row: inserted.rows[0]!,
      userCode,
      verificationUri: input.verificationUri,
    }),
    claimChallenge,
  };
};

export const approveEnvironmentConnectorPairing = async (input: {
  userCode: string;
  ownerProfileId: string;
  roomId: string;
  roomSourceBindingId: string;
  approvedCapabilityIds: string[];
  now?: Date;
}): Promise<{
  pairingSessionId: string;
  installationId: string;
  approvedCapabilityIds: string[];
  expiresAt: string;
}> => {
  const now = input.now ?? new Date();
  const codeHash = hashPairingSecret(
    "helix_environment_connector_pairing_code.v1",
    input.userCode.toUpperCase(),
  );
  return withSharedRealtimeRoomTransaction(async (db: Queryable) => {
    const sessions = await db.query<PairingRow>(
      `
        SELECT *
        FROM helix_environment_pairing_sessions
        WHERE user_code_hash = $1
        LIMIT 1
        FOR UPDATE;
      `,
      [codeHash],
    );
    const session = sessions.rows[0];
    if (!session) {
      throw new EnvironmentConnectorPairingError(
        "pairing_session_not_found",
        404,
        "The pairing code is unknown.",
      );
    }
    if (new Date(session.expires_at).getTime() <= now.getTime()) {
      await db.query(
        `
          UPDATE helix_environment_pairing_sessions
          SET status = 'expired', updated_at = $2
          WHERE pairing_session_id = $1;
        `,
        [session.pairing_session_id, now.toISOString()],
      );
      throw new EnvironmentConnectorPairingError(
        "pairing_session_expired",
        410,
        "The pairing code has expired.",
      );
    }
    if (session.status !== "pending") {
      throw new EnvironmentConnectorPairingError(
        session.status === "claimed"
          ? "pairing_session_already_claimed"
          : "pairing_session_not_approved",
        409,
        "The pairing session is not awaiting approval.",
      );
    }
    const pkg = readBuiltinEnvironmentConnectorPackage(
      session.package_version_id,
    );
    if (!pkg) {
      throw new EnvironmentConnectorPairingError(
        "pairing_package_unknown",
        404,
        "The pairing package is no longer registered.",
      );
    }
    const requested = new Set(
      parseStringArray(session.requested_capability_ids),
    );
    if (
      input.approvedCapabilityIds.length === 0 ||
      input.approvedCapabilityIds.some(
        (capabilityId) => !requested.has(capabilityId),
      )
    ) {
      throw new EnvironmentConnectorPairingError(
        "pairing_capability_denied",
        403,
        "Approval may grant only the capabilities requested by this session.",
      );
    }
    const approvedDescriptors = descriptorSubset(
      pkg,
      input.approvedCapabilityIds,
    );
    const bindingRows = await db.query<{
      binding_id: string;
      room_id: string;
      owner_profile_id: string;
      source_id: string;
      world_id: string;
      domain_adapter: string;
      status: string;
      admission_id: string;
      adapter_profile_id: string;
      adapter_profile_version: number | string;
      adapter_contract_hash: string;
      manifest_hash: string;
      admission_status: string;
    }>(
      `
        SELECT
          b.*,
          a.admission_id,
          a.adapter_profile_id,
          a.adapter_profile_version,
          a.adapter_contract_hash,
          a.manifest_hash,
          a.status AS admission_status
        FROM helix_room_source_bindings b
        JOIN helix_shared_realtime_room_members m
          ON m.room_id = b.room_id
          AND m.profile_id = $2
          AND m.member_role = 'owner'
          AND m.presence <> 'left'
        JOIN helix_environment_adapter_admissions a
          ON a.binding_id = b.binding_id
          AND a.status = 'active'
        JOIN helix_room_source_credentials c
          ON c.credential_id = a.credential_id
          AND c.binding_id = b.binding_id
          AND c.status = 'active'
          AND c.expires_at > $5
        WHERE b.binding_id = $1
          AND b.owner_profile_id = $2
          AND b.room_id = $3
          AND b.status = 'active'
        ORDER BY a.admitted_at DESC
        LIMIT 1
        FOR UPDATE;
      `,
      [
        input.roomSourceBindingId,
        input.ownerProfileId,
        input.roomId,
        pkg.adapterProfileId,
        now.toISOString(),
      ],
    );
    const binding = bindingRows.rows[0];
    if (!binding) {
      throw new EnvironmentConnectorPairingError(
        "pairing_binding_unavailable",
        409,
        "The selected room source lacks a current admitted adapter and active owner consent.",
      );
    }
    if (
      binding.adapter_profile_id !== pkg.adapterProfileId ||
      approvedDescriptors.some(
        (descriptor) =>
          !descriptor.adapter_profile_ids.includes(binding.adapter_profile_id),
      )
    ) {
      throw new EnvironmentConnectorPairingError(
        "pairing_capability_denied",
        409,
        "The package capabilities do not match the selected admitted environment adapter.",
      );
    }
    const installationId = randomId("connector_installation");
    await db.query(
      `
        INSERT INTO helix_environment_connector_installations (
          installation_id,
          owner_profile_id,
          package_version_id,
          granted_capability_ids,
          installed_at,
          updated_at
        ) VALUES ($1, $2, $3, $4::jsonb, $5, $5);
      `,
      [
        installationId,
        input.ownerProfileId,
        pkg.packageVersionId,
        JSON.stringify(input.approvedCapabilityIds),
        now.toISOString(),
      ],
    );
    await db.query(
      `
        UPDATE helix_environment_pairing_sessions
        SET installation_id = $2,
            approved_capability_ids = $3::jsonb,
            approved_room_id = $4,
            approved_room_source_binding_id = $5,
            approved_adapter_admission_id = $6,
            approved_by_profile_id = $7,
            status = 'approved',
            attempt_count = attempt_count + 1,
            updated_at = $8
        WHERE pairing_session_id = $1;
      `,
      [
        session.pairing_session_id,
        installationId,
        JSON.stringify(input.approvedCapabilityIds),
        input.roomId,
        input.roomSourceBindingId,
        binding.admission_id,
        input.ownerProfileId,
        now.toISOString(),
      ],
    );
    return {
      pairingSessionId: session.pairing_session_id,
      installationId,
      approvedCapabilityIds: [...input.approvedCapabilityIds],
      expiresAt: asIso(session.expires_at),
    };
  });
};

const readAdmissionForClaim = async (
  db: Queryable,
  admissionId: string,
): Promise<EnvironmentAdapterAdmissionRow> => {
  const result = await db.query<EnvironmentAdapterAdmissionRow>(
    `
      SELECT a.*
      FROM helix_environment_adapter_admissions a
      JOIN helix_room_source_bindings b
        ON b.binding_id = a.binding_id
        AND b.status = 'active'
      JOIN helix_room_source_credentials c
        ON c.credential_id = a.credential_id
        AND c.status = 'active'
        AND c.expires_at > now()
      WHERE a.admission_id = $1
        AND a.status = 'active'
      LIMIT 1
      FOR UPDATE;
    `,
    [admissionId],
  );
  if (!result.rows[0]) {
    throw new EnvironmentConnectorPairingError(
      "pairing_binding_unavailable",
      409,
      "The approved adapter admission is no longer active.",
    );
  }
  return result.rows[0];
};

export const claimEnvironmentConnectorPairing = async (input: {
  pairingSessionId: string;
  claimChallenge: string;
  proofSignature: string;
  now?: Date;
}): Promise<{
  deviceId: string;
  installationId: string;
  environmentBindingId: string;
  catalogSnapshot: HelixEnvironmentCatalogSnapshot;
  deviceCredential: string;
  deviceCredentialExpiresAt: string;
  scopes: readonly string[];
}> => {
  const now = input.now ?? new Date();
  const deviceCredential = `helix_env_device_${crypto
    .randomBytes(32)
    .toString("base64url")}`;
  const credentialHash = hashPairingSecret(
    "helix_environment_connector_device_credential.v1",
    deviceCredential,
  );
  return withSharedRealtimeRoomTransaction(async (db: Queryable) => {
    const sessions = await db.query<PairingRow>(
      `
        SELECT *
        FROM helix_environment_pairing_sessions
        WHERE pairing_session_id = $1
        LIMIT 1
        FOR UPDATE;
      `,
      [input.pairingSessionId],
    );
    const session = sessions.rows[0];
    if (!session) {
      throw new EnvironmentConnectorPairingError(
        "pairing_session_not_found",
        404,
        "The pairing session is unknown.",
      );
    }
    if (new Date(session.expires_at).getTime() <= now.getTime()) {
      throw new EnvironmentConnectorPairingError(
        "pairing_session_expired",
        410,
        "The pairing session expired before it was claimed.",
      );
    }
    if (session.status === "claimed") {
      throw new EnvironmentConnectorPairingError(
        "pairing_session_already_claimed",
        409,
        "The one-time device credential has already been claimed.",
      );
    }
    if (
      session.status !== "approved" ||
      !session.installation_id ||
      !session.approved_room_id ||
      !session.approved_room_source_binding_id ||
      !session.approved_adapter_admission_id ||
      !session.approved_by_profile_id
    ) {
      throw new EnvironmentConnectorPairingError(
        "pairing_session_not_approved",
        409,
        "The user has not approved this device, room, and capability set.",
      );
    }
    if (
      session.claim_challenge_hash !==
      hashPairingSecret(
        "helix_environment_connector_claim_challenge.v1",
        input.claimChallenge,
      )
    ) {
      throw new EnvironmentConnectorPairingError(
        "pairing_proof_invalid",
        401,
        "The claim challenge does not match this pairing session.",
      );
    }
    const publicKey = canonicalPublicKey(session.device_public_key);
    if (publicKey.hash !== session.device_public_key_hash) {
      throw new EnvironmentConnectorPairingError(
        "pairing_key_invalid",
        409,
        "The persisted device key does not match its immutable identity hash.",
      );
    }
    verifySignature(
      publicKey.key,
      environmentConnectorPairingClaimMessage({
        pairingSessionId: session.pairing_session_id,
        claimChallenge: input.claimChallenge,
      }),
      input.proofSignature,
    );
    const pkg = readBuiltinEnvironmentConnectorPackage(
      session.package_version_id,
    );
    if (!pkg) {
      throw new EnvironmentConnectorPairingError(
        "pairing_package_unknown",
        404,
        "The approved connector package is no longer registered.",
      );
    }
    const approvedCapabilityIds = parseStringArray(
      session.approved_capability_ids,
    );
    const approvedDescriptors = descriptorSubset(
      pkg,
      approvedCapabilityIds,
    );
    const admissionRow = await readAdmissionForClaim(
      db,
      session.approved_adapter_admission_id,
    );
    const admission = projectEnvironmentAdapterAdmission(admissionRow);
    if (
      admissionRow.binding_id !== session.approved_room_source_binding_id ||
      admissionRow.room_id !== session.approved_room_id ||
      admission.adapter_profile_id !== pkg.adapterProfileId
    ) {
      throw new EnvironmentConnectorPairingError(
        "pairing_binding_unavailable",
        409,
        "The approved environment identity changed before the claim completed.",
      );
    }
    const deviceId = randomId("connector_device");
    const environmentBindingId = randomId("environment_binding");
    const deviceCredentialId = randomId("connector_device_credential");
    const catalogHash = environmentConnectorSha256({
      environment_binding_id: environmentBindingId,
      adapter_profile_id: admission.adapter_profile_id,
      adapter_profile_version: admission.adapter_profile_version,
      adapter_contract_hash: admission.adapter_contract_hash,
      manifest_hash: admission.manifest_hash,
      capability_descriptors: approvedDescriptors,
    });
    const catalogSnapshotId = randomId("environment_catalog_snapshot");
    const credentialExpiresAt = new Date(
      now.getTime() + DEVICE_CREDENTIAL_TTL_MS,
    ).toISOString();
    await db.query(
      `
        INSERT INTO helix_environment_connector_devices (
          device_id,
          installation_id,
          device_public_key_hash,
          credential_ref,
          producer_epoch_ref,
          health_status,
          last_contact_at,
          paired_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, 'online', $6, $6, $6);
      `,
      [
        deviceId,
        session.installation_id,
        session.device_public_key_hash,
        deviceCredentialId,
        admission.producer_epoch_ref,
        now.toISOString(),
      ],
    );
    await db.query(
      `
        INSERT INTO helix_environment_connector_bindings (
          environment_binding_id,
          installation_id,
          device_id,
          room_source_binding_id,
          adapter_admission_id,
          owner_profile_id,
          room_id,
          source_id,
          world_id,
          consent_capability_ids,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $11);
      `,
      [
        environmentBindingId,
        session.installation_id,
        deviceId,
        session.approved_room_source_binding_id,
        admission.admission_id,
        session.approved_by_profile_id,
        admissionRow.room_id,
        admissionRow.source_id,
        admissionRow.world_id,
        JSON.stringify(approvedCapabilityIds),
        now.toISOString(),
      ],
    );
    await db.query(
      `
        INSERT INTO helix_environment_capability_catalog_snapshots (
          catalog_snapshot_id,
          environment_binding_id,
          catalog_hash,
          adapter_profile_id,
          adapter_profile_version,
          adapter_contract_hash,
          manifest_hash,
          capability_descriptors,
          frozen_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9);
      `,
      [
        catalogSnapshotId,
        environmentBindingId,
        catalogHash,
        admission.adapter_profile_id,
        admission.adapter_profile_version,
        admission.adapter_contract_hash,
        admission.manifest_hash,
        JSON.stringify(approvedDescriptors),
        now.toISOString(),
      ],
    );
    await db.query(
      `
        INSERT INTO helix_environment_connector_device_credentials (
          device_credential_id,
          device_id,
          token_hash,
          token_prefix,
          scopes,
          created_at,
          expires_at
        ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7);
      `,
      [
        deviceCredentialId,
        deviceId,
        credentialHash,
        deviceCredential.slice(0, 24),
        JSON.stringify(DEVICE_SCOPES),
        now.toISOString(),
        credentialExpiresAt,
      ],
    );
    await db.query(
      `
        UPDATE helix_environment_pairing_sessions
        SET status = 'claimed', claimed_at = $2, updated_at = $2
        WHERE pairing_session_id = $1;
      `,
      [session.pairing_session_id, now.toISOString()],
    );
    const catalogSnapshot: HelixEnvironmentCatalogSnapshot = {
      schema: HELIX_ENVIRONMENT_CATALOG_SNAPSHOT_SCHEMA,
      catalog_snapshot_id: catalogSnapshotId,
      catalog_hash: catalogHash,
      environment_binding_ref: environmentBindingId,
      connector_installation_ref: session.installation_id,
      device_ref: deviceId,
      adapter_profile_id: admission.adapter_profile_id,
      adapter_profile_version: admission.adapter_profile_version,
      adapter_contract_hash: admission.adapter_contract_hash,
      manifest_hash: admission.manifest_hash,
      capability_descriptors: approvedDescriptors,
      frozen_at: now.toISOString(),
      expires_at: null,
      content_role: "server_owned_capability_catalog",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
    return {
      deviceId,
      installationId: session.installation_id,
      environmentBindingId,
      catalogSnapshot,
      deviceCredential,
      deviceCredentialExpiresAt: credentialExpiresAt,
      scopes: DEVICE_SCOPES,
    };
  });
};

const projectTransportIdentity = (
  row: DeviceTransportRow,
): AuthenticatedEnvironmentConnectorDevice => {
  const admissionRow: EnvironmentAdapterAdmissionRow = {
    admission_id: row.adapter_admission_id,
    binding_id: row.room_source_binding_id,
    credential_id: row.admission_credential_id,
    producer_epoch: row.admission_producer_epoch,
    room_id: row.admission_room_id,
    source_id: row.admission_source_id,
    world_id: row.admission_world_id,
    domain_adapter: row.admission_domain_adapter,
    adapter_profile_id: row.adapter_profile_id,
    adapter_profile_version: row.adapter_profile_version,
    adapter_contract_hash: row.adapter_contract_hash,
    manifest_id: row.manifest_id,
    manifest_hash: row.manifest_hash,
    source_family: row.source_family,
    mechanics_collection_ids: row.mechanics_collection_ids,
    status: row.admission_status,
    admitted_at: row.admitted_at,
    updated_at: row.admission_updated_at,
    revoked_at: row.admission_revoked_at,
  };
  return {
    deviceCredentialId: row.device_credential_id,
    deviceId: row.device_id,
    installationId: row.installation_id,
    environmentBindingId: row.environment_binding_id,
    scopes: parseStringArray(row.scopes),
    capabilityIds: parseStringArray(row.consent_capability_ids),
    binding: {
      schema: "helix.room_source_binding.v1",
      binding_id: row.room_source_binding_id,
      room_id: row.room_id,
      owner_profile_id: row.owner_profile_id,
      source_id: row.source_id,
      world_id: row.world_id,
      domain_adapter: row.domain_adapter,
      source_label: row.source_label,
      public_ingress_base_url: "",
      scopes: parseStringArray(row.source_scopes) as HelixRoomSourceBinding["scopes"],
      status: "active",
      credential_id: row.admission_credential_id,
      token_prefix: null,
      created_at: asIso(row.created_at),
      updated_at: asIso(row.created_at),
      expires_at: asIso(row.expires_at),
      revoked_at: null,
      last_used_at: row.last_used_at ? asIso(row.last_used_at) : null,
      request_count: 0,
      execution_policy: {
        may_execute_live_actions: false,
        may_perform_read_only_probes: true,
      },
      content_role: "source_binding_not_assistant_answer",
      reentry_required: true,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    },
    admission: projectEnvironmentAdapterAdmission(admissionRow),
  };
};

export const authenticateEnvironmentConnectorDevice = async (input: {
  bearerToken: string;
  requiredScope: typeof DEVICE_SCOPES[number];
  now?: Date;
}): Promise<AuthenticatedEnvironmentConnectorDevice> => {
  const now = input.now ?? new Date();
  const tokenHash = hashPairingSecret(
    "helix_environment_connector_device_credential.v1",
    input.bearerToken,
  );
  const db = await readSharedRealtimeRoomDatabase();
  const result = await db.query<DeviceTransportRow>(
    `
      SELECT
        c.*,
        d.installation_id,
        d.device_public_key_hash,
        d.producer_epoch_ref,
        d.status AS device_status,
        eb.environment_binding_id,
        eb.status AS environment_binding_status,
        eb.room_source_binding_id,
        eb.adapter_admission_id,
        eb.owner_profile_id,
        eb.room_id,
        eb.source_id,
        eb.world_id,
        eb.consent_capability_ids,
        b.status AS binding_status,
        b.domain_adapter,
        b.source_label,
        b.scopes AS source_scopes,
        a.credential_id AS admission_credential_id,
        a.producer_epoch AS admission_producer_epoch,
        a.room_id AS admission_room_id,
        a.source_id AS admission_source_id,
        a.world_id AS admission_world_id,
        a.domain_adapter AS admission_domain_adapter,
        a.adapter_profile_id,
        a.adapter_profile_version,
        a.adapter_contract_hash,
        a.manifest_id,
        a.manifest_hash,
        a.source_family,
        a.mechanics_collection_ids,
        a.status AS admission_status,
        a.admitted_at,
        a.updated_at AS admission_updated_at,
        a.revoked_at AS admission_revoked_at
      FROM helix_environment_connector_device_credentials c
      JOIN helix_environment_connector_devices d
        ON d.device_id = c.device_id
      JOIN helix_environment_connector_bindings eb
        ON eb.device_id = d.device_id
      JOIN helix_room_source_bindings b
        ON b.binding_id = eb.room_source_binding_id
      JOIN helix_environment_adapter_admissions a
        ON a.admission_id = eb.adapter_admission_id
      JOIN helix_room_source_credentials rc
        ON rc.credential_id = a.credential_id
        AND rc.status = 'active'
        AND rc.expires_at > $2
      WHERE c.token_hash = $1
      LIMIT 1;
    `,
    [tokenHash, now.toISOString()],
  );
  const row = result.rows[0];
  if (!row) {
    throw new EnvironmentConnectorPairingError(
      "device_credential_invalid",
      401,
      "The device credential is invalid.",
    );
  }
  if (
    row.status !== "active" ||
    row.device_status !== "active" ||
    row.environment_binding_status !== "active" ||
    row.binding_status !== "active" ||
    row.admission_status !== "active"
  ) {
    throw new EnvironmentConnectorPairingError(
      "device_revoked",
      403,
      "The device, environment binding, or adapter admission is revoked.",
    );
  }
  if (new Date(row.expires_at).getTime() <= now.getTime()) {
    await db.query(
      `
        UPDATE helix_environment_connector_device_credentials
        SET status = 'expired'
        WHERE device_credential_id = $1 AND status = 'active';
      `,
      [row.device_credential_id],
    );
    throw new EnvironmentConnectorPairingError(
      "device_credential_expired",
      401,
      "The device credential has expired.",
    );
  }
  const scopes = parseStringArray(row.scopes);
  if (!scopes.includes(input.requiredScope)) {
    throw new EnvironmentConnectorPairingError(
      "device_credential_invalid",
      403,
      "The device credential lacks the required transport scope.",
    );
  }
  await db.query(
    `
      UPDATE helix_environment_connector_device_credentials
      SET last_used_at = $2
      WHERE device_credential_id = $1;
    `,
    [row.device_credential_id, now.toISOString()],
  );
  await db.query(
    `
      UPDATE helix_environment_connector_devices
      SET health_status = 'online', last_contact_at = $2, updated_at = $2
      WHERE device_id = $1;
    `,
    [row.device_id, now.toISOString()],
  );
  return projectTransportIdentity(row);
};

const issueReplacementDeviceCredential = async (
  db: Queryable,
  input: { deviceId: string; now: Date },
): Promise<{ credential: string; expiresAt: string }> => {
  const credential = `helix_env_device_${crypto
    .randomBytes(32)
    .toString("base64url")}`;
  const expiresAt = new Date(
    input.now.getTime() + DEVICE_CREDENTIAL_TTL_MS,
  ).toISOString();
  await db.query(
    `
      UPDATE helix_environment_connector_device_credentials
      SET status = 'revoked', revoked_at = $2
      WHERE device_id = $1 AND status = 'active';
    `,
    [input.deviceId, input.now.toISOString()],
  );
  const id = randomId("connector_device_credential");
  await db.query(
    `
      INSERT INTO helix_environment_connector_device_credentials (
        device_credential_id,
        device_id,
        token_hash,
        token_prefix,
        scopes,
        created_at,
        expires_at
      ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7);
    `,
    [
      id,
      input.deviceId,
      hashPairingSecret(
        "helix_environment_connector_device_credential.v1",
        credential,
      ),
      credential.slice(0, 24),
      JSON.stringify(DEVICE_SCOPES),
      input.now.toISOString(),
      expiresAt,
    ],
  );
  await db.query(
    `
      UPDATE helix_environment_connector_devices
      SET credential_ref = $2, updated_at = $3
      WHERE device_id = $1;
    `,
    [input.deviceId, id, input.now.toISOString()],
  );
  return { credential, expiresAt };
};

export const rotateEnvironmentConnectorDeviceCredential = async (input: {
  ownerProfileId: string;
  deviceId: string;
  now?: Date;
}): Promise<{ credential: string; expiresAt: string }> =>
  withSharedRealtimeRoomTransaction(async (db: Queryable) => {
    const allowed = await db.query<{ device_id: string }>(
      `
        SELECT d.device_id
        FROM helix_environment_connector_devices d
        JOIN helix_environment_connector_installations i
          ON i.installation_id = d.installation_id
        WHERE d.device_id = $1
          AND i.owner_profile_id = $2
          AND d.status = 'active'
          AND i.status = 'active'
        LIMIT 1
        FOR UPDATE;
      `,
      [input.deviceId, input.ownerProfileId],
    );
    if (!allowed.rows[0]) {
      throw new EnvironmentConnectorPairingError(
        "pairing_room_forbidden",
        404,
        "The active paired device is not owned by this account.",
      );
    }
    return issueReplacementDeviceCredential(db, {
      deviceId: input.deviceId,
      now: input.now ?? new Date(),
    });
  });

export const revokeEnvironmentConnectorDevice = async (input: {
  ownerProfileId: string;
  deviceId: string;
  now?: Date;
}): Promise<void> => {
  const now = input.now ?? new Date();
  await withSharedRealtimeRoomTransaction(async (db: Queryable) => {
    const allowed = await db.query<{ device_id: string }>(
      `
        SELECT d.device_id
        FROM helix_environment_connector_devices d
        JOIN helix_environment_connector_installations i
          ON i.installation_id = d.installation_id
        WHERE d.device_id = $1
          AND i.owner_profile_id = $2
        LIMIT 1
        FOR UPDATE;
      `,
      [input.deviceId, input.ownerProfileId],
    );
    if (!allowed.rows[0]) {
      throw new EnvironmentConnectorPairingError(
        "pairing_room_forbidden",
        404,
        "The paired device is not owned by this account.",
      );
    }
    await db.query(
      `
        UPDATE helix_environment_connector_device_credentials
        SET status = 'revoked', revoked_at = $2
        WHERE device_id = $1 AND status = 'active';
      `,
      [input.deviceId, now.toISOString()],
    );
    await db.query(
      `
        UPDATE helix_environment_connector_bindings
        SET status = 'revoked', revoked_at = $2, updated_at = $2
        WHERE device_id = $1 AND status = 'active';
      `,
      [input.deviceId, now.toISOString()],
    );
    await db.query(
      `
        UPDATE helix_environment_connector_devices
        SET status = 'revoked',
            health_status = 'offline',
            revoked_at = $2,
            updated_at = $2
        WHERE device_id = $1;
      `,
      [input.deviceId, now.toISOString()],
    );
  });
};
