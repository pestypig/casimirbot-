import { computeCasimirSpecValueSha256V1 } from
  "@shared/contracts/casimir-spec-scientific-claim-ir.v1";
import {
  HELIX_MINECRAFT_FABRIC_LOOPBACK_LIFECYCLE_CAPABILITY,
  HELIX_MINECRAFT_FABRIC_LOOPBACK_LIFECYCLE_OBSERVATION_SCHEMA,
  helixMinecraftLocalLifecycleRequestSchema,
} from "@shared/helix-minecraft-local-lifecycle";
import {
  executeMinecraftFabricLoopbackLifecycle,
  MinecraftLocalLifecycleError,
  type MinecraftLocalLifecycleRunner,
} from "../../environment-connectors/installations/minecraft-fabric-loopback-lifecycle";
import {
  createRuntimeToolConfirmationReceiptVerifierV1,
  type RuntimeToolConfirmationConsumeResultV1,
} from "../../theory/runtime-tool-confirmation-receipt-verifier";
import type { HelixWorkstationGatewayAccountContext } from "./account-policy";
import type { HelixWorkstationCapabilityManifest } from "./types";

export const minecraftLocalLifecycleManifest:
  HelixWorkstationCapabilityManifest = {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: HELIX_MINECRAFT_FABRIC_LOOPBACK_LIFECYCLE_CAPABILITY,
    label: "Start or join local Minecraft Fabric",
    description:
      "Launches or reuses the prepared Minecraft Fabric 1.21.8 client and joins a listening loopback server through the fixed Helix lifecycle adapter. It cannot select an arbitrary executable, remote server, shell command, file, credential, or profile.",
    panel_id: "situation-room-pipelines",
    action_id: "launch_and_join_local_minecraft_fabric",
    mode: "act",
    mutating: true,
    code_mutation: false,
    shell_access: false,
    requires_confirmation: true,
    requires_source: false,
    terminal_eligible: false,
    permission_profile_required: "act",
    post_tool_model_step_required: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        address: {
          type: "string",
          pattern: "^(localhost|127\\.0\\.0\\.1|\\[::1\\])(?::[0-9]{1,5})?$",
          default: "localhost:25565",
        },
      },
    },
    output_observation_schema:
      HELIX_MINECRAFT_FABRIC_LOOPBACK_LIFECYCLE_OBSERVATION_SCHEMA,
    observation_schema:
      HELIX_MINECRAFT_FABRIC_LOOPBACK_LIFECYCLE_OBSERVATION_SCHEMA,
    safety_tags: [
      "developer_only",
      "explicit_runtime_confirmation",
      "loopback_only",
      "fixed_minecraft_launcher",
      "no_generic_shell",
      "no_shell",
      "no_code_mutation",
      "no_credentials",
      "observation_not_answer",
      "non_terminal",
    ],
    assistant_answer: false,
    raw_content_included: false,
  };

export type MinecraftLocalLifecycleApprovalPlanV1 = {
  schema: "helix.minecraft.local_lifecycle_approval_material.v1";
  capabilityId: typeof HELIX_MINECRAFT_FABRIC_LOOPBACK_LIFECYCLE_CAPABILITY;
  planId: string;
  sealedInputSha256: string;
  canonicalArguments: { address: string };
};

export const buildMinecraftLocalLifecycleApprovalPlanV1 = async (input: {
  args: Record<string, unknown>;
}): Promise<MinecraftLocalLifecycleApprovalPlanV1> => {
  const canonicalArguments = helixMinecraftLocalLifecycleRequestSchema.parse(
    input.args,
  );
  const sealedInputSha256 = await computeCasimirSpecValueSha256V1({
    domain: "helix-minecraft-local-lifecycle/v1",
    capabilityId: HELIX_MINECRAFT_FABRIC_LOOPBACK_LIFECYCLE_CAPABILITY,
    arguments: canonicalArguments,
  });
  return {
    schema: "helix.minecraft.local_lifecycle_approval_material.v1",
    capabilityId: HELIX_MINECRAFT_FABRIC_LOOPBACK_LIFECYCLE_CAPABILITY,
    planId: `minecraft-local-lifecycle:${sealedInputSha256}`,
    sealedInputSha256,
    canonicalArguments,
  };
};

type MinecraftLocalLifecycleConfirmationVerifier = {
  consume(input: {
    receipt?: unknown;
    legacyApprovalToken?: string | null;
    expectedBinding: {
      capabilityId: string;
      planId: string;
      accountType: "developer" | "user";
      profileId: string;
      sessionId: string;
      turnId: string;
      sealedInputSha256: string;
    };
  }): Promise<RuntimeToolConfirmationConsumeResultV1>;
};

export type MinecraftLocalLifecycleConfirmationDependencies = Parameters<
  typeof createRuntimeToolConfirmationReceiptVerifierV1
>[0];

let defaultConfirmationVerifier =
  createRuntimeToolConfirmationReceiptVerifierV1();

export const installMinecraftLocalLifecycleConfirmationDependenciesForServerV1 =
  (dependencies: MinecraftLocalLifecycleConfirmationDependencies): void => {
    defaultConfirmationVerifier =
      createRuntimeToolConfirmationReceiptVerifierV1(dependencies);
  };

export type MinecraftLocalLifecycleGatewayExecution = {
  ok: boolean;
  status: "completed" | "blocked" | "failed";
  summary: string;
  observation: Record<string, unknown>;
  executedArgs?: Record<string, unknown>;
  error?: string;
};

const failure = (input: {
  code: string;
  status?: "blocked" | "failed";
  issues?: string[];
}): MinecraftLocalLifecycleGatewayExecution => ({
  ok: false,
  status: input.status ?? "blocked",
  summary: `Minecraft local lifecycle did not run: ${input.code}.`,
  observation: {
    schema: HELIX_MINECRAFT_FABRIC_LOOPBACK_LIFECYCLE_OBSERVATION_SCHEMA,
    ok: false,
    status: input.status ?? "blocked",
    error: input.code,
    approval_issues: input.issues ?? [],
    credential_included: false,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  },
  error: input.code,
});

export const executeMinecraftLocalLifecycleGatewayCapability = async (input: {
  turnId?: string | null;
  arguments: Record<string, unknown>;
  accountContext?: HelixWorkstationGatewayAccountContext | null;
  approvalReceipt?: unknown;
  approvalToken?: string | null;
  confirmationVerifier?: MinecraftLocalLifecycleConfirmationVerifier;
  runner?: MinecraftLocalLifecycleRunner;
  signal?: AbortSignal;
}): Promise<MinecraftLocalLifecycleGatewayExecution> => {
  const context = input.accountContext;
  if (
    !context?.trusted_account_session ||
    context.account_policy.account_type !== "developer" ||
    !context.profile_id ||
    !context.session_id ||
    !input.turnId
  ) {
    return failure({ code: "minecraft_local_lifecycle_account_binding_required" });
  }
  let plan: MinecraftLocalLifecycleApprovalPlanV1;
  try {
    plan = await buildMinecraftLocalLifecycleApprovalPlanV1({
      args: input.arguments,
    });
  } catch {
    return failure({ code: "minecraft_loopback_address_required" });
  }
  const confirmation = await (
    input.confirmationVerifier ?? defaultConfirmationVerifier
  ).consume({
    receipt: input.approvalReceipt,
    legacyApprovalToken: input.approvalToken,
    expectedBinding: {
      capabilityId: plan.capabilityId,
      planId: plan.planId,
      accountType: "developer",
      profileId: context.profile_id,
      sessionId: context.session_id,
      turnId: input.turnId,
      sealedInputSha256: plan.sealedInputSha256,
    },
  });
  if (!confirmation.ok) {
    return failure({
      code: confirmation.status === "needs_confirmation"
        ? "confirmation_required"
        : "confirmation_invalid",
      issues: confirmation.issues,
    });
  }
  try {
    const receipt = await executeMinecraftFabricLoopbackLifecycle({
      request: plan.canonicalArguments,
      runner: input.runner,
      signal: input.signal,
    });
    return {
      ok: true,
      status: "completed",
      summary:
        `Minecraft Fabric is connected to ${receipt.server_address} through the local lifecycle adapter.`,
      observation: {
        schema: HELIX_MINECRAFT_FABRIC_LOOPBACK_LIFECYCLE_OBSERVATION_SCHEMA,
        ok: true,
        status: "connected",
        receipt,
        credential_included: false,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      executedArgs: plan.canonicalArguments,
    };
  } catch (error) {
    const code = error instanceof MinecraftLocalLifecycleError
      ? error.code
      : "minecraft_local_lifecycle_unavailable";
    return failure({ code, status: "failed" });
  }
};
