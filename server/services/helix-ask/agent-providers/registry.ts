import type { IncomingHttpHeaders } from "node:http";
import type { HelixAgentRuntimeDescriptor } from "@shared/helix-agent-runtime";
import type { HelixAgentProvider } from "./types";
import { selectHelixAgentRuntime } from "./runtime-select";
import { helixNativeProvider } from "./helix-native-provider";
import { codexProvider } from "./codex-provider";

const providers = new Map<string, HelixAgentProvider>([
  [helixNativeProvider.id, helixNativeProvider],
  [codexProvider.id, codexProvider],
]);

export function listHelixAgentProviders(): HelixAgentRuntimeDescriptor[] {
  return Array.from(providers.values()).map((provider) => ({
    id: provider.id,
    label: provider.label,
    enabled: provider.enabled(),
    experimental: provider.id !== "helix",
    permission_profile: provider.permissionProfile,
    supports: provider.supports,
  }));
}

export function resolveHelixAgentProvider(input: {
  body: Record<string, unknown>;
  headers?: IncomingHttpHeaders;
}): HelixAgentProvider {
  const requested = selectHelixAgentRuntime(input);
  const provider = providers.get(requested);

  if (provider?.enabled()) {
    return provider;
  }

  return helixNativeProvider;
}
