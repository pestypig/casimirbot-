import type { Nhm2AxisTemplate, Nhm2ComputableForm } from "../../shared/contracts/nhm2-equation-visualizer.v1.js";

export function getAxisTemplate(form: Nhm2ComputableForm, axisTemplateId: string): Nhm2AxisTemplate {
  const template = form.defaultAxisTemplates.find((entry) => entry.id === axisTemplateId);
  if (!template) throw new Error(`axis_template_not_found:${axisTemplateId}`);
  return template;
}

export function validateAxisTemplateForMode(template: Nhm2AxisTemplate): string[] {
  const issues: string[] = [];
  if (template.graphMode === "one_dimensional_sweep" && (!template.x || !template.y)) {
    issues.push(`1D sweep template ${template.id} requires x and y`);
  }
  if (template.graphMode === "centerline_profile" && !template.x) {
    issues.push(`centerline template ${template.id} requires x`);
  }
  if (template.graphMode === "tensor_matrix" && (!template.tensorRows || !template.tensorCols)) {
    issues.push(`tensor template ${template.id} requires tensorRows/tensorCols`);
  }
  if (template.color?.scale === "diverging_zero_centered" && !template.color.output) {
    issues.push(`diverging template ${template.id} requires color output`);
  }
  return issues;
}
