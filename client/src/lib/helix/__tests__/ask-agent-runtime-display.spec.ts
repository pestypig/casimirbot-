import { describe, expect, it } from "vitest";

import {
  formatHelixAgentRuntimeShortLabel,
  normalizeHelixAgentProvidersResponse,
  resolveHelixAskActualAgentProviderLabel,
  resolveHelixAskModelUsageLabel,
  resolveNextSelectableHelixAgentRuntime,
  resolveSelectedHelixAgentRuntime,
} from "@/lib/helix/ask-agent-runtime-display";

describe("Helix Ask agent runtime display", () => {
  it("normalizes Helix, Codex, and Future providers from backend provider responses", () => {
    const providers = normalizeHelixAgentProvidersResponse({
      providers: [
        {
          id: "helix",
          label: "Helix Ask Native",
          enabled: true,
          experimental: false,
          supports: { streaming: true, workstationTools: true, codeMutation: false },
        },
        {
          id: "codex",
          label: "Codex Workstation Mode",
          enabled: true,
          experimental: true,
          permission_profile: {
            id: "read-observe",
            label: "Read/observe only; Helix may project non-mutating UI receipts",
            allows: {
              observe: true,
              read: true,
              act: false,
              write: false,
              shell: false,
              codeMutation: false,
            },
          },
          supports: { streaming: true, workstationTools: true, codeMutation: true },
        },
        {
          id: "future",
          label: "Future Agent Wrapper",
          enabled: false,
          experimental: true,
          supports: { streaming: false, workstationTools: true, codeMutation: false },
        },
      ],
    });

    expect(providers.map((provider) => provider.label)).toEqual([
      "Helix Ask Native",
      "Codex Workstation Mode",
      "Future Agent Wrapper",
    ]);
    expect(providers.find((provider) => provider.id === "codex")?.permission_profile).toMatchObject({
      id: "read-observe",
      allows: {
        read: true,
        act: false,
        write: false,
        shell: false,
        codeMutation: false,
      },
    });
    expect(providers.find((provider) => provider.id === "future")?.permission_profile).toMatchObject({
      id: "read-observe",
      allows: {
        read: true,
        write: false,
        shell: false,
        codeMutation: false,
      },
    });
  });

  it("keeps disabled providers visible but not selectable", () => {
    const providers = normalizeHelixAgentProvidersResponse({
      providers: [
        {
          id: "helix",
          label: "Helix Ask Native",
          enabled: true,
          experimental: false,
          supports: { streaming: true, workstationTools: true, codeMutation: false },
        },
        {
          id: "codex",
          label: "Codex Workstation Mode",
          enabled: false,
          experimental: true,
          supports: { streaming: true, workstationTools: true, codeMutation: true },
        },
      ],
    });

    expect(providers.find((provider) => provider.id === "codex")?.enabled).toBe(false);
    expect(resolveSelectedHelixAgentRuntime("codex", providers)).toBe("helix");
    expect(resolveNextSelectableHelixAgentRuntime("helix", providers)).toBe("helix");
  });

  it("cycles only through enabled providers and formats runtime short labels", () => {
    const providers = normalizeHelixAgentProvidersResponse({
      providers: [
        { id: "helix", label: "Helix Ask Native", enabled: true, supports: {} },
        { id: "codex", label: "Codex Workstation Mode", enabled: true, supports: {} },
        { id: "future", label: "Future Agent Wrapper", enabled: false, supports: {} },
      ],
    });

    expect(resolveSelectedHelixAgentRuntime("codex", providers)).toBe("codex");
    expect(resolveSelectedHelixAgentRuntime("future", providers)).toBe("helix");
    expect(resolveNextSelectableHelixAgentRuntime("helix", providers)).toBe("codex");
    expect(resolveNextSelectableHelixAgentRuntime("codex", providers)).toBe("helix");
    expect(formatHelixAgentRuntimeShortLabel(providers.find((provider) => provider.id === "codex"))).toBe("Codex");
    expect(formatHelixAgentRuntimeShortLabel(providers.find((provider) => provider.id === "future"))).toBe("Future");
    expect(formatHelixAgentRuntimeShortLabel(providers.find((provider) => provider.id === "helix"))).toBe("Helix");
  });

  it("labels actual provider metadata from response/debug fields without inferring from runtime loops", () => {
    expect(
      resolveHelixAskActualAgentProviderLabel({
        agent_runtime: "codex",
        selected_agent_provider: {
          id: "codex",
          label: "Codex Workstation Mode",
        },
      }),
    ).toBe("Provider: Codex Workstation Mode");
    expect(
      resolveHelixAskActualAgentProviderLabel({
        debug: {
          agent_runtime: "future",
          selected_agent_provider: {
            id: "future",
            label: "Future Agent Wrapper",
          },
        },
      }),
    ).toBe("Provider: Future Agent Wrapper");
    expect(
      resolveHelixAskActualAgentProviderLabel({
        debug: {
          agent_runtime_loop: {
            schema: "helix.agent_runtime_loop.v1",
            iterations: [{ chosen_capability: "repo-code.search" }],
          },
        },
      }),
    ).toBeNull();
  });

  it("labels configured model metadata from response/debug fields and Codex args", () => {
    expect(
      resolveHelixAskModelUsageLabel({
        debug: {
          llm_http_model_configured: "gpt-5",
        },
      }),
    ).toBe("Model: gpt-5");
    expect(
      resolveHelixAskModelUsageLabel({
        codex_args: ["--model", "gpt-5-codex"],
      }),
    ).toBe("Model: gpt-5-codex");
    expect(
      resolveHelixAskModelUsageLabel({
        debug: {
          selected_agent_provider: {
            id: "codex",
            label: "Codex Workstation Mode",
            model: "gpt-5-codex",
          },
        },
      }),
    ).toBe("Model: gpt-5-codex");
  });

  it("labels models from Codex agent runtime loop metadata", () => {
    expect(
      resolveHelixAskModelUsageLabel({
        debug: {
          agent_runtime_loop: {
            schema: "helix.agent_runtime_loop.v1",
            iterations: [
              {
                chosen_capability: "scientific-calculator.solve_expression",
                llm_model: "gpt-5-codex",
              },
            ],
          },
        },
      }),
    ).toBe("Model: gpt-5-codex");
    expect(
      resolveHelixAskModelUsageLabel({
        debug: {
          agent_runtime_loop: {
            codex_args: ["--sandbox", "read-only", "--model=gpt-5-codex"],
          },
        },
      }),
    ).toBe("Model: gpt-5-codex");
  });

  it("shows an honest Codex default label when the provider omits concrete model metadata", () => {
    expect(
      resolveHelixAskModelUsageLabel({
        debug: {
          agent_runtime: "codex",
          selected_agent_provider: {
            id: "codex",
            label: "Codex Workstation Mode",
          },
          codex_args: ["exec", "--sandbox", "read-only"],
        },
      }),
    ).toBe("Model: Codex default (not reported)");
  });
});
