import { generateKeyPairSync, sign, type KeyObject } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  buildHelixRuntimeToolConfirmationSignatureMessageV1,
  computeHelixRuntimeToolConfirmationReceiptArtifactSha256V1,
  computeHelixRuntimeToolConfirmationSignedPayloadSha256V1,
  type HelixRuntimeToolConfirmationReceiptV1,
} from "../../../../shared/contracts/helix-runtime-tool-confirmation.v1";
import { createRuntimeToolConfirmationReceiptVerifierV1 } from "../runtime-tool-confirmation-receipt-verifier";
import {
  createTrustedRuntimeToolConfirmationEd25519VerifierV1,
  type TrustedRuntimeToolConfirmationPublicKeyV1,
} from "../runtime-tool-confirmation-public-key-verifier";
import { buildRuntimeToolConfirmationTestReceipt } from "./runtime-tool-confirmation-fixture";

const NOW = Date.parse("2026-07-25T00:02:00.000Z");
const ISSUER = "codex-runtime:test";
const KEY_ID = "codex-runtime-key:test";

const binding = {
  capabilityId: "theory-formal-verifier.start",
  planId: "plan:test",
  accountType: "developer" as const,
  profileId: "profile:test",
  sessionId: "session:test",
  turnId: "turn:test",
  sealedInputSha256: "a".repeat(64),
};

const exportPublicKeyPem = (publicKey: KeyObject): string =>
  publicKey.export({ format: "pem", type: "spki" }).toString();

async function signedReceipt(input: {
  privateKey: KeyObject;
  issuer?: string;
  keyId?: string;
}): Promise<HelixRuntimeToolConfirmationReceiptV1> {
  const base = await buildRuntimeToolConfirmationTestReceipt({ binding });
  const {
    signedPayloadSha256: _oldSignedPayloadSha256,
    signature: _oldSignature,
    artifactSha256: _oldArtifactSha256,
    ...baseSignedPayload
  } = base;
  const signedPayload = {
    ...baseSignedPayload,
    issuer: input.issuer ?? ISSUER,
    keyId: input.keyId ?? KEY_ID,
  };
  const signedPayloadSha256 =
    await computeHelixRuntimeToolConfirmationSignedPayloadSha256V1(
      signedPayload,
    );
  const receiptWithoutArtifact = {
    ...signedPayload,
    signedPayloadSha256,
    signature: sign(
      null,
      buildHelixRuntimeToolConfirmationSignatureMessageV1(signedPayloadSha256),
      input.privateKey,
    ).toString("base64url"),
  };
  return {
    ...receiptWithoutArtifact,
    artifactSha256:
      await computeHelixRuntimeToolConfirmationReceiptArtifactSha256V1(
        receiptWithoutArtifact,
      ),
  };
}

async function withReceiptFields(
  receipt: HelixRuntimeToolConfirmationReceiptV1,
  fields: Partial<HelixRuntimeToolConfirmationReceiptV1>,
): Promise<HelixRuntimeToolConfirmationReceiptV1> {
  const next = { ...receipt, ...fields };
  const {
    signedPayloadSha256: _signedPayloadSha256,
    signature,
    artifactSha256: _artifactSha256,
    ...signedPayload
  } = next;
  const signedPayloadSha256 =
    await computeHelixRuntimeToolConfirmationSignedPayloadSha256V1(
      signedPayload,
    );
  const receiptWithoutArtifact = {
    ...signedPayload,
    signedPayloadSha256,
    signature,
  };
  return {
    ...receiptWithoutArtifact,
    artifactSha256:
      await computeHelixRuntimeToolConfirmationReceiptArtifactSha256V1(
        receiptWithoutArtifact,
      ),
  };
}

const verifierFor = (
  trustedPublicKeys: readonly TrustedRuntimeToolConfirmationPublicKeyV1[],
) =>
  createRuntimeToolConfirmationReceiptVerifierV1({
    now: () => NOW,
    verifyTrustedRuntimeReceipt:
      createTrustedRuntimeToolConfirmationEd25519VerifierV1({
        trustedPublicKeys,
      }),
  });

describe("runtime tool confirmation Ed25519 public-key verifier", () => {
  it("accepts one exact domain-separated signature from the trusted issuer and key", async () => {
    const keys = generateKeyPairSync("ed25519");
    const receipt = await signedReceipt({ privateKey: keys.privateKey });
    const verifier = verifierFor([
      {
        issuer: ISSUER,
        keyId: KEY_ID,
        algorithm: "ed25519",
        publicKeyPem: exportPublicKeyPem(keys.publicKey),
      },
    ]);

    await expect(
      verifier.consume({ receipt, expectedBinding: binding }),
    ).resolves.toMatchObject({
      ok: true,
      status: "verified",
      receiptId: receipt.receiptId,
      requestId: receipt.request.requestId,
    });
  });

  it("rejects an untrusted issuer or key ID before signature admission", async () => {
    const keys = generateKeyPairSync("ed25519");
    const otherKeys = generateKeyPairSync("ed25519");
    const trustedKey = {
      issuer: ISSUER,
      keyId: KEY_ID,
      algorithm: "ed25519" as const,
      publicKeyPem: exportPublicKeyPem(keys.publicKey),
    };

    await expect(
      verifierFor([trustedKey]).consume({
        receipt: await signedReceipt({
          privateKey: keys.privateKey,
          issuer: "codex-runtime:other",
        }),
        expectedBinding: binding,
      }),
    ).resolves.toMatchObject({
      ok: false,
      issues: ["runtime_approval_receipt_issuer_untrusted"],
    });
    await expect(
      verifierFor([trustedKey]).consume({
        receipt: await signedReceipt({
          privateKey: keys.privateKey,
          keyId: "codex-runtime-key:other",
        }),
        expectedBinding: binding,
      }),
    ).resolves.toMatchObject({
      ok: false,
      issues: ["runtime_approval_receipt_key_untrusted"],
    });
    await expect(
      verifierFor([
        {
          ...trustedKey,
          publicKeyPem: exportPublicKeyPem(otherKeys.publicKey),
        },
      ]).consume({
        receipt: await signedReceipt({ privateKey: keys.privateKey }),
        expectedBinding: binding,
      }),
    ).resolves.toMatchObject({
      ok: false,
      issues: ["runtime_approval_receipt_signature_invalid"],
    });
  });

  it("rejects unsupported algorithms, private keys, and non-Ed25519 public keys", async () => {
    const ed25519 = generateKeyPairSync("ed25519");
    const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const receipt = await signedReceipt({ privateKey: ed25519.privateKey });
    const base = {
      issuer: ISSUER,
      keyId: KEY_ID,
      publicKeyPem: exportPublicKeyPem(ed25519.publicKey),
    };

    await expect(
      verifierFor([
        {
          ...base,
          algorithm: "rsa" as "ed25519",
        },
      ]).consume({ receipt, expectedBinding: binding }),
    ).resolves.toMatchObject({
      ok: false,
      issues: ["runtime_approval_receipt_signature_algorithm_unsupported"],
    });
    await expect(
      verifierFor([
        {
          ...base,
          algorithm: "ed25519",
          publicKeyPem: ed25519.privateKey
            .export({ format: "pem", type: "pkcs8" })
            .toString(),
        },
      ]).consume({ receipt, expectedBinding: binding }),
    ).resolves.toMatchObject({
      ok: false,
      issues: ["runtime_approval_receipt_public_key_required"],
    });
    await expect(
      verifierFor([
        {
          ...base,
          algorithm: "ed25519",
          publicKeyPem: exportPublicKeyPem(rsa.publicKey),
        },
      ]).consume({ receipt, expectedBinding: binding }),
    ).resolves.toMatchObject({
      ok: false,
      issues: ["runtime_approval_receipt_public_key_type_invalid"],
    });
  });

  it("rejects noncanonical signature encoding and signed-payload tampering", async () => {
    const keys = generateKeyPairSync("ed25519");
    const receipt = await signedReceipt({ privateKey: keys.privateKey });
    const trustedKey = {
      issuer: ISSUER,
      keyId: KEY_ID,
      algorithm: "ed25519" as const,
      publicKeyPem: exportPublicKeyPem(keys.publicKey),
    };
    const padded = await withReceiptFields(receipt, {
      signature: `${receipt.signature}=`,
    });
    const tampered = await withReceiptFields(receipt, {
      approvedAt: "2026-07-25T00:00:02.000Z",
    });

    await expect(
      verifierFor([trustedKey]).consume({
        receipt: padded,
        expectedBinding: binding,
      }),
    ).resolves.toMatchObject({
      ok: false,
      issues: ["runtime_approval_receipt_signature_encoding_invalid"],
    });
    await expect(
      verifierFor([trustedKey]).consume({
        receipt: tampered,
        expectedBinding: binding,
      }),
    ).resolves.toMatchObject({
      ok: false,
      issues: ["runtime_approval_receipt_signature_invalid"],
    });
  });
});
