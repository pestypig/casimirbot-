import React from "react";
import { publish } from "@/lib/luma-bus";
import { useCurvatureBrick, type UseCurvatureBrickOptions } from "@/hooks/useCurvatureBrick";
import { useStressEnergyBrick } from "@/hooks/useStressEnergyBrick";

export interface CurvatureVoxProviderProps extends UseCurvatureBrickOptions {
  channel?: string;
  t00Channel?: string;
  fluxChannel?: string;
  children?: React.ReactNode;
}

export const DEFAULT_CURVATURE_CHANNEL = "hull3d:curvature";
export const DEFAULT_T00_CHANNEL = "hull3d:t00-volume";
export const DEFAULT_FLUX_CHANNEL = "hull3d:flux";

export function CurvatureVoxProvider({
  channel = DEFAULT_CURVATURE_CHANNEL,
  t00Channel = DEFAULT_T00_CHANNEL,
  fluxChannel = DEFAULT_FLUX_CHANNEL,
  children,
  ...options
}: CurvatureVoxProviderProps) {
  const { sample, dataUpdatedAt } = useCurvatureBrick(options);
  const stampRef = React.useRef<number>(0);
  const stressStampRef = React.useRef<number>(0);
  const stressQuery = useStressEnergyBrick({
    quality: options.quality,
    refetchMs: options.refetchMs,
  });

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

  React.useEffect(() => {
    const stress = stressQuery.data;
    if (!stress) return;
    stressStampRef.current += 1;
    const updatedAt = stressQuery.dataUpdatedAt ?? Date.now();
    const t00 = stress.t00;
    const packet = {
      dims: stress.dims,
      stats: stress.stats,
      meta: stress.meta,
      version: stressStampRef.current,
      updatedAt,
    };
    publish(t00Channel, {
      ...packet,
      data: t00?.data,
      min: t00?.min,
      max: t00?.max,
      t00,
    });
    publish(fluxChannel, { ...packet, flux: stress.flux });
  }, [stressQuery.data, stressQuery.dataUpdatedAt, t00Channel, fluxChannel]);

  return <>{children}</>;
}

export default CurvatureVoxProvider;
