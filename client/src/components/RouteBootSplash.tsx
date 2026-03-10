import HelixMarkIcon from "@/components/icons/HelixMarkIcon";

type RouteBootSplashProps = {
  message?: string;
  detail?: string;
};

export default function RouteBootSplash({
  message = "Starting up...",
  detail = "Loading Helix experience",
}: RouteBootSplashProps) {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#040915] px-6 text-slate-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ backgroundColor: "var(--surface-laminate, #040915)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(140%_200%_at_8%_12%,hsl(var(--primary)/0.24)_0%,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80 bg-[radial-gradient(150%_210%_at_96%_10%,hsl(var(--primary)/0.18)_0%,transparent_72%)]"
      />

      <div
        className="relative z-10 flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-card/78 px-6 py-7 text-center shadow-[0_35px_110px_hsl(var(--primary)/0.18)]"
        role="status"
        aria-live="polite"
      >
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.3)]">
          <HelixMarkIcon
            className="h-9 w-9 animate-spin text-primary"
            strokeWidth={36}
            aria-label="Helix arrow loader"
          />
        </div>
        <p className="text-sm font-semibold text-foreground">{message}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
