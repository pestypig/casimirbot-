export type Complex = { re: number; im: number };
export type ComplexMatrix = Complex[][];

export type MajoranaAlgebraCheck = {
  passed: boolean;
  normalization: "gamma_anticommutator_2_delta";
  dimension: number;
  maxDiagonalError: number;
  maxOffDiagonalError: number;
  hermitian: boolean;
};

const ZERO: Complex = { re: 0, im: 0 };
const ONE: Complex = { re: 1, im: 0 };
const I: Complex = { re: 0, im: 1 };

export const complex = {
  zero: ZERO,
  one: ONE,
  i: I,
  add: (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im }),
  sub: (a: Complex, b: Complex): Complex => ({ re: a.re - b.re, im: a.im - b.im }),
  mul: (a: Complex, b: Complex): Complex => ({
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  }),
  scale: (a: Complex, scalar: number): Complex => ({ re: a.re * scalar, im: a.im * scalar }),
  conj: (a: Complex): Complex => ({ re: a.re, im: -a.im }),
  abs2: (a: Complex): number => a.re * a.re + a.im * a.im,
};

export function buildMajoranaOperators(nMajoranas: number): ComplexMatrix[] {
  if (!Number.isInteger(nMajoranas) || nMajoranas <= 0 || nMajoranas % 2 !== 0) {
    throw new Error("Majorana construction requires a positive even operator count");
  }
  const qubits = nMajoranas / 2;
  const ops: ComplexMatrix[] = [];
  for (let mode = 0; mode < qubits; mode += 1) {
    const prefix = Array.from({ length: mode }, () => pauliZ());
    const suffix = Array.from({ length: qubits - mode - 1 }, () => identity(2));
    ops.push(kronAll([...prefix, pauliX(), ...suffix]));
    ops.push(kronAll([...prefix, pauliY(), ...suffix]));
  }
  return ops;
}

export function verifyMajoranaAlgebra(ops: ComplexMatrix[], tolerance = 1e-9): MajoranaAlgebraCheck {
  if (ops.length === 0) {
    return {
      passed: false,
      normalization: "gamma_anticommutator_2_delta",
      dimension: 0,
      maxDiagonalError: Number.POSITIVE_INFINITY,
      maxOffDiagonalError: Number.POSITIVE_INFINITY,
      hermitian: false,
    };
  }
  const dim = ops[0].length;
  let maxDiagonalError = 0;
  let maxOffDiagonalError = 0;
  let hermitian = true;
  for (const op of ops) {
    hermitian = hermitian && isHermitian(op, tolerance);
  }
  for (let i = 0; i < ops.length; i += 1) {
    for (let j = 0; j < ops.length; j += 1) {
      const anticomm = addMatrices(multiplyMatrices(ops[i], ops[j]), multiplyMatrices(ops[j], ops[i]));
      const target = scaleMatrix(identity(dim), i === j ? 2 : 0);
      const error = maxAbsDiff(anticomm, target);
      if (i === j) {
        maxDiagonalError = Math.max(maxDiagonalError, error);
      } else {
        maxOffDiagonalError = Math.max(maxOffDiagonalError, error);
      }
    }
  }
  return {
    passed: hermitian && maxDiagonalError <= tolerance && maxOffDiagonalError <= tolerance,
    normalization: "gamma_anticommutator_2_delta",
    dimension: dim,
    maxDiagonalError,
    maxOffDiagonalError,
    hermitian,
  };
}

export function identity(dim: number): ComplexMatrix {
  return Array.from({ length: dim }, (_, row) =>
    Array.from({ length: dim }, (_, col) => (row === col ? ONE : ZERO)),
  );
}

export function zeroMatrix(dim: number): ComplexMatrix {
  return Array.from({ length: dim }, () => Array.from({ length: dim }, () => ZERO));
}

export function cloneMatrix(matrix: ComplexMatrix): ComplexMatrix {
  return matrix.map((row) => row.map((value) => ({ ...value })));
}

export function addMatrices(a: ComplexMatrix, b: ComplexMatrix): ComplexMatrix {
  return a.map((row, r) => row.map((value, c) => complex.add(value, b[r][c])));
}

export function subtractMatrices(a: ComplexMatrix, b: ComplexMatrix): ComplexMatrix {
  return a.map((row, r) => row.map((value, c) => complex.sub(value, b[r][c])));
}

export function scaleMatrix(matrix: ComplexMatrix, scalar: number | Complex): ComplexMatrix {
  const factor = typeof scalar === "number" ? { re: scalar, im: 0 } : scalar;
  return matrix.map((row) => row.map((value) => complex.mul(value, factor)));
}

export function multiplyMatrices(a: ComplexMatrix, b: ComplexMatrix): ComplexMatrix {
  const rows = a.length;
  const cols = b[0].length;
  const inner = b.length;
  const out = zeroMatrix(rows);
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      let sum = ZERO;
      for (let k = 0; k < inner; k += 1) {
        sum = complex.add(sum, complex.mul(a[r][k], b[k][c]));
      }
      out[r][c] = sum;
    }
  }
  return out;
}

export function multiplyMatrixVector(matrix: ComplexMatrix, vector: Complex[]): Complex[] {
  return matrix.map((row) =>
    row.reduce((sum, value, index) => complex.add(sum, complex.mul(value, vector[index])), ZERO),
  );
}

export function conjugateTranspose(matrix: ComplexMatrix): ComplexMatrix {
  return matrix[0].map((_, col) => matrix.map((row) => complex.conj(row[col])));
}

export function isHermitian(matrix: ComplexMatrix, tolerance = 1e-9): boolean {
  return maxAbsDiff(matrix, conjugateTranspose(matrix)) <= tolerance;
}

export function maxAbsDiff(a: ComplexMatrix, b: ComplexMatrix): number {
  let max = 0;
  for (let r = 0; r < a.length; r += 1) {
    for (let c = 0; c < a[r].length; c += 1) {
      const diff = complex.sub(a[r][c], b[r][c]);
      max = Math.max(max, Math.sqrt(complex.abs2(diff)));
    }
  }
  return max;
}

export function vectorNorm(vector: Complex[]): number {
  return Math.sqrt(vector.reduce((sum, value) => sum + complex.abs2(value), 0));
}

export function normalizeVector(vector: Complex[]): Complex[] {
  const norm = vectorNorm(vector);
  if (norm === 0) throw new Error("Cannot normalize a zero vector");
  return vector.map((value) => complex.scale(value, 1 / norm));
}

export function innerProduct(a: Complex[], b: Complex[]): Complex {
  return a.reduce((sum, value, index) => complex.add(sum, complex.mul(complex.conj(value), b[index])), ZERO);
}

export function matrixFrobeniusNorm(matrix: ComplexMatrix): number {
  return Math.sqrt(matrix.flat().reduce((sum, value) => sum + complex.abs2(value), 0));
}

export function commutatorNorm(a: ComplexMatrix, b: ComplexMatrix): number {
  return matrixFrobeniusNorm(subtractMatrices(multiplyMatrices(a, b), multiplyMatrices(b, a)));
}

export function kronAll(matrices: ComplexMatrix[]): ComplexMatrix {
  return matrices.reduce((acc, matrix) => kronecker(acc, matrix));
}

function kronecker(a: ComplexMatrix, b: ComplexMatrix): ComplexMatrix {
  const out: ComplexMatrix = [];
  for (const aRow of a) {
    for (const bRow of b) {
      const row: Complex[] = [];
      for (const aValue of aRow) {
        for (const bValue of bRow) {
          row.push(complex.mul(aValue, bValue));
        }
      }
      out.push(row);
    }
  }
  return out;
}

function pauliX(): ComplexMatrix {
  return [
    [ZERO, ONE],
    [ONE, ZERO],
  ];
}

function pauliY(): ComplexMatrix {
  return [
    [ZERO, { re: 0, im: -1 }],
    [I, ZERO],
  ];
}

function pauliZ(): ComplexMatrix {
  return [
    [ONE, ZERO],
    [ZERO, { re: -1, im: 0 }],
  ];
}
