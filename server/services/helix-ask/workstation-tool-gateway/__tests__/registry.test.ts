import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HELIX_WORKSPACE_OS_STATUS_CAPABILITY } from "../../workspace-os-status-intent";
import {
  callWorkstationGatewayCapability,
  listWorkstationGatewayCapabilities,
} from "../registry";

const WORKSTATION_ACTIVE_CONTEXT_CAPABILITY = "workstation.active_context";
const CALCULATOR_SOLVE_EXPRESSION_CAPABILITY = "scientific-calculator.solve_expression";
const CALCULATOR_ACTIVE_CONTEXT_CAPABILITY = "scientific-calculator.active_context";
const READABLE_SURFACE_OBSERVE_CAPABILITY = "workstation.readable_surface.observe";
const DOCS_READ_VISIBLE_SURFACE_CAPABILITY = "docs-viewer.read_visible_surface";
const DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY = "docs-viewer.read_active_translation";
const CALCULATOR_READ_VISIBLE_RESULT_CAPABILITY = "scientific-calculator.read_visible_result";
const CALCULATOR_OPEN_PANEL_CAPABILITY = "scientific-calculator.open_panel";
const CALCULATOR_SHOW_GATEWAY_SOLVE_CAPABILITY = "scientific-calculator.show_gateway_solve";
const WORKSTATION_OPEN_PANEL_CAPABILITY = "workstation.open_panel";
const WORKSTATION_FOCUS_PANEL_CAPABILITY = "workstation.focus_panel";
const DOCS_OPEN_DOC_CAPABILITY = "docs-viewer.open_doc";
const REPO_SEARCH_CAPABILITY = "repo.search";
const DOCS_SEARCH_CAPABILITY = "docs.search";
const INTERNET_SEARCH_CAPABILITY = "internet-search.search_web";
const SCHOLARLY_RESEARCH_SEARCH_CAPABILITY = "scholarly-research.lookup_papers";
const SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY = "scholarly-research.fetch_full_text";
const SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY = "scholarly-research.extract_numeric_parameters";
const CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY = "civilization-bounds.reflect_system_bounds";
const THEORY_CONTEXT_REFLECTION_CAPABILITY = "theory-badge-graph.reflect_discussion_context";
const THEORY_FRONTIER_CONJECTURE_CAPABILITY = "theory-badge-graph.propose_frontier_conjectures";
const VOICE_INTERIM_CALLOUT_CAPABILITY = "live_env.request_interim_voice_callout";
const VOICE_NARRATOR_SAY_CAPABILITY = "live_env.narrator_say";
const CONTEXT_FEED_QUERY_CAPABILITIES = [
  ["live_env.query_visual_summaries", "query_visual_summaries"],
  ["live_env.query_trace_memory", "query_trace_memory"],
  ["live_env.query_narrator_events", "query_narrator_events"],
  ["live_env.query_audio_transcripts", "query_audio_transcripts"],
  ["live_env.query_translation_segments", "query_translation_segments"],
  ["live_env.query_microdeck_outputs", "query_microdeck_outputs"],
  ["live_env.query_live_answer_state", "query_live_answer_state"],
  ["live_env.query_packet_traces", "query_packet_traces"],
  ["live_env.query_route_evidence", "query_route_evidence"],
  ["live_env.query_automation_policies", "query_automation_policies"],
  ["live_env.query_source_health", "query_source_health"],
] as const;
const LIVE_SOURCE_LOOP_HEALTH_CAPABILITY = "live_env.query_live_source_loop_health";
const LIVE_SOURCE_STATE_READ_CAPABILITIES = [
  ["live_env.query_live_source_quality", "query_live_source_quality"],
  ["live_env.query_workstation_goal_context", "query_workstation_goal_context"],
  ["live_env.summarize_live_source_current_state", "summarize_live_source_current_state"],
] as const;
const SITUATION_STAGE_STATE_READ_CAPABILITIES = [
  ["live_env.query_event_log", "query_event_log"],
  ["live_env.query_world_events", "query_world_events"],
  ["live_env.query_navigation_state", "query_navigation_state"],
  ["live_env.query_stage_sources", "query_stage_sources"],
  ["live_env.query_constructs", "query_constructs"],
  ["live_env.query_job_evidence", "query_job_evidence"],
] as const;
const MICRO_REASONER_READ_CAPABILITIES = [
  ["live_env.query_micro_reasoner_presets", "query_micro_reasoner_presets"],
  ["live_env.query_micro_reasoner_prompts", "query_micro_reasoner_prompts"],
  ["live_env.test_micro_reasoner_prompt", "test_micro_reasoner_prompt"],
] as const;
const VISUAL_OBSERVER_READ_CAPABILITIES = [
  ["live_env.query_visual_observer_profiles", "query_visual_observer_profiles"],
  ["live_env.test_visual_observer_profile", "test_visual_observer_profile"],
  ["live_env.compare_visual_observer_profiles", "compare_visual_observer_profiles"],
] as const;

describe("Helix workstation tool gateway", () => {
  const originalEnv = {
    RG_BIN: process.env.RG_BIN,
    PATH: process.env.PATH,
    Path: process.env.Path,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
  };
  const originalFetch = globalThis.fetch;
  const restoreEnvKey = (key: keyof typeof originalEnv): void => {
    const original = originalEnv[key];
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  };

  beforeEach(() => {
    restoreEnvKey("RG_BIN");
    restoreEnvKey("PATH");
    restoreEnvKey("Path");
    restoreEnvKey("TAVILY_API_KEY");
  });

  afterEach(() => {
    restoreEnvKey("RG_BIN");
    restoreEnvKey("PATH");
    restoreEnvKey("Path");
    restoreEnvKey("TAVILY_API_KEY");
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("lists read-only non-terminal workstation capabilities", () => {
    const manifest = listWorkstationGatewayCapabilities({
      agentRuntime: "codex",
      mode: "observe",
    });

    expect(manifest).toMatchObject({
      schema: "helix.workstation_tool_gateway.v1",
      manifest_version: "read-observe-act.v1",
      agent_runtime: "codex",
      mode: "observe",
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
        panel_id: "workspace-os",
        action_id: "status",
        mode: "observe",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        output_observation_schema: "helix.workspace_os_status_observation.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: WORKSTATION_ACTIVE_CONTEXT_CAPABILITY,
        panel_id: "workstation",
        action_id: "active_context",
        mode: "read",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        permission_profile_required: "read",
        output_observation_schema: "helix.workstation_active_context_observation.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
        panel_id: "scientific-calculator",
        action_id: "solve_expression",
        mode: "read",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        permission_profile_required: "read",
        output_observation_schema: "helix.calculator_solve_observation.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: CALCULATOR_ACTIVE_CONTEXT_CAPABILITY,
        panel_id: "scientific-calculator",
        action_id: "active_context",
        mode: "read",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        permission_profile_required: "read",
        output_observation_schema: "helix.calculator_active_context_observation.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    for (const [capabilityId, panelId, actionId] of [
      [READABLE_SURFACE_OBSERVE_CAPABILITY, null, "observe"],
      [DOCS_READ_VISIBLE_SURFACE_CAPABILITY, "docs-viewer", "read_visible_surface"],
      [DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY, "docs-viewer", "read_active_translation"],
      [CALCULATOR_READ_VISIBLE_RESULT_CAPABILITY, "scientific-calculator", "read_visible_result"],
    ] as const) {
      expect(manifest.capabilities).toContainEqual(
        expect.objectContaining({
          capability_id: capabilityId,
          panel_id: panelId,
          action_id: actionId,
          mode: "read",
          mutating: false,
          code_mutation: false,
          shell_access: false,
          requires_source: true,
          permission_profile_required: "read",
          output_observation_schema: "helix.workstation_readable_surface_observation.v1",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      );
    }
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: REPO_SEARCH_CAPABILITY,
        panel_id: "repo-evidence",
        action_id: "search",
        mode: "read",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        requires_source: true,
        permission_profile_required: "read",
        output_observation_schema: "helix.repo_search_observation.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: CALCULATOR_OPEN_PANEL_CAPABILITY,
        panel_id: "scientific-calculator",
        action_id: "open_panel",
        mode: "act",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        permission_profile_required: "act",
        output_observation_schema: "helix.workstation_ui_action_receipt.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: CALCULATOR_SHOW_GATEWAY_SOLVE_CAPABILITY,
        panel_id: "scientific-calculator",
        action_id: "show_gateway_solve",
        mode: "act",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        requires_source: true,
        permission_profile_required: "act",
        output_observation_schema: "helix.workstation_ui_action_receipt.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: DOCS_OPEN_DOC_CAPABILITY,
        panel_id: "docs-viewer",
        action_id: "open_doc",
        mode: "act",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        requires_source: true,
        permission_profile_required: "act",
        output_observation_schema: "helix.workstation_ui_action_receipt.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: WORKSTATION_OPEN_PANEL_CAPABILITY,
        panel_id: null,
        action_id: "open_panel",
        dynamic_panel_id_arg: "panel_id",
        allowed_panel_ids: expect.arrayContaining(["docs-viewer", "scientific-calculator", "workstation-process-graph"]),
        mode: "act",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        permission_profile_required: "act",
        output_observation_schema: "helix.workstation_ui_action_receipt.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: DOCS_SEARCH_CAPABILITY,
        panel_id: "docs-viewer",
        action_id: "search_docs",
        mode: "read",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        requires_source: true,
        permission_profile_required: "read",
        output_observation_schema: "helix.docs_search_observation.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: INTERNET_SEARCH_CAPABILITY,
        panel_id: "internet-search",
        action_id: "search_web",
        mode: "read",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        requires_source: true,
        permission_profile_required: "read",
        output_observation_schema: "helix.internet_search_observation.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
        panel_id: "scholarly-research",
        action_id: "lookup_papers",
        mode: "read",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        requires_source: true,
        permission_profile_required: "read",
        output_observation_schema: "helix.scholarly_research_observation.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
        panel_id: "scholarly-research",
        action_id: "fetch_full_text",
        mode: "read",
        permission_profile_required: "read",
        output_observation_schema: "helix.scholarly_full_text_observation.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
        panel_id: "scholarly-research",
        action_id: "extract_numeric_parameters",
        mode: "read",
        permission_profile_required: "read",
        output_observation_schema: "helix.scholarly_numeric_parameter_observation.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: THEORY_CONTEXT_REFLECTION_CAPABILITY,
        panel_id: "theory-badge-graph",
        action_id: "reflect_discussion_context",
        mode: "read",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        requires_source: true,
        permission_profile_required: "read",
        output_observation_schema: "helix.theory_context_reflection_observation.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: THEORY_FRONTIER_CONJECTURE_CAPABILITY,
        panel_id: "theory-badge-graph",
        action_id: "propose_frontier_conjectures",
        mode: "read",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        requires_source: true,
        permission_profile_required: "read",
        output_observation_schema: "helix.theory_frontier_conjecture_observation.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        panel_id: "civilization-bounds-roadmap",
        action_id: "reflect_system_bounds",
        mode: "read",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        requires_source: true,
        permission_profile_required: "read",
        output_observation_schema: "helix.civilization_bounds_reflection_observation.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    for (const [capabilityId, actionId] of CONTEXT_FEED_QUERY_CAPABILITIES) {
      expect(manifest.capabilities).toContainEqual(
        expect.objectContaining({
          capability_id: capabilityId,
          panel_id: "live-answer-environment",
          action_id: actionId,
          mode: "read",
          mutating: false,
          code_mutation: false,
          shell_access: false,
          requires_source: false,
          permission_profile_required: "read",
          output_observation_schema: "helix.live_environment_tool_observation.v1",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      );
    }
    expect(manifest.capabilities).toContainEqual(
      expect.objectContaining({
        capability_id: LIVE_SOURCE_LOOP_HEALTH_CAPABILITY,
        panel_id: "live-answer-environment",
        action_id: "query_live_source_loop_health",
        mode: "read",
        mutating: false,
        code_mutation: false,
        shell_access: false,
        requires_source: false,
        permission_profile_required: "read",
        output_observation_schema: "helix.live_environment_tool_observation.v1",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    );
    for (const [capabilityId, actionId] of LIVE_SOURCE_STATE_READ_CAPABILITIES) {
      expect(manifest.capabilities).toContainEqual(
        expect.objectContaining({
          capability_id: capabilityId,
          panel_id: "live-answer-environment",
          action_id: actionId,
          mode: "read",
          mutating: false,
          code_mutation: false,
          shell_access: false,
          requires_source: false,
          permission_profile_required: "read",
          output_observation_schema: "helix.live_environment_tool_observation.v1",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      );
    }
    for (const [capabilityId, actionId] of SITUATION_STAGE_STATE_READ_CAPABILITIES) {
      expect(manifest.capabilities).toContainEqual(
        expect.objectContaining({
          capability_id: capabilityId,
          panel_id: "live-answer-environment",
          action_id: actionId,
          mode: "read",
          mutating: false,
          code_mutation: false,
          shell_access: false,
          requires_source: false,
          permission_profile_required: "read",
          output_observation_schema: "helix.live_environment_tool_observation.v1",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      );
    }
    for (const [capabilityId, actionId] of MICRO_REASONER_READ_CAPABILITIES) {
      expect(manifest.capabilities).toContainEqual(
        expect.objectContaining({
          capability_id: capabilityId,
          panel_id: "live-answer-environment",
          action_id: actionId,
          mode: "read",
          mutating: false,
          code_mutation: false,
          shell_access: false,
          requires_source: false,
          permission_profile_required: "read",
          output_observation_schema: "helix.live_environment_tool_observation.v1",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      );
    }
    for (const [capabilityId, actionId] of VISUAL_OBSERVER_READ_CAPABILITIES) {
      expect(manifest.capabilities).toContainEqual(
        expect.objectContaining({
          capability_id: capabilityId,
          panel_id: "live-answer-environment",
          action_id: actionId,
          mode: "read",
          mutating: false,
          code_mutation: false,
          shell_access: false,
          requires_source: false,
          permission_profile_required: "read",
          output_observation_schema: "helix.live_environment_tool_observation.v1",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      );
    }
  });

  it("calls workspace_os.status as an observation packet, not an answer", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "observe",
      capabilityId: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
      arguments: {
        thread_id: "helix-ask:test",
        capability_ids: ["runtime.memory"],
      },
      turnId: "ask:test:gateway",
      iteration: 1,
    });

    expect(result).toMatchObject({
      manifest_version: "read-observe-act.v1",
      ok: true,
      agent_runtime: "codex",
      capability_id: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
      gateway_admission: {
        schema: "helix.workstation_tool_gateway.admission.v1",
        requested_capability: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
        selected_agent_provider: "codex",
        permission_profile: "observe",
        admission_status: "admitted",
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      tool_lifecycle_trace: {
        schema: "helix.tool_lifecycle_trace.v1",
        turn_id: "ask:test:gateway",
        tool_family: "workstation_tool_gateway",
        requested_capability: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
        admitted_capability: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
        executed_capability: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
        lifecycle_stage: "completed",
        status: "completed",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      tool_followup_decision: {
        schema: "helix.tool_followup_decision.v1",
        turn_id: "ask:test:gateway",
        next_action: "continue_reasoning",
        terminal_blockers: ["post_tool_model_step_required", "terminal_authority_not_evaluated"],
        required_surface_satisfied: true,
        evidence_reentered: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(result.observation_packet).toMatchObject({
      schema: "helix.agent_step_observation_packet.v1",
      turn_id: "ask:test:gateway",
      iteration: 1,
      capability_key: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
      panel_id: "workspace-os",
      action: "status",
      status: "succeeded",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.observation).toMatchObject({
      schema: "helix.workspace_os_status_observation.v1",
      capability_key: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("calls workstation.active_context as bounded open-panel observation", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: WORKSTATION_ACTIVE_CONTEXT_CAPABILITY,
      arguments: {
        workspace_context: {
          activePanel: "docs-viewer",
          activeGroupId: "main",
          groupCount: 2,
          openPanels: ["docs-viewer", "scientific-calculator", "workstation-process-graph"],
        },
      },
      turnId: "ask:test:gateway-workstation-active-context",
      iteration: 2,
    });

    expect(result).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: WORKSTATION_ACTIVE_CONTEXT_CAPABILITY,
      gateway_admission: {
        requested_capability: WORKSTATION_ACTIVE_CONTEXT_CAPABILITY,
        selected_agent_provider: "codex",
        permission_profile: "read",
        admission_status: "admitted",
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        schema: "helix.agent_step_observation_packet.v1",
        turn_id: "ask:test:gateway-workstation-active-context",
        iteration: 2,
        capability_key: WORKSTATION_ACTIVE_CONTEXT_CAPABILITY,
        panel_id: "workstation",
        action: "active_context",
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.workstation_active_context_observation.v1",
        capability_key: WORKSTATION_ACTIVE_CONTEXT_CAPABILITY,
        status: "succeeded",
        active_panel: "docs-viewer",
        active_group_id: "main",
        group_count: 2,
        open_panels: ["docs-viewer", "scientific-calculator", "workstation-process-graph"],
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("blocks workstation.active_context when no bounded panel state was supplied", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: WORKSTATION_ACTIVE_CONTEXT_CAPABILITY,
      arguments: {
        workspace_context: {},
      },
      turnId: "ask:test:gateway-workstation-active-context-missing",
      iteration: 3,
    });

    expect(result).toMatchObject({
      ok: false,
      capability_id: WORKSTATION_ACTIVE_CONTEXT_CAPABILITY,
      error: "workstation_active_context_missing",
      gateway_admission: {
        admission_status: "blocked",
        blocked_reason: "workstation_active_context_missing",
      },
      observation_packet: {
        status: "blocked",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
        missing_requirements: [
          expect.objectContaining({
            code: "workstation_active_context_missing",
            repair_action: "ask_user",
          }),
        ],
      },
      observation: {
        schema: "helix.workstation_active_context_observation.v1",
        status: "blocked",
        blocked_reason: "workstation_active_context_missing",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("calls read-only live environment context feeds as non-terminal gateway observations", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: "live_env.query_visual_summaries",
      arguments: {
        thread_id: "helix-ask:test-context-feed",
        limit: 2,
      },
      turnId: "ask:test:gateway-context-feed",
      iteration: 4,
    });

    expect(result).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: "live_env.query_visual_summaries",
      gateway_admission: {
        requested_capability: "live_env.query_visual_summaries",
        selected_agent_provider: "codex",
        permission_profile: "read",
        admission_status: "admitted",
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        schema: "helix.agent_step_observation_packet.v1",
        turn_id: "ask:test:gateway-context-feed",
        iteration: 4,
        capability_key: "live_env.query_visual_summaries",
        panel_id: "live-answer-environment",
        action: "query_visual_summaries",
        status: "succeeded",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        produced_affordances: [],
        consumed_affordances: [],
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.live_environment_tool_observation.v1",
        thread_id: "helix-ask:test-context-feed",
        tool_name: "live_env.query_visual_summaries",
        ok: true,
        context_role: "tool_evidence",
        ask_context_policy: "evidence_only",
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        observation: {
          schema: "stage_play_workstation_context_feed_query_result/v1",
          feedKind: "visual_summaries",
          status: "read",
          post_tool_model_step_required: true,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
      },
      tool_lifecycle_trace: {
        requested_capability: "live_env.query_visual_summaries",
        admitted_capability: "live_env.query_visual_summaries",
        executed_capability: "live_env.query_visual_summaries",
        lifecycle_stage: "completed",
        status: "completed",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      tool_followup_decision: {
        next_action: "continue_reasoning",
        terminal_blockers: ["post_tool_model_step_required", "terminal_authority_not_evaluated"],
        required_surface_satisfied: true,
        evidence_reentered: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("preserves scientific notation in exact calculator expressions", async () => {
    const expression = "2.26e18*164.8*1.602176634e-19";
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
      arguments: { expression },
      turnId: "ask:test:gateway-calculator-scientific-notation",
      iteration: 2,
    });

    expect(result).toMatchObject({
      ok: true,
      observation: {
        expression,
        normalized_expression: expression,
        result: "59.672748298",
        status: "succeeded",
      },
      produced_affordances: expect.arrayContaining([
        expect.objectContaining({
          kind: "calculator_result",
          expression,
          result: "59.672748298",
        }),
      ]),
    });
  });

  it("calls source health as a read-only non-terminal gateway observation", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: "live_env.query_source_health",
      arguments: {
        thread_id: "helix-ask:test-source-health",
      },
      turnId: "ask:test:gateway-source-health",
      iteration: 5,
    });

    expect(result).toMatchObject({
      ok: true,
      capability_id: "live_env.query_source_health",
      gateway_admission: {
        admission_status: "admitted",
        permission_profile: "read",
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        capability_key: "live_env.query_source_health",
        panel_id: "live-answer-environment",
        action: "query_source_health",
        status: "succeeded",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.live_environment_tool_observation.v1",
        thread_id: "helix-ask:test-source-health",
        tool_name: "live_env.query_source_health",
        ok: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        observation: {
          schema: "helix.situation_source_capability_read.v1",
          status: "read",
          requiredActuator: "query_source_health",
          post_tool_model_step_required: true,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
      },
      tool_followup_decision: {
        next_action: "continue_reasoning",
        terminal_blockers: ["post_tool_model_step_required", "terminal_authority_not_evaluated"],
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("calls live-source loop health as a read-only non-terminal gateway observation", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "future",
      mode: "read",
      capabilityId: LIVE_SOURCE_LOOP_HEALTH_CAPABILITY,
      arguments: {
        thread_id: "helix-ask:test-loop-health",
        expected_cadence_ms: 1000,
      },
      turnId: "ask:test:gateway-loop-health",
      iteration: 6,
    });

    expect(result).toMatchObject({
      ok: true,
      agent_runtime: "future",
      capability_id: LIVE_SOURCE_LOOP_HEALTH_CAPABILITY,
      gateway_admission: {
        requested_capability: LIVE_SOURCE_LOOP_HEALTH_CAPABILITY,
        selected_agent_provider: "future",
        permission_profile: "read",
        admission_status: "admitted",
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        capability_key: LIVE_SOURCE_LOOP_HEALTH_CAPABILITY,
        panel_id: "live-answer-environment",
        action: "query_live_source_loop_health",
        status: "succeeded",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.live_environment_tool_observation.v1",
        thread_id: "helix-ask:test-loop-health",
        tool_name: LIVE_SOURCE_LOOP_HEALTH_CAPABILITY,
        ok: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        observation: {
          schema: "stage_play_live_source_loop_health/v1",
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
      },
      tool_lifecycle_trace: {
        requested_capability: LIVE_SOURCE_LOOP_HEALTH_CAPABILITY,
        admitted_capability: LIVE_SOURCE_LOOP_HEALTH_CAPABILITY,
        executed_capability: LIVE_SOURCE_LOOP_HEALTH_CAPABILITY,
        lifecycle_stage: "completed",
        status: "completed",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("calls live-source state reads as read-only non-terminal gateway observations", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: "live_env.query_live_source_quality",
      arguments: {
        thread_id: "helix-ask:test-live-source-quality",
        source_ref: "live-source:test-quality",
      },
      turnId: "ask:test:gateway-live-source-quality",
      iteration: 7,
    });

    expect(result).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: "live_env.query_live_source_quality",
      gateway_admission: {
        requested_capability: "live_env.query_live_source_quality",
        selected_agent_provider: "codex",
        permission_profile: "read",
        admission_status: "admitted",
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        capability_key: "live_env.query_live_source_quality",
        panel_id: "live-answer-environment",
        action: "query_live_source_quality",
        status: "succeeded",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.live_environment_tool_observation.v1",
        thread_id: "helix-ask:test-live-source-quality",
        tool_name: "live_env.query_live_source_quality",
        ok: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        observation: {
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      tool_lifecycle_trace: {
        requested_capability: "live_env.query_live_source_quality",
        admitted_capability: "live_env.query_live_source_quality",
        executed_capability: "live_env.query_live_source_quality",
        lifecycle_stage: "completed",
        status: "completed",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("calls situation/stage state reads as read-only non-terminal gateway observations", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: "live_env.query_event_log",
      arguments: {
        thread_id: "helix-ask:test-event-log",
        source_ref: "live-env:event-log",
        limit: 2,
      },
      turnId: "ask:test:gateway-event-log",
      iteration: 8,
    });

    expect(result).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: "live_env.query_event_log",
      gateway_admission: {
        requested_capability: "live_env.query_event_log",
        selected_agent_provider: "codex",
        permission_profile: "read",
        admission_status: "admitted",
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        capability_key: "live_env.query_event_log",
        panel_id: "live-answer-environment",
        action: "query_event_log",
        status: "succeeded",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.live_environment_tool_observation.v1",
        thread_id: "helix-ask:test-event-log",
        tool_name: "live_env.query_event_log",
        ok: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
      tool_lifecycle_trace: {
        requested_capability: "live_env.query_event_log",
        admitted_capability: "live_env.query_event_log",
        executed_capability: "live_env.query_event_log",
        lifecycle_stage: "completed",
        status: "completed",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("calls micro-reasoner preset query as a read-only non-terminal gateway observation", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: "live_env.query_micro_reasoner_presets",
      arguments: {
        thread_id: "helix-ask:test-micro-presets",
        source_id: "workstation-source:microdeck-test",
      },
      turnId: "ask:test:gateway-micro-presets",
      iteration: 7,
    });

    expect(result).toMatchObject({
      ok: true,
      capability_id: "live_env.query_micro_reasoner_presets",
      gateway_admission: {
        admission_status: "admitted",
        permission_profile: "read",
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        capability_key: "live_env.query_micro_reasoner_presets",
        panel_id: "live-answer-environment",
        action: "query_micro_reasoner_presets",
        status: "succeeded",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.live_environment_tool_observation.v1",
        thread_id: "helix-ask:test-micro-presets",
        tool_name: "live_env.query_micro_reasoner_presets",
        ok: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        observation: {
          schema: "stage_play_micro_reasoner_prompt_preset_query_result/v1",
          post_tool_model_step_required: true,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
      },
      tool_followup_decision: {
        next_action: "continue_reasoning",
        terminal_blockers: ["post_tool_model_step_required", "terminal_authority_not_evaluated"],
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("calls micro-reasoner prompt test as a dry-run non-terminal gateway observation", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "future",
      mode: "read",
      capabilityId: "live_env.test_micro_reasoner_prompt",
      arguments: {
        thread_id: "helix-ask:test-micro-prompt-test",
        source_id: "workstation-source:microdeck-test",
        role: "claim_extractor",
        limit: 1,
      },
      turnId: "ask:test:gateway-micro-prompt-test",
      iteration: 8,
    });

    expect(result).toMatchObject({
      ok: true,
      agent_runtime: "future",
      capability_id: "live_env.test_micro_reasoner_prompt",
      observation_packet: {
        capability_key: "live_env.test_micro_reasoner_prompt",
        panel_id: "live-answer-environment",
        action: "test_micro_reasoner_prompt",
        status: "succeeded",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.live_environment_tool_observation.v1",
        thread_id: "helix-ask:test-micro-prompt-test",
        tool_name: "live_env.test_micro_reasoner_prompt",
        ok: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        observation: {
          schema: "stage_play_micro_reasoner_prompt_test_result/v1",
          activated: false,
          post_tool_model_step_required: true,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
      },
      tool_lifecycle_trace: {
        requested_capability: "live_env.test_micro_reasoner_prompt",
        admitted_capability: "live_env.test_micro_reasoner_prompt",
        executed_capability: "live_env.test_micro_reasoner_prompt",
        lifecycle_stage: "completed",
        status: "completed",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("calls visual observer profile query as a read-only non-terminal gateway observation", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: "live_env.query_visual_observer_profiles",
      arguments: {
        thread_id: "helix-ask:test-visual-observer-query",
        source_id: "workstation-source:visual-observer-test",
        limit: 3,
      },
      turnId: "ask:test:gateway-visual-observer-query",
      iteration: 9,
    });

    expect(result).toMatchObject({
      ok: true,
      capability_id: "live_env.query_visual_observer_profiles",
      gateway_admission: {
        admission_status: "admitted",
        permission_profile: "read",
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        capability_key: "live_env.query_visual_observer_profiles",
        panel_id: "live-answer-environment",
        action: "query_visual_observer_profiles",
        status: "succeeded",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.live_environment_tool_observation.v1",
        thread_id: "helix-ask:test-visual-observer-query",
        tool_name: "live_env.query_visual_observer_profiles",
        ok: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        observation: {
          schema: "stage_play_visual_observer_profile_list_response/v1",
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
      },
      tool_followup_decision: {
        next_action: "continue_reasoning",
        terminal_blockers: ["post_tool_model_step_required", "terminal_authority_not_evaluated"],
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("calls visual observer profile test as a dry-run non-terminal gateway observation", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "future",
      mode: "read",
      capabilityId: "live_env.test_visual_observer_profile",
      arguments: {
        thread_id: "helix-ask:test-visual-observer-test",
        source_id: "workstation-source:visual-observer-test",
        profile_id: "stage_play_visual_observer_profile:generic:v1",
        generic_summary: "{\"summary\":\"generic frame summary\"}",
        profile_summary: "{\"summary\":\"profile frame summary\"}",
      },
      turnId: "ask:test:gateway-visual-observer-test",
      iteration: 10,
    });

    expect(result).toMatchObject({
      ok: true,
      agent_runtime: "future",
      capability_id: "live_env.test_visual_observer_profile",
      observation_packet: {
        capability_key: "live_env.test_visual_observer_profile",
        panel_id: "live-answer-environment",
        action: "test_visual_observer_profile",
        status: "succeeded",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.live_environment_tool_observation.v1",
        thread_id: "helix-ask:test-visual-observer-test",
        tool_name: "live_env.test_visual_observer_profile",
        ok: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
        observation: {
          schema: "stage_play_visual_observer_profile_test_result/v1",
          enqueuedAsMail: false,
          enqueued_as_mail: false,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
      },
      tool_lifecycle_trace: {
        requested_capability: "live_env.test_visual_observer_profile",
        admitted_capability: "live_env.test_visual_observer_profile",
        executed_capability: "live_env.test_visual_observer_profile",
        lifecycle_stage: "completed",
        status: "completed",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("does not expose mutating visual observer controls through the provider gateway", async () => {
    const gatewayIds = listWorkstationGatewayCapabilities({
      agentRuntime: "codex",
      mode: "act",
    }).capabilities.map((capability) => capability.capability_id);

    for (const capabilityId of [
      "live_env.configure_visual_observer_profile",
      "live_env.apply_visual_observer_profile",
      "live_env.request_visual_action_replay",
    ]) {
      expect(gatewayIds).not.toContain(capabilityId);
      const result = await callWorkstationGatewayCapability({
        agentRuntime: "codex",
        mode: "act",
        capabilityId,
        turnId: `ask:test:gateway-visual-observer-held-back:${capabilityId}`,
      });
      expect(result).toMatchObject({
        ok: false,
        capability_id: capabilityId,
        error: "capability_not_registered",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      });
    }
  });

  it("calls scientific-calculator.solve_expression as read-only non-terminal evidence", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
      arguments: {
        expression: "2 + 2 * 3",
      },
      turnId: "ask:test:gateway-calculator",
      iteration: 2,
    });

    expect(result).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
      gateway_admission: {
        requested_capability: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
        selected_agent_provider: "codex",
        permission_profile: "read",
        admission_status: "admitted",
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      observation_packet: {
        schema: "helix.agent_step_observation_packet.v1",
        turn_id: "ask:test:gateway-calculator",
        iteration: 2,
        capability_key: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
        panel_id: "scientific-calculator",
        action: "solve_expression",
        status: "succeeded",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.calculator_solve_observation.v1",
        expression: "2 + 2 * 3",
        result: "8",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("normalizes percent-of calculator phrases before solving", async () => {
    const cases = [
      ["12.5% of 54176", "(12.5 / 100) * 54176"],
      ["12.5 percent of 54176", "(12.5 / 100) * 54176"],
      ["what is 12.5% of 54176?", "(12.5 / 100) * 54176"],
    ] as const;

    for (const [expression, normalizedExpression] of cases) {
      const result = await callWorkstationGatewayCapability({
        agentRuntime: "codex",
        mode: "read",
        capabilityId: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
        arguments: {
          expression,
        },
        turnId: "ask:test:gateway-calculator-percent-normalization",
        iteration: 4,
      });

      expect(result).toMatchObject({
        ok: true,
        capability_id: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
        gateway_admission: {
          admission_status: "admitted",
          blocked_reason: undefined,
        },
        observation: {
          schema: "helix.calculator_solve_observation.v1",
          expression,
          normalized_expression: normalizedExpression,
          result: "6772",
          status: "succeeded",
          assistant_answer: false,
          raw_content_included: false,
        },
      });
    }
  });

  it("calls scientific-calculator.active_context as bounded active-panel observation", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: CALCULATOR_ACTIVE_CONTEXT_CAPABILITY,
      arguments: {
        active_context: {
          current_latex: "8 * 9",
          last_result_text: "72",
          last_normalized_expression: "8*9",
          last_ok: true,
          step_count: 1,
          recent_debug_events: [{
            action_id: "solve_expression",
            ok: true,
            input_latex: "8 * 9",
            result_text: "72",
            normalized_expression: "8*9",
            message: "solve_completed",
            ts: "2026-06-28T00:00:00.000Z",
          }],
        },
      },
      turnId: "ask:test:gateway-calculator-active-context",
      iteration: 3,
    });

    expect(result).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: CALCULATOR_ACTIVE_CONTEXT_CAPABILITY,
      gateway_admission: {
        requested_capability: CALCULATOR_ACTIVE_CONTEXT_CAPABILITY,
        selected_agent_provider: "codex",
        permission_profile: "read",
        admission_status: "admitted",
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        schema: "helix.agent_step_observation_packet.v1",
        turn_id: "ask:test:gateway-calculator-active-context",
        iteration: 3,
        capability_key: CALCULATOR_ACTIVE_CONTEXT_CAPABILITY,
        panel_id: "scientific-calculator",
        action: "active_context",
        status: "succeeded",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.calculator_active_context_observation.v1",
        capability_key: CALCULATOR_ACTIVE_CONTEXT_CAPABILITY,
        panel_id: "scientific-calculator",
        status: "succeeded",
        current_latex: "8 * 9",
        last_result_text: "72",
        last_normalized_expression: "8*9",
        last_ok: true,
        step_count: 1,
        recent_debug_events: [
          expect.objectContaining({
            action_id: "solve_expression",
            result_text: "72",
          }),
        ],
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("blocks scientific-calculator.active_context when no bounded calculator state was supplied", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: CALCULATOR_ACTIVE_CONTEXT_CAPABILITY,
      arguments: {
        active_context: {},
      },
      turnId: "ask:test:gateway-calculator-active-context-missing",
      iteration: 4,
    });

    expect(result).toMatchObject({
      ok: false,
      capability_id: CALCULATOR_ACTIVE_CONTEXT_CAPABILITY,
      error: "calculator_active_context_missing",
      gateway_admission: {
        admission_status: "blocked",
        blocked_reason: "calculator_active_context_missing",
      },
      observation_packet: {
        status: "blocked",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
        missing_requirements: [
          expect.objectContaining({
            code: "calculator_active_context_missing",
            repair_action: "ask_user",
          }),
        ],
      },
      observation: {
        schema: "helix.calculator_active_context_observation.v1",
        status: "blocked",
        blocked_reason: "calculator_active_context_missing",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("blocks calculator panel UI actions without act permission", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: CALCULATOR_OPEN_PANEL_CAPABILITY,
      turnId: "ask:test:gateway-calculator-open-blocked",
      iteration: 3,
    });

    expect(result).toMatchObject({
      ok: false,
      capability_id: CALCULATOR_OPEN_PANEL_CAPABILITY,
      mode: "read",
      gateway_admission: {
        requested_capability: CALCULATOR_OPEN_PANEL_CAPABILITY,
        permission_profile: "act",
        admission_status: "blocked",
        admission_reason: "permission_profile_insufficient",
        blocked_reason: "permission_profile_read_does_not_allow_act",
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
      observation: {
        schema: "helix.workstation_tool_gateway.permission_blocked.v1",
        requested_mode: "read",
        required_permission_profile: "act",
        status: "blocked",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("admits calculator panel UI actions as non-terminal action receipts under act permission", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "act",
      capabilityId: CALCULATOR_OPEN_PANEL_CAPABILITY,
      turnId: "ask:test:gateway-calculator-open",
      iteration: 4,
    });

    expect(result).toMatchObject({
      ok: true,
      capability_id: CALCULATOR_OPEN_PANEL_CAPABILITY,
      mode: "act",
      gateway_admission: {
        requested_capability: CALCULATOR_OPEN_PANEL_CAPABILITY,
        permission_profile: "act",
        admission_status: "admitted",
        admission_reason: "non_mutating_workstation_ui_action",
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      observation_packet: {
        schema: "helix.agent_step_observation_packet.v1",
        capability_key: CALCULATOR_OPEN_PANEL_CAPABILITY,
        panel_id: "scientific-calculator",
        action: "open_panel",
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.workstation_ui_action_receipt.v1",
        capability_key: CALCULATOR_OPEN_PANEL_CAPABILITY,
        action_kind: "open_panel",
        panel_id: "scientific-calculator",
        status: "succeeded",
        dispatch_status: "admitted",
        workstation_action: {
          schema_version: "helix.workstation.action/v1",
          action: "open_panel",
          panel_id: "scientific-calculator",
        },
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("admits calculator gateway solve panel projection only from an observed expression/result", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "act",
      capabilityId: CALCULATOR_SHOW_GATEWAY_SOLVE_CAPABILITY,
      arguments: {
        expression: "(18+6)*3",
        normalized_expression: "(18+6)*3",
        result: "72",
        source_capability: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
        observation_ref: "ask:test:calculator-projection:scientific-calculator.solve_expression",
      },
      turnId: "ask:test:gateway-calculator-projection",
      iteration: 6,
    });

    expect(result).toMatchObject({
      ok: true,
      capability_id: CALCULATOR_SHOW_GATEWAY_SOLVE_CAPABILITY,
      mode: "act",
      gateway_admission: {
        requested_capability: CALCULATOR_SHOW_GATEWAY_SOLVE_CAPABILITY,
        permission_profile: "act",
        admission_status: "admitted",
        admission_reason: "non_mutating_workstation_ui_action",
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      observation_packet: {
        schema: "helix.agent_step_observation_packet.v1",
        capability_key: CALCULATOR_SHOW_GATEWAY_SOLVE_CAPABILITY,
        panel_id: "scientific-calculator",
        action: "show_gateway_solve",
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.workstation_ui_action_receipt.v1",
        capability_key: CALCULATOR_SHOW_GATEWAY_SOLVE_CAPABILITY,
        action_kind: "run_panel_action",
        panel_id: "scientific-calculator",
        action_id: "show_gateway_solve",
        status: "succeeded",
        dispatch_status: "admitted",
        workstation_action: {
          schema_version: "helix.workstation.action/v1",
          action: "run_panel_action",
          panel_id: "scientific-calculator",
          action_id: "show_gateway_solve",
          args: {
            expression: "(18+6)*3",
            normalized_expression: "(18+6)*3",
            result: "72",
            source_capability: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
            observation_ref: "ask:test:calculator-projection:scientific-calculator.solve_expression",
          },
        },
        source_capability: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("admits safe workstation panel open actions as non-terminal action receipts under act permission", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "act",
      capabilityId: WORKSTATION_OPEN_PANEL_CAPABILITY,
      arguments: {
        panel_id: "workstation-process-graph",
      },
      turnId: "ask:test:gateway-workstation-open-panel",
      iteration: 5,
    });

    expect(result).toMatchObject({
      ok: true,
      capability_id: WORKSTATION_OPEN_PANEL_CAPABILITY,
      mode: "act",
      gateway_admission: {
        requested_capability: WORKSTATION_OPEN_PANEL_CAPABILITY,
        permission_profile: "act",
        admission_status: "admitted",
        admission_reason: "non_mutating_workstation_ui_action",
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        capability_key: WORKSTATION_OPEN_PANEL_CAPABILITY,
        panel_id: "workstation-process-graph",
        action: "open_panel",
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.workstation_ui_action_receipt.v1",
        capability_key: WORKSTATION_OPEN_PANEL_CAPABILITY,
        action_kind: "open_panel",
        panel_id: "workstation-process-graph",
        status: "succeeded",
        dispatch_status: "admitted",
        workstation_action: {
          schema_version: "helix.workstation.action/v1",
          action: "open_panel",
          panel_id: "workstation-process-graph",
        },
        allowed_panel_ids: expect.arrayContaining(["docs-viewer", "scientific-calculator", "workstation-process-graph"]),
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("blocks workstation panel actions for mutation-adjacent panels outside the safe allowlist", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "act",
      capabilityId: WORKSTATION_FOCUS_PANEL_CAPABILITY,
      arguments: {
        panel_id: "workstation-clipboard-history",
      },
      turnId: "ask:test:gateway-workstation-focus-panel-blocked",
      iteration: 6,
    });

    expect(result).toMatchObject({
      ok: false,
      capability_id: WORKSTATION_FOCUS_PANEL_CAPABILITY,
      error: "workstation_panel_not_in_safe_allowlist",
      gateway_admission: {
        requested_capability: WORKSTATION_FOCUS_PANEL_CAPABILITY,
        permission_profile: "act",
        admission_status: "blocked",
        blocked_reason: "workstation_panel_not_in_safe_allowlist",
      },
      observation_packet: {
        panel_id: "workstation",
        action: "focus_panel",
        status: "blocked",
        missing_requirements: [
          expect.objectContaining({
            code: "workstation_panel_not_in_safe_allowlist",
            repair_action: "ask_user",
          }),
        ],
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.workstation_ui_action_receipt.v1",
        action_kind: "focus_panel",
        panel_id: null,
        status: "blocked",
        dispatch_status: "blocked",
        workstation_action: null,
        allowed_panel_ids: expect.not.arrayContaining(["workstation-clipboard-history", "workstation-notes"]),
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("admits docs-viewer.open_doc as a non-terminal action receipt under act permission", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "act",
      capabilityId: DOCS_OPEN_DOC_CAPABILITY,
      arguments: {
        path: "docs/helix-ask-codex-loop-discipline.md",
        anchor: "Patch-Time Contract",
      },
      turnId: "ask:test:gateway-docs-open-doc",
      iteration: 5,
    });

    expect(result).toMatchObject({
      ok: true,
      capability_id: DOCS_OPEN_DOC_CAPABILITY,
      mode: "act",
      gateway_admission: {
        requested_capability: DOCS_OPEN_DOC_CAPABILITY,
        permission_profile: "act",
        admission_status: "admitted",
        admission_reason: "non_mutating_workstation_ui_action",
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      observation_packet: {
        schema: "helix.agent_step_observation_packet.v1",
        capability_key: DOCS_OPEN_DOC_CAPABILITY,
        panel_id: "docs-viewer",
        action: "open_doc",
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.workstation_ui_action_receipt.v1",
        capability_key: DOCS_OPEN_DOC_CAPABILITY,
        action_kind: "open_doc",
        panel_id: "docs-viewer",
        status: "succeeded",
        dispatch_status: "admitted",
        path: "docs/helix-ask-codex-loop-discipline.md",
        anchor: "Patch-Time Contract",
        workstation_action: {
          schema_version: "helix.workstation.action/v1",
          action: "run_panel_action",
          panel_id: "docs-viewer",
          action_id: "open_doc",
          args: {
            path: "docs/helix-ask-codex-loop-discipline.md",
            anchor: "Patch-Time Contract",
          },
        },
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("blocks docs-viewer.open_doc when no safe docs path was supplied", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "act",
      capabilityId: DOCS_OPEN_DOC_CAPABILITY,
      arguments: {
        path: "../server/index.ts",
      },
      turnId: "ask:test:gateway-docs-open-doc-blocked",
      iteration: 6,
    });

    expect(result).toMatchObject({
      ok: false,
      capability_id: DOCS_OPEN_DOC_CAPABILITY,
      error: "docs_open_doc_path_missing_or_unsafe",
      gateway_admission: {
        requested_capability: DOCS_OPEN_DOC_CAPABILITY,
        permission_profile: "act",
        admission_status: "blocked",
        blocked_reason: "docs_open_doc_path_missing_or_unsafe",
      },
      observation_packet: {
        panel_id: "docs-viewer",
        action: "open_doc",
        status: "blocked",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
        missing_requirements: [
          expect.objectContaining({
            code: "docs_open_doc_path_missing_or_unsafe",
            repair_action: "ask_user",
          }),
        ],
      },
      observation: {
        schema: "helix.workstation_ui_action_receipt.v1",
        action_kind: "open_doc",
        panel_id: "docs-viewer",
        status: "blocked",
        dispatch_status: "blocked",
        workstation_action: null,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("blocks unsupported calculator expressions as non-terminal observations", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      capabilityId: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
      arguments: {
        expression: "process.exit()",
      },
      turnId: "ask:test:gateway-calculator-blocked",
    });

    expect(result).toMatchObject({
      ok: false,
      error: "unsupported_expression_syntax",
      gateway_admission: {
        requested_capability: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
        admission_status: "blocked",
        blocked_reason: "unsupported_expression_syntax",
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
      observation_packet: {
        status: "blocked",
        missing_requirements: [
          expect.objectContaining({
            code: "unsupported_expression_syntax",
            rejected_expression: "process.exit()",
            normalized_expression: "process.exit()",
            required_affordance_kind: "bound_calculator_expression",
          }),
        ],
        produced_affordances: expect.arrayContaining([
          expect.objectContaining({ kind: "calculator_result", status: "blocked" }),
        ]),
        consumed_affordances: expect.arrayContaining([
          expect.objectContaining({
            kind: "bound_calculator_expression",
            status: "missing",
            missing_inputs: ["bound_calculator_expression"],
          }),
        ]),
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      tool_lifecycle_trace: {
        schema: "helix.tool_lifecycle_trace.v1",
        requested_capability: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
        admitted_capability: null,
        executed_capability: null,
        lifecycle_stage: "blocked",
        status: "blocked",
        failure_reason: "unsupported_expression_syntax",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      tool_followup_decision: {
        schema: "helix.tool_followup_decision.v1",
        next_action: "ask_user",
        terminal_blockers: ["post_tool_model_step_required", "terminal_authority_not_evaluated"],
        required_surface_satisfied: false,
        evidence_reentered: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("calls repo.search as read-only repo evidence, not an answer", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: REPO_SEARCH_CAPABILITY,
      arguments: {
        query: "workspace_os.status",
        paths: ["server/services/helix-ask"],
        max_hits: 3,
      },
      turnId: "ask:test:gateway-repo-search",
      iteration: 3,
    });

    expect(result).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: REPO_SEARCH_CAPABILITY,
      gateway_admission: {
        requested_capability: REPO_SEARCH_CAPABILITY,
        selected_agent_provider: "codex",
        permission_profile: "read",
        admission_status: "admitted",
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      observation_packet: {
        capability_key: REPO_SEARCH_CAPABILITY,
        panel_id: "repo-evidence",
        action: "search",
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.repo_search_observation.v1",
        query: "workspace_os.status",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect((result.observation as { hit_count?: number }).hit_count).toBeGreaterThan(0);
  });

  it("falls back to bounded Node repo search when ripgrep is unavailable", async () => {
    process.env.RG_BIN = "__helix_missing_rg_binary__";
    process.env.PATH = "";
    process.env.Path = "";

    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: REPO_SEARCH_CAPABILITY,
      arguments: {
        query: "workspace_os.status",
        paths: ["server/services/helix-ask"],
        max_hits: 3,
      },
      turnId: "ask:test:gateway-repo-search-node-fallback",
      iteration: 3,
    });

    expect(result).toMatchObject({
      ok: true,
      error: undefined,
      observation_packet: {
        status: "succeeded",
      },
      observation: {
        schema: "helix.repo_search_observation.v1",
        query: "workspace_os.status",
        status: "succeeded",
        search_backend: "node_fallback",
        search_backend_bin: null,
        search_backend_reason: "ripgrep_not_found",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect((result.observation as { hit_count?: number }).hit_count).toBeGreaterThan(0);
  });

  it("falls back to bounded Node repo search when ripgrep execution fails", async () => {
    process.env.RG_BIN = process.execPath;

    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: REPO_SEARCH_CAPABILITY,
      arguments: {
        query: "workspace_os.status",
        paths: ["server/services/helix-ask"],
        max_hits: 3,
      },
      turnId: "ask:test:gateway-repo-search-rg-failure-fallback",
      iteration: 3,
    });

    expect(result).toMatchObject({
      ok: true,
      error: undefined,
      observation_packet: {
        status: "succeeded",
      },
      observation: {
        schema: "helix.repo_search_observation.v1",
        query: "workspace_os.status",
        status: "succeeded",
        search_backend: "node_fallback",
        search_backend_bin: null,
        search_backend_reason: "ripgrep_failed",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect((result.observation as { hit_count?: number }).hit_count).toBeGreaterThan(0);
  });

  it("blocks missing repo.search query as a non-terminal observation", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      capabilityId: REPO_SEARCH_CAPABILITY,
      arguments: {},
      turnId: "ask:test:gateway-repo-search-blocked",
    });

    expect(result).toMatchObject({
      ok: false,
      error: "missing_query",
      gateway_admission: {
        requested_capability: REPO_SEARCH_CAPABILITY,
        admission_status: "blocked",
        blocked_reason: "missing_query",
      },
      observation_packet: {
        status: "blocked",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("calls docs.search as read-only docs evidence, not an answer", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: DOCS_SEARCH_CAPABILITY,
      arguments: {
        query: "Helix Ask remains the grounded reasoning surface",
        paths: ["docs"],
        max_hits: 3,
      },
      turnId: "ask:test:gateway-docs-search",
      iteration: 4,
    });

    expect(result).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: DOCS_SEARCH_CAPABILITY,
      gateway_admission: {
        requested_capability: DOCS_SEARCH_CAPABILITY,
        selected_agent_provider: "codex",
        permission_profile: "read",
        admission_status: "admitted",
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      observation_packet: {
        capability_key: DOCS_SEARCH_CAPABILITY,
        panel_id: "docs-viewer",
        action: "search_docs",
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.docs_search_observation.v1",
        query: "Helix Ask remains the grounded reasoning surface",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect((result.observation as { hit_count?: number }).hit_count).toBeGreaterThan(0);
  });

  it("finds the NHM2 current status whitepaper from a multi-word docs query", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: DOCS_SEARCH_CAPABILITY,
      arguments: {
        query: "NHM2 white paper",
        paths: ["docs/research"],
        max_hits: 5,
      },
      turnId: "ask:test:gateway-docs-search-nhm2-whitepaper",
      iteration: 4,
    });

    const observation = result.observation as {
      hits?: Array<{ filePath?: string }>;
      document_candidates?: Array<{ path?: string; matched_terms?: string[] }>;
      unique_document_count?: number;
      terms?: string[];
    };
    const hits = observation.hits ?? [];
    const candidates = observation.document_candidates ?? [];
    expect(result.ok).toBe(true);
    expect(observation.terms).toContain("whitepaper");
    expect((result.observation as { hit_count?: number }).hit_count).toBeGreaterThan(0);
    expect(hits.some((hit) =>
      hit.filePath === "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
    )).toBe(true);
    expect(observation.unique_document_count).toBeGreaterThan(0);
    expect(candidates[0]?.path).toBe("docs/research/nhm2-current-status-whitepaper-2026-05-02.md");
    expect(candidates[0]?.matched_terms).toEqual(expect.arrayContaining(["nhm2", "whitepaper"]));
  });

  it("reports unique docs candidates separately from repeated line hits", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: DOCS_SEARCH_CAPABILITY,
      arguments: {
        query: "halobank paper definition congruence plan",
        paths: ["docs/architecture"],
        max_hits: 5,
      },
      turnId: "ask:test:gateway-docs-search-unique-candidates",
      iteration: 4,
    });

    const observation = result.observation as {
      hit_count?: number;
      document_candidates?: Array<{ path?: string; line_hit_count?: number }>;
      unique_document_count?: number;
    };
    expect(result.ok).toBe(true);
    expect(observation.hit_count).toBeGreaterThan(1);
    expect(observation.unique_document_count).toBeGreaterThan(0);
    expect(observation.document_candidates?.[0]).toMatchObject({
      path: "docs/architecture/halobank-paper-definition-congruence-plan.md",
    });
    expect(observation.document_candidates?.[0]?.line_hit_count).toBeGreaterThan(0);
  });

  it("ranks markdown documents ahead of sidecar docs search matches", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: DOCS_SEARCH_CAPABILITY,
      arguments: {
        query: "nhm2 current status whitepaper equation actions",
        paths: ["docs/research"],
        max_hits: 20,
      },
      turnId: "ask:test:gateway-docs-search-sidecar-ranking",
      iteration: 4,
    });

    const candidates = (result.observation as {
      document_candidates?: Array<{ path?: string }>;
    }).document_candidates ?? [];
    expect(result.ok).toBe(true);
    expect(candidates[0]?.path).toBe("docs/research/nhm2-current-status-whitepaper-2026-05-02.md");
    const sidecarIndex = candidates.findIndex((candidate) => candidate.path?.endsWith(".equation-actions.json"));
    expect(sidecarIndex === -1 || sidecarIndex > 0).toBe(true);
  });

  it("falls back to bounded Node docs search when ripgrep is unavailable", async () => {
    process.env.RG_BIN = "__helix_missing_rg_binary__";
    process.env.PATH = "";
    process.env.Path = "";

    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: DOCS_SEARCH_CAPABILITY,
      arguments: {
        query: "Helix Ask remains the grounded reasoning surface",
        paths: ["docs"],
        max_hits: 3,
      },
      turnId: "ask:test:gateway-docs-search-node-fallback",
      iteration: 4,
    });

    expect(result).toMatchObject({
      ok: true,
      error: undefined,
      observation_packet: {
        status: "succeeded",
      },
      observation: {
        schema: "helix.docs_search_observation.v1",
        query: "Helix Ask remains the grounded reasoning surface",
        status: "succeeded",
        search_backend: "node_fallback",
        search_backend_bin: null,
        search_backend_reason: "ripgrep_not_found",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect((result.observation as { hit_count?: number }).hit_count).toBeGreaterThan(0);
  });

  it("blocks missing docs.search query as a non-terminal observation", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      capabilityId: DOCS_SEARCH_CAPABILITY,
      arguments: {},
      turnId: "ask:test:gateway-docs-search-blocked",
    });

    expect(result).toMatchObject({
      ok: false,
      error: "missing_query",
      gateway_admission: {
        requested_capability: DOCS_SEARCH_CAPABILITY,
        admission_status: "blocked",
        blocked_reason: "missing_query",
      },
      observation_packet: {
        status: "blocked",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("calls internet-search.search_web as read-only web evidence, not an answer", async () => {
    process.env.TAVILY_API_KEY = "test-tavily-key";
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        results: [{
          title: "Quantum inequalities constrain warp metrics",
          url: "https://example.com/qei-warp",
          content: "Quantum inequality margins are diagnostic evidence, not physical validation.",
          published_date: "2026-06-01",
        }],
      }),
    })) as typeof fetch;

    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: INTERNET_SEARCH_CAPABILITY,
      arguments: {
        query: "QEI warp drive constraints",
        providers: ["tavily"],
        limit: 1,
      },
      turnId: "ask:test:gateway-internet-search",
      iteration: 5,
    });

    expect(result).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: INTERNET_SEARCH_CAPABILITY,
      gateway_admission: {
        requested_capability: INTERNET_SEARCH_CAPABILITY,
        permission_profile: "read",
        admission_status: "admitted",
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        capability_key: INTERNET_SEARCH_CAPABILITY,
        panel_id: "internet-search",
        action: "search_web",
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.internet_search_observation.v1",
        capability_key: INTERNET_SEARCH_CAPABILITY,
        query: "QEI warp drive constraints",
        providers_considered: ["tavily"],
        providers_called: ["tavily"],
        selected_for_answer: true,
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    });
    const observation = result.observation as {
      results?: Array<{ title?: string; url?: string }>;
      evidence_refs?: Array<{ provider?: string; url?: string }>;
    };
    expect(observation.results?.[0]).toMatchObject({
      title: "Quantum inequalities constrain warp metrics",
      url: "https://example.com/qei-warp",
    });
    expect(observation.evidence_refs?.[0]).toMatchObject({
      provider: "tavily",
      url: "https://example.com/qei-warp",
    });
  });

  it("accepts internet.search as an explicit alias for the canonical internet gateway capability", async () => {
    process.env.TAVILY_API_KEY = "test-tavily-key";
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        results: [{
          title: "Current QEI discussion",
          url: "https://example.com/current-qei",
          content: "Current web source about QEI margins.",
        }],
      }),
    })) as typeof fetch;

    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: "internet.search",
      arguments: {
        query: "current QEI warp constraints",
        providers: ["tavily"],
        limit: 1,
      },
      turnId: "ask:test:gateway-internet-search-alias",
      iteration: 5,
    });

    expect(result).toMatchObject({
      ok: true,
      capability_id: INTERNET_SEARCH_CAPABILITY,
      observation: {
        schema: "helix.internet_search_observation.v1",
        capability_key: INTERNET_SEARCH_CAPABILITY,
        selected_for_answer: true,
      },
    });
  });

  it("calls scholarly-research.lookup_papers as read-only paper evidence, not an answer", async () => {
    const calledUrls: string[] = [];
    globalThis.fetch = vi.fn(async (url) => {
      const urlText = String(url);
      calledUrls.push(urlText);
      expect(urlText).toContain("export.arxiv.org/api/query");
      return {
        ok: true,
        status: 200,
        text: async () => [
          "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
          "<feed xmlns=\"http://www.w3.org/2005/Atom\">",
          "<entry>",
          "<id>https://arxiv.org/abs/2606.00001</id>",
          "<title>Quantum inequalities for warp constraints</title>",
          "<summary>Bounded abstract about quantum inequality margins and warp metrics.</summary>",
          "<published>2026-06-01T00:00:00Z</published>",
          "<author><name>A. Researcher</name></author>",
          "</entry>",
          "</feed>",
        ].join(""),
      };
    }) as typeof fetch;

    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
      arguments: {
        query: "quantum inequalities warp drive",
        providers: ["arxiv"],
        limit: 1,
      },
      turnId: "ask:test:gateway-scholarly-search",
      iteration: 6,
    });

    expect(result).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
      gateway_admission: {
        requested_capability: SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
        permission_profile: "read",
        admission_status: "admitted",
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        capability_key: SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
        panel_id: "scholarly-research",
        action: "lookup_papers",
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.scholarly_research_observation.v1",
        capability_key: SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
        query: "quantum inequalities warp drive",
        providers_considered: ["arxiv"],
        providers_called: ["arxiv"],
        selected_for_answer: true,
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    });
    const observation = result.observation as {
      papers?: Array<{
        title?: string;
        abstract?: string;
        identifiers?: { arxiv_id?: string };
      }>;
      evidence_refs?: Array<{ provider?: string; url?: string }>;
    };
    expect(observation.papers?.[0]).toMatchObject({
      title: "Quantum inequalities for warp constraints",
      identifiers: { arxiv_id: "2606.00001" },
    });
    expect(observation.papers?.[0]?.abstract).toContain("quantum inequality margins");
    expect(observation.evidence_refs?.[0]).toMatchObject({
      provider: "arxiv",
      url: "https://arxiv.org/abs/2606.00001",
    });
    expect(calledUrls).toHaveLength(1);
    expect(calledUrls.some((url) => /internet-search|search_web|tavily|serpapi|google/i.test(url))).toBe(false);
  });

  it("returns missing scholarly provider evidence as an observation, not proof", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 429,
      text: async () => "",
    })) as typeof fetch;

    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
      arguments: {
        query: "quantum inequalities warp drive",
        providers: ["arxiv"],
        limit: 1,
      },
      turnId: "ask:test:gateway-scholarly-search-rate-limited",
      iteration: 7,
    });

    expect(result).toMatchObject({
      ok: false,
      capability_id: SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
      gateway_admission: {
        admission_status: "admitted",
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        capability_key: SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
        panel_id: "scholarly-research",
        action: "lookup_papers",
        status: "failed",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
        missing_requirements: [
          expect.objectContaining({
            code: "arxiv_http_429",
            repair_action: "repair",
          }),
          expect.objectContaining({
            code: "no_scholarly_results_returned",
            repair_action: "repair",
          }),
        ],
      },
      observation: {
        schema: "helix.scholarly_research_observation.v1",
        capability_key: SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
        query: "quantum inequalities warp drive",
        providers_considered: ["arxiv"],
        providers_called: ["arxiv"],
        papers: [],
        missing_requirements: ["arxiv_http_429", "no_scholarly_results_returned"],
        selected_for_answer: false,
        status: "failed",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: "arxiv_http_429",
    });
  });

  it("fetches accessible scholarly full text as bounded non-terminal text evidence", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: (name: string) => name.toLowerCase() === "content-type" ? "text/html" : null },
      arrayBuffer: async () => new TextEncoder().encode([
        "<html><body>",
        "<h1>Tokamak beta evidence</h1>",
        "<p>Table 1 reports electron density n = 1.0e20 m^-3 [12] and electron temperature Te = 5000 eV [12].</p>",
        "<p>The toroidal magnetic field B = 5 T is listed in the experimental setup [12].</p>",
        "</body></html>",
      ].join(" ")).buffer,
    })) as typeof fetch;

    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
      arguments: {
        query: "tokamak beta paper",
        source_url: "https://example.test/tokamak.html",
      },
      turnId: "ask:test:gateway-scholarly-full-text",
      iteration: 8,
    });

    expect(result).toMatchObject({
      ok: true,
      capability_id: SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
      observation_packet: {
        capability_key: SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
        panel_id: "scholarly-research",
        action: "fetch_full_text",
        status: "succeeded",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.scholarly_full_text_observation.v1",
        capability_key: SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
        source_kind: "html",
        pages_parsed: 1,
        selected_for_answer: true,
        context_policy: "compact_context_pack_only",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    const observation = result.observation as { selected_chunks?: Array<{ text_excerpt?: string; citation_ref?: string }> };
    expect(observation.selected_chunks?.[0]?.text_excerpt).toContain("electron density");
    expect(observation.selected_chunks?.[0]?.citation_ref).toBe("paper#page=1");
  });

  it("blocks scholarly full-text fetch when the paper identity has no fetchable source", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
      arguments: {
        query: "Correlation of the L-mode density limit with edge collisionality",
        source_ref: "Correlation of the L-mode density limit with edge collisionality",
        variable_source_plan: {
          schema: "helix.variable_source_plan.v1",
          formula_variables: ["n1_m3", "n2_m3", "sigma_m2", "v_m_s"],
          query_terms: ["fusion", "thermonuclear reaction rate", "fusion cross section", "sigma v"],
        },
      },
      turnId: "ask:test:gateway-scholarly-full-text-missing-source",
      iteration: 9,
    });

    expect(result).toMatchObject({
      ok: false,
      capability_id: SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
      error: "fetchable_paper_identity_required",
      observation_packet: {
        capability_key: SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
        action: "fetch_full_text",
        status: "blocked",
      },
      observation: {
        schema: "helix.scholarly_full_text_observation.v1",
        status: "blocked",
        blocked_reason: "fetchable_paper_identity_required",
        missing_requirements: ["fetchable_paper_identity_required"],
        scholarly_full_text_recovery_affordance: {
          schema: "helix.scholarly_full_text_recovery_affordance.v1",
          reason: "fetchable_paper_identity_required",
          recommended_next_capability: "scholarly-research.lookup_papers",
          terminal_eligible: false,
          assistant_answer: false,
        },
        selected_for_answer: false,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(result.observation_packet.state_delta).toMatchObject({
      scholarly_full_text_recovery_affordance: {
        schema: "helix.scholarly_full_text_recovery_affordance.v1",
        reason: "fetchable_paper_identity_required",
      },
    });
    expect(JSON.stringify(result.observation)).toMatch(/accessible pdf|full text|sigma v/i);
  });

  it("extracts cited numeric parameters with units and rejects missing variables", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
      arguments: {
        requested_variables: ["n_m3", "T_eV", "B_T"],
        source_ref: "paper:tokamak#page=4",
        paper: {
          title: "Tokamak beta evidence",
          doi: "10.0000/example",
          url: "https://example.test/tokamak",
        },
        variable_source_plan: {
          schema: "helix.variable_source_plan.v1",
          entries: [
            {
              variable: "B_T",
              canonical_quantity: "toroidal magnetic field",
              expected_unit: "T",
              source_classes: ["tokamak operating parameter table"],
              search_terms: ["toroidal magnetic field", "magnetic field strength"],
              extraction_aliases: ["B_T", "toroidal magnetic field", "magnetic field"],
            },
          ],
          query_terms: ["tokamak plasma beta operating parameter table"],
        },
        text_evidence: [
          "Table 1 reports electron density n = 1.0e20 m^-3 [12].",
          "The electron temperature Te = 5 keV [12].",
          "A field value is discussed without the requested unit.",
        ].join(" "),
      },
      turnId: "ask:test:gateway-scholarly-numeric",
      iteration: 9,
    });

    expect(result).toMatchObject({
      ok: false,
      capability_id: SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
      observation_packet: {
        capability_key: SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
        action: "extract_numeric_parameters",
        status: "failed",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.scholarly_numeric_parameter_observation.v1",
        capability_key: SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
        requested_variables: ["n_m3", "T_eV", "B_T"],
        missing_variables: ["B_T"],
        scholarly_numeric_recovery_affordance: {
          schema: "helix.scholarly_numeric_recovery_affordance.v1",
          reason: "missing_requested_numeric_variables",
          missing_variables: ["B_T"],
          expected_variables: [
            expect.objectContaining({
              variable: "B_T",
              canonical_quantity: "toroidal magnetic field",
              expected_unit: "T",
            }),
          ],
          expected_source_classes: ["tokamak operating parameter table"],
          terminal_eligible: false,
          post_tool_model_step_required: true,
          assistant_answer: false,
          raw_content_included: false,
        },
        selected_for_answer: false,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      error: "missing_requested_numeric_variables",
    });
    const observation = result.observation as {
      parameters?: Array<{ variable?: string; normalized_value?: number; normalized_unit?: string; evidence_ref?: string }>;
      rejected_candidates?: Array<{ variable?: string; reason?: string }>;
      scholarly_numeric_recovery_affordance?: {
        recovery_queries?: string[];
        variable_source_plan?: Record<string, unknown>;
      };
    };
    expect(observation.parameters).toEqual(expect.arrayContaining([
      expect.objectContaining({
        variable: "n_m3",
        normalized_value: 1.0e20,
        normalized_unit: "m^-3",
        evidence_ref: expect.stringContaining("scholarly-numeric:"),
      }),
      expect.objectContaining({
        variable: "T_eV",
        normalized_value: 5000,
        normalized_unit: "eV",
      }),
    ]));
    expect(observation.rejected_candidates ?? []).toEqual(expect.any(Array));
    expect(observation.scholarly_numeric_recovery_affordance?.recovery_queries).toEqual(
      expect.arrayContaining([expect.stringMatching(/B_T|toroidal magnetic field|cited values/i)]),
    );
    expect(observation.scholarly_numeric_recovery_affordance?.variable_source_plan).toMatchObject({
      schema: "helix.variable_source_plan.v1",
    });
    expect(result.observation_packet.state_delta).toMatchObject({
      scholarly_numeric_recovery_affordance: expect.objectContaining({
        schema: "helix.scholarly_numeric_recovery_affordance.v1",
        missing_variables: ["B_T"],
      }),
    });
    expect(result.observation_packet.suggested_next_steps).toEqual(expect.arrayContaining(["use_another_tool", "ask_user"]));
  });

  it("extracts alias-matched numeric parameters from table-like scholarly evidence", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
      arguments: {
        requested_variables: ["n_m3", "T_eV", "B_T", "e_charge", "mu0"],
        source_ref: "paper:tokamak#page=7",
        paper: {
          title: "Tokamak parameter table",
          doi: "10.0000/table",
          url: "https://example.test/tokamak-table",
        },
        text_evidence: [
          "Table 2. Experimental parameters from Smith et al. (2024).",
          "| quantity | symbol | value | unit |",
          "| electron density | n_e | 1.2 | 10^20 m^-3 |",
          "| electron temperature | T_e | 4.5 | keV |",
          "| toroidal magnetic field | B_t | 2.1 | T |",
          "| elementary charge | e | 1.602176634 x 10^-19 | C |",
          "| vacuum permeability | mu_0 | 4 pi x 10^-7 | H/m |",
        ].join("\n"),
      },
      turnId: "ask:test:gateway-scholarly-numeric-table",
      iteration: 10,
    });

    expect(result).toMatchObject({
      ok: true,
      capability_id: SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
      observation_packet: {
        action: "extract_numeric_parameters",
        status: "succeeded",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.scholarly_numeric_parameter_observation.v1",
        missing_variables: [],
        selected_for_answer: true,
      },
    });
    const observation = result.observation as {
      parameters?: Array<{
        variable?: string;
        normalized_value?: number;
        normalized_unit?: string;
        source_snippet?: string;
        evidence_ref?: string;
        table?: string | null;
        confidence?: string;
      }>;
    };
    expect(observation.parameters).toEqual(expect.arrayContaining([
      expect.objectContaining({
        variable: "n_m3",
        normalized_value: 1.2e20,
        normalized_unit: "m^-3",
        evidence_ref: expect.stringContaining("scholarly-numeric:"),
        confidence: "medium",
      }),
      expect.objectContaining({
        variable: "T_eV",
        normalized_value: 4500,
        normalized_unit: "eV",
      }),
      expect.objectContaining({
        variable: "B_T",
        normalized_value: 2.1,
        normalized_unit: "T",
      }),
      expect.objectContaining({
        variable: "e_charge",
        normalized_value: 1.602176634e-19,
        normalized_unit: "C",
      }),
      expect.objectContaining({
        variable: "mu0",
        normalized_value: expect.closeTo(4 * Math.PI * 1e-7, 16),
        normalized_unit: "H/m",
      }),
    ]));
    expect(observation.parameters?.every((parameter) =>
      Boolean(parameter.source_snippet && parameter.evidence_ref && parameter.table)
    )).toBe(true);
  });

  it("does not treat bare B in particle-physics prose as B_T magnetic-field evidence", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
      arguments: {
        requested_variables: ["B_T"],
        source_ref: "paper:b-physics#page=2",
        paper: {
          title: "B meson branching fraction evidence",
          url: "https://example.test/b-physics",
        },
        text_evidence: "Table 1 reports B = 2.1 T [8] for a branching-fraction fit label, not a magnetic field.",
      },
      turnId: "ask:test:gateway-scholarly-numeric-bare-b-not-field",
      iteration: 10,
    });

    expect(result).toMatchObject({
      ok: false,
      capability_id: SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
      observation: {
        requested_variables: ["B_T"],
        parameters: [],
        missing_variables: ["B_T"],
        selected_for_answer: false,
      },
      error: "missing_requested_numeric_variables",
    });
  });

  it("supports exploratory extraction of any cited supported numeric parameters", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
      arguments: {
        extraction_mode: "open_supported_parameters",
        source_ref: "paper:tokamak#page=3",
        paper: {
          title: "Tokamak exploratory operating point",
          url: "https://example.test/tokamak-open",
        },
        text_evidence: [
          "Table 1 reports electron density n_e = 2.0e19 m^-3 [3].",
          "The electron temperature T_e = 1.5 keV [3].",
        ].join(" "),
      },
      turnId: "ask:test:gateway-scholarly-numeric-open-extraction",
      iteration: 10,
    });

    expect(result).toMatchObject({
      ok: true,
      capability_id: SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
      observation_packet: {
        action: "extract_numeric_parameters",
        status: "succeeded",
      },
      observation: {
        requested_variables: [],
        missing_variables: [],
        extraction_mode: "open_supported_parameters",
        selected_for_answer: true,
      },
    });
    const observation = result.observation as {
      parameters?: Array<{ variable?: string; normalized_value?: number; normalized_unit?: string }>;
    };
    expect(observation.parameters).toEqual(expect.arrayContaining([
      expect.objectContaining({
        variable: "n_m3",
        normalized_value: 2.0e19,
        normalized_unit: "m^-3",
      }),
      expect.objectContaining({
        variable: "T_eV",
        normalized_value: 1500,
        normalized_unit: "eV",
      }),
    ]));
  });

  it("fails closed for uncited, missing-unit, and unsupported numeric candidates", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
      arguments: {
        requested_variables: ["n_m3", "T_eV", "B_T"],
        text_evidence: [
          "The electron density n_e = 8.0e19 cm^-3 [4].",
          "The electron temperature T_e = 3500 [4].",
          "The toroidal magnetic field B_t = 2.7 T was used in the discharge.",
        ].join(" "),
      },
      turnId: "ask:test:gateway-scholarly-numeric-rejections",
      iteration: 11,
    });

    expect(result).toMatchObject({
      ok: false,
      capability_id: SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
      observation_packet: {
        action: "extract_numeric_parameters",
        status: "failed",
      },
      observation: {
        requested_variables: ["n_m3", "T_eV", "B_T"],
        parameters: [],
        missing_variables: ["n_m3", "T_eV", "B_T"],
        selected_for_answer: false,
        missing_requirements: ["text_evidence_required", "missing_requested_numeric_variables"],
      },
      error: "text_evidence_required",
    });
  });

  it("reports typed numeric candidate rejection reasons when source evidence is present", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
      arguments: {
        requested_variables: ["n_m3", "T_eV", "B_T"],
        source_ref: "paper:tokamak",
        text_evidence: [
          "Table 3 reports electron density n_e = 8.0e19 cm^-3 [4].",
          "Table 3 reports electron temperature T_e = 3 T [4].",
          "This intervening sentence is deliberately long enough to keep the previous citation outside the bounded source snippet used for the field candidate. ".repeat(4),
          "The toroidal magnetic field B_t = 2.7 T was used in the discharge.",
        ].join(" "),
      },
      turnId: "ask:test:gateway-scholarly-numeric-typed-rejections",
      iteration: 12,
    });

    expect(result).toMatchObject({
      ok: false,
      capability_id: SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
      observation_packet: {
        action: "extract_numeric_parameters",
        status: "failed",
      },
      observation: {
        requested_variables: ["n_m3", "T_eV", "B_T"],
        missing_variables: ["T_eV", "B_T"],
        selected_for_answer: false,
      },
      error: "missing_requested_numeric_variables",
    });
    const observation = result.observation as {
      parameters?: Array<{ variable?: string; normalized_value?: number; normalized_unit?: string }>;
      rejected_candidates?: Array<{ variable?: string; reason?: string; text?: string }>;
    };
    expect(observation.parameters).toEqual(expect.arrayContaining([
      expect.objectContaining({
        variable: "n_m3",
        normalized_value: 8.0e25,
        normalized_unit: "m^-3",
      }),
    ]));
    expect(observation.rejected_candidates).toEqual(expect.arrayContaining([
      expect.objectContaining({ variable: "T_eV", reason: "unsupported_unit" }),
      expect.objectContaining({ variable: "B_T", reason: "uncited_value" }),
    ]));
  });

  it("accepts research-papers.search as an explicit alias for the canonical scholarly gateway capability", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => [
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
        "<feed xmlns=\"http://www.w3.org/2005/Atom\">",
        "<entry>",
        "<id>https://arxiv.org/abs/2606.00002</id>",
        "<title>Paper evidence for QEI boundaries</title>",
        "<summary>Bounded abstract about QEI boundary evidence.</summary>",
        "<published>2026-06-02T00:00:00Z</published>",
        "<author><name>B. Researcher</name></author>",
        "</entry>",
        "</feed>",
      ].join(""),
    })) as typeof fetch;

    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: "research-papers.search",
      arguments: {
        query: "QEI boundary paper evidence",
        providers: ["arxiv"],
        limit: 1,
      },
      turnId: "ask:test:gateway-research-papers-search-alias",
      iteration: 6,
    });

    expect(result).toMatchObject({
      ok: true,
      capability_id: SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
      observation: {
        schema: "helix.scholarly_research_observation.v1",
        capability_key: SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
        selected_for_answer: true,
      },
    });
  });

  it("calls civilization-bounds reflection as read-only evidence, not an answer", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
      arguments: {
        prompt: "Reflect planetary trade through civilization bounds with material inventory and governance review.",
        include_bridge_context: true,
        include_collaboration_bounds: true,
        include_falsification_hooks: true,
      },
      turnId: "ask:test:gateway-civilization-bounds",
      iteration: 5,
    });

    expect(result).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
      gateway_admission: {
        requested_capability: CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        selected_agent_provider: "codex",
        permission_profile: "read",
        admission_status: "admitted",
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      observation_packet: {
        capability_key: CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        panel_id: "civilization-bounds-roadmap",
        action: "reflect_system_bounds",
        status: "succeeded",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.civilization_bounds_reflection_observation.v1",
        capability_key: CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        panel_id: "civilization-bounds-roadmap",
        action_id: "reflect_system_bounds",
        status: "succeeded",
        prompt: "Reflect planetary trade through civilization bounds with material inventory and governance review.",
        bridge_context_included: true,
        procedural_scaffold_id: "spore_civilization_stage_procedural_scaffold",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
        authority: expect.objectContaining({
          assistant_answer: false,
          terminal_eligible: false,
          execution_permission: false,
        }),
      },
      tool_followup_decision: {
        next_action: "continue_reasoning",
        evidence_reentered: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(String((result.observation as { roadmap_id?: string }).roadmap_id ?? ""))
      .toMatch(/^civilization-bounds:/);
    expect((result.observation as { parameter_scope_kinds?: string[] }).parameter_scope_kinds)
      .toEqual(expect.arrayContaining(["material_base", "governance_institutional_capacity"]));
    expect((result.observation as { missing_evidence?: string[] }).missing_evidence)
      .toContain("source_backed_capacity_measurements");
  });

  it("blocks civilization-bounds reflection without prompt as a missing observation", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
      arguments: {},
      turnId: "ask:test:gateway-civilization-bounds-blocked",
      iteration: 6,
    });

    expect(result).toMatchObject({
      ok: false,
      capability_id: CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
      error: "civilization_bounds_prompt_missing",
      gateway_admission: {
        admission_status: "blocked",
        blocked_reason: "civilization_bounds_prompt_missing",
      },
      observation_packet: {
        status: "blocked",
        missing_requirements: [
          expect.objectContaining({
            code: "civilization_bounds_prompt_missing",
            repair_action: "ask_user",
          }),
        ],
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.civilization_bounds_reflection_observation.v1",
        status: "blocked",
        blocked_reason: "civilization_bounds_prompt_missing",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("calls theory-badge reflection as read-only evidence, not an answer", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: THEORY_CONTEXT_REFLECTION_CAPABILITY,
      arguments: {
        prompt: "Reflect QEI margin and source residual against the theory badge graph.",
        mentioned_symbols: ["QEI", "source residual"],
        mentioned_domains: ["warp metrics", "claim boundaries"],
        build_explanation_plan: true,
        limit: 4,
      },
      turnId: "ask:test:gateway-theory-reflection",
      iteration: 5,
    });

    expect(result).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: THEORY_CONTEXT_REFLECTION_CAPABILITY,
      gateway_admission: {
        requested_capability: THEORY_CONTEXT_REFLECTION_CAPABILITY,
        selected_agent_provider: "codex",
        permission_profile: "read",
        admission_status: "admitted",
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      observation_packet: {
        capability_key: THEORY_CONTEXT_REFLECTION_CAPABILITY,
        panel_id: "theory-badge-graph",
        action: "reflect_discussion_context",
        status: "succeeded",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.theory_context_reflection_observation.v1",
        capability_key: THEORY_CONTEXT_REFLECTION_CAPABILITY,
        panel_id: "theory-badge-graph",
        action_id: "reflect_discussion_context",
        status: "succeeded",
        prompt: "Reflect QEI margin and source residual against the theory badge graph.",
        conversation_context_included: false,
        receipt_schema: "helix_theory_context_reflection_tool_receipt/v1",
        reflection_terminal_eligible: false,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
        authority: expect.objectContaining({
          assistant_answer: false,
          terminal_eligible: false,
          deterministic_content_role: "observation_not_assistant_answer",
        }),
      },
      tool_followup_decision: {
        next_action: "continue_reasoning",
        evidence_reentered: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(String((result.observation as { reflection_id?: string }).reflection_id ?? "")).toMatch(/^theory-context-reflection:/);
    expect(String((result.observation as { summary?: string }).summary ?? "")).not.toHaveLength(0);
    expect((result.observation as { claim_boundary_notes?: string[] }).claim_boundary_notes?.length ?? 0)
      .toBeGreaterThan(0);
    expect((result.observation as { recommended_actions_solve?: boolean }).recommended_actions_solve).toBe(false);
  });

  it("includes calculator payload expressions in theory badge reflection observations", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: THEORY_CONTEXT_REFLECTION_CAPABILITY,
      arguments: {
        prompt:
          "What equation from the theory badge graph can be solved in the calculator for tokamak thermal pressure and confinement time?",
        mentioned_symbols: ["p_Pa", "n_m3", "T_eV", "W_th", "P_loss", "tau_E"],
        mentioned_domains: ["tokamak plasma"],
        limit: 8,
      },
      turnId: "ask:test:gateway-theory-reflection-calculator-payloads",
      iteration: 6,
    });
    const observation = result.observation as {
      calculator_payloads?: Array<Record<string, unknown>>;
      recommended_actions_solve?: boolean;
      terminal_eligible?: boolean;
      assistant_answer?: boolean;
    };

    expect(result.ok).toBe(true);
    expect(observation.calculator_payloads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          badge_id: "tokamak.plasma.thermal_pressure_proxy",
          payload_id: "tokamak_thermal_pressure_payload",
          expression: "p_Pa = n_m3*T_eV*e_charge",
          target_variable: "p_Pa",
        }),
        expect.objectContaining({
          badge_id: "tokamak.energy.confinement_time_proxy",
          payload_id: "tokamak_confinement_energy_payload",
          expression: "W_th = P_loss*tau_E",
          target_variable: "W_th",
        }),
      ]),
    );
    expect(observation.recommended_actions_solve).toBe(false);
    expect(observation.terminal_eligible).toBe(false);
    expect(observation.assistant_answer).toBe(false);
    expect(result.observation_packet).toMatchObject({
      produced_affordances: expect.arrayContaining([
        expect.objectContaining({
          kind: "calculator_expression_template",
          expression: "p_Pa = n_m3*T_eV*e_charge",
          required_inputs: ["n_m3", "T_eV"],
          source_refs: expect.arrayContaining([
            "tokamak.plasma.thermal_pressure_proxy",
            "tokamak_thermal_pressure_payload",
          ]),
          status: "available",
        }),
        expect.objectContaining({
          kind: "claim_boundary",
          status: "available",
        }),
      ]),
      typed_handoff_contract: expect.objectContaining({
        produced_affordance_kinds: expect.arrayContaining([
          "theory_context",
          "calculator_expression_template",
          "claim_boundary",
        ]),
        required_affordance_kinds: [],
      }),
    });
  });

  it("blocks theory-badge reflection without prompt as a missing observation", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: THEORY_CONTEXT_REFLECTION_CAPABILITY,
      arguments: {},
      turnId: "ask:test:gateway-theory-reflection-blocked",
      iteration: 6,
    });

    expect(result).toMatchObject({
      ok: false,
      capability_id: THEORY_CONTEXT_REFLECTION_CAPABILITY,
      error: "theory_reflection_prompt_missing",
      gateway_admission: {
        admission_status: "blocked",
        blocked_reason: "theory_reflection_prompt_missing",
      },
      observation_packet: {
        status: "blocked",
        missing_requirements: [
          expect.objectContaining({
            code: "theory_reflection_prompt_missing",
            repair_action: "ask_user",
          }),
        ],
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.theory_context_reflection_observation.v1",
        status: "blocked",
        blocked_reason: "theory_reflection_prompt_missing",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("calls theory frontier conjecture workbench as non-terminal evidence", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: THEORY_FRONTIER_CONJECTURE_CAPABILITY,
      arguments: {
        prompt:
          "Where might a useful missing badge or conjectural bridge live between QEI margin, source residual, and tensor authority?",
        mentioned_symbols: ["QEI", "source residual"],
        mentioned_domains: ["warp metrics", "claim boundaries"],
        frontier_search_seed: "gateway-frontier-conjecture-test",
        limit: 4,
      },
      turnId: "ask:test:gateway-theory-frontier-conjecture",
      iteration: 7,
    });

    expect(result).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: THEORY_FRONTIER_CONJECTURE_CAPABILITY,
      gateway_admission: {
        requested_capability: THEORY_FRONTIER_CONJECTURE_CAPABILITY,
        selected_agent_provider: "codex",
        permission_profile: "read",
        admission_status: "admitted",
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      observation_packet: {
        capability_key: THEORY_FRONTIER_CONJECTURE_CAPABILITY,
        panel_id: "theory-badge-graph",
        action: "propose_frontier_conjectures",
        status: "succeeded",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.theory_frontier_conjecture_observation.v1",
        capability_key: THEORY_FRONTIER_CONJECTURE_CAPABILITY,
        panel_id: "theory-badge-graph",
        action_id: "propose_frontier_conjectures",
        status: "succeeded",
        prompt:
          "Where might a useful missing badge or conjectural bridge live between QEI margin, source residual, and tensor authority?",
        conversation_context_included: false,
        receipt_schema: "helix_theory_context_reflection_tool_receipt/v1",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
        authority: expect.objectContaining({
          assistant_answer: false,
          terminal_eligible: false,
          deterministic_content_role: "observation_not_assistant_answer",
        }),
      },
      tool_followup_decision: {
        next_action: "continue_reasoning",
        evidence_reentered: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    const observation = result.observation as {
      reflection_id?: string;
      search_id?: string;
      frontier_candidate_count?: number;
      candidates?: Array<Record<string, unknown>>;
      recommended_actions_solve?: boolean;
      scholarly_lookup_request_count?: number;
      exact_verification_result_count?: number;
    };
    expect(String(observation.reflection_id ?? "")).toMatch(/^theory-context-reflection:/);
    expect(String(observation.search_id ?? "")).toMatch(/^(?:frontier_search|theory-frontier-search):/);
    expect(observation.frontier_candidate_count ?? 0).toBeGreaterThan(0);
    expect(observation.scholarly_lookup_request_count ?? 0).toBeGreaterThan(0);
    expect(observation.exact_verification_result_count ?? 0).toBe(observation.frontier_candidate_count);
    expect(observation.recommended_actions_solve).toBe(false);

    const firstCandidate = observation.candidates?.[0];
    expect(firstCandidate).toMatchObject({
      candidate_id: expect.any(String),
      candidate_kind: expect.stringMatching(/candidate_connection|missing_intermediate_badge|unresolved_semantic_region/),
      status: expect.stringMatching(
        /coarse_candidate|exact_verification_pending|needs_observable|needs_scholarly_evidence|blocked_by_boundary/,
      ),
      title: expect.any(String),
      summary: expect.any(String),
      nearby_badge_ids: expect.any(Array),
      proposed_relation_or_missing_badge: expect.any(String),
      biome_region: expect.any(Object),
      scale_bands: expect.any(Array),
      render_chunk_ids: expect.any(Array),
      semantic_chunk_ids: expect.any(Array),
      congruence_score: expect.any(Number),
      information_gain_bits: expect.any(Number),
      calculator_probe_available: expect.any(Boolean),
      recommended_next_actions: expect.any(Array),
      required_observables: expect.any(Array),
      required_artifacts: expect.any(Array),
      source_references: expect.any(Array),
      falsification_checks: expect.any(Array),
      claim_boundary_notes: expect.any(Array),
      promotion_allowed: false,
      terminal_eligible: false,
      assistant_answer: false,
      post_tool_model_step_required: true,
    });
  });

  it("blocks theory frontier conjecture workbench without prompt as a missing observation", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: THEORY_FRONTIER_CONJECTURE_CAPABILITY,
      arguments: {},
      turnId: "ask:test:gateway-theory-frontier-conjecture-blocked",
      iteration: 8,
    });

    expect(result).toMatchObject({
      ok: false,
      capability_id: THEORY_FRONTIER_CONJECTURE_CAPABILITY,
      error: "theory_frontier_conjecture_prompt_missing",
      gateway_admission: {
        admission_status: "blocked",
        blocked_reason: "theory_frontier_conjecture_prompt_missing",
      },
      observation_packet: {
        status: "blocked",
        missing_requirements: [
          expect.objectContaining({
            code: "theory_frontier_conjecture_prompt_missing",
            repair_action: "ask_user",
          }),
        ],
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.theory_frontier_conjecture_observation.v1",
        status: "blocked",
        blocked_reason: "theory_frontier_conjecture_prompt_missing",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("boundary-marks physical viability overclaims in frontier conjecture observations", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: THEORY_FRONTIER_CONJECTURE_CAPABILITY,
      arguments: {
        prompt:
          "Use graph placement and calculator output to prove physical viability of the warp drive candidate.",
        frontier_search_seed: "gateway-frontier-conjecture-overclaim-test",
      },
      turnId: "ask:test:gateway-theory-frontier-conjecture-overclaim",
      iteration: 9,
    });

    expect(result.ok).toBe(true);
    const observation = result.observation as {
      forbidden_claim_scan_notes?: string[];
      candidate_status_counts?: Record<string, number>;
      candidates?: Array<{
        status?: string;
        promotion_allowed?: boolean;
        terminal_eligible?: boolean;
        assistant_answer?: boolean;
        claim_boundary_notes?: string[];
      }>;
    };
    expect(observation.forbidden_claim_scan_notes?.length ?? 0).toBeGreaterThan(0);
    expect(observation.candidate_status_counts).toEqual({
      blocked_by_boundary: observation.candidates?.length ?? 0,
    });
    expect(observation.candidates?.length ?? 0).toBeGreaterThan(0);
    expect(observation.candidates?.every((candidate) => candidate.status === "blocked_by_boundary")).toBe(true);
    expect(observation.candidates?.every((candidate) => candidate.promotion_allowed === false)).toBe(true);
    expect(observation.candidates?.every((candidate) => candidate.terminal_eligible === false)).toBe(true);
    expect(observation.candidates?.every((candidate) => candidate.assistant_answer === false)).toBe(true);
    expect(observation.candidates?.[0]?.claim_boundary_notes).toEqual(
      expect.arrayContaining(observation.forbidden_claim_scan_notes ?? []),
    );
  });

  it("declares typed affordance handoff roles for every shared gateway capability", () => {
    const manifest = listWorkstationGatewayCapabilities({
      agentRuntime: "codex",
      mode: "read",
    });

    expect(manifest.capabilities.length).toBeGreaterThan(50);
    for (const capability of manifest.capabilities) {
      expect(capability.produces_affordances, capability.capability_id).toEqual(expect.any(Array));
      expect(capability.consumes_affordances, capability.capability_id).toEqual(expect.any(Array));
      expect(capability.typed_handoff_role, capability.capability_id).toMatch(/^(?:producer|consumer|producer_consumer|none)$/);
      expect(
        (capability.produces_affordances?.length ?? 0) + (capability.consumes_affordances?.length ?? 0),
        capability.capability_id,
      ).toBeGreaterThan(0);
      if (capability.typed_handoff_role === "producer") {
        expect(capability.produces_affordances?.length ?? 0, capability.capability_id).toBeGreaterThan(0);
        expect(capability.consumes_affordances?.length ?? 0, capability.capability_id).toBe(0);
      }
      if (capability.typed_handoff_role === "consumer") {
        expect(capability.produces_affordances?.length ?? 0, capability.capability_id).toBe(0);
        expect(capability.consumes_affordances?.length ?? 0, capability.capability_id).toBeGreaterThan(0);
      }
      if (capability.typed_handoff_role === "producer_consumer") {
        expect(capability.produces_affordances?.length ?? 0, capability.capability_id).toBeGreaterThan(0);
        expect(capability.consumes_affordances?.length ?? 0, capability.capability_id).toBeGreaterThan(0);
      }
      if (capability.typed_handoff_role === "none") {
        expect(capability.capability_id, capability.capability_id).toBe("__no_shared_gateway_capability_should_use_none__");
      }
    }
    expect(manifest.capabilities.find((capability) => capability.capability_id === THEORY_CONTEXT_REFLECTION_CAPABILITY)).toMatchObject({
      produces_affordances: expect.arrayContaining(["theory_context", "calculator_expression_template", "claim_boundary"]),
      typed_handoff_role: "producer",
    });
    expect(manifest.capabilities.find((capability) => capability.capability_id === CALCULATOR_SOLVE_EXPRESSION_CAPABILITY)).toMatchObject({
      consumes_affordances: expect.arrayContaining([
        "bound_calculator_expression",
        "calculator_expression_template",
        "numeric_value_evidence",
      ]),
      produces_affordances: expect.arrayContaining(["calculator_result", "numeric_value_evidence"]),
      typed_handoff_role: "producer_consumer",
    });
  });

  it("keeps ambiguous frontier conjecture prompts in broad uncertainty", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: THEORY_FRONTIER_CONJECTURE_CAPABILITY,
      arguments: {
        prompt: "Compare this idea with the other one and find possible bridge regions.",
        frontier_search_seed: "gateway-frontier-conjecture-ambiguous-test",
      },
      turnId: "ask:test:gateway-theory-frontier-conjecture-ambiguous",
      iteration: 10,
    });

    expect(result.ok).toBe(true);
    const observation = result.observation as {
      probability_terrain?: {
        uncertaintyMode?: string;
        interpretation?: string;
        placementCertainty?: number;
      };
      candidates?: Array<{ terminal_eligible?: boolean; assistant_answer?: boolean }>;
    };
    expect(observation.probability_terrain).toMatchObject({
      uncertaintyMode: "broad",
      interpretation: "placement_probability_not_truth_claim",
    });
    expect(observation.probability_terrain?.placementCertainty ?? 1).toBeLessThan(0.1);
    expect(observation.candidates?.length ?? 0).toBeGreaterThan(0);
    expect(observation.candidates?.every((candidate) => candidate.terminal_eligible === false)).toBe(true);
    expect(observation.candidates?.every((candidate) => candidate.assistant_answer === false)).toBe(true);
  });

  it("calls interim voice callout as a host-projected non-terminal receipt", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "act",
      capabilityId: VOICE_INTERIM_CALLOUT_CAPABILITY,
      arguments: {
        text: "checking now",
        thread_id: "helix-ask:test:voice",
        kind: "tool_progress",
        evidence_refs: ["ask:test:voice-positive"],
      },
      turnId: "ask:test:gateway-voice-callout",
      iteration: 8,
    });

    expect(result).toMatchObject({
      ok: true,
      agent_runtime: "codex",
      capability_id: VOICE_INTERIM_CALLOUT_CAPABILITY,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      gateway_admission: {
        requested_capability: VOICE_INTERIM_CALLOUT_CAPABILITY,
        selected_agent_provider: "codex",
        permission_profile: "act",
        admission_status: "admitted",
        assistant_answer: false,
        raw_content_included: false,
      },
      observation_packet: {
        capability_key: VOICE_INTERIM_CALLOUT_CAPABILITY,
        panel_id: "voice-delivery",
        action: "request_interim_voice_callout",
        status: "succeeded",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.interim_voice_callout_tool_result.v1",
        capability_key: VOICE_INTERIM_CALLOUT_CAPABILITY,
        status: "succeeded",
        request: {
          text: "checking now",
          authority: "provisional",
          requiresConfirmation: false,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
        receipt: {
          status: expect.stringMatching(/^(awaiting_client_playback|queued_for_retry)$/),
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
        host_projection: {
          kind: "voice_playback_request",
          playback_status: expect.stringMatching(/^(awaiting_client_playback|queued_for_retry)$/),
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
        post_tool_model_step_required: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
      tool_followup_decision: {
        next_action: "continue_reasoning",
        evidence_reentered: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    const observation = result.observation as {
      request?: { requestId?: string };
      receipt?: { receiptId?: string };
    };
    expect(observation.request?.requestId).toMatch(/^helix_interim_voice_callout_request:/);
    expect(observation.receipt?.receiptId).toMatch(/^helix_interim_voice_callout_receipt:/);
  });

  it("blocks interim voice callout when confirmation is required, without making a final answer", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "act",
      capabilityId: VOICE_INTERIM_CALLOUT_CAPABILITY,
      arguments: {
        text: "confirm before speaking",
        thread_id: "helix-ask:test:voice",
        requires_confirmation: true,
      },
      turnId: "ask:test:gateway-voice-confirmation-blocked",
      iteration: 9,
    });

    expect(result).toMatchObject({
      ok: false,
      capability_id: VOICE_INTERIM_CALLOUT_CAPABILITY,
      error: "blocked_policy",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      gateway_admission: {
        admission_status: "blocked",
        blocked_reason: "blocked_policy",
      },
      observation_packet: {
        status: "blocked",
        missing_requirements: [
          expect.objectContaining({
            code: "blocked_policy",
            repair_action: "repair",
          }),
        ],
      },
      observation: {
        schema: "helix.interim_voice_callout_tool_result.v1",
        status: "blocked",
        blocked_reason: "blocked_policy",
        request: {
          requiresConfirmation: true,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
        receipt: {
          status: "blocked_policy",
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
      },
    });
  });

  it("observes active translated docs surface as bounded non-terminal evidence", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY,
      arguments: {
        label: "visible translated section",
        source_doc_path: "docs/helix-ask-api-parity-matrix.md",
        translation_blocks: [{
          unit_id: "doc-unit:1",
          source_text: "Original sentence.",
          translated_text: "Translated sentence.",
          locale: "es",
          status: "ready",
        }],
      },
      turnId: "ask:test:gateway-readable-translation",
      iteration: 11,
    });

    expect(result).toMatchObject({
      ok: true,
      capability_id: DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY,
      observation_packet: {
        capability_key: DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY,
        panel_id: "docs-viewer",
        action: "read_active_translation",
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.workstation_readable_surface_observation.v1",
        capability_key: DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY,
        canonical_capability_key: READABLE_SURFACE_OBSERVE_CAPABILITY,
        panel_id: "docs-viewer",
        status: "succeeded",
        text: "Translated sentence.",
        source_doc_path: "docs/helix-ask-api-parity-matrix.md",
        translation: expect.objectContaining({
          locale: null,
          status: "ready",
          source_unit_ids: ["doc-unit:1"],
        }),
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("blocks missing readable surfaces before narrator delivery", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY,
      arguments: {
        label: "visible translated section",
      },
      turnId: "ask:test:gateway-readable-translation-missing",
      iteration: 12,
    });

    expect(result).toMatchObject({
      ok: false,
      capability_id: DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY,
      error: "translation_surface_missing",
      gateway_admission: {
        admission_status: "blocked",
        blocked_reason: "translation_surface_missing",
      },
      observation_packet: {
        status: "blocked",
        missing_requirements: [
          expect.objectContaining({
            code: "translation_surface_missing",
            repair_action: "ask_user",
          }),
        ],
      },
      observation: {
        schema: "helix.workstation_readable_surface_observation.v1",
        status: "blocked",
        blocked_reason: "translation_surface_missing",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("observes calculator visible result separately from draft input", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "future",
      mode: "read",
      capabilityId: CALCULATOR_READ_VISIBLE_RESULT_CAPABILITY,
      arguments: {
        active_context: {
          current_latex: "6*7",
          last_result_text: "42",
          last_normalized_expression: "6*7",
        },
      },
      turnId: "ask:test:gateway-readable-calculator",
      iteration: 13,
    });

    expect(result).toMatchObject({
      ok: true,
      capability_id: CALCULATOR_READ_VISIBLE_RESULT_CAPABILITY,
      observation: {
        schema: "helix.workstation_readable_surface_observation.v1",
        text: "42",
        calculator: {
          expression: "6*7",
          result: "42",
          result_source: "visible_result_region",
          draft_input_distinguished: true,
        },
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("blocks selected readable docs surfaces without a registered surface ref", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: DOCS_READ_VISIBLE_SURFACE_CAPABILITY,
      arguments: {
        label: "selected document paragraph",
        surface: "selected",
        selected_text: "Selected paragraph text.",
        selection_kind: "selected",
      },
      turnId: "ask:test:gateway-readable-selected-missing-ref",
      iteration: 14,
    });

    expect(result).toMatchObject({
      ok: false,
      capability_id: DOCS_READ_VISIBLE_SURFACE_CAPABILITY,
      error: "registered_surface_ref_missing",
      gateway_admission: {
        admission_status: "blocked",
        blocked_reason: "registered_surface_ref_missing",
      },
      observation_packet: {
        status: "blocked",
        missing_requirements: [
          expect.objectContaining({
            code: "registered_surface_ref_missing",
            repair_action: "ask_user",
          }),
        ],
      },
      observation: {
        schema: "helix.workstation_readable_surface_observation.v1",
        status: "blocked",
        blocked_reason: "registered_surface_ref_missing",
        text: "Selected paragraph text.",
        selection_ref: null,
        selection_kind: "selected",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("observes selected readable docs surfaces when a registered surface ref is present", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "read",
      capabilityId: DOCS_READ_VISIBLE_SURFACE_CAPABILITY,
      arguments: {
        label: "selected document paragraph",
        surface: "selected",
        selected_text: "Selected paragraph text.",
        selection_ref: "docs-viewer:selection:unit-42",
        selection_kind: "selected",
      },
      turnId: "ask:test:gateway-readable-selected-ref",
      iteration: 15,
    });

    expect(result).toMatchObject({
      ok: true,
      capability_id: DOCS_READ_VISIBLE_SURFACE_CAPABILITY,
      observation_packet: {
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      observation: {
        schema: "helix.workstation_readable_surface_observation.v1",
        status: "succeeded",
        text: "Selected paragraph text.",
        selection_ref: "docs-viewer:selection:unit-42",
        selection_kind: "selected",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("exposes readable surface observations through the Helix Native runtime lane", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "helix-native",
      mode: "read",
      capabilityId: DOCS_READ_VISIBLE_SURFACE_CAPABILITY,
      arguments: {
        label: "visible document section",
        surface: "visible_document",
        visible_text: "Helix Native visible surface text.",
        source_doc_path: "docs/helix-ask-flow.md",
      },
      turnId: "ask:test:gateway-readable-helix-native",
      iteration: 16,
    });

    expect(result).toMatchObject({
      ok: true,
      agent_runtime: "helix-native",
      capability_id: DOCS_READ_VISIBLE_SURFACE_CAPABILITY,
      gateway_admission: {
        selected_agent_provider: "helix-native",
        admission_status: "admitted",
      },
      observation: {
        schema: "helix.workstation_readable_surface_observation.v1",
        text: "Helix Native visible surface text.",
        source_doc_path: "docs/helix-ask-flow.md",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
  });

  it("calls narrator say through the same non-terminal voice receipt contract", async () => {
    const result = await callWorkstationGatewayCapability({
      agentRuntime: "future",
      mode: "act",
      capabilityId: VOICE_NARRATOR_SAY_CAPABILITY,
      arguments: {
        text: "Narrator check.",
        thread_id: "helix-ask:test:narrator",
      },
      turnId: "ask:test:gateway-narrator-say",
      iteration: 10,
    });

    expect(result).toMatchObject({
      ok: true,
      agent_runtime: "future",
      capability_id: VOICE_NARRATOR_SAY_CAPABILITY,
      observation_packet: {
        capability_key: VOICE_NARRATOR_SAY_CAPABILITY,
        panel_id: "voice-delivery",
        action: "narrator_say",
        status: "succeeded",
      },
      observation: {
        schema: "helix.interim_voice_callout_tool_result.v1",
        capability_key: VOICE_NARRATOR_SAY_CAPABILITY,
        request: {
          kind: "narrator_read",
          voicePlaybackKind: "narrator_read",
          text: "Narrator check.",
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
        receipt: {
          status: expect.stringMatching(/^(awaiting_client_playback|queued_for_retry)$/),
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
      },
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("rejects unknown capabilities as non-terminal failed observations", async () => {
    const result = await callWorkstationGatewayCapability({
      capabilityId: "filesystem.write_file",
      turnId: "ask:test:gateway",
    });

    expect(result).toMatchObject({
      ok: false,
      error: "capability_not_registered",
      gateway_admission: {
        admission_status: "blocked",
        blocked_reason: "capability_not_registered",
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
      tool_lifecycle_trace: {
        schema: "helix.tool_lifecycle_trace.v1",
        requested_capability: "filesystem.write_file",
        admitted_capability: null,
        executed_capability: "filesystem.write_file",
        lifecycle_stage: "failed",
        status: "failed",
        failure_reason: "capability_not_registered",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      tool_followup_decision: {
        schema: "helix.tool_followup_decision.v1",
        next_action: "retry",
        terminal_blockers: ["post_tool_model_step_required", "terminal_authority_not_evaluated"],
        required_surface_satisfied: false,
        evidence_reentered: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(result.observation_packet.status).toBe("failed");
  });
});
