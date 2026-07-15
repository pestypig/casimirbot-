export const THEORY_RUNTIME_SMALL_EXECUTION_IDS = [
  "solar.pipeline",
  "solar.manifest",
  "casimir.verify",
  "physics.validate",
] as const;

export const THEORY_RUNTIME_LONG_EXECUTION_IDS = [
  "nhm2.shift_lapse.alpha_sweep",
] as const;

export const THEORY_RUNTIME_EXECUTION_IDS = [
  ...THEORY_RUNTIME_SMALL_EXECUTION_IDS,
  ...THEORY_RUNTIME_LONG_EXECUTION_IDS,
] as const;

export type TheoryRuntimeExecutableId = (typeof THEORY_RUNTIME_EXECUTION_IDS)[number];
export type TheoryRuntimeExecutionClass = "quick_execution" | "long_execution";
export const THEORY_RUNTIME_WORKSTATION_GRAPH_ID = "nhm2-theory-badge-graph" as const;

export function getTheoryRuntimeExecutionClass(runtimeId: string): TheoryRuntimeExecutionClass | null {
  if ((THEORY_RUNTIME_SMALL_EXECUTION_IDS as readonly string[]).includes(runtimeId)) return "quick_execution";
  if ((THEORY_RUNTIME_LONG_EXECUTION_IDS as readonly string[]).includes(runtimeId)) return "long_execution";
  return null;
}

export function isTheoryRuntimeExecutableId(runtimeId: string): runtimeId is TheoryRuntimeExecutableId {
  return getTheoryRuntimeExecutionClass(runtimeId) !== null;
}
