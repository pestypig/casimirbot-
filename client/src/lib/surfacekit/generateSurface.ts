import type { SurfaceContext, SurfaceLayer, SurfaceRecipe } from "./types";
import { SURFACE_GRADIENTS, SURFACE_LAMINATES, SURFACE_MEANDERS, SURFACE_MICRO } from "./slates";
import { SURFACE_PALETTES, findSurfacePalette } from "./palettes";
import { createSurfaceRng, pickOne, pickRange, pickRotation } from "./seed";

export type SurfaceDensity = "low" | "medium" | "high";

export type GenerateSurfaceOptions = {
  seed?: string;
  context: SurfaceContext;
  paletteId?: string;
  density?: SurfaceDensity;
};

const DEFAULT_SEED = "helix-surface-v1";
const ROTATIONS = [0, 90, 180, 270];

const CONTEXT_TUNING: Record<SurfaceContext, {
  gradientOpacity: number;
  laminateOpacity: number;
  meanderOpacity: number;
  microOpacity: number;
  microChance: number;
}> = {
  "desktop-wallpaper": {
    gradientOpacity: 0.34,
    laminateOpacity: 0.28,
    meanderOpacity: 0.18,
    microOpacity: 0.12,
    microChance: 0.35,
  },
  "desktop-window": {
    gradientOpacity: 0.25,
    laminateOpacity: 0.22,
    meanderOpacity: 0.16,
    microOpacity: 0.1,
    microChance: 0.25,
  },
  "mobile-shell": {
    gradientOpacity: 0.3,
    laminateOpacity: 0.24,
    meanderOpacity: 0.16,
    microOpacity: 0.1,
    microChance: 0.3,
  },
  "mobile-panel": {
    gradientOpacity: 0.22,
    laminateOpacity: 0.2,
    meanderOpacity: 0.14,
    microOpacity: 0.08,
    microChance: 0.2,
  },
};

const DENSITY_MULTIPLIER: Record<SurfaceDensity, number> = {
  low: 0.8,
  medium: 1,
  high: 1.35,
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function buildTransform(
  rng: () => number,
  options: {
    minScale?: number;
    maxScale?: number;
    maxShift?: number;
    rotations?: number[];
  } = {},
) {
  const minScale = options.minScale ?? 1;
  const maxScale = options.maxScale ?? 1.08;
  const maxShift = options.maxShift ?? 4;
  const rotations = options.rotations ?? ROTATIONS;
  const scale = pickRange(rng, minScale, maxScale);
  const shiftX = pickRange(rng, -maxShift, maxShift);
  const shiftY = pickRange(rng, -maxShift, maxShift);
  const rotate = rotations.length ? pickRotation(rng, rotations) : 0;
  return `translate(${shiftX}%, ${shiftY}%) scale(${scale}) rotate(${rotate}deg)`;
}

function resolvePalette(paletteId: string | undefined, rng: () => number) {
  return findSurfacePalette(paletteId) ?? pickOne(SURFACE_PALETTES, rng);
}

export function generateSurfaceRecipe(options: GenerateSurfaceOptions): SurfaceRecipe {
  const seed = (options.seed ?? DEFAULT_SEED).trim() || DEFAULT_SEED;
  const context = options.context;
  const density = options.density ?? "low";
  const rng = createSurfaceRng(`${seed}:${context}`);
  const palette = resolvePalette(options.paletteId, rng);
  const gradient = pickOne(SURFACE_GRADIENTS, rng);
  const laminate = pickOne(SURFACE_LAMINATES, rng);
  const meander = pickOne(SURFACE_MEANDERS, rng);

  const tuning = CONTEXT_TUNING[context];
  const microChance = clamp01(tuning.microChance * DENSITY_MULTIPLIER[density]);
  const includeMicro = SURFACE_MICRO.length > 0 && rng() < microChance;
  const micro = includeMicro ? pickOne(SURFACE_MICRO, rng) : null;

  const layers: SurfaceLayer[] = [
    {
      id: "base",
      kind: "base",
      opacity: 1,
      background: "var(--surface-base)",
    },
    {
      id: gradient.id,
      kind: "gradient",
      opacity: tuning.gradientOpacity,
      blendMode: "screen",
      transform: buildTransform(rng, { minScale: 1.02, maxScale: 1.1 }),
      svg: gradient.svg,
    },
    {
      id: laminate.id,
      kind: "laminate",
      opacity: tuning.laminateOpacity,
      blendMode: "soft-light",
      transform: buildTransform(rng, { minScale: 1.01, maxScale: 1.08, maxShift: 3 }),
      svg: laminate.svg,
    },
    {
      id: meander.id,
      kind: "meander",
      opacity: tuning.meanderOpacity,
      blendMode: "normal",
      transform: buildTransform(rng, { minScale: 1, maxScale: 1.05, maxShift: 2 }),
      svg: meander.svg,
    },
  ];

  if (micro) {
    layers.push({
      id: micro.id,
      kind: "micro",
      opacity: tuning.microOpacity,
      blendMode: "overlay",
      transform: buildTransform(rng, { minScale: 1, maxScale: 1.02, maxShift: 1, rotations: [0, 90] }),
      svg: micro.svg,
    });
  }

  const vars = {
    "--surface-base": palette.base,
    "--surface-ink": palette.ink,
    "--surface-ink-soft": palette.inkSoft,
    "--surface-laminate": palette.laminate,
    "--surface-laminate-soft": palette.laminateSoft,
    "--surface-glow": palette.glow,
  };

  return {
    id: `surface-${context}-${palette.id}-${gradient.id}-${laminate.id}-${meander.id}-${micro?.id ?? "none"}`,
    seed,
    context,
    palette,
    vars,
    layers,
  };
}
