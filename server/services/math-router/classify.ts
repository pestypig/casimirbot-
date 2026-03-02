import type { MathRouterDecision } from "@shared/math-router";

const MATRIX_SIGNAL = /\b(det(?:erminant)?|matrix|inverse|eigen(?:value|vector)?s?|trace)\b/i;
const WARP_SIGNAL = /\b(warp|alcubierre|natario|admissible|viab(?:le|ility)|certificate|ford-roman|qi bound|physically viable)\b/i;
const NUMERIC_HEAVY_SIGNAL = /\b(\d{2,}x\d{2,}|\d+\s*x\s*\d+|large numeric matrix|numeric matrix|random entries)\b/i;
const SYMBOL_TOKEN = /\b[a-df-zA-DF-Z]\b/;

export function classifyMathRouterPrompt(prompt: string): MathRouterDecision {
  const text = (prompt ?? "").trim();
  const lower = text.toLowerCase();
  const ePolicy = /\btreat\s+e\s+as\s+variable\b/i.test(text) ? "symbol" : "euler";

  if (!text) {
    return base("non_math", "general", "narrative", "none", "none", ePolicy, 0);
  }

  if (WARP_SIGNAL.test(lower)) {
    return base("warp_delegation", "warp_viability", "narrative", "physics.warp.viability", "physics.warp.viability", ePolicy, 0.99);
  }

  if (MATRIX_SIGNAL.test(lower)) {
    const numericHeavy = NUMERIC_HEAVY_SIGNAL.test(lower);
    const hasSymbols = SYMBOL_TOKEN.test(text) && /\[\[/.test(text);
    if (numericHeavy && !hasSymbols) {
      return base("compute", "numeric_linear_algebra", "numeric", "numeric", "math.numeric.verify", ePolicy, 0.94);
    }
    return base("compute", "symbolic_linear_algebra", hasSymbols ? "symbolic" : "mixed", "symbolic", "math.sympy.verify", ePolicy, 0.92);
  }

  return base("compute", "symbolic_expression", "mixed", "symbolic", "math.sympy.verify", ePolicy, 0.65);
}

function base(
  intent: MathRouterDecision["intent"],
  domain: MathRouterDecision["domain"],
  representation: MathRouterDecision["representation"],
  engine: MathRouterDecision["engine"],
  verifier: MathRouterDecision["verifier"],
  e: "symbol" | "euler",
  confidence: number,
): MathRouterDecision {
  return {
    intent,
    domain,
    representation,
    assumptions: { constants: { e } },
    engine,
    verifier,
    confidence,
  };
}
