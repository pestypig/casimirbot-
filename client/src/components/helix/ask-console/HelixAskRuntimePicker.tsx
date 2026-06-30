import type { HelixAgentRuntimeDescriptor, HelixAgentRuntimeId } from "@shared/helix-agent-runtime";
import { formatHelixAgentRuntimeShortLabel } from "@/lib/helix/ask-agent-runtime-display";

export type HelixAskRuntimePickerProps = {
  value: HelixAgentRuntimeId;
  providers: HelixAgentRuntimeDescriptor[];
  onChange: (value: HelixAgentRuntimeId) => void;
};

export type HelixAskRuntimePickerItem = {
  id: HelixAgentRuntimeId;
  label: string;
  shortLabel: string;
  enabled: boolean;
  experimental: boolean;
  selected: boolean;
  statusLabel: "exp" | "off" | "on";
};

export type HelixAskRuntimePickerModel = {
  selectedRuntime: HelixAgentRuntimeId;
  selectedLabel: string;
  enabledProviderCount: number;
  primaryButtonMode: "cycle" | "menu";
  items: HelixAskRuntimePickerItem[];
};

export function buildHelixAskRuntimePickerModel(args: {
  selectedRuntime: HelixAgentRuntimeId;
  providers: readonly HelixAgentRuntimeDescriptor[];
}): HelixAskRuntimePickerModel {
  const fallbackProvider = args.providers.find((provider) => provider.id === args.selectedRuntime) ?? args.providers[0] ?? null;
  const selectedRuntime = fallbackProvider?.id ?? args.selectedRuntime;
  const items = args.providers.map((provider) => {
    const shortLabel = formatHelixAgentRuntimeShortLabel(provider);
    return {
      id: provider.id,
      label: provider.label,
      shortLabel,
      enabled: provider.enabled,
      experimental: provider.experimental === true,
      selected: provider.id === selectedRuntime,
      statusLabel: provider.enabled ? (provider.experimental ? "exp" : "on") : "off",
    };
  });
  const enabledProviderCount = items.filter((item) => item.enabled).length;
  return {
    selectedRuntime,
    selectedLabel: formatHelixAgentRuntimeShortLabel(fallbackProvider),
    enabledProviderCount,
    primaryButtonMode: enabledProviderCount <= 2 ? "cycle" : "menu",
    items,
  };
}

export function HelixAskRuntimePicker({ value, providers, onChange }: HelixAskRuntimePickerProps) {
  const model = buildHelixAskRuntimePickerModel({
    selectedRuntime: value,
    providers,
  });
  return (
    <div className="inline-flex rounded-full border border-white/10 bg-black/20 p-0.5" role="group" aria-label="Choose Ask agent runtime">
      {model.items.map((provider) => (
        <button
          key={provider.id}
          type="button"
          className={`rounded-full px-2.5 py-1 text-xs ${
            provider.selected ? "bg-cyan-400/20 text-cyan-100" : "text-slate-400"
          }`}
          disabled={!provider.enabled}
          onClick={() => onChange(provider.id)}
        >
          {provider.shortLabel}
        </button>
      ))}
    </div>
  );
}
