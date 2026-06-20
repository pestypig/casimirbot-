import { describe, expect, it } from "vitest";
import fs from "node:fs";

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

const auditedExplicitCapabilities = [
  "scientific-calculator.solve_expression",
  "repo-code.search_concept",
  "docs-viewer.locate_in_doc",
  "docs-viewer.doc_equation_context",
  "workspace-directory.resolve",
  "internet_search.web_research",
  "live_env.query_micro_reasoner_presets",
  "live_env.draft_micro_reasoner_preset",
  "live_env.route_micro_reasoner_prompt",
  "live_env.read_processed_live_source_mail",
  "live_env.reflect_live_source_mail_loop",
  "live_env.process_live_source_mail",
  "helix_ask.build_civilization_scenario_frame",
  "helix_ask.reflect_civilization_bounds",
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
      for (const capability of flattenExpectedCapabilities(scenario.expectedInputBindingFromCapabilities ?? [])) {
        expect(liveProbeCapabilities.has(capability), `${scenario.id}:input_binding:${capability}`).toBe(true);
      }
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
