import { useEffect, useRef } from "react";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import { useNavPoseStore } from "@/store/useNavPoseStore";
import {
  computeNavDelta,
  createDeterministicNavTraceId,
  resolveNavVector,
  type VizIntent,
  type Waypoint,
} from "@/lib/nav/nav-dynamics";

type UseNavPoseDriverParams = {
  vizIntent: VizIntent;
  waypoint?: Waypoint | null;
  enabled?: boolean;
};

export function useNavPoseDriver({
  vizIntent,
  waypoint = null,
  enabled = true,
}: UseNavPoseDriverParams): void {
  const { data: pipeline } = useEnergyPipeline();
  const ingest = useNavPoseStore((state) => state.ingestDriveVector);
  const beginEpisode = useNavPoseStore((state) => state.beginEpisode);
  const recordEpisodePhase = useNavPoseStore((state) => state.recordEpisodePhase);
  const rafRef = useRef<number | null>(null);
  const phaseTickRef = useRef(0);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
      return;
    }

    const seed = JSON.stringify({
      mode: pipeline?.currentMode ?? "unknown",
      duty: pipeline?.dutyCycle ?? pipeline?.dutyFR ?? null,
      waypoint: waypoint?.position_m ?? null,
    });
    const traceId = createDeterministicNavTraceId({
      seed,
      waypoint,
      viz: vizIntent,
      frame: "heliocentric-ecliptic",
    });
    beginEpisode({ traceId, seed });

    const frame = () => {
      const { source, navPose } = useNavPoseStore.getState();
      if (source !== "server") {
        const tick = ++phaseTickRef.current;
        if (tick % 10 === 1) {
          recordEpisodePhase({ phase: "sense", metadata: { source, tick } });
        }
        const resolved = resolveNavVector({
          viz: vizIntent,
          pipeline,
          currentPose: navPose,
          waypoint,
        });
        if (tick % 10 === 2) {
          recordEpisodePhase({
            phase: "premeditate",
            candidateId: `heading:${resolved.heading_deg.toFixed(2)}`,
            predictedDelta: resolved.speed_mps,
          });
        }
        ingest({
          velocity_mps: resolved.velocity_mps,
          heading_deg: resolved.heading_deg,
          frame: "heliocentric-ecliptic",
        });
        if (tick % 10 === 3) {
          const actual = useNavPoseStore.getState().navPose.velocity_mps;
          const delta = computeNavDelta({
            predictedVelocity: resolved.velocity_mps,
            actualVelocity: actual,
          });
          recordEpisodePhase({
            phase: "act",
            controllerRef: "nav-pose-driver",
            actualDelta: delta,
          });
          recordEpisodePhase({
            phase: "compare",
            predictedDelta: 0,
            actualDelta: delta,
            metadata: {
              traceId,
            },
          });
        }
      }
      rafRef.current = window.requestAnimationFrame(frame);
    };

    rafRef.current = window.requestAnimationFrame(frame);
    return () => {
      if (rafRef.current != null && typeof window !== "undefined" && typeof window.cancelAnimationFrame === "function") {
        window.cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = null;
      void useNavPoseStore.getState().flushEpisode();
    };
  }, [
    beginEpisode,
    enabled,
    ingest,
    pipeline,
    recordEpisodePhase,
    vizIntent.planar,
    vizIntent.rise,
    vizIntent.yaw,
    waypoint?.position_m?.[0],
    waypoint?.position_m?.[1],
    waypoint?.position_m?.[2],
  ]);
}
