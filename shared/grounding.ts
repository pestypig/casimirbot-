export type GroundingSourceKind =
  | "memory"
  | "repo_file"
  | "doc"
  | "telemetry"
  | "pipeline"
  | "resonance_patch"
  | "debate"
  | "checklist"
  | "tool";

export interface GroundingSource {
  kind: GroundingSourceKind;
  id?: string;
  path?: string;
  extra?: any;
}

export interface GroundingReport {
  sources: GroundingSource[];
}
