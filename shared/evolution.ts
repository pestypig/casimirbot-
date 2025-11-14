import { z } from "zod";

/** ----- States ----- */
export const PolyState = z.object({
  kind: z.literal("poly"),
  // ascending coeffs: a0 + a1 x + a2 x^2 + ...
  coeffs: z.array(z.number()).nonempty(),
});

export const VectorState = z.object({
  kind: z.literal("vec2"),
  v: z.tuple([z.number(), z.number()]),
});

export const GraphState = z.object({
  kind: z.literal("graph"),
  nodes: z.array(z.string()).nonempty(),
  // node weights (e.g., mass on nodes)
  weights: z.record(z.string(), z.number()),
});

export const FieldState = z.object({
  kind: z.literal("field2"),
  grid: z.array(z.array(z.number()).nonempty()).nonempty(),
  // true => fixed boundary (value is clamped)
  boundary: z.array(z.array(z.boolean()).nonempty()).nonempty(),
});

export const LedgerState = z.object({
  kind: z.literal("ledger"),
  accounts: z.array(z.object({ id: z.string(), bal: z.number() })).nonempty(),
});

export const EvolutionState = z.discriminatedUnion("kind", [
  PolyState,
  VectorState,
  GraphState,
  FieldState,
  LedgerState,
]);

/** ----- Rules ----- */
export const PolyAffineRule = z.object({
  type: z.literal("poly.affine"),
  shift: z.number(), // x -> x + shift (per step)
  scale: z.number(), // multiply all coeffs each step
});

export const VectorRotateRule = z.object({
  type: z.literal("vector.rotate"),
  theta_deg: z.number(), // 2D rotation per step
});

export const GraphConserveRule = z.object({
  type: z.literal("graph.conserve"), // total weight conserved
});

export const FieldDiffuseRule = z.object({
  type: z.literal("field.diffuse"),
  beta: z.number().min(0).max(0.25), // explicit stable step (<= 0.25)
  fixed_boundary: z.boolean().default(true),
});

export const LedgerTransferRule = z.object({
  type: z.literal("ledger.transfer"),
  allow_negative: z.boolean().default(false), // balances must stay >=0 unless true
});

export const EvolutionRule = z.discriminatedUnion("type", [
  PolyAffineRule,
  VectorRotateRule,
  GraphConserveRule,
  FieldDiffuseRule,
  LedgerTransferRule,
]);

/** ----- Problems / Steps ----- */
export const EvolutionProblem = z.object({
  id: z.string(),
  family: z.enum(["poly", "vector", "graph", "field", "ledger"]),
  state0: EvolutionState,
  rule: EvolutionRule,
  steps_required: z.number().int().positive(),
  invariants: z.array(z.string()).optional(),
});

export const EvolutionStep = z.object({
  input: EvolutionState,
  output: EvolutionState,
  op_desc: z.string().default(""),
  checks: z.array(z.string()).optional(),
});

export const EvolutionTrace = z.array(EvolutionStep);

export type TProblem = z.infer<typeof EvolutionProblem>;
export type TStep = z.infer<typeof EvolutionStep>;
export type TState = z.infer<typeof EvolutionState>;
export type TRule = z.infer<typeof EvolutionRule>;
