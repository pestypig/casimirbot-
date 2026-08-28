import crypto from "node:crypto";
import path from "node:path";
import {
  HELIX_LOCAL_SUPERVISOR_STATUS_SCHEMA,
  helixLocalSupervisorStatusSchema,
  type HelixLocalSupervisorStatus,
} from "@shared/helix-local-supervisor";
import { verifyHelixLocalSupervisorOwnershipReceipt } from
  "./local-supervisor-ownership-receipt";

const normalizeWorkspace = (workspacePath: string): string =>
  path.resolve(workspacePath).replaceAll("\\", "/").toLowerCase();

const digest = (value: string): string =>
  crypto.createHash("sha256").update(value, "utf8").digest("hex");

export const helixWorkspaceRefFor = (workspacePath: string): string =>
  `workspace:${digest(normalizeWorkspace(workspacePath))}`;

export const resolveHelixLocalSupervisorMode = (
  environment: NodeJS.ProcessEnv,
  workspacePath = process.cwd(),
  now?: Date,
): HelixLocalSupervisorStatus["supervisor_mode"] => {
  if (environment.CASIMIR_DESKTOP_HOST === "1") {
    return "desktop_single_instance";
  }
  if (verifyHelixLocalSupervisorOwnershipReceipt({
    encodedReceipt: environment.CASIMIR_LOCAL_SUPERVISOR_OWNERSHIP_RECEIPT,
    trustedPublicKeysPem: environment.CASIMIR_LOCAL_SUPERVISOR_TRUSTED_PUBLIC_KEYS,
    trustedPublicKeysSpkiBase64Url:
      environment.CASIMIR_LOCAL_SUPERVISOR_TRUSTED_PUBLIC_KEYS_SPKI_B64URL,
    expectedWorkspaceRef: helixWorkspaceRefFor(workspacePath),
    now,
  })) {
    return "external_keyed_launcher";
  }
  return "external_process";
};

export type HelixLocalSupervisorIdentity = Readonly<{
  serviceInstanceRef: string;
  workspaceRef: string;
  startedAt: string;
  supervisorMode: HelixLocalSupervisorStatus["supervisor_mode"];
}>;

export const createHelixLocalSupervisorIdentity = (input?: {
  workspacePath?: string;
  environment?: NodeJS.ProcessEnv;
  startedAt?: string;
  entropy?: string;
}): HelixLocalSupervisorIdentity => {
  const workspacePath = input?.workspacePath ?? process.cwd();
  const environment = input?.environment ?? process.env;
  const startedAt = input?.startedAt ?? new Date().toISOString();
  const entropy = input?.entropy ?? crypto.randomUUID();
  return Object.freeze({
    serviceInstanceRef: `service_instance:${digest(
      `${helixWorkspaceRefFor(workspacePath)}\n${startedAt}\n${entropy}`,
    ).slice(0, 32)}`,
    workspaceRef: helixWorkspaceRefFor(workspacePath),
    startedAt,
    supervisorMode: resolveHelixLocalSupervisorMode(
      environment,
      workspacePath,
      new Date(startedAt),
    ),
  });
};

export const buildHelixLocalSupervisorStatus = (input: {
  identity: HelixLocalSupervisorIdentity;
  ready: boolean;
}): HelixLocalSupervisorStatus =>
  helixLocalSupervisorStatusSchema.parse({
    schema: HELIX_LOCAL_SUPERVISOR_STATUS_SCHEMA,
    service_instance_ref: input.identity.serviceInstanceRef,
    workspace_ref: input.identity.workspaceRef,
    started_at: input.identity.startedAt,
    ready: input.ready,
    supervisor_mode: input.identity.supervisorMode,
    one_instance_enforced:
      input.identity.supervisorMode === "desktop_single_instance" ||
      input.identity.supervisorMode === "external_keyed_launcher",
    attach_supported: true,
    client_isolation_dimensions: [
      "account_session",
      "oauth_client",
      "conversation_thread",
      "room_participant",
      "run_turn",
      "environment_source_epoch",
      "execution_lease",
    ],
    concurrent_read_admission: "grant_scoped",
    mutation_admission: "serialized_execution_lease",
    credential_included: false,
    private_endpoint_included: false,
    workspace_path_included: false,
    process_identity_included: false,
    account_identity_included: false,
    content_role: "local_supervisor_status_not_authority",
    answer_authority: false,
    terminal_eligible: false,
  });
