import { useEffect, useRef } from "react";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import { useNavPoseStore } from "@/store/useNavPoseStore";
import { resolveNavVector, type VizIntent, type Waypoint } from "@/lib/nav/nav-dynamics";

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
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
      return;
    }

    const frame = () => {
      const { source, navPose } = useNavPoseStore.getState();
      if (source !== "server") {
        const resolved = resolveNavVector({
          viz: vizIntent,
          pipeline,
          currentPose: navPose,
          waypoint,
        });
        ingest({
          velocity_mps: resolved.velocity_mps,
          heading_deg: resolved.heading_deg,
          frame: "heliocentric-ecliptic",
        });
      }
      rafRef.current = window.requestAnimationFrame(frame);
    };

    rafRef.current = window.requestAnimationFrame(frame);
    return () => {
      if (rafRef.current != null && typeof window !== "undefined" && typeof window.cancelAnimationFrame === "function") {
        window.cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = null;
    };
  }, [
    enabled,
    ingest,
    pipeline,
    vizIntent.planar,
    vizIntent.rise,
    vizIntent.yaw,
    waypoint?.position_m?.[0],
    waypoint?.position_m?.[1],
    waypoint?.position_m?.[2],
  ]);
}
