import * as React from "react";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
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
    <DialogContent className="border border-white/10 bg-[#070d1b] text-slate-100 sm:max-w-4xl">
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
