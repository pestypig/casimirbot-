import type { MirekCellKind, MirekReasoningArtifactV1 } from "@shared/helix-reasoning-mirek";

export type ReasoningTheaterParticle = {
  id: string;
  leftPct: number;
  topPct: number;
  sizePx: number;
  opacity: number;
  delayS: number;
  durationS: number;
  kind: MirekCellKind;
};

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

export type ReasoningTheaterFrontierParticleNode = {
  id: string;
  phaseOffsetMs: number;
  baseRadiusPx: number;
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function hash32(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildReasoningTheaterFrontierParticles(
  seed: number,
  count: number,
): ReasoningTheaterFrontierParticleNode[] {
  const rng = mulberry32(seed ^ 0xa5a5a5a5);
  const nodes: ReasoningTheaterFrontierParticleNode[] = [];
  for (let i = 0; i < count; i += 1) {
    nodes.push({
      id: `frontier-particle-${i}`,
      phaseOffsetMs: Math.round(rng() * 1200),
      baseRadiusPx: 2 + rng() * 2.4,
    });
  }
  return nodes;
}

export function buildReasoningTheaterParticlesFromMirekArtifact(
  artifact: MirekReasoningArtifactV1,
): ReasoningTheaterParticle[] {
  const width = Math.max(1, artifact.grid.width);
  const height = Math.max(1, artifact.grid.height);
  return artifact.grid.cells.map((cell, index) => {
    const roleSize =
      cell.kind === "objective" || cell.kind === "proof" || cell.kind === "blocked"
        ? 4.4
        : cell.kind === "evidence"
          ? 3.8
          : cell.kind === "support"
            ? 2.8
            : 2.2;
    const jitter = (hash32(`${artifact.finalFrameHash}:${cell.id}:${index}`) % 9) / 10;
    return {
      id: cell.id,
      leftPct: Math.round(((cell.x + 0.5) / width) * 1000) / 10,
      topPct: Math.round(((cell.y + 0.5) / height) * 1000) / 10,
      sizePx: roleSize + jitter,
      opacity: clamp01(cell.opacity),
      delayS: (hash32(`${cell.id}:delay`) % 900) / 1000,
      durationS: 1.2 + (hash32(`${cell.id}:duration`) % 1800) / 1000,
      kind: cell.kind,
    };
  });
}

export function mirekCellParticleClassName(kind: MirekCellKind): string {
  switch (kind) {
    case "objective":
      return "bg-white/90 shadow-[0_0_10px_rgba(255,255,255,0.5)]";
    case "evidence":
      return "bg-emerald-200/85 shadow-[0_0_10px_rgba(110,231,183,0.45)]";
    case "support":
      return "bg-cyan-200/80 shadow-[0_0_8px_rgba(103,232,249,0.4)]";
    case "gap":
      return "bg-amber-200/85 shadow-[0_0_10px_rgba(252,211,77,0.45)]";
    case "conflict":
      return "bg-orange-300/85 shadow-[0_0_10px_rgba(253,186,116,0.45)]";
    case "proof":
      return "bg-violet-200/90 shadow-[0_0_12px_rgba(221,214,254,0.55)]";
    case "blocked":
      return "bg-rose-300/90 shadow-[0_0_12px_rgba(253,164,175,0.55)]";
    case "afterglow":
      return "bg-slate-300/45";
    case "context":
    case "empty":
    default:
      return "bg-sky-200/65 shadow-[0_0_8px_rgba(186,230,253,0.28)]";
  }
}

export function mirekCellGridClassName(kind: MirekCellKind): string {
  switch (kind) {
    case "proof":
      return "bg-white shadow-[0_0_12px_rgba(255,255,255,0.7)]";
    case "objective":
      return "bg-white/95 shadow-[0_0_10px_rgba(255,255,255,0.55)]";
    case "evidence":
      return "bg-white/85 shadow-[0_0_9px_rgba(209,250,229,0.5)]";
    case "support":
      return "bg-cyan-100/80 shadow-[0_0_8px_rgba(207,250,254,0.45)]";
    case "gap":
      return "bg-amber-100/80 shadow-[0_0_8px_rgba(254,243,199,0.45)]";
    case "conflict":
      return "bg-orange-100/80 shadow-[0_0_9px_rgba(255,237,213,0.45)]";
    case "blocked":
      return "bg-rose-100/85 shadow-[0_0_10px_rgba(255,228,230,0.5)]";
    case "afterglow":
      return "bg-white/35 shadow-[0_0_6px_rgba(255,255,255,0.25)]";
    case "context":
    case "empty":
    default:
      return "bg-white/55 shadow-[0_0_6px_rgba(255,255,255,0.3)]";
  }
}
