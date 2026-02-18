import type { TrainingTraceConstraint } from "../../../shared/schema.js";

export type HelixAskVerifyPolicyMode = "strict" | "permissive";

export type HelixAskVerifyPolicyContract = {
  mode: HelixAskVerifyPolicyMode;
  failClosed: boolean;
  allowSyntheticFallback: boolean;
  degradedLabel: "verified" | "non_verified_degraded";
};

export type HelixAskVerifyDegradeReason =
  | "ADAPTER_ERROR"
  | "CERTIFICATE_MISSING"
  | "CERTIFICATE_INTEGRITY"
  | "VERDICT_FAIL";

const VERIFY_DEGRADED_FIRST_FAIL = {
  ADAPTER_ERROR: {
    id: "ADAPTER_VERIFY_ADAPTER_ERROR",
    note: "verify_policy_adapter_error",
  },
  CERTIFICATE_MISSING: {
    id: "ADAPTER_CERTIFICATE_MISSING",
    note: "verify_policy_certificate_missing",
  },
  CERTIFICATE_INTEGRITY: {
    id: "ADAPTER_CERTIFICATE_INTEGRITY",
    note: "verify_policy_certificate_integrity",
  },
  VERDICT_FAIL: {
    id: "ADAPTER_CONSTRAINT_FAIL",
    note: "verify_policy_verdict_fail",
  },
} as const;

export function resolveHelixAskVerifyPolicy(input: {
  requestedMode?: HelixAskVerifyPolicyMode;
  strictProvenance?: boolean;
  repoGrounded?: boolean;
}): HelixAskVerifyPolicyContract {
  const strictMode =
    input.requestedMode === "strict" || input.strictProvenance === true || input.repoGrounded === true;
  if (strictMode) {
    return {
      mode: "strict",
      failClosed: true,
      allowSyntheticFallback: false,
      degradedLabel: "verified",
    };
  }
  return {
    mode: "permissive",
    failClosed: true,
    allowSyntheticFallback: false,
    degradedLabel: "non_verified_degraded",
  };
}

export function resolveHelixAskVerifyDegradeReason(input: {
  adapterErrorMessage?: string | null;
  adapterVerdict?: "PASS" | "FAIL" | null;
  certificate?: Record<string, unknown> | null;
}): HelixAskVerifyDegradeReason | null {
  if (input.adapterErrorMessage) return "ADAPTER_ERROR";
  if (input.adapterVerdict !== "PASS") return "VERDICT_FAIL";
  const certificate = input.certificate ?? null;
  if (!certificate || typeof certificate !== "object") return "CERTIFICATE_MISSING";
  if (certificate.integrityOk !== true) return "CERTIFICATE_INTEGRITY";
  return null;
}

export function buildHelixAskVerifyDegradedFirstFail(
  reason: HelixAskVerifyDegradeReason,
): TrainingTraceConstraint {
  const policy = VERIFY_DEGRADED_FIRST_FAIL[reason];
  return {
    id: policy.id,
    severity: "HARD",
    status: "fail",
    note: policy.note,
    value: null,
    limit: null,
  };
}
