import React, { type ChangeEventHandler, type Ref } from "react";
import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";

import { HelixAskActionToolbar } from "./HelixAskActionToolbar";
import {
  HelixAskComposerSubmitButton,
  type HelixAskComposerViewModel,
} from "./HelixAskComposer";
import {
  HelixAskRuntimePicker,
  type HelixAskRuntimePickerModel,
} from "./HelixAskRuntimePicker";

export type HelixAskComposerActionToolbarSurfaceProps = {
  carouselRef?: Ref<HTMLDivElement>;
  imageInputRef?: Ref<HTMLInputElement>;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  onScrollLeft: () => void;
  onScrollRight: () => void;
  onImageSelect: ChangeEventHandler<HTMLInputElement>;
  onAttachImage: () => void;
  attachDisabled?: boolean;
  hasReadyAttachment?: boolean;
  hasAnyAttachment?: boolean;
  micEnabled: boolean;
  voiceTranscribing?: boolean;
  onToggleMic: () => void;
  showRetryVoiceSample?: boolean;
  retryVoiceSampleDisabled?: boolean;
  onRetryVoiceSample: () => void;
  showVisualCaptureControls?: boolean;
  visualSituationSourceStatus: string;
  onCaptureVisualSource: () => void;
  visualSituationIncludeAudio: boolean;
  displayAudioStatus?: string;
  visualAudioToggleDisabled?: boolean;
  onToggleVisualAudio: () => void;
  runtimePickerModel: HelixAskRuntimePickerModel;
  runtimeMenuOpen: boolean;
  onRuntimePrimaryClick: () => void;
  onRuntimeSelect: (value: HelixAgentRuntimeId) => void;
  submitViewModel: HelixAskComposerViewModel;
  onSubmitIntent: () => void;
  onStop: () => void;
};

export function HelixAskComposerActionToolbarSurface({
  carouselRef,
  imageInputRef,
  canScrollLeft,
  canScrollRight,
  onScrollLeft,
  onScrollRight,
  onImageSelect,
  onAttachImage,
  attachDisabled = false,
  hasReadyAttachment = false,
  hasAnyAttachment = false,
  micEnabled,
  voiceTranscribing = false,
  onToggleMic,
  showRetryVoiceSample = false,
  retryVoiceSampleDisabled = false,
  onRetryVoiceSample,
  showVisualCaptureControls = true,
  visualSituationSourceStatus,
  onCaptureVisualSource,
  visualSituationIncludeAudio,
  displayAudioStatus,
  visualAudioToggleDisabled = false,
  onToggleVisualAudio,
  runtimePickerModel,
  runtimeMenuOpen,
  onRuntimePrimaryClick,
  onRuntimeSelect,
  submitViewModel,
  onSubmitIntent,
  onStop,
}: HelixAskComposerActionToolbarSurfaceProps) {
  return (
    <HelixAskActionToolbar
      carouselRef={carouselRef}
      imageInputRef={imageInputRef}
      canScrollLeft={canScrollLeft}
      canScrollRight={canScrollRight}
      onScrollLeft={onScrollLeft}
      onScrollRight={onScrollRight}
      onImageSelect={onImageSelect}
      onAttachImage={onAttachImage}
      attachDisabled={attachDisabled}
      hasReadyAttachment={hasReadyAttachment}
      hasAnyAttachment={hasAnyAttachment}
      micEnabled={micEnabled}
      voiceTranscribing={voiceTranscribing}
      onToggleMic={onToggleMic}
      showRetryVoiceSample={showRetryVoiceSample}
      retryVoiceSampleDisabled={retryVoiceSampleDisabled}
      onRetryVoiceSample={onRetryVoiceSample}
      showVisualCaptureControls={showVisualCaptureControls}
      visualSituationSourceStatus={visualSituationSourceStatus}
      onCaptureVisualSource={onCaptureVisualSource}
      visualSituationIncludeAudio={visualSituationIncludeAudio}
      displayAudioStatus={displayAudioStatus}
      visualAudioToggleDisabled={visualAudioToggleDisabled}
      onToggleVisualAudio={onToggleVisualAudio}
      runtimePicker={
        <HelixAskRuntimePicker
          model={runtimePickerModel}
          menuOpen={runtimeMenuOpen}
          onPrimaryClick={onRuntimePrimaryClick}
          onSelect={onRuntimeSelect}
        />
      }
      submitButton={
        <HelixAskComposerSubmitButton
          viewModel={submitViewModel}
          onSubmitIntent={onSubmitIntent}
          onStop={onStop}
        />
      }
    />
  );
}
