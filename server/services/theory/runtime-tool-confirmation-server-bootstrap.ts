import { createPublicKey } from "node:crypto";
import type { Pool } from "pg";

import { installSharedLiveRoomGatewayConfirmationDependenciesForServerV1 } from "../helix-ask/workstation-tool-gateway/shared-live-room";
import { createPostgresTrustedRuntimeToolConfirmationReplayLedgerV1 } from "./runtime-tool-confirmation-postgres-replay-ledger";
import {
  installCasimirTheoryExecutionRuntimeApprovalDependenciesForServerV1,
  installCasimirTheoryExecutionStateDependenciesForServerV1,
} from "./casimir-theory-execution-server-composition";
import { createPostgresCasimirTheoryExecutionStateStoreV1 } from "./casimir-theory-execution-state-store";
import {
  createTrustedRuntimeToolConfirmationEd25519VerifierV1,
  type TrustedRuntimeToolConfirmationPublicKeyV1,
} from "./runtime-tool-confirmation-public-key-verifier";

export const HELIX_RUNTIME_APPROVAL_TRUSTED_PUBLIC_KEYS_ENV =
  "HELIX_RUNTIME_APPROVAL_TRUSTED_PUBLIC_KEYS_JSON" as const;

const MAX_REGISTRY_BYTES = 64 * 1024;
const MAX_TRUSTED_KEYS = 32;
const MAX_ISSUER_LENGTH = 2_048;
const MAX_KEY_ID_LENGTH = 256;
const MAX_PUBLIC_KEY_PEM_LENGTH = 16 * 1024;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f-\u009f]/;
const EXACT_KEY_FIELDS = [
  "algorithm",
  "issuer",
  "keyId",
  "publicKeyPem",
] as const;

export class RuntimeToolConfirmationServerBootstrapError extends Error {
  readonly code = "runtime_approval_trusted_key_config_invalid";

  constructor(readonly issue: string) {
    super(
      `Trusted runtime approval verifier configuration is invalid (${issue}).`,
    );
    this.name = "RuntimeToolConfirmationServerBootstrapError";
  }
}

const invalid = (issue: string): never => {
  throw new RuntimeToolConfirmationServerBootstrapError(issue);
};

const boundedIdentity = (value: unknown, maxLength: number): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= maxLength &&
  value === value.trim() &&
  !CONTROL_CHARACTER_PATTERN.test(value);

const parseTrustedPublicKeys = (
  rawConfig: string,
): TrustedRuntimeToolConfirmationPublicKeyV1[] => {
  if (Buffer.byteLength(rawConfig, "utf8") > MAX_REGISTRY_BYTES) {
    invalid("registry_too_large");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawConfig);
  } catch {
    invalid("json_invalid");
  }
  if (!Array.isArray(parsed)) return invalid("array_required");
  const parsedEntries: unknown[] = parsed;
  if (parsedEntries.length === 0) invalid("at_least_one_key_required");
  if (parsedEntries.length > MAX_TRUSTED_KEYS) invalid("too_many_keys");

  const seen = new Set<string>();
  return parsedEntries.map((rawEntry: unknown, index: number) => {
    if (!rawEntry || typeof rawEntry !== "object" || Array.isArray(rawEntry)) {
      return invalid(`entry_${index}_object_required`);
    }
    const entry = rawEntry as Record<string, unknown>;
    const actualFields = Object.keys(entry).sort();
    const expectedFields = [...EXACT_KEY_FIELDS].sort();
    if (
      actualFields.length !== expectedFields.length ||
      !actualFields.every(
        (field, fieldIndex) => field === expectedFields[fieldIndex],
      )
    ) {
      return invalid(`entry_${index}_unexpected_or_missing_fields`);
    }
    if (!boundedIdentity(entry.issuer, MAX_ISSUER_LENGTH)) {
      return invalid(`entry_${index}_issuer_invalid`);
    }
    if (!boundedIdentity(entry.keyId, MAX_KEY_ID_LENGTH)) {
      return invalid(`entry_${index}_key_id_invalid`);
    }
    if (entry.algorithm !== "ed25519") {
      return invalid(`entry_${index}_algorithm_unsupported`);
    }
    if (
      typeof entry.publicKeyPem !== "string" ||
      entry.publicKeyPem.length === 0 ||
      entry.publicKeyPem.length > MAX_PUBLIC_KEY_PEM_LENGTH
    ) {
      return invalid(`entry_${index}_public_key_invalid`);
    }
    try {
      const publicKey = createPublicKey(entry.publicKeyPem);
      if (
        publicKey.type !== "public" ||
        publicKey.asymmetricKeyType !== "ed25519"
      ) {
        return invalid(`entry_${index}_public_key_type_invalid`);
      }
    } catch {
      return invalid(`entry_${index}_public_key_invalid`);
    }

    const identity = JSON.stringify([entry.issuer, entry.keyId]);
    if (seen.has(identity)) {
      return invalid(`entry_${index}_identity_duplicate`);
    }
    seen.add(identity);
    return {
      issuer: entry.issuer,
      keyId: entry.keyId,
      algorithm: "ed25519",
      publicKeyPem: entry.publicKeyPem,
    };
  });
};

export type RuntimeToolConfirmationServerBootstrapStatusV1 = {
  schema: "helix.runtime_tool_confirmation.server_bootstrap_status.v1";
  configured: boolean;
  trusted_key_count: number;
  replay_protection: "durable_postgres" | "fail_closed_unconfigured";
};

/**
 * Trusted server-composition boundary for receipt authenticity and replay
 * protection. It installs no signer, user-confirmation UI, or approval host.
 */
export const installRuntimeToolConfirmationVerifierAtServerBootstrapV1 = (
  input: {
    trustedPublicKeysJson?: string | null;
    replayPool?: Pool;
  } = {},
): RuntimeToolConfirmationServerBootstrapStatusV1 => {
  installCasimirTheoryExecutionStateDependenciesForServerV1({
    formalStateStore:
      createPostgresCasimirTheoryExecutionStateStoreV1(
        "formal_v2",
        input.replayPool,
      ),
    independentNumericalStateStore:
      createPostgresCasimirTheoryExecutionStateStoreV1(
        "independent_numerical_v1",
        input.replayPool,
      ),
  });
  const rawConfig = input.trustedPublicKeysJson?.trim() ?? "";
  if (!rawConfig) {
    installSharedLiveRoomGatewayConfirmationDependenciesForServerV1({
      requireDurableReplayProtection: true,
    });
    installCasimirTheoryExecutionRuntimeApprovalDependenciesForServerV1(
      {},
    );
    return {
      schema: "helix.runtime_tool_confirmation.server_bootstrap_status.v1",
      configured: false,
      trusted_key_count: 0,
      replay_protection: "fail_closed_unconfigured",
    };
  }

  const trustedPublicKeys = parseTrustedPublicKeys(rawConfig);
  const verifyTrustedRuntimeReceipt =
    createTrustedRuntimeToolConfirmationEd25519VerifierV1({
      trustedPublicKeys,
    });
  const confirmationReplayLedger =
    createPostgresTrustedRuntimeToolConfirmationReplayLedgerV1(
      input.replayPool,
    );
  installSharedLiveRoomGatewayConfirmationDependenciesForServerV1({
    verifyTrustedRuntimeReceipt,
    replayLedger: confirmationReplayLedger,
    requireDurableReplayProtection: true,
  });
  installCasimirTheoryExecutionRuntimeApprovalDependenciesForServerV1(
    {
      verifyTrustedRuntimeReceipt,
      confirmationReplayLedger,
    },
  );
  return {
    schema: "helix.runtime_tool_confirmation.server_bootstrap_status.v1",
    configured: true,
    trusted_key_count: trustedPublicKeys.length,
    replay_protection: "durable_postgres",
  };
};

export const installRuntimeToolConfirmationVerifierFromEnvironmentV1 =
  (): RuntimeToolConfirmationServerBootstrapStatusV1 =>
    installRuntimeToolConfirmationVerifierAtServerBootstrapV1({
      trustedPublicKeysJson:
        process.env[HELIX_RUNTIME_APPROVAL_TRUSTED_PUBLIC_KEYS_ENV],
    });
