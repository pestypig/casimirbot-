#!/usr/bin/env -S tsx
/**
 * Quick relief scalar helper (ops-only).
 * Operators: pull `lhs_Jm3` and `bound_Jm3` from the latest /api/helix/pipeline snapshot, then pass them here to scale |lhs| until zeta_raw <= target.
 */

export {};

type ParsedArgs = {
  lhs?: number;
  bound?: number;
  target: number;
};

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);
  let lhs: number | undefined;
  let bound: number | undefined;
  let target = 0.9;

  const takeValue = (token: string, next?: string): string | undefined => {
    if (token.includes("=")) return token.split("=", 2)[1];
    return next;
  };

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    const next = args[i + 1];
    if (token === "--lhs" || token === "-l") {
      const value = takeValue(token, next);
      lhs = value !== undefined ? Number(value) : lhs;
      if (value !== undefined && !token.includes("=")) i += 1;
    } else if (token === "--bound" || token === "-b") {
      const value = takeValue(token, next);
      bound = value !== undefined ? Number(value) : bound;
      if (value !== undefined && !token.includes("=")) i += 1;
    } else if (token === "--target" || token === "-t") {
      const value = takeValue(token, next);
      target = value !== undefined ? Number(value) : target;
      if (value !== undefined && !token.includes("=")) i += 1;
    }
  }

  return { lhs, bound, target };
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  const abs = Math.abs(n);
  if (abs !== 0 && (abs < 1e-3 || abs >= 1e6)) {
    return n.toExponential(3);
  }
  return parseFloat(n.toPrecision(3)).toString();
}

function main() {
  const { lhs, bound, target } = parseArgs();

  if (lhs === undefined || bound === undefined || !Number.isFinite(lhs) || !Number.isFinite(bound)) {
    console.error("Usage: tsx cli/qi-relief.ts --lhs <lhs_Jm3> --bound <bound_Jm3> [--target 0.9]");
    process.exit(1);
  }
  if (!Number.isFinite(target)) {
    console.error("Invalid target; expected a number (e.g. 0.9).");
    process.exit(1);
  }
  if (lhs === 0) {
    console.error("lhs_Jm3 must be non-zero to compute a scale factor.");
    process.exit(1);
  }

  const scale = Math.abs(target * Math.abs(bound) / Math.abs(lhs));
  console.log(`target_scale ≈ ${fmt(scale)}`);
}

main();
