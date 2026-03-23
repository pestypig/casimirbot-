import React from "react";
import { publish } from "@/lib/luma-bus";
import { useCurvatureBrick, type UseCurvatureBrickOptions } from "@/hooks/useCurvatureBrick";
import { useStressEnergyBrick } from "@/hooks/useStressEnergyBrick";
import { useGrBrick } from "@/hooks/useGrBrick";
import {
  DEFAULT_METRIC_VOLUME_CHANNEL,
  type HullMetricChannelMap,
} from "@/lib/metric-volume-contract";

export interface CurvatureVoxProviderProps extends UseCurvatureBrickOptions {
  channel?: string;
  t00Channel?: string;
  fluxChannel?: string;
  metricChannel?: string;
  children?: React.ReactNode;
}

export const DEFAULT_CURVATURE_CHANNEL = "hull3d:curvature";
export const DEFAULT_T00_CHANNEL = "hull3d:t00-volume";
export const DEFAULT_FLUX_CHANNEL = "hull3d:flux";

export function CurvatureVoxProvider({
  channel = DEFAULT_CURVATURE_CHANNEL,
  t00Channel = DEFAULT_T00_CHANNEL,
  fluxChannel = DEFAULT_FLUX_CHANNEL,
  metricChannel = DEFAULT_METRIC_VOLUME_CHANNEL,
  children,
  ...options
}: CurvatureVoxProviderProps) {
  const { sample, dataUpdatedAt } = useCurvatureBrick(options);
  const stampRef = React.useRef<number>(0);
  const stressStampRef = React.useRef<number>(0);
  const metricStampRef = React.useRef<number>(0);
  const stressQuery = useStressEnergyBrick({
    quality: options.quality,
    refetchMs: options.refetchMs,
  });
  const grQuery = useGrBrick({
    quality: options.quality,
    includeExtra: true,
    includeKij: true,
    includeMatter: false,
    refetchMs: Math.max(250, options.refetchMs ?? 250),
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

  React.useEffect(() => {
    const gr = grQuery.data;
    if (!gr) return;
    metricStampRef.current += 1;
    const updatedAt = grQuery.dataUpdatedAt ?? Date.now();
    const channels: HullMetricChannelMap = {
      alpha: gr.channels.alpha,
      beta_x: gr.channels.beta_x,
      beta_y: gr.channels.beta_y,
      beta_z: gr.channels.beta_z,
      gamma_xx: gr.channels.gamma_xx,
      gamma_yy: gr.channels.gamma_yy,
      gamma_zz: gr.channels.gamma_zz,
      K_trace: gr.channels.K_trace,
      H_constraint: gr.channels.H_constraint,
      M_constraint_x: gr.channels.M_constraint_x,
      M_constraint_y: gr.channels.M_constraint_y,
      M_constraint_z: gr.channels.M_constraint_z,
    };

    const optional = [
      "K_xx",
      "K_yy",
      "K_zz",
      "K_xy",
      "K_xz",
      "K_yz",
      "theta",
      "det_gamma",
      "ricci3",
      "KijKij",
      "kretschmann",
      "ricci4",
      "ricci2",
      "weylI",
    ] as const;
    for (const key of optional) {
      const channel = gr.extraChannels?.[key];
      if (!channel) continue;
      channels[key] = channel;
    }

    const packet = {
      kind: "hull3d:metric-volume" as const,
      version: metricStampRef.current,
      updatedAt,
      source: "gr-evolve-brick",
      chart: "comoving_cartesian",
      coordinateMap: "bubble-centered coordinates",
      provenance: {
        endpoint: "/api/helix/gr-evolve-brick",
        module: "server/gr-evolve-brick.ts",
        status: gr.meta?.status ?? null,
        reasons: gr.meta?.reasons ?? [],
        includeExtra: true,
        includeKij: true,
        includeMatter: false,
      },
      dims: gr.dims,
      bounds: gr.bounds,
      voxelSize_m: gr.voxelSize_m,
      time_s: gr.time_s,
      dt_s: gr.dt_s,
      channels,
      stats: gr.stats as unknown as Record<string, unknown>,
      meta: (gr.meta ?? null) as unknown as Record<string, unknown> | null,
    };

    publish(metricChannel, packet);
    if (typeof window !== "undefined") {
      (window as any).__hullMetricVolumeLatest = packet;
    }
  }, [grQuery.data, grQuery.dataUpdatedAt, metricChannel]);

  return <>{children}</>;
}

export default CurvatureVoxProvider;
