import type {
  AdapterPremeditationCandidate,
  AdapterPremeditationInput,
  AdapterPremeditationResult,
  AdapterPremeditationScoredCandidate,
} from "../../shared/schema.js";

type IdeologyHardFailId =
  | "IDEOLOGY_MISSING_LEGAL_KEY"
  | "IDEOLOGY_MISSING_ETHOS_KEY"
  | "IDEOLOGY_JURISDICTIONAL_FLOOR_VIOLATION";

type IdeologyGateDecision = {
  coveredAction: boolean;
  legalKey: boolean;
  ethosKey: boolean;
  jurisdictionFloorOk: boolean;
  firstFail: IdeologyHardFailId | null;
};

const clamp01 = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
};

const safeNumber = (value: number | undefined, fallback: number): number =>
  Number.isFinite(value) ? (value as number) : fallback;

const parseTagSet = (candidate: AdapterPremeditationCandidate): Set<string> =>
  new Set((candidate.tags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean));

const hasAnyTag = (tags: Set<string>, options: string[]): boolean =>
  options.some((option) => tags.has(option));

const evaluateIdeologyGate = (candidate: AdapterPremeditationCandidate): IdeologyGateDecision => {
  const tags = parseTagSet(candidate);
  const coveredAction = hasAnyTag(tags, [
    "covered-action",
    "covered_action",
    "ideology-gate-covered",
    "requires-dual-key",
    "requires_dual_key",
  ]);
  const legalKey = hasAnyTag(tags, ["legal-key", "legal_key", "legal-ok", "legal_ok"]);
  const ethosKey = hasAnyTag(tags, ["ethos-key", "ethos_key", "ethos-ok", "ethos_ok"]);
  const jurisdictionFloorOk = hasAnyTag(tags, [
    "jurisdiction-floor-ok",
    "jurisdiction_floor_ok",
    "jurisdictional-floor-ok",
    "jurisdictional_floor_ok",
  ]);

  if (!coveredAction) {
    return {
      coveredAction,
      legalKey,
      ethosKey,
      jurisdictionFloorOk,
      firstFail: null,
    };
  }

  if (!legalKey) {
    return { coveredAction, legalKey, ethosKey, jurisdictionFloorOk, firstFail: "IDEOLOGY_MISSING_LEGAL_KEY" };
  }
  if (!ethosKey) {
    return { coveredAction, legalKey, ethosKey, jurisdictionFloorOk, firstFail: "IDEOLOGY_MISSING_ETHOS_KEY" };
  }
  if (!jurisdictionFloorOk) {
    return {
      coveredAction,
      legalKey,
      ethosKey,
      jurisdictionFloorOk,
      firstFail: "IDEOLOGY_JURISDICTIONAL_FLOOR_VIOLATION",
    };
  }

  return { coveredAction, legalKey, ethosKey, jurisdictionFloorOk, firstFail: null };
};

const scoreCandidate = (
  candidate: AdapterPremeditationCandidate,
  input: Required<Pick<AdapterPremeditationInput, "lambda" | "mu" | "ideologyWeight" | "coherenceWeight">>,
): AdapterPremeditationScoredCandidate => {
  const ideologyGate = evaluateIdeologyGate(candidate);
  const valueLongevity = safeNumber(candidate.valueLongevity, 0);
  const risk = Math.max(0, safeNumber(candidate.risk, 0));
  const entropy = Math.max(0, safeNumber(candidate.entropy, 0));
  const ideologyAlignment = clamp01(safeNumber(candidate.ideologyAlignment, 0.5));
  const coherenceAlignment = clamp01(safeNumber(candidate.coherenceAlignment, 0.5));

  const baseScore = valueLongevity - input.lambda * risk - input.mu * entropy;
  const ideologyBonus = input.ideologyWeight * ideologyAlignment;
  const coherenceBonus = input.coherenceWeight * coherenceAlignment;
  const score = ideologyGate.firstFail ? Number.NEGATIVE_INFINITY : baseScore + ideologyBonus + coherenceBonus;

  const rationaleTags = [
    `base:${baseScore.toFixed(4)}`,
    `risk:${risk.toFixed(4)}`,
    `entropy:${entropy.toFixed(4)}`,
    `ideology:${ideologyAlignment.toFixed(4)}`,
    `coherence:${coherenceAlignment.toFixed(4)}`,
    `ideology_gate.covered_action:${ideologyGate.coveredAction ? 1 : 0}`,
    `ideology_gate.legal_key:${ideologyGate.legalKey ? 1 : 0}`,
    `ideology_gate.ethos_key:${ideologyGate.ethosKey ? 1 : 0}`,
    `ideology_gate.jurisdiction_floor_ok:${ideologyGate.jurisdictionFloorOk ? 1 : 0}`,
  ];

  if (ideologyGate.firstFail) {
    rationaleTags.push(`ideology_gate.firstFail:${ideologyGate.firstFail}`);
    rationaleTags.push("ideology_gate.severity:HARD");
  }

  return {
    id: candidate.id,
    score,
    optimism: score,
    entropy,
    rationaleTags,
  };
};

export const scorePremeditation = (
  input: AdapterPremeditationInput,
): AdapterPremeditationResult => {
  const lambda = Math.max(0, safeNumber(input.lambda, 1));
  const mu = Math.max(0, safeNumber(input.mu, 1));
  const ideologyWeight = Math.max(0, safeNumber(input.ideologyWeight, 0));
  const coherenceWeight = Math.max(0, safeNumber(input.coherenceWeight, 0));

  const scored = input.candidates
    .map((candidate) =>
      scoreCandidate(candidate, {
        lambda,
        mu,
        ideologyWeight,
        coherenceWeight,
      }),
    )
    .sort((a, b) => (b.score - a.score) || a.id.localeCompare(b.id));

  const chosen = scored.find((entry) => Number.isFinite(entry.score));
  const traceCandidate = chosen ?? scored[0];

  return {
    chosenCandidateId: chosen?.id,
    optimism: chosen?.optimism ?? 0,
    entropy: chosen?.entropy ?? traceCandidate?.entropy ?? 0,
    rationaleTags: traceCandidate?.rationaleTags ?? [],
    scores: scored.map((entry) => ({
      ...entry,
      score: Number.isFinite(entry.score) ? entry.score : -1e9,
      optimism: Number.isFinite(entry.optimism) ? entry.optimism : -1e9,
    })),
  };
};
