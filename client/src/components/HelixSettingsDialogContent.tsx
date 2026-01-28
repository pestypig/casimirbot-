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
    <DialogContent
      className="mood-transition-scope relative max-h-[min(88vh,calc(100vh-2.5rem),1060px)] w-full max-w-[calc(100vw-2.5rem)] overflow-y-auto border border-primary/45 bg-card/98 text-foreground shadow-[0_48px_140px_hsl(var(--primary)/0.38)] sm:max-w-[min(64rem,calc(100vw-3.5rem))] sm:rounded-2xl"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(140%_190%_at_6%_10%,hsl(var(--primary)/0.34)_0%,transparent_70%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-80 bg-[radial-gradient(150%_210%_at_96%_8%,hsl(var(--primary)/0.24)_0%,transparent_74%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-70 bg-[linear-gradient(120deg,hsl(var(--primary)/0.12)_0%,transparent_46%,hsl(var(--ring)/0.12)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-75 bg-[radial-gradient(160%_200%_at_50%_92%,hsl(var(--primary)/0.22)_0%,transparent_72%)]"
        aria-hidden
      />
      <div className="relative">
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
          <TabsList
            className={`grid ${
              knowledgeEnabled ? "grid-cols-2" : "grid-cols-1"
            } rounded-xl border border-primary/35 bg-background/70 p-1 text-muted-foreground shadow-[inset_0_0_36px_hsl(var(--primary)/0.12)]`}
          >
            <TabsTrigger
              value="preferences"
              className="rounded-lg px-2 py-1 text-sm data-[state=active]:bg-primary/28 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_26px_hsl(var(--primary)/0.36)]"
            >
              Preferences
            </TabsTrigger>
            {knowledgeEnabled && (
              <TabsTrigger
                value="knowledge"
                className="rounded-lg px-2 py-1 text-sm data-[state=active]:bg-primary/28 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_26px_hsl(var(--primary)/0.36)]"
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
                className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                onClick={() => {
                  onClearSavedChoice?.();
                }}
              >
                Clear saved choice
              </button>
              <button
                className="rounded-lg border border-primary/40 bg-primary/92 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_32px_hsl(var(--primary)/0.4)] hover:bg-primary"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </TabsContent>
          {knowledgeEnabled && (
            <TabsContent value="knowledge" className="mt-4 max-h-[70vh] overflow-y-auto pr-1">
              <Tabs defaultValue="my">
                <TabsList className="mb-3 grid grid-cols-2 rounded-xl border border-primary/35 bg-background/70 p-1 text-muted-foreground shadow-[inset_0_0_34px_hsl(var(--primary)/0.12)]">
                  <TabsTrigger
                    value="my"
                    className="rounded-lg px-2 py-1 text-sm data-[state=active]:bg-primary/28 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_26px_hsl(var(--primary)/0.36)]"
                  >
                    My Knowledge
                  </TabsTrigger>
                  <TabsTrigger
                    value="core"
                    className="rounded-lg px-2 py-1 text-sm data-[state=active]:bg-primary/28 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_26px_hsl(var(--primary)/0.36)]"
                  >
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
                  className="rounded-lg border border-primary/40 bg-primary/92 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_32px_hsl(var(--primary)/0.4)] hover:bg-primary"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
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
    <div className="relative overflow-hidden rounded-xl border border-primary/35 bg-background/72 px-4 py-3 shadow-[inset_0_0_34px_hsl(var(--primary)/0.12),0_18px_40px_hsl(var(--primary)/0.12)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-80 bg-[radial-gradient(170%_230%_at_6%_10%,hsl(var(--primary)/0.22)_0%,transparent_74%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-70 bg-[linear-gradient(120deg,hsl(var(--primary)/0.1)_0%,transparent_55%,hsl(var(--ring)/0.12)_100%)]"
        aria-hidden
      />
      <div className="relative flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={(value) => onChange(value === true)}
          className="shadow-[inset_0_0_0_1px_hsl(var(--foreground)/0.12)] data-[state=unchecked]:bg-foreground/10"
        />
      </div>
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
    <div className="relative space-y-3 overflow-hidden rounded-xl border border-primary/45 bg-background/78 px-4 py-3 shadow-[inset_0_0_32px_hsl(var(--primary)/0.1),0_16px_36px_hsl(var(--primary)/0.12)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-75 bg-[radial-gradient(170%_230%_at_8%_12%,hsl(var(--primary)/0.2)_0%,transparent_74%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-65 bg-[linear-gradient(120deg,hsl(var(--primary)/0.08)_0%,transparent_58%,hsl(var(--ring)/0.1)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(160%_200%_at_50%_94%,hsl(var(--primary)/0.24)_0%,transparent_74%)]"
        aria-hidden
      />
      <div className="relative space-y-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-foreground">Developer terminal</p>
          <p className="text-xs text-muted-foreground">
            Scratchpad only. Use Copy to send the command to your local terminal.
          </p>
        </div>
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Type PowerShell commands here..."
          className="min-h-[140px] border-primary/40 bg-card/70 font-mono text-xs text-foreground placeholder:text-muted-foreground shadow-[inset_0_0_24px_hsl(var(--primary)/0.08)]"
        />
        <div className="flex items-center gap-2">
          <button
            className="rounded-md border border-primary/55 bg-primary/10 px-2 py-1 text-[11px] text-foreground transition-colors hover:border-primary/85 hover:bg-primary/20 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleRun}
            disabled={!canRun}
          >
            {status === "running" ? "Running" : "Run"}
          </button>
          <button
            className="rounded-md border border-primary/50 bg-primary/8 px-2 py-1 text-[11px] text-foreground transition-colors hover:border-primary/80 hover:bg-primary/18 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleCopy}
            disabled={!canCopy}
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            className="rounded-md border border-primary/50 bg-primary/8 px-2 py-1 text-[11px] text-foreground transition-colors hover:border-primary/80 hover:bg-primary/18 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleClear}
            disabled={!value}
          >
            Clear
          </button>
        </div>
        {status !== "idle" && (
          <div className="rounded-md border border-primary/36 bg-background/62 px-3 py-2 text-xs text-foreground shadow-[inset_0_0_26px_hsl(var(--primary)/0.1)]">
            <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              {status === "running" ? "Running" : status === "error" ? "Error" : "Output"}
              {exitCode != null ? ` (exit ${exitCode})` : ""}
              {truncated ? " (truncated)" : ""}
            </div>
            <pre className="whitespace-pre-wrap">{output || "..."}</pre>
          </div>
        )}
      </div>
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
