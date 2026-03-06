export type ContextCapsuleSourceState =
  | "atlas_exact"
  | "repo_exact"
  | "open_world"
  | "unknown";

export type ContextCapsuleProofState =
  | "confirmed"
  | "reasoned"
  | "hypothesis"
  | "unknown"
  | "fail_closed";

export type ContextCapsuleMaturityState =
  | "exploratory"
  | "reduced_order"
  | "diagnostic"
  | "certified";

export type ContextCapsulePhase =
  | "observe"
  | "plan"
  | "retrieve"
  | "gate"
  | "synthesize"
  | "verify"
  | "execute"
  | "debrief";

export type ContextCapsuleCommitEvent = "arbiter_commit" | "proof_commit";

export type ContextCapsuleConvergence = {
  source: ContextCapsuleSourceState;
  proofPosture: ContextCapsuleProofState;
  maturity: ContextCapsuleMaturityState;
  phase: ContextCapsulePhase;
  collapseEvent: ContextCapsuleCommitEvent | null;
};

export type ContextCapsuleReplayBundle = {
  pinned_files: string[];
  exact_paths: string[];
  docs: Array<{ uri: string; title?: string; hash?: string }>;
  resolved_concepts: Array<{ id: string; label: string; evidence: string[] }>;
  recent_topics: string[];
  open_slots: string[];
};

export type ContextCapsuleStamp = {
  rulePreset: ContextCapsuleMaturityState;
  tickHz: number;
  seed: number;
  gridW: number;
  gridH: number;
  finalBits: string;
};

export type ContextCapsuleV1 = {
  version: "v1";
  capsuleId: string;
  fingerprint: string;
  createdAtTsMs: number;
  traceId: string | null;
  runId: string | null;
  convergence: ContextCapsuleConvergence;
  intent: {
    intent_domain: string;
    intent_id: string;
    goal: string;
    constraints: string[];
    key_terms: string[];
  };
  provenance: {
    retrieval_route: string;
    zone_hint: "mapped_connected" | "owned_frontier" | "uncharted";
    has_exact_provenance: boolean;
    exact_paths: string[];
    primary_path: string | null;
    atlas_hits: number;
    channel_hits: Record<string, number>;
  };
  epistemic: {
    arbiter_mode: string;
    claim_tier: string;
    provenance_class: string;
    certifying: boolean;
    fail_reason: string | null;
  };
  commit: {
    events: ContextCapsuleCommitEvent[];
    proof_verdict: "PASS" | "FAIL" | "UNKNOWN";
    certificate_hash: string | null;
    certificate_integrity_ok: boolean | null;
  };
  replay_active: ContextCapsuleReplayBundle;
  replay_inactive: ContextCapsuleReplayBundle;
  stamp: ContextCapsuleStamp;
  safety: {
    strict_core: true;
    replay_active: boolean;
    fail_closed: boolean;
  };
};

export type ContextCapsuleSummary = {
  version: "v1";
  capsuleId: string;
  fingerprint: string;
  createdAtTsMs: number;
  traceId: string | null;
  runId: string | null;
  convergence: ContextCapsuleConvergence;
  commit: ContextCapsuleV1["commit"];
  stamp: ContextCapsuleStamp;
  stamp_lines: string[];
  safety: ContextCapsuleV1["safety"];
};

export type ContextCapsuleAutomaton = {
  width: number;
  height: number;
  cells: Uint8Array;
  generation: number;
  seed: number;
  frozen: boolean;
};

export type ContextCapsuleAutomatonControls = {
  source: ContextCapsuleSourceState;
  proof: ContextCapsuleProofState;
  maturity: ContextCapsuleMaturityState;
};

const CAPSULE_ID_PATTERN = /\bHXCAP-[A-Z0-9]{6,16}\b/gi;
const CAPSULE_FINGERPRINT_PATTERN = /\bHXFP-[A-Z0-9]{4,16}\b/gi;
const CAPSULE_STAMP_LINE_PATTERN = /^[#.]{10}$/;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const readUnsigned = (value: number): number => (value >>> 0);

const xorshift32 = (value: number): number => {
  let x = readUnsigned(value || 1);
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return readUnsigned(x);
};

export function hash32(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return readUnsigned(hash);
}

export function normalizeContextCapsuleId(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim().toUpperCase();
  if (!raw) return null;
  if (raw.startsWith("HXFP-")) {
    return /^HXFP-[A-Z0-9]{4,16}$/.test(raw) ? raw : null;
  }
  const normalized = raw.startsWith("HXCAP-") ? raw : `HXCAP-${raw}`;
  return /^HXCAP-[A-Z0-9]{6,16}$/.test(normalized) ? normalized : null;
}

export function extractContextCapsuleIdsFromText(value: string | null | undefined): string[] {
  if (typeof value !== "string" || value.trim().length === 0) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const match of value.matchAll(CAPSULE_ID_PATTERN)) {
    const normalized = normalizeContextCapsuleId(match[0]);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  for (const match of value.matchAll(CAPSULE_FINGERPRINT_PATTERN)) {
    const normalized = normalizeContextCapsuleId(match[0]);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  for (const fingerprint of extractContextCapsuleFingerprintsFromVisualStamp(value)) {
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);
    out.push(fingerprint);
  }
  return out;
}

export function buildContextCapsuleId(seedText: string): string {
  const digest = hash32(seedText).toString(16).toUpperCase().padStart(8, "0");
  return `HXCAP-${digest.slice(0, 8)}`;
}

export function isContextCapsuleReplayActive(input: {
  source: ContextCapsuleSourceState;
  proofPosture: ContextCapsuleProofState;
}): boolean {
  const exactSource = input.source === "atlas_exact" || input.source === "repo_exact";
  const strictProof = input.proofPosture === "confirmed" || input.proofPosture === "reasoned";
  return exactSource && strictProof;
}

function sourceDensity(source: ContextCapsuleSourceState): number {
  if (source === "atlas_exact") return 0.26;
  if (source === "repo_exact") return 0.33;
  if (source === "open_world") return 0.43;
  return 0.18;
}

function seededRatio(seed: number, index: number): number {
  const mixed = xorshift32(seed ^ Math.imul(index + 1, 1103515245));
  return mixed / 0xffffffff;
}

export function createContextCapsuleAutomaton(args: {
  seed: number;
  width?: number;
  height?: number;
  source: ContextCapsuleSourceState;
}): ContextCapsuleAutomaton {
  const width = clamp(Math.floor(args.width ?? 80), 8, 160);
  const height = clamp(Math.floor(args.height ?? 16), 4, 64);
  const total = width * height;
  const cells = new Uint8Array(total);
  const density = sourceDensity(args.source);
  for (let i = 0; i < total; i += 1) {
    cells[i] = seededRatio(args.seed, i) < density ? 1 : 0;
  }
  return {
    width,
    height,
    cells,
    generation: 0,
    seed: readUnsigned(args.seed),
    frozen: false,
  };
}

function resolveLifeRule(maturity: ContextCapsuleMaturityState): {
  survive: number[];
  born: number[];
} {
  if (maturity === "exploratory") {
    return { survive: [2, 3], born: [3, 6] };
  }
  if (maturity === "reduced_order") {
    return { survive: [2, 3, 4], born: [3] };
  }
  if (maturity === "certified") {
    return { survive: [2, 3, 4], born: [3, 4] };
  }
  return { survive: [1, 2, 3], born: [3] };
}

function cellAt(
  cells: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  source: ContextCapsuleSourceState,
): number {
  if (source === "open_world") {
    const wrappedX = ((x % width) + width) % width;
    const wrappedY = ((y % height) + height) % height;
    return cells[wrappedY * width + wrappedX] ?? 0;
  }
  if (x < 0 || y < 0 || x >= width || y >= height) return 0;
  return cells[y * width + x] ?? 0;
}

export function injectContextCapsuleCommit(
  state: ContextCapsuleAutomaton,
  event: ContextCapsuleCommitEvent,
): ContextCapsuleAutomaton {
  const next = new Uint8Array(state.cells);
  const cx = Math.floor(state.width / 2);
  const cy = Math.floor(state.height / 2);
  const radius = event === "proof_commit" ? 4 : 3;
  for (let y = 0; y < state.height; y += 1) {
    for (let x = 0; x < state.width; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (Math.abs(dist - radius) <= 0.8) {
        next[y * state.width + x] = 1;
      }
    }
  }
  return {
    ...state,
    cells: next,
    frozen: event === "proof_commit" ? true : state.frozen,
  };
}

export function stepContextCapsuleAutomaton(
  state: ContextCapsuleAutomaton,
  controls: ContextCapsuleAutomatonControls,
): ContextCapsuleAutomaton {
  if (state.frozen) {
    return { ...state, generation: state.generation + 1 };
  }
  if (controls.proof === "fail_closed") {
    return {
      ...state,
      cells: new Uint8Array(state.width * state.height),
      generation: state.generation + 1,
      frozen: true,
    };
  }
  const rule = resolveLifeRule(controls.maturity);
  const surviveSet = new Set(rule.survive);
  const bornSet = new Set(rule.born);
  const next = new Uint8Array(state.width * state.height);
  const stabilizeBias = controls.proof === "confirmed" ? 0.08 : controls.proof === "reasoned" ? 0.04 : 0;
  const flickerBias = controls.proof === "hypothesis" || controls.proof === "unknown" ? 0.08 : 0;
  for (let y = 0; y < state.height; y += 1) {
    for (let x = 0; x < state.width; x += 1) {
      const idx = y * state.width + x;
      const current = state.cells[idx] ?? 0;
      let neighbors = 0;
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          if (ox === 0 && oy === 0) continue;
          neighbors += cellAt(
            state.cells,
            state.width,
            state.height,
            x + ox,
            y + oy,
            controls.source,
          );
        }
      }
      let alive = current === 1 ? surviveSet.has(neighbors) : bornSet.has(neighbors);
      const noise = seededRatio(state.seed ^ state.generation, idx);
      if (!alive && noise < stabilizeBias) alive = true;
      if (alive && noise < flickerBias * 0.5) alive = false;
      next[idx] = alive ? 1 : 0;
    }
  }
  return {
    ...state,
    cells: next,
    generation: state.generation + 1,
  };
}

export function serializeContextCapsuleBits(state: ContextCapsuleAutomaton): string {
  let bits = "";
  for (let i = 0; i < state.cells.length; i += 1) {
    bits += state.cells[i] ? "1" : "0";
  }
  return bits;
}

export function deserializeContextCapsuleBits(
  bits: string,
  width: number,
  height: number,
): Uint8Array {
  const total = Math.max(1, width * height);
  const cells = new Uint8Array(total);
  for (let i = 0; i < total; i += 1) {
    cells[i] = bits[i] === "1" ? 1 : 0;
  }
  return cells;
}

export function renderContextCapsuleStampLines(args: {
  bits: string;
  width: number;
  height: number;
  targetWidth?: number;
  targetHeight?: number;
}): string[] {
  const targetWidth = clamp(Math.floor(args.targetWidth ?? 10), 4, 40);
  const targetHeight = clamp(Math.floor(args.targetHeight ?? 3), 2, 16);
  const lines: string[] = [];
  for (let row = 0; row < targetHeight; row += 1) {
    let line = "";
    const yStart = Math.floor((row * args.height) / targetHeight);
    const yEnd = Math.max(yStart + 1, Math.floor(((row + 1) * args.height) / targetHeight));
    for (let col = 0; col < targetWidth; col += 1) {
      const xStart = Math.floor((col * args.width) / targetWidth);
      const xEnd = Math.max(xStart + 1, Math.floor(((col + 1) * args.width) / targetWidth));
      let alive = 0;
      let total = 0;
      for (let y = yStart; y < yEnd; y += 1) {
        for (let x = xStart; x < xEnd; x += 1) {
          const idx = y * args.width + x;
          alive += args.bits[idx] === "1" ? 1 : 0;
          total += 1;
        }
      }
      line += alive * 2 >= total ? "#" : ".";
    }
    lines.push(line);
  }
  return lines;
}

export function buildContextCapsuleFingerprint(args: {
  bits: string;
  width: number;
  height: number;
}): string {
  const lines = renderContextCapsuleStampLines({
    bits: args.bits,
    width: args.width,
    height: args.height,
    targetWidth: 10,
    targetHeight: 3,
  });
  return buildContextCapsuleFingerprintFromStampLines(lines);
}

export function buildContextCapsuleFingerprintFromStampLines(lines: string[]): string {
  let value = 0;
  for (const line of lines) {
    const normalized = line.trim();
    for (const char of normalized) {
      value = (value << 1) | (char === "#" ? 1 : 0);
    }
  }
  const encoded = readUnsigned(value).toString(36).toUpperCase().padStart(6, "0");
  return `HXFP-${encoded}`;
}

export function extractContextCapsuleFingerprintsFromVisualStamp(
  value: string | null | undefined,
): string[] {
  if (typeof value !== "string" || value.trim().length === 0) return [];
  const lines = value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (lines.length < 3) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; i <= lines.length - 3; i += 1) {
    const a = lines[i];
    const b = lines[i + 1];
    const c = lines[i + 2];
    if (!a || !b || !c) continue;
    if (!CAPSULE_STAMP_LINE_PATTERN.test(a)) continue;
    if (!CAPSULE_STAMP_LINE_PATTERN.test(b)) continue;
    if (!CAPSULE_STAMP_LINE_PATTERN.test(c)) continue;
    const fingerprint = buildContextCapsuleFingerprintFromStampLines([a, b, c]);
    const normalized = normalizeContextCapsuleId(fingerprint);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}
