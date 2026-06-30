import type { CSSProperties, FormEventHandler, ReactNode } from "react";

export type HelixAskSurfaceFrameProps = {
  className?: string;
  layoutVariant: "hero" | "dock";
  maxWidthClassName: string;
  maxWidthStyle?: CSSProperties;
  surfaceBorderClassName: string;
  surfaceTintClassName: string;
  surfaceHaloClassName: string;
  isOffline: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onPrimeInteraction: () => void;
  children: ReactNode;
};

export function HelixAskSurfaceFrame({
  className,
  layoutVariant,
  maxWidthClassName,
  maxWidthStyle,
  surfaceBorderClassName,
  surfaceTintClassName,
  surfaceHaloClassName,
  isOffline,
  onSubmit,
  onPrimeInteraction,
  children,
}: HelixAskSurfaceFrameProps) {
  return (
    <div className={[className, layoutVariant === "dock" ? "min-h-0" : ""].filter(Boolean).join(" ")}>
      <form
        className={`w-full ${maxWidthClassName} transition-[max-width] duration-300 ease-out`}
        style={maxWidthStyle}
        onSubmit={onSubmit}
        onPointerDownCapture={onPrimeInteraction}
        onTouchStartCapture={onPrimeInteraction}
        onClickCapture={onPrimeInteraction}
      >
        <div
          className={`relative overflow-visible rounded-3xl border bg-slate-950/80 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur ${surfaceBorderClassName}`}
        >
          <div
            className={`pointer-events-none absolute inset-0 rounded-3xl ${surfaceTintClassName}`}
            aria-hidden
          />
          <div
            className={`pointer-events-none absolute inset-0 rounded-3xl ${surfaceHaloClassName}`}
            aria-hidden
          />
          <div className="relative">
            {isOffline ? (
              <div className="px-4 pt-3 text-[10px] uppercase tracking-[0.22em] text-amber-200/80">
                Offline - reconnecting
              </div>
            ) : null}
            {children}
          </div>
        </div>
      </form>
    </div>
  );
}
