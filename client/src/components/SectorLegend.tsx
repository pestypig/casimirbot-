import React from "react";

const LEGEND_ITEMS = [
  { color: "#2979ff", label: "NEG (negative lobe)" },
  { color: "#ff9800", label: "POS (payback lobe)" },
  { color: "#9e9e9e", label: "Neutral" },
  { color: "rgba(255,255,255,0.25)", label: "QI window" },
] as const;

export const SectorLegend: React.FC = () => {
  return (
    <div
      aria-label="Sector role legend"
      style={{
        display: "flex",
        gap: 16,
        padding: "6px 10px",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(6px)",
      }}
    >
      {LEGEND_ITEMS.map((item) => (
        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            aria-hidden
            style={{
              width: 12,
              height: 12,
              borderRadius: 2,
              background: item.color,
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 12, opacity: 0.9 }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default SectorLegend;
