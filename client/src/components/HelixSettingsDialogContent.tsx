import * as React from "react";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AgiKnowledgePanel } from "@/components/AgiKnowledgePanel";
import CoreKnowledgePanel from "@/components/CoreKnowledgePanel";
import type { SettingsTab, StartSettings } from "@/hooks/useHelixStartSettings";
import { isFlagEnabled } from "@/lib/envFlags";

type Props = {
  settingsTab: SettingsTab;
  onSettingsTabChange: (tab: SettingsTab) => void;
  userSettings: StartSettings;
  updateSettings: (patch: Partial<StartSettings>) => void;
  onClearSavedChoice?: () => void;
  onClose: () => void;
};

export function HelixSettingsDialogContent({
  settingsTab,
  onSettingsTabChange,
  userSettings,
  updateSettings,
  onClearSavedChoice,
  onClose
}: Props) {
  const knowledgeEnabled = isFlagEnabled("ENABLE_KNOWLEDGE_PROJECTS", true);
  const activeTab = knowledgeEnabled ? settingsTab : "preferences";

  return (
    <DialogContent className="max-h-[85vh] overflow-y-auto border border-white/10 bg-[#070d1b] text-slate-100 sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle>Helix Start Settings</DialogTitle>
        <DialogDescription>
          Tune how this intro behaves on this device.
        </DialogDescription>
      </DialogHeader>
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (!knowledgeEnabled && value === "knowledge") return;
          onSettingsTabChange(value as SettingsTab);
        }}
        className="mt-4"
      >
        <TabsList className={`grid ${knowledgeEnabled ? "grid-cols-2" : "grid-cols-1"} rounded-xl bg-white/5 p-1 text-slate-200`}>
          <TabsTrigger
            value="preferences"
            className="rounded-lg px-2 py-1 text-sm data-[state=active]:bg-sky-500/20"
          >
            Preferences
          </TabsTrigger>
          {knowledgeEnabled && (
            <TabsTrigger
              value="knowledge"
              className="rounded-lg px-2 py-1 text-sm data-[state=active]:bg-sky-500/20"
            >
              AGI Knowledge
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="preferences" className="mt-4 space-y-3">
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
            description="Use the Desktop as the primary action button."
            checked={userSettings.preferDesktop}
            onChange={(value) => updateSettings({ preferDesktop: value })}
          />
          <PreferenceToggleRow
            id="show-zen"
            label="Show mission mantra"
            description="Keep the profile's guiding quote visible."
            checked={userSettings.showZen}
            onChange={(value) => updateSettings({ showZen: value })}
          />
          <PreferenceToggleRow
            id="splash-cursor"
            label="Splash cursor trail"
            description="Paint a fluid ribbon that follows your cursor."
            checked={userSettings.enableSplashCursor}
            onChange={(value) => updateSettings({ enableSplashCursor: value })}
          />
          <PreferenceToggleRow
            id="helix-ask-debug"
            label="Helix Ask debug context"
            description="Show which repo files were used to answer."
            checked={userSettings.showHelixAskDebug}
            onChange={(value) => updateSettings({ showHelixAskDebug: value })}
          />
          <PreferenceToggleRow
            id="powershell-debug"
            label="Developer terminal (PowerShell)"
            description="Use a local scratchpad for commands."
            checked={userSettings.showPowerShellDebug}
            onChange={(value) => updateSettings({ showPowerShellDebug: value })}
          />
          {userSettings.showPowerShellDebug && (
            <PowerShellTerminalPad
              value={userSettings.powerShellScratch}
              onChange={(value) => updateSettings({ powerShellScratch: value })}
            />
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              className="text-sm text-slate-300 underline-offset-2 hover:text-white hover:underline"
              onClick={() => {
                onClearSavedChoice?.();
              }}
            >
              Clear saved choice
            </button>
            <button
              className="rounded-lg bg-sky-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </TabsContent>
        {knowledgeEnabled && (
          <TabsContent value="knowledge" className="mt-4 max-h-[70vh] overflow-y-auto pr-1">
            <Tabs defaultValue="my">
              <TabsList className="mb-3 grid grid-cols-2 rounded-xl bg-white/5 p-1 text-slate-200">
                <TabsTrigger value="my" className="rounded-lg px-2 py-1 text-sm data-[state=active]:bg-sky-500/20">
                  My Knowledge
                </TabsTrigger>
                <TabsTrigger value="core" className="rounded-lg px-2 py-1 text-sm data-[state=active]:bg-sky-500/20">
                  Core Knowledge (read-only)
                </TabsTrigger>
              </TabsList>
              <TabsContent value="my" className="mt-0">
                <AgiKnowledgePanel />
              </TabsContent>
              <TabsContent value="core" className="mt-0">
                <CoreKnowledgePanel />
              </TabsContent>
            </Tabs>
            <div className="mt-4 flex justify-end">
              <button
                className="rounded-lg bg-sky-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </DialogContent>
  );
}

function PreferenceToggleRow({
  id,
  label,
  description,
  checked,
  onChange
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-slate-100">{label}</p>
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

function PowerShellTerminalPad({
  value,
  onChange
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
        const message =
          payload?.message ||
          payload?.error ||
          `Command failed (${response.status})`;
        throw new Error(message);
      }
      const stdout = typeof payload.stdout === "string" ? payload.stdout : "";
      const stderr = typeof payload.stderr === "string" ? payload.stderr : "";
      const combined = [stdout.trimEnd(), stderr.trimEnd()]
        .filter(Boolean)
        .join("\n");
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
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-slate-100">Developer terminal</p>
        <p className="text-xs text-slate-300">
          Scratchpad only. Use Copy to send the command to your local terminal.
        </p>
      </div>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Type PowerShell commands here..."
        className="min-h-[140px] border-white/10 bg-black/40 font-mono text-xs text-slate-200"
      />
      <div className="flex items-center gap-2">
        <button
          className="rounded-md border border-white/15 px-2 py-1 text-[11px] text-slate-200 hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleRun}
          disabled={!canRun}
        >
          {status === "running" ? "Running" : "Run"}
        </button>
        <button
          className="rounded-md border border-white/15 px-2 py-1 text-[11px] text-slate-200 hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleCopy}
          disabled={!canCopy}
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          className="rounded-md border border-white/15 px-2 py-1 text-[11px] text-slate-200 hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleClear}
          disabled={!value}
        >
          Clear
        </button>
      </div>
      {status !== "idle" && (
        <div className="rounded-md border border-white/10 bg-black/50 px-3 py-2 text-xs text-slate-200">
          <div className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">
            {status === "running" ? "Running" : status === "error" ? "Error" : "Output"}
            {exitCode != null ? ` (exit ${exitCode})` : ""}
            {truncated ? " (truncated)" : ""}
          </div>
          <pre className="whitespace-pre-wrap">{output || "..."}</pre>
        </div>
      )}
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
