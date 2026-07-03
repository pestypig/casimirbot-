import {
  HelixAskDebugDrawer,
  type HelixAskDebugDrawerProps,
} from "./HelixAskDebugDrawer";

export type HelixAskDebugDrawerSurfaceProps = {
  drawer: HelixAskDebugDrawerProps | null;
};

export function HelixAskDebugDrawerSurface({
  drawer,
}: HelixAskDebugDrawerSurfaceProps) {
  if (!drawer) return null;

  return <HelixAskDebugDrawer {...drawer} />;
}
