import { z } from "zod";

export const MOTORCYCLE_AWARENESS_SCHEMA = "helix.motorcycle_awareness.v1" as const;
export const MOTORCYCLE_REPLAY_SCHEMA = "helix.motorcycle_replay.v1" as const;

const finiteNumber = z.number().finite();

export const MotorcycleEnvelopeSchema = z.object({
  schema: z.literal(MOTORCYCLE_AWARENESS_SCHEMA),
  environmentId: z.string().min(1),
  sourceId: z.string().min(1),
  producerEpoch: z.string().min(1),
  sequence: z.number().int().nonnegative(),
  sourceTimestampMs: z.number().int().nonnegative(),
  arrivalTimestampMs: z.number().int().nonnegative(),
  freshnessDeadlineMs: z.number().int().nonnegative(),
  configurationHash: z.string().min(1),
});

export const TrafficTrackSchema = MotorcycleEnvelopeSchema.extend({
  kind: z.literal("traffic_track"),
  trackId: z.string().min(1),
  bearingBikeDeg: finiteNumber.min(-180).max(180),
  rangeM: finiteNumber.nonnegative(),
  closingSpeedMps: finiteNumber,
  lateralSpeedMps: finiteNumber.default(0),
  closestApproachM: finiteNumber.nonnegative().default(0),
  confidence: finiteNumber.min(0).max(1),
  classification: z.enum(["vehicle", "motorcycle", "unknown"]),
});

export const HelmetPoseSchema = MotorcycleEnvelopeSchema.extend({
  kind: z.literal("helmet_pose"),
  yawBikeDeg: finiteNumber.min(-180).max(180),
  quaternion: z.tuple([finiteNumber, finiteNumber, finiteNumber, finiteNumber]),
  calibrationId: z.string().min(1),
  calibrated: z.boolean(),
});

export const MotorcycleControlsSchema = z.object({
  manualBlank: z.boolean().default(false),
  emergencyStop: z.boolean().default(false),
  navigationSector: z.number().int().min(0).max(7).nullable().default(null),
});

export const MotorcycleReplayFrameSchema = z.object({
  atMs: z.number().int().nonnegative(),
  tracks: z.array(TrafficTrackSchema),
  pose: HelmetPoseSchema.nullable(),
  controls: MotorcycleControlsSchema.default({}),
});

export const MotorcycleReplayFixtureSchema = z.object({
  schema: z.literal(MOTORCYCLE_REPLAY_SCHEMA),
  id: z.string().min(1),
  title: z.string().min(1),
  family: z.string().min(1),
  description: z.string().min(1),
  frames: z.array(MotorcycleReplayFrameSchema).min(1),
  expected: z.object({
    finalBlankReason: z.enum(["none", "manual_blank", "emergency_stop", "watchdog", "invalid_pose"]),
    finalActiveSectors: z.array(z.number().int().min(0).max(7)),
    minimumRejectedObservations: z.number().int().nonnegative().default(0),
  }),
});

export type MotorcycleEnvelope = z.infer<typeof MotorcycleEnvelopeSchema>;
export type TrafficTrack = z.infer<typeof TrafficTrackSchema>;
export type HelmetPose = z.infer<typeof HelmetPoseSchema>;
export type MotorcycleControls = z.infer<typeof MotorcycleControlsSchema>;
export type MotorcycleReplayFrame = z.infer<typeof MotorcycleReplayFrameSchema>;
export type MotorcycleReplayFixture = z.infer<typeof MotorcycleReplayFixtureSchema>;

export type HudSeverity = "dim" | "moderate" | "urgent" | "urgent_pulse";
export type HudCueKind = "approach" | "navigation";
export type HudBlankReason = "none" | "manual_blank" | "emergency_stop" | "watchdog" | "invalid_pose";

export type ThreatState = {
  trackId: string;
  bikeBearingDeg: number;
  headBearingDeg: number;
  sector: number;
  closingSpeedMps: number;
  rangeM: number;
  timeToCollisionS: number | null;
  confidence: number;
  severity: HudSeverity | "suppressed";
  reasonCode:
    | "threat_admitted"
    | "receding"
    | "low_confidence"
    | "non_intersecting_path"
    | "outside_warning_horizon";
};

export type HudCue = {
  cueId: string;
  kind: HudCueKind;
  sector: number;
  severity: HudSeverity;
  intensity: number;
  pattern: "steady" | "pulse";
  sourceTrackIds: string[];
  admittedAtMs: number;
  expiresAtMs: number;
};

export type MotorcycleDecisionReceipt = {
  schema: typeof MOTORCYCLE_AWARENESS_SCHEMA;
  receiptId: string;
  atMs: number;
  configurationHash: string;
  poseRef: string | null;
  admittedTrackRefs: string[];
  rejectedTrackRefs: Array<{ ref: string; reason: "duplicate_or_reordered" | "stale" | "configuration_mismatch" }>;
  threatSummary: Array<{ trackId: string; sector: number; severity: ThreatState["severity"]; reasonCode: ThreatState["reasonCode"] }>;
  cueIds: string[];
  blankReason: HudBlankReason;
  causalHash: string;
  hashAlgorithm: "fnv1a32_fixture_identity";
};

export type MotorcycleAwarenessState = {
  atMs: number;
  lastSequenceBySource: Record<string, number>;
  lastFreshObservationAtMs: number | null;
  activeCues: HudCue[];
  threats: ThreatState[];
  blankReason: HudBlankReason;
  rejectedObservationCount: number;
  receipts: MotorcycleDecisionReceipt[];
};

export const MotorcycleRunIdentitySchema = z.object({
  schema: z.literal(MOTORCYCLE_REPLAY_SCHEMA),
  runId: z.string().min(1),
  fixtureId: z.string().min(1),
  sourceMode: z.enum(["frozen_replay", "minecraft", "fivem", "physical"]),
  configurationHash: z.string().min(1),
  producerEpochs: z.array(z.string().min(1)),
  startedAtMs: z.number().int().nonnegative(),
});

export const ThreatStateSchema: z.ZodType<ThreatState> = z.object({
  trackId: z.string().min(1),
  bikeBearingDeg: finiteNumber,
  headBearingDeg: finiteNumber,
  sector: z.number().int().min(0).max(7),
  closingSpeedMps: finiteNumber,
  rangeM: finiteNumber.nonnegative(),
  timeToCollisionS: finiteNumber.nonnegative().nullable(),
  confidence: finiteNumber.min(0).max(1),
  severity: z.enum(["dim", "moderate", "urgent", "urgent_pulse", "suppressed"]),
  reasonCode: z.enum([
    "threat_admitted",
    "receding",
    "low_confidence",
    "non_intersecting_path",
    "outside_warning_horizon",
  ]),
});

export const HudCueSchema: z.ZodType<HudCue> = z.object({
  cueId: z.string().min(1),
  kind: z.enum(["approach", "navigation"]),
  sector: z.number().int().min(0).max(7),
  severity: z.enum(["dim", "moderate", "urgent", "urgent_pulse"]),
  intensity: finiteNumber.min(0).max(1),
  pattern: z.enum(["steady", "pulse"]),
  sourceTrackIds: z.array(z.string().min(1)),
  admittedAtMs: z.number().int().nonnegative(),
  expiresAtMs: z.number().int().nonnegative(),
});

export const SystemHealthSchema = z.object({
  schema: z.literal(MOTORCYCLE_AWARENESS_SCHEMA),
  atMs: z.number().int().nonnegative(),
  reflexController: z.literal("healthy"),
  watchdog: z.enum(["armed", "tripped"]),
  pose: z.enum(["fresh", "missing", "invalid"]),
  rendererAuthority: z.enum(["admitted", "blanked"]),
  blankReason: z.enum(["none", "manual_blank", "emergency_stop", "watchdog", "invalid_pose"]),
  networkRequired: z.literal(false),
});

export const MotorcycleDecisionReceiptSchema: z.ZodType<MotorcycleDecisionReceipt> = z.object({
  schema: z.literal(MOTORCYCLE_AWARENESS_SCHEMA),
  receiptId: z.string().min(1),
  atMs: z.number().int().nonnegative(),
  configurationHash: z.string().min(1),
  poseRef: z.string().nullable(),
  admittedTrackRefs: z.array(z.string()),
  rejectedTrackRefs: z.array(z.object({
    ref: z.string(),
    reason: z.enum(["duplicate_or_reordered", "stale", "configuration_mismatch"]),
  })),
  threatSummary: z.array(z.object({
    trackId: z.string(),
    sector: z.number().int().min(0).max(7),
    severity: z.enum(["dim", "moderate", "urgent", "urgent_pulse", "suppressed"]),
    reasonCode: z.enum([
      "threat_admitted",
      "receding",
      "low_confidence",
      "non_intersecting_path",
      "outside_warning_horizon",
    ]),
  })),
  cueIds: z.array(z.string()),
  blankReason: z.enum(["none", "manual_blank", "emergency_stop", "watchdog", "invalid_pose"]),
  causalHash: z.string().min(1),
  hashAlgorithm: z.literal("fnv1a32_fixture_identity"),
});

export const MOTORCYCLE_CONTROLLER_CONFIG = Object.freeze({
  configurationHash: "mhud-controller-v1-2026-09-02",
  minimumConfidence: 0.55,
  maximumClosestApproachM: 4,
  warningHorizonS: 10,
  moderateTtcS: 6,
  urgentTtcS: 3,
  urgentPulseTtcS: 1.5,
  cueTtlMs: 240,
  watchdogMs: 300,
});

export function createMotorcycleAwarenessState(): MotorcycleAwarenessState {
  return {
    atMs: 0,
    lastSequenceBySource: {},
    lastFreshObservationAtMs: null,
    activeCues: [],
    threats: [],
    blankReason: "none",
    rejectedObservationCount: 0,
    receipts: [],
  };
}

export function wrapBearingDeg(value: number): number {
  let wrapped = ((value + 180) % 360 + 360) % 360 - 180;
  if (Object.is(wrapped, -0)) wrapped = 0;
  return wrapped;
}

export function headRelativeBearingDeg(bearingBikeDeg: number, headYawBikeDeg: number): number {
  return wrapBearingDeg(bearingBikeDeg - headYawBikeDeg);
}

/** Sector 0 is front; indices advance clockwise toward the rider's right. */
export function bearingToHudSector(headBearingDeg: number): number {
  return ((Math.round(-wrapBearingDeg(headBearingDeg) / 45) % 8) + 8) % 8;
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
}

export function fixtureIdentityHash(value: unknown): string {
  const input = stableJson(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function observationRef(value: MotorcycleEnvelope): string {
  return `${value.sourceId}:${value.producerEpoch}:${value.sequence}`;
}

function severityForTrack(track: TrafficTrack): Pick<ThreatState, "timeToCollisionS" | "severity" | "reasonCode"> {
  if (track.confidence < MOTORCYCLE_CONTROLLER_CONFIG.minimumConfidence) {
    return { timeToCollisionS: null, severity: "suppressed", reasonCode: "low_confidence" };
  }
  if (track.closingSpeedMps <= 0) {
    return { timeToCollisionS: null, severity: "suppressed", reasonCode: "receding" };
  }
  if (track.closestApproachM > MOTORCYCLE_CONTROLLER_CONFIG.maximumClosestApproachM) {
    return { timeToCollisionS: track.rangeM / track.closingSpeedMps, severity: "suppressed", reasonCode: "non_intersecting_path" };
  }
  const ttc = track.rangeM / track.closingSpeedMps;
  if (ttc > MOTORCYCLE_CONTROLLER_CONFIG.warningHorizonS) {
    return { timeToCollisionS: ttc, severity: "suppressed", reasonCode: "outside_warning_horizon" };
  }
  if (ttc <= MOTORCYCLE_CONTROLLER_CONFIG.urgentPulseTtcS) {
    return { timeToCollisionS: ttc, severity: "urgent_pulse", reasonCode: "threat_admitted" };
  }
  if (ttc <= MOTORCYCLE_CONTROLLER_CONFIG.urgentTtcS) {
    return { timeToCollisionS: ttc, severity: "urgent", reasonCode: "threat_admitted" };
  }
  if (ttc <= MOTORCYCLE_CONTROLLER_CONFIG.moderateTtcS) {
    return { timeToCollisionS: ttc, severity: "moderate", reasonCode: "threat_admitted" };
  }
  return { timeToCollisionS: ttc, severity: "dim", reasonCode: "threat_admitted" };
}

const severityRank: Record<HudSeverity, number> = { dim: 1, moderate: 2, urgent: 3, urgent_pulse: 4 };
const severityIntensity: Record<HudSeverity, number> = { dim: 0.28, moderate: 0.5, urgent: 0.78, urgent_pulse: 1 };

function selectBlankReason(frame: MotorcycleReplayFrame, poseInvalid: boolean, watchdogExpired: boolean): HudBlankReason {
  if (frame.controls.emergencyStop) return "emergency_stop";
  if (frame.controls.manualBlank) return "manual_blank";
  if (poseInvalid) return "invalid_pose";
  if (watchdogExpired) return "watchdog";
  return "none";
}

export function advanceMotorcycleAwareness(
  previous: MotorcycleAwarenessState,
  rawFrame: MotorcycleReplayFrame,
): MotorcycleAwarenessState {
  const frame = MotorcycleReplayFrameSchema.parse(rawFrame);
  const admittedTracks: TrafficTrack[] = [];
  const rejectedTrackRefs: MotorcycleDecisionReceipt["rejectedTrackRefs"] = [];
  const nextSequences = { ...previous.lastSequenceBySource };

  for (const track of frame.tracks) {
    const ref = observationRef(track);
    const sequenceKey = `${track.sourceId}:${track.producerEpoch}`;
    const lastSequence = nextSequences[sequenceKey];
    if (lastSequence !== undefined && track.sequence <= lastSequence) {
      rejectedTrackRefs.push({ ref, reason: "duplicate_or_reordered" });
      continue;
    }
    nextSequences[sequenceKey] = track.sequence;
    if (track.configurationHash !== MOTORCYCLE_CONTROLLER_CONFIG.configurationHash) {
      rejectedTrackRefs.push({ ref, reason: "configuration_mismatch" });
      continue;
    }
    if (frame.atMs > track.freshnessDeadlineMs) {
      rejectedTrackRefs.push({ ref, reason: "stale" });
      continue;
    }
    admittedTracks.push(track);
  }

  const pose = frame.pose;
  const poseValid = Boolean(
    pose
      && pose.calibrated
      && pose.configurationHash === MOTORCYCLE_CONTROLLER_CONFIG.configurationHash
      && frame.atMs <= pose.freshnessDeadlineMs,
  );
  const observationSeen = admittedTracks.length > 0 || poseValid;
  const lastFreshObservationAtMs = observationSeen ? frame.atMs : previous.lastFreshObservationAtMs;
  const watchdogExpired = lastFreshObservationAtMs === null
    || frame.atMs - lastFreshObservationAtMs > MOTORCYCLE_CONTROLLER_CONFIG.watchdogMs;
  const blankReason = selectBlankReason(frame, pose !== null && !poseValid, watchdogExpired);
  const headYaw = poseValid && pose ? pose.yawBikeDeg : 0;

  const threats = admittedTracks.map((track): ThreatState => {
    const decision = severityForTrack(track);
    const headBearingDeg = headRelativeBearingDeg(track.bearingBikeDeg, headYaw);
    return {
      trackId: track.trackId,
      bikeBearingDeg: track.bearingBikeDeg,
      headBearingDeg,
      sector: bearingToHudSector(headBearingDeg),
      closingSpeedMps: track.closingSpeedMps,
      rangeM: track.rangeM,
      confidence: track.confidence,
      ...decision,
    };
  });

  const cueBySector = new Map<number, HudCue>();
  for (const threat of threats) {
    if (threat.severity === "suppressed") continue;
    const existing = cueBySector.get(threat.sector);
    const cue: HudCue = {
      cueId: `threat:${threat.sector}:${frame.atMs}`,
      kind: "approach",
      sector: threat.sector,
      severity: threat.severity,
      intensity: severityIntensity[threat.severity],
      pattern: threat.severity === "urgent_pulse" ? "pulse" : "steady",
      sourceTrackIds: [threat.trackId],
      admittedAtMs: frame.atMs,
      expiresAtMs: frame.atMs + MOTORCYCLE_CONTROLLER_CONFIG.cueTtlMs,
    };
    if (!existing || severityRank[cue.severity] > severityRank[existing.severity]) {
      if (existing) cue.sourceTrackIds.push(...existing.sourceTrackIds);
      cueBySector.set(threat.sector, cue);
    } else {
      existing.sourceTrackIds.push(threat.trackId);
    }
  }

  if (frame.controls.navigationSector !== null && !cueBySector.has(frame.controls.navigationSector)) {
    cueBySector.set(frame.controls.navigationSector, {
      cueId: `navigation:${frame.controls.navigationSector}:${frame.atMs}`,
      kind: "navigation",
      sector: frame.controls.navigationSector,
      severity: "dim",
      intensity: 0.25,
      pattern: "steady",
      sourceTrackIds: [],
      admittedAtMs: frame.atMs,
      expiresAtMs: frame.atMs + MOTORCYCLE_CONTROLLER_CONFIG.cueTtlMs,
    });
  }

  // Keep a recent cue briefly when a sensor frame is empty; the watchdog remains authoritative.
  const currentlyCuedTrackIds = new Set(
    [...cueBySector.values()].flatMap((cue) => cue.sourceTrackIds),
  );
  for (const priorCue of previous.activeCues) {
    const sourceStillTracked = priorCue.sourceTrackIds.some((trackId) => currentlyCuedTrackIds.has(trackId));
    if (!sourceStillTracked && !cueBySector.has(priorCue.sector) && priorCue.expiresAtMs >= frame.atMs) {
      cueBySector.set(priorCue.sector, priorCue);
    }
  }

  const activeCues = blankReason === "none"
    ? z.array(HudCueSchema).parse([...cueBySector.values()].sort((left, right) => left.sector - right.sector))
    : [];
  const receiptBody = {
    atMs: frame.atMs,
    configurationHash: MOTORCYCLE_CONTROLLER_CONFIG.configurationHash,
    poseRef: pose ? observationRef(pose) : null,
    admittedTrackRefs: admittedTracks.map(observationRef),
    rejectedTrackRefs,
    threatSummary: threats.map(({ trackId, sector, severity, reasonCode }) => ({ trackId, sector, severity, reasonCode })),
    cueIds: activeCues.map((cue) => cue.cueId),
    blankReason,
  };
  const causalHash = fixtureIdentityHash(receiptBody);
  const receipt = MotorcycleDecisionReceiptSchema.parse({
    schema: MOTORCYCLE_AWARENESS_SCHEMA,
    receiptId: `receipt:${frame.atMs}:${causalHash.slice(-8)}`,
    ...receiptBody,
    causalHash,
    hashAlgorithm: "fnv1a32_fixture_identity",
  });

  return {
    atMs: frame.atMs,
    lastSequenceBySource: nextSequences,
    lastFreshObservationAtMs,
    activeCues,
    threats: z.array(ThreatStateSchema).parse(threats),
    blankReason,
    rejectedObservationCount: previous.rejectedObservationCount + rejectedTrackRefs.length,
    receipts: [...previous.receipts, receipt],
  };
}

export function runMotorcycleReplay(fixtureInput: MotorcycleReplayFixture): MotorcycleAwarenessState {
  const fixture = MotorcycleReplayFixtureSchema.parse(fixtureInput);
  return fixture.frames.reduce(advanceMotorcycleAwareness, createMotorcycleAwarenessState());
}
