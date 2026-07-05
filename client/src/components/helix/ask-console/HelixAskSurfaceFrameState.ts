import type { HelixAskSurfaceFrameSurfaceProps } from "./HelixAskSurfaceFrameSurface";

export type HelixAskSurfaceFrameStateOptions = Omit<HelixAskSurfaceFrameSurfaceProps, "children">;

export function buildHelixAskSurfaceFrameState({
  maxWidthClassName,
  maxWidthStyle,
  surfaceBorderClassName,
  surfaceTintClassName,
  surfaceHaloClassName,
  isOffline,
  onSubmit,
  onPrimeInteraction,
}: HelixAskSurfaceFrameStateOptions): HelixAskSurfaceFrameStateOptions {
  return {
    maxWidthClassName,
    maxWidthStyle,
    surfaceBorderClassName,
    surfaceTintClassName,
    surfaceHaloClassName,
    isOffline,
    onSubmit,
    onPrimeInteraction,
  };
}
