export type MathRouterIntent = "compute" | "warp_delegation" | "non_math";
export type MathRouterDomain = "symbolic_linear_algebra" | "numeric_linear_algebra" | "symbolic_expression" | "warp_viability" | "general";
export type MathRouterRepresentation = "symbolic" | "numeric" | "mixed" | "narrative";
export type MathRouterEngine = "symbolic" | "numeric" | "physics.warp.viability" | "none";
export type MathRouterVerifier = "math.sympy.verify" | "math.numeric.verify" | "physics.warp.viability" | "none";

export type MathRouterConstantPolicy = {
  e: "symbol" | "euler";
};

export type MathRouterDecision = {
  intent: MathRouterIntent;
  domain: MathRouterDomain;
  representation: MathRouterRepresentation;
  assumptions: {
    constants: MathRouterConstantPolicy;
  };
  engine: MathRouterEngine;
  verifier: MathRouterVerifier;
  confidence: number;
};
