import {
  buildAskToolTraceDisclosure,
  type HelixAskToolTraceDisclosure,
} from "./tool-trace-disclosure";

type LivePipelineToolTraceAction = {
  panel_id: string;
  action_id: string;
  args: Record<string, unknown>;
};

const LIVE_PIPELINE_ACTION_REMAP = new Map<string, string>([
  ["situation-room.pipeline.compose", "situation-room.pipeline.compose"],
  ["situation-room.pipeline.execute", "situation-room.pipeline.execute"],
  ["situation-room.pipeline.inspect", "situation-room.pipeline.inspect"],
  ["situation-room.pipeline.repair", "situation-room.pipeline.repair"],
  ["situation-room.live-source.set_rate", "situation-room.live-source.set_rate"],
]);

const splitLivePipelineAction = (action: string): { panel_id: string; action_id: string } | null => {
  const normalized = LIVE_PIPELINE_ACTION_REMAP.get(action.trim()) ?? action.trim();
  const dot = normalized.indexOf(".");
  if (dot <= 0 || dot >= normalized.length - 1) return null;
  return {
    panel_id: normalized.slice(0, dot),
    action_id: normalized.slice(dot + 1),
  };
};

export function buildLivePipelineWorkstationActions(args: {
  actions: string[];
  pipelineId?: string | null;
  pipelineReceiptId?: string | null;
}): LivePipelineToolTraceAction[] {
  const seen = new Set<string>();
  const out: LivePipelineToolTraceAction[] = [];
  for (const action of args.actions) {
    const parsed = splitLivePipelineAction(action);
    if (!parsed) continue;
    const key = `${parsed.panel_id}.${parsed.action_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      ...parsed,
      args: {
        pipeline_id: args.pipelineId ?? null,
        pipeline_receipt_id: args.pipelineReceiptId ?? null,
      },
    });
  }
  return out;
}

export function buildLivePipelineActionEnvelope(args: {
  actions: string[];
  pipelineId?: string | null;
  pipelineReceiptId?: string | null;
}): {
  schema: "helix.ask.action_envelope.v1";
  mode: "observe";
  source: "live_pipeline";
  workstation_actions: LivePipelineToolTraceAction[];
  governance: {
    dispatch: "suppress";
    reason_code: "live_pipeline_trace_disclosure";
    approval_state: "not_required";
    sandbox_profile: "workstation_ui_only";
  };
} {
  return {
    schema: "helix.ask.action_envelope.v1",
    mode: "observe",
    source: "live_pipeline",
    workstation_actions: buildLivePipelineWorkstationActions(args),
    governance: {
      dispatch: "suppress",
      reason_code: "live_pipeline_trace_disclosure",
      approval_state: "not_required",
      sandbox_profile: "workstation_ui_only",
    },
  };
}

export function buildLivePipelineToolTraceDisclosure(args: {
  turnId: string;
  actions: string[];
  pipelineId?: string | null;
  pipelineReceiptId?: string | null;
}): HelixAskToolTraceDisclosure {
  const workstationActions = buildLivePipelineWorkstationActions(args);
  return buildAskToolTraceDisclosure({
    turnId: args.turnId,
    steps: workstationActions.map((action) => ({ action })),
  });
}
