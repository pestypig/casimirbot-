import type { HelixAskLegacyComposerSurfaceProps } from "./HelixAskLegacyComposerSurface";

export type HelixAskLegacyComposerStateOptions = HelixAskLegacyComposerSurfaceProps;

export function buildHelixAskLegacyComposerState({
  voiceLevelMonitor,
  moodAvatar,
  actionToolbar,
  textarea,
  textareaRef,
  slashCommandMenu,
}: HelixAskLegacyComposerStateOptions): HelixAskLegacyComposerSurfaceProps {
  return {
    voiceLevelMonitor,
    moodAvatar,
    actionToolbar,
    textarea,
    textareaRef,
    slashCommandMenu,
  };
}
