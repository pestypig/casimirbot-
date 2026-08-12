import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  environmentActionDifferentialCaptureInputSchema,
  type EnvironmentActionDifferentialCaptureInput,
} from "../server/services/environment-connectors/actions/workflow-differential-trace-capture";

type JsonRecord = Record<string, unknown>;

export const HELIX_PLAYER_DIRECT_DIAGNOSTIC_MARKER =
  "HELIX_PLAYER_DIRECT_DIAGNOSTIC ";

export interface DirectDiagnosticCaptureOptions {
  logText: string;
  prompt: string;
  requestedWorkflowId?: string | null;
  scenarioId?: string | null;
}

const argument = (name: string): string | null => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1]?.trim() || null : null;
};

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export const parseDirectDiagnosticRecords = (logText: string): JsonRecord[] =>
  logText.split(/\r?\n/u).flatMap((line): JsonRecord[] => {
    const markerIndex = line.indexOf(HELIX_PLAYER_DIRECT_DIAGNOSTIC_MARKER);
    if (markerIndex < 0) return [];
    try {
      const parsed: unknown = JSON.parse(
        line.slice(markerIndex + HELIX_PLAYER_DIRECT_DIAGNOSTIC_MARKER.length),
      );
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? [parsed as JsonRecord]
        : [];
    } catch {
      return [];
    }
  });

export const buildDirectDiagnosticCapture = ({
  logText,
  prompt,
  requestedWorkflowId,
  scenarioId,
}: DirectDiagnosticCaptureOptions): EnvironmentActionDifferentialCaptureInput => {
  const records = parseDirectDiagnosticRecords(logText);
  const requests = records.filter(
    (record) =>
      readString(record.schema) ===
      "helix.minecraft.player.direct_diagnostic_request.v1",
  );
  const request = [...requests]
    .reverse()
    .find(
      (candidate) =>
        !requestedWorkflowId ||
        readString(candidate.workflow_id) === requestedWorkflowId,
    );
  if (!request) {
    throw new Error("No matching direct diagnostic request was found in the log.");
  }

  const workflowId = readString(request.workflow_id);
  const actionKind = readString(request.action_kind);
  const events = records.filter(
    (record) =>
      readString(record.schema) ===
        "helix.minecraft.player.direct_diagnostic_event.v1" &&
      readString(record.workflow_id) === workflowId,
  );
  const terminalStates = new Set([
    "canceled",
    "succeeded",
    "failed",
    "timed_out",
    "emergency_stopped",
    "connector_offline",
  ]);
  const terminal = [...events]
    .reverse()
    .find((event) => terminalStates.has(readString(event.workflow_state)));
  if (!terminal) {
    throw new Error(
      `Direct diagnostic ${workflowId} has no terminal workflow event.`,
    );
  }

  const manualOverride = terminal.manual_override_detected === true;
  const executionOutcome = (() => {
    switch (readString(terminal.workflow_state)) {
      case "succeeded":
        return "succeeded" as const;
      case "canceled":
        return manualOverride
          ? ("manual_override" as const)
          : ("request_canceled" as const);
      case "timed_out":
        return "workflow_timeout" as const;
      case "emergency_stopped":
        return "emergency_stopped" as const;
      case "connector_offline":
        return "connector_offline" as const;
      default:
        return "failed" as const;
    }
  })();

  const capabilityId = (() => {
    switch (actionKind) {
      case "walk":
        return "com.casimirbot.minecraft.player.walk";
      case "jump":
        return "com.casimirbot.minecraft.player.jump";
      case "look_at":
        return "com.casimirbot.minecraft.player.look";
      default:
        return null;
    }
  })();

  const logHash = crypto
    .createHash("sha256")
    .update(logText, "utf8")
    .digest("hex");
  return environmentActionDifferentialCaptureInputSchema.parse({
    scenario_id: scenarioId ?? `minecraft_player_direct:${actionKind}`,
    lane: "direct_codex",
    action_kind: actionKind,
    prompt,
    starting_state: request.starting_state ?? null,
    capability_contract: {
      capability_id: capabilityId,
      capability_version: 1,
      control_engine: "native_fabric",
      local_reference_lane: true,
      manual_override_required: true,
      postcondition_verification_required: true,
    },
    source_artifact_refs: [
      `minecraft_client_log_sha256:${logHash}`,
      `direct_diagnostic_workflow:${workflowId}`,
    ],
    selected_capability_id: capabilityId,
    normalized_arguments: request.arguments ?? null,
    admission_status: "not_applicable",
    execution_outcome: executionOutcome,
    normalized_progress: events.map((event) => ({
      sequence: event.sequence,
      event_type: event.event_type,
      workflow_state: event.workflow_state,
      progress_fraction: event.progress_fraction,
      measurements: event.measurements,
      manual_override_detected: event.manual_override_detected,
      controls_released: event.controls_released,
    })),
    postcondition_status:
      executionOutcome === "succeeded" ? "satisfied" : "not_satisfied",
    observation_refs: [],
    observation_reentered: false,
    final_candidate_text: null,
    final_candidate_support_refs: [],
    route_product_text: null,
    route_product_support_refs: [],
    terminal_outcome: "not_applicable",
    terminal_authority_status: "not_applicable",
    terminal_writer_text: null,
    terminal_writer_support_refs: [],
    visible_text: null,
    voice_projection_status: "not_applicable",
    voice_text: null,
    created_at:
      readString(terminal.created_at) || readString(request.started_at),
    hidden_reasoning_included: false,
  });
};

export const runDirectDiagnosticCaptureCli = (): void => {
  const logPath = argument("--log");
  const outputPath = argument("--out");
  const prompt = argument("--prompt");
  if (!logPath || !outputPath || !prompt) {
    throw new Error(
      "Usage: --log <minecraft-latest.log> --prompt <semantic-request> --out <public-capture.json> [--workflow-id <id>] [--scenario <id>]",
    );
  }

  const resolvedLog = path.resolve(logPath);
  const capture = buildDirectDiagnosticCapture({
    logText: fs.readFileSync(resolvedLog, "utf8"),
    prompt,
    requestedWorkflowId: argument("--workflow-id"),
    scenarioId: argument("--scenario"),
  });
  const resolvedOutput = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(resolvedOutput), { recursive: true });
  fs.writeFileSync(resolvedOutput, `${JSON.stringify(capture, null, 2)}\n`, "utf8");
  const workflowRef = capture.source_artifact_refs.find((ref) =>
    ref.startsWith("direct_diagnostic_workflow:"),
  );
  process.stdout.write(
    `CAPTURED direct_codex ${capture.action_kind} ${workflowRef?.slice("direct_diagnostic_workflow:".length) ?? "unknown"} ${capture.execution_outcome}\n`,
  );
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  runDirectDiagnosticCaptureCli();
}
