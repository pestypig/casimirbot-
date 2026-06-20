import { describe, expect, it } from "vitest";
import type { HelixToolCallAdmissionDecision, HelixToolCallAdmissionFamily } from "@shared/helix-tool-call-admission";
import { buildHelixCapabilityItinerary } from "../services/helix-ask/capability-itinerary";
import { buildHelixCapabilityItineraryExecutionState } from "../services/helix-ask/capability-itinerary-execution";
import { buildHelixCompoundCapabilityContract } from "../services/helix-ask/compound-capability-contract";
import { resolveCompoundCapabilitySynthesisReadiness } from "../services/helix-ask/compound-capability-synthesis";
import { explicitCapabilityContractsForTests } from "../services/helix-ask/explicit-capability-contract";
import { TOOL_FAMILY_CONTRACTS } from "../services/helix-ask/tool-family-contract";

type ExplicitContract = typeof explicitCapabilityContractsForTests[number];

const runtimeCapabilityFor = (contract: ExplicitContract): string =>
  contract.runtime_capability && contract.runtime_capability !== contract.capability
    ? contract.runtime_capability
    : contract.capability;

const promptFor = (contract: ExplicitContract): string => {
  if (contract.capability === "scientific-calculator.solve_expression") {
    return "Call scientific-calculator.solve_expression with this exact expression: 6*7.";
  }
  if (contract.capability === "docs-viewer.locate_in_doc") {
    return "Call docs-viewer.locate_in_doc to locate the rule of thumb in docs/helix-ask-codex-loop-discipline.md.";
  }
  if (contract.capability === "repo-code.search_concept") {
    return "Call repo-code.search_concept to find terminal authority enforcement.";
  }
  if (contract.capability === "workspace-directory.resolve") {
    return "Call workspace-directory.resolve for docs/helix-ask-codex-loop-discipline.md.";
  }
  if (contract.capability === "internet_search.web_research") {
    return "Call internet_search.web_research for OpenAI Codex documentation.";
  }
  if (contract.capability === "scholarly-research.lookup_papers") {
    return "Call scholarly-research.lookup_papers for Alcubierre metric energy estimates.";
  }
  if (contract.capability === "scholarly-research.fetch_full_text") {
    return "Call scholarly-research.fetch_full_text paper_result_id=arxiv:warp-1994.";
  }
  if (contract.capability === "image_lens.inspect") {
    return "Call image_lens.inspect to inspect the current visual frame.";
  }
  return `Call ${contract.capability}.`;
};

const promptForPair = (first: ExplicitContract, second: ExplicitContract): string =>
  `${promptFor(first)} Then ${promptFor(second).replace(/^Call\b/, "call")}`;

const representativesByCapabilityFamily = (): ExplicitContract[] => {
  const byFamily = new Map<string, ExplicitContract>();
  for (const contract of explicitCapabilityContractsForTests) {
    if (!byFamily.has(contract.capability_family)) byFamily.set(contract.capability_family, contract);
  }
  return Array.from(byFamily.values());
};

const requiresDocEvidenceSynthesis = (contracts: ExplicitContract[]): boolean =>
  contracts.some((contract) =>
    /docs-viewer\.(?:locate_in_doc|summarize_doc|search_docs)/i.test(contract.capability)
  );

const explicitCapabilityNames = (): Set<string> => new Set(
  explicitCapabilityContractsForTests.flatMap((contract) => [
    contract.capability,
    contract.runtime_capability ?? "",
    ...(contract.aliases ?? []),
  ].filter(Boolean)),
);

const expectedTerminalKindsByFamily: Record<string, string[]> = {
  capability_catalog: ["capability_help_summary"],
  calculator: ["workstation_tool_evaluation"],
  workspace_diagnostic: ["model_synthesized_answer"],
  docs_viewer: ["doc_open_receipt", "doc_location_matches", "doc_summary", "doc_equation_context"],
  repo_code: ["repo_code_evidence_answer"],
  workspace_directory: ["workspace_directory_resolution"],
  internet_search: ["internet_search_answer"],
  scholarly_research: ["scholarly_research_answer"],
  live_source_mail: ["model_synthesized_answer"],
  live_source_decision: ["model_synthesized_answer"],
  voice_delivery: ["model_synthesized_answer"],
  live_environment: ["direct_answer_text", "workstation_tool_evaluation", "model_synthesized_answer"],
  context_reflection: ["model_synthesized_answer"],
  theory_locator: ["theory_context_reflection_answer"],
  zen_graph_reflection: ["model_synthesized_answer"],
  civilization_bounds: ["model_synthesized_answer"],
  visual_capture: ["situation_context_pack"],
  workstation: ["model_synthesized_answer"],
};

const admissionFor = (turnId: string, contracts: ExplicitContract[]): HelixToolCallAdmissionDecision => ({
  schema: "helix.tool_call_admission_decision.v1",
  turn_id: turnId,
  source_target: "runtime_evidence",
  required: true,
  admitted_tool_families: Array.from(new Set(
    contracts.flatMap((contract) => contract.admission_families),
  )) as HelixToolCallAdmissionFamily[],
  forbidden_terminal_artifact_kinds: [],
  forbidden_routes: [],
  reason: "test_all_explicit_capability_contract_families",
  assistant_answer: false,
  raw_content_included: false,
});

const sanitize = (value: string): string => value.replace(/[^A-Za-z0-9:_-]+/g, "_");

const availableCapabilities = (contracts: ExplicitContract[]) => ({
  schema: "helix.available_capabilities.v1",
  turn_id: "ask:compound-family-matrix",
  manifest_role: "model_visible_tool_menu",
  tool_manifest_version: "helix.ask.capability_manifest.v1",
  user_goal_summary: "test",
  canonical_goal_kind: "compound_capability",
  model_visible_capability_keys: contracts.map(runtimeCapabilityFor),
  recommended_capability_key: runtimeCapabilityFor(contracts[0]),
  classifier_hints: [],
  capabilities: contracts.map((contract) => {
    const key = runtimeCapabilityFor(contract);
    return {
      capability_key: key,
      label: key,
      lane: "tool",
      requires_action: true,
      expected_artifacts: contract.required_observation_kinds,
      goal_fit: "primary",
      reason: "test",
      model_visible_name: key,
      model_visible_description: key,
      availability: "available",
    };
  }),
  assistant_answer: false,
  raw_content_included: false,
});

const schemaForKind = (kind: string): string =>
  kind.includes("/") ? kind : `helix.${kind}.v1`;

const familyObservationKind = (family: string): string | null => {
  if (family === "workstation_action") return "workstation_tool_evaluation";
  if (family === "live_environment") return "live_environment_tool_observation";
  if (family === "runtime_evidence") return "capability_registry";
  if (family === "situation_run") return "situation_context_pack";
  return null;
};

const completedArtifactsForItinerary = (
  turnId: string,
  itinerary: ReturnType<typeof buildHelixCapabilityItinerary>,
): Array<Record<string, unknown>> => {
  const subgoals = (itinerary.compound_capability_contract?.subgoals ?? []) as Array<Record<string, unknown>>;
  const artifacts = subgoals.flatMap((subgoal, index) => {
    const requested = String(subgoal.requested_capability ?? "");
    const runtime = String(subgoal.runtime_capability ?? requested);
    const subgoalId = String(subgoal.subgoal_id ?? `${turnId}:subgoal:${index + 1}`);
    const requiredKinds = Array.isArray(subgoal.required_observation_kinds)
      ? subgoal.required_observation_kinds.map(String)
      : [];
    const observationKind = requiredKinds[0] ?? "runtime_tool_observation";
    const artifactBase = `${turnId}:${sanitize(runtime)}:${index + 1}`;
    return [
      {
        artifact_id: `${artifactBase}:runtime_tool_call`,
        kind: "runtime_tool_call",
        payload: {
          capability_key: runtime,
          compound_subgoal_id: subgoalId,
          args: subgoal.args_hint ?? {},
        },
      },
      {
        artifact_id: `${artifactBase}:runtime_tool_observation`,
        kind: "runtime_tool_observation",
        payload: {
          capability_key: runtime,
          compound_subgoal_id: subgoalId,
          status: "completed",
        },
      },
      {
        artifact_id: `${artifactBase}:declared_observation`,
        kind: observationKind,
        payload: {
          schema: schemaForKind(observationKind),
          capability_key: runtime,
          compound_subgoal_id: subgoalId,
          status: "completed",
        },
      },
    ];
  });

  const familyArtifacts = itinerary.planned_steps
    .map((step, index) => {
      const kind = familyObservationKind(step.tool_family);
      if (!kind) return null;
      const runtime = step.runtime_capability ?? step.capability_hint ?? step.requested_capability ?? step.tool_family;
      return {
        artifact_id: `${turnId}:family:${sanitize(step.tool_family)}:${index + 1}`,
        kind,
        payload: {
          schema: schemaForKind(kind),
          capability_key: runtime,
          compound_subgoal_id: step.compound_subgoal_id ?? null,
          status: "completed",
          authority: "agent_runtime_loop",
          supports_goal: true,
        },
      };
    })
    .filter((artifact): artifact is Record<string, unknown> => Boolean(artifact));

  return [...artifacts, ...familyArtifacts];
};

const assertPairContract = (first: ExplicitContract, second: ExplicitContract): void => {
  const turnId = `ask:compound-family:${first.capability}:then:${second.capability}`
    .replace(/[^A-Za-z0-9:_-]+/g, "_");
  const itinerary = buildHelixCapabilityItinerary({
    turnId,
    promptText: promptForPair(first, second),
    toolCallAdmissionDecision: admissionFor(turnId, [first, second]),
    availableCapabilities: availableCapabilities([first, second]),
  });

  const subgoals = (itinerary.compound_capability_contract?.subgoals ?? []) as Array<Record<string, unknown>>;
  expect(itinerary.prompt_shape).toBe("compound_tool");
  expect(subgoals.map((subgoal) => subgoal.requested_capability)).toEqual([
    first.capability,
    second.capability,
  ]);
  expect(subgoals.map((subgoal) => subgoal.runtime_capability)).toEqual([
    runtimeCapabilityFor(first),
    runtimeCapabilityFor(second),
  ]);
  expect(itinerary.terminal_success_criteria.required_capabilities).toEqual([
    first.capability,
    second.capability,
  ]);
  expect(itinerary.terminal_success_criteria.requires_post_observation_synthesis).toBe(true);
  expect(itinerary.terminal_success_criteria.allowed_terminal_artifact_kinds).toEqual(
    expect.arrayContaining([
      "final_answer_draft",
      "model_synthesized_answer",
      first.required_terminal_kind,
      second.required_terminal_kind,
    ]),
  );
  expect(itinerary.terminal_success_criteria.forbidden_terminal_artifact_kinds).toEqual(
    expect.arrayContaining(["tool_receipt"]),
  );
  expect(itinerary.terminal_success_criteria.compound_terminal_policy).toBe(
    "synthesize_from_satisfied_subgoal_observations",
  );
  if (requiresDocEvidenceSynthesis([first, second])) {
    expect(itinerary.terminal_success_criteria.allowed_terminal_artifact_kinds)
      .toContain("doc_evidence_synthesis_answer");
  }
};

describe("Helix Ask compound capability family matrix", () => {
  it("inventories the current explicit capability surface by family", () => {
    const families = Array.from(new Set(explicitCapabilityContractsForTests.map((contract) => contract.capability_family)));

    expect(explicitCapabilityContractsForTests.length).toBeGreaterThanOrEqual(46);
    expect(families).toEqual(expect.arrayContaining([
      "capability_catalog",
      "calculator",
      "workspace_diagnostic",
      "docs_viewer",
      "repo_code",
      "workspace_directory",
      "internet_search",
      "scholarly_research",
      "live_source_mail",
      "live_source_decision",
      "voice_delivery",
      "live_environment",
      "context_reflection",
      "theory_locator",
      "zen_graph_reflection",
      "civilization_bounds",
      "visual_capture",
      "workstation",
    ]));
  });

  it("keeps explicit capability contracts aligned with concrete tool-family contracts", () => {
    const names = explicitCapabilityNames();
    const missing = TOOL_FAMILY_CONTRACTS
      .filter((contract) => !contract.toolName.startsWith("family:"))
      .map((contract) => contract.toolName)
      .filter((toolName) => !names.has(toolName))
      .sort();

    expect(missing).toEqual([]);
  });

  it("builds a single-capability contract for every explicit capability", () => {
    for (const contract of explicitCapabilityContractsForTests) {
      const compound = buildHelixCompoundCapabilityContract({
        turnId: `ask:single:${contract.capability}`.replace(/[^A-Za-z0-9:_-]+/g, "_"),
        promptText: promptFor(contract),
      });
      const subgoals = compound?.subgoals ?? [];

      expect(subgoals, contract.capability).toHaveLength(1);
      expect(subgoals[0]?.requested_capability, contract.capability).toBe(contract.capability);
      expect(subgoals[0]?.runtime_capability, contract.capability).toBe(runtimeCapabilityFor(contract));
      expect(subgoals[0]?.capability_family, contract.capability).toBe(contract.capability_family);
      expect(subgoals[0]?.required_args, contract.capability).toEqual(contract.required_args);
      expect(subgoals[0]?.optional_args, contract.capability).toEqual(contract.optional_args);
      expect(subgoals[0]?.required_terminal_kind, contract.capability).toBe(contract.required_terminal_kind);
      expect(subgoals[0]?.required_observation_kinds, contract.capability).toEqual(contract.required_observation_kinds);
      expect(compound?.requires_all_subgoals, contract.capability).toBe(false);
    }
  });

  it("exposes required and optional argument rails for every explicit capability contract", () => {
    for (const contract of explicitCapabilityContractsForTests) {
      expect(Array.isArray(contract.required_args), contract.capability).toBe(true);
      expect(Array.isArray(contract.optional_args), contract.capability).toBe(true);
    }

    expect(explicitCapabilityContractsForTests.find((contract) =>
      contract.capability === "scientific-calculator.solve_expression"
    )?.required_args).toEqual(["latex"]);
    expect(explicitCapabilityContractsForTests.find((contract) =>
      contract.capability === "scholarly-research.lookup_papers"
    )?.required_args).toEqual(["query"]);
    expect(explicitCapabilityContractsForTests.find((contract) =>
      contract.capability === "scholarly-research.fetch_full_text"
    )?.required_args).toEqual(["paper_result_or_source"]);
  });

  it("keeps every explicit capability on its family-specific terminal product contract", () => {
    for (const contract of explicitCapabilityContractsForTests) {
      expect(
        expectedTerminalKindsByFamily[contract.capability_family],
        contract.capability_family,
      ).toContain(contract.required_terminal_kind);
    }
  });

  it("keeps every representative family composable with the calculator contract", () => {
    const calculator = explicitCapabilityContractsForTests.find((contract) =>
      contract.capability === "scientific-calculator.solve_expression"
    );
    expect(calculator).toBeTruthy();

    for (const contract of representativesByCapabilityFamily()) {
      if (contract.capability_family === "calculator") continue;
      assertPairContract(contract, calculator as ExplicitContract);
    }
  });

  it("keeps every explicit capability composable with the calculator contract", () => {
    const calculator = explicitCapabilityContractsForTests.find((contract) =>
      contract.capability === "scientific-calculator.solve_expression"
    );
    expect(calculator).toBeTruthy();

    for (const contract of explicitCapabilityContractsForTests) {
      if (contract.capability === calculator?.capability) continue;
      assertPairContract(contract, calculator as ExplicitContract);
    }
  });

  it("keeps every representative family composable with workspace_os.status", () => {
    const workspace = explicitCapabilityContractsForTests.find((contract) =>
      contract.capability === "workspace_os.status"
    );
    expect(workspace).toBeTruthy();

    for (const contract of representativesByCapabilityFamily()) {
      if (contract.capability_family === "workspace_diagnostic") continue;
      assertPairContract(contract, workspace as ExplicitContract);
    }
  });

  it("keeps every explicit capability composable with workspace_os.status", () => {
    const workspace = explicitCapabilityContractsForTests.find((contract) =>
      contract.capability === "workspace_os.status"
    );
    expect(workspace).toBeTruthy();

    for (const contract of explicitCapabilityContractsForTests) {
      if (contract.capability === workspace?.capability) continue;
      assertPairContract(contract, workspace as ExplicitContract);
    }
  });

  it("keeps every representative family composable with docs-viewer.locate_in_doc", () => {
    const docs = explicitCapabilityContractsForTests.find((contract) =>
      contract.capability === "docs-viewer.locate_in_doc"
    );
    expect(docs).toBeTruthy();

    for (const contract of representativesByCapabilityFamily()) {
      if (contract.capability_family === "docs_viewer") continue;
      assertPairContract(contract, docs as ExplicitContract);
    }
  });

  it("keeps every explicit capability composable with docs-viewer.locate_in_doc in both orders", () => {
    const docs = explicitCapabilityContractsForTests.find((contract) =>
      contract.capability === "docs-viewer.locate_in_doc"
    );
    expect(docs).toBeTruthy();

    for (const contract of explicitCapabilityContractsForTests) {
      if (contract.capability === docs?.capability) continue;
      assertPairContract(contract, docs as ExplicitContract);
      assertPairContract(docs as ExplicitContract, contract);
    }
  });

  it("keeps ordered unrelated representative-family pairs intact", () => {
    const representatives = representativesByCapabilityFamily();
    for (let index = 0; index < representatives.length; index += 1) {
      const first = representatives[index];
      const second = representatives[(index + 1) % representatives.length];
      if (first.capability_family === second.capability_family) continue;
      assertPairContract(first, second);
    }
  });

  it("keeps catalog terminal help as synthesis over registry-only evidence", () => {
    const catalog = explicitCapabilityContractsForTests.find((contract) =>
      contract.capability === "helix_ask.inspect_capability_catalog"
    );
    const workspace = explicitCapabilityContractsForTests.find((contract) =>
      contract.capability === "workspace_os.status"
    );
    expect(catalog).toBeTruthy();
    expect(workspace).toBeTruthy();

    const single = buildHelixCompoundCapabilityContract({
      turnId: "ask:catalog:single",
      promptText: promptFor(catalog as ExplicitContract),
    });
    expect(single?.subgoals[0]?.required_observation_kinds).toEqual(["capability_registry"]);

    const compound = buildHelixCompoundCapabilityContract({
      turnId: "ask:catalog:compound",
      promptText: promptForPair(catalog as ExplicitContract, workspace as ExplicitContract),
    });
    expect(compound?.subgoals[0]?.required_observation_kinds).toEqual([
      "capability_registry",
    ]);
  });

  it("extracts only the math expression for calculator subgoals in family compounds", () => {
    const calculator = explicitCapabilityContractsForTests.find((contract) =>
      contract.capability === "scientific-calculator.solve_expression"
    ) as ExplicitContract;
    const representatives = representativesByCapabilityFamily()
      .filter((contract) => contract.capability_family !== "calculator");

    for (const contract of representatives) {
      const compound = buildHelixCompoundCapabilityContract({
        turnId: `ask:math:${contract.capability_family}`.replace(/[^A-Za-z0-9:_-]+/g, "_"),
        promptText: promptForPair(contract, calculator),
      });
      const calculatorSubgoal = compound?.subgoals.find((subgoal) =>
        subgoal.requested_capability === "scientific-calculator.solve_expression"
      );

      expect(calculatorSubgoal?.args_hint, contract.capability_family).toEqual({
        latex: "6*7",
        expression: "6*7",
      });
    }
  });

  it("marks representative-family completed observations as satisfied and synthesis-ready", () => {
    const calculator = explicitCapabilityContractsForTests.find((contract) =>
      contract.capability === "scientific-calculator.solve_expression"
    ) as ExplicitContract;
    const workspace = explicitCapabilityContractsForTests.find((contract) =>
      contract.capability === "workspace_os.status"
    ) as ExplicitContract;

    for (const contract of representativesByCapabilityFamily()) {
      const partner = contract.capability_family === "calculator" ? workspace : calculator;
      const turnId = `ask:completed-family:${contract.capability_family}`.replace(/[^A-Za-z0-9:_-]+/g, "_");
      const itinerary = buildHelixCapabilityItinerary({
        turnId,
        promptText: promptForPair(contract, partner),
        toolCallAdmissionDecision: admissionFor(turnId, [contract, partner]),
        availableCapabilities: availableCapabilities([contract, partner]),
      });
      const artifacts = completedArtifactsForItinerary(turnId, itinerary);
      const state = buildHelixCapabilityItineraryExecutionState({
        capabilityItinerary: itinerary,
        artifacts,
      });

      expect(state.complete, contract.capability_family).toBe(true);
      expect(state.missing_required_capabilities, contract.capability_family).toEqual([]);
      expect(state.compound_subgoal_ledger.map((entry) => entry.satisfaction), contract.capability_family)
        .toEqual(["satisfied", "satisfied"]);

      const readiness = resolveCompoundCapabilitySynthesisReadiness({
        payload: {
          capability_itinerary: {
            ...itinerary,
            execution_state: state,
          },
          capability_itinerary_execution_state: state,
        },
        artifacts,
      });

      expect(readiness.complete, contract.capability_family).toBe(true);
      expect(readiness.synthesis_required, contract.capability_family).toBe(true);
      expect(readiness.support_refs.length, contract.capability_family).toBeGreaterThanOrEqual(2);
      expect(readiness.subgoal_terminal_kinds, contract.capability_family)
        .toEqual(expect.arrayContaining([
          contract.required_terminal_kind,
          partner.required_terminal_kind,
        ]));
      expect(readiness.terminal_contribution_kinds, contract.capability_family)
        .toEqual(readiness.subgoal_terminal_kinds);
      expect(readiness.synthesis_terminal_kind, contract.capability_family).toBe(
        requiresDocEvidenceSynthesis([contract, partner])
          ? "doc_evidence_synthesis_answer"
          : "model_synthesized_answer",
      );
      expect(itinerary.terminal_success_criteria.allowed_terminal_artifact_kinds, contract.capability_family)
        .toEqual(expect.arrayContaining([
          contract.required_terminal_kind,
          partner.required_terminal_kind,
        ]));
    }
  });

  it("fails representative-family invalid runtime arguments closed at the subgoal rail", () => {
    const calculator = explicitCapabilityContractsForTests.find((contract) =>
      contract.capability === "scientific-calculator.solve_expression"
    ) as ExplicitContract;
    const workspace = explicitCapabilityContractsForTests.find((contract) =>
      contract.capability === "workspace_os.status"
    ) as ExplicitContract;

    for (const contract of representativesByCapabilityFamily()) {
      const partner = contract.capability_family === "calculator" ? workspace : calculator;
      const turnId = `ask:invalid-family:${contract.capability_family}`.replace(/[^A-Za-z0-9:_-]+/g, "_");
      const itinerary = buildHelixCapabilityItinerary({
        turnId,
        promptText: promptForPair(contract, partner),
        toolCallAdmissionDecision: admissionFor(turnId, [contract, partner]),
        availableCapabilities: availableCapabilities([contract, partner]),
      });
      const invalidRuntime = runtimeCapabilityFor(contract);
      const invalidSubgoal = ((itinerary.compound_capability_contract?.subgoals ?? []) as Array<Record<string, unknown>>)
        .find((subgoal) => subgoal.requested_capability === contract.capability);
      const state = buildHelixCapabilityItineraryExecutionState({
        capabilityItinerary: itinerary,
        artifacts: [
          {
            artifact_id: `${turnId}:invalid:runtime_tool_call`,
            kind: "runtime_tool_call",
            payload: {
              capability_key: invalidRuntime,
              compound_subgoal_id: invalidSubgoal?.subgoal_id,
              args: {},
            },
          },
          {
            artifact_id: `${turnId}:invalid:runtime_tool_call_validation`,
            kind: "runtime_tool_call_validation",
            payload: {
              capability_key: invalidRuntime,
              compound_subgoal_id: invalidSubgoal?.subgoal_id,
              valid: false,
              errors: ["invalid_arg:missing_required_args"],
            },
          },
        ],
      });
      const invalidEntry = state.compound_subgoal_ledger.find((entry) =>
        entry.requested_capability === contract.capability
      );

      expect(state.complete, contract.capability_family).toBe(false);
      expect(invalidEntry, contract.capability_family).toMatchObject({
        satisfaction: "failed",
        rail_status: "fail_closed",
        rail_failure_code: "invalid_arg:missing_required_args",
      });
      expect(state.missing_required_capabilities, contract.capability_family)
        .toContain(contract.capability);
    }
  });

  it("fails internet-search compounds closed on provider config without consuming loop budget", () => {
    const internetSearch = explicitCapabilityContractsForTests.find((contract) =>
      contract.capability === "internet_search.web_research"
    ) as ExplicitContract;
    const calculator = explicitCapabilityContractsForTests.find((contract) =>
      contract.capability === "scientific-calculator.solve_expression"
    ) as ExplicitContract;
    const turnId = "ask:compound-family:internet-config-missing";
    const itinerary = buildHelixCapabilityItinerary({
      turnId,
      promptText: promptForPair(internetSearch, calculator),
      toolCallAdmissionDecision: admissionFor(turnId, [internetSearch, calculator]),
      availableCapabilities: availableCapabilities([internetSearch, calculator]),
    });
    const internetSubgoal = ((itinerary.compound_capability_contract?.subgoals ?? []) as Array<Record<string, unknown>>)
      .find((subgoal) => subgoal.requested_capability === internetSearch.capability);
    const state = buildHelixCapabilityItineraryExecutionState({
      capabilityItinerary: itinerary,
      artifacts: [
        {
          artifact_id: `${turnId}:internet:runtime_tool_call`,
          kind: "runtime_tool_call",
          payload: {
            capability_key: runtimeCapabilityFor(internetSearch),
            compound_subgoal_id: internetSubgoal?.subgoal_id,
            args: internetSubgoal?.args_hint ?? {},
          },
        },
        {
          artifact_id: `${turnId}:internet:runtime_tool_call_validation`,
          kind: "runtime_tool_call_validation",
          payload: {
            capability_key: runtimeCapabilityFor(internetSearch),
            compound_subgoal_id: internetSubgoal?.subgoal_id,
            valid: false,
            errors: ["config_missing"],
          },
        },
      ],
    });
    const failedEntry = state.compound_subgoal_ledger.find((entry) =>
      entry.requested_capability === internetSearch.capability
    );

    expect(state.complete).toBe(false);
    expect(failedEntry).toMatchObject({
      requested_capability: "internet_search.web_research",
      satisfaction: "failed",
      rail_status: "fail_closed",
      rail_failure_code: "config_missing",
    });
    expect(failedEntry?.rail_failure_code).not.toBe("agent_loop_budget_exhausted");
    expect(state.missing_required_capabilities).toContain("internet_search.web_research");
  });

  it("fails repo-code compounds closed on weak evidence repair without budget exhaustion", () => {
    const repo = explicitCapabilityContractsForTests.find((contract) =>
      contract.capability === "repo-code.search_concept"
    ) as ExplicitContract;
    const calculator = explicitCapabilityContractsForTests.find((contract) =>
      contract.capability === "scientific-calculator.solve_expression"
    ) as ExplicitContract;
    const turnId = "ask:compound-family:repo-weak-evidence";
    const itinerary = buildHelixCapabilityItinerary({
      turnId,
      promptText: promptForPair(repo, calculator),
      toolCallAdmissionDecision: admissionFor(turnId, [repo, calculator]),
      availableCapabilities: availableCapabilities([repo, calculator]),
    });
    const repoSubgoal = ((itinerary.compound_capability_contract?.subgoals ?? []) as Array<Record<string, unknown>>)
      .find((subgoal) => subgoal.requested_capability === repo.capability);
    const state = buildHelixCapabilityItineraryExecutionState({
      capabilityItinerary: itinerary,
      artifacts: [
        {
          artifact_id: `${turnId}:repo:runtime_tool_call`,
          kind: "runtime_tool_call",
          payload: {
            capability_key: runtimeCapabilityFor(repo),
            compound_subgoal_id: repoSubgoal?.subgoal_id,
            args: repoSubgoal?.args_hint ?? {},
          },
        },
        {
          artifact_id: `${turnId}:repo:runtime_tool_call_validation`,
          kind: "runtime_tool_call_validation",
          payload: {
            capability_key: runtimeCapabilityFor(repo),
            compound_subgoal_id: repoSubgoal?.subgoal_id,
            valid: false,
            errors: ["weak_evidence_repair_loop"],
          },
        },
      ],
    });
    const failedEntry = state.compound_subgoal_ledger.find((entry) =>
      entry.requested_capability === repo.capability
    );

    expect(state.complete).toBe(false);
    expect(failedEntry).toMatchObject({
      requested_capability: "repo-code.search_concept",
      required_observation_kinds: repo.required_observation_kinds,
      satisfaction: "failed",
      rail_status: "fail_closed",
      rail_failure_code: "weak_evidence_repair_loop",
    });
    expect(failedEntry?.rail_failure_code).not.toBe("agent_loop_budget_exhausted");
    expect(state.missing_required_capabilities).toContain("repo-code.search_concept");
  });
});
