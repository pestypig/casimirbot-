import {
  type Complex,
  type ComplexMatrix,
  addMatrices,
  complex,
  identity,
  innerProduct,
  multiplyMatrices,
  multiplyMatrixVector,
  normalizeVector,
  scaleMatrix,
  vectorNorm,
  zeroMatrix,
} from "./er-epr-majorana-operators";

export type TinySykNumericalMethod = "matrix_exponential_taylor";

export type TinySykEvolutionResult = {
  finalState: Complex[];
  unitaryApproximation: ComplexMatrix;
  numericalMethod: TinySykNumericalMethod;
  numericalTolerance: number;
  normError: number;
};

export function evolveStateTaylor(
  state: Complex[],
  hamiltonian: ComplexMatrix,
  dt: number,
  terms = 28,
): TinySykEvolutionResult {
  const generator = scaleMatrix(hamiltonian, { re: 0, im: -dt });
  const unitaryApproximation = matrixExponentialTaylor(generator, terms);
  const evolved = multiplyMatrixVector(unitaryApproximation, state);
  const normError = Math.abs(vectorNorm(evolved) - 1);
  return {
    finalState: normalizeVector(evolved),
    unitaryApproximation,
    numericalMethod: "matrix_exponential_taylor",
    numericalTolerance: 1e-8,
    normError,
  };
}

export function matrixExponentialTaylor(matrix: ComplexMatrix, terms = 28): ComplexMatrix {
  const dim = matrix.length;
  let result = identity(dim);
  let term = identity(dim);
  for (let order = 1; order <= terms; order += 1) {
    term = scaleMatrix(multiplyMatrices(term, matrix), 1 / order);
    result = addMatrices(result, term);
  }
  return result;
}

export function makeEntangledPairState(dim: number): Complex[] {
  const sideDim = Math.sqrt(dim);
  if (!Number.isInteger(sideDim)) {
    throw new Error("Entangled pair state requires square two-sided Hilbert dimension");
  }
  const state = Array.from({ length: dim }, () => complex.zero);
  for (let index = 0; index < sideDim; index += 1) {
    state[index * sideDim + index] = { re: 1, im: 0 };
  }
  return normalizeVector(state);
}

export function makeDisentangledState(dim: number): Complex[] {
  return Array.from({ length: dim }, (_, index) => (index === 0 ? complex.one : complex.zero));
}

export function makeSeededRandomState(dim: number, seed: number): Complex[] {
  const rng = seededRng(seed);
  return normalizeVector(Array.from({ length: dim }, () => ({ re: rng() - 0.5, im: rng() - 0.5 })));
}

export function fidelity(left: Complex[], right: Complex[]): number {
  return Math.max(0, Math.min(1, complex.abs2(innerProduct(left, right))));
}

export function vectorExpectationReal(state: Complex[], operator: ComplexMatrix): number {
  const applied = multiplyMatrixVector(operator, state);
  return innerProduct(state, applied).re;
}

export function zeroState(dim: number): Complex[] {
  return Array.from({ length: dim }, () => complex.zero);
}

function seededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1103515245 * state + 12345) >>> 0;
    return state / 0x100000000;
  };
}

export function zeroLike(matrix: ComplexMatrix): ComplexMatrix {
  return zeroMatrix(matrix.length);
}
