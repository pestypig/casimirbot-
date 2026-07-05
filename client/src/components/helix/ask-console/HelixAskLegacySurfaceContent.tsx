import {
  HelixAskConsoleSupplementSurface,
  type HelixAskConsoleSupplementSurfaceProps,
} from "./HelixAskConsoleSupplementSurface";
import {
  HelixAskLegacyComposerSurface,
  type HelixAskLegacyComposerSurfaceProps,
} from "./HelixAskLegacyComposerSurface";
import {
  HelixAskReasoningTheaterSurface,
  type HelixAskReasoningTheaterSurfaceProps,
} from "./HelixAskReasoningTheaterSurface";

export type HelixAskLegacySurfaceContentProps = {
  composer: HelixAskLegacyComposerSurfaceProps;
  supplement: HelixAskConsoleSupplementSurfaceProps;
  reasoningTheater: HelixAskReasoningTheaterSurfaceProps;
};

export function HelixAskLegacySurfaceContent({
  composer,
  supplement,
  reasoningTheater,
}: HelixAskLegacySurfaceContentProps) {
  return (
    <>
      <HelixAskLegacyComposerSurface {...composer} />
      <HelixAskConsoleSupplementSurface {...supplement} />
      <HelixAskReasoningTheaterSurface {...reasoningTheater} />
    </>
  );
}
