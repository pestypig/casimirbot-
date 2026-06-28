import { spawn } from "node:child_process";
import crypto from "node:crypto";
import type { HelixAgentProvider, HelixAgentRunResult } from "./types";
import {
  callWorkstationGatewayCapability,
  listWorkstationGatewayCapabilities,
} from "../workstation-tool-gateway/registry";
import type { HelixWorkstationGatewayCallResult } from "../workstation-tool-gateway/types";
import { buildHelixAgentRuntimeSelectionTrace } from "./runtime-debug";

const enabled = (): boolean => process.env.ENABLE_CODEX_AGENT === "1";

const readQuestion = (body: Record<string, unknown>): string =>
  typeof body.question === "string"
    ? body.question.trim()
    : typeof body.prompt === "string"
      ? body.prompt.trim()
      : typeof body.raw_user_prompt === "string"
        ? body.raw_user_prompt.trim()
        : "";

const maxOutputBytes = (): number => {
  const parsed = Number(process.env.CODEX_AGENT_MAX_OUTPUT_BYTES);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 256_000;
};

const codexTimeoutMs = (): number => {
  const parsed = Number(process.env.CODEX_AGENT_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 60_000;
};

const readCodexArgs = (): string[] =>
  (process.env.CODEX_ARGS || "")
    .split(/\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const sha256 = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex");

const readTurnId = (body: Record<string, unknown>): string =>
  readString(body.turn_id) ?? readString(body.turnId) ?? `ask:codex:${crypto.randomUUID()}`;

const readExplicitGatewayCallRequests = (body: Record<string, unknown>): Record<string, unknown>[] => {
  const calls = body.workstation_gateway_calls ?? body.workstationGatewayCalls;
  const call = body.workstation_gateway_call ?? body.workstationGatewayCall;
  const records = [
    ...(Array.isArray(calls) ? calls : []),
    ...(call ? [call] : []),
  ]
    .map(readRecord)
    .filter((record): record is Record<string, unknown> => Boolean(record))
    .slice(0, 3);
  return records;
};

export const runExplicitCodexWorkstationGatewayCalls = async (input: {
  body: Record<string, unknown>;
  turnId?: string | null;
}): Promise<HelixWorkstationGatewayCallResult[]> => {
  const requests = readExplicitGatewayCallRequests(input.body);
  const turnId = input.turnId ?? readTurnId(input.body);
  const results: HelixWorkstationGatewayCallResult[] = [];
  for (const [index, request] of requests.entries()) {
    results.push(await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: readString(request.mode),
      capabilityId: readString(request.capability_id) ?? readString(request.capabilityId) ?? "",
      arguments: readRecord(request.arguments ?? request.args) ?? {},
      approvalToken: readString(request.approval_token) ?? readString(request.approvalToken),
      turnId,
      iteration: typeof request.iteration === "number" ? request.iteration : index + 1,
    }));
  }
  return results;
};

export const buildCodexProviderReasoningReentry = (input: {
  turnId: string;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
  providerText: string;
  ok: boolean;
}) => {
  const observationRefs = input.gatewayCallResults.flatMap((result) => result.artifact_refs);
  const candidateId = input.ok && input.providerText.trim()
    ? `${input.turnId}:agent_provider_terminal_candidate:codex:${sha256(input.providerText).slice(0, 16)}`
    : null;
  const providerTerminalCandidate = candidateId
    ? {
        schema: "helix.agent_provider_terminal_candidate.v1",
        candidate_id: candidateId,
        turn_id: input.turnId,
        agent_runtime: "codex",
        selected_agent_provider: "codex",
        source: "codex_text_mode_adapter",
        candidate_text_hash: sha256(input.providerText),
        candidate_text_length: input.providerText.length,
        candidate_text_preview: input.providerText.slice(0, 4000),
        grounded_in_observation_refs: observationRefs,
        evidence_reentry_required: input.gatewayCallResults.length > 0,
        provider_reasoning_completed: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      }
    : null;
  const providerReasoningReentry = {
    schema: "helix.provider_reasoning_reentry.v1",
    turn_id: input.turnId,
    agent_runtime: "codex",
    selected_agent_provider: "codex",
    status: candidateId ? "completed" : input.ok ? "empty_provider_answer" : "not_run",
    input_observation_refs: observationRefs,
    provider_terminal_candidate_ref: candidateId,
    provider_terminal_candidate_present: Boolean(candidateId),
    post_tool_model_step_required: false,
    evidence_reentered: Boolean(candidateId && observationRefs.length > 0),
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
  const terminalAuthorityCandidateReview = {
    schema: "helix.provider_terminal_authority_candidate_review.v1",
    turn_id: input.turnId,
    agent_runtime: "codex",
    candidate_ref: candidateId,
    terminal_authority_status: candidateId
      ? "pending_helix_terminal_authority"
      : "not_evaluated_provider_text_mode",
    terminal_authority_granted: false,
    final_visible_answer_authorized: false,
    blockers: candidateId
      ? ["helix_terminal_authority_not_run_for_provider_candidate"]
      : ["provider_terminal_candidate_missing"],
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
  return {
    providerTerminalCandidate,
    providerReasoningReentry,
    terminalAuthorityCandidateReview,
    workstationGatewayReentryStatus: providerReasoningReentry.status,
    terminalAuthorityStatus: terminalAuthorityCandidateReview.terminal_authority_status,
  };
};

async function runCodexProcess(input: {
  prompt: string;
  signal?: AbortSignal;
}): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  const fakeStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
  if (fakeStdout !== undefined) {
    return {
      stdout: fakeStdout,
      stderr: process.env.CODEX_AGENT_FAKE_STDERR ?? "",
      exitCode: Number(process.env.CODEX_AGENT_FAKE_EXIT_CODE ?? "0"),
    };
  }

  const bin = process.env.CODEX_BIN || "codex";
  const child = spawn(bin, readCodexArgs(), {
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      PATH: process.env.PATH,
      Path: process.env.Path,
      HOME: process.env.HOME,
      USERPROFILE: process.env.USERPROFILE,
      SystemRoot: process.env.SystemRoot,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      CODEX_HOME: process.env.CODEX_HOME,
    },
  });

  const kill = () => {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  };

  const timeout = setTimeout(kill, codexTimeoutMs());
  input.signal?.addEventListener("abort", kill, { once: true });

  let stdout = "";
  let stderr = "";
  let collected = 0;
  const limit = maxOutputBytes();

  child.stdout?.on("data", (chunk: Buffer) => {
    collected += chunk.length;
    if (collected <= limit) stdout += chunk.toString("utf8");
    if (collected > limit) kill();
  });

  child.stderr?.on("data", (chunk: Buffer) => {
    stderr = (stderr + chunk.toString("utf8")).slice(0, limit);
  });

  child.stdin?.write(input.prompt);
  child.stdin?.end();

  return await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (exitCode) => {
      clearTimeout(timeout);
      input.signal?.removeEventListener("abort", kill);
      resolve({ stdout, stderr, exitCode });
    });
  });
}

export const codexProvider: HelixAgentProvider = {
  id: "codex",
  label: "Codex Workstation Mode",
  permissionProfile: {
    id: "read-observe",
    label: "Read/observe only",
    allows: {
      observe: true,
      read: true,
      act: false,
      write: false,
      shell: false,
      codeMutation: false,
    },
  },
  enabled,
  supports: {
    streaming: false,
    workstationTools: true,
    codeMutation: false,
  },

  async runTurn(request): Promise<HelixAgentRunResult> {
    const question = readQuestion(request.body);
    const turnId = readTurnId(request.body);
    const gatewayManifest = listWorkstationGatewayCapabilities({
      agentRuntime: "codex",
      mode: "observe",
    });
    const runtimeSelectionTrace = buildHelixAgentRuntimeSelectionTrace({
      route: request.route,
      requestedRuntime: request.runtime,
      provider: codexProvider,
      gatewayManifest,
    });
    const gatewayCallResults = await runExplicitCodexWorkstationGatewayCalls({
      body: request.body,
      turnId,
    });
    const gatewayObservationPackets = gatewayCallResults.map((result) => result.observation_packet);
    const gatewayLifecycleTraces = gatewayCallResults.map((result) => result.tool_lifecycle_trace);
    const gatewayFollowupDecisions = gatewayCallResults.map((result) => result.tool_followup_decision);

    if (!question) {
      const text = "Codex runtime could not run because the Ask turn had no question.";
      return {
        ok: false,
        runtime: "codex",
        response_type: "final_failure",
        final_status: "final_failure",
        text,
        answer: text,
        debug: {
          agent_runtime: "codex",
          agent_runtime_selection_trace: runtimeSelectionTrace,
          fail_reason: "missing_question",
          permission_profile: codexProvider.permissionProfile,
          workstation_gateway_manifest: gatewayManifest,
          workstation_gateway_manifest_schema: gatewayManifest.schema,
          workstation_gateway_manifest_version: gatewayManifest.manifest_version,
          workstation_gateway_capability_ids: gatewayManifest.capabilities.map(
            (capability) => capability.capability_id,
          ),
          workstation_gateway_call_results: gatewayCallResults,
          workstation_gateway_observation_packets: gatewayObservationPackets,
          tool_lifecycle_traces: gatewayLifecycleTraces,
          tool_followup_decisions: gatewayFollowupDecisions,
          workstation_gateway_reentry_status: runtimeSelectionTrace.evidence_reentry_status,
          terminal_authority_status: runtimeSelectionTrace.terminal_authority_status,
        },
      };
    }

    const prompt = [
      "You are running inside Helix Codex Workstation Mode.",
      "Do not mutate files or run shell commands. The current Helix workstation gateway is read/observe only.",
      "Do not claim that a workstation tool ran unless a Helix observation packet is present in the request context.",
      `Provider permission profile: ${JSON.stringify(codexProvider.permissionProfile)}`,
      "Answer the user request using the provided context.",
      "",
      "Available Helix workstation gateway capabilities:",
      JSON.stringify(gatewayManifest, null, 2),
      "",
      "Helix workstation gateway observations already executed for this turn:",
      JSON.stringify(gatewayCallResults, null, 2),
      "",
      "User request:",
      question,
      "",
      "Helix request context JSON:",
      JSON.stringify(
        {
          mode: request.body.mode,
          context_mode: request.body.context_mode,
          workspace_context_snapshot: request.body.workspace_context_snapshot,
          turn_input_items: request.body.turn_input_items,
          route_metadata: request.body.route_metadata,
        },
        null,
        2,
      ),
    ].join("\n");

    const result = await runCodexProcess({
      prompt,
      signal: request.signal,
    });
    const text = result.stdout.trim() || result.stderr.trim();
    const ok = result.exitCode === 0 && text.length > 0;
    const providerReentry = buildCodexProviderReasoningReentry({
      turnId,
      gatewayCallResults,
      providerText: text,
      ok,
    });

    return {
      ok,
      runtime: "codex",
      response_type: ok ? "final_answer" : "final_failure",
      final_status: ok ? "completed" : "final_failure",
      text,
      answer: text,
      debug: {
        agent_runtime: "codex",
        agent_runtime_selection_trace: runtimeSelectionTrace,
        permission_profile: codexProvider.permissionProfile,
        codex_exit_code: result.exitCode,
        codex_stderr_preview: result.stderr.slice(0, 2000),
        workstation_tools_enabled: false,
        code_mutation_enabled: false,
        workstation_gateway_manifest: gatewayManifest,
        workstation_gateway_manifest_schema: gatewayManifest.schema,
        workstation_gateway_manifest_version: gatewayManifest.manifest_version,
        workstation_gateway_capability_ids: gatewayManifest.capabilities.map(
          (capability) => capability.capability_id,
        ),
        workstation_gateway_call_results: gatewayCallResults,
        workstation_gateway_observation_packets: gatewayObservationPackets,
        tool_lifecycle_traces: gatewayLifecycleTraces,
        tool_followup_decisions: gatewayFollowupDecisions,
        provider_terminal_candidate: providerReentry.providerTerminalCandidate,
        provider_reasoning_reentry: providerReentry.providerReasoningReentry,
        terminal_authority_candidate_review: providerReentry.terminalAuthorityCandidateReview,
        workstation_gateway_reentry_status: providerReentry.workstationGatewayReentryStatus,
        terminal_authority_status: providerReentry.terminalAuthorityStatus,
      },
      raw: {
        stdout: result.stdout,
        stderr: result.stderr,
      },
    };
  },
};
