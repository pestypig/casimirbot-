export interface StarSimQualityRejection {
  catalog: string;
  reason: string;
  field_path?: string;
  quality_flags?: string[];
  fallback_consequence?: string;
}

export interface StarSimDiagnosticSummary {
  fit_quality?: "good" | "borderline" | "poor";
  comparison_quality?: "good" | "borderline" | "poor";
  top_residual_fields?: string[];
  observable_coverage?: {
    used: number;
    requested: number;
    ratio: number;
  };
}

export const summarizeResiduals = (residuals: Record<string, number>): string[] =>
  Object.entries(residuals)
    .filter(([, value]) => Number.isFinite(value))
    .sort((left, right) => Math.abs(right[1]) - Math.abs(left[1]))
    .slice(0, 3)
    .map(([key]) => key);

export const classifyResidualQuality = (residuals: Record<string, number>): "good" | "borderline" | "poor" => {
  const values = Object.values(residuals).filter((value) => Number.isFinite(value)).map((value) => Math.abs(value));
  if (values.length === 0) {
    return "borderline";
  }
  const max = Math.max(...values);
  if (max <= 1) return "good";
  if (max <= 2.5) return "borderline";
  return "poor";
};

export const buildLaneDiagnosticSummary = (args: {
  residuals: Record<string, number>;
  observablesUsed: string[];
  comparison?: boolean;
}): StarSimDiagnosticSummary => {
  const topResidualFields = summarizeResiduals(args.residuals);
  const quality = classifyResidualQuality(args.residuals);
  return {
    fit_quality: args.comparison ? undefined : quality,
    comparison_quality: args.comparison ? quality : undefined,
    top_residual_fields: topResidualFields,
    observable_coverage: {
      used: args.observablesUsed.length,
      requested: Math.max(args.observablesUsed.length, 1),
      ratio: 1,
    },
  };
};
