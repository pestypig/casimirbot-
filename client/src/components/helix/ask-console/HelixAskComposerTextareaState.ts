import type { HelixAskComposerTextareaSurfaceProps } from "./HelixAskComposerTextareaSurface";

export type HelixAskComposerTextareaState = HelixAskComposerTextareaSurfaceProps;

export type HelixAskComposerTextareaStateOptions = HelixAskComposerTextareaSurfaceProps;

export function buildHelixAskComposerTextareaState({
  ariaDisabled,
  className,
  placeholder,
  onPaste,
  onInputValue,
  onSubmitRequested,
}: HelixAskComposerTextareaStateOptions): HelixAskComposerTextareaState {
  return {
    ariaDisabled,
    className,
    placeholder,
    onPaste,
    onInputValue,
    onSubmitRequested,
  };
}
