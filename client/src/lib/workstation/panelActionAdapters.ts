import { openDocPanel } from "@/lib/docs/openDocPanel";
import { getPanelDef } from "@/lib/desktop/panelRegistry";
import { launchHelixAskPrompt } from "@/lib/helix/ask-prompt-launch";
import type { HelixAskAnswerContract } from "@/lib/helix/ask-prompt-launch";
import type { SettingsTab } from "@/hooks/useHelixStartSettings";
import { useDocViewerStore } from "@/store/useDocViewerStore";

export type HelixPanelActionRequest = {
  panel_id: string;
  action_id: string;
  args?: Record<string, unknown>;
};

export type HelixPanelActionExecutionResult = {
  ok: boolean;
  panel_id: string;
  action_id: string;
  artifact?: Record<string, unknown> | null;
  message?: string;
};

export type HelixPanelActionExecutionContext = {
  openPanel: (panelId: string, groupId?: string) => void;
  focusPanel: (panelId: string, groupId?: string) => void;
  closePanel: (panelId: string, groupId?: string) => void;
  openSettings: (tab?: SettingsTab) => void;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildDocReasoningPrompt(args: {
  mode: "summarize_doc" | "summarize_section" | "explain_paper";
  path: string;
  anchor?: string;
  selectedText?: string;
}): string {
  const pathLine = `Document path: ${args.path}`;
  const anchorLine = args.anchor ? `Section anchor: #${args.anchor}` : null;
  const selectionLine = args.selectedText ? `Selected text: "${args.selectedText}"` : null;
  const contextLines = [pathLine, anchorLine, selectionLine].filter(Boolean).join("\n");

  if (args.mode === "summarize_section") {
    return `Summarize this section from the current docs viewer selection. Start with one sentence on what this section is for, then key points.\n${contextLines}`;
  }
  if (args.mode === "explain_paper") {
    return `Explain this paper from the current docs viewer context in plain language.\n${contextLines}`;
  }
  return `Summarize this document from the current docs viewer context. Start with one sentence on what this document is for, then key findings and caveats.\n${contextLines}`;
}

function buildDocAnswerContract(mode: "summarize_doc" | "summarize_section" | "explain_paper"): HelixAskAnswerContract {
  const sharedSections = [
    { id: "purpose", heading: "Purpose", required: true, synonyms: ["What this document is for"] },
  ];
  if (mode === "summarize_section") {
    return {
      schema: "helix.ask.answer_contract.v1",
      source: "docs_viewer",
      mode,
      strict_sections: true,
      min_tokens: 900,
      sections: [
        ...sharedSections,
        { id: "key_points", heading: "Key Points", required: true, synonyms: ["Findings"] },
        { id: "caveats", heading: "Caveats", required: true, synonyms: ["Limits", "Limitations"] },
        { id: "next_checks", heading: "Next Checks", required: false, synonyms: ["Follow-ups"] },
      ],
    };
  }
  if (mode === "explain_paper") {
    return {
      schema: "helix.ask.answer_contract.v1",
      source: "docs_viewer",
      mode,
      strict_sections: true,
      min_tokens: 1000,
      sections: [
        ...sharedSections,
        { id: "core_mechanism", heading: "Core Mechanism", required: true, synonyms: ["How it works"] },
        { id: "evidence", heading: "Evidence", required: true, synonyms: ["Findings"] },
        { id: "caveats", heading: "Caveats", required: true, synonyms: ["Limits", "Limitations"] },
      ],
    };
  }
  return {
    schema: "helix.ask.answer_contract.v1",
    source: "docs_viewer",
    mode,
    strict_sections: true,
    min_tokens: 1100,
    sections: [
      ...sharedSections,
      { id: "findings", heading: "Findings", required: true, synonyms: ["Key Findings", "Key Points"] },
      { id: "caveats", heading: "Caveats", required: true, synonyms: ["Limits", "Limitations"] },
      { id: "next_checks", heading: "Next Checks", required: false, synonyms: ["Follow-ups"] },
    ],
  };
}

export function executeHelixPanelAction(
  request: HelixPanelActionRequest,
  context: HelixPanelActionExecutionContext,
): HelixPanelActionExecutionResult {
  const panelId = request.panel_id?.trim();
  const actionId = request.action_id?.trim().toLowerCase();
  if (!panelId || !actionId) {
    return {
      ok: false,
      panel_id: request.panel_id || "",
      action_id: request.action_id || "",
      message: "panel_id and action_id are required.",
    };
  }

  if (actionId === "open") {
    context.openPanel(panelId, undefined);
    context.focusPanel(panelId, undefined);
    return { ok: true, panel_id: panelId, action_id: actionId };
  }

  if (actionId === "focus") {
    context.focusPanel(panelId, undefined);
    return { ok: true, panel_id: panelId, action_id: actionId };
  }

  if (actionId === "close") {
    context.closePanel(panelId, undefined);
    return { ok: true, panel_id: panelId, action_id: actionId };
  }

  if (panelId === "docs-viewer" && actionId === "open_doc") {
    const args = asRecord(request.args) ?? {};
    const path = asNonEmptyString(args.path ?? args.doc_path ?? args.target);
    const anchor = asNonEmptyString(args.anchor);
    if (!path) {
      return {
        ok: false,
        panel_id: panelId,
        action_id: actionId,
        message: "docs-viewer.open_doc requires a path.",
      };
    }
    context.openPanel("docs-viewer", undefined);
    context.focusPanel("docs-viewer", undefined);
    openDocPanel(anchor ? { path, anchor } : { path });
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: { path, anchor: anchor ?? null },
    };
  }

  if (panelId === "docs-viewer" && actionId === "open_doc_and_read") {
    const args = asRecord(request.args) ?? {};
    const path = asNonEmptyString(args.path ?? args.doc_path ?? args.target);
    const anchor = asNonEmptyString(args.anchor);
    if (!path) {
      return {
        ok: false,
        panel_id: panelId,
        action_id: actionId,
        message: "docs-viewer.open_doc_and_read requires a path.",
      };
    }
    context.openPanel("docs-viewer", undefined);
    context.focusPanel("docs-viewer", undefined);
    openDocPanel(anchor ? { path, anchor, autoRead: true } : { path, autoRead: true });
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: { path, anchor: anchor ?? null, autoRead: true },
    };
  }

  if (panelId === "docs-viewer" && actionId === "open_directory") {
    useDocViewerStore.getState().viewDirectory();
    context.openPanel("docs-viewer", undefined);
    context.focusPanel("docs-viewer", undefined);
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: { mode: "directory" },
    };
  }

  if (
    panelId === "docs-viewer" &&
    (actionId === "summarize_doc" || actionId === "summarize_section" || actionId === "explain_paper")
  ) {
    const args = asRecord(request.args) ?? {};
    const store = useDocViewerStore.getState();
    const path =
      asNonEmptyString(args.path ?? args.doc_path ?? args.target) ??
      asNonEmptyString(store.currentPath);
    const anchor = asNonEmptyString(args.anchor) ?? asNonEmptyString(store.anchor);
    const selectedText = asNonEmptyString(args.selected_text ?? args.selection_text ?? args.selection);
    if (!path) {
      return {
        ok: false,
        panel_id: panelId,
        action_id: actionId,
        message: "No active docs context to summarize/explain.",
      };
    }
    const prompt = buildDocReasoningPrompt({
      mode: actionId,
      path,
      anchor: anchor ?? undefined,
      selectedText: selectedText ?? undefined,
    });
    launchHelixAskPrompt({
      question: prompt,
      autoSubmit: true,
      panelId: "docs-viewer",
      bypassWorkstationDispatch: true,
      forceReasoningDispatch: true,
      suppressWorkstationPayloadActions: true,
      answerContract: buildDocAnswerContract(actionId),
    });
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: {
        path,
        anchor: anchor ?? null,
        selected_text: selectedText ?? null,
        launched_prompt: true,
      },
      message:
        actionId === "summarize_section"
          ? "Summarizing current section in Helix Ask."
          : actionId === "explain_paper"
            ? "Explaining current paper in Helix Ask."
            : "Summarizing current document in Helix Ask.",
    };
  }

  if (panelId === "agi-essence-console" && actionId === "open_settings") {
    const args = asRecord(request.args) ?? {};
    const tabRaw = asNonEmptyString(args.tab);
    const tab: SettingsTab = tabRaw === "knowledge" ? "knowledge" : "preferences";
    context.openSettings(tab);
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: { tab },
    };
  }

  if (!getPanelDef(panelId)) {
    return {
      ok: false,
      panel_id: panelId,
      action_id: actionId,
      message: `Unknown panel: ${panelId}`,
    };
  }

  return {
    ok: false,
    panel_id: panelId,
    action_id: actionId,
    message: `Action not supported for panel: ${panelId}.${actionId}`,
  };
}
