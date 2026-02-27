export type HelixAskAlignmentGateDecision = "PASS" | "BORDERLINE" | "FAIL";

export type HelixAskAlignmentGateMetrics = {
  alignment_real: number;
  alignment_decoy: number;
  coincidence_margin: number;
  stability_3_rewrites: number;
  contradiction_rate: number;
  lower95_p_align: number;
};

export type HelixAskAlignmentGateInput = {
  alignment_real: number;
  alignment_decoy: number;
  stability_3_rewrites: number;
  contradiction_rate: number;
  sampleCount?: number;
};

export type HelixAskOpenWorldBypassPolicyInput = {
  gateDecision: HelixAskAlignmentGateDecision;
  requiresRepoEvidence: boolean;
  openWorldAllowed: boolean;
};

export type HelixAskOpenWorldBypassPolicyResult = {
  mode: "repo_required" | "open_world_allowed";
  action: "none" | "clarify_fail_closed" | "bypass_with_uncertainty";
  reason: string;
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

const lower95Bound = (p: number, n: number): number => {
  const boundedP = clamp01(p);
  const boundedN = Math.max(1, Math.round(Number.isFinite(n) ? n : 1));
  const z = 1.96;
  const denom = 1 + (z ** 2) / boundedN;
  const center = boundedP + (z ** 2) / (2 * boundedN);
  const spread = z * Math.sqrt((boundedP * (1 - boundedP)) / boundedN + (z ** 2) / (4 * boundedN ** 2));
  return clamp01((center - spread) / denom);
};

export const evaluateHelixAskAlignmentGate = (
  input: HelixAskAlignmentGateInput,
): { decision: HelixAskAlignmentGateDecision; metrics: HelixAskAlignmentGateMetrics; failReason?: string } => {
  const alignment_real = clamp01(input.alignment_real);
  const alignment_decoy = clamp01(input.alignment_decoy);
  const stability_3_rewrites = clamp01(input.stability_3_rewrites);
  const contradiction_rate = clamp01(input.contradiction_rate);
  const coincidence_margin = clamp01(alignment_real - alignment_decoy);
  const lower95_p_align = lower95Bound(alignment_real, input.sampleCount ?? 3);
  const metrics: HelixAskAlignmentGateMetrics = {
    alignment_real,
    alignment_decoy,
    coincidence_margin,
    stability_3_rewrites,
    contradiction_rate,
    lower95_p_align,
  };

  if (
    alignment_real < 0.5 ||
    coincidence_margin < 0.2 ||
    stability_3_rewrites < 0.55 ||
    contradiction_rate > 0.2 ||
    lower95_p_align < 0.45
  ) {
    return { decision: "FAIL", metrics, failReason: "alignment_gate_fail" };
  }

  if (
    alignment_real < 0.66 ||
    coincidence_margin < 0.3 ||
    stability_3_rewrites < 0.7 ||
    contradiction_rate > 0.12 ||
    lower95_p_align < 0.58
  ) {
    return { decision: "BORDERLINE", metrics };
  }

  return { decision: "PASS", metrics };
};

export const resolveOpenWorldBypassPolicy = (
  input: HelixAskOpenWorldBypassPolicyInput,
): HelixAskOpenWorldBypassPolicyResult => {
  const mode: HelixAskOpenWorldBypassPolicyResult["mode"] =
    input.requiresRepoEvidence || !input.openWorldAllowed ? "repo_required" : "open_world_allowed";
  if (input.gateDecision !== "FAIL") {
    return { mode, action: "none", reason: "alignment_gate_not_failed" };
  }
  if (mode === "repo_required") {
    return { mode, action: "clarify_fail_closed", reason: "alignment_fail_repo_required" };
  }
  return { mode, action: "bypass_with_uncertainty", reason: "alignment_fail_open_world_bypass" };
};

