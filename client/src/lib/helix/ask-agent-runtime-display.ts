import type {
  HelixAgentRuntimeDescriptor,
  HelixAgentRuntimeId,
} from "@shared/helix-agent-runtime";

type RecordLike = Record<string, unknown>;

export const DEFAULT_HELIX_AGENT_RUNTIME_PROVIDERS: HelixAgentRuntimeDescriptor[] = [
  {
    id: "helix",
    label: "Helix Ask Native",
    enabled: true,
    experimental: false,
    permission_profile: {
      id: "helix-native",
      label: "Helix native governed runtime",
      allows: {
        observe: true,
        read: true,
        act: true,
        write: false,
        shell: false,
        codeMutation: false,
      },
    },
    supports: {
      streaming: true,
      workstationTools: true,
      codeMutation: false,
    },
  },
];

function readRecord(value: unknown): RecordLike | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;
}

function coerceText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return String(value);
  } catch {
    return "";
  }
}

export function isHelixAgentRuntimeId(value: unknown): value is HelixAgentRuntimeId {
  return value === "helix" || value === "codex" || value === "future";
}

function normalizeHelixAgentProvider(value: unknown): HelixAgentRuntimeDescriptor | null {
  const record = readRecord(value);
  if (!record || !isHelixAgentRuntimeId(record.id)) return null;
  const supports = readRecord(record.supports);
  const permissionProfile = readRecord(record.permission_profile);
  const permissionAllows = readRecord(permissionProfile?.allows);
  const fallbackPermissionProfile = record.id === "codex" || record.id === "future"
    ? {
        id: "read-observe" as const,
        label: "Read/observe only",
        allows: {
          observe: true,
          read: true,
          act: false,
          write: false,
          shell: false,
          codeMutation: false,
        },
      }
    : DEFAULT_HELIX_AGENT_RUNTIME_PROVIDERS[0].permission_profile;
  const fallbackLabel =
    record.id === "codex"
      ? "Codex Workstation Mode"
      : record.id === "future"
        ? "Future Agent Wrapper"
        : "Helix Ask Native";
  return {
    id: record.id,
    label: coerceText(record.label).trim() || fallbackLabel,
    enabled: record.enabled === true,
    experimental: record.experimental === true,
    permission_profile: {
      id: permissionProfile?.id === "read-observe" ||
        permissionProfile?.id === "read-observe-act" ||
        permissionProfile?.id === "helix-native"
        ? permissionProfile.id
        : fallbackPermissionProfile.id,
      label: coerceText(permissionProfile?.label).trim() || fallbackPermissionProfile.label,
      allows: {
        observe: typeof permissionAllows?.observe === "boolean" ? permissionAllows.observe : fallbackPermissionProfile.allows.observe,
        read: typeof permissionAllows?.read === "boolean" ? permissionAllows.read : fallbackPermissionProfile.allows.read,
        act: typeof permissionAllows?.act === "boolean" ? permissionAllows.act : fallbackPermissionProfile.allows.act,
        write: typeof permissionAllows?.write === "boolean" ? permissionAllows.write : fallbackPermissionProfile.allows.write,
        shell: typeof permissionAllows?.shell === "boolean" ? permissionAllows.shell : fallbackPermissionProfile.allows.shell,
        codeMutation: typeof permissionAllows?.codeMutation === "boolean"
          ? permissionAllows.codeMutation
          : fallbackPermissionProfile.allows.codeMutation,
      },
    },
    supports: {
      streaming: supports?.streaming === true,
      workstationTools: supports?.workstationTools === true,
      codeMutation: supports?.codeMutation === true,
    },
  };
}

export function normalizeHelixAgentProvidersResponse(value: unknown): HelixAgentRuntimeDescriptor[] {
  const record = readRecord(value);
  const rawProviders: unknown[] = Array.isArray(record?.providers)
    ? record.providers
    : Array.isArray(value)
      ? value
      : [];
  const providers = rawProviders
    .map((entry: unknown) => normalizeHelixAgentProvider(entry))
    .filter((entry: HelixAgentRuntimeDescriptor | null): entry is HelixAgentRuntimeDescriptor => Boolean(entry));
  const hasHelix = providers.some((provider: HelixAgentRuntimeDescriptor) => provider.id === "helix");
  return hasHelix ? providers : [...DEFAULT_HELIX_AGENT_RUNTIME_PROVIDERS, ...providers];
}

export function resolveSelectedHelixAgentRuntime(
  requested: unknown,
  providers: HelixAgentRuntimeDescriptor[],
): HelixAgentRuntimeId {
  const candidate = isHelixAgentRuntimeId(requested) ? requested : "helix";
  const provider = providers.find((entry: HelixAgentRuntimeDescriptor) => entry.id === candidate);
  if (provider?.enabled) return provider.id;
  return "helix";
}

export function resolveNextSelectableHelixAgentRuntime(
  current: unknown,
  providers: HelixAgentRuntimeDescriptor[],
): HelixAgentRuntimeId {
  const enabledProviders = providers.filter((provider) => provider.enabled);
  if (enabledProviders.length === 0) return "helix";
  const currentRuntime = resolveSelectedHelixAgentRuntime(current, providers);
  const currentIndex = enabledProviders.findIndex((provider) => provider.id === currentRuntime);
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % enabledProviders.length : 0;
  return enabledProviders[nextIndex]?.id ?? "helix";
}

export function formatHelixAgentRuntimeShortLabel(provider: HelixAgentRuntimeDescriptor | null | undefined): string {
  if (provider?.id === "codex") return "Codex";
  if (provider?.id === "future") return "Future";
  return "Helix";
}

export function resolveHelixAskActualAgentProviderLabel(
  response: unknown,
  fallbackProviders: HelixAgentRuntimeDescriptor[] = DEFAULT_HELIX_AGENT_RUNTIME_PROVIDERS,
): string | null {
  const record = readRecord(response);
  const debug = readRecord(record?.debug);
  const selectedProvider =
    readRecord(record?.selected_agent_provider) ??
    readRecord(debug?.selected_agent_provider);
  const selectedProviderId = selectedProvider?.id;
  const runtime = isHelixAgentRuntimeId(record?.agent_runtime)
    ? record?.agent_runtime
    : isHelixAgentRuntimeId(debug?.agent_runtime)
      ? debug?.agent_runtime
      : isHelixAgentRuntimeId(selectedProviderId)
        ? selectedProviderId
        : null;
  if (!runtime) return null;
  const explicitLabel = coerceText(selectedProvider?.label).trim();
  if (explicitLabel) return `Provider: ${explicitLabel}`;
  const provider = fallbackProviders.find((entry: HelixAgentRuntimeDescriptor) => entry.id === runtime);
  const fallbackLabel =
    runtime === "codex"
      ? "Codex Workstation Mode"
      : runtime === "future"
        ? "Future Agent Wrapper"
        : "Helix Ask Native";
  return `Provider: ${provider?.label || fallbackLabel}`;
}
