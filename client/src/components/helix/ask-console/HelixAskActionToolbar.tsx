import React, { type ChangeEventHandler, type ReactNode, type Ref } from "react";
import { Headphones, Image as ImageIcon, Mic, Plus, RotateCcw } from "lucide-react";

export type HelixAskActionToolbarProps = {
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
  showMicButton?: boolean;
  micInputMode?: "voice_lane" | "live_runtime";
  micDisabled?: boolean;
  voiceTranscribing?: boolean;
  onToggleMic: () => void;
  showRetryVoiceSample?: boolean;
  retryVoiceSampleDisabled?: boolean;
  onRetryVoiceSample: () => void;
  showVisualCaptureControls?: boolean;
  visualSituationSourceStatus: "idle" | "active" | "requesting" | "error" | string;
  onCaptureVisualSource: () => void;
  visualSituationIncludeAudio: boolean;
  displayAudioStatus?: "idle" | "active" | "requesting" | "error" | string;
  visualAudioToggleDisabled?: boolean;
  onToggleVisualAudio: () => void;
  runtimePicker: ReactNode;
  liveRuntimeControls?: ReactNode;
  submitButton: ReactNode;
};

function readAttachButtonClassName(args: {
  hasReadyAttachment?: boolean;
  hasAnyAttachment?: boolean;
}): string {
  if (args.hasReadyAttachment) {
    return "border-violet-300/50 bg-violet-400/15 text-violet-100 hover:bg-violet-400/20";
  }
  if (args.hasAnyAttachment) {
    return "border-amber-300/45 bg-amber-400/12 text-amber-100 hover:bg-amber-400/20";
  }
  return "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10";
}

function readMicButtonClassName(args: {
  micEnabled: boolean;
  voiceTranscribing?: boolean;
}): string {
  if (!args.micEnabled) return "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10";
  if (args.voiceTranscribing) return "border-cyan-300/45 bg-cyan-400/12 text-cyan-100";
  return "border-emerald-300/55 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/20";
}

function readVisualSourceButtonClassName(status: string): string {
  if (status === "active") return "border-cyan-300/50 bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/20";
  if (status === "requesting") return "border-amber-300/45 bg-amber-400/12 text-amber-100";
  if (status === "error") return "border-rose-300/45 bg-rose-400/12 text-rose-100 hover:bg-rose-400/20";
  return "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10";
}

function readVisualAudioButtonClassName(args: {
  visualSituationIncludeAudio: boolean;
  displayAudioStatus?: string;
}): string {
  if (!args.visualSituationIncludeAudio) return "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10";
  if (args.displayAudioStatus === "error") return "border-rose-300/45 bg-rose-400/12 text-rose-100 hover:bg-rose-400/20";
  return "border-teal-300/50 bg-teal-400/15 text-teal-100 hover:bg-teal-400/20";
}

const actionButtonBaseClassName =
  "inline-flex h-10 w-10 shrink-0 snap-center items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:opacity-60";

export function HelixAskActionToolbar({
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
  showMicButton = true,
  micInputMode = "voice_lane",
  micDisabled = false,
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
  runtimePicker,
  liveRuntimeControls = null,
  submitButton,
}: HelixAskActionToolbarProps) {
  const micTitle = micInputMode === "live_runtime"
    ? micEnabled ? "Disable Live Voice microphone" : "Enable Live Voice microphone"
    : micEnabled ? "Disable microphone" : "Enable microphone";
  const visualAudioTitle = visualSituationIncludeAudio
    ? "Disable tab audio for visual capture"
    : "Enable tab audio for visual capture";

  return (
    <div className="relative min-w-0 flex-1">
      <button
        type="button"
        aria-label="Scroll Ask controls left"
        className={`absolute inset-y-0 left-0 z-10 w-12 rounded-l-full bg-gradient-to-r from-slate-950/95 via-slate-950/50 to-transparent transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${
          canScrollLeft ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onScrollLeft}
        disabled={!canScrollLeft}
      />
      <div
        ref={carouselRef}
        className="flex min-w-0 snap-x snap-mandatory items-center justify-end gap-2 overflow-x-auto scroll-smooth px-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onImageSelect}
        />
        {liveRuntimeControls}
        {runtimePicker}
        <button
          type="button"
          data-helix-ask-action-item="true"
          aria-label="Attach image"
          title="Attach image"
          className={`${actionButtonBaseClassName} ${readAttachButtonClassName({
            hasReadyAttachment,
            hasAnyAttachment,
          })}`}
          onClick={onAttachImage}
          disabled={attachDisabled}
        >
          <Plus className="h-4 w-4" />
        </button>
        {showMicButton ? (
          <button
            type="button"
            data-helix-ask-action-item="true"
            aria-label={micTitle}
            aria-pressed={micEnabled}
            title={micTitle}
            data-microphone-owner={micInputMode}
            className={`${actionButtonBaseClassName} ${readMicButtonClassName({
              micEnabled,
              voiceTranscribing,
            })}`}
            onClick={onToggleMic}
            disabled={micDisabled}
          >
            <Mic className={`h-4 w-4 ${micEnabled || voiceTranscribing ? "animate-pulse" : ""}`} />
          </button>
        ) : null}
        {showRetryVoiceSample ? (
          <button
            type="button"
            data-helix-ask-action-item="true"
            aria-label="Retry saved voice sample"
            title="Retry saved voice sample"
            className="inline-flex h-10 w-10 shrink-0 snap-center items-center justify-center rounded-full border border-amber-300/45 bg-amber-400/12 text-amber-100 transition hover:bg-amber-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70 disabled:opacity-60"
            onClick={onRetryVoiceSample}
            disabled={retryVoiceSampleDisabled}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        ) : null}
        {showVisualCaptureControls ? (
          <>
            <button
              type="button"
              data-helix-ask-action-item="true"
              aria-label="Capture visual source for Situation Room"
              aria-pressed={visualSituationSourceStatus === "active"}
              title="Capture visual source"
              className={`${actionButtonBaseClassName} ${readVisualSourceButtonClassName(visualSituationSourceStatus)}`}
              onClick={onCaptureVisualSource}
            >
              <ImageIcon className={`h-4 w-4 ${visualSituationSourceStatus === "active" ? "animate-pulse" : ""}`} />
            </button>
            <button
              type="button"
              data-helix-ask-action-item="true"
              aria-label={visualAudioTitle}
              aria-pressed={visualSituationIncludeAudio}
              title={visualAudioTitle}
              className={`${actionButtonBaseClassName} ${readVisualAudioButtonClassName({
                visualSituationIncludeAudio,
                displayAudioStatus,
              })}`}
              onClick={onToggleVisualAudio}
              disabled={visualAudioToggleDisabled}
            >
              <Headphones
                className={`h-4 w-4 ${
                  visualSituationIncludeAudio && displayAudioStatus !== "error" ? "animate-pulse" : ""
                }`}
              />
            </button>
          </>
        ) : null}
        {submitButton}
      </div>
      <button
        type="button"
        aria-label="Scroll Ask controls right"
        className={`absolute inset-y-0 right-0 z-10 w-12 rounded-r-full bg-gradient-to-l from-slate-950/95 via-slate-950/50 to-transparent transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${
          canScrollRight ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onScrollRight}
        disabled={!canScrollRight}
      />
    </div>
  );
}
