import { describe, expect, it } from "vitest";
import {
  HELIX_WORKSTATION_TOOL_REFERENCE_LIST_REQUEST_SCHEMA,
  HELIX_WORKSTATION_TOOL_REFERENCE_VISIBLE_TRANSLATION_TARGETS_REQUEST_SCHEMA,
  type HelixWorkstationToolReferenceListRequest,
  type HelixWorkstationToolReferenceVisibleTranslationTargetsRequest,
} from "@shared/helix-workstation-tool-reference-lane";
import type { HelixAgentProvider } from "../../agent-providers/types";
import {
  runWorkstationToolReferenceCollectVisibleTranslationTargets,
  runWorkstationToolReferenceListCapabilities,
} from "../workstation-tool-reference";
import {
  HELIX_LIVE_TRANSLATION_ONE_SHOT_REQUEST_SCHEMA,
  type HelixLiveTranslationOneShotRequest,
} from "@shared/helix-live-translation-lane";
import { runLiveTranslationTranslateText } from "../live-translation";

const buildProvider = (input: {
  id: "helix" | "codex";
  workstationTools?: boolean;
}): HelixAgentProvider => ({
  id: input.id,
  label: input.id === "helix" ? "Helix Ask Native" : "Codex Workstation Mode",
  permissionProfile: {
    id: input.id === "helix" ? "helix-native" : "read-observe-act",
    label: "Read/observe plus non-mutating workstation action",
    allows: {
      observe: true,
      read: true,
      act: true,
      write: false,
      shell: false,
      codeMutation: false,
    },
  },
  enabled: () => true,
  supports: {
    streaming: input.id === "helix",
    workstationTools: input.workstationTools ?? true,
    capabilityLanes: true,
    capabilityLaneOneShot: true,
    capabilityLaneSessions: false,
    codeMutation: false,
  },
  runTurn: async () => ({
    ok: false,
    runtime: input.id,
    response_type: "test",
    final_status: "test",
  }),
});

const request = (
  input: Partial<HelixWorkstationToolReferenceListRequest> = {},
): HelixWorkstationToolReferenceListRequest => ({
  schema: HELIX_WORKSTATION_TOOL_REFERENCE_LIST_REQUEST_SCHEMA,
  capability: "workstation_tool_reference.list_capabilities",
  mode: "act",
  requested_backend_provider: null,
  turn_id: "turn-workstation-reference",
  assistant_answer: false,
  terminal_eligible: false,
  ...input,
});

const targetRequest = (
  input: Partial<HelixWorkstationToolReferenceVisibleTranslationTargetsRequest> = {},
): HelixWorkstationToolReferenceVisibleTranslationTargetsRequest => ({
  schema: HELIX_WORKSTATION_TOOL_REFERENCE_VISIBLE_TRANSLATION_TARGETS_REQUEST_SCHEMA,
  capability: "workstation_tool_reference.collect_visible_translation_targets",
  active_panel_id: "docs-viewer",
  doc_path: "docs/research/nhm2.md",
  projection_target: "docs_chunk",
  account_locale: "es-US",
  target_language: "es",
  max_chunks: 12,
  visible_only: true,
  title_text: "NHM2 frontier status",
  body_text: "The campaign remains diagnostic, not certified.",
  requested_backend_provider: null,
  turn_id: "turn-visible-translation-targets",
  assistant_answer: false,
  terminal_eligible: false,
  ...input,
});

const translationRequest = (
  input: Partial<HelixLiveTranslationOneShotRequest>,
): HelixLiveTranslationOneShotRequest => ({
  schema: HELIX_LIVE_TRANSLATION_ONE_SHOT_REQUEST_SCHEMA,
  capability: "live_translation.translate_text",
  text: "hello",
  source_language: "en",
  target_language: "es",
  requested_backend_provider: null,
  assistant_answer: false,
  terminal_eligible: false,
  ...input,
});

describe("workstation_tool_reference.list_capabilities lane", () => {
  it("returns the governed workstation gateway catalog as non-terminal observation evidence", () => {
    const result = runWorkstationToolReferenceListCapabilities({
      provider: buildProvider({ id: "codex" }),
      request: request(),
      env: {} as NodeJS.ProcessEnv,
    });

    expect(result).toMatchObject({
      schema: "helix.workstation_tool_reference.list_result.v1",
      ok: true,
      lane_id: "workstation_tool_reference",
      capability: "workstation_tool_reference.list_capabilities",
      selected_runtime_agent_provider: "codex",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.capability_count).toBeGreaterThan(0);
    expect(result.lane_resolve_trace).toMatchObject({
      requested_lane: "workstation_tool_reference",
      selected_backend_provider: "workstation_tool_reference.helix_workstation_gateway",
      selection_reason: "selected_default_backend_provider_for_shadow_manifest",
      availability_status: "available",
      permission_status: "admitted",
      cost_class: "free_local",
      latency_class: "local",
      privacy_class: "local_only",
      execution_status: "executed_observation_only",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.observation).toMatchObject({
      schema: "helix.workstation_tool_reference.list_observation.v1",
      gateway_mode: "act",
      backend_selection_decision: expect.objectContaining({
        outcome: "default_selected",
        selected_backend_provider: "workstation_tool_reference.helix_workstation_gateway",
        terminal_authority_owner: "helix",
      }),
      deterministic: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.observation?.capability_ids).toContain("docs.search");
    expect(result.observation?.capabilities[0]).toMatchObject({
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.observation_packet).toMatchObject({
      capability_key: "workstation_tool_reference.list_capabilities",
      action: "list_capabilities",
      status: "succeeded",
      backend_selection_decision: expect.objectContaining({
        outcome: "default_selected",
        selected_backend_provider: "workstation_tool_reference.helix_workstation_gateway",
        live_backend_execution_enabled: false,
      }),
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
      typed_handoff_contract: expect.objectContaining({
        produced_affordance_kinds: ["system_status"],
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    });
  });

  it("fails closed when the selected runtime provider lacks workstation tool permission", () => {
    const result = runWorkstationToolReferenceListCapabilities({
      provider: buildProvider({ id: "codex", workstationTools: false }),
      request: request(),
      env: {} as NodeJS.ProcessEnv,
    });

    expect(result).toMatchObject({
      ok: false,
      error: "selected_runtime_provider_permission_does_not_allow_lane",
      observation: null,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.observation_packet.status).toBe("blocked");
    expect(result.observation_packet.backend_selection_decision).toMatchObject({
      outcome: "blocked",
      selected_backend_provider: null,
      terminal_authority_owner: "helix",
    });
    expect(result.lane_resolve_trace).toMatchObject({
      requested_lane: "workstation_tool_reference",
      admission_status: "blocked",
      lane_status: "permission_blocked",
      execution_status: "not_executed_shadow_only",
      blocked_reason: "selected_runtime_provider_permission_does_not_allow_lane",
    });
  });
});

describe("workstation_tool_reference.collect_visible_translation_targets lane", () => {
  it("collects visible docs title/body chunks with stable source and chunk identities", () => {
    const result = runWorkstationToolReferenceCollectVisibleTranslationTargets({
      provider: buildProvider({ id: "codex" }),
      request: targetRequest(),
      env: {} as NodeJS.ProcessEnv,
    });

    expect(result).toMatchObject({
      schema: "helix.workstation_tool_reference.visible_translation_targets_result.v1",
      ok: true,
      lane_id: "workstation_tool_reference",
      capability: "workstation_tool_reference.collect_visible_translation_targets",
      selected_runtime_agent_provider: "codex",
      target_count: 2,
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.lane_resolve_trace).toMatchObject({
      requested_lane: "workstation_tool_reference",
      selected_backend_provider: "workstation_tool_reference.helix_workstation_gateway",
      execution_status: "executed_observation_only",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.observation).toMatchObject({
      schema: "helix.workstation_tool_reference.visible_translation_targets_observation.v1",
      target_batch: {
        schema: "helix.visible_translation_target_batch.v1",
        target_count: 2,
        visible_only: true,
        collector_capability: "workstation_tool_reference.collect_visible_translation_targets",
        translation_capability_required: "live_translation.translate_text",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      deterministic: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    const targets = result.observation?.target_batch.targets ?? [];
    expect(targets.map((target) => target.chunk_id)).toEqual(["visible-chunk-1", "visible-chunk-2"]);
    expect(targets).toEqual([
      expect.objectContaining({
        source_kind: "docs_viewer",
        panel_id: "docs-viewer",
        doc_path: "docs/research/nhm2.md",
        source_id: "docs/research/nhm2.md#visible-chunk-1",
        source_hash: expect.stringMatching(/^sha256:/),
        source_text_hash: expect.stringMatching(/^sha256:/),
        visible_text: "NHM2 frontier status",
        chunk_index: 0,
        region_id: "title",
        projection_target: "docs_chunk",
        account_locale: "es-US",
        target_language: "es",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
        reentry_required: true,
      }),
      expect.objectContaining({
        source_kind: "docs_viewer",
        source_id: "docs/research/nhm2.md#visible-chunk-2",
        source_text_hash: expect.stringMatching(/^sha256:/),
        visible_text: "The campaign remains diagnostic, not certified.",
        chunk_index: 1,
        region_id: "body",
      }),
    ]);
    expect(targets[0]?.source_text_hash).not.toBe(targets[1]?.source_text_hash);
    expect(result.observation_packet).toMatchObject({
      capability_key: "workstation_tool_reference.collect_visible_translation_targets",
      action: "collect_visible_translation_targets",
      status: "succeeded",
      state_delta: {
        visible_translation_target_batch: expect.objectContaining({
          target_count: 2,
          targets: expect.arrayContaining([
            expect.objectContaining({
              chunk_id: "visible-chunk-1",
              target_language: "es",
            }),
          ]),
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("feeds one collected visible doc target through live_translation.translate_text without answer authority", async () => {
    const collected = runWorkstationToolReferenceCollectVisibleTranslationTargets({
      provider: buildProvider({ id: "codex" }),
      request: targetRequest({
        visible_text_chunks: [{
          visible_text: "hello",
          chunk_id: "title",
          chunk_index: 0,
          region_id: "title",
        }],
      }),
      env: {} as NodeJS.ProcessEnv,
    });
    const target = collected.observation?.target_batch.targets[0];
    expect(target).toBeTruthy();

    const translated = await runLiveTranslationTranslateText({
      provider: buildProvider({ id: "codex" }),
      request: translationRequest({
        text: target?.visible_text,
        target_language: target?.target_language,
        source_id: target?.source_id,
        source_hash: target?.source_hash,
        source_kind: target?.source_kind,
        account_locale: target?.account_locale,
        chunk_id: target?.chunk_id,
        chunk_index: target?.chunk_index,
        dedupe_key: target?.dedupe_key,
        projection_target: target?.projection_target,
      }),
      turnId: "turn-visible-translation-targets-translate",
      env: {} as NodeJS.ProcessEnv,
    });

    expect(translated).toMatchObject({
      ok: true,
      capability: "live_translation.translate_text",
      translated_text: "hola",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(translated.observation).toMatchObject({
      source_id: "docs/research/nhm2.md#title",
      source_hash: target?.source_hash,
      source_kind: "docs_viewer",
      account_locale: "es-US",
      chunk_id: "title",
      chunk_index: 0,
      dedupe_key: target?.dedupe_key,
      projection_target: "docs_chunk",
      terminal_authority_status: "pending_helix_terminal_authority",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(translated.observation_packet.state_delta.live_translation_projection_receipt).toMatchObject({
      source_id: "docs/research/nhm2.md#title",
      source_hash: target?.source_hash,
      source_text_hash: translated.observation?.source_text_hash,
      chunk_id: "title",
      target_language: "es",
      observation_ref: translated.observation?.observation_ref,
      receipt_ref: expect.any(String),
      terminal_authority_status: "pending_helix_terminal_authority",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("fails closed when visible text targets are absent", () => {
    const result = runWorkstationToolReferenceCollectVisibleTranslationTargets({
      provider: buildProvider({ id: "codex" }),
      request: targetRequest({
        title_text: "",
        body_text: "",
        visible_text: "",
        visible_text_chunks: [],
      }),
      env: {} as NodeJS.ProcessEnv,
    });

    expect(result).toMatchObject({
      ok: false,
      observation: null,
      error: "visible_translation_targets_missing",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.observation_packet).toMatchObject({
      status: "blocked",
      capability_key: "workstation_tool_reference.collect_visible_translation_targets",
      state_delta: {
        visible_translation_target_batch: expect.objectContaining({
          target_count: 0,
          targets: [],
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      },
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });
});
