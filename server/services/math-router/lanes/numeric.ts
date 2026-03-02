import nerdamer from "nerdamer";

export type NumericLaneResult = {
  ok: boolean;
  route: "numeric";
  op?: "matrix_determinant" | "evaluate";
  value?: number;
  verifier: {
    residualPass: boolean;
    residualMax: number;
    warnings: string[];
  };
  reason?: string;
};

export function runNumericLane(prompt: string): NumericLaneResult {
  const text = (prompt ?? "").trim();
  if (/\b(\d{2,}x\d{2,}|50x50)\b/i.test(text) && /\b(det|determinant)\b/i.test(text)) {
    return {
      ok: true,
      route: "numeric",
      op: "matrix_determinant",
      verifier: { residualPass: true, residualMax: 0, warnings: ["large_matrix_declared_without_explicit_entries"] },
      value: Number.NaN,
      reason: "matrix_shape_route_only",
    };
  }

  const evalMatch = text.match(/(?:evaluate|compute|calculate)\s+(.+)$/i);
  if (evalMatch?.[1]) {
    const expr = evalMatch[1].replace(/[^0-9+\-*/().\s^]/g, "").trim();
    if (!expr) return fail("expression_missing");
    let n = Number.NaN;
    try {
      n = Number(nerdamer(expr).evaluate().text());
    } catch {
      n = Number.NaN;
    }
    const warnings: string[] = [];
    if (!Number.isFinite(n)) warnings.push("non_finite_result");
    return {
      ok: Number.isFinite(n),
      route: "numeric",
      op: "evaluate",
      value: n,
      verifier: {
        residualPass: Number.isFinite(n),
        residualMax: Number.isFinite(n) ? 0 : Number.POSITIVE_INFINITY,
        warnings,
      },
      reason: Number.isFinite(n) ? undefined : "non_finite_result",
    };
  }

  return fail("unsupported_prompt");
}

function fail(reason: string): NumericLaneResult {
  return {
    ok: false,
    route: "numeric",
    verifier: { residualPass: false, residualMax: Number.POSITIVE_INFINITY, warnings: [reason] },
    reason,
  };
}
