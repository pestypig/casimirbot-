import type { IncomingHttpHeaders } from "node:http";
import type { HelixAgentRuntimeDescriptor } from "@shared/helix-agent-runtime";
import type { HelixAgentProvider } from "./types";
import { selectHelixAgentRuntime } from "./runtime-select";
import { helixNativeProvider } from "./helix-native-provider";
import { codexProvider } from "./codex-provider";
import { futureProvider } from "./future-provider";
import { listHelixCapabilityLanes } from "../capability-lanes/registry";

// Build the registry only when it is used. Goal-runtime and terminal-authority
// modules can be reached while the Codex provider import graph is still being
// initialized; eagerly reading `codexProvider.id` here turns that valid module
// cycle into a startup-order crash. ESM imports are live bindings, so deferring
// this read preserves the same provider instances without duplicating runtime
// ownership or introducing a second registry.
const registeredProviders = (): HelixAgentProvider[] => [
  helixNativeProvider,
  codexProvider,
  futureProvider,
];

const providerMap = (): Map<string, HelixAgentProvider> =>
  new Map(
    registeredProviders().map((provider) => [provider.id, provider] as const),
  );

export function listHelixAgentProviders(): HelixAgentRuntimeDescriptor[] {
  return registeredProviders().map((provider) => ({
    id: provider.id,
    label: provider.label,
    enabled: provider.enabled(),
    experimental: provider.id !== "codex",
    permission_profile: provider.permissionProfile,
    ...(provider.runtimeStatus ? { runtime_status: provider.runtimeStatus() } : {}),
    capability_lane_manifest: listHelixCapabilityLanes({ provider }),
    supports: provider.supports,
  }));
}

export function resolveDefaultHelixAgentProvider(): HelixAgentProvider {
  return resolveHelixAgentProvider({ body: {} });
}

export function getHelixAgentProviderById(id: string): HelixAgentProvider | null {
  return providerMap().get(id) ?? null;
}

export function resolveHelixAgentProvider(input: {
  body: Record<string, unknown>;
  headers?: IncomingHttpHeaders;
}): HelixAgentProvider {
  const requested = selectHelixAgentRuntime(input);
  const provider = providerMap().get(requested);

  if (provider) {
    return provider;
  }

  return codexProvider;
}
