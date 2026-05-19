export const HELIX_ENVIRONMENT_LIVE_LINE_KEYS = [
  "situation",
  "actor_state",
  "resources",
  "affordances",
  "risk",
  "possibilities",
  "rehearsal",
  "recommendation",
  "unknowns",
  "next_check",
] as const;

export type HelixEnvironmentLiveLineKey = typeof HELIX_ENVIRONMENT_LIVE_LINE_KEYS[number];

