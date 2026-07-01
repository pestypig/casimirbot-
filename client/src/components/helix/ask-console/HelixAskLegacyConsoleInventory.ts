export type HelixAskLegacyConsoleSliceClassification =
  | "live_day_to_day_must_move"
  | "pure_display_already_recrowned"
  | "behavior_sensitive_recrowned_with_parity"
  | "behavior_sensitive_quarantined"
  | "unknown_trap_door_quarantined"
  | "obsolete_requires_evidence_before_delete";

export type HelixAskLegacyConsoleSlice = {
  key: string;
  classification: HelixAskLegacyConsoleSliceClassification;
  source: "HelixAskPill.tsx" | "ask-console" | "lib/helix";
  evidence: string;
};

export const HELIX_ASK_LEGACY_CONSOLE_ACTIVE_PATH = [
  "HelixAskConsole",
  "HelixAskConsoleRuntimeShell",
  "HelixAskLegacyRuntimeBridge",
  "HelixAskPill",
] as const;

export const HELIX_ASK_LEGACY_CONSOLE_SOURCE_SNAPSHOT = {
  file: "client/src/components/helix/HelixAskPill.tsx",
  lineCountAtInventory: 26995,
  exportedComponentStartsAtLine: 8447,
  liveRenderSliceStartsAtLine: 26377,
  liveLegacyConsoleViewStartsAtLine: 26392,
  inventoryReason:
    "The active bridge still imports the whole legacy file, but the visible console render path is concentrated near the bottom and now enters the recrowned legacy console view before composing recrowned ask-console display owners.",
} as const;

export const HELIX_ASK_LEGACY_CONSOLE_SLICES = [
  {
    key: "legacy_active_bridge",
    classification: "live_day_to_day_must_move",
    source: "HelixAskPill.tsx",
    evidence:
      "HelixAskLegacyRuntimeBridge currently returns <HelixAskPill {...props} />, so the whole file remains active through the default legacy bridge.",
  },
  {
    key: "visible_console_layout",
    classification: "pure_display_already_recrowned",
    source: "ask-console",
    evidence:
      "The bottom render slice enters HelixAskLegacyConsoleView, which delegates to HelixAskConsoleRuntimeLayout and composes HelixAskSurfaceFrame, HelixAskSurfaceComposerPanel, HelixAskSurfaceSupplementStack, HelixAskTurnList, and HelixAskDebugDrawer.",
  },
  {
    key: "prompt_composer_surface",
    classification: "pure_display_already_recrowned",
    source: "ask-console",
    evidence:
      "The live render slice uses HelixAskComposerTextarea, HelixAskComposerSubmitButton, HelixAskRuntimePicker, HelixAskMoodAvatar, and HelixAskActionToolbar.",
  },
  {
    key: "reply_projection_surface",
    classification: "pure_display_already_recrowned",
    source: "ask-console",
    evidence:
      "The live render slice uses HelixAskReplyTurn, HelixAskFinalAnswer, HelixAskActiveTurnStreamPanel, latest-turn binding helpers, and recrowned final-text, reply-event ordering, and fail-context helpers.",
  },
  {
    key: "operator_supplement_surface",
    classification: "pure_display_already_recrowned",
    source: "ask-console",
    evidence:
      "The live render slice uses extracted goal, steering queue, attachment, context capsule, situation room, observer, voice status, and voice confirmation components.",
  },
  {
    key: "legacy_chat_persistence_binding",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "ask-console",
    evidence:
      "The injected chat-store write adapter moved to HelixAskLegacyChatPersistenceBinding with tests preserving session id, payload shape, null-session behavior, and keeping pure payload shaping separate from store mutation.",
  },
  {
    key: "agent_runtime_preference_storage",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "ask-console",
    evidence:
      "Agent runtime localStorage preference moved to HelixAskRuntimePreference with tests preserving default fallback, id validation, write behavior, and storage exception handling while provider fetch/controller state remains in the bridge.",
  },
  {
    key: "visual_capture_audio_preference_sync",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "ask-console",
    evidence:
      "Visual capture audio route preference moved to HelixAskVisualCapturePreference with tests preserving stored route reads, route writes, sync-event detail, and keeping media capture/transcript runtime in the bridge.",
  },
  {
    key: "context_compaction_resume_frame_storage",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "ask-console",
    evidence:
      "Context compaction pause text parsing, resume-frame extraction, and session-storage cache moved to HelixAskContextCompactionResumeFrameStorage with tests preserving schema validation, nested frame lookup, latest-reply selection, read fallback, write behavior, and storage exception handling while request handoff remains in the bridge.",
  },
  {
    key: "context_compaction_pause_pending_classifier",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "ask-console",
    evidence:
      "Deterministic context-compaction pause-pending reply classification moved to HelixAskContextCompactionResumeFrameStorage with tests preserving pending-request and explicit content fallback detection while context-compaction state mutation, queue unblocking, and request metadata handoff remain in the bridge.",
  },
  {
    key: "legacy_fallback_output_cleanup",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic legacy/local fallback output cleanup moved to ask-output-cleanup with tests preserving answer-boundary extraction, evidence-block pruning, scaffold cleanup, and stage-tag preservation while fallback admission and execution stay in the bridge.",
  },
  {
    key: "pasted_text_attachment_materialization",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "ask-console",
    evidence:
      "Pasted-text attachment encoding, SHA-256 hashing, metadata materialization, and text turn-input item shaping moved to HelixAskTextAttachment with tests preserving Unicode base64, deterministic filename/id/hash dependency seams, preview trimming, and assistant-answer=false turn-input shape while attachment admission and request-envelope construction remain in the bridge.",
  },
  {
    key: "attachment_commit_validation",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "ask-console",
    evidence:
      "Deterministic image/text attachment submit-readiness commit checks, structured preview metadata, and stale/too-large/unsupported/error reason shaping moved to HelixAskAttachmentCommit with tests while attachment mutation, source admission, request-envelope construction, attachment payload authority, and turn submission remain in the bridge.",
  },
  {
    key: "voice_playback_runtime_predicates",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic voice playback user-agent gain selection, iOS desktop-mode touch-point classification, graph/direct path selection, graph-bypass timing, and active-audio identity checks moved to ask-voice-playback-runtime with tests while audio graph setup, playback scheduling, TTS transport, diagnostics, and queue mutation remain in the bridge.",
  },
  {
    key: "atomic_viewer_launch_suppression",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic docs-summary prompt suppression for explicit docs-viewer context/path moved to ask-doc-viewer-context with tests while atomic viewer event dispatch, storage writes, URL/store reads, and panel launch side effects remain in the bridge.",
  },
  {
    key: "voice_language_policy",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic voice language-tag normalization, English-like classification, script-based source-language inference, source/response language selection, and high-risk translation-context detection moved to ask-voice-language-policy with tests while STT lifecycle, dispatch, translation transport, and workstation calculator fast-path execution remain in the bridge.",
  },
  {
    key: "voice_transcript_confirm_policy",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic transcript-confirm policy reason parsing, dispatch-state normalization, low-pivot translation blocking, policy resolution, and auto-confirm eligibility projection moved to ask-voice-transcript-confidence with tests while confirmation state mutation, live activity observation, STT lifecycle, voice dispatch, and request submission remain in the bridge.",
  },
  {
    key: "voice_dispatch_suppression_policy",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic reasoning-dispatch lexical admission, suppressed-route cause mapping, timeline suppression metadata projection, forced-observe rescue checks, and low-info draft rescue transcript selection moved to ask-voice-dispatch-suppression with tests while observer arbitration, document quick-lane policy, dispatch-mode normalization, request submission, and in-flight voice lifecycle remain in the bridge.",
  },
  {
    key: "voice_reasoning_dispatch_prompt_context",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic context-dependent voice follow-up classification, prior-user anchor extraction, and follow-up dispatch prompt shaping moved to ask-voice-reasoning-dispatch-prompt with tests while simple-doc lane policy, background workspace queueing, dispatch-mode normalization, request submission, and in-flight voice lifecycle remain in the bridge.",
  },
  {
    key: "voice_doc_quick_lane_background_policy",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic simple current-document prompt lane detection, title/path-only prompt classification, and background workspace reasoning queue predicate moved to ask-voice-reasoning-dispatch-prompt with tests while queue mutation, request submission, and in-flight voice lifecycle remain in the bridge.",
  },
  {
    key: "voice_conversation_dispatch_mode_normalization",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic conversation dispatch-mode normalization moved to ask-voice-reasoning-dispatch-prompt with tests while observer arbitration, request submission, queue mutation, and in-flight voice lifecycle remain in the bridge.",
  },
  {
    key: "voice_continuation_merge_and_restart_predicates",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic voice continuation merge windows, in-flight lexical merge predicate, supersede restart predicate, short addendum classification, and tail-fragment classification moved to ask-voice-continuation-lexical with tests while transcript lifecycle, queue mutation, active-turn cancellation, request submission, and voice runtime side effects remain in the bridge.",
  },
  {
    key: "voice_held_transcript_and_pending_confirmation_policy",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic held-transcript recovery, watchdog flush, close-silence/flush-age constants, and pending-confirmation transcript merge policy moved to ask-voice-held-transcript-policy with tests while held-transcript state writes, transcript queues, active-turn cancellation, request submission, and voice runtime side effects remain in the bridge.",
  },
  {
    key: "voice_auto_dispatch_governance",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic voice auto-dispatch admission trace, explicit voice Ask candidate detection, confidence/echo/queue/budget/mic gates, and env-backed auto-dispatch defaults moved to ask-voice-auto-dispatch-governance with tests while dispatch-window mutation, transcript queues, active-turn cancellation, request submission, and voice runtime side effects remain in the bridge.",
  },
  {
    key: "observer_dispatch_plan_derivation",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic observer dispatch-plan derivation for chat/workspace/reasoning combinations moved to ask-voice-reasoning-dispatch-prompt with tests while workspace dispatch, reasoning queue mutation, request submission, and in-flight voice lifecycle remain in the bridge.",
  },
  {
    key: "mic_off_voice_playback_admission_predicate",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic mic-off voice utterance playback admission predicate moved to ask-read-aloud-display with tests while mic arm state mutation, queue mutation, audio scheduling, TTS transport, and playback side effects remain in the bridge.",
  },
  {
    key: "workstation_calculator_fast_path_parsing",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic workstation action argument reading, calculator prompt expression extraction, and calculator fast-path action selection moved to ask-workstation-fast-path with tests while calculator solve execution, workstation dispatch, panel mutation, reply insertion, and terminal authority remain in the bridge.",
  },
  {
    key: "docs_viewer_workstation_action_arg_reading",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Docs-viewer workstation action path/anchor argument extraction now executes the recrowned readWorkstationActionArgText helper from ask-workstation-fast-path while docs-viewer store mutation, last-known active-doc cache mutation, workstation dispatch, panel mutation, and request-envelope handoff remain in the bridge.",
  },
  {
    key: "workstation_pending_input_helper_policy",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic workstation confirmation parsing, pending-argument extraction, run-panel action arg cloning, docs-topic resolution metadata reading, and private docs-topic metadata stripping moved to ask-workstation-pending-input with tests while pending request creation/state, request ids, panel capability lookup, docs-viewer handoff, workstation dispatch, panel mutation, and terminal authority remain in the bridge.",
  },
  {
    key: "external_prompt_claim_id_normalization",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic external prompt claim-id normalization moved to ask-external-prompt-claim with tests while pending prompt consumption, browser-window single-flight claim tracking, duplicate dispatch suppression, route admission, request submission, and lifecycle cleanup remain in the bridge.",
  },
  {
    key: "workstation_command_text_normalization",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic workstation command text normalization, panel-query normalization, operator subgoal restatement, and lexicon alias normalization moved to ask-workstation-command-text with tests while panel lookup, natural-language panel resolution, panel capability matching, action construction, workstation dispatch, panel mutation, route authority, and terminal authority remain in the bridge.",
  },
  {
    key: "exploration_repo_file_location_prompt_detection",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic repo file-location prompt detection moved to ask-exploration-policy with tests while retry/escalation prompt construction, artifact retry behavior, fallback brief construction, context/source chooser policy, exploration ladder decisions, request submission, route authority, and terminal authority remain in the bridge.",
  },
  {
    key: "attachment_prompt_policy_predicates",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic visual-input, pasted-text resume recall, and explicit pasted-text attachment prompt predicates moved to ask-attachment-prompt-policy with tests while route metadata, source admission authority, attachment payload authority, request submission, active-doc context, and terminal authority remain in the bridge.",
  },
  {
    key: "visual_evidence_summary_readers",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic visual evidence summary extraction and diagnostic vision-provider summary classification moved to ask-visual-evidence-readers with tests while visual diagnostic evidence admission, request-envelope construction, route metadata, attachment payload authority, active-doc context, and turn submission remain in the bridge.",
  },
  {
    key: "runtime_authority_reader_helpers",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic runtime/action authority object readers, theory-reflection extraction, action-key normalization, selected-capability collection, and workstation action runtime-key projection moved to ask-runtime-authority-readers with tests while backend route guardrails, action-envelope allow/deny authority, debug authority attachment, workstation dispatch, shortcut prevention, and terminal authority remain in the bridge.",
  },
  {
    key: "runtime_audit_array_reader",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic agent-loop audit array coercion moved to ask-runtime-authority-readers with tests while procedural timeline rendering, backend route guardrails, action-envelope authority, debug authority attachment, and terminal authority remain in the bridge.",
  },
  {
    key: "backend_ask_turn_id_reader",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic backend Ask turn-id shape detection moved to ask-runtime-authority-readers with tests while backend route guardrails, backend-entrypoint admission behavior, debug authority attachment, and shortcut prevention remain in the bridge.",
  },
  {
    key: "pending_input_reader_helpers",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic pending-input record detection plus pending-transition marker and trace normalization moved to ask-pending-input-readers with tests while pending-cancellation classification, pending request resolution, visible terminal-kind selection, latest-turn lifecycle, terminal projection, and workstation transition mutation remain in the bridge.",
  },
  {
    key: "voice_local_audio_analysis_and_speaker_matching",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic voice segment local-audio analysis and speaker-profile matching moved to ask-voice-capture-display with tests while speaker-profile refs, mic/STT lifecycle, sample accumulation, queue mutation, dispatch submission, and voice runtime side effects remain in the bridge.",
  },
  {
    key: "voice_command_lane_policy",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic voice command-lane envelope normalization and low-quality transcript barge suppression moved to ask-voice-command-lane-policy with tests while active voice playback/reasoning state ownership, transcript confirmation mutation, STT lifecycle, queue mutation, dispatch-window mutation, and request submission remain in the bridge.",
  },
  {
    key: "voice_recorder_mime_support_probe",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic recorder MIME candidate support probing moved to ask-voice-capture-display with injected support checks and tests while direct MediaRecorder/navigator reads, mic recorder lifecycle, stream capture, STT dispatch, and diagnostics publication remain in the bridge.",
  },
  {
    key: "workstation_panel_text_resolution",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic workstation panel text resolution, docs-path panel detection, alias table, and open-panel command parsing moved to ask-workstation-command-text with injected panel registry state and tests while live panel registry reads, capability matching, HelixWorkstationAction construction, workstation dispatch, and panel mutation remain in the bridge.",
  },
  {
    key: "exploration_retry_prompt_construction",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic exploration verify/act escalation prompt construction and artifact-retry prompt construction moved to ask-exploration-policy with tests while ladder decisions, retry execution, context/source chooser policy, request submission, route authority, and terminal authority remain in the bridge.",
  },
  {
    key: "ask_mode_inference",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic observe/act/verify Ask mode inference moved to ask-exploration-policy with tests while planner policy, retry execution, request submission, route authority, terminal authority, and dispatch side effects remain in the bridge.",
  },
  {
    key: "voice_timeline_build_info_projection",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "ask-console",
    evidence:
      "Deterministic voice timeline build-info initial state plus /version success/error payload shaping moved to HelixAskVoiceTimelineBuildInfo with tests while browser/env reads, fetch/abort lifecycle, diagnostics publication, mic/STT runtime, and TTS stay in the bridge.",
  },
  {
    key: "context_chooser_auto_mode_classification",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic repo-code evidence prompt detection and context chooser auto-mode classification moved to ask-exploration-policy with tests while context chooser state/countdown, source chooser execution, request submission, route authority, and terminal authority remain in the bridge.",
  },
  {
    key: "active_turn_stream_membership_admission",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic active-turn live event membership admission moved to ask-active-turn-stream with tests while submit/stream ingress, active turn ids, stale completion, reply mutation, final response projection, route authority, and terminal authority remain in the bridge.",
  },
  {
    key: "stage_play_mailbox_wake_admission_policy",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic compact Stage Play mailbox wake prompt detection, route-metadata validation, and missing-metadata block predicate moved to ask-stage-play-mailbox-wake-policy with tests while pending prompt consumption, wake execution, request submission, route authority, and terminal authority remain in the bridge.",
  },
  {
    key: "legacy_turn_control_target_selection",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "ask-console",
    evidence:
      "Deterministic visible-final text selection for copy/read-aloud controls and local debug-copy payload selection moved to HelixAskLegacyTurnControls with tests while clipboard writes, backend debug-export materialization, selected debug state, drawer mutation, and TTS execution remain in the bridge.",
  },
  {
    key: "legacy_debug_export_backend_target_selection",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "ask-console",
    evidence:
      "Deterministic backend debug-export ref eligibility and matching backend target selection moved to HelixAskLegacyTurnControls with tests while fetch, backend debug-export materialization, authoritative payload merging, drawer mutation, clipboard writes, and TTS execution remain in the bridge.",
  },
  {
    key: "legacy_turn_control_button_state_projection",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "ask-console",
    evidence:
      "Deterministic copy/debug/read-aloud button test ids, debug-copy visibility/disabled state, and read-aloud active/label/title projection moved to HelixAskLegacyTurnControls with tests while click handlers, clipboard writes, backend debug-export materialization, drawer mutation, and TTS execution remain in the bridge.",
  },
  {
    key: "legacy_debug_drawer_state_projection",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "ask-console",
    evidence:
      "Deterministic debug drawer state and copy-result-to-drawer projection moved to HelixAskDebugDrawerState with tests while clipboard writes, backend debug-export materialization/fetch, window debug globals, selected drawer React state mutation, and copied-id timers remain in the bridge.",
  },
  {
    key: "doc_viewer_snapshot_path_resolution",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic active docs-viewer snapshot path priority moved to ask-doc-viewer-context with tests preserving store > debug snapshot > desktop URL doc param > last-known fallback ordering while docs-viewer store reads, desktop URL reads, last-known cache mutation, workspace snapshots, request-envelope construction, source admission, and route metadata remain in the bridge.",
  },
  {
    key: "doc_viewer_debug_snapshot_projection",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic docs-viewer debug snapshot projection moved to ask-doc-viewer-context with tests preserving mode, retained current path, anchor, pending auto-read nonce, and recent count while docs-viewer store reads, retained active-doc cache mutation, desktop URL reads, request-envelope construction, source admission, and route metadata remain in the bridge.",
  },
  {
    key: "doc_viewer_anchor_path_deictic_resolution",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic current-document/current-whitepaper/docs-viewer cue detection, explicit document path precedence, and current-path anchor normalization moved to ask-doc-viewer-context with tests while the active current-path read, answer-contract source handoff, workspace snapshots, request-envelope construction, source admission, and route metadata remain in the bridge.",
  },
  {
    key: "workstation_layout_debug_snapshot_projection",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic workstation layout debug snapshot projection moved to ask-workspace-context-snapshot with tests preserving group count, sorted/deduped open panel ids, chat dock fields, and mobile drawer fields while the layout store read, workspace context assembly, request-envelope construction, source admission, and route metadata remain in the bridge.",
  },
  {
    key: "ask_turn_workspace_context_snapshot_shaping",
    classification: "behavior_sensitive_recrowned_with_parity",
    source: "lib/helix",
    evidence:
      "Deterministic Ask turn workspace context snapshot shaping moved to ask-workspace-context-snapshot with tests preserving active panel, doc context fields, calculator context clipping, note context clipping, Situation Room context passthrough, clipboard-panel detection, and injected timestamp while layout/notes/calculator/Situation Room store reads, active-doc path resolution, Date.now, request-envelope construction, source admission, and route metadata remain in the bridge.",
  },
  {
    key: "request_and_stream_lifecycle",
    classification: "behavior_sensitive_quarantined",
    source: "HelixAskPill.tsx",
    evidence:
      "Submit, stream ingress, stale completion, active turn ids, and final response projection still live in HelixAskPill and must move only with parity tests.",
  },
  {
    key: "active_doc_and_workspace_context",
    classification: "behavior_sensitive_quarantined",
    source: "HelixAskPill.tsx",
    evidence:
      "Docs-viewer URL/store reads, last-known cache mutation, active current-path reads, layout/notes/calculator/Situation Room store reads, Date.now, route metadata, and request-envelope handoff remain behavior-sensitive after deterministic doc debug snapshot projection, doc snapshot path priority, deictic anchor-path resolution, workstation layout debug snapshot projection, and Ask turn workspace context snapshot shaping were recrowned; HASK-BSQ-001 handoff behavior still needs parity proof.",
  },
  {
    key: "latest_debug_copy_and_read_aloud_binding",
    classification: "behavior_sensitive_quarantined",
    source: "HelixAskPill.tsx",
    evidence:
      "Clipboard writes, backend debug-export materialization/fetch, rendered-button fallback construction, selected debug state, drawer mutation, click handlers, copied-id timers, window debug globals, and TTS execution still bind from legacy state after pure target/backend-ref/button-state/drawer-state selection was moved.",
  },
  {
    key: "voice_capture_and_command_runtime",
    classification: "behavior_sensitive_quarantined",
    source: "HelixAskPill.tsx",
    evidence:
      "MediaRecorder setup, STT dispatch, command confirmation, auto-dispatch, and voice steering remain active runtime behavior in the legacy file.",
  },
  {
    key: "legacy_fallbacks_and_dev_branches",
    classification: "unknown_trap_door_quarantined",
    source: "HelixAskPill.tsx",
    evidence:
      "Local Ask fallback admission/execution paths, prompt classifiers, and older runtime branches must be audited before copying or deleting.",
  },
] as const satisfies readonly HelixAskLegacyConsoleSlice[];

export const HELIX_ASK_LEGACY_CONSOLE_SLICE_PROGRESS = {
  activeDefaultImplementation: "legacy_bridge",
  replacementTarget: "legacy_equivalent_recrowned_runtime",
  simplifiedMinimalShellIsDefault: false,
  bridgeReplacementReady: false,
  liveDayToDaySliceCount: HELIX_ASK_LEGACY_CONSOLE_SLICES.filter(
    (slice) => slice.classification === "live_day_to_day_must_move",
  ).length,
  pureDisplayRecrownedSliceCount: HELIX_ASK_LEGACY_CONSOLE_SLICES.filter(
    (slice) => slice.classification === "pure_display_already_recrowned",
  ).length,
  behaviorSensitiveRecrownedWithParitySliceCount: HELIX_ASK_LEGACY_CONSOLE_SLICES.filter(
    (slice) => slice.classification === "behavior_sensitive_recrowned_with_parity",
  ).length,
  behaviorSensitiveQuarantinedSliceCount: HELIX_ASK_LEGACY_CONSOLE_SLICES.filter(
    (slice) => slice.classification === "behavior_sensitive_quarantined",
  ).length,
  unknownTrapDoorSliceCount: HELIX_ASK_LEGACY_CONSOLE_SLICES.filter(
    (slice) => slice.classification === "unknown_trap_door_quarantined",
  ).length,
} as const;
