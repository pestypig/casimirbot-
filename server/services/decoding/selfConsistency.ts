import { chatStream, type ChatMsg } from "../luma";

type Candidate = {
  seed: number;
  raw: string;
  final: string;
};

export type SelfConsistencyOptions = {
  messages: ChatMsg[];
  runs?: number;
  temperature?: number;
  seeds?: number[];
  normalize?: (final: string) => string;
};

export type SelfConsistencyResult = {
  final: string;
  answer: string;
  candidates: Candidate[];
};

const DEFAULT_NORMALIZER = (value: string) => value.replace(/\s+/g, "").toLowerCase();

async function collectResponse(config: {
  messages: ChatMsg[];
  temperature?: number;
  seed: number;
}): Promise<string> {
  let buffer = "";
  for await (const delta of chatStream({
    messages: config.messages,
    temperature: config.temperature,
    seed: config.seed,
  })) {
    buffer += delta;
  }
  return buffer;
}

function extractFinalAnswer(text: string) {
  const match = text.match(/FINAL\s*ANSWER\s*:\s*(.+)/i);
  return match ? match[1].trim() : "";
}

export async function answerWithSelfConsistency(
  options: SelfConsistencyOptions,
): Promise<SelfConsistencyResult> {
  const { messages, temperature = 0.7, runs = 5, seeds, normalize = DEFAULT_NORMALIZER } = options;
  const candidates: Candidate[] = [];
  const seedPool =
    (Array.isArray(seeds) && seeds.length > 0 && seeds) || Array.from({ length: runs }, (_, i) => i);

  for (let i = 0; i < runs; i += 1) {
    const seed = seedPool[i % seedPool.length];
    const raw = await collectResponse({ messages, temperature, seed });
    const final = extractFinalAnswer(raw);
    candidates.push({ seed, raw, final });
  }

  const tally = new Map<string, Candidate>();
  const votes = new Map<string, number>();
  for (const candidate of candidates) {
    const key = normalize(candidate.final);
    if (!key) continue;
    tally.set(key, candidate);
    votes.set(key, (votes.get(key) || 0) + 1);
  }

  let winner: Candidate | undefined;
  if (votes.size > 0) {
    const bestKey = [...votes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    if (bestKey) {
      winner = tally.get(bestKey);
    }
  }

  const fallback = candidates.find((candidate) => candidate.final);
  const finalCandidate = winner ?? fallback ?? candidates[0];

  return {
    final: finalCandidate?.final ?? "",
    answer: finalCandidate?.raw ?? "",
    candidates,
  };
}
