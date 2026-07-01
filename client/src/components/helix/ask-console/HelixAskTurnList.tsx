import {
  default as React,
  forwardRef,
  type ReactNode,
  type Ref,
  type UIEventHandler,
} from "react";

export type HelixAskTurnListProps = {
  className: string;
  onScroll?: UIEventHandler<HTMLDivElement>;
  consoleDebugSnapshot?: unknown;
  children: ReactNode;
  activeTurnStreamPanel?: ReactNode;
  bottomRef?: Ref<HTMLDivElement>;
};

const HELIX_ASK_TURN_LIST_ANIMATION_CSS =
  "@keyframes helixAskTurnFadeIn{0%{opacity:0;transform:translate3d(0,8px,0)}100%{opacity:1;transform:translate3d(0,0,0)}}@keyframes helixAskTurnLineFadeIn{0%{opacity:0;transform:translate3d(0,5px,0)}100%{opacity:1;transform:translate3d(0,0,0)}}.helix-ask-turn-enter{animation:helixAskTurnFadeIn 220ms ease-out both}.helix-ask-turn-line-enter{animation:helixAskTurnLineFadeIn 180ms ease-out both}@media (prefers-reduced-motion:reduce){.helix-ask-turn-enter,.helix-ask-turn-line-enter{animation:none}}";

export const HelixAskTurnList = forwardRef<HTMLDivElement, HelixAskTurnListProps>(
  function HelixAskTurnList(
    {
      className,
      onScroll,
      consoleDebugSnapshot,
      children,
      activeTurnStreamPanel,
      bottomRef,
    },
    ref,
  ) {
    return (
      <>
        <style>{HELIX_ASK_TURN_LIST_ANIMATION_CSS}</style>
        <div
          ref={ref}
          className={className}
          onScroll={onScroll}
        >
          {consoleDebugSnapshot ? (
            <details
              className="rounded-lg border border-cyan-300/25 bg-cyan-950/15 px-3 py-2 text-xs text-cyan-50"
              data-testid="helix-ask-console-debug"
            >
              <summary className="cursor-pointer select-none text-[10px] uppercase tracking-[0.2em] text-cyan-200">
                Console assembly debug
              </summary>
              <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded border border-cyan-300/15 bg-black/30 p-2 font-mono text-[10px] leading-4 text-cyan-50">
                {JSON.stringify(consoleDebugSnapshot, null, 2)}
              </pre>
            </details>
          ) : null}
          {children}
          {activeTurnStreamPanel}
          <div
            ref={bottomRef}
            className="h-px w-full"
            aria-hidden
            data-testid="helix-ask-reply-list-bottom"
          />
        </div>
      </>
    );
  },
);
