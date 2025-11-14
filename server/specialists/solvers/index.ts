import type { z } from "zod";
import { SolverSpec, SolverInput, SolverOutput } from "@shared/agi-specialists";

export type SolverHandler = (
  input: z.infer<typeof SolverInput>,
  ctx: Record<string, unknown>,
) => Promise<z.infer<typeof SolverOutput>>;

type Solver = z.infer<typeof SolverSpec> & { handler: SolverHandler };

const SOLVERS = new Map<string, Solver>();

export function registerSolver(solver: Solver): void {
  SOLVERS.set(solver.name, solver);
}

export function getSolver(name: string): Solver | undefined {
  return SOLVERS.get(name);
}

export function listSolvers(): Array<Pick<Solver, "name" | "desc">> {
  const allow = (process.env.SOLVER_ALLOWLIST ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const all = [...SOLVERS.values()].map((solver) => ({ name: solver.name, desc: solver.desc }));
  if (allow.length === 0) {
    return all;
  }
  const allowSet = new Set(allow);
  return all.filter((solver) => allowSet.has(solver.name));
}

export function __resetSolverRegistry(): void {
  SOLVERS.clear();
}
