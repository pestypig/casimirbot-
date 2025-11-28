import React from "react";
import StressOverlay from "@/components/HullViewer/StressOverlay";

export default function StressMapPanel() {
  return (
    <div className="h-full w-full overflow-auto bg-slate-950/80 p-3">
      <StressOverlay enabled floating={false} className="w-full" />
    </div>
  );
}
