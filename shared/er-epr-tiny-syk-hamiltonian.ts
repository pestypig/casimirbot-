import { createHash } from "node:crypto";
import {
  type ComplexMatrix,
  addMatrices,
  buildMajoranaOperators,
  cloneMatrix,
  commutatorNorm,
  complex,
  identity,
  isHermitian,
  multiplyMatrices,
  scaleMatrix,
  zeroMatrix,
} from "./er-epr-majorana-operators";

export type TinySykCouplingSign = "correct" | "wrong" | "none";

export type TinySykHamiltonianInput = {
  nMajoranasPerSide: 4 | 6 | 8;
  qBodyOrder: 4;
  seed: number;
  mu: number;
  couplingSign: TinySykCouplingSign;
};

export type TinySykHamiltonianBuild = {
  left: ComplexMatrix;
  right: ComplexMatrix;
  uncoupled: ComplexMatrix;
  interaction: ComplexMatrix;
  total: ComplexMatrix;
  majoranas: ComplexMatrix[];
  dimension: number;
  hamiltonianHash: string;
  couplingSeed: number;
  couplingDistribution: "seeded_gaussian_box_muller";
  normalization: "gamma_majoranas_with_chi_equals_gamma_over_sqrt2";
  nonCommutativityIndex: number;
  hermitian: boolean;
};

export function buildTinySykHamiltonian(input: TinySykHamiltonianInput): TinySykHamiltonianBuild {
  validateTinySykHamiltonianInput(input);
  const totalMajoranas = input.nMajoranasPerSide * 2;
  const majoranas = buildMajoranaOperators(totalMajoranas);
  const dim = majoranas[0].length;
  const left = buildSideHamiltonian(majoranas, 0, input.nMajoranasPerSide, input.seed);
  const right = buildSideHamiltonian(majoranas, input.nMajoranasPerSide, input.nMajoranasPerSide, input.seed + 7919);
  const uncoupled = addMatrices(left, right);
  const interaction = buildInteractionHamiltonian(majoranas, input.nMajoranasPerSide, input.mu, input.couplingSign);
  const total = addMatrices(uncoupled, interaction);
  const hamiltonianHash = hashMatrixPayload({
    input,
    left: matrixSignature(left),
    right: matrixSignature(right),
    interaction: matrixSignature(interaction),
    total: matrixSignature(total),
  });
  return {
    left,
    right,
    uncoupled,
    interaction,
    total,
    majoranas,
    dimension: dim,
    hamiltonianHash,
    couplingSeed: input.seed,
    couplingDistribution: "seeded_gaussian_box_muller",
    normalization: "gamma_majoranas_with_chi_equals_gamma_over_sqrt2",
    nonCommutativityIndex: round(commutatorNorm(uncoupled, majoranas[0]) / Math.max(1, Math.sqrt(dim))),
    hermitian: isHermitian(total, 1e-8),
  };
}

export function validateTinySykHamiltonianInput(input: TinySykHamiltonianInput): void {
  if (![4, 6, 8].includes(input.nMajoranasPerSide)) {
    throw new Error("ER_EPR_TINY_SYK_EXACT_DIAG_V1 allows nMajoranasPerSide of 4, 6, or 8");
  }
  if (input.qBodyOrder !== 4) {
    throw new Error("ER_EPR_TINY_SYK_EXACT_DIAG_V1 only supports qBodyOrder=4");
  }
  if (!Number.isInteger(input.seed)) {
    throw new Error("Tiny SYK Hamiltonian requires an integer seed");
  }
}

export function hashObject(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function buildSideHamiltonian(
  majoranas: ComplexMatrix[],
  offset: number,
  count: number,
  seed: number,
): ComplexMatrix {
  const dim = majoranas[0].length;
  let hamiltonian = zeroMatrix(dim);
  const rng = seededRng(seed);
  const sigmaJ = Math.sqrt(6 / Math.max(1, count ** 3));
  for (let i = 0; i < count - 3; i += 1) {
    for (let j = i + 1; j < count - 2; j += 1) {
      for (let k = j + 1; k < count - 1; k += 1) {
        for (let l = k + 1; l < count; l += 1) {
          const coupling = gaussian(rng) * sigmaJ;
          const product = multiplyMatrices(
            multiplyMatrices(majoranas[offset + i], majoranas[offset + j]),
            multiplyMatrices(majoranas[offset + k], majoranas[offset + l]),
          );
          hamiltonian = addMatrices(hamiltonian, scaleMatrix(product, -coupling / 4));
        }
      }
    }
  }
  return hamiltonian;
}

function buildInteractionHamiltonian(
  majoranas: ComplexMatrix[],
  nMajoranasPerSide: number,
  mu: number,
  sign: TinySykCouplingSign,
): ComplexMatrix {
  const dim = majoranas[0].length;
  if (sign === "none" || mu === 0) return zeroMatrix(dim);
  const signedMu = sign === "correct" ? Math.abs(mu) : -Math.abs(mu);
  let interaction = zeroMatrix(dim);
  for (let index = 0; index < nMajoranasPerSide; index += 1) {
    const product = multiplyMatrices(majoranas[index], majoranas[nMajoranasPerSide + index]);
    interaction = addMatrices(interaction, scaleMatrix(product, { re: 0, im: signedMu / 2 }));
  }
  return interaction;
}

function seededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function gaussian(rng: () => number): number {
  const u1 = Math.max(rng(), 1e-12);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function matrixSignature(matrix: ComplexMatrix): Array<[number, number]> {
  return matrix.flat().map((value) => [round(value.re), round(value.im)]);
}

function hashMatrixPayload(value: unknown): string {
  return hashObject(value);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function round(value: number): number {
  return Number(value.toFixed(12));
}

export function buildComputationalBasisState(dim: number, index: number): ReturnType<typeof identity>[number] {
  if (index < 0 || index >= dim) throw new Error("basis index out of range");
  return identity(dim)[index].map((value) => ({ ...value }));
}

export function cloneHamiltonian(matrix: ComplexMatrix): ComplexMatrix {
  return cloneMatrix(matrix);
}

export { complex };
