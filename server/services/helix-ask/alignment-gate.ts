export type HelixAskAlignmentGateDecision = "PASS" | "BORDERLINE" | "FAIL";

export type HelixAskAlignmentGateMetrics = {
  alignment_real: number;
  alignment_decoy: number;
  coincidence_margin: number;
  stability_3_rewrites: number;
  contradiction_rate: number;
  lower95_p_align: number;
  sample_count: number;
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

export type HelixAskFrontierHardGuardInput = {
  supportRatio: number;
  missingRequiredSlots?: string[];
  openWorldBypassActive: boolean;
};

export type HelixAskFrontierHardGuardResult = {
  triggered: boolean;
  action: "none" | "clarify_fail_closed" | "bypass_with_uncertainty";
  reason:
    | "none"
    | "support_ratio_zero"
    | "required_slots_missing"
    | "support_ratio_zero_and_required_slots_missing";
  supportRatio: number;
  missingRequiredSlots: string[];
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
const clampSigned = (value: number): number =>
  Math.min(1, Math.max(-1, Number.isFinite(value) ? value : 0));

const lower95Bound = (p: number, n: number): number => {
  const boundedP = clamp01(p);
  const boundedN = Math.max(1, Math.round(Number.isFinite(n) ? n : 1));
  const z = 1.96;
  const denom = 1 + (z ** 2) / boundedN;
  const center = boundedP + (z ** 2) / (2 * boundedN);
  const spread = z * Math.sqrt((boundedP * (1 - boundedP)) / boundedN + (z ** 2) / (4 * boundedN ** 2));
  return clamp01((center - spread) / denom);
};

const resolveLower95Floors = (sampleCount: number): { fail: number; borderline: number } => {
  if (sampleCount >= 10) {
    return { fail: 0.45, borderline: 0.58 };
  }
  if (sampleCount >= 8) {
    return { fail: 0.38, borderline: 0.5 };
  }
  if (sampleCount >= 5) {
    return { fail: 0.3, borderline: 0.42 };
  }
  return { fail: 0.2, borderline: 0.35 };
};

export const evaluateHelixAskAlignmentGate = (
  input: HelixAskAlignmentGateInput,
): { decision: HelixAskAlignmentGateDecision; metrics: HelixAskAlignmentGateMetrics; failReason?: string } => {
  const sample_count = Math.max(1, Math.round(Number.isFinite(input.sampleCount ?? NaN) ? input.sampleCount ?? 1 : 1));
  const alignment_real = clamp01(input.alignment_real);
  const alignment_decoy = clamp01(input.alignment_decoy);
  const stability_3_rewrites = clamp01(input.stability_3_rewrites);
  const contradiction_rate = clamp01(input.contradiction_rate);
  const coincidence_margin = clampSigned(alignment_real - alignment_decoy);
  const lower95_p_align = lower95Bound(alignment_real, sample_count);
  const lower95Floors = resolveLower95Floors(sample_count);
  const metrics: HelixAskAlignmentGateMetrics = {
    alignment_real,
    alignment_decoy,
    coincidence_margin,
    stability_3_rewrites,
    contradiction_rate,
    lower95_p_align,
    sample_count,
  };

  if (
    alignment_real < 0.5 ||
    coincidence_margin < 0.2 ||
    stability_3_rewrites < 0.55 ||
    contradiction_rate > 0.2 ||
    lower95_p_align < lower95Floors.fail
  ) {
    return { decision: "FAIL", metrics, failReason: "alignment_gate_fail" };
  }

  if (
    alignment_real < 0.66 ||
    coincidence_margin < 0.3 ||
    stability_3_rewrites < 0.7 ||
    contradiction_rate > 0.12 ||
    lower95_p_align < lower95Floors.borderline
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

export const resolveFrontierHardGuard = (
  input: HelixAskFrontierHardGuardInput,
): HelixAskFrontierHardGuardResult => {
  const supportRatio = clamp01(input.supportRatio);
  const missingRequiredSlots = (input.missingRequiredSlots ?? [])
    .map((slot) => String(slot ?? "").trim())
    .filter(Boolean);
  const supportRatioZero = supportRatio <= 0;
  const missingSlots = missingRequiredSlots.length > 0;
  if (!supportRatioZero && !missingSlots) {
    return {
      triggered: false,
      action: "none",
      reason: "none",
      supportRatio,
      missingRequiredSlots,
    };
  }
  const reason: HelixAskFrontierHardGuardResult["reason"] =
    supportRatioZero && missingSlots
      ? "support_ratio_zero_and_required_slots_missing"
      : supportRatioZero
        ? "support_ratio_zero"
        : "required_slots_missing";
  return {
    triggered: true,
    action: input.openWorldBypassActive ? "bypass_with_uncertainty" : "clarify_fail_closed",
    reason,
    supportRatio,
    missingRequiredSlots,
  };
};

