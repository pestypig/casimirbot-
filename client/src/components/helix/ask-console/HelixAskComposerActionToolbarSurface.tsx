import React, {
  type ChangeEventHandler,
  type Ref,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";

import {
  HelixAskActionToolbar,
  type HelixAskVisualSourceKind,
} from "./HelixAskActionToolbar";
import {
  HelixAskComposerSubmitButton,
  type HelixAskComposerViewModel,
} from "./HelixAskComposer";
import {
  HelixAskRuntimePicker,
  type HelixAskRuntimePickerModel,
} from "./HelixAskRuntimePicker";
import {
  HelixAskLiveRuntimeControls,
  type HelixAskLiveRuntimeControlsModel,
  type HelixAskLiveRuntimeToolbarBridge,
} from "./HelixAskLiveRuntimeControls";
import {
  useHelixAskActionCarousel,
  type HelixAskActionCarouselDirection,
} from "./useHelixAskActionCarousel";

export type HelixAskComposerActionToolbarSurfaceProps = {
  imageInputRef?: Ref<HTMLInputElement>;
  onCarouselScrollIntent?: (direction: HelixAskActionCarouselDirection) => void;
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
  visualSourceKind?: HelixAskVisualSourceKind;
  visualSourceSelectionDisabled?: boolean;
  onToggleVisualSourceKind?: () => void;
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
  liveRuntimeControlsModel?: HelixAskLiveRuntimeControlsModel | null;
  submitViewModel: HelixAskComposerViewModel;
  onSubmitIntent: () => void;
  onStop: () => void;
};

export function HelixAskComposerActionToolbarSurface({
  imageInputRef,
  onCarouselScrollIntent,
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
  visualSourceKind = "screen",
  visualSourceSelectionDisabled = false,
  onToggleVisualSourceKind,
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
  liveRuntimeControlsModel = null,
  submitViewModel,
  onSubmitIntent,
  onStop,
}: HelixAskComposerActionToolbarSurfaceProps) {
  const actionCarousel = useHelixAskActionCarousel({
    onScrollIntent: onCarouselScrollIntent,
  });
  const [liveRuntimeBridge, setLiveRuntimeBridge] =
    useState<HelixAskLiveRuntimeToolbarBridge | null>(null);
  const legacyMicDisableRequestedRef = useRef(false);
  const handleLiveRuntimeBridgeChange = useCallback(
    (bridge: HelixAskLiveRuntimeToolbarBridge | null) => {
      setLiveRuntimeBridge(bridge);
    },
    [],
  );
  const liveOwnsMicrophone = liveRuntimeBridge?.engaged === true;

  useEffect(() => {
    if (!liveOwnsMicrophone) {
      legacyMicDisableRequestedRef.current = false;
      return;
    }
    if (micEnabled && !legacyMicDisableRequestedRef.current) {
      legacyMicDisableRequestedRef.current = true;
      onToggleMic();
    }
  }, [liveOwnsMicrophone, micEnabled, onToggleMic]);

  const effectiveMicEnabled = liveOwnsMicrophone
    ? liveRuntimeBridge?.microphoneEnabled === true
    : micEnabled;
  const effectiveVoiceTranscribing = liveOwnsMicrophone
    ? false
    : voiceTranscribing;
  const effectiveToggleMic = liveOwnsMicrophone
    ? () => liveRuntimeBridge?.toggleMicrophone()
    : onToggleMic;

  return (
    <HelixAskActionToolbar
      carouselRef={actionCarousel.viewportRef}
      carouselTrackRef={actionCarousel.trackRef}
      imageInputRef={imageInputRef}
      canScrollLeft={actionCarousel.canScrollLeft}
      canScrollRight={actionCarousel.canScrollRight}
      onScrollLeft={actionCarousel.onScrollLeft}
      onScrollRight={actionCarousel.onScrollRight}
      onImageSelect={onImageSelect}
      onAttachImage={onAttachImage}
      attachDisabled={attachDisabled}
      hasReadyAttachment={hasReadyAttachment}
      hasAnyAttachment={hasAnyAttachment}
      micEnabled={effectiveMicEnabled}
      showMicButton={!liveOwnsMicrophone}
      micInputMode={liveOwnsMicrophone ? "live_runtime" : "voice_lane"}
      micDisabled={
        liveOwnsMicrophone &&
        liveRuntimeBridge?.microphoneToggleDisabled !== false
      }
      voiceTranscribing={effectiveVoiceTranscribing}
      onToggleMic={effectiveToggleMic}
      showRetryVoiceSample={showRetryVoiceSample}
      retryVoiceSampleDisabled={retryVoiceSampleDisabled}
      onRetryVoiceSample={onRetryVoiceSample}
      showVisualCaptureControls={showVisualCaptureControls}
      visualSourceKind={visualSourceKind}
      visualSourceSelectionDisabled={visualSourceSelectionDisabled}
      onToggleVisualSourceKind={onToggleVisualSourceKind}
      visualSituationSourceStatus={visualSituationSourceStatus}
      onCaptureVisualSource={onCaptureVisualSource}
      visualSituationIncludeAudio={visualSituationIncludeAudio}
      displayAudioStatus={displayAudioStatus}
      visualAudioToggleDisabled={visualAudioToggleDisabled}
      onToggleVisualAudio={onToggleVisualAudio}
      liveRuntimeControls={
        liveRuntimeControlsModel?.visible ? (
          <HelixAskLiveRuntimeControls
            model={liveRuntimeControlsModel}
            onToolbarBridgeChange={handleLiveRuntimeBridgeChange}
          />
        ) : null
      }
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
