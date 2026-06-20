import { describe, expect, it } from "vitest";
import fs from "node:fs";

import { COMPOUND_CAPABILITY_LIVE_SCENARIOS } from "../../scripts/helix-ask-compound-capability-live-probe";
import { buildHelixCompoundCapabilityContract } from "../services/helix-ask/compound-capability-contract";
import { explicitCapabilityContractsForTests } from "../services/helix-ask/explicit-capability-contract";

type ExpectedCapability = string | string[] | null;

const flattenExpectedCapabilities = (values: ExpectedCapability[]): string[] =>
  values.flatMap((value) => {
    if (value === null) return [];
    return Array.isArray(value) ? value : [value];
  });

const expectedCapabilityMatches = (
  actual: string | null | undefined,
  expected: ExpectedCapability,
): boolean => {
  if (expected === null) return actual === null || actual === undefined;
  return Array.isArray(expected)
    ? expected.includes(String(actual ?? ""))
    : actual === expected;
};

const contractCapabilities = new Set(
  explicitCapabilityContractsForTests.flatMap((contract) => [
    contract.capability,
    contract.runtime_capability ?? "",
    ...(contract.aliases ?? []),
  ].filter(Boolean)),
);

const contractsByFamily = new Set(
  explicitCapabilityContractsForTests.map((contract) => contract.capability_family),
);

const readCodexReference = (relativePath: string): string =>
  fs.readFileSync(`external/openai-codex-compare/${relativePath}`, "utf8");

const readRepoSource = (relativePath: string): string =>
  fs.readFileSync(relativePath, "utf8");

const liveProbeCapabilities = new Set(
  COMPOUND_CAPABILITY_LIVE_SCENARIOS.flatMap((scenario) =>
    flattenExpectedCapabilities(scenario.expectedRequested),
  ),
);

const liveProbeRuntimeCapabilities = new Set(
  COMPOUND_CAPABILITY_LIVE_SCENARIOS.flatMap((scenario) =>
    flattenExpectedCapabilities(scenario.expectedRuntime),
  ),
);

const promptForRepresentativeCapability = (capability: string): string => {
  if (capability === "scientific-calculator.solve_expression") {
    return `Call ${capability} with this exact expression: 2+2.`;
  }
  if (capability === "docs-viewer.locate_in_doc") {
    return `Call ${capability} to locate query: rule of thumb.`;
  }
  if (capability === "docs-viewer.doc_equation_context") {
    return `Call ${capability} for query: Alcubierre metric equation.`;
  }
  if (capability === "repo-code.search_concept") {
    return `Call ${capability} for query: terminal authority.`;
  }
  if (capability === "workspace-directory.resolve") {
    return `Call ${capability} for query: docs/helix-ask-codex-loop-discipline.md.`;
  }
  if (capability === "internet_search.web_research") {
    return `Call ${capability} for query: Alcubierre metric energy estimates.`;
  }
  if (capability === "scholarly-research.lookup_papers") {
    return `Call ${capability} for query: Alcubierre metric energy estimates.`;
  }
  return `Call ${capability} for Helix Ask parity coverage.`;
};

const auditedExplicitCapabilities = [
  "scientific-calculator.solve_expression",
  "helix_ask.inspect_capability_catalog",
  "repo-code.search_concept",
  "docs-viewer.locate_in_doc",
  "docs-viewer.doc_equation_context",
  "workspace-directory.resolve",
  "internet_search.web_research",
  "scholarly-research.lookup_papers",
  "helix_ask.reflect_theory_context",
  "helix_ask.reflect_context_attachments",
  "live_env.query_micro_reasoner_presets",
  "live_env.draft_micro_reasoner_preset",
  "live_env.route_micro_reasoner_prompt",
  "live_env.read_processed_live_source_mail",
  "live_env.reflect_live_source_mail_loop",
  "live_env.process_live_source_mail",
  "image_lens.inspect",
  "helix_ask.build_civilization_scenario_frame",
  "helix_ask.reflect_civilization_bounds",
  "helix_ask.reflect_ideology_context",
  "helix_ask.bridge_theory_ideology_context",
  "workspace_os.status",
] as const;

const objectiveFamilyCoverage = [
  {
    label: "calculator",
    contractFamilies: ["calculator"],
    representativeCapabilities: ["scientific-calculator.solve_expression"],
    liveProbeCapabilities: ["scientific-calculator.solve_expression"],
  },
  {
    label: "docs_viewer",
    contractFamilies: ["docs_viewer"],
    representativeCapabilities: ["docs-viewer.locate_in_doc"],
    liveProbeCapabilities: ["docs-viewer.locate_in_doc"],
  },
  {
    label: "repo_code",
    contractFamilies: ["repo_code"],
    representativeCapabilities: ["repo-code.search_concept"],
    liveProbeCapabilities: ["repo-code.search_concept"],
  },
  {
    label: "workspace_directory",
    contractFamilies: ["workspace_directory"],
    representativeCapabilities: ["workspace-directory.resolve"],
    liveProbeCapabilities: ["workspace-directory.resolve"],
  },
  {
    label: "workspace_os/status",
    contractFamilies: ["workspace_diagnostic"],
    representativeCapabilities: ["workspace_os.status"],
    liveProbeCapabilities: ["workspace_os.status"],
  },
  {
    label: "capability_catalog",
    contractFamilies: ["capability_catalog"],
    representativeCapabilities: ["helix_ask.inspect_capability_catalog"],
    liveProbeCapabilities: ["helix_ask.inspect_capability_catalog"],
  },
  {
    label: "internet_search",
    contractFamilies: ["internet_search"],
    representativeCapabilities: ["internet_search.web_research"],
    liveProbeCapabilities: ["internet_search.web_research"],
  },
  {
    label: "scholarly_research",
    contractFamilies: ["scholarly_research"],
    representativeCapabilities: ["scholarly-research.lookup_papers"],
    liveProbeCapabilities: ["scholarly-research.lookup_papers"],
  },
  {
    label: "theory/context reflection",
    contractFamilies: ["theory_locator", "context_reflection"],
    representativeCapabilities: [
      "helix_ask.reflect_theory_context",
      "helix_ask.reflect_context_attachments",
    ],
    liveProbeCapabilities: ["helix_ask.reflect_theory_context"],
  },
  {
    label: "live_env/mailbox",
    contractFamilies: ["live_source_mail", "live_environment"],
    representativeCapabilities: [
      "live_env.query_micro_reasoner_presets",
      "live_env.draft_micro_reasoner_preset",
      "live_env.read_processed_live_source_mail",
    ],
    liveProbeCapabilities: [
      "live_env.query_micro_reasoner_presets",
      "live_env.draft_micro_reasoner_preset",
    ],
  },
  {
    label: "image_lens/visual_capture",
    contractFamilies: ["visual_capture"],
    representativeCapabilities: ["image_lens.inspect"],
    liveProbeCapabilities: ["image_lens.inspect"],
  },
  {
    label: "civilization_bounds",
    contractFamilies: ["civilization_bounds"],
    representativeCapabilities: [
      "helix_ask.build_civilization_scenario_frame",
      "helix_ask.reflect_civilization_bounds",
    ],
    liveProbeCapabilities: [
      "helix_ask.build_civilization_scenario_frame",
      "helix_ask.reflect_civilization_bounds",
    ],
  },
  {
    label: "zen_graph_reflection",
    contractFamilies: ["zen_graph_reflection"],
    representativeCapabilities: [
      "helix_ask.reflect_ideology_context",
      "helix_ask.bridge_theory_ideology_context",
    ],
    liveProbeCapabilities: [
      "helix_ask.reflect_ideology_context",
      "helix_ask.bridge_theory_ideology_context",
    ],
  },
] as const;

const objectiveRepresentativeCapabilities = new Set(
  objectiveFamilyCoverage.flatMap((entry) => entry.representativeCapabilities),
);

describe("Helix Ask tool-family parity goal coverage", () => {
  it("keeps the local Codex lifecycle reference anchors available", () => {
    expect(readCodexReference("codex-rs/core/src/client_common.rs")).toEqual(
      expect.stringContaining("pub struct Prompt"),
    );
    expect(readCodexReference("codex-rs/core/src/client_common.rs")).toEqual(
      expect.stringContaining("tools: Vec<ToolSpec>"),
    );
    expect(readCodexReference("codex-rs/core/src/session/turn.rs")).toEqual(
      expect.stringContaining("If the model requests a function call, we execute it and send the output"),
    );
    expect(readCodexReference("codex-rs/core/src/tools/context.rs")).toEqual(
      expect.stringContaining("ResponseInputItem::FunctionCallOutput"),
    );
    const normalizeSource = readCodexReference("codex-rs/core/src/context_manager/normalize.rs");
    expect(normalizeSource).toEqual(expect.stringContaining("missing_outputs_to_insert"));
    expect(normalizeSource).toEqual(expect.stringContaining("remove_orphan_outputs"));
  });

  it("keeps the route entrypoint on the shared capability-catalog detector", () => {
    const routeSource = readRepoSource("server/routes/agi.plan.ts");
    expect(routeSource).toEqual(
      expect.stringContaining('import { isAskCapabilityCatalogPrompt } from "../services/helix-ask/capability-catalog-intent";'),
    );
    expect(routeSource).toEqual(
      expect.stringContaining("return isAskCapabilityCatalogPrompt(transcript);"),
    );
  });

  it("has explicit capability contracts for every objective family", () => {
    for (const entry of objectiveFamilyCoverage) {
      for (const family of entry.contractFamilies) {
        expect(contractsByFamily.has(family), `${entry.label}:${family}`).toBe(true);
      }
      for (const capability of entry.representativeCapabilities) {
        expect(contractCapabilities.has(capability), `${entry.label}:${capability}`).toBe(true);
      }
    }
  });

  it("keeps every named audit tool call backed by an explicit capability contract", () => {
    for (const capability of auditedExplicitCapabilities) {
      expect(contractCapabilities.has(capability), capability).toBe(true);
    }
    for (const capability of objectiveRepresentativeCapabilities) {
      expect(auditedExplicitCapabilities).toContain(capability);
    }
  });

  it("extracts representative explicit capability prompts into usable single-subgoal contracts", () => {
    for (const entry of objectiveFamilyCoverage) {
      for (const capability of entry.representativeCapabilities) {
        const contract = explicitCapabilityContractsForTests.find((candidate) =>
          candidate.capability === capability ||
          candidate.runtime_capability === capability ||
          (candidate.aliases ?? []).includes(capability)
        );
        expect(contract, `${entry.label}:${capability}:contract`).toBeTruthy();
        expect(contract?.required_observation_kinds.length, `${entry.label}:${capability}:observations`)
          .toBeGreaterThan(0);
        expect(contract?.required_terminal_kind, `${entry.label}:${capability}:terminal_kind`).toBeTruthy();
        expect(Array.isArray(contract?.forbidden_nearby_capabilities), `${entry.label}:${capability}:forbidden`)
          .toBe(true);

        const compound = buildHelixCompoundCapabilityContract({
          turnId: `ask:tool-family-parity:${entry.label}:${capability}`.replace(/[^A-Za-z0-9:_-]+/g, "_"),
          promptText: promptForRepresentativeCapability(capability),
        });
        const subgoals = compound?.subgoals ?? [];
        expect(compound?.schema, `${entry.label}:${capability}:schema`)
          .toBe("helix.compound_capability_contract.v1");
        expect(compound?.prompt_shape, `${entry.label}:${capability}:shape`).toBe("single_capability");
        expect(subgoals, `${entry.label}:${capability}:subgoals`).toHaveLength(1);
        expect(subgoals[0]).toEqual(expect.objectContaining({
          requested_capability: contract?.capability,
          runtime_capability: contract?.runtime_capability ?? contract?.capability,
          required_observation_kinds: contract?.required_observation_kinds,
          required_terminal_kind: contract?.required_terminal_kind,
          mandatory: true,
          status: "pending",
        }));
      }
    }
  });

  it("has representative compound live-probe coverage for every objective family", () => {
    const scenarioIds = COMPOUND_CAPABILITY_LIVE_SCENARIOS.map((scenario) => scenario.id);
    expect(new Set(scenarioIds).size).toBe(scenarioIds.length);

    for (const entry of objectiveFamilyCoverage) {
      for (const capability of entry.liveProbeCapabilities) {
        expect(liveProbeCapabilities.has(capability), `${entry.label}:${capability}`).toBe(true);
      }
    }
  });

  it("backs every live-probe requested and runtime capability with an explicit contract", () => {
    for (const capability of liveProbeCapabilities) {
      expect(contractCapabilities.has(capability), `requested:${capability}`).toBe(true);
    }
    for (const capability of liveProbeRuntimeCapabilities) {
      expect(contractCapabilities.has(capability), `runtime:${capability}`).toBe(true);
    }
  });

  it("keeps live-probe scenarios structurally aligned with ordered subgoal expectations", () => {
    for (const scenario of COMPOUND_CAPABILITY_LIVE_SCENARIOS) {
      expect(scenario.expectedRequested.length, scenario.id).toBeGreaterThan(0);
      expect(scenario.expectedRuntime.length, scenario.id).toBe(scenario.expectedRequested.length);
      expect(
        scenario.expectedInputBindingFromCapabilities?.length ?? scenario.expectedRequested.length,
        scenario.id,
      ).toBe(scenario.expectedRequested.length);

      const compound = buildHelixCompoundCapabilityContract({
        turnId: `ask:tool-family-parity:live-probe:${scenario.id}`,
        promptText: scenario.prompt,
      });
      const subgoals = compound?.subgoals ?? [];
      expect(subgoals, `${scenario.id}:contract_subgoals`).toHaveLength(scenario.expectedRequested.length);
      expect(compound?.requires_all_subgoals, `${scenario.id}:requires_all_subgoals`)
        .toBe(scenario.expectedRequested.length > 1);
      scenario.expectedRequested.forEach((expectedCapability, index) => {
        const subgoal = subgoals[index];
        expect(
          expectedCapabilityMatches(subgoal?.requested_capability, expectedCapability),
          `${scenario.id}:subgoal_${index + 1}:requested:${String(subgoal?.requested_capability ?? "")}`,
        ).toBe(true);
        expect(subgoal?.mandatory, `${scenario.id}:subgoal_${index + 1}:mandatory`).toBe(true);
        expect(subgoal?.required_observation_kinds.length, `${scenario.id}:subgoal_${index + 1}:observations`)
          .toBeGreaterThan(0);
      });

      for (const capability of flattenExpectedCapabilities(scenario.expectedInputBindingFromCapabilities ?? [])) {
        expect(liveProbeCapabilities.has(capability), `${scenario.id}:input_binding:${capability}`).toBe(true);
      }
      scenario.expectedInputBindingFromCapabilities?.forEach((expectedBinding, index) => {
        if (expectedBinding === null) return;
        const priorRequestedCapabilities = new Set(
          flattenExpectedCapabilities(scenario.expectedRequested.slice(0, index)),
        );
        for (const capability of flattenExpectedCapabilities([expectedBinding])) {
          expect(
            priorRequestedCapabilities.has(capability),
            `${scenario.id}:subgoal_${index + 1}:input_binding:${capability}`,
          ).toBe(true);
          const subgoal = subgoals[index];
          const subgoalBindings = Array.isArray(subgoal?.input_bindings)
            ? subgoal.input_bindings
            : [];
          expect(
            subgoalBindings.some((binding) => binding.from_capability === capability),
            `${scenario.id}:subgoal_${index + 1}:contract_input_binding:${capability}`,
          ).toBe(true);
        }
      });
      expect(
        scenario.expectedSubgoalSatisfaction?.length ?? scenario.expectedRequested.length,
        scenario.id,
      ).toBe(scenario.expectedRequested.length);
      expect(
        scenario.expectedRailStatus?.length ?? scenario.expectedRequested.length,
        scenario.id,
      ).toBe(scenario.expectedRequested.length);
    }
  });
});
