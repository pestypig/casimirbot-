import type { HelixAskComposerActionToolbarSurfaceProps } from "./HelixAskComposerActionToolbarSurface";
import type { HelixAccountCapabilityPolicy } from "@shared/helix-account-session";
import { buildHelixAskLiveRuntimeControlsModel } from "./HelixAskLiveRuntimeControls";

export type HelixAskComposerActionToolbarState = HelixAskComposerActionToolbarSurfaceProps;

export type HelixAskComposerActionToolbarStateOptions =
  HelixAskComposerActionToolbarSurfaceProps & {
    accountPolicy?: HelixAccountCapabilityPolicy | null;
  };

export function buildHelixAskComposerActionToolbarState({
  carouselRef,
  imageInputRef,
  canScrollLeft,
  canScrollRight,
  onScrollLeft,
  onScrollRight,
  onImageSelect,
  onAttachImage,
  attachDisabled,
  hasReadyAttachment,
  hasAnyAttachment,
  micEnabled,
  voiceTranscribing,
  onToggleMic,
  showRetryVoiceSample,
  retryVoiceSampleDisabled,
  onRetryVoiceSample,
  showVisualCaptureControls,
  visualSourceKind,
  visualSourceSelectionDisabled,
  onToggleVisualSourceKind,
  visualSituationSourceStatus,
  onCaptureVisualSource,
  visualSituationIncludeAudio,
  displayAudioStatus,
  visualAudioToggleDisabled,
  onToggleVisualAudio,
  runtimePickerModel,
  runtimeMenuOpen,
  onRuntimePrimaryClick,
  onRuntimeSelect,
  liveRuntimeControlsModel,
  accountPolicy,
  submitViewModel,
  onSubmitIntent,
  onStop,
}: HelixAskComposerActionToolbarStateOptions): HelixAskComposerActionToolbarState {
  return {
    carouselRef,
    imageInputRef,
    canScrollLeft,
    canScrollRight,
    onScrollLeft,
    onScrollRight,
    onImageSelect,
    onAttachImage,
    attachDisabled,
    hasReadyAttachment,
    hasAnyAttachment,
    micEnabled,
    voiceTranscribing,
    onToggleMic,
    showRetryVoiceSample,
    retryVoiceSampleDisabled,
    onRetryVoiceSample,
    showVisualCaptureControls,
    visualSourceKind,
    visualSourceSelectionDisabled,
    onToggleVisualSourceKind,
    visualSituationSourceStatus,
    onCaptureVisualSource,
    visualSituationIncludeAudio,
    displayAudioStatus,
    visualAudioToggleDisabled,
    onToggleVisualAudio,
    runtimePickerModel,
    runtimeMenuOpen,
    onRuntimePrimaryClick,
    onRuntimeSelect,
    liveRuntimeControlsModel:
      liveRuntimeControlsModel ??
      buildHelixAskLiveRuntimeControlsModel({
        accountPolicy,
        mode: "live_voice",
        authority: "observe_only",
      }),
    submitViewModel,
    onSubmitIntent,
    onStop,
  };
}
