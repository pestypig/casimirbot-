export type MirekReasoningPhase =
  | "observe"
  | "plan"
  | "retrieve"
  | "gate"
  | "synthesize"
  | "verify"
  | "execute"
  | "debrief";

export type MirekReasoningStance = "winning" | "contested" | "losing" | "fail_closed";

export type MirekReasoningArchetype =
  | "ambiguity"
  | "missing_evidence"
  | "coverage_gap"
  | "contradiction"
  | "overload";

export type MirekReasoningCertaintyClass = "confirmed" | "reasoned" | "hypothesis" | "unknown";

export type MirekReasoningProvenanceMode = "strict_exact" | "derived" | "sparse_fallback";

export type MirekCellKind =
  | "empty"
  | "objective"
  | "context"
  | "evidence"
  | "support"
  | "gap"
  | "conflict"
  | "proof"
  | "blocked"
  | "afterglow";

export type MirekAnchorRole =
  | "objective"
  | "evidence"
  | "gap"
  | "conflict"
  | "proof"
  | "blocked"
  | "context";

export type MirekEdgeRelation =
  | "supports"
  | "depends_on"
  | "contradicts"
  | "verifies"
  | "context_neighbor";

export type MirekReasoningCanonicalStateV1 = {
  contract_version: "reasoning_theater.v1";
  trace_id: string;
  mission_id?: string;
  event_id?: string;
  phase: MirekReasoningPhase;
  archetype: MirekReasoningArchetype;
  certainty_class: MirekReasoningCertaintyClass;
  suppression_reason: string | null;
  telemetry: {
    evidence_gate_ok: boolean | null;
    coverage_ratio: number | null;
    evidence_claim_ratio: number | null;
    belief_unsupported_rate: number | null;
    belief_contradictions: number | null;
    ambiguity_term_count: number;
    graph_block_ratio: number | null;
    graph_cross_tree_ratio: number | null;
    alignment_margin: number | null;
    alignment_decision: "PASS" | "BORDERLINE" | "FAIL" | null;
    event_latency_ms_p95: number | null;
    suppression_active: boolean;
    proof_verdict: "PASS" | "FAIL" | null;
    certificate_integrity_ok: boolean | null;
  };
  indices: {
    momentum: number;
    ambiguity_pressure: number;
    battle_index: number;
  };
  stance: MirekReasoningStance;
  scenario_id: string;
  seed: number;
  ts: string;
};

export type MirekReasoningStateInput = {
  traceId: string;
  phase: MirekReasoningPhase;
  stance: MirekReasoningStance;
  archetype: MirekReasoningArchetype;
  certaintyClass: MirekReasoningCertaintyClass;
  suppressionReason: string | null;
  momentum: number;
  ambiguityPressure: number;
  battleIndex: number;
  seed: number;
  proofVerdict?: "PASS" | "FAIL" | null;
  certificateIntegrityOk?: boolean | null;
};

export type MirekAnchorInput = {
  id: string;
  role: MirekAnchorRole;
  path?: string;
  graphNodeId?: string;
  weight?: number;
  exact?: boolean;
};

export type MirekEdgeInput = {
  from: string;
  to: string;
  relation: MirekEdgeRelation;
  weight?: number;
  exact?: boolean;
};

export type MirekReasoningAnchor = Required<Pick<MirekAnchorInput, "id" | "role" | "weight" | "exact">> & {
  path?: string;
  graphNodeId?: string;
};

export type MirekReasoningEdge = Required<Pick<MirekEdgeInput, "from" | "to" | "relation" | "weight" | "exact">>;

export type MirekCell = {
  id: string;
  x: number;
  y: number;
  kind: MirekCellKind;
  age: number;
  opacity: number;
  anchorId?: string;
  exact: boolean;
};

export type MirekReasoningArtifactV1 = {
  version: "helix.mirek_reasoning_artifact.v1";
  artifactId: string;
  traceId: string;
  turnId?: string;
  sessionId?: string;
  previousArtifactId?: string | null;
  source: {
    canonicalStateHash: string;
    traceEventsHash: string;
    graphSelectionHash: string | null;
    provenanceMode: MirekReasoningProvenanceMode;
  };
  state: {
    phase: MirekReasoningPhase;
    stance: MirekReasoningStance;
    archetype: MirekReasoningArchetype;
    certaintyClass: MirekReasoningCertaintyClass;
    suppressionReason: string | null;
    momentum: number;
    ambiguityPressure: number;
    battleIndex: number;
  };
  anchors: MirekReasoningAnchor[];
  edges: MirekReasoningEdge[];
  grid: {
    width: number;
    height: number;
    tick: number;
    seed: number;
    cells: MirekCell[];
  };
  continuity: {
    startedFrom: "empty" | "previous_turn" | "previous_trace_frame" | "context_capsule";
    previousFrameHash: string | null;
    carryoverRatio: number;
  };
  finalFrameHash: string;
};

export type BuildMirekReasoningArtifactInput = {
  canonicalState?: MirekReasoningCanonicalStateV1 | null;
  fallbackState?: MirekReasoningStateInput | null;
  traceEvents?: unknown[];
  anchors?: MirekAnchorInput[];
  edges?: MirekEdgeInput[];
  previousArtifact?: MirekReasoningArtifactV1 | null;
  objectiveFingerprint?: string | null;
  previousObjectiveFingerprint?: string | null;
  sharedExactPathRatio?: number;
  capsuleContinuityScore?: number;
  width?: number;
  height?: number;
  ticks?: number;
  turnId?: string | null;
  sessionId?: string | null;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const clamp01 = (value: number): number => clamp(value, 0, 1);

const stableJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
};

export const hashMirekReasoningValue = (value: unknown): string => {
  const text = stableJson(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
};

const hash32Text = (text: string): number => Number.parseInt(hashMirekReasoningValue(text), 16) >>> 0;

const mulberry32 = (seed: number): (() => number) => {
  let next = seed >>> 0;
  return () => {
    next += 0x6d2b79f5;
    let t = next;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const normalizeAnchor = (anchor: MirekAnchorInput): MirekReasoningAnchor | null => {
  const id = anchor.id.trim();
  if (!id) return null;
  return {
    id,
    role: anchor.role,
    weight: clamp01(anchor.weight ?? 1),
    exact: anchor.exact === true,
    ...(anchor.path ? { path: anchor.path } : {}),
    ...(anchor.graphNodeId ? { graphNodeId: anchor.graphNodeId } : {}),
  };
};

const normalizeEdge = (edge: MirekEdgeInput): MirekReasoningEdge | null => {
  const from = edge.from.trim();
  const to = edge.to.trim();
  if (!from || !to || from === to) return null;
  return {
    from,
    to,
    relation: edge.relation,
    weight: clamp01(edge.weight ?? 1),
    exact: edge.exact === true,
  };
};

const stateFromCanonical = (
  canonical: MirekReasoningCanonicalStateV1,
): MirekReasoningStateInput => ({
  traceId: canonical.trace_id,
  phase: canonical.phase,
  stance: canonical.stance,
  archetype: canonical.archetype,
  certaintyClass: canonical.certainty_class,
  suppressionReason: canonical.suppression_reason,
  momentum: clamp01(canonical.indices.momentum),
  ambiguityPressure: clamp01(canonical.indices.ambiguity_pressure),
  battleIndex: clamp(canonical.indices.battle_index, -1, 1),
  seed: Number.isFinite(canonical.seed) ? canonical.seed >>> 0 : hash32Text(canonical.scenario_id),
  proofVerdict: canonical.telemetry.proof_verdict,
  certificateIntegrityOk: canonical.telemetry.certificate_integrity_ok,
});

const fallbackEmptyState = (): MirekReasoningStateInput => ({
  traceId: "unknown-trace",
  phase: "observe",
  stance: "contested",
  archetype: "ambiguity",
  certaintyClass: "unknown",
  suppressionReason: null,
  momentum: 0.15,
  ambiguityPressure: 0.65,
  battleIndex: -0.5,
  seed: hash32Text("sparse_fallback"),
  proofVerdict: null,
  certificateIntegrityOk: null,
});

const cellKindForAnchor = (anchor: MirekReasoningAnchor): MirekCellKind => {
  switch (anchor.role) {
    case "objective":
      return "objective";
    case "evidence":
      return "evidence";
    case "gap":
      return "gap";
    case "conflict":
      return "conflict";
    case "proof":
      return "proof";
    case "blocked":
      return "blocked";
    case "context":
    default:
      return "context";
  }
};

const anchorPosition = (
  anchor: MirekReasoningAnchor,
  width: number,
  height: number,
  seed: number,
): { x: number; y: number } => {
  const rng = mulberry32(hash32Text(`${seed}:${anchor.id}:${anchor.role}`));
  const x = clamp(Math.floor(rng() * width), 0, width - 1);
  const yBias =
    anchor.role === "objective"
      ? 0.5
      : anchor.role === "proof"
        ? 0.72
        : anchor.role === "gap" || anchor.role === "conflict" || anchor.role === "blocked"
          ? 0.28
          : 0.5;
  const y = clamp(Math.round((height - 1) * (0.25 * rng() + yBias * 0.75)), 0, height - 1);
  return { x, y };
};

const keyFor = (x: number, y: number): string => `${x}:${y}`;

const cellId = (x: number, y: number, kind: MirekCellKind, anchorId?: string): string =>
  `${kind}:${anchorId ?? "cell"}:${x}:${y}`;

const cloneCell = (cell: MirekCell): MirekCell => ({ ...cell });

const withCell = (cells: Map<string, MirekCell>, cell: MirekCell): void => {
  const key = keyFor(cell.x, cell.y);
  const existing = cells.get(key);
  if (!existing || cell.opacity >= existing.opacity || existing.kind === "afterglow") {
    cells.set(key, cell);
  }
};

const lineCells = (
  from: { x: number; y: number },
  to: { x: number; y: number },
): Array<{ x: number; y: number }> => {
  const points: Array<{ x: number; y: number }> = [];
  const dx = Math.abs(to.x - from.x);
  const dy = -Math.abs(to.y - from.y);
  const sx = from.x < to.x ? 1 : -1;
  const sy = from.y < to.y ? 1 : -1;
  let error = dx + dy;
  let x = from.x;
  let y = from.y;
  for (;;) {
    points.push({ x, y });
    if (x === to.x && y === to.y) break;
    const e2 = 2 * error;
    if (e2 >= dy) {
      error += dy;
      x += sx;
    }
    if (e2 <= dx) {
      error += dx;
      y += sy;
    }
  }
  return points;
};

const buildInitialCells = (args: {
  anchors: MirekReasoningAnchor[];
  edges: MirekReasoningEdge[];
  previousArtifact: MirekReasoningArtifactV1 | null;
  carryoverRatio: number;
  width: number;
  height: number;
  seed: number;
  proofConfirmed: boolean;
  integrityOk: boolean;
}): Map<string, MirekCell> => {
  const cells = new Map<string, MirekCell>();
  if (args.previousArtifact && args.carryoverRatio > 0.05) {
    for (const prior of args.previousArtifact.grid.cells) {
      if (prior.x < 0 || prior.x >= args.width || prior.y < 0 || prior.y >= args.height) continue;
      const retainedKind =
        prior.kind === "evidence" || prior.kind === "proof" || prior.kind === "conflict"
          ? "afterglow"
          : prior.kind;
      withCell(cells, {
        ...prior,
        id: cellId(prior.x, prior.y, retainedKind, prior.anchorId),
        kind: retainedKind,
        age: prior.age + 1,
        opacity: clamp01(prior.opacity * args.carryoverRatio),
        exact: retainedKind === "afterglow" ? false : prior.exact,
      });
    }
  }

  const positions = new Map<string, { x: number; y: number }>();
  for (const anchor of args.anchors) {
    if (anchor.role === "evidence" && !anchor.exact) continue;
    if (anchor.role === "proof" && !(args.proofConfirmed && args.integrityOk)) continue;
    const pos = anchorPosition(anchor, args.width, args.height, args.seed);
    positions.set(anchor.id, pos);
    const kind = cellKindForAnchor(anchor);
    withCell(cells, {
      id: cellId(pos.x, pos.y, kind, anchor.id),
      x: pos.x,
      y: pos.y,
      kind,
      age: 0,
      opacity: clamp(0.45 + anchor.weight * 0.55, 0.15, 1),
      anchorId: anchor.id,
      exact: anchor.exact,
    });
  }

  for (const edge of args.edges) {
    if (!edge.exact && (edge.relation === "supports" || edge.relation === "verifies")) continue;
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (!from || !to) continue;
    const kind: MirekCellKind = edge.relation === "contradicts" ? "conflict" : "support";
    for (const point of lineCells(from, to).slice(1, -1)) {
      withCell(cells, {
        id: cellId(point.x, point.y, kind, `${edge.from}:${edge.to}`),
        x: point.x,
        y: point.y,
        kind,
        age: 0,
        opacity: clamp(0.18 + edge.weight * 0.5, 0.1, 0.82),
        anchorId: `${edge.from}:${edge.to}`,
        exact: edge.exact,
      });
    }
  }

  return cells;
};

const neighborCells = (
  cells: Map<string, MirekCell>,
  x: number,
  y: number,
): MirekCell[] => {
  const result: MirekCell[] = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const cell = cells.get(keyFor(x + dx, y + dy));
      if (cell) result.push(cell);
    }
  }
  return result;
};

const countKind = (cells: MirekCell[], kind: MirekCellKind): number =>
  cells.filter((cell) => cell.kind === kind).length;

const shouldKeepCell = (args: {
  cell: MirekCell;
  neighbors: MirekCell[];
  facts: {
    archetype: MirekReasoningArchetype;
    proofConfirmed: boolean;
    integrityOk: boolean;
    failClosed: boolean;
    suppressionActive: boolean;
    momentum: number;
  };
  exactEvidenceAnchorIds: Set<string>;
  exactProofAnchorIds: Set<string>;
}): MirekCell | null => {
  const { cell, neighbors, facts } = args;
  const supportCount = countKind(neighbors, "support");
  const gapCount = countKind(neighbors, "gap");
  const sameKindCount = countKind(neighbors, cell.kind);
  const decay =
    facts.failClosed && cell.kind !== "blocked"
      ? 0.34
      : cell.kind === "afterglow"
        ? 0.22
        : facts.momentum >= 0.55
          ? 0.08
          : 0.14;

  if (cell.kind === "proof") {
    if (!(facts.proofConfirmed && facts.integrityOk && cell.anchorId && args.exactProofAnchorIds.has(cell.anchorId))) {
      return null;
    }
    return { ...cell, age: cell.age + 1, opacity: clamp01(cell.opacity * 0.96 + 0.04) };
  }
  if (cell.kind === "evidence") {
    if (!(cell.anchorId && args.exactEvidenceAnchorIds.has(cell.anchorId))) return null;
    return { ...cell, age: cell.age + 1, opacity: clamp01(cell.opacity * 0.94 + 0.03) };
  }
  if (cell.kind === "blocked") {
    const opacity = facts.failClosed || facts.suppressionActive ? clamp01(cell.opacity * 0.98 + 0.04) : cell.opacity - 0.1;
    return opacity > 0.08 ? { ...cell, age: cell.age + 1, opacity } : null;
  }
  if (cell.kind === "gap") {
    const activeGap = facts.archetype === "missing_evidence" || facts.archetype === "coverage_gap" || gapCount >= 2;
    const opacity = activeGap ? clamp01(cell.opacity * 0.94 + 0.02) : cell.opacity - decay;
    return opacity > 0.08 ? { ...cell, age: cell.age + 1, opacity } : null;
  }
  if (cell.kind === "support") {
    const supportAllowed = cell.exact && supportCount + facts.momentum * 3 >= 1.35;
    const opacity = supportAllowed ? clamp01(cell.opacity * 0.92 + 0.04) : cell.opacity - decay;
    return opacity > 0.08 ? { ...cell, age: cell.age + 1, opacity } : null;
  }
  if (cell.kind === "conflict") {
    const activeConflict = facts.archetype === "contradiction" || sameKindCount >= 1;
    const opacity = activeConflict ? clamp01(cell.opacity * 0.95 + 0.02) : cell.opacity - decay;
    return opacity > 0.08 ? { ...cell, age: cell.age + 1, opacity } : null;
  }
  const opacity = cell.opacity - decay;
  return opacity > 0.08
    ? { ...cell, age: cell.age + 1, opacity, kind: opacity < 0.18 ? "afterglow" : cell.kind }
    : null;
};

const evolveCells = (args: {
  cells: Map<string, MirekCell>;
  width: number;
  height: number;
  ticks: number;
  facts: {
    archetype: MirekReasoningArchetype;
    proofConfirmed: boolean;
    integrityOk: boolean;
    failClosed: boolean;
    suppressionActive: boolean;
    momentum: number;
  };
  exactEvidenceAnchorIds: Set<string>;
  exactProofAnchorIds: Set<string>;
}): Map<string, MirekCell> => {
  let current = args.cells;
  for (let tick = 0; tick < args.ticks; tick += 1) {
    const next = new Map<string, MirekCell>();
    const candidates = new Set<string>();
    for (const cell of current.values()) {
      candidates.add(keyFor(cell.x, cell.y));
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const x = cell.x + dx;
          const y = cell.y + dy;
          if (x >= 0 && x < args.width && y >= 0 && y < args.height) {
            candidates.add(keyFor(x, y));
          }
        }
      }
    }
    for (const key of candidates) {
      const [xRaw, yRaw] = key.split(":");
      const x = Number(xRaw);
      const y = Number(yRaw);
      const existing = current.get(key);
      const neighbors = neighborCells(current, x, y);
      if (existing) {
        const kept = shouldKeepCell({
          cell: existing,
          neighbors,
          facts: args.facts,
          exactEvidenceAnchorIds: args.exactEvidenceAnchorIds,
          exactProofAnchorIds: args.exactProofAnchorIds,
        });
        if (kept) withCell(next, kept);
        continue;
      }
      const supportCount = countKind(neighbors, "support") + countKind(neighbors, "evidence");
      const gapCount = countKind(neighbors, "gap");
      const blockedCount = countKind(neighbors, "blocked");
      if ((args.facts.failClosed || args.facts.suppressionActive) && blockedCount >= 2) {
        withCell(next, {
          id: cellId(x, y, "blocked"),
          x,
          y,
          kind: "blocked",
          age: 0,
          opacity: 0.32,
          exact: false,
        });
      } else if (
        (args.facts.archetype === "missing_evidence" || args.facts.archetype === "coverage_gap") &&
        gapCount >= 2
      ) {
        withCell(next, {
          id: cellId(x, y, "gap"),
          x,
          y,
          kind: "gap",
          age: 0,
          opacity: 0.26,
          exact: false,
        });
      } else if (supportCount >= 3 && args.facts.momentum >= 0.35) {
        withCell(next, {
          id: cellId(x, y, "support"),
          x,
          y,
          kind: "support",
          age: 0,
          opacity: clamp01(0.18 + args.facts.momentum * 0.24),
          exact: false,
        });
      }
    }
    current = next;
  }
  return current;
};

const objectiveSimilarity = (current?: string | null, previous?: string | null): number => {
  if (!current || !previous) return 0;
  if (current === previous) return 1;
  const currentParts = new Set(current.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  const previousParts = new Set(previous.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  if (!currentParts.size || !previousParts.size) return 0;
  let shared = 0;
  for (const part of currentParts) {
    if (previousParts.has(part)) shared += 1;
  }
  return shared / Math.max(currentParts.size, previousParts.size);
};

const buildContinuity = (args: BuildMirekReasoningArtifactInput): {
  startedFrom: MirekReasoningArtifactV1["continuity"]["startedFrom"];
  previousFrameHash: string | null;
  carryoverRatio: number;
} => {
  if (!args.previousArtifact) {
    return { startedFrom: "empty", previousFrameHash: null, carryoverRatio: 0 };
  }
  const similarity = objectiveSimilarity(args.objectiveFingerprint, args.previousObjectiveFingerprint);
  const carryoverRatio = clamp01(
    0.55 * similarity +
      0.25 * clamp01(args.sharedExactPathRatio ?? 0) +
      0.2 * clamp01(args.capsuleContinuityScore ?? 0),
  );
  return {
    startedFrom: carryoverRatio >= 0.5 ? "previous_turn" : "context_capsule",
    previousFrameHash: args.previousArtifact.finalFrameHash,
    carryoverRatio,
  };
};

const uniqueById = <T extends { id: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
};

export const buildMirekReasoningArtifact = (
  input: BuildMirekReasoningArtifactInput,
): MirekReasoningArtifactV1 => {
  const state = input.canonicalState
    ? stateFromCanonical(input.canonicalState)
    : input.fallbackState ?? fallbackEmptyState();
  const width = clamp(Math.round(input.width ?? 48), 12, 120);
  const height = clamp(Math.round(input.height ?? 10), 4, 40);
  const ticks = clamp(Math.round(input.ticks ?? 6), 0, 64);
  const provenanceMode: MirekReasoningProvenanceMode = input.canonicalState
    ? "strict_exact"
    : input.fallbackState
      ? "derived"
      : "sparse_fallback";
  const canonicalStateHash = input.canonicalState
    ? hashMirekReasoningValue(input.canonicalState)
    : hashMirekReasoningValue(input.fallbackState ?? null);
  const traceEventsHash = hashMirekReasoningValue(input.traceEvents ?? []);

  const baseAnchors: MirekAnchorInput[] = [
    {
      id: `objective:${state.traceId}`,
      role: "objective",
      weight: 1,
      exact: Boolean(input.canonicalState),
    },
  ];
  if (state.archetype === "missing_evidence" || state.archetype === "coverage_gap") {
    baseAnchors.push({
      id: `gap:${state.traceId}:${state.archetype}`,
      role: "gap",
      weight: Math.max(0.3, state.ambiguityPressure),
      exact: Boolean(input.canonicalState),
    });
  }
  if (state.archetype === "contradiction") {
    baseAnchors.push({
      id: `conflict:${state.traceId}`,
      role: "conflict",
      weight: Math.max(0.35, state.ambiguityPressure),
      exact: Boolean(input.canonicalState),
    });
  }
  if (state.stance === "fail_closed" || state.suppressionReason) {
    baseAnchors.push({
      id: `blocked:${state.traceId}:${state.suppressionReason ?? state.stance}`,
      role: "blocked",
      weight: 1,
      exact: Boolean(input.canonicalState),
    });
  }
  if (state.proofVerdict === "PASS" && state.certificateIntegrityOk === true) {
    baseAnchors.push({
      id: `proof:${state.traceId}`,
      role: "proof",
      weight: 1,
      exact: Boolean(input.canonicalState),
    });
  }

  const anchors = uniqueById(
    [...baseAnchors, ...(input.anchors ?? [])]
      .map(normalizeAnchor)
      .filter((anchor): anchor is MirekReasoningAnchor => Boolean(anchor)),
  );
  const edges = (input.edges ?? [])
    .map(normalizeEdge)
    .filter((edge): edge is MirekReasoningEdge => Boolean(edge));
  const graphSelectionHash = anchors.length > 1 || edges.length > 0
    ? hashMirekReasoningValue({ anchors, edges })
    : null;
  const continuity = buildContinuity(input);

  const exactEvidenceAnchorIds = new Set(
    anchors.filter((anchor) => anchor.role === "evidence" && anchor.exact).map((anchor) => anchor.id),
  );
  const exactProofAnchorIds = new Set(
    anchors.filter((anchor) => anchor.role === "proof" && anchor.exact).map((anchor) => anchor.id),
  );
  const proofConfirmed = state.proofVerdict === "PASS";
  const integrityOk = state.certificateIntegrityOk === true;
  const failClosed =
    state.stance === "fail_closed" ||
    state.proofVerdict === "FAIL" ||
    state.certificateIntegrityOk === false ||
    state.suppressionReason === "missing_evidence" ||
    state.suppressionReason === "contract_violation";
  const initialCells = buildInitialCells({
    anchors,
    edges,
    previousArtifact: input.previousArtifact ?? null,
    carryoverRatio: continuity.carryoverRatio,
    width,
    height,
    seed: state.seed,
    proofConfirmed,
    integrityOk,
  });
  const finalCells = Array.from(
    evolveCells({
      cells: initialCells,
      width,
      height,
      ticks,
      facts: {
        archetype: state.archetype,
        proofConfirmed,
        integrityOk,
        failClosed,
        suppressionActive: Boolean(state.suppressionReason),
        momentum: state.momentum,
      },
      exactEvidenceAnchorIds,
      exactProofAnchorIds,
    }).values(),
  ).sort((a, b) => a.y - b.y || a.x - b.x || a.kind.localeCompare(b.kind));

  const finalFrameHash = hashMirekReasoningValue({
    width,
    height,
    tick: ticks,
    seed: state.seed,
    cells: finalCells,
    source: {
      canonicalStateHash,
      traceEventsHash,
      graphSelectionHash,
      provenanceMode,
    },
  });
  return {
    version: "helix.mirek_reasoning_artifact.v1",
    artifactId: `mirek:${state.traceId}:${finalFrameHash}`,
    traceId: state.traceId,
    ...(input.turnId ? { turnId: input.turnId } : {}),
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    previousArtifactId: input.previousArtifact?.artifactId ?? null,
    source: {
      canonicalStateHash,
      traceEventsHash,
      graphSelectionHash,
      provenanceMode,
    },
    state: {
      phase: state.phase,
      stance: state.stance,
      archetype: state.archetype,
      certaintyClass: state.certaintyClass,
      suppressionReason: state.suppressionReason,
      momentum: state.momentum,
      ambiguityPressure: state.ambiguityPressure,
      battleIndex: state.battleIndex,
    },
    anchors,
    edges,
    grid: {
      width,
      height,
      tick: ticks,
      seed: state.seed,
      cells: finalCells,
    },
    continuity,
    finalFrameHash,
  };
};
