export type WorkstationPanelActionRisk = "low" | "medium" | "high";

export type WorkstationPanelActionDefinition = {
  id: string;
  title: string;
  description: string;
  risk: WorkstationPanelActionRisk;
  aliases?: string[];
  required_args?: string[];
  optional_args?: string[];
  requires_confirmation?: boolean;
  returns_artifact?: boolean;
};

export type WorkstationPanelCapabilities = {
  version: 1;
  can_read_state: boolean;
  can_run_action: boolean;
  safe_actions: string[];
  requires_confirmation_actions: string[];
  returns_artifact_actions: string[];
  v1_job_ready: boolean;
  actions: WorkstationPanelActionDefinition[];
};

const EMPTY_CAPABILITIES: WorkstationPanelCapabilities = {
  version: 1,
  can_read_state: false,
  can_run_action: false,
  safe_actions: [],
  requires_confirmation_actions: [],
  returns_artifact_actions: [],
  v1_job_ready: false,
  actions: [],
};

function makeCapabilities(
  input: Partial<WorkstationPanelCapabilities> & Pick<WorkstationPanelCapabilities, "actions">,
): WorkstationPanelCapabilities {
  const actions = input.actions ?? [];
  const safeActions =
    input.safe_actions ??
    actions.filter((action) => action.risk === "low").map((action) => action.id);
  const requiresConfirmation =
    input.requires_confirmation_actions ??
    actions.filter((action) => action.requires_confirmation).map((action) => action.id);
  const returnsArtifact =
    input.returns_artifact_actions ??
    actions.filter((action) => action.returns_artifact).map((action) => action.id);

  return {
    ...EMPTY_CAPABILITIES,
    ...input,
    actions,
    safe_actions: safeActions,
    requires_confirmation_actions: requiresConfirmation,
    returns_artifact_actions: returnsArtifact,
  };
}

export const WORKSTATION_V1_PANEL_CAPABILITIES: Record<string, WorkstationPanelCapabilities> = {
  "docs-viewer": makeCapabilities({
    can_read_state: true,
    can_run_action: true,
    v1_job_ready: true,
    actions: [
      {
        id: "open",
        title: "Open Docs Viewer",
        description: "Open and focus the Docs Viewer panel.",
        risk: "low",
        aliases: ["open docs", "show docs", "view docs", "open docs viewer"],
      },
      {
        id: "open_doc",
        title: "Open Document",
        description: "Open a local docs path (optionally with anchor) in the Docs Viewer panel.",
        risk: "low",
        aliases: ["open doc", "open document", "view doc", "show document"],
        required_args: ["path"],
        optional_args: ["anchor"],
        returns_artifact: true,
      },
      {
        id: "open_doc_and_read",
        title: "Open Document And Read",
        description: "Open a local docs path and start read-aloud in Docs Viewer.",
        risk: "low",
        aliases: ["read this doc", "read this document", "read current doc", "read doc to me"],
        required_args: ["path"],
        optional_args: ["anchor"],
        returns_artifact: true,
      },
      {
        id: "open_directory",
        title: "Open Docs Directory",
        description: "Switch Docs Viewer to directory mode.",
        risk: "low",
        aliases: ["open docs directory", "show docs directory", "view docs directory"],
        returns_artifact: true,
      },
      {
        id: "summarize_doc",
        title: "Summarize Document",
        description: "Summarize the current/target document in Helix Ask.",
        risk: "low",
        aliases: ["summarize doc", "summarize document", "doc summary"],
        optional_args: ["path", "anchor", "selected_text"],
        returns_artifact: true,
      },
      {
        id: "summarize_section",
        title: "Summarize Section",
        description: "Summarize a section in the current/target document in Helix Ask.",
        risk: "low",
        aliases: ["summarize section", "summarize this section", "section summary"],
        optional_args: ["path", "anchor", "selected_text"],
        returns_artifact: true,
      },
      {
        id: "explain_paper",
        title: "Explain Paper",
        description: "Explain the current/target paper in plain language in Helix Ask.",
        risk: "low",
        aliases: ["explain this paper", "explain this doc", "what does this doc do"],
        optional_args: ["path", "anchor", "selected_text"],
        returns_artifact: true,
      },
    ],
  }),
  "agi-essence-console": makeCapabilities({
    can_read_state: true,
    can_run_action: true,
    v1_job_ready: true,
    actions: [
      {
        id: "open",
        title: "Open Console",
        description: "Open and focus the AGI Essence Console panel.",
        risk: "low",
      },
    ],
  }),
  "agi-task-history": makeCapabilities({
    can_read_state: true,
    can_run_action: true,
    v1_job_ready: true,
    actions: [
      {
        id: "open",
        title: "Open Task History",
        description: "Open and focus Task History to inspect run progression and outcomes.",
        risk: "low",
      },
    ],
  }),
  "needle-mk2-calculator": makeCapabilities({
    can_read_state: true,
    can_run_action: true,
    v1_job_ready: true,
    actions: [
      {
        id: "open",
        title: "Open Calculator",
        description: "Open and focus the NHM2 calculator panel for compute steps.",
        risk: "low",
      },
    ],
  }),
  "scientific-calculator": makeCapabilities({
    can_read_state: true,
    can_run_action: true,
    v1_job_ready: true,
    actions: [
      {
        id: "open",
        title: "Open Scientific Calculator",
        description: "Open and focus the scientific calculator panel.",
        risk: "low",
      },
      {
        id: "ingest_latex",
        title: "Ingest LaTeX",
        description: "Load LaTeX/expression text into the calculator workspace.",
        risk: "low",
        required_args: ["latex"],
        optional_args: ["source_path", "anchor"],
        returns_artifact: true,
      },
      {
        id: "solve_expression",
        title: "Solve Expression",
        description: "Solve/evaluate the current or provided expression.",
        risk: "low",
        optional_args: ["latex"],
        returns_artifact: true,
      },
      {
        id: "solve_with_steps",
        title: "Solve With Steps",
        description: "Solve/evaluate with an explicit step trace.",
        risk: "low",
        optional_args: ["latex"],
        returns_artifact: true,
      },
      {
        id: "copy_result",
        title: "Copy Result",
        description: "Copy the latest solve result to clipboard.",
        risk: "low",
        returns_artifact: true,
      },
      {
        id: "clear_workspace",
        title: "Clear Workspace",
        description: "Clear calculator input/result workspace state.",
        risk: "low",
        returns_artifact: true,
      },
    ],
  }),
  "rag-admin": makeCapabilities({
    can_read_state: true,
    can_run_action: true,
    v1_job_ready: true,
    actions: [
      {
        id: "open",
        title: "Open RAG Admin",
        description: "Open and focus RAG Admin for retrieval indexing and source management.",
        risk: "low",
      },
    ],
  }),
  "code-admin": makeCapabilities({
    can_read_state: true,
    can_run_action: true,
    v1_job_ready: true,
    actions: [
      {
        id: "open",
        title: "Open Code Admin",
        description: "Open and focus Code Admin for code-oriented analysis workflows.",
        risk: "low",
      },
    ],
  }),
  "helix-noise-gens": makeCapabilities({
    can_read_state: true,
    can_run_action: true,
    v1_job_ready: true,
    actions: [
      {
        id: "open",
        title: "Open Noise Gens",
        description: "Open and focus Helix Noise Gens control surface.",
        risk: "low",
      },
    ],
  }),
  "agi-contribution-workbench": makeCapabilities({
    can_read_state: true,
    can_run_action: true,
    v1_job_ready: true,
    actions: [
      {
        id: "open",
        title: "Open Workbench",
        description: "Open and focus the contribution workbench for receipts/review workflows.",
        risk: "low",
      },
    ],
  }),
  "workstation-notes": makeCapabilities({
    can_read_state: true,
    can_run_action: true,
    v1_job_ready: true,
    actions: [
      {
        id: "open",
        title: "Open Notes",
        description: "Open and focus workstation notes for macro note storage.",
        risk: "low",
        aliases: ["open notes", "show notes", "view notes"],
      },
      {
        id: "create_note",
        title: "Create Note",
        description: "Create a note and set it as active.",
        risk: "low",
        aliases: ["create note", "new note", "start note"],
        optional_args: ["title", "topic", "body", "note_id"],
        returns_artifact: true,
      },
      {
        id: "append_to_note",
        title: "Append To Note",
        description: "Append text to a note body (defaults to active note).",
        risk: "low",
        aliases: ["append to note", "add to note", "note append"],
        required_args: ["text"],
        optional_args: ["note_id", "title"],
        returns_artifact: true,
      },
      {
        id: "set_active_note",
        title: "Set Active Note",
        description: "Switch the active note by id/title.",
        risk: "low",
        aliases: ["open note", "switch to note", "set active note", "select note"],
        optional_args: ["note_id", "title"],
        returns_artifact: true,
      },
      {
        id: "rename_note",
        title: "Rename Note",
        description: "Rename an existing note.",
        risk: "low",
        aliases: ["rename note"],
        required_args: ["title"],
        optional_args: ["note_id", "from_title"],
        returns_artifact: true,
      },
      {
        id: "delete_note",
        title: "Delete Note",
        description: "Delete an existing note.",
        risk: "high",
        aliases: ["delete note", "remove note"],
        optional_args: ["note_id", "title", "confirmed"],
        requires_confirmation: true,
        returns_artifact: true,
      },
      {
        id: "list_notes",
        title: "List Notes",
        description: "Return the current notes list and active note.",
        risk: "low",
        aliases: ["list notes", "show notes", "my notes"],
        returns_artifact: true,
      },
    ],
  }),
  "workstation-clipboard-history": makeCapabilities({
    can_read_state: true,
    can_run_action: true,
    v1_job_ready: true,
    actions: [
      {
        id: "open",
        title: "Open Clipboard History",
        description: "Open and focus clipboard receipts timeline.",
        risk: "low",
        aliases: ["open clipboard", "show clipboard", "view clipboard history"],
      },
      {
        id: "read_clipboard",
        title: "Read Clipboard",
        description: "Read current clipboard text and record receipt.",
        risk: "low",
        aliases: ["read clipboard", "what is in clipboard", "paste from clipboard"],
        returns_artifact: true,
      },
      {
        id: "write_clipboard",
        title: "Write Clipboard",
        description: "Write text to clipboard and record receipt.",
        risk: "low",
        aliases: ["write clipboard", "copy this to clipboard", "copy to clipboard"],
        required_args: ["text"],
        optional_args: ["source"],
        returns_artifact: true,
      },
      {
        id: "clear_history",
        title: "Clear Clipboard History",
        description: "Clear clipboard receipt history.",
        risk: "high",
        aliases: ["clear clipboard history", "clear clipboard", "wipe clipboard history"],
        optional_args: ["confirmed"],
        requires_confirmation: true,
        returns_artifact: true,
      },
      {
        id: "copy_receipt_to_clipboard",
        title: "Copy Receipt To Clipboard",
        description: "Copy latest/specified clipboard receipt text back into clipboard.",
        risk: "low",
        aliases: ["copy latest clipboard entry", "copy receipt to clipboard"],
        optional_args: ["receipt_id"],
        returns_artifact: true,
      },
      {
        id: "copy_receipt_to_note",
        title: "Copy Receipt To Note",
        description: "Append clipboard receipt text to a note.",
        risk: "low",
        aliases: ["copy latest clipboard entry to note", "copy receipt to note"],
        optional_args: ["receipt_id", "note_id", "note_title"],
        returns_artifact: true,
      },
      {
        id: "copy_selection_to_note",
        title: "Copy Selection To Note",
        description: "Append current UI text selection (or clipboard fallback) to a note.",
        risk: "low",
        aliases: [
          "copy this abstract to a note pad",
          "copy this abstract to note",
          "copy this section to note",
          "copy this excerpt to note",
        ],
        optional_args: ["note_id", "note_title"],
        returns_artifact: true,
      },
    ],
  }),
  "workstation-workflow-timeline": makeCapabilities({
    can_read_state: true,
    can_run_action: true,
    v1_job_ready: true,
    actions: [
      {
        id: "open",
        title: "Open Workflow Timeline",
        description: "Open and focus cross-panel workflow timeline.",
        risk: "low",
      },
    ],
  }),
};

export function getWorkstationPanelCapabilities(panelId: string): WorkstationPanelCapabilities | null {
  return WORKSTATION_V1_PANEL_CAPABILITIES[panelId] ?? null;
}
