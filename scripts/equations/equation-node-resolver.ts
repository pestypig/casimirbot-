import type { Nhm2ComputableForm, Nhm2EquationVisualizerPreset } from "../../shared/contracts/nhm2-equation-visualizer.v1.js";
import type { Nhm2EquationNode, Nhm2ObservableEquationMap } from "../../shared/contracts/nhm2-observable-equation-map.v1.js";
import type { ResolvedEquationNode } from "./equation-visualizer-types.js";

export function resolveEquationNode(
  map: Nhm2ObservableEquationMap,
  preset: Nhm2EquationVisualizerPreset,
): ResolvedEquationNode {
  const node = map.nodes.find((entry) => entry.id === preset.equationNodeId);
  if (!node) throw new Error(`equation_node_not_found:${preset.equationNodeId}`);
  const form = findComputableForm(node, preset.computableFormId);
  if (!form) throw new Error(`computable_form_not_found:${preset.computableFormId}`);
  if (!form.allowedGraphModes.includes(preset.graphMode)) {
    throw new Error(`graph_mode_not_allowed:${preset.id}:${preset.graphMode}`);
  }
  if (!form.defaultAxisTemplates.some((template) => template.id === preset.axisTemplateId)) {
    throw new Error(`axis_template_not_found:${preset.id}:${preset.axisTemplateId}`);
  }
  return { map, node, form, preset };
}

export function findComputableForm(node: Nhm2EquationNode, formId: string): Nhm2ComputableForm | undefined {
  return (node.computableForms ?? []).find((form) => form.id === formId);
}
