import { describe, expect, it } from "vitest";

import {
  HELIX_RUNTIME_TOOL_CONFIRMATION_AUDIENCE,
  HELIX_RUNTIME_TOOL_CONFIRMATION_RECEIPT_SCHEMA,
  HELIX_RUNTIME_TOOL_CONFIRMATION_REQUEST_SCHEMA,
  HELIX_RUNTIME_TOOL_CONFIRMATION_SIGNATURE_MESSAGE_DOMAIN,
  buildHelixRuntimeToolConfirmationSignatureMessageV1,
  computeHelixRuntimeToolConfirmationBindingSha256V1,
  computeHelixRuntimeToolConfirmationReceiptArtifactSha256V1,
  computeHelixRuntimeToolConfirmationRequestSha256V1,
  computeHelixRuntimeToolConfirmationSignedPayloadSha256V1,
  validateHelixRuntimeToolConfirmationReceiptIntegrityV1,
  type HelixRuntimeToolConfirmationBindingV1,
  type HelixRuntimeToolConfirmationReceiptV1,
} from "../helix-runtime-tool-confirmation.v1";

async function receiptFixture(): Promise<HelixRuntimeToolConfirmationReceiptV1> {
  const binding: HelixRuntimeToolConfirmationBindingV1 = {
    capabilityId: "theory-formal-verifier.start",
    planId: "formal-plan:test",
    accountType: "developer",
    profileId: "profile:test",
    sessionId: "session:test",
    turnId: "ask:test",
    sealedInputSha256: "a".repeat(64),
  };
  const requestPayload = {
    schema: HELIX_RUNTIME_TOOL_CONFIRMATION_REQUEST_SCHEMA,
    requestId: "confirmation-request:test",
    issuedAt: "2026-07-25T00:00:00.000Z",
    expiresAt: "2026-07-25T00:05:00.000Z",
    oneTime: true as const,
    binding,
    bindingSha256:
      await computeHelixRuntimeToolConfirmationBindingSha256V1(binding),
  };
  const request = {
    ...requestPayload,
    requestSha256:
      await computeHelixRuntimeToolConfirmationRequestSha256V1(requestPayload),
  };
  const signedPayload = {
    schema: HELIX_RUNTIME_TOOL_CONFIRMATION_RECEIPT_SCHEMA,
    receiptId: "confirmation-receipt:test",
    request,
    decision: "approved" as const,
    decisionSource: "explicit_user" as const,
    issuer: "codex-runtime:test",
    audience: HELIX_RUNTIME_TOOL_CONFIRMATION_AUDIENCE,
    keyId: "key:test",
    approvedAt: "2026-07-25T00:00:01.000Z",
  };
  const receiptWithoutArtifact = {
    ...signedPayload,
    signedPayloadSha256:
      await computeHelixRuntimeToolConfirmationSignedPayloadSha256V1(
        signedPayload,
      ),
    signature: "opaque-runtime-signature",
  };
  return {
    ...receiptWithoutArtifact,
    artifactSha256:
      await computeHelixRuntimeToolConfirmationReceiptArtifactSha256V1(
        receiptWithoutArtifact,
      ),
  };
}

describe("runtime tool confirmation receipt contract", () => {
  it("builds one exact domain-separated signing message from a canonical digest", () => {
    const digest = "a".repeat(64);
    expect(
      new TextDecoder().decode(
        buildHelixRuntimeToolConfirmationSignatureMessageV1(digest),
      ),
    ).toBe(
      `${HELIX_RUNTIME_TOOL_CONFIRMATION_SIGNATURE_MESSAGE_DOMAIN}\nsha256:${digest}\n`,
    );
    expect(() =>
      buildHelixRuntimeToolConfirmationSignatureMessageV1("A".repeat(64)),
    ).toThrow(/canonical lowercase sha256/);
  });

  it("binds an explicit one-time receipt to capability, plan, owner, session, turn, and sealed input", async () => {
    const receipt = await receiptFixture();

    expect(
      await validateHelixRuntimeToolConfirmationReceiptIntegrityV1(receipt),
    ).toEqual([]);
    expect(receipt.request).toMatchObject({
      oneTime: true,
      binding: {
        capabilityId: "theory-formal-verifier.start",
        planId: "formal-plan:test",
        accountType: "developer",
        profileId: "profile:test",
        sessionId: "session:test",
        turnId: "ask:test",
        sealedInputSha256: "a".repeat(64),
      },
    });
  });

  it("detects request and receipt substitution independently of runtime signature verification", async () => {
    const receipt = await receiptFixture();
    const tampered = {
      ...receipt,
      request: {
        ...receipt.request,
        binding: {
          ...receipt.request.binding,
          turnId: "ask:substituted",
        },
      },
    };

    expect(
      await validateHelixRuntimeToolConfirmationReceiptIntegrityV1(tampered),
    ).toEqual(
      expect.arrayContaining([
        "confirmation_receipt_binding_hash_mismatch",
        "confirmation_receipt_signed_payload_hash_mismatch",
        "confirmation_receipt_artifact_hash_mismatch",
      ]),
    );
  });
});
