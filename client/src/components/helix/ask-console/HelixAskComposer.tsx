export type HelixAskComposerProps = {
  value: string;
  disabled?: boolean;
  placeholder?: string;
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

export function buildHelixAskComposerViewModel(args: {
  busy: boolean;
  placeholder?: string | null;
}): HelixAskComposerViewModel {
  const inputPlaceholder = args.placeholder?.trim() || "Ask anything about this system";
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

export function HelixAskComposer({
  value,
  disabled = false,
  placeholder = "Ask Helix about this workspace",
  onChange,
  onSubmit,
}: HelixAskComposerProps) {
  const viewModel = buildHelixAskComposerViewModel({
    busy: disabled,
    placeholder,
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
