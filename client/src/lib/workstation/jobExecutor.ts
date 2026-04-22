import { useAgiChatStore } from "@/store/useAgiChatStore";
import { panelRegistry } from "@/lib/desktop/panelRegistry";
import { getWorkstationPanelCapabilities } from "@/lib/workstation/panelCapabilities";
import {
  executeHelixPanelAction,
  type HelixPanelActionExecutionContext,
} from "@/lib/workstation/panelActionAdapters";

export type WorkstationJobPayload = {
  job_id?: string;
  title?: string;
  objective?: string;
  preferred_panels?: string[];
  max_steps?: number;
};

export type WorkstationJobStepReceipt = {
  step: number;
  panel_id: string;
  action_id: string;
  ok: boolean;
  started_at: string;
  duration_ms: number;
  message?: string;
  artifact?: Record<string, unknown> | null;
};

export type WorkstationJobExecutionResult = {
  job_id: string;
  title: string;
  objective: string;
  started_at: string;
  completed_at: string;
  ok: boolean;
  step_receipts: WorkstationJobStepReceipt[];
};

function normalizePanels(preferredPanels: string[] | undefined): string[] {
  const fromPayload = Array.isArray(preferredPanels)
    ? preferredPanels
        .map((id) => (typeof id === "string" ? id.trim() : ""))
        .filter(Boolean)
    : [];
  if (fromPayload.length > 0) return fromPayload;
  return panelRegistry
    .filter((panel) => panel.workstationCapabilities?.v1_job_ready)
    .map((panel) => panel.id);
}

function chooseActionId(panelId: string): string | null {
  const capabilities = getWorkstationPanelCapabilities(panelId);
  if (!capabilities || !capabilities.can_run_action || capabilities.actions.length === 0) return null;
  if (capabilities.safe_actions.includes("open")) return "open";
  if (capabilities.safe_actions.length > 0) return capabilities.safe_actions[0];
  return capabilities.actions[0]?.id ?? null;
}

function writeReceiptToTaskHistory(args: {
  contextId: string;
  role: "tool" | "assistant";
  content: string;
  traceId: string;
  tool?: string;
}): void {
  useAgiChatStore.getState().addContextMessage(
    args.contextId,
    {
      role: args.role,
      content: args.content,
      traceId: args.traceId,
      tool: args.tool,
    },
    "Task History",
  );
}

export async function runWorkstationJob(args: {
  contextId: string;
  payload: WorkstationJobPayload;
  executionContext: HelixPanelActionExecutionContext;
}): Promise<WorkstationJobExecutionResult> {
  const startedAtMs = Date.now();
  const startedAt = new Date(startedAtMs).toISOString();
  const jobId = args.payload.job_id?.trim() || `job:${crypto.randomUUID()}`;
  const title = args.payload.title?.trim() || "Workstation Job";
  const objective = args.payload.objective?.trim() || "Execute job-ready panel actions.";
  const traceId = `workstation-job:${jobId}`;

  writeReceiptToTaskHistory({
    contextId: args.contextId,
    role: "assistant",
    traceId,
    content: `Started job "${title}". Objective: ${objective}`,
  });

  const panelIds = normalizePanels(args.payload.preferred_panels);
  const maxStepsRaw = Number(args.payload.max_steps ?? 4);
  const maxSteps = Number.isFinite(maxStepsRaw) ? Math.max(1, Math.min(12, Math.floor(maxStepsRaw))) : 4;
  const receipts: WorkstationJobStepReceipt[] = [];

  for (let index = 0; index < panelIds.length && receipts.length < maxSteps; index += 1) {
    const panelId = panelIds[index];
    const actionId = chooseActionId(panelId);
    if (!actionId) continue;
    const stepStartMs = Date.now();
    const result = executeHelixPanelAction(
      {
        panel_id: panelId,
        action_id: actionId,
      },
      args.executionContext,
    );
    const durationMs = Math.max(0, Date.now() - stepStartMs);
    const receipt: WorkstationJobStepReceipt = {
      step: receipts.length + 1,
      panel_id: panelId,
      action_id: actionId,
      ok: result.ok,
      started_at: new Date(stepStartMs).toISOString(),
      duration_ms: durationMs,
      message: result.message,
      artifact: result.artifact ?? null,
    };
    receipts.push(receipt);

    writeReceiptToTaskHistory({
      contextId: args.contextId,
      role: "tool",
      traceId,
      tool: "workstation.job_executor",
      content: JSON.stringify(
        {
          kind: "job_step_receipt",
          job_id: jobId,
          ...receipt,
        },
        null,
        2,
      ),
    });
  }

  const completedAt = new Date().toISOString();
  const ok = receipts.length > 0 && receipts.every((receipt) => receipt.ok);
  writeReceiptToTaskHistory({
    contextId: args.contextId,
    role: "assistant",
    traceId,
    content: `Completed job "${title}" with ${receipts.length} step(s). Status: ${ok ? "ok" : "partial/fail"}.`,
  });

  return {
    job_id: jobId,
    title,
    objective,
    started_at: startedAt,
    completed_at: completedAt,
    ok,
    step_receipts: receipts,
  };
}
