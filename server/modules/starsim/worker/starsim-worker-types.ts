import type {
  CanonicalStar,
  StarSimComparisonSummary,
  StarSimExternalRuntimeKind,
  StarSimFitSummary,
  StarSimSeismicMatchSummary,
  StarSimSupportedDomain,
} from "../contract";

export interface StarSimRuntimeArtifactPayload {
  kind: string;
  file_name: string;
  content_encoding: "utf8" | "base64";
  content: string;
  media_type?: string;
}

export interface StructureMesaWorkerResult {
  runtime_kind: Exclude<StarSimExternalRuntimeKind, "disabled">;
  runtime_fingerprint: string;
  execution_mode: "mock_fixture" | "live_benchmark" | "live_fit";
  live_solver: boolean;
  solver_version: string;
  benchmark_case_id: string | null;
  benchmark_pack_id: string | null;
  fit_profile_id: string | null;
  fixture_id: string | null;
  used_seismic_constraints: boolean;
  fit_status: "fit_completed" | "comparison_completed" | "insufficient_data" | "out_of_domain";
  evidence_fit: number;
  structure_summary: Record<string, unknown>;
  synthetic_observables: Record<string, unknown>;
  fit_summary: StarSimFitSummary | null;
  supported_domain: StarSimSupportedDomain | null;
  inferred_params: Record<string, unknown>;
  residuals_sigma: Record<string, number>;
  domain_validity: Record<string, unknown>;
  model_placeholder: Record<string, unknown> | null;
  artifact_payloads: StarSimRuntimeArtifactPayload[];
  live_solver_metadata: Record<string, unknown>;
}

export interface OscillationGyreWorkerResult {
  runtime_kind: Exclude<StarSimExternalRuntimeKind, "disabled">;
  runtime_fingerprint: string;
  execution_mode: "mock_fixture" | "live_benchmark" | "live_comparison";
  live_solver: boolean;
  solver_version: string;
  benchmark_case_id: string | null;
  benchmark_pack_id: string | null;
  fit_profile_id: string | null;
  fixture_id: string | null;
  fit_status: "fit_completed" | "comparison_completed" | "insufficient_data" | "out_of_domain";
  evidence_fit: number;
  mode_summary: Record<string, unknown>;
  comparison_summary: StarSimComparisonSummary | null;
  seismic_match_summary: StarSimSeismicMatchSummary | null;
  supported_domain: StarSimSupportedDomain | null;
  inferred_params: Record<string, unknown>;
  residuals_sigma: Record<string, number>;
  domain_validity: Record<string, unknown>;
  artifact_payloads: StarSimRuntimeArtifactPayload[];
  live_solver_metadata: Record<string, unknown>;
}

export type StarSimWorkerRequest =
  | {
      id: string;
      kind: "structure_mesa";
      star: CanonicalStar;
      cache_key: string;
      fit_profile_id: string | null;
      fit_constraints: Record<string, string | number | boolean | null>;
      supported_domain: StarSimSupportedDomain;
    }
  | {
      id: string;
      kind: "oscillation_gyre";
      star: CanonicalStar;
      cache_key: string;
      structure_cache_key: string;
      structure_claim_id: string;
      structure_summary: Record<string, unknown>;
      fit_profile_id: string | null;
      fit_constraints: Record<string, string | number | boolean | null>;
      supported_domain: StarSimSupportedDomain;
    };

export type StarSimWorkerResponse =
  | {
      id: string;
      kind: StarSimWorkerRequest["kind"];
      ok: true;
      payload: StructureMesaWorkerResult | OscillationGyreWorkerResult;
    }
  | {
      id: string;
      kind: StarSimWorkerRequest["kind"];
      ok: false;
      error: string;
      stack?: string;
    };
