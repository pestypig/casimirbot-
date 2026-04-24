export const SCIENTIFIC_CALCULATOR_PANEL_ID = "scientific-calculator";
export const SCIENTIFIC_CALCULATOR_MATH_PICKED_EVENT = "helix:math-picked";

export type ScientificCalculatorMathPickedDetail = {
  latex: string;
  sourcePath: string | null;
  anchor: string | null;
  ts: string;
};

export function dispatchScientificCalculatorMathPicked(detail: {
  latex: string;
  sourcePath?: string | null;
  anchor?: string | null;
}): ScientificCalculatorMathPickedDetail {
  const normalized: ScientificCalculatorMathPickedDetail = {
    latex: detail.latex,
    sourcePath: detail.sourcePath ?? null,
    anchor: detail.anchor ?? null,
    ts: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<ScientificCalculatorMathPickedDetail>(
        SCIENTIFIC_CALCULATOR_MATH_PICKED_EVENT,
        { detail: normalized },
      ),
    );
  }
  return normalized;
}
