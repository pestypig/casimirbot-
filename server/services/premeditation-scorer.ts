import type {
  AdapterPremeditationCandidate,
  AdapterPremeditationInput,
  AdapterPremeditationResult,
  AdapterPremeditationScoredCandidate,
} from "../../shared/schema.js";

const clamp01 = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
};

const safeNumber = (value: number | undefined, fallback: number): number =>
  Number.isFinite(value) ? (value as number) : fallback;

const scoreCandidate = (
  candidate: AdapterPremeditationCandidate,
  input: Required<Pick<AdapterPremeditationInput, "lambda" | "mu" | "ideologyWeight" | "coherenceWeight">>,
): AdapterPremeditationScoredCandidate => {
  const valueLongevity = safeNumber(candidate.valueLongevity, 0);
  const risk = Math.max(0, safeNumber(candidate.risk, 0));
  const entropy = Math.max(0, safeNumber(candidate.entropy, 0));
  const ideologyAlignment = clamp01(safeNumber(candidate.ideologyAlignment, 0.5));
  const coherenceAlignment = clamp01(safeNumber(candidate.coherenceAlignment, 0.5));

  const baseScore = valueLongevity - input.lambda * risk - input.mu * entropy;
  const ideologyBonus = input.ideologyWeight * ideologyAlignment;
  const coherenceBonus = input.coherenceWeight * coherenceAlignment;
  const score = baseScore + ideologyBonus + coherenceBonus;

  const rationaleTags = [
    `base:${baseScore.toFixed(4)}`,
    `risk:${risk.toFixed(4)}`,
    `entropy:${entropy.toFixed(4)}`,
    `ideology:${ideologyAlignment.toFixed(4)}`,
    `coherence:${coherenceAlignment.toFixed(4)}`,
  ];

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

  const chosen = scored[0];

  return {
    chosenCandidateId: chosen?.id,
    optimism: chosen?.optimism ?? 0,
    entropy: chosen?.entropy ?? 0,
    rationaleTags: chosen?.rationaleTags ?? [],
    scores: scored,
  };
};
