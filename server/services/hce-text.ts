const DEFAULT_DIM = 128;

const NGRAM_RANGE = [3, 4, 5] as const;
const HASH_SEEDS = [0x9e3779b1, 0x85ebca77, 0xc2b2ae3d];

const ensureDim = (dim?: number) => (dim && dim > 0 ? dim : DEFAULT_DIM);

const norm = (vec: Float64Array) => {
  let sum = 0;
  for (let i = 0; i < vec.length; i += 1) {
    sum += vec[i] * vec[i];
  }
  return Math.sqrt(sum);
};

const normalize = (vec: Float64Array) => {
  const n = norm(vec);
  if (n === 0) return vec;
  for (let i = 0; i < vec.length; i += 1) {
    vec[i] /= n;
  }
  return vec;
};

const rotate32 = (value: number, shift: number) =>
  (value << shift) | (value >>> (32 - shift));

const hashNgram = (ngram: string, seed: number) => {
  let hash = seed | 0;
  for (let i = 0; i < ngram.length; i += 1) {
    hash = Math.imul(hash ^ ngram.charCodeAt(i), 0x27d4eb2d);
    hash = rotate32(hash, 13);
  }
  return hash | 0;
};

const sanitize = (input: string) =>
  input
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export function hashEmbed(text: string, dim?: number): Float64Array {
  const size = ensureDim(dim);
  const vector = new Float64Array(size);
  const cleaned = sanitize(text);
  if (!cleaned) return vector;

  for (let s = 0; s < NGRAM_RANGE.length; s += 1) {
    const n = NGRAM_RANGE[s];
    const seed = HASH_SEEDS[s % HASH_SEEDS.length];
    for (let i = 0; i <= cleaned.length - n; i += 1) {
      const ngram = cleaned.slice(i, i + n);
      const hash = hashNgram(ngram, seed);
      const index = Math.abs(hash) % size;
      const sign = (hash & 1) === 0 ? 1 : -1;
      vector[index] += sign;
    }
  }

  return normalize(vector);
}

export function applyLanguageBias(
  baseEnergies: number[],
  psi: Float64Array,
  centers: Float64Array[],
  embedding: Float64Array,
  beta: number,
): number[] {
  if (baseEnergies.length === 0) return baseEnergies;
  const adjusted: number[] = [];
  const psiNorm = norm(psi) || 1;
  const embedNorm = norm(embedding) || 1;
  const psiAligned = dot(psi, embedding) / (psiNorm * embedNorm);

  for (let i = 0; i < baseEnergies.length; i += 1) {
    const center = centers[i];
    const centerNorm = norm(center) || 1;
    const align = clamp(
      dot(center, embedding) / (centerNorm * embedNorm),
      -1,
      1,
    );
    const distance = 1 - align;
    const psiGap = 1 - clamp(psiAligned, -1, 1);
    adjusted.push(baseEnergies[i] + beta * (0.7 * distance + 0.3 * psiGap));
  }
  return adjusted;
}

export function describeBranchChoice(
  branch: number,
  energies: number[],
  centers: Float64Array[],
  embedding: Float64Array,
  prompt: string,
): string {
  const safeBranch = branch >= 0 && branch < centers.length ? branch : 0;
  const center = centers[safeBranch];
  const alignment = dot(center, embedding) / ((norm(center) || 1) * (norm(embedding) || 1));
  const energy = energies[safeBranch] ?? 0;
  const tone =
    alignment > 0.6
      ? "resonates strongly"
      : alignment > 0.2
        ? "leans toward"
        : "barely coheres with";
  const detail = [
    `Branch #${safeBranch} ${tone} the prompt.`,
    `Relative energy ${energy.toFixed(3)}.`,
    alignment
      ? `Projection alignment ${alignment.toFixed(3)}.`
      : "Projection alignment unavailable.",
  ];
  if (prompt.length > 80) {
    detail.push(`Excerpt: "${prompt.slice(0, 80)}…"`);
  } else if (prompt) {
    detail.push(`Prompt: "${prompt}"`);
  }
  return detail.join(" ");
}

function dot(a: Float64Array, b: Float64Array) {
  const len = Math.min(a.length, b.length);
  let acc = 0;
  for (let i = 0; i < len; i += 1) {
    acc += a[i] * b[i];
  }
  return acc;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

