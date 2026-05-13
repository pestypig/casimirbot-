import {
  WORKSPACE_ACTION_CLIENT_HANDLER_KEYS,
  WORKSPACE_ACTION_VISIBLE_PANEL_IDS,
  WORKSTATION_AFFORDANCES,
  WORKSTATION_DYNAMIC_TOOL_ACTIONS,
  type WorkstationDynamicToolActionDefinition,
} from "../../../shared/workstation-dynamic-tools";
import type { HelixWorkstationAffordance } from "../../../shared/helix-workstation-affordance";

export type WorkstationAffordanceAudit = {
  total_panels: number;
  capability_registered: number;
  dynamic_tool_exposed: number;
  actions_with_handlers: number;
  panels_missing_capability: string[];
  capabilities_missing_dynamic_tool: string[];
  actions_missing_handler: string[];
  visible_buttons_missing_affordance: string[];
  v1_violation: boolean;
};

export function auditWorkstationAffordances(args?: {
  panelIds?: readonly string[];
  capabilityPanelIds?: readonly string[];
  dynamicActions?: readonly WorkstationDynamicToolActionDefinition[];
  clientHandlerKeys?: readonly string[];
  visibleButtonKeys?: readonly string[];
}): WorkstationAffordanceAudit {
  const panelIds: string[] = [...(args?.panelIds ?? WORKSPACE_ACTION_VISIBLE_PANEL_IDS)];
  const capabilityPanelIds: string[] = [...(args?.capabilityPanelIds ?? WORKSPACE_ACTION_VISIBLE_PANEL_IDS)];
  const dynamicActions: WorkstationDynamicToolActionDefinition[] = [...(args?.dynamicActions ?? WORKSTATION_DYNAMIC_TOOL_ACTIONS)];
  const clientHandlerKeys = new Set<string>(
    args?.clientHandlerKeys ?? [
      ...WORKSPACE_ACTION_CLIENT_HANDLER_KEYS,
      ...dynamicActions.map((action: WorkstationDynamicToolActionDefinition) => `${action.panel_id}.${action.action_id}`),
    ],
  );
  const dynamicPanelIds = new Set<string>(dynamicActions.map((action: WorkstationDynamicToolActionDefinition) => action.panel_id));
  const capabilityPanelSet = new Set<string>(capabilityPanelIds);
  const dynamicActionKeys = new Set<string>(
    dynamicActions.map((action: WorkstationDynamicToolActionDefinition) => `${action.panel_id}.${action.action_id}`),
  );
  const affordanceKeys = new Set<string>(WORKSTATION_AFFORDANCES.map((affordance: HelixWorkstationAffordance) => affordance.affordance_id));
  const visibleButtonKeys: readonly string[] =
    args?.visibleButtonKeys ?? dynamicActions.map((action: WorkstationDynamicToolActionDefinition) => `${action.panel_id}.${action.action_id}`);

  const panelsMissingCapability = panelIds.filter((panelId: string) => !capabilityPanelSet.has(panelId));
  const capabilitiesMissingDynamicTool = capabilityPanelIds
    .filter((panelId: string) => !dynamicPanelIds.has(panelId))
    .map((panelId: string) => `${panelId}.*`);
  const actionsMissingHandler = [...dynamicActionKeys]
    .filter((actionKey: string) => !clientHandlerKeys.has(actionKey))
    .sort();
  const visibleButtonsMissingAffordance = visibleButtonKeys
    .filter((actionKey: string) => !affordanceKeys.has(actionKey))
    .sort();
  const v1Violation =
    panelsMissingCapability.length > 0 ||
    actionsMissingHandler.length > 0 ||
    visibleButtonsMissingAffordance.length > 0;

  return {
    total_panels: panelIds.length,
    capability_registered: capabilityPanelIds.length,
    dynamic_tool_exposed: dynamicActions.length,
    actions_with_handlers: dynamicActions.length - actionsMissingHandler.length,
    panels_missing_capability: panelsMissingCapability,
    capabilities_missing_dynamic_tool: capabilitiesMissingDynamicTool,
    actions_missing_handler: actionsMissingHandler,
    visible_buttons_missing_affordance: visibleButtonsMissingAffordance,
    v1_violation: v1Violation,
  };
}
