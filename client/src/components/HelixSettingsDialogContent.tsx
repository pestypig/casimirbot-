import * as React from "react";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AgiKnowledgePanel } from "@/components/AgiKnowledgePanel";
import CoreKnowledgePanel from "@/components/CoreKnowledgePanel";
import type { SettingsTab, StartSettings } from "@/hooks/useHelixStartSettings";
import { isFlagEnabled } from "@/lib/envFlags";
import {
  getVoiceCaptureDiagnosticsSnapshot,
  subscribeVoiceCaptureDiagnostics,
  type VoiceCaptureCheckpointStatus,
  type VoiceCaptureDiagnosticsSnapshot,
  type VoiceLaneTimelineDebugEvent,
  type VoiceCaptureWarningCode,
} from "@/lib/helix/voice-capture-diagnostics";

type Props = {
  settingsTab: SettingsTab;
  onSettingsTabChange: (tab: SettingsTab) => void;
  userSettings: StartSettings;
  updateSettings: (patch: Partial<StartSettings>) => void;
  onClearSavedChoice?: () => void;
  onClose: () => void;
};

const VOICE_WARNING_LABEL: Record<VoiceCaptureWarningCode, string> = {
  loopback_source: "Input appears to be loopback/output source.",
  flat_signal: "Signal looks flat for the active track.",
  recorder_stalled: "Recorder heartbeat stalled (no chunks recently).",
};

const VOICE_CHECKPOINT_STATUS_CLASS: Record<VoiceCaptureCheckpointStatus, string> = {
  idle: "border-slate-300/25 bg-slate-400/10 text-slate-200",
  ok: "border-emerald-300/40 bg-emerald-500/12 text-emerald-100",
  warn: "border-amber-300/40 bg-amber-500/12 text-amber-100",
  error: "border-rose-300/45 bg-rose-500/15 text-rose-100",
};

export function HelixSettingsDialogContent({
  settingsTab,
  onSettingsTabChange,
  userSettings,
  updateSettings,
  onClearSavedChoice,
  onClose,
}: Props) {
  const knowledgeEnabled = isFlagEnabled("ENABLE_KNOWLEDGE_PROJECTS", true);
  const activeSection = knowledgeEnabled ? settingsTab : "preferences";
  const [knowledgeSource, setKnowledgeSource] = React.useState<"my" | "core">("my");
  const [voiceDiagnostics, setVoiceDiagnostics] = React.useState<VoiceCaptureDiagnosticsSnapshot | null>(() =>
    getVoiceCaptureDiagnosticsSnapshot(),
  );

  React.useEffect(() => {
    setVoiceDiagnostics(getVoiceCaptureDiagnosticsSnapshot());
    return subscribeVoiceCaptureDiagnostics((snapshot) => {
      setVoiceDiagnostics(snapshot);
    });
  }, []);

  return (
    <DialogContent className="max-h-[88vh] w-full max-w-[min(44rem,calc(100vw-1rem))] overflow-y-auto rounded-lg border border-slate-700 bg-slate-950 p-0 text-slate-100 shadow-xl">
      <div className="sticky top-0 z-10 border-b border-slate-700 bg-slate-950 px-4 py-3">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Helix Start Settings</DialogTitle>
          <DialogDescription className="text-slate-300">
            Tune this device behavior with simple controls.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-3 flex items-center gap-2">
          <label htmlFor="helix-settings-section" className="text-xs font-medium text-slate-300">
            Section
          </label>
          <select
            id="helix-settings-section"
            value={activeSection}
            onChange={(event) => onSettingsTabChange(event.target.value as SettingsTab)}
            className="h-9 min-w-[220px] rounded-md border border-slate-600 bg-slate-900 px-2 text-sm text-slate-100"
          >
            <option value="preferences">Preferences</option>
            {knowledgeEnabled ? <option value="knowledge">AGI Knowledge</option> : null}
          </select>
        </div>
      </div>

      <div className="space-y-3 px-4 py-4">
        {activeSection === "preferences" ? (
          <>
            <PreferenceToggleRow
              id="remember-choice"
              label="Remember my mission view"
              description="Auto-select the profile you last explored."
              checked={userSettings.rememberChoice}
              onChange={(value) => updateSettings({ rememberChoice: value })}
            />
            <PreferenceToggleRow
              id="prefer-desktop"
              label="Prefer Desktop launch"
              description="Use Desktop as the primary action button."
              checked={userSettings.preferDesktop}
              onChange={(value) => updateSettings({ preferDesktop: value })}
            />
            <PreferenceToggleRow
              id="show-zen"
              label="Show mission mantra"
              description="Keep the profile quote visible."
              checked={userSettings.showZen}
              onChange={(value) => updateSettings({ showZen: value })}
            />
            <PreferenceToggleRow
              id="splash-cursor"
              label="Splash cursor trail"
              description="Show a cursor ribbon effect."
              checked={userSettings.enableSplashCursor}
              onChange={(value) => updateSettings({ enableSplashCursor: value })}
            />
            <PreferenceToggleRow
              id="helix-ask-debug"
              label="Helix Ask debug context"
              description="Show repo file debug context."
              checked={userSettings.showHelixAskDebug}
              onChange={(value) => updateSettings({ showHelixAskDebug: value })}
            />
            <PreferenceToggleRow
              id="helix-voice-diagnostics"
              label="Voice capture diagnostics panel"
              description="Show live mic diagnostics in this settings dialog."
              checked={userSettings.showHelixVoiceCaptureDiagnostics}
              onChange={(value) => updateSettings({ showHelixVoiceCaptureDiagnostics: value })}
            />
            {userSettings.showHelixVoiceCaptureDiagnostics ? (
              <VoiceCaptureDiagnosticsPanel snapshot={voiceDiagnostics} />
            ) : null}
            <PreferenceToggleRow
              id="helix-voice-event-timeline-debug"
              label="Voice lane event timeline debug"
              description="Show prompt, brief, final, and chunk traffic events with copy export."
              checked={userSettings.showHelixVoiceEventTimelineDebug}
              onChange={(value) => updateSettings({ showHelixVoiceEventTimelineDebug: value })}
            />
            {userSettings.showHelixVoiceEventTimelineDebug ? (
              <VoiceEventTimelineDebugPanel snapshot={voiceDiagnostics} />
            ) : null}
            <PreferenceToggleRow
              id="powershell-debug"
              label="Developer terminal (PowerShell)"
              description="Show local scratchpad command panel."
              checked={userSettings.showPowerShellDebug}
              onChange={(value) => updateSettings({ showPowerShellDebug: value })}
            />
            {userSettings.showPowerShellDebug ? (
              <PowerShellTerminalPad
                value={userSettings.powerShellScratch}
                onChange={(value) => updateSettings({ powerShellScratch: value })}
              />
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                className="rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
                onClick={() => {
                  onClearSavedChoice?.();
                }}
              >
                Clear saved choice
              </button>
              <button
                className="rounded-md border border-cyan-300 bg-cyan-300 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-200"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </>
        ) : null}

        {activeSection === "knowledge" ? (
          <>
            {knowledgeEnabled ? (
              <>
                <div className="flex items-center gap-2">
                  <label htmlFor="helix-settings-knowledge-source" className="text-xs font-medium text-slate-300">
                    Knowledge source
                  </label>
                  <select
                    id="helix-settings-knowledge-source"
                    value={knowledgeSource}
                    onChange={(event) => setKnowledgeSource(event.target.value as "my" | "core")}
                    className="h-9 min-w-[220px] rounded-md border border-slate-600 bg-slate-900 px-2 text-sm text-slate-100"
                  >
                    <option value="my">My Knowledge</option>
                    <option value="core">Core Knowledge (read-only)</option>
                  </select>
                </div>
                <div className="max-h-[60vh] overflow-y-auto rounded-md border border-slate-700 bg-slate-950 p-2">
                  {knowledgeSource === "my" ? <AgiKnowledgePanel /> : <CoreKnowledgePanel />}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-300">AGI Knowledge is disabled by feature flag.</p>
            )}
            <div className="flex justify-end pt-1">
              <button
                className="rounded-md border border-cyan-300 bg-cyan-300 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-200"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </>
        ) : null}
      </div>
    </DialogContent>
  );
}

function PreferenceToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2">
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-slate-100">{label}</p>
        <p className="text-xs text-slate-300">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
      />
    </div>
  );
}

function VoiceCaptureDiagnosticsPanel({
  snapshot,
}: {
  snapshot: VoiceCaptureDiagnosticsSnapshot | null;
}) {
  const [nowMs, setNowMs] = React.useState(() => Date.now());
  const [copied, setCopied] = React.useState(false);
  const exportPayload = React.useMemo(
    () => (snapshot ? buildVoiceAudioDebugCopyPayload(snapshot) : ""),
    [snapshot],
  );

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const formatCaptureTimestamp = React.useCallback(
    (value: number | null): string => {
      if (value === null) return "never";
      const elapsedMs = Math.max(0, nowMs - value);
      if (elapsedMs < 1000) return "just now";
      if (elapsedMs < 60_000) return `${Math.round(elapsedMs / 1000)}s ago`;
      return `${Math.round(elapsedMs / 60_000)}m ago`;
    },
    [nowMs],
  );

  const handleCopy = async () => {
    if (!exportPayload || !navigator?.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(exportPayload);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-2 rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">Capture diagnostics</p>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!exportPayload}
          className={`rounded border px-2 py-1 text-[10px] uppercase tracking-[0.14em] ${
            exportPayload
              ? "border-cyan-300/50 bg-cyan-400/15 text-cyan-100 hover:bg-cyan-300/25"
              : "border-slate-600 text-slate-500"
          }`}
        >
          {copied ? "copied" : "copy audio debug"}
        </button>
      </div>
      {!snapshot ? (
        <p className="text-xs text-slate-300">
          No active voice capture yet. Enable the mic in Helix Ask to stream diagnostics here.
        </p>
      ) : (
        <div className="max-h-[44vh] space-y-2 overflow-y-auto pr-1 text-[10px] text-foreground/90">
          <p className="uppercase tracking-[0.14em] text-slate-400">
            Input level{" "}
            {snapshot.voiceSignalState === "speech"
              ? "(speech-level signal)"
              : snapshot.voiceSignalState === "low"
                ? "(low-level signal)"
                : "(waiting for device audio)"}
          </p>
          <div className="grid grid-cols-12 gap-0.5 rounded border border-white/10 bg-slate-900/70 p-1">
            {Array.from({ length: 12 }).map((_, index) => {
              const threshold = (index + 1) / 12;
              const active = snapshot.voiceMonitorLevel >= threshold;
              return (
                <span
                  key={`settings-voice-level-${index}`}
                  className={`h-2 rounded-[2px] ${
                    active
                      ? snapshot.voiceMonitorLevel >= 0.75
                        ? "bg-emerald-300"
                        : snapshot.voiceMonitorLevel >= 0.45
                          ? "bg-cyan-300"
                          : "bg-sky-300"
                      : "bg-slate-700/80"
                  }`}
                />
              );
            })}
          </div>
          {snapshot.warnings.length > 0 ? (
            <div className="space-y-1">
              {snapshot.warnings.map((warning) => (
                <p
                  key={`settings-voice-warning-${warning}`}
                  className="rounded border border-amber-300/35 bg-amber-500/12 px-2 py-1 text-[9px] uppercase tracking-[0.14em] text-amber-100"
                >
                  {VOICE_WARNING_LABEL[warning]}
                </p>
              ))}
            </div>
          ) : null}
          <p className="uppercase tracking-[0.14em] text-slate-500">
            rms {snapshot.rmsRaw.toFixed(4)} | db {snapshot.rmsDb.toFixed(1)} | peak {snapshot.peak.toFixed(4)} |
            floor {snapshot.noiseFloor.toFixed(4)}
          </p>
          <p className="uppercase tracking-[0.14em] text-slate-500">
            roundtrip {snapshot.lastRoundtripMs ?? "--"}ms | adaptive gate{" "}
            {Math.round(snapshot.voiceMonitorThreshold * 1000) / 1000}
          </p>
          {snapshot.playback ? (
            <>
              <p className="uppercase tracking-[0.14em] text-slate-500">
                playback {snapshot.playback.kind} | chunks {snapshot.playback.chunkCount} | first audio{" "}
                {snapshot.playback.enqueueToFirstAudioMs ?? "--"}ms
              </p>
              <p className="uppercase tracking-[0.14em] text-slate-500">
                total {snapshot.playback.totalPlaybackMs ?? "--"}ms | cache h/m{" "}
                {snapshot.playback.cacheHitCount}/{snapshot.playback.cacheMissCount}
                {snapshot.playback.cancelReason ? ` | cancel ${snapshot.playback.cancelReason}` : ""}
              </p>
              <p className="uppercase tracking-[0.14em] text-slate-500">
                provider {snapshot.playback.providerHeader ?? "n/a"} | profile {snapshot.playback.profileHeader ?? "n/a"}
                {snapshot.playback.normalizationBenchmarkHeader
                  ? ` | norm ${clipDiagnosticsText(snapshot.playback.normalizationBenchmarkHeader, 84)}`
                  : ""}
                {snapshot.playback.normalizationSkipReasonHeader
                  ? ` | skip ${clipDiagnosticsText(snapshot.playback.normalizationSkipReasonHeader, 84)}`
                  : ""}
              </p>
            </>
          ) : null}
          {snapshot.playbackOutput ? (
            <>
              <p className="uppercase tracking-[0.14em] text-slate-500">
                output {snapshot.playbackOutput.expectedPath} | gain target{" "}
                {snapshot.playbackOutput.gainTarget.toFixed(2)} | unlocked{" "}
                {snapshot.playbackOutput.audioUnlocked ? "yes" : "no"}
                {snapshot.playbackOutput.audioSessionType
                  ? ` | session ${snapshot.playbackOutput.audioSessionType}`
                  : ""}
                {snapshot.playbackOutput.forcedDirectMobile ? " | forced-direct-mobile" : ""}
              </p>
              <p className="uppercase tracking-[0.14em] text-slate-500">
                element{" "}
                {snapshot.playbackOutput.audioElementReady
                  ? `${snapshot.playbackOutput.audioElementMuted ? "muted" : "live"} @ ${
                      snapshot.playbackOutput.audioElementVolume ?? "--"
                    }`
                  : "none"}{" "}
                | graph {snapshot.playbackOutput.audioGraphAttached ? "attached" : "detached"} | ctx{" "}
                {snapshot.playbackOutput.audioContextState ?? "n/a"}
                {typeof snapshot.playbackOutput.audioContextSampleRate === "number"
                  ? ` ${Math.round(snapshot.playbackOutput.audioContextSampleRate)}hz`
                  : ""}
                {typeof snapshot.playbackOutput.gainNodeValue === "number"
                  ? ` | gain ${snapshot.playbackOutput.gainNodeValue.toFixed(2)}`
                  : ""}
              </p>
            </>
          ) : null}
          <p className="uppercase tracking-[0.14em] text-slate-500">
            recorder {snapshot.voiceRecorderMimeType ?? "unknown"} | track {snapshot.voiceTrackMuted ? "muted" : "live"}
            {snapshot.voiceInputDeviceLabel ? ` | ${clipDiagnosticsText(snapshot.voiceInputDeviceLabel, 56)}` : ""}
          </p>
          <p className="uppercase tracking-[0.14em] text-slate-500">
            chunk cadence {snapshot.chunksPerSecond.toFixed(2)} /s | chunks {snapshot.mediaChunkCount} | bytes{" "}
            {snapshot.mediaBytes}
          </p>
          <p className="uppercase tracking-[0.14em] text-slate-500">
            last chunk age{" "}
            {snapshot.lastChunkAgeMs === null ? "--" : `${Math.round(Math.max(0, snapshot.lastChunkAgeMs))}ms`}
          </p>
          <div className="flex flex-wrap gap-1">
            {snapshot.checkpoints.map((checkpoint) => (
              <span
                key={`settings-checkpoint-${checkpoint.key}`}
                className={`inline-flex rounded border px-1.5 py-0.5 uppercase tracking-[0.14em] ${VOICE_CHECKPOINT_STATUS_CLASS[checkpoint.status]}`}
                title={checkpoint.message ?? undefined}
              >
                {checkpoint.label}
                {checkpoint.lastAtMs !== null ? ` (${formatCaptureTimestamp(checkpoint.lastAtMs)})` : ""}
              </span>
            ))}
          </div>
          {snapshot.segments.length > 0 ? (
            <div className="space-y-1">
              <p className="uppercase tracking-[0.18em] text-slate-400">Last 5 segments</p>
              {snapshot.segments.map((segment) => (
                <div
                  key={`settings-segment-attempt-${segment.id}`}
                  className="rounded border border-white/10 bg-white/5 px-1.5 py-1"
                >
                  <p className="uppercase tracking-[0.14em] text-slate-500">
                    {segment.status} | dispatch {segment.dispatch} | {Math.round(segment.durationMs)}ms
                  </p>
                  <p className="uppercase tracking-[0.14em] text-slate-500">
                    captured {formatCaptureTimestamp(segment.cutAtMs)}
                    {segment.sttLatencyMs !== null ? ` | stt ${Math.round(segment.sttLatencyMs)}ms` : ""}
                    {segment.engine ? ` | ${segment.engine}` : ""}
                  </p>
                  {segment.transcriptPreview ? (
                    <p className="mt-1 text-[10px] text-slate-200">
                      {clipDiagnosticsText(segment.transcriptPreview, 220)}
                    </p>
                  ) : null}
                  {segment.error ? <p className="mt-1 text-[10px] text-rose-200">{segment.error}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-300">Listening for first segment...</p>
          )}
        </div>
      )}
    </div>
  );
}

function VoiceEventTimelineDebugPanel({
  snapshot,
}: {
  snapshot: VoiceCaptureDiagnosticsSnapshot | null;
}) {
  const [copied, setCopied] = React.useState(false);
  const timelineEvents = React.useMemo(
    () =>
      [...(snapshot?.timelineEvents ?? [])]
        .sort((a, b) => a.atMs - b.atMs)
        .slice(-220),
    [snapshot?.timelineEvents],
  );
  const exportPayload = React.useMemo(() => {
    if (timelineEvents.length === 0) return "";
    return timelineEvents.map((event) => JSON.stringify(event)).join("\n");
  }, [timelineEvents]);

  const handleCopy = async () => {
    if (!exportPayload || !navigator?.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(exportPayload);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-2 rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
          Voice lane event timeline
        </p>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!exportPayload}
          className={`rounded border px-2 py-1 text-[10px] uppercase tracking-[0.14em] ${
            exportPayload
              ? "border-cyan-300/50 bg-cyan-400/15 text-cyan-100 hover:bg-cyan-300/25"
              : "border-slate-600 text-slate-500"
          }`}
        >
          {copied ? "copied" : "copy logs"}
        </button>
      </div>
      {timelineEvents.length === 0 ? (
        <p className="text-xs text-slate-300">
          No voice lane events yet. Start a mic turn and reasoning run to capture timeline continuity.
        </p>
      ) : (
        <>
          <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
            {timelineEvents.length} events
          </p>
          <div className="max-h-[44vh] overflow-y-auto rounded border border-slate-700/80 bg-slate-950/70 p-2 font-mono text-[10px] leading-5 text-slate-200">
            {timelineEvents.map((event) => (
              <p key={event.id} className="whitespace-pre-wrap break-words">
                {formatVoiceTimelineDebugEvent(event)}
              </p>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function buildVoiceAudioDebugCopyPayload(snapshot: VoiceCaptureDiagnosticsSnapshot): string {
  const timelineTail = [...(snapshot.timelineEvents ?? [])]
    .sort((a, b) => a.atMs - b.atMs)
    .slice(-60);
  const payload = {
    capturedAt: new Date(snapshot.updatedAtMs).toISOString(),
    micArmState: snapshot.micArmState,
    voiceInputState: snapshot.voiceInputState,
    voiceSignalState: snapshot.voiceSignalState,
    voiceInputDeviceLabel: snapshot.voiceInputDeviceLabel,
    voiceTrackMuted: snapshot.voiceTrackMuted,
    voiceRecorderMimeType: snapshot.voiceRecorderMimeType,
    audioLevels: {
      rmsRaw: snapshot.rmsRaw,
      rmsDb: snapshot.rmsDb,
      peak: snapshot.peak,
      noiseFloor: snapshot.noiseFloor,
      monitorLevel: snapshot.voiceMonitorLevel,
      monitorThreshold: snapshot.voiceMonitorThreshold,
    },
    captureCadence: {
      chunksPerSecond: snapshot.chunksPerSecond,
      mediaChunkCount: snapshot.mediaChunkCount,
      mediaBytes: snapshot.mediaBytes,
      lastChunkAgeMs: snapshot.lastChunkAgeMs,
      lastRoundtripMs: snapshot.lastRoundtripMs,
      warnings: snapshot.warnings,
    },
    playback: snapshot.playback ?? null,
    playbackOutput: snapshot.playbackOutput ?? null,
    checkpoints: snapshot.checkpoints.map((checkpoint) => ({
      key: checkpoint.key,
      status: checkpoint.status,
      message: checkpoint.message,
      lastAtMs: checkpoint.lastAtMs,
    })),
    recentSegments: snapshot.segments.slice(-5),
    timelineTail,
  };
  return JSON.stringify(payload, null, 2);
}

function formatVoiceTimelineDebugEvent(event: VoiceLaneTimelineDebugEvent): string {
  const timestamp = Number.isFinite(event.atMs)
    ? new Date(event.atMs).toISOString().split("T")[1]?.replace("Z", "") ?? "time"
    : "time";
  const fields = [
    `source=${event.source}`,
    `kind=${event.kind}`,
    event.status ? `status=${event.status}` : null,
    event.turnKey ? `turn=${clipDiagnosticsText(event.turnKey, 28)}` : null,
    event.traceId ? `trace=${clipDiagnosticsText(event.traceId, 26)}` : null,
    typeof event.hlcMs === "number" ? `hlc=${event.hlcMs}` : null,
    typeof event.seq === "number" ? `seq=${event.seq}` : null,
    typeof event.revision === "number" ? `rev=${event.revision}` : null,
    event.attemptId ? `attempt=${clipDiagnosticsText(event.attemptId, 18)}` : null,
    event.utteranceId ? `utt=${clipDiagnosticsText(event.utteranceId, 18)}` : null,
    typeof event.chunkIndex === "number" ? `chunk=${event.chunkIndex + 1}/${event.chunkCount ?? "?"}` : null,
    event.briefSource ? `brief=${event.briefSource}` : null,
    event.finalSource ? `final=${event.finalSource}` : null,
    event.suppressionCause ? `cause=${event.suppressionCause}` : null,
    event.authorityRejectStage ? `stage=${event.authorityRejectStage}` : null,
    event.causalRefId ? `causal=${clipDiagnosticsText(event.causalRefId, 24)}` : null,
    event.detail ? `detail=${clipDiagnosticsText(event.detail, 96)}` : null,
    event.text ? `text=${clipDiagnosticsText(event.text, 150)}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
  return `[${timestamp}] ${fields}`;
}

function clipDiagnosticsText(source: string, maxChars: number): string {
  const text = source.trim();
  if (!text) return "";
  if (maxChars <= 0) return "";
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 1).trimEnd()}...`;
}

function PowerShellTerminalPad({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "running" | "done" | "error">("idle");
  const [output, setOutput] = React.useState("");
  const [exitCode, setExitCode] = React.useState<number | null>(null);
  const [truncated, setTruncated] = React.useState(false);
  const canCopy = value.trim().length > 0;
  const canRun = value.trim().length > 0 && status !== "running";

  const handleCopy = async () => {
    if (!navigator?.clipboard?.writeText || !canCopy) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // ignore clipboard failures
    }
  };

  const handleClear = () => onChange("");

  const handleRun = async () => {
    if (!canRun) return;
    setStatus("running");
    setOutput("");
    setExitCode(null);
    setTruncated(false);
    try {
      const response = await fetch("/api/dev-terminal/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: value }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = payload?.message || payload?.error || `Command failed (${response.status})`;
        throw new Error(message);
      }
      const stdout = typeof payload.stdout === "string" ? payload.stdout : "";
      const stderr = typeof payload.stderr === "string" ? payload.stderr : "";
      const combined = [stdout.trimEnd(), stderr.trimEnd()].filter(Boolean).join("\n");
      const decorated = appendTerminalHints(combined);
      setOutput(decorated || "Command completed with no output.");
      setExitCode(typeof payload.code === "number" ? payload.code : null);
      setTruncated(Boolean(payload.truncated));
      setStatus("done");
    } catch (error) {
      setOutput(error instanceof Error ? error.message : String(error));
      setStatus("error");
    }
  };

  return (
    <div className="space-y-3 rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2">
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-slate-100">Developer terminal</p>
        <p className="text-xs text-slate-300">
          Scratchpad only. Use Copy to send the command to your local terminal.
        </p>
      </div>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Type PowerShell commands here..."
        className="min-h-[140px] border-slate-600 bg-slate-950 font-mono text-xs text-slate-100 placeholder:text-slate-500"
      />
      <div className="flex items-center gap-2">
        <button
          className="rounded-md border border-slate-600 bg-slate-950 px-2 py-1 text-[11px] text-slate-100 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleRun}
          disabled={!canRun}
        >
          {status === "running" ? "Running" : "Run"}
        </button>
        <button
          className="rounded-md border border-slate-600 bg-slate-950 px-2 py-1 text-[11px] text-slate-100 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleCopy}
          disabled={!canCopy}
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          className="rounded-md border border-slate-600 bg-slate-950 px-2 py-1 text-[11px] text-slate-100 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleClear}
          disabled={!value}
        >
          Clear
        </button>
      </div>
      {status !== "idle" ? (
        <div className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100">
          <div className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">
            {status === "running" ? "Running" : status === "error" ? "Error" : "Output"}
            {exitCode != null ? ` (exit ${exitCode})` : ""}
            {truncated ? " (truncated)" : ""}
          </div>
          <pre className="whitespace-pre-wrap">{output || "..."}</pre>
        </div>
      ) : null}
    </div>
  );
}

function appendTerminalHints(output: string): string {
  if (!output) return output;
  const hints: string[] = [];
  if (
    /rg\s+:\s+The term 'rg' is not recognized/i.test(output) ||
    /rg: command not found/i.test(output)
  ) {
    hints.push(
      "rg not found. Install with: winget install BurntSushi.ripgrep",
      "PowerShell alternative: Select-String -Path <file> -Pattern \"<text>\"",
    );
  }
  if (!hints.length) return output;
  return `${output}\n\n[hint] ${hints.join("\n[hint] ")}`;
}
