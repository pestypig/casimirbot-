import type { CanonicalStar } from "../contract";

export type StarSimExternalRuntimeKind = "mock" | "docker" | "wsl" | "disabled";

export interface StructureMesaWorkerResult {
  runtime_kind: Exclude<StarSimExternalRuntimeKind, "disabled">;
  solver_version: string;
  benchmark_case_id: string | null;
  fixture_id: string | null;
  used_seismic_constraints: boolean;
  evidence_fit: number;
  structure_summary: Record<string, unknown>;
  synthetic_observables: Record<string, unknown>;
  inferred_params: Record<string, unknown>;
  residuals_sigma: Record<string, number>;
  domain_validity: Record<string, unknown>;
  model_placeholder: Record<string, unknown> | null;
}

export interface OscillationGyreWorkerResult {
  runtime_kind: Exclude<StarSimExternalRuntimeKind, "disabled">;
  solver_version: string;
  benchmark_case_id: string | null;
  fixture_id: string | null;
  evidence_fit: number;
  mode_summary: Record<string, unknown>;
  inferred_params: Record<string, unknown>;
  residuals_sigma: Record<string, number>;
  domain_validity: Record<string, unknown>;
}

export type StarSimWorkerRequest =
  | {
      id: string;
      kind: "structure_mesa";
      star: CanonicalStar;
      cache_key: string;
    }
  | {
      id: string;
      kind: "oscillation_gyre";
      star: CanonicalStar;
      cache_key: string;
      structure_cache_key: string;
      structure_claim_id: string;
      structure_summary: Record<string, unknown>;
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
