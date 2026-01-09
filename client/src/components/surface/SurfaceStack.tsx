import * as React from "react";
import { cn } from "@/lib/utils";
import type { SurfaceLayer, SurfaceRecipe } from "@/lib/surfacekit/types";

type SurfaceStackProps = {
  recipe: SurfaceRecipe;
  className?: string;
  style?: React.CSSProperties;
};

export function SurfaceStack({ recipe, className, style }: SurfaceStackProps) {
  const vars = React.useMemo(() => {
    const next: React.CSSProperties = {};
    Object.entries(recipe.vars).forEach(([key, value]) => {
      (next as Record<string, string>)[key] = value;
    });
    return next;
  }, [recipe.vars]);

  return (
    <div
      className={cn("surface-stack", className)}
      style={{ ...vars, ...style }}
      aria-hidden="true"
    >
      {recipe.layers.map((layer) => (
        <SurfaceLayerView key={`${layer.kind}-${layer.id}`} layer={layer} />
      ))}
    </div>
  );
}

function SurfaceLayerView({ layer }: { layer: SurfaceLayer }) {
  const layerStyle: React.CSSProperties = {
    opacity: layer.opacity,
  };

  if (layer.blendMode) {
    layerStyle.mixBlendMode = layer.blendMode;
  }

  if (layer.transform) {
    layerStyle.transform = layer.transform;
  }

  if (layer.filter) {
    layerStyle.filter = layer.filter;
  }

  if (layer.background) {
    layerStyle.background = layer.background;
  }

  return (
    <div className="surface-layer" data-kind={layer.kind} style={layerStyle}>
      {layer.svg ? (
        <div
          className="surface-svg"
          dangerouslySetInnerHTML={{ __html: layer.svg }}
        />
      ) : null}
    </div>
  );
}
