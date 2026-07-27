import React from "react";
import AgentAccountBindingReadiness from "@/components/agent-access/AgentAccountBindingReadiness";
import AgentAccessGuide from "@/components/agent-access/AgentAccessGuide";

export default function AgentAccessPanel() {
  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(8,145,178,0.12),_transparent_36%),#020617]">
      <div className="px-4 pt-4">
        <AgentAccountBindingReadiness />
      </div>
      <AgentAccessGuide compact />
    </div>
  );
}
