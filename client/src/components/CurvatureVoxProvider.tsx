import React from "react";
import { publish } from "@/lib/luma-bus";
import { useCurvatureBrick, type UseCurvatureBrickOptions } from "@/hooks/useCurvatureBrick";

export interface CurvatureVoxProviderProps extends UseCurvatureBrickOptions {
  channel?: string;
  children?: React.ReactNode;
}

export const DEFAULT_CURVATURE_CHANNEL = "hull3d:curvature";

export function CurvatureVoxProvider({
  channel = DEFAULT_CURVATURE_CHANNEL,
  children,
  ...options
}: CurvatureVoxProviderProps) {
  const { sample, dataUpdatedAt } = useCurvatureBrick(options);
  const stampRef = React.useRef<number>(0);

  React.useEffect(() => {
    if (!sample) {
      return;
    }
    stampRef.current += 1;
    const payload = {
      ...sample,
      version: stampRef.current,
      updatedAt: dataUpdatedAt ?? Date.now(),
    };
    publish(channel, payload);
  }, [channel, sample, dataUpdatedAt]);

  return <>{children}</>;
}

export default CurvatureVoxProvider;
