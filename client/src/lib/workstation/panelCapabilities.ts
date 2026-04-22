export type WorkstationPanelActionRisk = "low" | "medium" | "high";

export type WorkstationPanelActionDefinition = {
  id: string;
  title: string;
  description: string;
  risk: WorkstationPanelActionRisk;
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
      },
      {
        id: "open_doc",
        title: "Open Document",
        description: "Open a local docs path (optionally with anchor) in the Docs Viewer panel.",
        risk: "low",
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
};

export function getWorkstationPanelCapabilities(panelId: string): WorkstationPanelCapabilities | null {
  return WORKSTATION_V1_PANEL_CAPABILITIES[panelId] ?? null;
}
