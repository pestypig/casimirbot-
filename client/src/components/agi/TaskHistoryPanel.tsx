import React from "react";
import { useAgiChatStore } from "@/store/useAgiChatStore";
import { Clock, MessageSquare } from "lucide-react";

export default function TaskHistoryPanel() {
  const { sessions, activeId, setActive, deleteSession } = useAgiChatStore();
  const list = Object.values(sessions).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  return (
    <div className="h-full w-full flex flex-col bg-[var(--panel-bg,#0f1115)] text-[var(--panel-fg,#e6e6e6)]">
      <div className="px-10 py-6 border-b border-white/10 flex items-center gap-3">
        <Clock size={16} /> <span className="font-semibold">Task History</span>
      </div>
      <div className="flex-1 overflow-auto">
        {list.length === 0 && (
          <div className="opacity-70 text-sm p-10">No sessions yet.</div>
        )}
        {list.map((session) => (
          <div
            key={session.id}
            className={`px-10 py-4 border-b border-white/5 ${
              session.id === activeId ? "bg-white/5" : "hover:bg-white/5"
            }`}
          >
            <div className="flex items-center justify-between">
              <button
                className="text-left"
                onClick={() => {
                  setActive(session.id);
                  window.dispatchEvent(
                    new CustomEvent("open-helix-panel", { detail: { id: "agi-essence-console" } })
                  );
                }}
              >
                <div className="font-medium">{session.title || "Untitled chat"}</div>
                <div className="text-[11px] opacity-60">
                  {new Date(session.createdAt).toLocaleString()}
                </div>
                <div className="text-[11px] opacity-80 flex items-center gap-1 mt-1">
                  <MessageSquare size={12} /> {session.messages.length} messages
                </div>
              </button>
              <button
                className="text-[11px] opacity-70 hover:opacity-100 underline"
                onClick={() => deleteSession(session.id)}
                title="Delete session"
              >
                delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
