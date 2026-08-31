import type { HelixAccountType } from "../helix-account-session";
import { computeCasimirSpecValueSha256V1 } from "./casimir-spec-scientific-claim-ir.v1";

export const HELIX_SHARED_LIVE_ROOM_MCP_DELEGATION_REQUEST_SCHEMA =
  "helix.shared_live_room_mcp_delegation_request/v1" as const;
export const HELIX_SHARED_LIVE_ROOM_MCP_DELEGATION_RECEIPT_SCHEMA =
  "helix.shared_live_room_mcp_delegation_receipt/v1" as const;
export const HELIX_SHARED_LIVE_ROOM_MCP_DELEGATION_AUDIENCE =
  "casimirbot.shared_live_room_mcp" as const;
export const HELIX_SHARED_LIVE_ROOM_MCP_DELEGATION_SIGNATURE_MESSAGE_DOMAIN =
  "helix.shared_live_room_mcp_delegation_signature_message/v1" as const;

export const HELIX_SHARED_LIVE_ROOM_MCP_DELEGATED_CAPABILITIES = [
  "room.consent.grant",
  "room.floor.acquire",
] as const;
export type HelixSharedLiveRoomMcpDelegatedCapability =
  (typeof HELIX_SHARED_LIVE_ROOM_MCP_DELEGATED_CAPABILITIES)[number];

export type HelixSharedLiveRoomMcpDelegationBindingV1 = {
  capabilityId: HelixSharedLiveRoomMcpDelegatedCapability;
  accountType: HelixAccountType;
  profileId: string;
  accountSessionId: string;
  authenticatedMcpClientRef: string;
  conversationThreadRef: string;
  roomId: string;
  sealedInputSha256: string;
};

export type HelixSharedLiveRoomMcpDelegationRequestV1 = {
  schema: typeof HELIX_SHARED_LIVE_ROOM_MCP_DELEGATION_REQUEST_SCHEMA;
  requestId: string;
  issuedAt: string;
  expiresAt: string;
  oneTime: true;
  binding: HelixSharedLiveRoomMcpDelegationBindingV1;
  bindingSha256: string;
  requestSha256: string;
};

export type HelixSharedLiveRoomMcpDelegationReceiptV1 = {
  schema: typeof HELIX_SHARED_LIVE_ROOM_MCP_DELEGATION_RECEIPT_SCHEMA;
  receiptId: string;
  request: HelixSharedLiveRoomMcpDelegationRequestV1;
  decision: "delegated";
  decisionSource: "explicit_user";
  issuer: string;
  audience: typeof HELIX_SHARED_LIVE_ROOM_MCP_DELEGATION_AUDIENCE;
  keyId: string;
  delegatedAt: string;
  signedPayloadSha256: string;
  signature: string;
  artifactSha256: string;
};

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const nonEmpty = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value === value.trim();
const canonicalIso = (value: unknown): value is string => {
  if (!nonEmpty(value)) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
};
const exactKeys = (value: Record<string, unknown>, expected: readonly string[]) => {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
};

export const computeHelixSharedLiveRoomMcpDelegationBindingSha256V1 = (
  binding: HelixSharedLiveRoomMcpDelegationBindingV1,
): Promise<string> => computeCasimirSpecValueSha256V1({
  domain: "helix-shared-live-room-mcp-delegation-binding/v1",
  binding,
});

export const computeHelixSharedLiveRoomMcpDelegationSealedInputSha256V1 = (
  capabilityId: HelixSharedLiveRoomMcpDelegatedCapability,
  request: unknown,
): Promise<string> => computeCasimirSpecValueSha256V1({
  domain: "helix-shared-live-room-mcp-delegation-sealed-input/v1",
  capabilityId,
  request,
});

export const computeHelixSharedLiveRoomMcpDelegationRequestSha256V1 = (
  request: Omit<HelixSharedLiveRoomMcpDelegationRequestV1, "requestSha256">,
): Promise<string> => computeCasimirSpecValueSha256V1({
  domain: "helix-shared-live-room-mcp-delegation-request/v1",
  request,
});

export const computeHelixSharedLiveRoomMcpDelegationSignedPayloadSha256V1 = (
  receipt: Omit<HelixSharedLiveRoomMcpDelegationReceiptV1, "signedPayloadSha256" | "signature" | "artifactSha256">,
): Promise<string> => computeCasimirSpecValueSha256V1({
  domain: "helix-shared-live-room-mcp-delegation-signed-payload/v1",
  receipt,
});

export const buildHelixSharedLiveRoomMcpDelegationSignatureMessageV1 = (
  signedPayloadSha256: string,
): Uint8Array => {
  if (!SHA256_PATTERN.test(signedPayloadSha256)) {
    throw new TypeError("room MCP delegation signing requires a canonical lowercase sha256 digest");
  }
  return new TextEncoder().encode(
    `${HELIX_SHARED_LIVE_ROOM_MCP_DELEGATION_SIGNATURE_MESSAGE_DOMAIN}\nsha256:${signedPayloadSha256}\n`,
  );
};

export const computeHelixSharedLiveRoomMcpDelegationArtifactSha256V1 = (
  receipt: Omit<HelixSharedLiveRoomMcpDelegationReceiptV1, "artifactSha256">,
): Promise<string> => computeCasimirSpecValueSha256V1({
  domain: "helix-shared-live-room-mcp-delegation-receipt/v1",
  receipt,
});

export function validateHelixSharedLiveRoomMcpDelegationReceiptV1(value: unknown): string[] {
  if (!isRecord(value)) return ["room_mcp_delegation_invalid:$:object_required"];
  const issues: string[] = [];
  if (!exactKeys(value, ["schema", "receiptId", "request", "decision", "decisionSource", "issuer", "audience", "keyId", "delegatedAt", "signedPayloadSha256", "signature", "artifactSha256"])) {
    issues.push("room_mcp_delegation_invalid:$:unexpected_or_missing_fields");
  }
  if (value.schema !== HELIX_SHARED_LIVE_ROOM_MCP_DELEGATION_RECEIPT_SCHEMA) issues.push("room_mcp_delegation_invalid:$.schema:unexpected_schema");
  for (const field of ["receiptId", "issuer", "keyId", "signedPayloadSha256", "signature", "artifactSha256"] as const) {
    if (!nonEmpty(value[field])) issues.push(`room_mcp_delegation_invalid:$.${field}:required`);
  }
  for (const field of ["signedPayloadSha256", "artifactSha256"] as const) {
    if (nonEmpty(value[field]) && !SHA256_PATTERN.test(value[field])) issues.push(`room_mcp_delegation_invalid:$.${field}:sha256_required`);
  }
  if (value.decision !== "delegated") issues.push("room_mcp_delegation_invalid:$.decision:delegated_required");
  if (value.decisionSource !== "explicit_user") issues.push("room_mcp_delegation_invalid:$.decisionSource:explicit_user_required");
  if (value.audience !== HELIX_SHARED_LIVE_ROOM_MCP_DELEGATION_AUDIENCE) issues.push("room_mcp_delegation_invalid:$.audience:unexpected_audience");
  if (!canonicalIso(value.delegatedAt)) issues.push("room_mcp_delegation_invalid:$.delegatedAt:canonical_iso_required");
  if (!isRecord(value.request)) return [...issues, "room_mcp_delegation_invalid:$.request:object_required"];
  const request = value.request;
  if (!exactKeys(request, ["schema", "requestId", "issuedAt", "expiresAt", "oneTime", "binding", "bindingSha256", "requestSha256"])) issues.push("room_mcp_delegation_invalid:$.request:unexpected_or_missing_fields");
  if (request.schema !== HELIX_SHARED_LIVE_ROOM_MCP_DELEGATION_REQUEST_SCHEMA) issues.push("room_mcp_delegation_invalid:$.request.schema:unexpected_schema");
  for (const field of ["requestId", "bindingSha256", "requestSha256"] as const) {
    if (!nonEmpty(request[field])) issues.push(`room_mcp_delegation_invalid:$.request.${field}:required`);
  }
  for (const field of ["bindingSha256", "requestSha256"] as const) {
    if (nonEmpty(request[field]) && !SHA256_PATTERN.test(request[field])) issues.push(`room_mcp_delegation_invalid:$.request.${field}:sha256_required`);
  }
  if (!canonicalIso(request.issuedAt)) issues.push("room_mcp_delegation_invalid:$.request.issuedAt:canonical_iso_required");
  if (!canonicalIso(request.expiresAt)) issues.push("room_mcp_delegation_invalid:$.request.expiresAt:canonical_iso_required");
  if (request.oneTime !== true) issues.push("room_mcp_delegation_invalid:$.request.oneTime:true_required");
  if (!isRecord(request.binding)) return [...issues, "room_mcp_delegation_invalid:$.request.binding:object_required"];
  const binding = request.binding;
  if (!exactKeys(binding, ["capabilityId", "accountType", "profileId", "accountSessionId", "authenticatedMcpClientRef", "conversationThreadRef", "roomId", "sealedInputSha256"])) issues.push("room_mcp_delegation_invalid:$.request.binding:unexpected_or_missing_fields");
  for (const field of ["profileId", "accountSessionId", "authenticatedMcpClientRef", "conversationThreadRef", "roomId", "sealedInputSha256"] as const) {
    if (!nonEmpty(binding[field])) issues.push(`room_mcp_delegation_invalid:$.request.binding.${field}:required`);
  }
  if (!(HELIX_SHARED_LIVE_ROOM_MCP_DELEGATED_CAPABILITIES as readonly unknown[]).includes(binding.capabilityId)) issues.push("room_mcp_delegation_invalid:$.request.binding.capabilityId:unsupported");
  if (binding.accountType !== "developer" && binding.accountType !== "user") issues.push("room_mcp_delegation_invalid:$.request.binding.accountType:unexpected_account_type");
  if (nonEmpty(binding.sealedInputSha256) && !SHA256_PATTERN.test(binding.sealedInputSha256)) issues.push("room_mcp_delegation_invalid:$.request.binding.sealedInputSha256:sha256_required");
  return issues;
}

export async function validateHelixSharedLiveRoomMcpDelegationIntegrityV1(value: unknown): Promise<string[]> {
  const issues = validateHelixSharedLiveRoomMcpDelegationReceiptV1(value);
  if (issues.length) return issues;
  const receipt = value as HelixSharedLiveRoomMcpDelegationReceiptV1;
  if (await computeHelixSharedLiveRoomMcpDelegationBindingSha256V1(receipt.request.binding) !== receipt.request.bindingSha256) issues.push("room_mcp_delegation_binding_hash_mismatch");
  const { requestSha256: _requestSha256, ...requestPayload } = receipt.request;
  if (await computeHelixSharedLiveRoomMcpDelegationRequestSha256V1(requestPayload) !== receipt.request.requestSha256) issues.push("room_mcp_delegation_request_hash_mismatch");
  const { signedPayloadSha256: _signed, signature: _signature, artifactSha256: _artifact, ...signedPayload } = receipt;
  if (await computeHelixSharedLiveRoomMcpDelegationSignedPayloadSha256V1(signedPayload) !== receipt.signedPayloadSha256) issues.push("room_mcp_delegation_signed_payload_hash_mismatch");
  const { artifactSha256: _artifactHash, ...artifactPayload } = receipt;
  if (await computeHelixSharedLiveRoomMcpDelegationArtifactSha256V1(artifactPayload) !== receipt.artifactSha256) issues.push("room_mcp_delegation_artifact_hash_mismatch");
  return issues;
}
