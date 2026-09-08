import { describe, expect, it } from "vitest";
import {
  ENVIRONMENT_SESSION_LAYERS,
  projectEnvironmentSessionReadiness,
  type EnvironmentSessionCheck,
} from "../helix-environment-session-readiness";

const now = 100_000;
const context = "sha256:verified-session-context";
const checks = (): EnvironmentSessionCheck[] => ENVIRONMENT_SESSION_LAYERS.map(layer => ({
  layer, state: "verified", context_ref: context, evidence_ref: `evidence:${layer}`,
  observed_at_ms: now - 10, expires_at_ms: now + 60_000,
  reason_codes: [], human_approval_required: false,
}));
const project = (items = checks()) => projectEnvironmentSessionReadiness({
  context_ref: context, checks: items, now_ms: now, maximum_check_age_ms: 5_000,
});

describe("environment session readiness projection", () => {
  it("bounds cached readiness by both freshness and the earliest lease", () => {
    expect(project().valid_until_ms).toBe(now + 4990);
    const input = checks();
    input[0].expires_at_ms = now + 1000;
    expect(project(input).valid_until_ms).toBe(now + 1000);
    input[0].state = "revoked";
    expect(project(input).valid_until_ms).toBeNull();
  });
  it("does not promote ready controller transport over stale subject and goal", () => {
    const input = checks().map(check => ["subject", "goal"].includes(check.layer)
      ? { ...check, state: "stale" as const } : check);
    const result = project(input);
    expect(result.ready).toBe(false);
    expect(result.next_check).toBe("subject");
    expect(result.blockers.map(check => check.layer)).toEqual(["subject", "goal"]);
    expect(result.blockers.every(check => !check.human_approval_required)).toBe(true);
    expect(result.checks.find(check => check.layer === "binding")?.state).toBe("verified");
  });

  it("preserves input and stable readiness over three repeated reads", () => {
    const input = checks();
    const before = JSON.stringify(input);
    const first = project(input);
    expect(project(input)).toEqual(first);
    expect(project(input)).toEqual(first);
    expect(JSON.stringify(input)).toBe(before);
    expect(first.ready).toBe(true);
    expect(first.execution_authority).toBe(false);
    expect(first.answer_authority).toBe(false);
  });

  it.each(ENVIRONMENT_SESSION_LAYERS)("fails closed when %s is missing", layer => {
    expect(project(checks().filter(check => check.layer !== layer)).ready).toBe(false);
  });

  it.each(["profile", "binding", "subject", "goal"] as const)("rejects wrong context on %s", layer => {
    const result = project(checks().map(check => check.layer === layer
      ? { ...check, context_ref: "another-session" } : check));
    expect(result.ready).toBe(false);
    expect(result.blockers[0].reason_codes).toContain("session_context_mismatch");
  });

  it("does not turn revoked authority into renewable expiry", () => {
    const result = project(checks().map(check => check.layer === "authority"
      ? { ...check, state: "revoked" as const, expires_at_ms: now - 1,
          human_approval_required: true, reason_codes: ["operator_revoked"] } : check));
    expect(result.blockers[0].state).toBe("revoked");
    expect(result.blockers[0].human_approval_required).toBe(true);
  });

  it.each([now, now - 1])("rejects verified lease at expiry %s", expires_at_ms => {
    const result = project(checks().map(check => check.layer === "authority"
      ? { ...check, expires_at_ms } : check));
    expect(result.ready).toBe(false);
    expect(result.blockers[0].reason_codes).toContain("check_expired");
  });

  it.each([NaN, now + 1, now - 5_001])("rejects invalid or stale observation %s", observed_at_ms => {
    const result = project(checks().map(check => check.layer === "perception"
      ? { ...check, observed_at_ms } : check));
    expect(result.ready).toBe(false);
  });

  it("rejects duplicate layer evidence rather than picking a convenient result", () => {
    expect(project([...checks(), checks()[0]]).ready).toBe(false);
  });

  it("requires evidence even for a verified result", () => {
    expect(project(checks().map(check => ({ ...check, evidence_ref: "" }))).ready).toBe(false);
  });

  it.each([NaN, Infinity, -1])("rejects invalid evaluation time %s", now_ms => {
    expect(() => projectEnvironmentSessionReadiness({
      context_ref: context, checks: checks(), now_ms, maximum_check_age_ms: 5_000,
    })).toThrow();
  });
});
