export type WorkstationDynamicToolRisk = "low" | "medium" | "high";

export type WorkstationDynamicToolActionDefinition = {
  panel_id: string;
  action_id: string;
  title?: string;
  description?: string;
  risk?: WorkstationDynamicToolRisk;
  aliases?: string[];
  required_args?: string[];
  optional_args?: string[];
  requires_confirmation?: boolean;
  returns_artifact?: boolean;
};

export type WorkspaceActionRegistryEntry = {
  action_key: string;
  family:
    | "panel_control"
    | "docs_viewer"
    | "notes"
    | "clipboard"
    | "situation_room"
    | "timeline"
    | "task_history"
    | "calculator"
    | "console";
  target_id: string;
  action_id: string;
  label: string;
  aliases: string[];
  terminal_receipt_required: true;
  source: "static_registry" | "desktop_panel_manifest" | "shared_dynamic_tool_registry";
  enabled: boolean;
};

export type WorkspaceActionManifestEntry = Omit<WorkspaceActionRegistryEntry, "source"> & {
  client_handler_key: string;
  source: "desktop_panel_manifest" | "shared_dynamic_tool_registry" | "static_backstop";
};

export type WorkspaceActionRegistryAudit = {
  manifest_version: string;
  visible_panels: string[];
  registry_targets: string[];
  client_handlers: string[];
  missing_from_registry: string[];
  missing_client_handler: string[];
  stale_registry_entries: string[];
  verdict: "clean" | "warning" | "violation";
};

export type WorkstationDynamicToolSpec = {
  namespace: "workstation";
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  deferLoading: boolean;
  risk: WorkstationDynamicToolRisk;
  returns_artifact: boolean;
  requires_confirmation: boolean;
  panel_id: string;
  action_id: string;
  terminal_artifact_kind: string | null;
  attachment_policy?: "manual_only";
  context_injection?: "explicit_attachment_only";
};

export type WorkstationDynamicToolCallMapping =
  | {
      ok: true;
      action: {
        schema_version: "helix.workstation.action/v1";
        action: "open_panel" | "focus_panel";
        panel_id: string;
      };
    }
  | {
      ok: true;
      action: {
        schema_version: "helix.workstation.action/v1";
        action: "run_panel_action";
        panel_id: string;
        action_id: string;
        args?: Record<string, unknown>;
      };
    }
  | {
      ok: false;
      reason: "unknown_tool" | "missing_required_args";
      missing_required_args: string[];
    };

type PanelCapabilitiesLike = Record<
  string,
  {
    actions: Array<{
      id: string;
      title?: string;
      description?: string;
      risk?: WorkstationDynamicToolRisk;
      aliases?: string[];
      required_args?: string[];
      optional_args?: string[];
      requires_confirmation?: boolean;
      returns_artifact?: boolean;
    }>;
  }
>;

const SITUATION_ROOM_MANUAL_ONLY_ACTIONS = new Set([
  "situation-room-pipelines.setup_from_prompt",
  "situation-room-pipelines.create_job",
  "situation-room-pipelines.run_job",
  "situation-room-pipelines.attach_job_to_helix_ask",
  "situation-room-pipelines.create_graph",
  "situation-room-pipelines.create_translation_pair",
  "situation-room-pipelines.attach_graph_to_helix_ask",
]);

export const WORKSTATION_DYNAMIC_TOOL_ACTIONS: WorkstationDynamicToolActionDefinition[] = [
  { panel_id: "docs-viewer", action_id: "open", required_args: [], optional_args: [] },
  {
    panel_id: "docs-viewer",
    action_id: "open_directory",
    title: "Open docs directory",
    description: "Open the Docs & Papers panel and show the document directory.",
    aliases: [
      "show the docs directory",
      "open docs directory",
      "show document directory",
      "open document tree",
      "show docs tree",
      "open papers directory",
    ],
    required_args: [],
    optional_args: [],
  },
  { panel_id: "docs-viewer", action_id: "open_doc", required_args: ["path"], optional_args: ["anchor"], returns_artifact: true },
  { panel_id: "docs-viewer", action_id: "open_doc_by_path", required_args: ["path"], optional_args: ["anchor"], returns_artifact: true },
  { panel_id: "docs-viewer", action_id: "open_latest_doc_by_topic", required_args: ["topic"], optional_args: ["path"], returns_artifact: true },
  { panel_id: "docs-viewer", action_id: "search_docs", required_args: ["query"], optional_args: ["limit"], returns_artifact: true },
  { panel_id: "docs-viewer", action_id: "validate_doc_candidates", required_args: ["query"], optional_args: ["limit"], returns_artifact: true },
  { panel_id: "docs-viewer", action_id: "verify_active_doc", required_args: [], optional_args: [], returns_artifact: true },
  { panel_id: "docs-viewer", action_id: "open_doc_and_read", required_args: ["path"], optional_args: ["anchor"], returns_artifact: true },
  { panel_id: "docs-viewer", action_id: "identify_current_doc", required_args: [], optional_args: [], returns_artifact: true },
  { panel_id: "docs-viewer", action_id: "locate_in_doc", required_args: ["query"], optional_args: ["path", "anchor"], returns_artifact: true },
  { panel_id: "docs-viewer", action_id: "summarize_doc", required_args: [], optional_args: ["path", "anchor", "selected_text"], returns_artifact: true },
  { panel_id: "docs-viewer", action_id: "summarize_section", required_args: [], optional_args: ["path", "anchor", "selected_text"], returns_artifact: true },
  { panel_id: "docs-viewer", action_id: "explain_paper", required_args: [], optional_args: ["path", "anchor", "selected_text"], returns_artifact: true },
  { panel_id: "workstation-notes", action_id: "open", required_args: [], optional_args: [] },
  { panel_id: "workstation-notes", action_id: "create_note", required_args: [], optional_args: ["title", "topic", "body", "note_id"], returns_artifact: true },
  { panel_id: "workstation-notes", action_id: "append_to_note", required_args: ["text"], optional_args: ["note_id", "title"], returns_artifact: true },
  { panel_id: "workstation-notes", action_id: "set_active_note", required_args: [], optional_args: ["note_id", "title"], returns_artifact: true },
  { panel_id: "workstation-notes", action_id: "rename_note", required_args: ["title"], optional_args: ["note_id", "from_title"], returns_artifact: true },
  { panel_id: "workstation-notes", action_id: "delete_note", required_args: [], optional_args: ["note_id", "title", "confirmed"], requires_confirmation: true, returns_artifact: true },
  { panel_id: "workstation-notes", action_id: "list_notes", required_args: [], optional_args: ["active_note_title", "title", "active_note_id", "note_id"], returns_artifact: true },
  { panel_id: "workstation-clipboard-history", action_id: "open", required_args: [], optional_args: [] },
  { panel_id: "workstation-clipboard-history", action_id: "read_clipboard", required_args: [], optional_args: [], returns_artifact: true },
  { panel_id: "workstation-clipboard-history", action_id: "write_clipboard", required_args: ["text"], optional_args: ["source"], returns_artifact: true },
  { panel_id: "workstation-clipboard-history", action_id: "clear_history", required_args: [], optional_args: ["confirmed"], requires_confirmation: true, returns_artifact: true },
  { panel_id: "workstation-clipboard-history", action_id: "copy_receipt_to_clipboard", required_args: [], optional_args: ["receipt_id"], returns_artifact: true },
  { panel_id: "workstation-clipboard-history", action_id: "copy_receipt_to_note", required_args: [], optional_args: ["receipt_id", "note_id", "note_title"], returns_artifact: true },
  { panel_id: "workstation-clipboard-history", action_id: "copy_selection_to_note", required_args: [], optional_args: ["note_id", "note_title"], returns_artifact: true },
  { panel_id: "situation-room-sources", action_id: "open", required_args: [], optional_args: [] },
  { panel_id: "situation-room-sources", action_id: "attach_display_audio_source", required_args: [], optional_args: ["room_id", "label"], risk: "medium", returns_artifact: true },
  { panel_id: "situation-room-sources", action_id: "attach_mic_audio_source", required_args: [], optional_args: ["room_id", "label"], risk: "medium", returns_artifact: true },
  { panel_id: "situation-room-sources", action_id: "save_room_as_note", required_args: [], optional_args: ["room_id"], returns_artifact: true },
  { panel_id: "situation-room-sources", action_id: "attach_room_to_helix_ask", required_args: [], optional_args: ["room_id", "source_id"], returns_artifact: true },
  { panel_id: "situation-room-sources", action_id: "stop_room", required_args: [], optional_args: ["room_id"], risk: "medium", returns_artifact: true },
  { panel_id: "situation-room-pipelines", action_id: "open", required_args: [], optional_args: [] },
  {
    panel_id: "situation-room-pipelines",
    action_id: "setup_from_prompt",
    required_args: ["intent"],
    optional_args: [
      "capture_preference",
      "room_id",
      "source_ids",
      "speaker_a_id",
      "speaker_b_id",
      "speaker_a_native_language",
      "speaker_b_native_language",
      "output_mode",
    ],
    risk: "medium",
    returns_artifact: true,
  },
  {
    panel_id: "situation-room-pipelines",
    action_id: "create_job",
    required_args: ["kind"],
    optional_args: [
      "room_id",
      "source_ids",
      "target_language",
      "native_language",
      "input_text_policy",
      "output_render_policy",
      "chunk_ranges",
      "attachment_policy",
      "context_injection",
      "derived_outputs_auto_attach",
      "command_lane_enabled",
    ],
    risk: "medium",
    returns_artifact: true,
  },
  { panel_id: "situation-room-pipelines", action_id: "run_job", required_args: ["job_id"], optional_args: [], risk: "medium", returns_artifact: true },
  { panel_id: "situation-room-pipelines", action_id: "attach_job_to_helix_ask", required_args: ["job_id"], optional_args: [], returns_artifact: true },
  { panel_id: "situation-room-pipelines", action_id: "save_job_as_note", required_args: ["job_id"], optional_args: [], returns_artifact: true },
  { panel_id: "situation-room-pipelines", action_id: "stop_job", required_args: ["job_id"], optional_args: [], risk: "medium", returns_artifact: true },
  { panel_id: "situation-room-pipelines", action_id: "create_graph", required_args: [], optional_args: ["room_id", "title"], returns_artifact: true },
  { panel_id: "situation-room-pipelines", action_id: "add_node", required_args: ["graph_id", "type", "title"], optional_args: ["column", "status", "source_id", "speaker_id", "job_id"], returns_artifact: true },
  { panel_id: "situation-room-pipelines", action_id: "connect_nodes", required_args: ["graph_id", "from_node_id", "to_node_id", "lane"], optional_args: ["from_port", "to_port"], returns_artifact: true },
  {
    panel_id: "situation-room-pipelines",
    action_id: "create_translation_pair",
    required_args: ["speaker_a_id", "speaker_b_id", "speaker_a_native_language", "speaker_b_native_language"],
    optional_args: ["graph_id", "room_id", "source_ids", "render_policy", "voice_output", "title"],
    risk: "medium",
    returns_artifact: true,
  },
  { panel_id: "situation-room-pipelines", action_id: "attach_graph_to_helix_ask", required_args: ["graph_id"], optional_args: [], returns_artifact: true },
  { panel_id: "workstation-workflow-timeline", action_id: "open", required_args: [], optional_args: [] },
  { panel_id: "agi-essence-console", action_id: "open", required_args: [], optional_args: [] },
  { panel_id: "agi-task-history", action_id: "open", required_args: [], optional_args: [] },
  { panel_id: "scientific-calculator", action_id: "open", required_args: [], optional_args: [] },
];

export const WORKSPACE_ACTION_REGISTRY: WorkspaceActionRegistryEntry[] = [
  {
    action_key: "docs-viewer.open",
    family: "docs_viewer",
    target_id: "docs-viewer",
    action_id: "open",
    label: "Docs & Papers",
    aliases: ["open the docs and papers panel", "open docs viewer", "show docs and papers"],
    terminal_receipt_required: true,
    source: "shared_dynamic_tool_registry",
    enabled: true,
  },
  {
    action_key: "docs-viewer.open_directory",
    family: "docs_viewer",
    target_id: "docs-viewer",
    action_id: "open_directory",
    label: "Docs Directory",
    aliases: [
      "show the docs directory",
      "open docs directory",
      "show document directory",
      "open document tree",
      "show docs tree",
      "open papers directory",
    ],
    terminal_receipt_required: true,
    source: "shared_dynamic_tool_registry",
    enabled: true,
  },
  {
    action_key: "workstation-notes.open",
    family: "notes",
    target_id: "workstation-notes",
    action_id: "open",
    label: "Workstation Notes",
    aliases: ["open workstation notes", "show notes", "open my notes"],
    terminal_receipt_required: true,
    source: "shared_dynamic_tool_registry",
    enabled: true,
  },
  {
    action_key: "workstation-clipboard-history.open",
    family: "clipboard",
    target_id: "workstation-clipboard-history",
    action_id: "open",
    label: "Clipboard History",
    aliases: ["open clipboard history", "show clipboard history", "open clipboard"],
    terminal_receipt_required: true,
    source: "shared_dynamic_tool_registry",
    enabled: true,
  },
  {
    action_key: "situation-room-sources.open",
    family: "situation_room",
    target_id: "situation-room-sources",
    action_id: "open",
    label: "Situation Room Sources",
    aliases: ["open situation room sources", "show situation room sources", "open room sources"],
    terminal_receipt_required: true,
    source: "shared_dynamic_tool_registry",
    enabled: true,
  },
  {
    action_key: "situation-room-pipelines.open",
    family: "situation_room",
    target_id: "situation-room-pipelines",
    action_id: "open",
    label: "Situation Room Pipelines",
    aliases: ["open situation room pipelines", "show situation room pipelines", "open room pipelines"],
    terminal_receipt_required: true,
    source: "shared_dynamic_tool_registry",
    enabled: true,
  },
  {
    action_key: "workstation-workflow-timeline.open",
    family: "timeline",
    target_id: "workstation-workflow-timeline",
    action_id: "open",
    label: "Workflow Timeline",
    aliases: ["open workflow timeline", "show workflow timeline", "open workstation workflow timeline"],
    terminal_receipt_required: true,
    source: "desktop_panel_manifest",
    enabled: true,
  },
  {
    action_key: "agi-essence-console.open",
    family: "console",
    target_id: "agi-essence-console",
    action_id: "open",
    label: "Essence Console",
    aliases: ["open essence console", "open helix console", "show essence console"],
    terminal_receipt_required: true,
    source: "desktop_panel_manifest",
    enabled: true,
  },
  {
    action_key: "agi-task-history.open",
    family: "task_history",
    target_id: "agi-task-history",
    action_id: "open",
    label: "Task History",
    aliases: ["open task history", "show task history", "open agi task history"],
    terminal_receipt_required: true,
    source: "desktop_panel_manifest",
    enabled: true,
  },
  {
    action_key: "scientific-calculator.open",
    family: "calculator",
    target_id: "scientific-calculator",
    action_id: "open",
    label: "Scientific Calculator",
    aliases: ["open scientific calculator", "show scientific calculator", "open calculator"],
    terminal_receipt_required: true,
    source: "desktop_panel_manifest",
    enabled: true,
  },
];

export const WORKSPACE_ACTION_MANIFEST_VERSION = "e67.workspace-action-manifest.v1";

export const WORKSPACE_ACTION_VISIBLE_PANEL_IDS = [
  "docs-viewer",
  "workstation-notes",
  "workstation-clipboard-history",
  "situation-room-sources",
  "situation-room-pipelines",
  "workstation-workflow-timeline",
  "agi-essence-console",
  "agi-task-history",
  "scientific-calculator",
] as const;

export const WORKSPACE_ACTION_MANIFEST: WorkspaceActionManifestEntry[] = WORKSPACE_ACTION_REGISTRY.map((entry) => ({
  action_key: entry.action_key,
  family: entry.family,
  target_id: entry.target_id,
  action_id: entry.action_id,
  label: entry.label,
  aliases: entry.aliases,
  terminal_receipt_required: entry.terminal_receipt_required,
  client_handler_key: entry.action_key,
  source: entry.source === "static_registry" ? "static_backstop" : entry.source,
  enabled: entry.enabled,
}));

export const WORKSPACE_ACTION_CLIENT_HANDLER_KEYS = WORKSPACE_ACTION_MANIFEST.map((entry) => entry.client_handler_key);

export function buildWorkspaceActionRegistryAudit(args?: {
  visiblePanels?: readonly string[];
  registry?: readonly WorkspaceActionRegistryEntry[];
  manifest?: readonly WorkspaceActionManifestEntry[];
  clientHandlers?: readonly string[];
}): WorkspaceActionRegistryAudit {
  const visiblePanels = [...(args?.visiblePanels ?? WORKSPACE_ACTION_VISIBLE_PANEL_IDS)];
  const registry = [...(args?.registry ?? WORKSPACE_ACTION_REGISTRY)];
  const manifest = [...(args?.manifest ?? WORKSPACE_ACTION_MANIFEST)];
  const clientHandlers = [...(args?.clientHandlers ?? WORKSPACE_ACTION_CLIENT_HANDLER_KEYS)];
  const enabledManifest = manifest.filter((entry) => entry.enabled);
  const registryKeys = new Set(registry.filter((entry) => entry.enabled).map((entry) => entry.action_key));
  const registryTargets = registry
    .filter((entry) => entry.enabled)
    .map((entry) => entry.action_key);
  const manifestKeys = new Set(enabledManifest.map((entry) => entry.action_key));
  const manifestTargets = new Set(enabledManifest.map((entry) => entry.target_id));
  const clientHandlerKeys = new Set(clientHandlers);
  const missingVisiblePanels = visiblePanels
    .filter((panelId) => !manifestTargets.has(panelId))
    .map((panelId) => `${panelId}.*`);
  const missingManifestActions = enabledManifest
    .filter((entry) => !registryKeys.has(entry.action_key))
    .map((entry) => entry.action_key);
  const missingClientHandler = enabledManifest
    .filter((entry) => !clientHandlerKeys.has(entry.client_handler_key))
    .map((entry) => entry.action_key);
  const staleRegistryEntries = registry
    .filter((entry) => entry.enabled && !manifestKeys.has(entry.action_key))
    .map((entry) => entry.action_key);
  const missingFromRegistry = [...missingVisiblePanels, ...missingManifestActions];
  const verdict =
    missingFromRegistry.length > 0 || missingClientHandler.length > 0
      ? "violation"
      : staleRegistryEntries.length > 0
        ? "warning"
        : "clean";

  return {
    manifest_version: WORKSPACE_ACTION_MANIFEST_VERSION,
    visible_panels: visiblePanels,
    registry_targets: registryTargets,
    client_handlers: clientHandlers,
    missing_from_registry: missingFromRegistry,
    missing_client_handler: missingClientHandler,
    stale_registry_entries: staleRegistryEntries,
    verdict,
  };
}

function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function argSchema(arg: string): Record<string, unknown> {
  if (arg.endsWith("_ids") || arg === "source_ids") return { type: "array", items: { type: "string" } };
  if (arg === "chunk_ranges") {
    return {
      type: "array",
      items: {
        type: "object",
        properties: {
          source_id: { type: "string" },
          from_chunk: { type: "number" },
          to_chunk: { type: "number" },
        },
        required: ["source_id", "from_chunk", "to_chunk"],
      },
    };
  }
  if (arg === "confirmed" || arg === "derived_outputs_auto_attach" || arg === "command_lane_enabled") {
    return { type: "boolean" };
  }
  if (arg === "limit") return { type: "number" };
  if (arg === "kind") return { enum: ["translate", "rolling_summary", "action_items", "prompt_composer"] };
  if (arg === "intent") return { enum: ["translate_conversation", "monitor_conversation", "summarize_conversation"] };
  if (arg === "capture_preference") return { enum: ["existing_source", "browser_tab_audio", "display_audio", "mic", "unknown"] };
  if (arg === "output_mode") return { enum: ["visual_only", "voice_on_confirm", "voice_auto_direct_address"] };
  if (arg === "input_text_policy") return { enum: ["transcript_text", "source_text_preferred", "source_text_only"] };
  if (arg === "output_render_policy") return { enum: ["target_language", "native_language", "dual"] };
  if (arg === "render_policy") return { enum: ["target_language", "native_language", "dual"] };
  if (arg === "voice_output") return { enum: ["off", "on_confirm", "auto_when_direct_addressed"] };
  if (arg === "lane") return { enum: ["audio", "speaker_identity", "transcript", "translation", "context", "command", "voice_output"] };
  if (arg === "attachment_policy") return { enum: ["manual_only"] };
  if (arg === "context_injection") return { enum: ["explicit_attachment_only"] };
  return { type: "string" };
}

export function buildWorkstationToolName(panelId: string, actionId: string): string {
  return `${normalizeIdentifier(panelId)}.${normalizeIdentifier(actionId)}`;
}

export function buildWorkstationToolInputSchema(action: WorkstationDynamicToolActionDefinition): Record<string, unknown> {
  const required = action.required_args ?? [];
  const optional = action.optional_args ?? [];
  const properties: Record<string, unknown> = {};
  for (const arg of [...required, ...optional]) properties[arg] = argSchema(arg);
  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
}

export function resolveWorkstationToolTerminalArtifactKind(panelId: string, actionId: string): string | null {
  if (actionId === "open") return "workspace_action_receipt";
  if (panelId === "docs-viewer" && actionId === "open_directory") return "workspace_action_receipt";
  if (panelId === "situation-room-pipelines" && actionId === "setup_from_prompt") return "situation_room_setup_receipt";
  if (panelId === "situation-room-sources") return "situation_room_context";
  if (panelId === "situation-room-pipelines" && actionId === "create_job") return "situation_room_job";
  if (panelId === "situation-room-pipelines" && actionId === "create_graph") return "situation_room_graph";
  if (panelId === "situation-room-pipelines" && actionId === "add_node") return "situation_room_graph";
  if (panelId === "situation-room-pipelines" && actionId === "connect_nodes") return "situation_room_graph";
  if (panelId === "situation-room-pipelines" && actionId === "create_translation_pair") return "situation_room_graph";
  if (panelId === "situation-room-pipelines" && actionId === "attach_graph_to_helix_ask") return "situation_room_graph_attachment";
  if (panelId === "situation-room-pipelines" && actionId === "attach_job_to_helix_ask") return "situation_room_job_attachment";
  if (panelId === "situation-room-pipelines" && actionId === "save_job_as_note") return "workstation_note";
  if (panelId === "workstation-notes" && ["create_note", "append_to_note", "rename_note", "delete_note"].includes(actionId)) {
    return "note_update_receipt";
  }
  if (panelId === "docs-viewer" && actionId !== "open") return "doc_context";
  if (panelId === "workstation-clipboard-history" && actionId !== "open") return "clipboard_context";
  return null;
}

export function buildWorkstationDynamicToolSpec(action: WorkstationDynamicToolActionDefinition): WorkstationDynamicToolSpec {
  const key = `${action.panel_id}.${action.action_id}`;
  const manualOnly = SITUATION_ROOM_MANUAL_ONLY_ACTIONS.has(key);
  return {
    namespace: "workstation",
    name: buildWorkstationToolName(action.panel_id, action.action_id),
    description:
      action.description ??
      `${action.action_id.replace(/_/g, " ")} on ${action.panel_id.replace(/-/g, " ")}.`,
    inputSchema: buildWorkstationToolInputSchema(action),
    deferLoading: action.panel_id.startsWith("situation-room") || action.panel_id === "docs-viewer",
    risk: action.risk ?? "low",
    returns_artifact: action.returns_artifact ?? action.action_id !== "open",
    requires_confirmation: action.requires_confirmation ?? false,
    panel_id: action.panel_id,
    action_id: action.action_id,
    terminal_artifact_kind: resolveWorkstationToolTerminalArtifactKind(action.panel_id, action.action_id),
    ...(manualOnly
      ? {
          attachment_policy: "manual_only" as const,
          context_injection: "explicit_attachment_only" as const,
        }
      : {}),
  };
}

export function buildWorkstationDynamicTools(
  actions: WorkstationDynamicToolActionDefinition[] = WORKSTATION_DYNAMIC_TOOL_ACTIONS,
): WorkstationDynamicToolSpec[] {
  return actions.map(buildWorkstationDynamicToolSpec);
}

export function buildWorkstationDynamicToolsFromCapabilities(
  capabilities: PanelCapabilitiesLike,
): WorkstationDynamicToolSpec[] {
  const actions = Object.entries(capabilities).flatMap(([panelId, capability]) =>
    capability.actions.map((action) => ({
      panel_id: panelId,
      action_id: action.id,
      title: action.title,
      description: action.description,
      risk: action.risk,
      aliases: action.aliases,
      required_args: action.required_args ?? [],
      optional_args: action.optional_args ?? [],
      requires_confirmation: action.requires_confirmation,
      returns_artifact: action.returns_artifact,
    })),
  );
  return buildWorkstationDynamicTools(actions);
}

export function findWorkstationDynamicTool(
  toolName: string,
  tools: WorkstationDynamicToolSpec[] = buildWorkstationDynamicTools(),
): WorkstationDynamicToolSpec | null {
  const normalized = normalizeIdentifier(toolName);
  return tools.find((tool) => normalizeIdentifier(tool.name) === normalized) ?? null;
}

export function mapWorkstationDynamicToolCallToAction(
  toolName: string,
  args: Record<string, unknown> | undefined,
  tools: WorkstationDynamicToolSpec[] = buildWorkstationDynamicTools(),
): WorkstationDynamicToolCallMapping {
  const tool = findWorkstationDynamicTool(toolName, tools);
  if (!tool) return { ok: false, reason: "unknown_tool", missing_required_args: [] };
  const required = Array.isArray(tool.inputSchema.required) ? tool.inputSchema.required.filter((arg): arg is string => typeof arg === "string") : [];
  const missing = required.filter((arg) => args?.[arg] === undefined || args?.[arg] === null || args?.[arg] === "");
  if (missing.length > 0) {
    return { ok: false, reason: "missing_required_args", missing_required_args: missing };
  }
  if (tool.action_id === "open") {
    return {
      ok: true,
      action: {
        schema_version: "helix.workstation.action/v1",
        action: "open_panel",
        panel_id: tool.panel_id,
      },
    };
  }
  return {
    ok: true,
    action: {
      schema_version: "helix.workstation.action/v1",
      action: "run_panel_action",
      panel_id: tool.panel_id,
      action_id: tool.action_id,
      args,
    },
  };
}
