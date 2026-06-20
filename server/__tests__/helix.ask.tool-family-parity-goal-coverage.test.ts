import { describe, expect, it } from "vitest";

import { COMPOUND_CAPABILITY_LIVE_SCENARIOS } from "../../scripts/helix-ask-compound-capability-live-probe";
import { explicitCapabilityContractsForTests } from "../services/helix-ask/explicit-capability-contract";

type ExpectedCapability = string | string[] | null;

const flattenExpectedCapabilities = (values: ExpectedCapability[]): string[] =>
  values.flatMap((value) => {
    if (value === null) return [];
    return Array.isArray(value) ? value : [value];
  });

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

const liveProbeCapabilities = new Set(
  COMPOUND_CAPABILITY_LIVE_SCENARIOS.flatMap((scenario) =>
    flattenExpectedCapabilities(scenario.expectedRequested),
  ),
);

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

describe("Helix Ask tool-family parity goal coverage", () => {
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

  it("has representative compound live-probe coverage for every objective family", () => {
    const scenarioIds = COMPOUND_CAPABILITY_LIVE_SCENARIOS.map((scenario) => scenario.id);
    expect(new Set(scenarioIds).size).toBe(scenarioIds.length);

    for (const entry of objectiveFamilyCoverage) {
      for (const capability of entry.liveProbeCapabilities) {
        expect(liveProbeCapabilities.has(capability), `${entry.label}:${capability}`).toBe(true);
      }
    }
  });

  it("keeps live-probe scenarios structurally aligned with ordered subgoal expectations", () => {
    for (const scenario of COMPOUND_CAPABILITY_LIVE_SCENARIOS) {
      expect(scenario.expectedRequested.length, scenario.id).toBeGreaterThan(0);
      expect(scenario.expectedRuntime.length, scenario.id).toBe(scenario.expectedRequested.length);
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
