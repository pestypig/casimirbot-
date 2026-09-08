/** Dependency order for session readiness, not an executable repair program. */
export const ENVIRONMENT_SESSION_LAYERS = [
  "profile", "service", "client", "binding", "source", "subject",
  "authority", "controller", "goal", "perception",
] as const;

export type EnvironmentSessionLayer = typeof ENVIRONMENT_SESSION_LAYERS[number];
export type EnvironmentSessionCheckState =
  | "verified" | "missing" | "stale" | "revoked" | "blocked";

/**
 * Normalized output of trusted server-side checks. Never accept this shape as
 * caller-supplied proof. The collector must verify exact identities and assign
 * one context ref to its coherent profile/task/chat/run/environment snapshot.
 */
export type EnvironmentSessionCheck = {
  layer: EnvironmentSessionLayer;
  state: EnvironmentSessionCheckState;
  context_ref: string;
  evidence_ref: string;
  observed_at_ms: number;
  /** Actual check validity/lease deadline, never a consumed claim's deadline. */
  expires_at_ms: number | null;
  reason_codes: string[];
  /** Comes from the governing consent boundary, never inferred from expiry. */
  human_approval_required: boolean;
};

export function projectEnvironmentSessionReadiness(input: {
  context_ref: string;
  checks: readonly EnvironmentSessionCheck[];
  now_ms: number;
  maximum_check_age_ms: number;
}) {
  if (!input.context_ref.trim() || !Number.isFinite(input.now_ms) || input.now_ms < 0 ||
      !Number.isFinite(input.maximum_check_age_ms) || input.maximum_check_age_ms <= 0) {
    throw new Error("Invalid environment session readiness evaluation context");
  }
  const checks = ENVIRONMENT_SESSION_LAYERS.map(layer => {
    const matches = input.checks.filter(check => check.layer === layer);
    const base: EnvironmentSessionCheck = {
      layer, state: "missing", context_ref: input.context_ref, evidence_ref: "",
      observed_at_ms: input.now_ms, expires_at_ms: null,
      reason_codes: [matches.length ? "duplicate_layer_checks" : "check_missing"],
      human_approval_required: false,
    };
    if (matches.length !== 1) return base;
    const check = matches[0];
    const reasons = [...check.reason_codes];
    let state = check.state;
    const invalidate = (reason: string) => {
      reasons.push(reason);
      // Retain explicit revoked/blocked state; expiry cannot erase revocation.
      if (state === "verified") state = "stale";
    };
    if (check.context_ref !== input.context_ref) invalidate("session_context_mismatch");
    if (!check.evidence_ref.trim()) invalidate("check_evidence_missing");
    if (!Number.isFinite(check.observed_at_ms) || check.observed_at_ms < 0 ||
        check.observed_at_ms > input.now_ms) invalidate("check_clock_invalid");
    else if (input.now_ms - check.observed_at_ms > input.maximum_check_age_ms) {
      invalidate("check_stale");
    }
    if (check.expires_at_ms !== null &&
        (!Number.isFinite(check.expires_at_ms) || check.expires_at_ms <= input.now_ms)) {
      invalidate("check_expired");
    }
    if (check.human_approval_required) invalidate("human_approval_required");
    return { ...check, state, reason_codes: [...new Set(reasons)] };
  });
  const blockers = checks.filter(check => check.state !== "verified");
  return {
    schema: "helix.environment_session_readiness.v1" as const,
    context_ref: input.context_ref,
    observed_at_ms: input.now_ms,
    ready: blockers.length === 0,
    // Presentation deadline, not an authority lease. Never show a cached ready
    // state beyond the earliest checked lease or evidence-freshness boundary.
    valid_until_ms: blockers.length ? null : Math.min(...checks.map(check =>
      Math.min(check.observed_at_ms + input.maximum_check_age_ms,
        check.expires_at_ms ?? Number.POSITIVE_INFINITY))),
    checks,
    blockers,
    next_check: blockers[0]?.layer ?? null,
    content_role: "environment_session_readiness_observation" as const,
    execution_authority: false as const,
    answer_authority: false as const,
    assistant_answer: false as const,
    terminal_eligible: false as const,
  };
}
