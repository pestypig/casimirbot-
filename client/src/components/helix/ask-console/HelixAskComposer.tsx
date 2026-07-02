import {
  default as React,
  forwardRef,
  type ClipboardEventHandler,
  type FormEventHandler,
  type KeyboardEventHandler,
} from "react";
import { Search, Square } from "lucide-react";

export type HelixAskComposerProps = {
  value: string;
  disabled?: boolean;
  placeholder?: string;
  runtimeLabel?: string | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export const HELIX_ASK_CONSOLE_MAX_PROMPT_LINES = 10;

export type HelixAskComposerSubmitMode = "submit" | "stop";

export type HelixAskComposerViewModel = {
  inputPlaceholder: string;
  currentPlaceholder: string;
  maxPromptLines: number;
  textareaClassName: string;
  submitMode: HelixAskComposerSubmitMode;
  submitAriaLabel: "Submit prompt" | "Stop generation";
  submitTitle: "Submit prompt" | "Stop generation";
  submitButtonType: "submit" | "button";
  submitIcon: "search" | "square";
};

export function buildHelixAskComposerPlaceholder(args: {
  placeholder?: string | null;
  runtimeLabel?: string | null;
}): string {
  const explicitPlaceholder = args.placeholder?.trim();
  if (explicitPlaceholder) return explicitPlaceholder;
  const runtimeLabel = args.runtimeLabel?.trim() || "Helix";
  return `Ask ${runtimeLabel} about this workspace`;
}

export function buildHelixAskComposerViewModel(args: {
  busy: boolean;
  placeholder?: string | null;
  runtimeLabel?: string | null;
}): HelixAskComposerViewModel {
  const inputPlaceholder = buildHelixAskComposerPlaceholder({
    placeholder: args.placeholder,
    runtimeLabel: args.runtimeLabel,
  });
  const submitMode: HelixAskComposerSubmitMode = args.busy ? "stop" : "submit";
  return {
    inputPlaceholder,
    currentPlaceholder: args.busy ? "Add another question..." : inputPlaceholder,
    maxPromptLines: HELIX_ASK_CONSOLE_MAX_PROMPT_LINES,
    textareaClassName:
      "helix-ask-textarea w-full min-w-0 resize-none bg-transparent text-[16px] leading-6 text-slate-100 placeholder:text-slate-500 focus:outline-none sm:text-sm",
    submitMode,
    submitAriaLabel: args.busy ? "Stop generation" : "Submit prompt",
    submitTitle: args.busy ? "Stop generation" : "Submit prompt",
    submitButtonType: args.busy ? "button" : "submit",
    submitIcon: args.busy ? "square" : "search",
  };
}

export type HelixAskComposerTextareaProps = {
  ariaDisabled?: boolean;
  className: string;
  placeholder: string;
  onPaste?: ClipboardEventHandler<HTMLTextAreaElement>;
  onInputValue: (value: string, target: HTMLTextAreaElement) => void;
  onSubmitRequested: (form: HTMLFormElement | null) => void;
};

export const HelixAskComposerTextarea = forwardRef<HTMLTextAreaElement, HelixAskComposerTextareaProps>(
  function HelixAskComposerTextarea(
    {
      ariaDisabled = false,
      className,
      placeholder,
      onPaste,
      onInputValue,
      onSubmitRequested,
    },
    ref,
  ) {
    const handleInput: FormEventHandler<HTMLTextAreaElement> = (event) => {
      onInputValue(event.currentTarget.value, event.currentTarget);
    };
    const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
      if (event.key !== "Enter" || event.shiftKey) return;
      event.preventDefault();
      onSubmitRequested(event.currentTarget.form);
    };

    return (
      <textarea
        aria-label="Ask Helix"
        aria-disabled={ariaDisabled}
        className={className}
        ref={ref}
        placeholder={placeholder}
        rows={1}
        onPaste={onPaste}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
      />
    );
  },
);

export type HelixAskComposerSubmitButtonProps = {
  viewModel: HelixAskComposerViewModel;
  onSubmitIntent: () => void;
  onStop: () => void;
};

export function HelixAskComposerSubmitButton({
  viewModel,
  onSubmitIntent,
  onStop,
}: HelixAskComposerSubmitButtonProps) {
  return (
    <button
      data-helix-ask-action-item="true"
      aria-label={viewModel.submitAriaLabel}
      title={viewModel.submitTitle}
      className="inline-flex h-10 w-10 shrink-0 snap-center items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:opacity-60"
      onClick={viewModel.submitMode === "stop" ? onStop : onSubmitIntent}
      type={viewModel.submitButtonType}
    >
      {viewModel.submitIcon === "square" ? (
        <Square className="h-4 w-4" />
      ) : (
        <Search className="h-4 w-4" />
      )}
    </button>
  );
}

export function HelixAskComposer({
  value,
  disabled = false,
  placeholder,
  runtimeLabel,
  onChange,
  onSubmit,
}: HelixAskComposerProps) {
  const viewModel = buildHelixAskComposerViewModel({
    busy: disabled,
    placeholder,
    runtimeLabel,
  });
  return (
    <form
      className="flex min-w-0 items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <textarea
        aria-label="Ask Helix"
        className="min-h-10 flex-1 resize-none rounded border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100"
        disabled={disabled}
        placeholder={viewModel.currentPlaceholder}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
      <button
        aria-label="Submit prompt"
        className="inline-flex h-10 shrink-0 items-center rounded border border-cyan-300/35 bg-cyan-400/10 px-3 text-xs uppercase tracking-[0.14em] text-cyan-100 disabled:opacity-50"
        disabled={disabled || !value.trim()}
        type="submit"
      >
        Send
      </button>
    </form>
  );
}
