import type { HelixAccountType } from "../helix-account-session";
import { computeCasimirSpecValueSha256V1 } from "./casimir-spec-scientific-claim-ir.v1";

export const HELIX_RUNTIME_TOOL_CONFIRMATION_REQUEST_SCHEMA =
  "helix.runtime_tool_confirmation_request/v1" as const;
export const HELIX_RUNTIME_TOOL_CONFIRMATION_RECEIPT_SCHEMA =
  "helix.runtime_tool_confirmation_receipt/v1" as const;

export const HELIX_RUNTIME_TOOL_CONFIRMATION_AUDIENCE =
  "casimirbot.workstation_tool_gateway" as const;
export const HELIX_RUNTIME_TOOL_CONFIRMATION_SIGNATURE_MESSAGE_DOMAIN =
  "helix.runtime_tool_confirmation_signature_message/v1" as const;

const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export type HelixRuntimeToolConfirmationBindingV1 = {
  capabilityId: string;
  planId: string;
  accountType: HelixAccountType;
  profileId: string;
  sessionId: string;
  turnId: string;
  sealedInputSha256: string;
};

export type HelixRuntimeToolConfirmationRequestV1 = {
  schema: typeof HELIX_RUNTIME_TOOL_CONFIRMATION_REQUEST_SCHEMA;
  requestId: string;
  issuedAt: string;
  expiresAt: string;
  oneTime: true;
  binding: HelixRuntimeToolConfirmationBindingV1;
  bindingSha256: string;
  requestSha256: string;
};

export type HelixRuntimeToolConfirmationReceiptV1 = {
  schema: typeof HELIX_RUNTIME_TOOL_CONFIRMATION_RECEIPT_SCHEMA;
  receiptId: string;
  request: HelixRuntimeToolConfirmationRequestV1;
  decision: "approved";
  decisionSource: "explicit_user";
  issuer: string;
  audience: typeof HELIX_RUNTIME_TOOL_CONFIRMATION_AUDIENCE;
  keyId: string;
  approvedAt: string;
  signedPayloadSha256: string;
  signature: string;
  artifactSha256: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && Boolean(value.trim());

const isCanonicalIsoTimestamp = (value: unknown): value is string => {
  if (!isNonEmptyString(value)) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
};

const hasExactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === [...expected].sort()[index])
  );
};

export async function computeHelixRuntimeToolConfirmationBindingSha256V1(
  binding: HelixRuntimeToolConfirmationBindingV1,
): Promise<string> {
  return computeCasimirSpecValueSha256V1({
    domain: "helix-runtime-tool-confirmation-binding/v1",
    binding,
  });
}

export async function computeHelixRuntimeToolConfirmationRequestSha256V1(
  request: Omit<HelixRuntimeToolConfirmationRequestV1, "requestSha256">,
): Promise<string> {
  return computeCasimirSpecValueSha256V1({
    domain: "helix-runtime-tool-confirmation-request/v1",
    request,
  });
}

export async function computeHelixRuntimeToolConfirmationSignedPayloadSha256V1(
  receipt: Omit<
    HelixRuntimeToolConfirmationReceiptV1,
    "signedPayloadSha256" | "signature" | "artifactSha256"
  >,
): Promise<string> {
  return computeCasimirSpecValueSha256V1({
    domain: "helix-runtime-tool-confirmation-signed-payload/v1",
    receipt,
  });
}

/**
 * Returns the exact bytes a trusted runtime signs for a confirmation receipt.
 *
 * Signing a domain-separated ASCII envelope around the canonical lowercase
 * payload digest prevents the same signature from being reused by another
 * protocol while keeping private signing material outside this shared
 * contract.
 */
export function buildHelixRuntimeToolConfirmationSignatureMessageV1(
  signedPayloadSha256: string,
): Uint8Array {
  if (!SHA256_PATTERN.test(signedPayloadSha256)) {
    throw new TypeError(
      "helix runtime tool confirmation signing requires a canonical lowercase sha256 digest",
    );
  }
  return new TextEncoder().encode(
    `${HELIX_RUNTIME_TOOL_CONFIRMATION_SIGNATURE_MESSAGE_DOMAIN}\nsha256:${signedPayloadSha256}\n`,
  );
}

export async function computeHelixRuntimeToolConfirmationReceiptArtifactSha256V1(
  receipt: Omit<HelixRuntimeToolConfirmationReceiptV1, "artifactSha256">,
): Promise<string> {
  return computeCasimirSpecValueSha256V1({
    domain: "helix-runtime-tool-confirmation-receipt/v1",
    receipt,
  });
}

export function validateHelixRuntimeToolConfirmationRequestV1(
  value: unknown,
): string[] {
  if (!isRecord(value))
    return ["confirmation_request_invalid:$:object_required"];
  const issues: string[] = [];
  if (
    !hasExactKeys(value, [
      "schema",
      "requestId",
      "issuedAt",
      "expiresAt",
      "oneTime",
      "binding",
      "bindingSha256",
      "requestSha256",
    ])
  ) {
    issues.push("confirmation_request_invalid:$:unexpected_or_missing_fields");
  }
  if (value.schema !== HELIX_RUNTIME_TOOL_CONFIRMATION_REQUEST_SCHEMA) {
    issues.push("confirmation_request_invalid:$.schema:unexpected_schema");
  }
  for (const field of [
    "requestId",
    "bindingSha256",
    "requestSha256",
  ] as const) {
    if (!isNonEmptyString(value[field])) {
      issues.push(`confirmation_request_invalid:$.${field}:required`);
    }
  }
  if (
    isNonEmptyString(value.bindingSha256) &&
    !SHA256_PATTERN.test(value.bindingSha256)
  ) {
    issues.push("confirmation_request_invalid:$.bindingSha256:sha256_required");
  }
  if (
    isNonEmptyString(value.requestSha256) &&
    !SHA256_PATTERN.test(value.requestSha256)
  ) {
    issues.push("confirmation_request_invalid:$.requestSha256:sha256_required");
  }
  if (!isCanonicalIsoTimestamp(value.issuedAt)) {
    issues.push(
      "confirmation_request_invalid:$.issuedAt:canonical_iso_required",
    );
  }
  if (!isCanonicalIsoTimestamp(value.expiresAt)) {
    issues.push(
      "confirmation_request_invalid:$.expiresAt:canonical_iso_required",
    );
  }
  if (value.oneTime !== true) {
    issues.push("confirmation_request_invalid:$.oneTime:true_required");
  }
  if (!isRecord(value.binding)) {
    issues.push("confirmation_request_invalid:$.binding:object_required");
  } else {
    const binding = value.binding;
    if (
      !hasExactKeys(binding, [
        "capabilityId",
        "planId",
        "accountType",
        "profileId",
        "sessionId",
        "turnId",
        "sealedInputSha256",
      ])
    ) {
      issues.push(
        "confirmation_request_invalid:$.binding:unexpected_or_missing_fields",
      );
    }
    for (const field of [
      "capabilityId",
      "planId",
      "profileId",
      "sessionId",
      "turnId",
      "sealedInputSha256",
    ] as const) {
      if (!isNonEmptyString(binding[field])) {
        issues.push(`confirmation_request_invalid:$.binding.${field}:required`);
      }
    }
    if (binding.accountType !== "developer" && binding.accountType !== "user") {
      issues.push(
        "confirmation_request_invalid:$.binding.accountType:unexpected_account_type",
      );
    }
    if (
      isNonEmptyString(binding.sealedInputSha256) &&
      !SHA256_PATTERN.test(binding.sealedInputSha256)
    ) {
      issues.push(
        "confirmation_request_invalid:$.binding.sealedInputSha256:sha256_required",
      );
    }
  }
  return issues;
}

export function validateHelixRuntimeToolConfirmationReceiptV1(
  value: unknown,
): string[] {
  if (!isRecord(value))
    return ["confirmation_receipt_invalid:$:object_required"];
  const issues: string[] = [];
  if (
    !hasExactKeys(value, [
      "schema",
      "receiptId",
      "request",
      "decision",
      "decisionSource",
      "issuer",
      "audience",
      "keyId",
      "approvedAt",
      "signedPayloadSha256",
      "signature",
      "artifactSha256",
    ])
  ) {
    issues.push("confirmation_receipt_invalid:$:unexpected_or_missing_fields");
  }
  if (value.schema !== HELIX_RUNTIME_TOOL_CONFIRMATION_RECEIPT_SCHEMA) {
    issues.push("confirmation_receipt_invalid:$.schema:unexpected_schema");
  }
  for (const field of [
    "receiptId",
    "issuer",
    "keyId",
    "signedPayloadSha256",
    "signature",
    "artifactSha256",
  ] as const) {
    if (!isNonEmptyString(value[field])) {
      issues.push(`confirmation_receipt_invalid:$.${field}:required`);
    }
  }
  for (const field of ["signedPayloadSha256", "artifactSha256"] as const) {
    if (isNonEmptyString(value[field]) && !SHA256_PATTERN.test(value[field])) {
      issues.push(`confirmation_receipt_invalid:$.${field}:sha256_required`);
    }
  }
  if (value.decision !== "approved") {
    issues.push("confirmation_receipt_invalid:$.decision:approved_required");
  }
  if (value.decisionSource !== "explicit_user") {
    issues.push(
      "confirmation_receipt_invalid:$.decisionSource:explicit_user_required",
    );
  }
  if (value.audience !== HELIX_RUNTIME_TOOL_CONFIRMATION_AUDIENCE) {
    issues.push("confirmation_receipt_invalid:$.audience:unexpected_audience");
  }
  if (!isCanonicalIsoTimestamp(value.approvedAt)) {
    issues.push(
      "confirmation_receipt_invalid:$.approvedAt:canonical_iso_required",
    );
  }
  issues.push(...validateHelixRuntimeToolConfirmationRequestV1(value.request));
  return issues;
}

export async function validateHelixRuntimeToolConfirmationReceiptIntegrityV1(
  value: unknown,
): Promise<string[]> {
  const issues = validateHelixRuntimeToolConfirmationReceiptV1(value);
  if (issues.length > 0) return issues;
  const receipt = value as HelixRuntimeToolConfirmationReceiptV1;
  const expectedBindingSha256 =
    await computeHelixRuntimeToolConfirmationBindingSha256V1(
      receipt.request.binding,
    );
  if (expectedBindingSha256 !== receipt.request.bindingSha256) {
    issues.push("confirmation_receipt_binding_hash_mismatch");
  }
  const { requestSha256: _requestSha256, ...requestPayload } = receipt.request;
  const expectedRequestSha256 =
    await computeHelixRuntimeToolConfirmationRequestSha256V1(requestPayload);
  if (expectedRequestSha256 !== receipt.request.requestSha256) {
    issues.push("confirmation_receipt_request_hash_mismatch");
  }
  const {
    signedPayloadSha256: _signedPayloadSha256,
    signature: _signature,
    artifactSha256: _artifactSha256,
    ...signedPayload
  } = receipt;
  const expectedSignedPayloadSha256 =
    await computeHelixRuntimeToolConfirmationSignedPayloadSha256V1(
      signedPayload,
    );
  if (expectedSignedPayloadSha256 !== receipt.signedPayloadSha256) {
    issues.push("confirmation_receipt_signed_payload_hash_mismatch");
  }
  const { artifactSha256: _artifact, ...artifactPayload } = receipt;
  const expectedArtifactSha256 =
    await computeHelixRuntimeToolConfirmationReceiptArtifactSha256V1(
      artifactPayload,
    );
  if (expectedArtifactSha256 !== receipt.artifactSha256) {
    issues.push("confirmation_receipt_artifact_hash_mismatch");
  }
  return issues;
}
