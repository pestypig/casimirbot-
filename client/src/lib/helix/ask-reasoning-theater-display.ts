export const REASONING_THEATER_STANCE_META: Record<
  string,
  { badge: string; bar: string; label: string }
> = {
  winning: {
    badge: "text-emerald-200",
    bar: "bg-emerald-300/80",
    label: "Winning",
  },
  contested: {
    badge: "text-sky-200",
    bar: "bg-sky-300/80",
    label: "Contested",
  },
  losing: {
    badge: "text-amber-200",
    bar: "bg-amber-300/80",
    label: "Losing",
  },
  fail_closed: {
    badge: "text-rose-200",
    bar: "bg-rose-300/80",
    label: "Fail-closed",
  },
};

export const REASONING_THEATER_ARCHETYPE_LABEL: Record<string, string> = {
  ambiguity: "ambiguity",
  missing_evidence: "missing evidence",
  coverage_gap: "coverage gap",
  contradiction: "contradiction",
  overload: "overload",
};

export const REASONING_THEATER_PHASE_LABEL: Record<string, string> = {
  observe: "observe",
  plan: "plan",
  retrieve: "retrieve",
  gate: "gate",
  synthesize: "synthesize",
  verify: "verify",
  execute: "execute",
  debrief: "debrief",
};

export const REASONING_THEATER_CERTAINTY_LABEL: Record<string, string> = {
  confirmed: "confirmed",
  reasoned: "reasoned",
  hypothesis: "hypothesis",
  unknown: "unknown",
};

export const REASONING_THEATER_SUPPRESSION_LABEL: Record<string, string> = {
  context_ineligible: "context ineligible",
  dedupe_cooldown: "dedupe cooldown",
  mission_rate_limited: "mission rate limited",
  voice_rate_limited: "voice rate limited",
  voice_budget_exceeded: "voice budget exceeded",
  voice_backend_error: "voice backend error",
  missing_evidence: "missing evidence",
  contract_violation: "contract violation",
  agi_overload_admission_control: "agi overload admission control",
};

export const REASONING_THEATER_MEDAL_LABEL: Record<string, string> = {
  scout: "Scout",
  anchor: "Anchor",
  lattice: "Lattice",
  prism: "Prism",
  fracture: "Fracture",
  stitch: "Stitch",
  relay: "Relay",
  gate: "Gate",
  seal: "Seal",
  lantern: "Lantern",
  valve: "Valve",
  crown: "Crown",
};

export const REASONING_THEATER_MEDAL_ASSET: Record<string, string> = {
  scout: "/reasoning-theater/medals/scout.svg",
  anchor: "/reasoning-theater/medals/anchor.svg",
  lattice: "/reasoning-theater/medals/lattice.svg",
  prism: "/reasoning-theater/medals/prism.svg",
  fracture: "/reasoning-theater/medals/fracture.svg",
  stitch: "/reasoning-theater/medals/stitch.svg",
  relay: "/reasoning-theater/medals/relay.svg",
  gate: "/reasoning-theater/medals/gate.svg",
  seal: "/reasoning-theater/medals/seal.svg",
  lantern: "/reasoning-theater/medals/lantern.svg",
  valve: "/reasoning-theater/medals/valve.svg",
  crown: "/reasoning-theater/medals/crown.svg",
};
