export type SurfaceContext =
  | "desktop-wallpaper"
  | "desktop-window"
  | "mobile-shell"
  | "mobile-panel";

export type SurfacePalette = {
  id: string;
  label: string;
  base: string;
  ink: string;
  inkSoft: string;
  laminate: string;
  laminateSoft: string;
  glow: string;
};

export type SurfaceSlate = {
  id: string;
  svg: string;
};

export type SurfaceLayerKind = "base" | "gradient" | "laminate" | "meander" | "micro";

export type SurfaceLayer = {
  id: string;
  kind: SurfaceLayerKind;
  opacity: number;
  blendMode?: "normal" | "multiply" | "screen" | "overlay" | "soft-light";
  transform?: string;
  filter?: string;
  svg?: string;
  background?: string;
};

export type SurfaceRecipe = {
  id: string;
  seed: string;
  context: SurfaceContext;
  palette: SurfacePalette;
  vars: Record<string, string>;
  layers: SurfaceLayer[];
};
