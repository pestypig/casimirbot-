import {
  FAL_FLUX2_KLEIN_REALTIME_MODEL,
  FAL_FLUX2_KLEIN_REALTIME_PROVIDER_ID,
} from "./fal-flux2-klein-realtime-provider";
export {
  FAL_FLUX2_KLEIN_REALTIME_MODEL,
  FAL_FLUX2_KLEIN_REALTIME_PROVIDER_ID,
} from "./fal-flux2-klein-realtime-provider";

export const RTP_FAL_APPROVAL_VERSION = "rtp-fal-attended-v1" as const;
export const RTP_FAL_DURATION_CAP_SECONDS = 60 as const;
export const RTP_FAL_REQUEST_CAP = 60 as const;
export const RTP_FAL_SPEND_CAP_USD = 1 as const;
export const RTP_FAL_PUBLISHED_COMPUTE_RATE_USD = 0.00194 as const;

export type AttendedFalReadiness = {
  schema: "casimir.realtime_texture_pack.fal_readiness.v1";
  provider_id: typeof FAL_FLUX2_KLEIN_REALTIME_PROVIDER_ID;
  provider_model: typeof FAL_FLUX2_KLEIN_REALTIME_MODEL;
  runtime_enabled: boolean;
  credential_configured: boolean;
  sdk_available: boolean;
  ready_for_attended_arm: boolean;
  missing_requirements: string[];
  approval_version: typeof RTP_FAL_APPROVAL_VERSION;
  duration_cap_seconds: 60;
  request_cap: 60;
  spend_cap_usd: 1;
  published_compute_rate_usd: 0.00194;
  credential_included: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type AttendedFalSessionProjection = {
  schema: "casimir.realtime_texture_pack.fal_attended_session.v1";
  provider_id: typeof FAL_FLUX2_KLEIN_REALTIME_PROVIDER_ID;
  provider_model: typeof FAL_FLUX2_KLEIN_REALTIME_MODEL;
  session_id: string;
  status: "armed" | "active" | "completed" | "cancelled" | "expired";
  armed_at: string;
  expires_at: string;
  requests_started: number;
  requests_completed: number;
  requests_accepted: number;
  requests_failed: number;
  request_cap: 60;
  duration_cap_seconds: 60;
  spend_cap_usd: 1;
  estimated_compute_seconds: number;
  estimated_cost_usd: number;
  in_flight: boolean;
  cancellation_acknowledged: boolean;
  cancellation_reason: string | null;
  credential_included: false;
  pixels_included: false;
  prompt_included: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

type SessionRecord = {
  profileId: string;
  sessionId: string;
  status: AttendedFalSessionProjection["status"];
  armedAtMs: number;
  expiresAtMs: number;
  requestsStarted: number;
  requestsCompleted: number;
  requestsAccepted: number;
  requestsFailed: number;
  estimatedComputeMs: number;
  inFlight: { requestId: string; maxRuntimeMs: number } | null;
  cancellationAcknowledged: boolean;
  cancellationReason: string | null;
};

export class AttendedFalSessionError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "AttendedFalSessionError";
  }
}

const boundedIdentity = (value: string, field: string): string => {
  const normalized = value.trim();
  if (!normalized || normalized.length > 200) throw new AttendedFalSessionError(`${field}_invalid`);
  return normalized;
};

const roundCost = (computeMs: number): number =>
  Number(((computeMs / 1_000) * RTP_FAL_PUBLISHED_COMPUTE_RATE_USD).toFixed(6));

export const readAttendedFalReadiness = (input: {
  runtimeEnabled?: boolean;
  credentialConfigured?: boolean;
  sdkAvailable?: boolean;
}): AttendedFalReadiness => {
  const runtimeEnabled = input.runtimeEnabled === true;
  const credentialConfigured = input.credentialConfigured === true;
  const sdkAvailable = input.sdkAvailable === true;
  const missingRequirements = [
    ...(!runtimeEnabled ? ["provider_runtime_not_enabled"] : []),
    ...(!credentialConfigured ? ["provider_credential_not_configured"] : []),
    ...(!sdkAvailable ? ["provider_sdk_not_available"] : []),
  ];
  return {
    schema: "casimir.realtime_texture_pack.fal_readiness.v1",
    provider_id: FAL_FLUX2_KLEIN_REALTIME_PROVIDER_ID,
    provider_model: FAL_FLUX2_KLEIN_REALTIME_MODEL,
    runtime_enabled: runtimeEnabled,
    credential_configured: credentialConfigured,
    sdk_available: sdkAvailable,
    ready_for_attended_arm: missingRequirements.length === 0,
    missing_requirements: missingRequirements,
    approval_version: RTP_FAL_APPROVAL_VERSION,
    duration_cap_seconds: RTP_FAL_DURATION_CAP_SECONDS,
    request_cap: RTP_FAL_REQUEST_CAP,
    spend_cap_usd: RTP_FAL_SPEND_CAP_USD,
    published_compute_rate_usd: RTP_FAL_PUBLISHED_COMPUTE_RATE_USD,
    credential_included: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

export const readAttendedFalReadinessFromRuntime = (input: {
  env?: NodeJS.ProcessEnv;
  sdkAvailable: boolean;
}): AttendedFalReadiness => {
  const env = input.env ?? process.env;
  return readAttendedFalReadiness({
    runtimeEnabled: env.RTP_FAL_PROVIDER_ENABLED === "1",
    credentialConfigured: typeof env.FAL_KEY === "string" && env.FAL_KEY.trim().length > 0,
    sdkAvailable: input.sdkAvailable,
  });
};

const project = (record: SessionRecord): AttendedFalSessionProjection => ({
  schema: "casimir.realtime_texture_pack.fal_attended_session.v1",
  provider_id: FAL_FLUX2_KLEIN_REALTIME_PROVIDER_ID,
  provider_model: FAL_FLUX2_KLEIN_REALTIME_MODEL,
  session_id: record.sessionId,
  status: record.status,
  armed_at: new Date(record.armedAtMs).toISOString(),
  expires_at: new Date(record.expiresAtMs).toISOString(),
  requests_started: record.requestsStarted,
  requests_completed: record.requestsCompleted,
  requests_accepted: record.requestsAccepted,
  requests_failed: record.requestsFailed,
  request_cap: RTP_FAL_REQUEST_CAP,
  duration_cap_seconds: RTP_FAL_DURATION_CAP_SECONDS,
  spend_cap_usd: RTP_FAL_SPEND_CAP_USD,
  estimated_compute_seconds: Number((record.estimatedComputeMs / 1_000).toFixed(3)),
  estimated_cost_usd: roundCost(record.estimatedComputeMs),
  in_flight: Boolean(record.inFlight),
  cancellation_acknowledged: record.cancellationAcknowledged,
  cancellation_reason: record.cancellationReason,
  credential_included: false,
  pixels_included: false,
  prompt_included: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

export class AttendedFalSessionStore {
  private readonly sessions = new Map<string, SessionRecord>();

  constructor(private readonly now: () => number = () => Date.now()) {}

  arm(input: {
    profileId: string;
    sessionId: string;
    readiness: AttendedFalReadiness;
    approvalVersion: string;
    providerId: string;
    durationCapSeconds: number;
    requestCap: number;
    spendCapUsd: number;
    externalFrameEgressAcknowledged: boolean;
    billableCallsAcknowledged: boolean;
  }): AttendedFalSessionProjection {
    const profileId = boundedIdentity(input.profileId, "profile_id");
    const sessionId = boundedIdentity(input.sessionId, "session_id");
    if (!input.readiness.ready_for_attended_arm) throw new AttendedFalSessionError("provider_not_ready");
    if (input.approvalVersion !== RTP_FAL_APPROVAL_VERSION) throw new AttendedFalSessionError("approval_version_invalid");
    if (input.providerId !== FAL_FLUX2_KLEIN_REALTIME_PROVIDER_ID) throw new AttendedFalSessionError("provider_id_invalid");
    if (
      input.durationCapSeconds !== RTP_FAL_DURATION_CAP_SECONDS ||
      input.requestCap !== RTP_FAL_REQUEST_CAP ||
      input.spendCapUsd !== RTP_FAL_SPEND_CAP_USD
    ) throw new AttendedFalSessionError("attended_ceiling_invalid");
    if (!input.externalFrameEgressAcknowledged || !input.billableCallsAcknowledged) {
      throw new AttendedFalSessionError("attended_user_acknowledgement_required");
    }
    const existing = this.sessions.get(profileId);
    if (existing && (existing.status === "armed" || existing.status === "active") && existing.expiresAtMs > this.now()) {
      throw new AttendedFalSessionError("active_attended_session_exists");
    }
    const armedAtMs = this.now();
    const record: SessionRecord = {
      profileId,
      sessionId,
      status: "armed",
      armedAtMs,
      expiresAtMs: armedAtMs + RTP_FAL_DURATION_CAP_SECONDS * 1_000,
      requestsStarted: 0,
      requestsCompleted: 0,
      requestsAccepted: 0,
      requestsFailed: 0,
      estimatedComputeMs: 0,
      inFlight: null,
      cancellationAcknowledged: false,
      cancellationReason: null,
    };
    this.sessions.set(profileId, record);
    return project(record);
  }

  inspect(profileId: string): AttendedFalSessionProjection | null {
    const record = this.sessions.get(profileId.trim()) ?? null;
    if (!record) return null;
    this.expireIfRequired(record);
    return project(record);
  }

  beginRequest(input: { profileId: string; sessionId: string; requestId: string }) {
    const record = this.requireSession(input.profileId, input.sessionId);
    this.expireIfRequired(record);
    if (record.status !== "armed" && record.status !== "active") {
      throw new AttendedFalSessionError(`attended_session_${record.status}`);
    }
    if (record.inFlight) throw new AttendedFalSessionError("attended_request_in_flight");
    if (record.requestsStarted >= RTP_FAL_REQUEST_CAP) {
      record.status = "completed";
      throw new AttendedFalSessionError("attended_request_cap_reached");
    }
    const remainingDurationMs = record.expiresAtMs - this.now();
    const remainingCostUsd = RTP_FAL_SPEND_CAP_USD - roundCost(record.estimatedComputeMs);
    const remainingCostMs = Math.floor(
      Math.max(0, remainingCostUsd) / RTP_FAL_PUBLISHED_COMPUTE_RATE_USD * 1_000,
    );
    const maxRuntimeMs = Math.max(0, Math.min(remainingDurationMs, remainingCostMs));
    if (maxRuntimeMs <= 0) {
      record.status = "completed";
      throw new AttendedFalSessionError("attended_budget_exhausted");
    }
    const requestId = boundedIdentity(input.requestId, "request_id");
    record.inFlight = { requestId, maxRuntimeMs };
    record.requestsStarted += 1;
    record.status = "active";
    return {
      request_id: requestId,
      max_runtime_ms: maxRuntimeMs,
      request_number: record.requestsStarted,
      request_cap: RTP_FAL_REQUEST_CAP,
      retry_allowed: false as const,
      credential_included: false as const,
      assistant_answer: false as const,
      terminal_eligible: false as const,
    };
  }

  settleRequest(input: {
    profileId: string;
    sessionId: string;
    requestId: string;
    providerComputeMs: number;
    accepted: boolean;
  }): AttendedFalSessionProjection {
    const record = this.requireSession(input.profileId, input.sessionId);
    if (!record.inFlight || record.inFlight.requestId !== input.requestId) {
      throw new AttendedFalSessionError("attended_request_identity_mismatch");
    }
    if (
      !Number.isFinite(input.providerComputeMs) ||
      input.providerComputeMs < 0 ||
      input.providerComputeMs > record.inFlight.maxRuntimeMs
    ) {
      record.status = "cancelled";
      record.cancellationAcknowledged = true;
      record.cancellationReason = "provider_runtime_ceiling_exceeded";
      record.inFlight = null;
      throw new AttendedFalSessionError("provider_runtime_ceiling_exceeded");
    }
    record.estimatedComputeMs += Math.round(input.providerComputeMs);
    record.requestsCompleted += 1;
    if (input.accepted) record.requestsAccepted += 1;
    else record.requestsFailed += 1;
    record.inFlight = null;
    if (
      record.requestsStarted >= RTP_FAL_REQUEST_CAP ||
      roundCost(record.estimatedComputeMs) >= RTP_FAL_SPEND_CAP_USD
    ) record.status = "completed";
    else record.status = "armed";
    this.expireIfRequired(record);
    return project(record);
  }

  cancel(input: { profileId: string; sessionId: string; reason?: string | null }): AttendedFalSessionProjection {
    const record = this.requireSession(input.profileId, input.sessionId);
    record.status = "cancelled";
    record.inFlight = null;
    record.cancellationAcknowledged = true;
    record.cancellationReason = input.reason?.trim().slice(0, 160) || "user_cancelled";
    return project(record);
  }

  resetForTests(): void { this.sessions.clear(); }

  private requireSession(profileId: string, sessionId: string): SessionRecord {
    const record = this.sessions.get(profileId.trim());
    if (!record || record.sessionId !== sessionId.trim()) {
      throw new AttendedFalSessionError("attended_session_not_found");
    }
    return record;
  }

  private expireIfRequired(record: SessionRecord): void {
    if ((record.status === "armed" || record.status === "active") && this.now() >= record.expiresAtMs) {
      record.status = "expired";
      record.inFlight = null;
      record.cancellationAcknowledged = true;
      record.cancellationReason = "duration_cap_reached";
    }
  }
}

export const attendedFalSessionStore = new AttendedFalSessionStore();
