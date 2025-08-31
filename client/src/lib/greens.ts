// client/src/lib/greens.ts
export type GreensPayload = {
  kind?: "poisson" | "helmholtz";
  m?: number;
  normalize?: boolean;
  phi?: Float32Array | number[];
  size?: number;
  source?: "server" | "client" | "none";
};

export type GreensStats = { N: number; min?: number; max?: number; mean?: number };

export function computeGreensStats(arr?: Float32Array | number[]): GreensStats {
  if (!arr || arr.length === 0) return { N: 0 };
  let min = +Infinity, max = -Infinity, sum = 0;
  const N = arr.length;
  for (let i = 0; i < N; i++) {
    const v = Number((arr as any)[i]);
    if (!Number.isFinite(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }
  return { N, min, max, mean: N ? sum / N : undefined };
}

export function fmtExp(v?: number, digits = 3): string {
  return Number.isFinite(v as number) ? (v as number).toExponential(digits) : "—";
}

export function greensKindLabel(g?: GreensPayload): string {
  if (!g?.kind) return "—";
  return g.kind === "helmholtz" ? `Helmholtz${g.m != null ? ` (m=${g.m})` : ""}` : "Poisson";
}