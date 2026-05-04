import { beforeEach, describe, expect, it, vi } from "vitest";

(globalThis as Record<string, unknown>).__HELIX_ASK_JOB_TIMEOUT_MS__ = "1200000";

import { useScientificCalculatorStore } from "@/store/useScientificCalculatorStore";
import { useSituationRoomGraphStore } from "@/store/useSituationRoomGraphStore";
import { useSituationRoomJobStore } from "@/store/useSituationRoomJobStore";
import { useSituationRoomStore } from "@/store/useSituationRoomStore";
import { useWorkstationClipboardStore } from "@/store/useWorkstationClipboardStore";
import { useWorkstationNotesStore } from "@/store/useWorkstationNotesStore";

const hoisted = vi.hoisted(() => {
  const callOrder: string[] = [];
  return {
    callOrder,
    openDocPanelMock: vi.fn((_: unknown) => {
      callOrder.push("openDocPanel");
    }),
    launchHelixAskPromptMock: vi.fn(),
  };
});

vi.mock("@/lib/docs/openDocPanel", () => ({
  openDocPanel: hoisted.openDocPanelMock,
}));
vi.mock("@/lib/helix/ask-prompt-launch", () => ({
  launchHelixAskPrompt: hoisted.launchHelixAskPromptMock,
}));
vi.mock("@/lib/helix/display-audio-capture", () => ({
  startDisplayAudioSituationSession: vi.fn(),
}));
vi.mock("@/lib/helix/mic-audio-situation-capture", () => ({
  startMicAudioSituationSession: vi.fn(),
}));

import { executeHelixPanelAction } from "@/lib/workstation/panelActionAdapters";

describe("panelActionAdapters", () => {
  beforeEach(() => {
    hoisted.callOrder.length = 0;
    hoisted.openDocPanelMock.mockClear();
    hoisted.launchHelixAskPromptMock.mockClear();
    useWorkstationNotesStore.setState({ notes: {}, order: [], active_note_id: undefined });
    useWorkstationClipboardStore.setState({ receipts: [] });
    useScientificCalculatorStore.setState({ currentLatex: "", history: [], lastSolve: null, steps: [], debugEvents: [] });
    useSituationRoomStore.getState().reset();
    useSituationRoomJobStore.getState().reset();
    useSituationRoomGraphStore.getState().reset();
  });

  it("opens/focuses docs panel before applying read intent", () => {
    const result = executeHelixPanelAction(
      {
        panel_id: "docs-viewer",
        action_id: "open_doc_and_read",
        args: { path: "/docs/papers.md", topic: "sun" },
      },
      {
        openPanel: () => {
          hoisted.callOrder.push("openPanel");
        },
        focusPanel: () => {
          hoisted.callOrder.push("focusPanel");
        },
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );

    expect(result.ok).toBe(true);
    expect(result.action_id).toBe("open_doc_and_read");
    expect(hoisted.callOrder).toEqual(["openPanel", "focusPanel", "openDocPanel"]);
  });

  it("launches Helix Ask for summarize/explain docs actions", () => {
    const summarizeResult = executeHelixPanelAction(
      {
        panel_id: "docs-viewer",
        action_id: "summarize_doc",
        args: { path: "/docs/papers.md" },
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(summarizeResult.ok).toBe(true);
    expect(summarizeResult.action_id).toBe("summarize_doc");
    expect(hoisted.launchHelixAskPromptMock).toHaveBeenCalledWith(
      expect.objectContaining({
        autoSubmit: true,
        panelId: "docs-viewer",
        bypassWorkstationDispatch: true,
      }),
    );
    const firstCall = hoisted.launchHelixAskPromptMock.mock.calls[0]?.[0] as { question?: string } | undefined;
    expect(firstCall?.question).toContain("Summarize this document");
    expect(firstCall?.question).toContain("/docs/papers.md");

    const explainResult = executeHelixPanelAction(
      {
        panel_id: "docs-viewer",
        action_id: "explain_paper",
        args: { path: "/docs/papers.md", selected_text: "Key excerpt" },
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(explainResult.ok).toBe(true);
    const secondCall = hoisted.launchHelixAskPromptMock.mock.calls[1]?.[0] as { question?: string } | undefined;
    expect(secondCall?.question).toContain("Explain this paper");
    expect(secondCall?.question).toContain('Selected text: "Key excerpt"');
  });

  it("creates and appends notes with deterministic artifacts", () => {
    const create = executeHelixPanelAction(
      {
        panel_id: "workstation-notes",
        action_id: "create_note",
        args: { title: "Mission Notes", topic: "nhm2" },
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(create.ok).toBe(true);
    expect(create.artifact?.note_id).toBe("note:mission-notes");

    const append = executeHelixPanelAction(
      {
        panel_id: "workstation-notes",
        action_id: "append_to_note",
        args: { title: "Mission Notes", text: "new evidence line" },
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(append.ok).toBe(true);
    expect(append.artifact?.note_id).toBe("note:mission-notes");
    const note = useWorkstationNotesStore.getState().notes["note:mission-notes"];
    expect(note?.body).toContain("new evidence line");
  });

  it("requires confirmation for destructive note and clipboard actions", () => {
    const notesState = useWorkstationNotesStore.getState();
    notesState.upsertWorkflowNote({
      id: "note:test",
      title: "Test",
      topic: "test",
      body: "abc",
      citations: [],
      snippets: [],
    });
    useWorkstationClipboardStore.getState().addReceipt({
      direction: "copy",
      text: "alpha",
      source: "spec",
    });

    const deleteBlocked = executeHelixPanelAction(
      {
        panel_id: "workstation-notes",
        action_id: "delete_note",
        args: { note_id: "note:test" },
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(deleteBlocked.ok).toBe(false);
    expect(deleteBlocked.artifact?.requires_confirmation).toBe(true);

    const clearBlocked = executeHelixPanelAction(
      {
        panel_id: "workstation-clipboard-history",
        action_id: "clear_history",
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(clearBlocked.ok).toBe(false);
    expect(clearBlocked.artifact?.requires_confirmation).toBe(true);
  });

  it("supports clipboard read/write and receipt-to-note copy", () => {
    useWorkstationClipboardStore.getState().addReceipt({
      id: "clip:latest",
      direction: "copy",
      text: "latest payload",
      source: "spec",
    });
    const notesState = useWorkstationNotesStore.getState();
    notesState.upsertWorkflowNote({
      id: "note:target",
      title: "Target",
      topic: "target",
      body: "",
      citations: [],
      snippets: [],
    });

    const read = executeHelixPanelAction(
      {
        panel_id: "workstation-clipboard-history",
        action_id: "read_clipboard",
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(read.ok).toBe(true);
    expect(read.artifact?.text).toBe("latest payload");

    const write = executeHelixPanelAction(
      {
        panel_id: "workstation-clipboard-history",
        action_id: "write_clipboard",
        args: { text: "copied text" },
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(write.ok).toBe(true);
    expect(write.artifact?.direction).toBe("write");

    const copyToNote = executeHelixPanelAction(
      {
        panel_id: "workstation-clipboard-history",
        action_id: "copy_receipt_to_note",
        args: { note_id: "note:target", receipt_id: "clip:latest" },
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(copyToNote.ok).toBe(true);
    expect(copyToNote.artifact?.note_id).toBe("note:target");
    expect(useWorkstationNotesStore.getState().notes["note:target"]?.body).toContain("latest payload");

    const copySelectionToNote = executeHelixPanelAction(
      {
        panel_id: "workstation-clipboard-history",
        action_id: "copy_selection_to_note",
        args: { note_id: "note:target" },
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(copySelectionToNote.ok).toBe(true);
    expect(copySelectionToNote.artifact?.source).toBe("clipboard_receipt");
  });

  it("supports scientific calculator ingest and solve actions", () => {
    const ingest = executeHelixPanelAction(
      {
        panel_id: "scientific-calculator",
        action_id: "ingest_latex",
        args: { latex: "x^2-4=0", source_path: "/docs/papers.md" },
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(ingest.ok).toBe(true);
    expect(ingest.artifact?.latex).toBe("x^2-4=0");
    expect(ingest.artifact?.debug_event).toEqual(
      expect.objectContaining({
        panel_id: "scientific-calculator",
        action_id: "ingest_latex",
        source: "workstation_action",
      }),
    );

    const solve = executeHelixPanelAction(
      {
        panel_id: "scientific-calculator",
        action_id: "solve_with_steps",
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(solve.ok).toBe(true);
    expect(typeof solve.artifact?.result_text).toBe("string");
    expect((solve.artifact?.steps_count as number) > 0).toBe(true);
    expect(Array.isArray(solve.artifact?.steps)).toBe(true);
    expect(solve.artifact?.trace).toEqual(
      expect.objectContaining({
        route: "scientific-calculator/nerdamer",
        engine: "nerdamer",
        sourceOfTruth: "scientific_calculator",
      }),
    );
    expect(solve.artifact?.debug_event).toEqual(
      expect.objectContaining({
        action_id: "solve_with_steps",
        source: "workstation_action",
      }),
    );

    const copyResult = executeHelixPanelAction(
      {
        panel_id: "scientific-calculator",
        action_id: "copy_result",
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(copyResult.ok).toBe(true);
    expect(copyResult.artifact?.debug_event).toEqual(
      expect.objectContaining({
        action_id: "copy_result",
        source: "workstation_action",
      }),
    );

    const copyDebugLog = executeHelixPanelAction(
      {
        panel_id: "scientific-calculator",
        action_id: "copy_debug_log",
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(copyDebugLog.ok).toBe(true);
    expect(copyDebugLog.artifact?.debug_event).toEqual(
      expect.objectContaining({
        action_id: "copy_debug_log",
        source: "workstation_action",
      }),
    );
    expect(String(copyDebugLog.artifact?.text)).toContain("scientific_calculator_debug_log");
  });

  it("delegates Situation Room source and pipeline actions", () => {
    const room = useSituationRoomStore.getState().createRoom("Delegation Room");
    useSituationRoomStore.getState().appendSituationEvent({
      id: "evt:delegation:1",
      room_id: room.room_id,
      source: "display_tab_audio",
      event_type: "voice_transcript",
      text: "Tenemos que esperar la resistencia al fuego.",
      classification: "info",
      evidence_refs: ["situation-room://delegation/chunk/0001"],
      capture_session_id: "cap:delegation",
      chunk_index: 0,
      ts: "2026-05-01T00:00:00.000Z",
      meta: {
        source_text: "Tenemos que esperar la resistencia al fuego.",
        source_language: "es",
        translated: false,
      },
    });

    const createJob = executeHelixPanelAction(
      {
        panel_id: "situation-room-pipelines",
        action_id: "create_job",
        args: { kind: "translate", target_language: "es" },
      },
      {
        openPanel: vi.fn(),
        focusPanel: vi.fn(),
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );

    expect(createJob.ok).toBe(true);
    expect(createJob.artifact?.room_id).toBe(room.room_id);
    expect(createJob.artifact?.kind).toBe("translate");
    expect(createJob.artifact?.target_language).toBe("es");
    expect(createJob.artifact?.attachment_policy).toBe("manual_only");
    expect(createJob.artifact?.context_injection).toBe("explicit_attachment_only");
    expect(createJob.artifact?.derived_outputs_auto_attach).toBe(false);
    expect(createJob.artifact?.command_lane_enabled).toBe(false);

    const jobId = String(createJob.artifact?.job_id ?? "");
    const attachRoom = executeHelixPanelAction(
      {
        panel_id: "situation-room-sources",
        action_id: "attach_room_to_helix_ask",
        args: { room_id: room.room_id },
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(attachRoom.ok).toBe(true);
    expect(attachRoom.artifact?.room_id).toBe(room.room_id);

    const runJob = executeHelixPanelAction(
      {
        panel_id: "situation-room-pipelines",
        action_id: "run_job",
        args: { job_id: jobId },
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(runJob.ok).toBe(true);
    expect(runJob.artifact?.job_id).toBe(jobId);
  });

  it("delegates Situation Room graph and translation-pair actions", () => {
    const room = useSituationRoomStore.getState().createRoom("Graph Delegation Room");
    const createGraph = executeHelixPanelAction(
      {
        panel_id: "situation-room-pipelines",
        action_id: "create_graph",
        args: { room_id: room.room_id, title: "Mediator graph" },
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(createGraph.ok).toBe(true);
    expect(createGraph.artifact?.graph_id).toBeTruthy();

    const translationPair = executeHelixPanelAction(
      {
        panel_id: "situation-room-pipelines",
        action_id: "create_translation_pair",
        args: {
          graph_id: createGraph.artifact?.graph_id,
          room_id: room.room_id,
          speaker_a_id: "spk_user_1",
          speaker_b_id: "spk_rowan",
          speaker_a_native_language: "en",
          speaker_b_native_language: "es",
          render_policy: "dual",
        },
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );

    expect(translationPair.ok).toBe(true);
    expect(translationPair.artifact?.graph_id).toBe(createGraph.artifact?.graph_id);
    expect(translationPair.artifact?.job_ids).toHaveLength(2);
    expect(translationPair.artifact).toMatchObject({
      attachment_policy: "manual_only",
      context_injection: "explicit_attachment_only",
      command_lane_enabled: false,
    });
  });

  it("delegates Situation Room setup-from-prompt and mic source actions with receipts", () => {
    const room = useSituationRoomStore.getState().createRoom("Setup Delegation Room");
    const source = {
      source_id: "src:setup:display",
      room_id: room.room_id,
      label: "Discord tab audio",
      capture_source: "display_tab_audio" as const,
      capture_session_id: "cap:setup",
      status: "active" as const,
      chunk_index: 0,
      started_at: "2026-05-04T00:00:00.000Z",
    };
    useSituationRoomStore.setState((state: ReturnType<typeof useSituationRoomStore.getState>) => ({
      sources: { ...state.sources, [source.source_id]: source },
      rooms: {
        ...state.rooms,
        [room.room_id]: {
          ...state.rooms[room.room_id],
          source_ids: [source.source_id],
        },
      },
    }));

    const setup = executeHelixPanelAction(
      {
        panel_id: "situation-room-pipelines",
        action_id: "setup_from_prompt",
        args: {
          intent: "translate_conversation",
          capture_preference: "existing_source",
          room_id: room.room_id,
          source_ids: [source.source_id],
          speaker_a_id: "spk_user_1",
          speaker_b_id: "spk_friend_1",
          speaker_a_native_language: "English",
          speaker_b_native_language: "Spanish",
        },
      },
      {
        openPanel: vi.fn(),
        focusPanel: vi.fn(),
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );

    expect(setup.ok).toBe(true);
    expect(setup.artifact).toMatchObject({
      kind: "situation_room_setup_execution_receipt",
      schema: "helix.situation_setup_receipt.v1",
      setup_status: "complete",
      lifecycle_status: "executed",
      executed_action_id: "situation-room-pipelines.setup_from_prompt",
      room_id: room.room_id,
      source_ids: [source.source_id],
      attachment_policy: "manual_only",
      context_injection: "explicit_attachment_only",
      command_lane_enabled: false,
    });
    expect(setup.artifact?.graph_id).toBeTruthy();
    expect(setup.artifact?.job_ids).toHaveLength(2);

    const missingSetup = executeHelixPanelAction(
      {
        panel_id: "situation-room-pipelines",
        action_id: "setup_from_prompt",
        args: {
          intent: "translate_conversation",
          capture_preference: "browser_tab_audio",
          room_id: room.room_id,
          speaker_a_id: "spk_user_1",
          speaker_b_id: "spk_friend_1",
          speaker_a_native_language: "English",
          speaker_b_native_language: "Spanish",
          source_ids: ["src:not-found"],
        },
      },
      {
        openPanel: vi.fn(),
        focusPanel: vi.fn(),
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(missingSetup.ok).toBe(false);
    expect(missingSetup.artifact).toMatchObject({
      kind: "situation_room_setup_execution_receipt",
      lifecycle_status: "failed",
      setup_status: "needs_capture_permission",
      error: "setup_requirements_missing",
    });

    const mic = executeHelixPanelAction(
      {
        panel_id: "situation-room-sources",
        action_id: "attach_mic_audio_source",
        args: { room_id: room.room_id, label: "Same microphone" },
      },
      {
        openPanel: vi.fn(),
        focusPanel: vi.fn(),
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(mic.ok).toBe(true);
    expect(mic.artifact).toMatchObject({
      mic_permission_requested: true,
      capture_source: "mic",
      label: "Same microphone",
    });
  });

  it("keeps complex ADM-style symbolic equations solvable without crashing", () => {
    const solve = executeHelixPanelAction(
      {
        panel_id: "scientific-calculator",
        action_id: "solve_with_steps",
        args: {
          latex:
            "ds^2 = -(alpha^2-beta_i*beta^i)*dt^2 + 2*beta_i*dx^i*dt + gamma_ij*dx^i*dx^j",
        },
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(solve.ok).toBe(true);
    expect(typeof solve.artifact?.result_text).toBe("string");
    expect(String(solve.artifact?.result_text).length).toBeGreaterThan(0);
    expect(String(solve.artifact?.error ?? "")).not.toContain("eqn.split");
  });

  it("marks GR-class scientific requests as backend-only with trace metadata", () => {
    const solve = executeHelixPanelAction(
      {
        panel_id: "scientific-calculator",
        action_id: "solve_with_steps",
        args: {
          latex: "Compute the Einstein tensor and QI guardrail for the Natario warp.metric T00 route.",
        },
      },
      {
        openPanel: () => undefined,
        focusPanel: () => undefined,
        closePanel: () => undefined,
        openSettings: () => undefined,
      },
    );
    expect(solve.ok).toBe(false);
    expect(solve.artifact?.sourceOfTruth).toBe("einstein_backend");
    expect(solve.artifact?.capabilityClass).toBe("gr_warp_physics");
    expect(solve.artifact?.trace).toEqual(
      expect.objectContaining({
        delegatedTo: "/api/physics/warp/calculator",
      }),
    );
  });
});
