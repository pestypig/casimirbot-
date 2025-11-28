import React from "react";

type PhoenixBadgeProps = {
  className?: string;
};

export function PhoenixBadge({ className = "" }: PhoenixBadgeProps) {
  return (
    <div
      className={`pointer-events-none select-none text-[11px] leading-tight bg-[rgba(10,14,26,0.78)] border border-[rgba(118,174,255,0.3)] text-[rgba(210,226,255,0.95)] rounded-md px-3 py-2 shadow-sm ${className}`}
      style={{ backdropFilter: "blur(3px)" }}
      role="note"
      aria-label="Phoenix averaging window notice"
    >
      <div className="font-semibold text-white/90">Frame: bridge proper time</div>
      <div>Curvature = GR proxy from Casimir tile &lt;Tmunu&gt;,</div>
      <div>averaged over local light-crossing windows ("Phoenix").</div>
      <div className="opacity-75">No outside observer sees this as simultaneous.</div>
    </div>
  );
}
