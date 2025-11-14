import { useMemo } from "react";
import { QI_S_THRESH } from "../../../shared/schema";
import { useQiStore } from "../store/useQiStore";

type QiCounts = {
  green: number;
  amber: number;
  red: number;
  worst: number;
};

type QiGuardBadgeProps = {
  className?: string;
  onClick?: () => void;
  getCounts?: () => QiCounts;
  title?: string;
};

export function QiGuardBadge({
  className,
  onClick,
  getCounts,
  title = "QI",
}: QiGuardBadgeProps) {
  const countsSelector = useQiStore((state) => state.counts);
  const connected = useQiStore((state) => state.connected);
  const lastFrameAt = useQiStore((state) => state.lastFrameAt);
  const counts = (getCounts ?? countsSelector)();

  const red = Number(counts.red) || 0;
  const amber = Number(counts.amber) || 0;
  const green = Number(counts.green) || 0;
  const worst = Number.isFinite(counts.worst) ? counts.worst : 0;
  const totalTiles = green + amber + red;
  const hasTiles = totalTiles > 0;
  const secondsSinceLastFrame =
    typeof lastFrameAt === "number" ? Math.max(0, (Date.now() - lastFrameAt) / 1000) : null;
  const recencyLabel =
    secondsSinceLastFrame === null
      ? "--"
      : secondsSinceLastFrame >= 10
        ? `${Math.round(secondsSinceLastFrame)}s`
        : `${secondsSinceLastFrame.toFixed(1)}s`;

  const { color, status } = useMemo(() => {
    if (!connected) return { color: "#6B7280", status: "Offline" };
    if (!hasTiles) return { color: "#9CA3AF", status: "Warming" };
    if (red > 0) return { color: "#E53935", status: "At risk" };
    if (amber > 0) return { color: "#FDD835", status: "Watch" };
    return { color: "#43A047", status: "OK" };
  }, [connected, amber, red, hasTiles]);

  const thresholdsText = `amber >= ${QI_S_THRESH.amber.toFixed(2)} ; red >= ${QI_S_THRESH.red.toFixed(2)}`;
  const worstLabel = hasTiles ? worst.toFixed(2) : "--";
  const countsLabel = hasTiles ? `G:${green} A:${amber} R:${red}` : "G:-- A:-- R:--";
  const lastUpdateLabel =
    secondsSinceLastFrame === null ? "no frames yet" : `${recencyLabel} ago`;
  const titleText = hasTiles
    ? `${title} - ${status} | Worst S ${worstLabel} (${thresholdsText}) | ${countsLabel} | Last update ${lastUpdateLabel}`
    : `${title} - ${status}; awaiting lattice sample | Last update ${lastUpdateLabel}`;

  return (
    <div
      role={onClick ? "button" : "group"}
      onClick={onClick}
      title={titleText}
      data-testid="qi-guard-badge"
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 10px",
        borderRadius: 999,
        background: "var(--guard-badge-bg, rgba(255,255,255,0.06))",
        border: "1px solid var(--guard-badge-border, rgba(255,255,255,0.08))",
        fontSize: 12,
        lineHeight: 1.2,
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        width: "100%",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: color,
          boxShadow: "0 0 0 1px rgba(0,0,0,0.15) inset",
          flexShrink: 0,
        }}
      />
      <strong style={{ letterSpacing: 0.2 }}>{title}</strong>
      <span style={{ opacity: 0.9 }}>{status}</span>
      <span style={{ opacity: 0.8, fontVariantNumeric: "tabular-nums" }}>{countsLabel}</span>
      <span style={{ opacity: 0.7, fontVariantNumeric: "tabular-nums" }}>
        {hasTiles ? `Smax:${worstLabel}` : "Smax:--"}
      </span>
      <span style={{ opacity: 0.6, fontVariantNumeric: "tabular-nums" }}>dt:{recencyLabel}</span>
    </div>
  );
}
