import React from "react";
import type { HelixFriendsPartiesResponse } from "@shared/helix-friends-voice-party";
import { friendsPartiesApi } from "@/components/workstation/friends-parties/FriendsPartiesApi";

const BLADES = ["Workspace", "Mission", "Casimir Guide", "Live Room", "Environment", "System"] as const;
type Blade = typeof BLADES[number];

type GuideRow = {
  label: string;
  value?: string;
  action?: () => void;
  disabled?: boolean;
};

export function CasimirGuideOverlay(props: {
  open: boolean;
  onClose(): void;
  onOpenPanel(panelId: string): void;
}) {
  const [activeBlade, setActiveBlade] = React.useState<Blade>("Casimir Guide");
  const [social, setSocial] = React.useState<HelixFriendsPartiesResponse | null>(null);
  const [socialState, setSocialState] = React.useState<"loading" | "ready" | "locked" | "unavailable">("loading");
  const dialogRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!props.open) return;
    setActiveBlade("Casimir Guide");
    setSocialState("loading");
    void friendsPartiesApi.list().then((value) => {
      setSocial(value);
      setSocialState("ready");
    }).catch((error: unknown) => {
      const status = typeof error === "object" && error && "status" in error
        ? Number((error as { status: number }).status)
        : 0;
      setSocialState(status === 401 || status === 403 ? "locked" : "unavailable");
    });
    window.setTimeout(() => dialogRef.current?.focus(), 0);
  }, [props.open]);

  const openPanel = React.useCallback((panelId: string) => {
    props.onOpenPanel(panelId);
    props.onClose();
  }, [props]);

  const acceptedFriends = social?.friendships.filter((item) => item.state === "accepted") ?? [];
  const onlineCount = acceptedFriends.filter((item) =>
    social?.presence.some((presence) =>
      presence.profile_id === item.peer.profile_id && presence.state !== "offline"))
    .length;
  const incomingCount = social?.friendships.filter((item) => item.state === "incoming").length ?? 0;
  const party = social?.party ?? null;
  const self = party?.members.find((member) => member.profile.profile_id === social?.profile?.profile_id);

  const openStart = React.useCallback(() => {
    props.onClose();
    window.setTimeout(() => document.getElementById("helix-start-button")?.click(), 0);
  }, [props]);

  const rows = React.useMemo((): GuideRow[] => {
    const socialValue = socialState === "ready"
      ? `${onlineCount} online${party ? ` · ${party.members.length} in party` : ""}`
      : socialState;
    if (activeBlade === "Casimir Guide") return [
      { label: "Friends & Voice Parties", value: socialValue, action: () => openPanel("friends-parties") },
      { label: "Ask Helix", action: () => openPanel("helix-ask") },
      { label: "Device Check", action: () => openPanel("device-check") },
      { label: "Open Main Menu", action: openStart },
      { label: "Return to Workstation", action: props.onClose },
    ];
    if (activeBlade === "Live Room") return [
      { label: "Friends online", value: socialState === "ready" ? String(onlineCount) : socialState,
        action: () => openPanel("friends-parties") },
      { label: "Voice party", value: party ? `${party.members.length} members · ${party.state}` : "Not active",
        action: () => openPanel("friends-parties") },
      { label: "Microphone", value: self ? `${self.media_state}${self.muted ? " · muted" : ""}` : "Not connected",
        action: () => openPanel("friends-parties") },
      { label: "GPT Live", value: party?.gpt_attachment_state ?? "detached",
        action: () => openPanel("friends-parties") },
      { label: "Invitations", value: String(incomingCount), action: () => openPanel("friends-parties") },
      { label: "Friends & party controls", value: "›", action: () => openPanel("friends-parties") },
    ];
    if (activeBlade === "Workspace") return [
      { label: "Docs & Papers", action: () => openPanel("docs-viewer") },
      { label: "Workstation Notes", action: () => openPanel("workstation-notes") },
      { label: "Open Main Menu", action: openStart },
    ];
    if (activeBlade === "Mission") return [
      { label: "Mission Go Board", action: () => openPanel("mission-go-board") },
      { label: "Task History", action: () => openPanel("agi-task-history") },
      { label: "Process Graph", action: () => openPanel("workstation-process-graph") },
    ];
    if (activeBlade === "Environment") return [
      { label: "Device Check", action: () => openPanel("device-check") },
      { label: "Local Harness", action: () => openPanel("local-harness") },
      { label: "Live Answer", action: () => openPanel("live-answer-environment") },
    ];
    return [
      { label: "Account & Sessions", action: () => openPanel("account-session") },
      { label: "Connections & Security", action: () => openPanel("connections-billing-security") },
      { label: "Desktop Updates", action: () => openPanel("desktop-updates") },
    ];
  }, [
    activeBlade, incomingCount, onlineCount, openPanel, openStart, party,
    props.onClose, self, socialState,
  ]);

  if (!props.open) return null;
  const bladeIndex = BLADES.indexOf(activeBlade);
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => { if (event.target === event.currentTarget) props.onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="casimir-guide-title"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === "Escape") props.onClose();
          if (event.key === "ArrowLeft") setActiveBlade(BLADES[Math.max(0, bladeIndex - 1)]);
          if (event.key === "ArrowRight") setActiveBlade(BLADES[Math.min(BLADES.length - 1, bladeIndex + 1)]);
        }}
        className="w-[min(760px,94vw)] overflow-hidden rounded-2xl border border-cyan-300/30 bg-slate-950/95 text-slate-100 shadow-[0_30px_100px_rgba(0,0,0,.75),0_0_45px_rgba(34,211,238,.12)] outline-none">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div><p id="casimir-guide-title" className="font-semibold">Casimir Guide</p><p className="text-xs text-slate-400">Quick status and navigation</p></div>
          <button onClick={props.onClose} aria-label="Close Casimir Guide" className="rounded px-3 py-1 text-sm text-slate-300 hover:bg-white/10">Esc</button>
        </header>
        <nav aria-label="Guide blades" className="flex overflow-x-auto border-b border-white/10 bg-black/20">
          {BLADES.map((blade) => (
            <button key={blade} onClick={() => setActiveBlade(blade)}
              aria-current={blade === activeBlade ? "page" : undefined}
              className={`min-w-fit flex-1 border-b-2 px-3 py-3 text-xs font-medium uppercase tracking-wide transition ${blade === activeBlade ? "border-cyan-300 bg-cyan-300/10 text-cyan-100" : "border-transparent text-slate-500 hover:text-slate-200"}`}>
              {blade}
            </button>
          ))}
        </nav>
        <section aria-label={`${activeBlade} options`} className="min-h-[310px] p-5">
          <h2 className="mb-3 text-lg font-medium">{activeBlade}</h2>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.025]">
            {rows.map((row, index) => (
              <button key={row.label} disabled={row.disabled} onClick={row.action}
                autoFocus={index === 0}
                className="flex w-full items-center justify-between gap-4 border-b border-white/10 px-4 py-3 text-left text-sm last:border-b-0 hover:bg-cyan-300/10 focus:bg-cyan-300/15 focus:outline-none disabled:opacity-40">
                <span>{row.label}</span><span className="text-xs text-slate-400">{row.value ?? "›"}</span>
              </button>
            ))}
          </div>
        </section>
        <footer className="flex flex-wrap gap-x-5 gap-y-1 border-t border-white/10 bg-black/25 px-5 py-3 text-xs text-slate-400">
          <span><b className="text-emerald-300">A / Enter</b> Select</span>
          <span><b className="text-rose-300">B / Esc</b> Close</span>
          <span><b className="text-cyan-300">← →</b> Change blade</span>
          <span><b className="text-amber-300">Y</b> Main Menu</span>
        </footer>
      </div>
    </div>
  );
}

