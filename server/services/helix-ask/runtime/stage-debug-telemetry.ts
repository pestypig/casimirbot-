import type { RepoSearchStage0Telemetry } from "../repo-search";
import type { Stage05Telemetry } from "../stage0-content";

const normalizeStage0TelemetryInvariant = (
  telemetry: RepoSearchStage0Telemetry,
): RepoSearchStage0Telemetry => {
  if (telemetry.used) {
    return {
      ...telemetry,
      used: true,
      shadow_only: false,
      fallback_reason: null,
      fail_open_reason: null,
      policy_decision: "stage0_active",
    };
  }
  const fallbackReason = telemetry.fallback_reason ?? telemetry.fail_open_reason ?? null;
  return {
    ...telemetry,
    used: false,
    shadow_only: Boolean(telemetry.shadow_only),
    fallback_reason: fallbackReason,
    fail_open_reason: telemetry.fail_open_reason ?? fallbackReason,
  };
};

export const isStage05SoftCodePathGapTelemetry = (
  stage05: Stage05Telemetry | undefined,
): boolean => {
  if (!stage05?.summary_hard_fail) return false;
  const missing = (stage05.slot_coverage?.missing ?? []).map((slot) => String(slot).trim());
  if (missing.length !== 1 || missing[0] !== "code_path") return false;
  const required = stage05.slot_plan?.required ?? [];
  if (!required.includes("equation")) return false;
  return true;
};

export const isStage05SoftRuntimeFailTelemetry = (
  stage05: Stage05Telemetry | undefined,
): boolean => {
  if (!stage05?.summary_hard_fail) return false;
  const reason = String(stage05.summary_fail_reason ?? stage05.fallback_reason ?? "");
  return /^stage05_llm_/i.test(reason);
};

export const isStage05CoverageGapTelemetry = (
  stage05: Stage05Telemetry | undefined,
): boolean => {
  if (!stage05?.summary_required) return false;
  const missing = (stage05.slot_coverage?.missing ?? [])
    .map((slot) => String(slot).trim())
    .filter(Boolean);
  return missing.length > 0;
};

const normalizeKindCounts = (value: unknown): Record<string, number> => {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  return {
    code: Math.max(
      0,
      Math.trunc(typeof source?.code === "number" && Number.isFinite(source.code) ? source.code : 0),
    ),
    doc: Math.max(
      0,
      Math.trunc(typeof source?.doc === "number" && Number.isFinite(source.doc) ? source.doc : 0),
    ),
    config: Math.max(
      0,
      Math.trunc(
        typeof source?.config === "number" && Number.isFinite(source.config) ? source.config : 0,
      ),
    ),
    data: Math.max(
      0,
      Math.trunc(typeof source?.data === "number" && Number.isFinite(source.data) ? source.data : 0),
    ),
    binary: Math.max(
      0,
      Math.trunc(
        typeof source?.binary === "number" && Number.isFinite(source.binary) ? source.binary : 0,
      ),
    ),
  };
};

export function applyStage0DebugFields(
  debugPayload: Record<string, unknown> | null | undefined,
  stage0: RepoSearchStage0Telemetry | undefined,
  prefix?: string,
): void {
  if (!debugPayload || !stage0) return;
  const telemetry = normalizeStage0TelemetryInvariant(stage0);
  const readNumber = (value: unknown): number | null =>
    typeof value === "number" && Number.isFinite(value) ? value : null;
  const writeScoped = (suffix: string, value: unknown): void => {
    if (!prefix) return;
    debugPayload[`${prefix}_stage0_${suffix}`] = value;
  };

  const prevUsed = Boolean(debugPayload.stage0_used);
  const nextUsed = prevUsed || telemetry.used;
  debugPayload.stage0_used = nextUsed;
  const prevShadow =
    typeof debugPayload.stage0_shadow_only === "boolean"
      ? Boolean(debugPayload.stage0_shadow_only)
      : telemetry.shadow_only;
  debugPayload.stage0_shadow_only = Boolean(debugPayload.stage0_used)
    ? false
    : prevShadow && telemetry.shadow_only;
  const prevCount = readNumber(debugPayload.stage0_candidate_count) ?? 0;
  debugPayload.stage0_candidate_count = Math.max(prevCount, telemetry.candidate_count);
  const prevHitRate = readNumber(debugPayload.stage0_hit_rate) ?? 0;
  debugPayload.stage0_hit_rate = Number(Math.max(prevHitRate, telemetry.hit_rate).toFixed(4));
  if (!nextUsed && telemetry.fallback_reason) {
    debugPayload.stage0_fallback_reason = telemetry.fallback_reason;
  } else if (nextUsed) {
    debugPayload.stage0_fallback_reason = null;
  } else if (debugPayload.stage0_fallback_reason === undefined) {
    debugPayload.stage0_fallback_reason = null;
  }
  const prevBuildAge = readNumber(debugPayload.stage0_build_age_ms);
  if (typeof telemetry.build_age_ms === "number" && Number.isFinite(telemetry.build_age_ms)) {
    debugPayload.stage0_build_age_ms =
      prevBuildAge == null ? telemetry.build_age_ms : Math.min(prevBuildAge, telemetry.build_age_ms);
  } else if (debugPayload.stage0_build_age_ms === undefined) {
    debugPayload.stage0_build_age_ms = null;
  }
  if (telemetry.commit) {
    debugPayload.stage0_commit = telemetry.commit;
  } else if (debugPayload.stage0_commit === undefined) {
    debugPayload.stage0_commit = null;
  }
  if (telemetry.rollout_mode) {
    debugPayload.stage0_rollout_mode = telemetry.rollout_mode;
  } else if (debugPayload.stage0_rollout_mode === undefined) {
    debugPayload.stage0_rollout_mode = null;
  }
  const prevCanaryHit = Boolean(debugPayload.stage0_canary_hit);
  debugPayload.stage0_canary_hit = prevCanaryHit || Boolean(telemetry.canary_hit);
  const prevSoftMustInclude = Boolean(debugPayload.stage0_soft_must_include_applied);
  debugPayload.stage0_soft_must_include_applied =
    prevSoftMustInclude || Boolean(telemetry.soft_must_include_applied);
  if (telemetry.policy_decision && (telemetry.used || !nextUsed)) {
    debugPayload.stage0_policy_decision = telemetry.policy_decision;
  } else if (nextUsed && debugPayload.stage0_policy_decision === undefined) {
    debugPayload.stage0_policy_decision = "stage0_active";
  } else if (debugPayload.stage0_policy_decision === undefined) {
    debugPayload.stage0_policy_decision = null;
  }
  const failOpenReason =
    telemetry.fail_open_reason ?? (telemetry.used ? null : telemetry.fallback_reason ?? null);
  if (!nextUsed && failOpenReason) {
    debugPayload.stage0_fail_open_reason = failOpenReason;
  } else if (nextUsed) {
    debugPayload.stage0_fail_open_reason = null;
  } else if (debugPayload.stage0_fail_open_reason === undefined) {
    debugPayload.stage0_fail_open_reason = null;
  }

  writeScoped("used", telemetry.used);
  writeScoped("shadow_only", telemetry.shadow_only);
  writeScoped("candidate_count", telemetry.candidate_count);
  writeScoped("hit_rate", telemetry.hit_rate);
  writeScoped("fallback_reason", telemetry.fallback_reason ?? null);
  writeScoped("build_age_ms", telemetry.build_age_ms ?? null);
  writeScoped("commit", telemetry.commit ?? null);
  writeScoped("rollout_mode", telemetry.rollout_mode ?? null);
  writeScoped("canary_hit", Boolean(telemetry.canary_hit));
  writeScoped("soft_must_include_applied", Boolean(telemetry.soft_must_include_applied));
  writeScoped("policy_decision", telemetry.policy_decision ?? null);
  writeScoped("fail_open_reason", failOpenReason);
}

export function mergeRepoSearchStage0Telemetry(
  current: RepoSearchStage0Telemetry | undefined,
  next: RepoSearchStage0Telemetry | undefined,
): RepoSearchStage0Telemetry | undefined {
  if (!next) return current;
  if (!current) return { ...next };
  const readFinite = (value: unknown): number | null =>
    typeof value === "number" && Number.isFinite(value) ? value : null;
  const currentBuildAge = readFinite(current.build_age_ms);
  const nextBuildAge = readFinite(next.build_age_ms);
  const used = current.used || next.used;
  const shadowOnly = used ? false : current.shadow_only && next.shadow_only;
  const fallbackReason = used ? null : next.fallback_reason ?? current.fallback_reason ?? null;
  const activePolicyDecision =
    (next.used ? next.policy_decision : null) ??
    (current.used ? current.policy_decision : null) ??
    null;
  const failOpenReason = used
    ? null
    : next.fail_open_reason ??
      current.fail_open_reason ??
      (next.fallback_reason ?? current.fallback_reason ?? null);
  return normalizeStage0TelemetryInvariant({
    used,
    shadow_only: shadowOnly,
    candidate_count: Math.max(current.candidate_count, next.candidate_count),
    hit_rate: Number(Math.max(current.hit_rate, next.hit_rate).toFixed(4)),
    fallback_reason: fallbackReason,
    build_age_ms:
      currentBuildAge == null
        ? nextBuildAge
        : nextBuildAge == null
          ? currentBuildAge
          : Math.min(currentBuildAge, nextBuildAge),
    commit: next.commit ?? current.commit ?? null,
    rollout_mode: next.rollout_mode ?? current.rollout_mode,
    canary_hit: Boolean(current.canary_hit) || Boolean(next.canary_hit),
    soft_must_include_applied:
      Boolean(current.soft_must_include_applied) || Boolean(next.soft_must_include_applied),
    policy_decision:
      used ? activePolicyDecision ?? "stage0_active" : next.policy_decision ?? current.policy_decision,
    fail_open_reason: failOpenReason,
  });
}

export function mergeStage05Telemetry(
  current: Stage05Telemetry | undefined,
  next: Stage05Telemetry | undefined,
): Stage05Telemetry | undefined {
  if (!next) return current;
  if (!current) {
    const nextSoftCodePathGap = isStage05SoftCodePathGapTelemetry(next);
    const nextSoftRuntimeFail = isStage05SoftRuntimeFailTelemetry(next);
    const nextCoverageGap = isStage05CoverageGapTelemetry(next);
    const nextHardFailEffective =
      (next.summary_hard_fail || nextCoverageGap) && !nextSoftCodePathGap && !nextSoftRuntimeFail;
    return {
      ...next,
      summary_hard_fail: nextHardFailEffective,
      summary_fail_reason: nextHardFailEffective
        ? next.summary_fail_reason ??
          next.fallback_reason ??
          (nextCoverageGap ? "stage05_slot_coverage_missing" : "stage05_summary_hard_fail")
        : null,
      kind_counts: {
        code: next.kind_counts?.code ?? 0,
        doc: next.kind_counts?.doc ?? 0,
        config: next.kind_counts?.config ?? 0,
        data: next.kind_counts?.data ?? 0,
        binary: next.kind_counts?.binary ?? 0,
      },
    };
  }

  const currentRequired = current.slot_coverage?.required ?? [];
  const nextRequired = next.slot_coverage?.required ?? [];
  const mergedRequired = Array.from(new Set([...currentRequired, ...nextRequired]));
  const currentPresent = current.slot_coverage?.present ?? [];
  const nextPresent = next.slot_coverage?.present ?? [];
  const mergedPresent = Array.from(new Set([...currentPresent, ...nextPresent]));
  const mergedMissing = mergedRequired.filter((slot) => !mergedPresent.includes(slot));
  const nextSoftCodePathGap = isStage05SoftCodePathGapTelemetry(next);
  const nextSoftRuntimeFail = isStage05SoftRuntimeFailTelemetry(next);
  const nextCoverageGap = isStage05CoverageGapTelemetry(next);
  const nextHardFailEffective =
    (next.summary_hard_fail || nextCoverageGap) && !nextSoftCodePathGap && !nextSoftRuntimeFail;
  const nextCoverageMissing = next.slot_coverage?.missing ?? [];
  const nextRecoversSummaryHardFail =
    nextSoftCodePathGap ||
    nextSoftRuntimeFail ||
    (next.used && !next.summary_hard_fail && !nextCoverageGap && nextCoverageMissing.length === 0);
  const mergedSlotCoverage =
    nextRecoversSummaryHardFail && next.slot_coverage
      ? next.slot_coverage
      : mergedRequired.length > 0
        ? {
            required: mergedRequired,
            present: mergedPresent,
            missing: mergedMissing,
            ratio:
              mergedRequired.length > 0
                ? (mergedRequired.length - mergedMissing.length) / mergedRequired.length
                : 1,
          }
        : current.slot_coverage ?? next.slot_coverage ?? null;
  const summaryHardFail = nextHardFailEffective
    ? true
    : nextRecoversSummaryHardFail
      ? false
      : current.summary_hard_fail;
  return {
    used: current.used || next.used,
    file_count: current.file_count + next.file_count,
    card_count: current.card_count + next.card_count,
    kind_counts: {
      code: (current.kind_counts?.code ?? 0) + (next.kind_counts?.code ?? 0),
      doc: (current.kind_counts?.doc ?? 0) + (next.kind_counts?.doc ?? 0),
      config: (current.kind_counts?.config ?? 0) + (next.kind_counts?.config ?? 0),
      data: (current.kind_counts?.data ?? 0) + (next.kind_counts?.data ?? 0),
      binary: (current.kind_counts?.binary ?? 0) + (next.kind_counts?.binary ?? 0),
    },
    llm_used: current.llm_used || next.llm_used,
    fallback_reason: current.used || next.used ? null : next.fallback_reason ?? current.fallback_reason,
    extract_ms: current.extract_ms + next.extract_ms,
    total_ms: current.total_ms + next.total_ms,
    budget_capped: current.budget_capped || next.budget_capped,
    summary_required: current.summary_required || next.summary_required,
    summary_hard_fail: summaryHardFail,
    summary_fail_reason: summaryHardFail
      ? nextHardFailEffective
        ? next.summary_fail_reason ??
          next.fallback_reason ??
          (nextCoverageGap ? "stage05_slot_coverage_missing" : current.summary_fail_reason)
        : current.summary_fail_reason
      : null,
    slot_plan:
      next.slot_plan?.required?.length || next.slot_plan?.slots?.length ? next.slot_plan : current.slot_plan ?? null,
    slot_coverage: mergedSlotCoverage,
    fullfile_mode: current.fullfile_mode || next.fullfile_mode,
    two_pass_used: current.two_pass_used || next.two_pass_used,
    two_pass_batches: current.two_pass_batches + next.two_pass_batches,
    overflow_policy: next.overflow_policy ?? current.overflow_policy ?? "single_pass",
    input_scope: next.input_scope ?? current.input_scope,
    input_path_count: Math.max(current.input_path_count ?? 0, next.input_path_count ?? 0),
    input_wide_added_count: Math.max(
      current.input_wide_added_count ?? 0,
      next.input_wide_added_count ?? 0,
    ),
    input_connectivity_added_count: Math.max(
      current.input_connectivity_added_count ?? 0,
      next.input_connectivity_added_count ?? 0,
    ),
    input_seed_signal_token_count: Math.max(
      current.input_seed_signal_token_count ?? 0,
      next.input_seed_signal_token_count ?? 0,
    ),
    input_connected_hint_path_count: Math.max(
      current.input_connected_hint_path_count ?? 0,
      next.input_connected_hint_path_count ?? 0,
    ),
  };
}

export function applyStage05DebugFields(
  debugPayload: Record<string, unknown> | null | undefined,
  stage05: Stage05Telemetry | undefined,
  prefix?: string,
): void {
  if (!debugPayload || !stage05) return;
  const readNumber = (value: unknown): number | null =>
    typeof value === "number" && Number.isFinite(value) ? value : null;
  const writeScoped = (suffix: string, value: unknown): void => {
    if (!prefix) return;
    debugPayload[`${prefix}_stage05_${suffix}`] = value;
  };

  const prevUsed = Boolean(debugPayload.stage05_used);
  const nextUsed = prevUsed || stage05.used;
  debugPayload.stage05_used = nextUsed;
  const prevFileCount = readNumber(debugPayload.stage05_file_count) ?? 0;
  debugPayload.stage05_file_count = Math.max(prevFileCount, Math.max(0, stage05.file_count));
  if (stage05.input_scope) {
    debugPayload.stage05_input_scope = stage05.input_scope;
  } else if (debugPayload.stage05_input_scope === undefined) {
    debugPayload.stage05_input_scope = null;
  }
  const prevInputPathCount = readNumber(debugPayload.stage05_input_path_count) ?? 0;
  debugPayload.stage05_input_path_count = Math.max(
    prevInputPathCount,
    Math.max(0, stage05.input_path_count ?? 0),
  );
  const prevInputWideAddedCount = readNumber(debugPayload.stage05_input_wide_added_count) ?? 0;
  debugPayload.stage05_input_wide_added_count = Math.max(
    prevInputWideAddedCount,
    Math.max(0, stage05.input_wide_added_count ?? 0),
  );
  const prevInputConnectivityAddedCount =
    readNumber(debugPayload.stage05_input_connectivity_added_count) ?? 0;
  debugPayload.stage05_input_connectivity_added_count = Math.max(
    prevInputConnectivityAddedCount,
    Math.max(0, stage05.input_connectivity_added_count ?? 0),
  );
  const prevInputSeedSignalTokenCount =
    readNumber(debugPayload.stage05_input_seed_signal_token_count) ?? 0;
  debugPayload.stage05_input_seed_signal_token_count = Math.max(
    prevInputSeedSignalTokenCount,
    Math.max(0, stage05.input_seed_signal_token_count ?? 0),
  );
  const prevInputConnectedHintPathCount =
    readNumber(debugPayload.stage05_input_connected_hint_path_count) ?? 0;
  debugPayload.stage05_input_connected_hint_path_count = Math.max(
    prevInputConnectedHintPathCount,
    Math.max(0, stage05.input_connected_hint_path_count ?? 0),
  );
  const prevCardCount = readNumber(debugPayload.stage05_card_count) ?? 0;
  debugPayload.stage05_card_count = Math.max(prevCardCount, Math.max(0, stage05.card_count));
  const prevKindCounts = normalizeKindCounts(debugPayload.stage05_kind_counts);
  debugPayload.stage05_kind_counts = {
    code: Math.max(prevKindCounts.code, stage05.kind_counts.code ?? 0),
    doc: Math.max(prevKindCounts.doc, stage05.kind_counts.doc ?? 0),
    config: Math.max(prevKindCounts.config, stage05.kind_counts.config ?? 0),
    data: Math.max(prevKindCounts.data, stage05.kind_counts.data ?? 0),
    binary: Math.max(prevKindCounts.binary, stage05.kind_counts.binary ?? 0),
  };
  debugPayload.stage05_llm_used = Boolean(debugPayload.stage05_llm_used) || stage05.llm_used;
  if (!nextUsed && stage05.fallback_reason) {
    debugPayload.stage05_fallback_reason = stage05.fallback_reason;
  } else if (nextUsed) {
    debugPayload.stage05_fallback_reason = null;
  } else if (debugPayload.stage05_fallback_reason === undefined) {
    debugPayload.stage05_fallback_reason = null;
  }
  const prevExtractMs = readNumber(debugPayload.stage05_extract_ms) ?? 0;
  debugPayload.stage05_extract_ms = Math.max(prevExtractMs, Math.max(0, stage05.extract_ms));
  const prevTotalMs = readNumber(debugPayload.stage05_total_ms) ?? 0;
  debugPayload.stage05_total_ms = Math.max(prevTotalMs, Math.max(0, stage05.total_ms));
  debugPayload.stage05_budget_capped =
    Boolean(debugPayload.stage05_budget_capped) || stage05.budget_capped;
  debugPayload.stage05_summary_required =
    Boolean(debugPayload.stage05_summary_required) || stage05.summary_required;
  const stage05SoftCodePathGap = isStage05SoftCodePathGapTelemetry(stage05);
  const stage05SoftRuntimeFail = isStage05SoftRuntimeFailTelemetry(stage05);
  const stage05SoftRuntimeFailReason = stage05SoftRuntimeFail
    ? stage05.summary_fail_reason ?? stage05.fallback_reason ?? null
    : null;
  const stage05CoverageGap = isStage05CoverageGapTelemetry(stage05);
  const stage05HardFailEffective =
    (stage05.summary_hard_fail || stage05CoverageGap) &&
    !stage05SoftCodePathGap &&
    !stage05SoftRuntimeFail;
  const stage05Recovered =
    stage05SoftCodePathGap ||
    stage05SoftRuntimeFail ||
    (nextUsed &&
      !stage05.summary_hard_fail &&
      !stage05CoverageGap &&
      (stage05.slot_coverage?.missing?.length ?? 0) === 0);
  if (stage05HardFailEffective) {
    debugPayload.stage05_summary_hard_fail = true;
  } else if (stage05Recovered) {
    debugPayload.stage05_summary_hard_fail = false;
  } else {
    debugPayload.stage05_summary_hard_fail = Boolean(debugPayload.stage05_summary_hard_fail);
  }
  if (stage05HardFailEffective) {
    debugPayload.stage05_summary_fail_reason =
      stage05.summary_fail_reason ??
      stage05.fallback_reason ??
      (stage05CoverageGap ? "stage05_slot_coverage_missing" : "stage05_summary_hard_fail");
  } else if (stage05Recovered) {
    debugPayload.stage05_summary_fail_reason = null;
  } else if (debugPayload.stage05_summary_fail_reason === undefined) {
    debugPayload.stage05_summary_fail_reason = null;
  }
  debugPayload.stage05_soft_code_path_gap_applied =
    Boolean(debugPayload.stage05_soft_code_path_gap_applied) || stage05SoftCodePathGap;
  debugPayload.stage05_soft_runtime_fail_open =
    Boolean(debugPayload.stage05_soft_runtime_fail_open) || stage05SoftRuntimeFail;
  if (stage05SoftRuntimeFailReason) {
    debugPayload.stage05_fallback_reason = stage05SoftRuntimeFailReason;
    debugPayload.stage05_soft_runtime_fail_reason = stage05SoftRuntimeFailReason;
  } else if (debugPayload.stage05_soft_runtime_fail_reason === undefined) {
    debugPayload.stage05_soft_runtime_fail_reason = null;
  }
  if (typeof stage05.llm_error_code === "string" && stage05.llm_error_code.trim().length > 0) {
    debugPayload.stage05_llm_error_code = stage05.llm_error_code.trim();
  } else if (debugPayload.stage05_llm_error_code === undefined) {
    debugPayload.stage05_llm_error_code = null;
  }
  if (typeof stage05.llm_error_class === "string" && stage05.llm_error_class.trim().length > 0) {
    debugPayload.stage05_llm_error_class = stage05.llm_error_class.trim();
  } else if (debugPayload.stage05_llm_error_class === undefined) {
    debugPayload.stage05_llm_error_class = null;
  }
  if (typeof stage05.llm_retry_after_ms === "number" && Number.isFinite(stage05.llm_retry_after_ms)) {
    debugPayload.stage05_llm_retry_after_ms = Math.max(0, Math.floor(stage05.llm_retry_after_ms));
  } else if (debugPayload.stage05_llm_retry_after_ms === undefined) {
    debugPayload.stage05_llm_retry_after_ms = null;
  }
  if (typeof stage05.llm_provider_called === "boolean") {
    debugPayload.stage05_llm_provider_called = stage05.llm_provider_called;
  } else if (debugPayload.stage05_llm_provider_called === undefined) {
    debugPayload.stage05_llm_provider_called = null;
  }
  if (
    typeof stage05.llm_rate_limit_source === "string" &&
    stage05.llm_rate_limit_source.trim().length > 0
  ) {
    debugPayload.stage05_llm_rate_limit_source = stage05.llm_rate_limit_source.trim();
  } else if (debugPayload.stage05_llm_rate_limit_source === undefined) {
    debugPayload.stage05_llm_rate_limit_source = null;
  }
  if (typeof stage05.llm_rate_limit_kind === "string" && stage05.llm_rate_limit_kind.trim().length > 0) {
    debugPayload.stage05_llm_rate_limit_kind = stage05.llm_rate_limit_kind.trim();
  } else if (debugPayload.stage05_llm_rate_limit_kind === undefined) {
    debugPayload.stage05_llm_rate_limit_kind = null;
  }
  if (
    typeof stage05.llm_provider_request_id === "string" &&
    stage05.llm_provider_request_id.trim().length > 0
  ) {
    debugPayload.stage05_llm_provider_request_id = stage05.llm_provider_request_id.trim();
  } else if (debugPayload.stage05_llm_provider_request_id === undefined) {
    debugPayload.stage05_llm_provider_request_id = null;
  }
  if (
    typeof stage05.llm_prompt_tokens_estimate === "number" &&
    Number.isFinite(stage05.llm_prompt_tokens_estimate)
  ) {
    debugPayload.stage05_llm_prompt_tokens_estimate = Math.max(
      0,
      Math.floor(stage05.llm_prompt_tokens_estimate),
    );
  } else if (debugPayload.stage05_llm_prompt_tokens_estimate === undefined) {
    debugPayload.stage05_llm_prompt_tokens_estimate = null;
  }
  if (
    typeof stage05.llm_request_body_bytes === "number" &&
    Number.isFinite(stage05.llm_request_body_bytes)
  ) {
    debugPayload.stage05_llm_request_body_bytes = Math.max(
      0,
      Math.floor(stage05.llm_request_body_bytes),
    );
  } else if (debugPayload.stage05_llm_request_body_bytes === undefined) {
    debugPayload.stage05_llm_request_body_bytes = null;
  }
  debugPayload.stage05_slot_plan = stage05.slot_plan ?? debugPayload.stage05_slot_plan ?? null;
  debugPayload.stage05_slot_coverage = stage05.slot_coverage ?? debugPayload.stage05_slot_coverage ?? null;
  debugPayload.stage05_fullfile_mode =
    Boolean(debugPayload.stage05_fullfile_mode) || stage05.fullfile_mode;
  debugPayload.stage05_two_pass_used =
    Boolean(debugPayload.stage05_two_pass_used) || stage05.two_pass_used;
  const prevTwoPassBatches = readNumber(debugPayload.stage05_two_pass_batches) ?? 0;
  debugPayload.stage05_two_pass_batches = Math.max(
    prevTwoPassBatches,
    Math.max(0, stage05.two_pass_batches),
  );
  debugPayload.stage05_overflow_policy =
    stage05.overflow_policy ?? debugPayload.stage05_overflow_policy ?? null;
  if (typeof stage05.adaptive_expand_attempted === "boolean") {
    debugPayload.stage05_adaptive_expand_attempted =
      Boolean(debugPayload.stage05_adaptive_expand_attempted) || stage05.adaptive_expand_attempted;
  }
  if (typeof stage05.adaptive_expand_applied === "boolean") {
    debugPayload.stage05_adaptive_expand_applied =
      Boolean(debugPayload.stage05_adaptive_expand_applied) || stage05.adaptive_expand_applied;
  }
  if (
    typeof stage05.adaptive_expand_reason === "string" &&
    stage05.adaptive_expand_reason.trim().length > 0
  ) {
    debugPayload.stage05_adaptive_expand_reason = stage05.adaptive_expand_reason.trim();
  } else if (debugPayload.stage05_adaptive_expand_reason === undefined) {
    debugPayload.stage05_adaptive_expand_reason = null;
  }
  if (
    typeof stage05.adaptive_expand_max_files === "number" &&
    Number.isFinite(stage05.adaptive_expand_max_files)
  ) {
    const prevAdaptiveMaxFiles = readNumber(debugPayload.stage05_adaptive_expand_max_files) ?? 0;
    debugPayload.stage05_adaptive_expand_max_files = Math.max(
      prevAdaptiveMaxFiles,
      Math.max(0, Math.floor(stage05.adaptive_expand_max_files)),
    );
  }
  if (
    typeof stage05.adaptive_expand_max_cards === "number" &&
    Number.isFinite(stage05.adaptive_expand_max_cards)
  ) {
    const prevAdaptiveMaxCards = readNumber(debugPayload.stage05_adaptive_expand_max_cards) ?? 0;
    debugPayload.stage05_adaptive_expand_max_cards = Math.max(
      prevAdaptiveMaxCards,
      Math.max(0, Math.floor(stage05.adaptive_expand_max_cards)),
    );
  }

  writeScoped("used", stage05.used);
  writeScoped("file_count", stage05.file_count);
  writeScoped("input_scope", stage05.input_scope ?? null);
  writeScoped("input_path_count", stage05.input_path_count ?? null);
  writeScoped("input_wide_added_count", stage05.input_wide_added_count ?? null);
  writeScoped("input_connectivity_added_count", stage05.input_connectivity_added_count ?? null);
  writeScoped("input_seed_signal_token_count", stage05.input_seed_signal_token_count ?? null);
  writeScoped("input_connected_hint_path_count", stage05.input_connected_hint_path_count ?? null);
  writeScoped("card_count", stage05.card_count);
  writeScoped("kind_counts", stage05.kind_counts);
  writeScoped("llm_used", stage05.llm_used);
  writeScoped("fallback_reason", stage05.fallback_reason ?? null);
  writeScoped("extract_ms", stage05.extract_ms);
  writeScoped("total_ms", stage05.total_ms);
  writeScoped("budget_capped", stage05.budget_capped);
  writeScoped("summary_required", stage05.summary_required);
  writeScoped("summary_hard_fail", stage05HardFailEffective);
  writeScoped(
    "summary_fail_reason",
    stage05HardFailEffective
      ? stage05.summary_fail_reason ??
          stage05.fallback_reason ??
          (stage05CoverageGap ? "stage05_slot_coverage_missing" : "stage05_summary_hard_fail")
      : null,
  );
  writeScoped("soft_code_path_gap_applied", stage05SoftCodePathGap);
  writeScoped("soft_runtime_fail_open", stage05SoftRuntimeFail);
  writeScoped("soft_runtime_fail_reason", stage05SoftRuntimeFailReason);
  writeScoped("llm_error_code", stage05.llm_error_code ?? null);
  writeScoped("llm_error_class", stage05.llm_error_class ?? null);
  writeScoped("llm_retry_after_ms", stage05.llm_retry_after_ms ?? null);
  writeScoped("llm_provider_called", stage05.llm_provider_called ?? null);
  writeScoped("llm_rate_limit_source", stage05.llm_rate_limit_source ?? null);
  writeScoped("llm_rate_limit_kind", stage05.llm_rate_limit_kind ?? null);
  writeScoped("llm_provider_request_id", stage05.llm_provider_request_id ?? null);
  writeScoped("llm_prompt_tokens_estimate", stage05.llm_prompt_tokens_estimate ?? null);
  writeScoped("llm_request_body_bytes", stage05.llm_request_body_bytes ?? null);
  writeScoped("slot_plan", stage05.slot_plan ?? null);
  writeScoped("slot_coverage", stage05.slot_coverage ?? null);
  writeScoped("fullfile_mode", stage05.fullfile_mode);
  writeScoped("two_pass_used", stage05.two_pass_used);
  writeScoped("two_pass_batches", stage05.two_pass_batches);
  writeScoped("overflow_policy", stage05.overflow_policy);
  writeScoped("adaptive_expand_attempted", stage05.adaptive_expand_attempted ?? null);
  writeScoped("adaptive_expand_applied", stage05.adaptive_expand_applied ?? null);
  writeScoped("adaptive_expand_reason", stage05.adaptive_expand_reason ?? null);
  writeScoped("adaptive_expand_max_files", stage05.adaptive_expand_max_files ?? null);
  writeScoped("adaptive_expand_max_cards", stage05.adaptive_expand_max_cards ?? null);
}
