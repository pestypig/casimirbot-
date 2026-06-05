import {
  WORKSPACE_ACTION_REGISTRY,
  WORKSPACE_ACTION_VISIBLE_PANEL_IDS,
  WORKSTATION_DYNAMIC_TOOL_ACTIONS,
  buildWorkstationDynamicToolSpec,
  resolveWorkstationToolTerminalArtifactKind,
  type WorkstationDynamicToolActionDefinition,
} from "@shared/workstation-dynamic-tools";
import {
  HELIX_TOOL_SURFACE_ENTRY_SCHEMA,
  HELIX_TOOL_SURFACE_PACKET_SCHEMA,
  type HelixToolExecutionTarget,
  type HelixToolRuntimeShape,
  type HelixToolSurfaceDebugSnapshot,
  type HelixToolSurfaceEntry,
  type HelixToolSurfaceOmittedReason,
  type HelixToolSurfacePacket,
} from "@shared/helix-tool-surface";
import { detectContextualToolAdmissionSuppression } from "../contextual-tool-admission";
import {
  HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
  isWorkspaceOsStatusPrompt,
} from "../workspace-os-status-intent";

export type BuildHelixToolSurfaceInput = {
  turnId: string;
  prompt: string;
  maxEntries?: number;
  activePanels?: readonly string[];
  focusedPanelId?: string | null;
  explicitAttachmentAvailable?: boolean;
  explicitToolIntent?: boolean;
  allowMutatingWithoutConfirmation?: boolean;
};

const DEFAULT_MAX_SURFACE_ENTRIES = 28;
const WORKSPACE_OS_TOOL_COUNT = 1;

const MUTATING_ACTION_PATTERN =
  /\b(?:create|append|write|delete|clear|stop|pause|resume|activate|detach|attach|bind|set_|set\.|confirm|speak|start|run|archive|refresh)\b/i;

const tokenize = (value: string): string[] =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);

const capabilityKey = (action: Pick<WorkstationDynamicToolActionDefinition, "panel_id" | "action_id">): string =>
  `${action.panel_id}.${action.action_id}`;

const runtimeShapeForAction = (actionId: string): HelixToolRuntimeShape =>
  actionId === "open" ? "open_panel" : "run_panel_action";

const executionTargetForAction = (action: WorkstationDynamicToolActionDefinition): HelixToolExecutionTarget => {
  if (action.panel_id.startsWith("situation-room")) return "hybrid";
  if (action.panel_id === "scientific-calculator" && /(?:live|stream|tick)/i.test(action.action_id)) return "hybrid";
  if (/^(?:identify|verify|get_|query_|read_|search|locate|summarize|explain)/i.test(action.action_id)) return "observation_only";
  return "client_only";
};

const routeTagsForAction = (action: WorkstationDynamicToolActionDefinition): string[] => {
  const tags = new Set<string>();
  tags.add(action.panel_id);
  for (const token of tokenize(`${action.panel_id} ${action.action_id} ${action.title ?? ""} ${action.description ?? ""}`)) {
    tags.add(token);
  }
  if (action.panel_id === "docs-viewer") tags.add("documents");
  if (action.panel_id === "scientific-calculator") tags.add("calculator");
  if (action.panel_id === "workstation-notes") tags.add("notes");
  if (action.panel_id.startsWith("situation-room")) tags.add("situation");
  return [...tags];
};

const isMutatingAction = (action: WorkstationDynamicToolActionDefinition): boolean =>
  Boolean(action.requires_confirmation) ||
  (action.risk ?? "low") !== "low" ||
  MUTATING_ACTION_PATTERN.test(action.action_id);

const sourceRequirementsForAction = (
  action: WorkstationDynamicToolActionDefinition,
): HelixToolSurfaceEntry["source_requirements"] => {
  if (action.panel_id === "docs-viewer" && /(?:active_doc|summarize|explain|locate|verify|identify)/i.test(action.action_id)) {
    return [{ source_kind: "document", required: action.action_id !== "search_docs" }];
  }
  if (action.panel_id.startsWith("situation-room") && /(?:source|visual|observer|live|voice|dottie|minecraft)/i.test(action.action_id)) {
    return [{ source_kind: "situation_source", required: false }];
  }
  if (action.panel_id === "workstation-clipboard-history") {
    return [{ source_kind: "clipboard", required: action.action_id !== "open" }];
  }
  return [];
};

export const buildHelixToolSurfaceEntry = (
  action: WorkstationDynamicToolActionDefinition,
  activePanels: ReadonlySet<string> = new Set(),
): HelixToolSurfaceEntry => {
  const spec = buildWorkstationDynamicToolSpec(action);
  const key = capabilityKey(action);
  const mutating = isMutatingAction(action);
  const manualOnly = spec.attachment_policy === "manual_only";
  const explicitAttachmentOnly = spec.context_injection === "explicit_attachment_only";
  const confirmationRequired = Boolean(action.requires_confirmation || spec.requires_confirmation || (mutating && action.risk === "high"));
  const expectedObservationSchema =
    resolveWorkstationToolTerminalArtifactKind(action.panel_id, action.action_id) ??
    (action.action_id === "open" ? "workspace_action_receipt" : "helix.agent_step_observation_packet.v1");

  return {
    schema: HELIX_TOOL_SURFACE_ENTRY_SCHEMA,
    capability_key: key,
    panel_id: action.panel_id,
    action: action.action_id,
    display_name: action.title ?? action.action_id.replace(/[._-]+/g, " "),
    description: action.description ?? spec.description,
    runtime_shape: runtimeShapeForAction(action.action_id),
    execution_target: executionTargetForAction(action),
    mutating,
    manual_only: manualOnly,
    explicit_attachment_only: explicitAttachmentOnly,
    confirmation_required: confirmationRequired,
    requires_active_panel: false,
    active_panel_boost: activePanels.has(action.panel_id),
    source_requirements: sourceRequirementsForAction(action),
    input_schema: spec.inputSchema,
    expected_observation_schema: expectedObservationSchema,
    terminal_eligible: false,
    safety_tags: [
      ...(mutating ? ["mutating"] : ["read_or_observe"]),
      ...(manualOnly ? ["manual_only"] : []),
      ...(explicitAttachmentOnly ? ["explicit_attachment_only"] : []),
      ...(confirmationRequired ? ["confirmation_required"] : []),
    ],
    route_tags: routeTagsForAction(action),
    assistant_answer: false,
    raw_content_included: false,
  };
};

const buildWorkspaceOsStatusToolSurfaceEntry = (): HelixToolSurfaceEntry => ({
  schema: HELIX_TOOL_SURFACE_ENTRY_SCHEMA,
  capability_key: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
  panel_id: "workspace-os",
  action: "status",
  display_name: "Inspect Workspace OS status",
  description:
    "Read sanitized workspace capability, binding, fallback, and runtime-memory status. It never executes browser, clipboard, shell, filesystem, or workstation actions.",
  runtime_shape: "run_panel_action",
  execution_target: "server_only",
  mutating: false,
  manual_only: false,
  explicit_attachment_only: false,
  confirmation_required: false,
  requires_active_panel: false,
  active_panel_boost: false,
  source_requirements: [],
  input_schema: {
    type: "object",
    required: [],
    additionalProperties: true,
    properties: {
      thread_id: { type: "string" },
      room_id: { type: "string" },
      capability_ids: { type: "array", items: { type: "string" } },
    },
  },
  expected_observation_schema: "helix.workspace_os_status_observation.v1",
  terminal_eligible: false,
  safety_tags: ["read_or_observe", "diagnostic_only", "no_raw_content", "non_terminal"],
  route_tags: [
    "workspace",
    "workspace_os",
    "status",
    "capability",
    "health",
    "browser",
    "clipboard",
    "capture",
    "source",
    "binding",
    "runtime",
    "memory",
    "fallback",
  ],
  assistant_answer: false,
  raw_content_included: false,
});

const scoreEntryForPrompt = (entry: HelixToolSurfaceEntry, prompt: string, focusedPanelId?: string | null): number => {
  const promptTokens = new Set(tokenize(prompt));
  const haystack = new Set([...entry.route_tags, ...tokenize(`${entry.capability_key} ${entry.description}`)]);
  let score = 0;
  for (const token of promptTokens) {
    if (haystack.has(token)) score += 2;
  }
  if (entry.active_panel_boost) score += 0.15;
  if (focusedPanelId && entry.panel_id === focusedPanelId) score += 0.25;
  if (entry.runtime_shape === "open_panel" && /(?:open|show|view|panel|viewer|console|history|calculator)/i.test(prompt)) score += 3;
  if (entry.panel_id === "docs-viewer" && /(?:doc|paper|document|section|summar)/i.test(prompt)) score += 6;
  if (entry.panel_id === "scientific-calculator" && /(?:calculate|compute|solve|calculator|equation|expression)/i.test(prompt)) score += 6;
  if (entry.panel_id === "workstation-notes" && /(?:note|notes|append|save|write down)/i.test(prompt)) score += 6;
  if (entry.panel_id.startsWith("situation-room") && /(?:situation|dottie|minecraft|source|live|watch|voice|callout|observer)/i.test(prompt)) score += 6;
  if (entry.capability_key === HELIX_WORKSPACE_OS_STATUS_CAPABILITY && isWorkspaceOsStatusPrompt(prompt)) score += 12;
  if (entry.mutating) score -= 0.4;
  if (entry.manual_only) score -= 1.5;
  return score;
};

const incrementOmitted = (
  omitted: Map<string, number>,
  panelId: string,
  reason: HelixToolSurfaceOmittedReason,
): void => {
  const key = `${panelId}\u0000${reason}`;
  omitted.set(key, (omitted.get(key) ?? 0) + 1);
};

export const buildHelixToolSurfacePacket = (input: BuildHelixToolSurfaceInput): HelixToolSurfacePacket => {
  const activePanelSet = new Set((input.activePanels ?? []).map((panel) => panel.trim()).filter(Boolean));
  const allEntries = [
    buildWorkspaceOsStatusToolSurfaceEntry(),
    ...WORKSTATION_DYNAMIC_TOOL_ACTIONS.map((action) => buildHelixToolSurfaceEntry(action, activePanelSet)),
  ];
  const omitted = new Map<string, number>();
  const contextualSuppression = detectContextualToolAdmissionSuppression(input.prompt);
  if (contextualSuppression) {
    for (const entry of allEntries) {
      incrementOmitted(omitted, entry.panel_id, "contextual_tool_reference_suppressed");
    }
    return {
      schema: HELIX_TOOL_SURFACE_PACKET_SCHEMA,
      turn_id: input.turnId,
      total_registered_tools: WORKSTATION_DYNAMIC_TOOL_ACTIONS.length + WORKSPACE_OS_TOOL_COUNT,
      visible_panel_count: WORKSPACE_ACTION_VISIBLE_PANEL_IDS.length,
      workspace_action_count: WORKSPACE_ACTION_REGISTRY.filter((entry) => entry.enabled).length,
      entries: [],
      omitted: [...omitted.entries()].map(([key, count]) => {
        const [panel_id, reason] = key.split("\u0000") as [string, HelixToolSurfaceOmittedReason];
        return { panel_id, count, reason };
      }),
      active_panels: WORKSPACE_ACTION_VISIBLE_PANEL_IDS.map((panelId) => ({
        panel_id: panelId,
        active: activePanelSet.has(panelId),
        focused: input.focusedPanelId === panelId,
      })),
      generation_reason: `workstation tool surface suppressed: ${contextualSuppression.suppression_reason}`,
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  const scored = allEntries
    .map((entry) => ({
      entry,
      score: scoreEntryForPrompt(entry, input.prompt, input.focusedPanelId ?? null),
    }))
    .filter(({ entry, score }) => {
      if (entry.manual_only && !input.explicitToolIntent) {
        incrementOmitted(omitted, entry.panel_id, "manual_only");
        if (entry.explicit_attachment_only && !input.explicitAttachmentAvailable) {
          incrementOmitted(omitted, entry.panel_id, "explicit_attachment_missing");
        }
        return false;
      }
      if (entry.explicit_attachment_only && !input.explicitAttachmentAvailable && !input.explicitToolIntent) {
        incrementOmitted(omitted, entry.panel_id, "explicit_attachment_missing");
        return false;
      }
      if (entry.confirmation_required && !input.allowMutatingWithoutConfirmation && !input.explicitToolIntent) {
        incrementOmitted(omitted, entry.panel_id, "unsafe_without_confirmation");
        return false;
      }
      if (score <= 0 && entry.runtime_shape !== "open_panel") {
        incrementOmitted(omitted, entry.panel_id, "irrelevant_to_goal");
        return false;
      }
      return true;
    })
    .sort((left, right) => right.score - left.score || left.entry.capability_key.localeCompare(right.entry.capability_key));

  const maxEntries = Math.max(1, input.maxEntries ?? DEFAULT_MAX_SURFACE_ENTRIES);
  const entries = scored.slice(0, maxEntries).map(({ entry }) => entry);
  for (const extra of scored.slice(maxEntries)) {
    incrementOmitted(omitted, extra.entry.panel_id, "too_many_candidates");
  }

  return {
    schema: HELIX_TOOL_SURFACE_PACKET_SCHEMA,
    turn_id: input.turnId,
    total_registered_tools: WORKSTATION_DYNAMIC_TOOL_ACTIONS.length + WORKSPACE_OS_TOOL_COUNT,
    visible_panel_count: WORKSPACE_ACTION_VISIBLE_PANEL_IDS.length,
    workspace_action_count: WORKSPACE_ACTION_REGISTRY.filter((entry) => entry.enabled).length,
    entries,
    omitted: [...omitted.entries()].map(([key, count]) => {
      const [panel_id, reason] = key.split("\u0000") as [string, HelixToolSurfaceOmittedReason];
      return { panel_id, count, reason };
    }),
    active_panels: WORKSPACE_ACTION_VISIBLE_PANEL_IDS.map((panelId) => ({
      panel_id: panelId,
      active: activePanelSet.has(panelId),
      focused: input.focusedPanelId === panelId,
    })),
    generation_reason: "ranked from workstation dynamic tool registry; active panels boost but do not gate capabilities",
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const buildHelixToolSurfaceDebugSnapshot = (): HelixToolSurfaceDebugSnapshot => {
  const grouped: Record<string, string[]> = {};
  let openPanelMappings = 0;
  let runPanelActionMappings = 0;
  let manualOnlyCount = 0;
  let explicitAttachmentOnlyCount = 0;
  for (const action of WORKSTATION_DYNAMIC_TOOL_ACTIONS) {
    grouped[action.panel_id] = [...(grouped[action.panel_id] ?? []), action.action_id];
    if (runtimeShapeForAction(action.action_id) === "open_panel") openPanelMappings += 1;
    else runPanelActionMappings += 1;
    const spec = buildWorkstationDynamicToolSpec(action);
    if (spec.attachment_policy === "manual_only") manualOnlyCount += 1;
    if (spec.context_injection === "explicit_attachment_only") explicitAttachmentOnlyCount += 1;
  }
  return {
    schema: "helix.tool_surface_debug_snapshot.v1",
    total_dynamic_tools: WORKSTATION_DYNAMIC_TOOL_ACTIONS.length,
    grouped_by_panel: Object.fromEntries(
      Object.entries(grouped).map(([panel, actions]) => [panel, actions.sort()]),
    ),
    visible_panels: [...WORKSPACE_ACTION_VISIBLE_PANEL_IDS],
    workspace_actions: WORKSPACE_ACTION_REGISTRY.filter((entry) => entry.enabled).map((entry) => entry.action_key),
    workspace_os_tools: [HELIX_WORKSPACE_OS_STATUS_CAPABILITY],
    open_panel_mappings: openPanelMappings,
    run_panel_action_mappings: runPanelActionMappings,
    manual_only_count: manualOnlyCount,
    explicit_attachment_only_count: explicitAttachmentOnlyCount,
    assistant_answer: false,
    raw_content_included: false,
  };
};
