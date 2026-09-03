import crypto from "node:crypto";
import type { HelixEnvironmentEvent } from "@shared/helix-environment-event-stream";
import type { HelixCapabilityLifecycleLedger } from "@shared/helix-capability-lifecycle-ledger";
import type { HelixAgentRunEvent } from "@shared/contracts/helix-agent-api.v1";
import type {
  HelixAgentRunOwner,
  HelixAgentRunRecord,
} from "../helix-agent-api/run-store";
import {
  ensureDatabase,
  getPool,
  persistLocalDatabaseSnapshotIfEnabled,
} from "../../db/client";
import {
  HelixOperatorActivityStore,
  helixOperatorActivityOwnerForProfile,
} from "./operator-activity-store";
import {
  normalizeAgentRunEventActivity,
  normalizeCapabilityLifecycleActivity,
  normalizeEnvironmentEventActivity,
} from "./operator-activity-normalizer";

const hashedRef = (kind: string, value: unknown): string =>
  `${kind}:${crypto
    .createHash("sha256")
    .update(JSON.stringify(value), "utf8")
    .digest("hex")
    .slice(0, 48)}`;

export const helixOperatorActivityStreamRef = (input: {
  profileId: string;
  nodeRef: string;
}): string =>
  `operator_activity_stream:${crypto
    .createHash("sha256")
    .update(JSON.stringify(input), "utf8")
    .digest("hex")
    .slice(0, 48)}`;

export const operatorActivityStore = new HelixOperatorActivityStore({
  poolProvider: async () => {
    await ensureDatabase();
    return getPool();
  },
  persist: () => persistLocalDatabaseSnapshotIfEnabled([
    "helix_operator_activity_streams",
    "helix_operator_activity_events",
  ]),
});

export const appendEnvironmentEventsToOperatorActivity = async (input: {
  profileId: string;
  nodeRef: string;
  environmentBindingRef: string;
  events: HelixEnvironmentEvent[];
  store?: HelixOperatorActivityStore;
}) => {
  const streamRef = helixOperatorActivityStreamRef({
    profileId: input.profileId,
    nodeRef: input.nodeRef,
  });
  const result = await (input.store ?? operatorActivityStore).append({
    owner: helixOperatorActivityOwnerForProfile(input.profileId),
    stream: {
      streamRef,
      profileRef: input.profileId,
      nodeRef: input.nodeRef,
    },
    events: input.events.map((event) =>
      normalizeEnvironmentEventActivity({
        event,
        scope: {
          profileRef: input.profileId,
          nodeRef: input.nodeRef,
          environmentBindingRef: input.environmentBindingRef,
        },
        projectionSequence: 0,
      }),
    ),
  });
  return { stream_ref: streamRef, ...result };
};

export const helixAgentApiNodeRef = (owner: HelixAgentRunOwner): string =>
  hashedRef("agent_api_principal", {
    tenantId: owner.tenantId,
    issuer: owner.issuer,
    subjectId: owner.subjectId,
    accountProfileId: owner.accountProfileId,
  });

export const appendAgentRunEventsToOperatorActivity = async (input: {
  owner: HelixAgentRunOwner;
  run: HelixAgentRunRecord;
  events: HelixAgentRunEvent[];
  observedAt?: string;
  store?: HelixOperatorActivityStore;
}) => {
  const profileId = input.run.accountProfileId;
  if (profileId !== input.owner.accountProfileId) {
    throw new Error("operator_activity_agent_owner_mismatch");
  }
  const nodeRef = helixAgentApiNodeRef(input.owner);
  const streamRef = helixOperatorActivityStreamRef({ profileId, nodeRef });
  const providerThreadRef = hashedRef(
    "provider_thread",
    input.run.providerThreadId,
  );
  const providerThreadEpoch = hashedRef(
    "provider_thread_epoch",
    input.run.providerSessionId,
  );
  const result = await (input.store ?? operatorActivityStore).append({
    owner: helixOperatorActivityOwnerForProfile(profileId),
    stream: { streamRef, profileRef: profileId, nodeRef },
    events: input.events.map((event) =>
      normalizeAgentRunEventActivity({
        event,
        scope: {
          profileRef: profileId,
          nodeRef,
          providerThreadRef,
          providerThreadEpoch,
          runId: input.run.runId,
        },
        projectionSequence: 0,
        observedAt: input.observedAt,
      }),
    ),
  });
  return { stream_ref: streamRef, node_ref: nodeRef, ...result };
};

export const appendCapabilityLifecycleToOperatorActivity = async (input: {
  owner: HelixAgentRunOwner;
  ledger: HelixCapabilityLifecycleLedger;
  runId: string;
  oauthClientRef?: string | null;
  clientSessionRef?: string | null;
  occurredAt: string;
  observedAt: string;
  store?: HelixOperatorActivityStore;
}) => {
  const profileId = input.owner.accountProfileId;
  const nodeRef = helixAgentApiNodeRef(input.owner);
  const streamRef = helixOperatorActivityStreamRef({ profileId, nodeRef });
  const result = await (input.store ?? operatorActivityStore).append({
    owner: helixOperatorActivityOwnerForProfile(profileId),
    stream: { streamRef, profileRef: profileId, nodeRef },
    events: normalizeCapabilityLifecycleActivity({
      ledger: input.ledger,
      scope: {
        profileRef: profileId,
        nodeRef,
        oauthClientRef: input.oauthClientRef ?? null,
        clientSessionRef: input.clientSessionRef ?? null,
        runId: input.runId,
      },
      projectionSequenceStart: 0,
      occurredAt: input.occurredAt,
      observedAt: input.observedAt,
    }),
  });
  return { stream_ref: streamRef, node_ref: nodeRef, ...result };
};

export const appendMcpToolInvocationToOperatorActivity = async (input: {
  owner: HelixAgentRunOwner;
  requestId: string;
  toolName: string;
  outcome: "succeeded" | "failed";
  occurredAt: string;
  observedAt: string;
  nodeRef?: string;
  oauthClientRef?: string | null;
  clientSessionRef?: string | null;
  store?: HelixOperatorActivityStore;
}) => {
  const profileId = input.owner.accountProfileId;
  const nodeRef = input.nodeRef?.trim() || helixAgentApiNodeRef(input.owner);
  const streamRef = helixOperatorActivityStreamRef({ profileId, nodeRef });
  const turnId = hashedRef("mcp_request", input.requestId);
  const capabilityCallRef = hashedRef("mcp_capability_call", {
    requestId: input.requestId,
    toolName: input.toolName,
  });
  const completed = input.outcome === "succeeded";
  const ledger: HelixCapabilityLifecycleLedger = {
    schema: "helix.capability_lifecycle_ledger.v1",
    turn_id: turnId,
    capability_plan_id: capabilityCallRef,
    capability_result_id: hashedRef("mcp_capability_result", {
      capabilityCallRef,
      outcome: input.outcome,
    }),
    stages: [
      {
        stage: "planned",
        status: "succeeded",
        refs: [capabilityCallRef],
        reason: "An authenticated MCP client submitted a registered tool call.",
      },
      {
        stage: "admitted",
        status: "succeeded",
        refs: [capabilityCallRef],
        reason: "The MCP server admitted the validated call to its tool handler.",
      },
      {
        stage: "dispatched",
        status: "succeeded",
        refs: [capabilityCallRef],
        reason: "The registered MCP tool handler began execution.",
      },
      {
        stage: "adapter_acknowledged",
        status: input.outcome,
        refs: [capabilityCallRef],
        reason: completed
          ? "The MCP tool handler returned without a typed tool error."
          : "The MCP tool handler threw or returned a typed tool error.",
      },
      {
        stage: "result_observed",
        status: input.outcome,
        refs: [capabilityCallRef],
        reason: completed
          ? "The MCP transport observed a non-error tool result."
          : "The MCP transport observed a failed tool result.",
      },
      {
        stage: "result_validated",
        status: "skipped",
        refs: [capabilityCallRef],
        reason: "Generic MCP activity does not assert domain-semantic validation.",
      },
      {
        stage: "reentered_solver",
        status: "skipped",
        refs: [capabilityCallRef],
        reason: "Provider-private result re-entry is not observable by Helix.",
      },
      {
        stage: "terminal_considered",
        status: "skipped",
        refs: [capabilityCallRef],
        reason: "Provider-private terminal consideration is not observable by Helix.",
      },
    ],
    failure_codes: [],
    ok: completed,
    assistant_answer: false,
    raw_content_included: false,
  };
  const result = await (input.store ?? operatorActivityStore).append({
    owner: helixOperatorActivityOwnerForProfile(profileId),
    stream: { streamRef, profileRef: profileId, nodeRef },
    events: normalizeCapabilityLifecycleActivity({
      ledger,
      scope: {
        profileRef: profileId,
        nodeRef,
        oauthClientRef: input.oauthClientRef ?? null,
        clientSessionRef: input.clientSessionRef ?? null,
      },
      projectionSequenceStart: 0,
      occurredAt: input.occurredAt,
      observedAt: input.observedAt,
    }),
  });
  return {
    stream_ref: streamRef,
    node_ref: nodeRef,
    capability_call_ref: capabilityCallRef,
    ...result,
  };
};
