import {
  MOTORCYCLE_AWARENESS_SCHEMA,
  MOTORCYCLE_CONTROLLER_CONFIG,
  MOTORCYCLE_REPLAY_SCHEMA,
  type HelmetPose,
  type MotorcycleControls,
  type MotorcycleReplayFixture,
  type MotorcycleReplayFrame,
  type TrafficTrack,
} from "./helix-motorcycle-awareness";

const configurationHash = MOTORCYCLE_CONTROLLER_CONFIG.configurationHash;

function pose(
  sequence: number,
  atMs: number,
  yawBikeDeg = 0,
  overrides: Partial<HelmetPose> = {},
): HelmetPose {
  return {
    schema: MOTORCYCLE_AWARENESS_SCHEMA,
    kind: "helmet_pose",
    environmentId: "mhud-lab",
    sourceId: "helmet-imu",
    producerEpoch: "pose-epoch-a",
    sequence,
    sourceTimestampMs: atMs,
    arrivalTimestampMs: atMs,
    freshnessDeadlineMs: atMs + 250,
    configurationHash,
    yawBikeDeg,
    quaternion: [1, 0, 0, 0],
    calibrationId: "calibration-a",
    calibrated: true,
    ...overrides,
  };
}

function track(
  trackId: string,
  sequence: number,
  atMs: number,
  bearingBikeDeg: number,
  rangeM: number,
  closingSpeedMps: number,
  overrides: Partial<TrafficTrack> = {},
): TrafficTrack {
  return {
    schema: MOTORCYCLE_AWARENESS_SCHEMA,
    kind: "traffic_track",
    environmentId: "mhud-lab",
    sourceId: "bike-radar",
    producerEpoch: "radar-epoch-a",
    sequence,
    sourceTimestampMs: atMs,
    arrivalTimestampMs: atMs,
    freshnessDeadlineMs: atMs + 220,
    configurationHash,
    trackId,
    bearingBikeDeg,
    rangeM,
    closingSpeedMps,
    lateralSpeedMps: 0,
    closestApproachM: 0.8,
    confidence: 0.94,
    classification: "vehicle",
    ...overrides,
  };
}

function frame(
  atMs: number,
  tracks: TrafficTrack[],
  helmetPose: HelmetPose | null,
  controls: Partial<MotorcycleControls> = {},
): MotorcycleReplayFrame {
  return {
    atMs,
    tracks,
    pose: helmetPose,
    controls: { manualBlank: false, emergencyStop: false, navigationSector: null, ...controls },
  };
}

function fixture(
  id: string,
  title: string,
  family: string,
  description: string,
  frames: MotorcycleReplayFrame[],
  finalActiveSectors: number[],
  finalBlankReason: MotorcycleReplayFixture["expected"]["finalBlankReason"] = "none",
  minimumRejectedObservations = 0,
): MotorcycleReplayFixture {
  return {
    schema: MOTORCYCLE_REPLAY_SCHEMA,
    id,
    title,
    family,
    description,
    frames,
    expected: { finalBlankReason, finalActiveSectors, minimumRejectedObservations },
  };
}

export const MOTORCYCLE_REPLAY_FIXTURES: MotorcycleReplayFixture[] = [
  fixture(
    "no-objects",
    "Clear road / no tracks",
    "baseline",
    "A fresh calibrated pose and no traffic must render no warning cues.",
    [frame(0, [], pose(1, 0))],
    [],
  ),
  fixture(
    "rear-left-escalation",
    "Rear-left closing escalation",
    "threat escalation",
    "A rear-left vehicle progresses from dim through urgent pulse as TTC falls.",
    [
      frame(0, [track("vehicle-rl", 1, 0, 135, 80, 9)], pose(1, 0)),
      frame(100, [track("vehicle-rl", 2, 100, 135, 42, 10)], pose(2, 100)),
      frame(200, [track("vehicle-rl", 3, 200, 135, 20, 10)], pose(3, 200)),
      frame(300, [track("vehicle-rl", 4, 300, 135, 12, 10)], pose(4, 300)),
    ],
    [5],
  ),
  fixture(
    "receding-track",
    "Receding vehicle suppressed",
    "negative closing rate",
    "A vehicle moving away must remain visible to the oracle but produce no cue.",
    [frame(0, [track("receding", 1, 0, -150, 18, -4)], pose(1, 0))],
    [],
  ),
  fixture(
    "sector-arbitration",
    "Two tracks / one sector",
    "arbitration",
    "The more severe of two threats owns the sector while retaining both causal track ids.",
    [frame(0, [
      track("near", 1, 0, -92, 14, 10),
      track("far", 2, 0, -100, 50, 9),
    ], pose(1, 0))],
    [2],
  ),
  fixture(
    "head-yaw-migration",
    "Head-relative sector migration",
    "coordinate transform",
    "A bike-fixed left threat migrates clockwise around the head-relative HUD as the rider turns left.",
    [
      frame(0, [track("fixed-left", 1, 0, 90, 18, 8)], pose(1, 0, 0)),
      frame(100, [track("fixed-left", 2, 100, 90, 16, 8)], pose(2, 100, 45)),
    ],
    [7],
  ),
  fixture(
    "invalid-pose",
    "Invalid pose fails closed",
    "pose authority",
    "An uncalibrated pose blanks all HUD output instead of guessing the coordinate frame.",
    [frame(0, [track("rear", 1, 0, 180, 12, 9)], pose(1, 0, 0, { calibrated: false }))],
    [],
    "invalid_pose",
  ),
  fixture(
    "dropout-watchdog",
    "Source dropout watchdog",
    "freshness",
    "An empty interval beyond the watchdog budget clears a previously admitted cue.",
    [
      frame(0, [track("rear", 1, 0, 180, 12, 9)], pose(1, 0)),
      frame(350, [], null),
    ],
    [],
    "watchdog",
  ),
  fixture(
    "duplicate-reorder",
    "Duplicate and reordered observations",
    "sequence admission",
    "Repeated and decreasing source sequences are rejected with typed reasons.",
    [
      frame(0, [track("rear", 4, 0, 180, 20, 8)], pose(1, 0)),
      frame(100, [track("duplicate", 4, 100, 0, 5, 10), track("reordered", 3, 100, 0, 5, 10)], pose(2, 100)),
    ],
    [4],
    "none",
    2,
  ),
  fixture(
    "non-intersecting",
    "Fast but non-intersecting path",
    "path conflict",
    "High closing speed is suppressed when closest approach stays outside the conflict envelope.",
    [frame(0, [track("cross-traffic", 1, 0, -45, 20, 18, { closestApproachM: 12 })], pose(1, 0))],
    [],
  ),
  fixture(
    "low-confidence",
    "Low-confidence track",
    "confidence admission",
    "A noisy low-confidence detection cannot command the HUD.",
    [frame(0, [track("noise", 1, 0, 45, 8, 10, { confidence: 0.31 })], pose(1, 0))],
    [],
  ),
  fixture(
    "navigation-preempted",
    "Threat preempts navigation",
    "cue priority",
    "A safety cue displaces navigation when both request the same HUD sector.",
    [frame(0, [track("right-threat", 1, 0, -90, 15, 8)], pose(1, 0), { navigationSector: 2 })],
    [2],
  ),
  fixture(
    "manual-blank",
    "Manual blanking",
    "operator safety",
    "Manual blanking clears all output while retaining a causal receipt.",
    [frame(0, [track("rear", 1, 0, 180, 10, 10)], pose(1, 0), { manualBlank: true })],
    [],
    "manual_blank",
  ),
  fixture(
    "emergency-stop",
    "Emergency stop",
    "operator safety",
    "Emergency stop has highest blanking authority.",
    [frame(0, [track("rear", 1, 0, 180, 10, 10)], pose(1, 0), { emergencyStop: true })],
    [],
    "emergency_stop",
  ),
  fixture(
    "fresh-epoch-reconnect",
    "Reconnect with a fresh producer epoch",
    "restart recovery",
    "A new producer epoch admits a fresh sequence without inheriting the previous epoch's ordering state.",
    [
      frame(0, [track("rear", 9, 0, 180, 18, 8)], pose(1, 0)),
      frame(100, [track("right", 1, 100, -90, 12, 8, { producerEpoch: "radar-epoch-b" })], pose(2, 100)),
    ],
    [2, 4],
  ),
];

export const DEFAULT_MOTORCYCLE_REPLAY_FIXTURE = MOTORCYCLE_REPLAY_FIXTURES[1];

