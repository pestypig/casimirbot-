export const DESIGN_RECIPE_VERSION = "2025-01-raw";

export type ComplexityBudget = {
  targetMinutes: number;
  maxSpecialRegions?: number;
  maxColorChangesPerCourse?: number;
};

export type PreviewHooks = {
  apexFiz?: { requested: boolean };
  knitPaintOnline?: { requested: boolean };
  knitManager?: { requested: boolean };
};

export type NeedleSkipPatternType = "alt_skip_1x1" | "alt_skip_2x1" | "lace_like_masked" | "solid" | "custom_mask";

export type NeedleSkipRegion = {
  regionId: string;
  patternType: NeedleSkipPatternType;
  densityTarget?: number;
  repeatScale?: number;
  orientation?: number;
  notes?: string;
};

export type OrnamentMeanderParams = {
  rule: string;
  seedSpacingCm?: number;
  stepCm?: number;
  maxLengthCm?: number;
  bendiness?: number;
  noiseScale?: number;
  lineThicknessPx?: number;
  palette?: string[];
  seedEdges?: string[];
  showPatterns?: boolean;
  showEdgeMeanders?: boolean;
  rngSeed?: number;
};

export type ColorPlan = {
  palette: string[];
  maxColors?: number;
  yarns?: string[];
  note?: string;
};

export type GaugeSpecRecipe = {
  machine?: string;
  gaugeNumber?: number;
  yarnFamily?: string;
  yarnOptions?: string[];
  notes?: string;
};

export type DesignRecipe = {
  version: string;
  templateId: string;
  templateName?: string;
  description?: string;
  measurements?: Record<string, number>;
  gauge?: GaugeSpecRecipe;
  colorPlan?: ColorPlan;
  ornament?: {
    meanders: OrnamentMeanderParams;
  };
  structuralDirectives?: {
    needleSkipRegions: NeedleSkipRegion[];
  };
  complexityBudget?: ComplexityBudget;
  costing?: {
    targetPrice?: number;
    currency?: string;
    estimatedMinutes?: number;
    notes?: string;
  };
  previewHooks?: PreviewHooks;
  metadata?: Record<string, unknown>;
};

export type ValidationIssue = {
  field: string;
  message: string;
};

export function validateDesignRecipe(recipe: DesignRecipe): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!recipe.templateId || recipe.templateId.trim().length === 0) {
    issues.push({ field: "templateId", message: "templateId is required" });
  }
  if (recipe.colorPlan && recipe.colorPlan.palette.length === 0) {
    issues.push({ field: "colorPlan.palette", message: "palette cannot be empty" });
  }
  if (recipe.gauge?.gaugeNumber != null && recipe.gauge.gaugeNumber <= 0) {
    issues.push({ field: "gauge.gaugeNumber", message: "gaugeNumber must be positive when provided" });
  }
  if (recipe.complexityBudget?.targetMinutes != null && recipe.complexityBudget.targetMinutes <= 0) {
    issues.push({ field: "complexityBudget.targetMinutes", message: "targetMinutes must be positive" });
  }
  return issues;
}
