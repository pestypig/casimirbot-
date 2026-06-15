import { describe, expect, it } from "vitest";

import {
  LIVE_SOURCE_TURN_PHASE_TABLE,
  isLockedExecutableLiveSourcePhase,
  mandatoryToolForPhase,
  resolveLiveSourceTurnPhase,
} from "../services/helix-ask/live-source-turn-phase-resolver";

describe("resolveLiveSourceTurnPhase", () => {
  it("defines the core phase transition table for live-source tool admission", () => {
    expect(LIVE_SOURCE_TURN_PHASE_TABLE.configure_interpreter_profile).toMatchObject({
      allowedTools: ["live_env.configure_interpreter_profile"],
      completionEvidence: ["stage_play_live_source_interpreter_profile"],
      next: "terminal_checkpoint",
    });
    expect(LIVE_SOURCE_TURN_PHASE_TABLE.configure_interpreter_profile.forbiddenTools).toEqual(expect.arrayContaining([
      "live_env.read_processed_live_source_mail",
      "live_env.process_live_source_mail",
      "live_env.request_interim_voice_callout",
    ]));
    expect(LIVE_SOURCE_TURN_PHASE_TABLE.read_processed_mail).toMatchObject({
      allowedTools: ["live_env.read_processed_live_source_mail"],
      fallbackTools: ["live_env.process_live_source_mail"],
      completionEvidence: ["stage_play_processed_mail_packet"],
      next: "record_decision",
    });
    expect(LIVE_SOURCE_TURN_PHASE_TABLE.query_micro_reasoner_deck).toMatchObject({
      allowedTools: ["live_env.query_micro_reasoner_presets"],
      fallbackTools: [],
      requiredEvidence: ["stage_play_micro_reasoner_prompt_preset_query_result"],
      completionEvidence: ["stage_play_micro_reasoner_prompt_preset_query_result"],
      next: "terminal_checkpoint",
    });
    expect(LIVE_SOURCE_TURN_PHASE_TABLE.query_micro_reasoner_deck.forbiddenTools).toEqual(expect.arrayContaining([
      "live_env.read_processed_live_source_mail",
      "live_env.process_live_source_mail",
    ]));
    expect(LIVE_SOURCE_TURN_PHASE_TABLE.record_decision).toMatchObject({
      allowedTools: ["live_env.record_live_source_mail_decision"],
      completionEvidence: ["stage_play_live_source_mail_decision"],
    });
    expect(LIVE_SOURCE_TURN_PHASE_TABLE.record_decision.next).toEqual(expect.arrayContaining([
      "request_voice_after_decision",
      "terminal_checkpoint",
      "queue_continuation",
    ]));
    expect(LIVE_SOURCE_TURN_PHASE_TABLE.request_voice_after_decision).toMatchObject({
      allowedTools: ["live_env.request_interim_voice_callout"],
      requiredEvidence: ["stage_play_live_source_mail_decision"],
      completionEvidence: [
        "live_source_interim_voice_callout_receipt",
        "voice_hold_receipt",
        "voice_block_receipt",
        "voice_receipt",
      ],
      next: "terminal_checkpoint",
    });
  });

  it("lets Stage Play mail wake metadata force record_decision over ambiguous setup or status prompt text", () => {
    const phase = resolveLiveSourceTurnPhase({
      prompt:
        "Status check: create a Minecraft profile later, but for this wake decide whether the latest mailbox finding needs voice.",
      selectedTargetSource: "visual_capture",
      selectedCapability: "workspace_os.status",
      processedPackets: [{
        artifactId: "stage_play_processed_mail_packet",
        packetId: "stage_play_processed_mail_packet:metadata-voice",
        observedFacts: ["The player is near fire."],
        recommendedNext: "request_voice_callout",
        salience: {
          level: "urgent",
          voiceCandidate: true,
          calloutDraft: "Fire nearby; move clear.",
        },
      }],
      routeMetadata: {
        invocationKind: "stage_play_mail_wake",
        wakeRequestId: "stage_play_live_source_mail_wake:metadata-force",
        mailboxThreadId: "helix-ask:desktop",
        sourceTarget: "live_source_mailbox",
        requiredCanonicalGoal: "processed_mail_voice_decision",
        requiredPhase: "record_decision",
        evidenceRefs: ["stage_play_processed_mail_packet:metadata-voice"],
        allowedCapabilities: ["live_env.record_live_source_mail_decision"],
        forbiddenCapabilities: ["workspace_os.status", "visual_capture_describe", "situation_context_pack"],
      },
    });

    expect(phase.phase).toBe("record_decision");
    expect(phase.canonicalGoal).toBe("processed_mail_voice_decision");
    expect(phase.allowedTools).toEqual(["live_env.record_live_source_mail_decision"]);
    expect(phase.forbiddenTools).toEqual(expect.arrayContaining([
      "live_env.read_processed_live_source_mail",
      "live_env.process_live_source_mail",
      "live_env.read_live_source_mail",
      "live_env.request_interim_voice_callout",
      "final_answer",
    ]));
    expect(phase.phaseLock).toMatchObject({
      locked: true,
      reason: "Stage Play mail wake route metadata is authoritative for the mailbox decision phase.",
    });
    expect(phase.evidenceRefs).toEqual(expect.arrayContaining([
      "stage_play_processed_mail_packet:metadata-voice",
    ]));
    expect(isLockedExecutableLiveSourcePhase(phase)).toBe(true);
    expect(mandatoryToolForPhase(phase)).toBe("live_env.record_live_source_mail_decision");
  });

  it("forces processed-mail materialization before metadata voice decisions when no packet is attached", () => {
    const phase = resolveLiveSourceTurnPhase({
      prompt:
        "Continuing live-source watch job compact Ask handoff. Micro-reasoner recommendation: request voice callout.",
      selectedTargetSource: "live_source_mailbox",
      routeMetadata: {
        invocationKind: "stage_play_mail_wake",
        wakeRequestId: "stage_play_live_source_mail_wake:metadata-needs-packet",
        mailboxThreadId: "helix-ask:desktop",
        sourceTarget: "live_source_mailbox",
        requiredCanonicalGoal: "processed_mail_voice_decision",
        requiredPhase: "record_decision",
        evidenceRefs: ["stage_play_processed_mail_packet:metadata-needs-packet"],
        allowedCapabilities: ["live_env.record_live_source_mail_decision"],
        forbiddenCapabilities: ["workspace_os.status", "visual_capture_describe", "situation_context_pack"],
      },
    });

    expect(phase.phase).toBe("read_processed_mail");
    expect(phase.canonicalGoal).toBe("processed_mail_voice_decision");
    expect(phase.allowedTools).toEqual(["live_env.read_processed_live_source_mail"]);
    expect(phase.nextPhase).toBe("record_decision");
    expect(phase.phaseLock).toMatchObject({
      locked: true,
      reason: "Stage Play mail wake route metadata is authoritative, but decision routing requires materialized processed mailbox evidence.",
    });
    expect(mandatoryToolForPhase(phase)).toBe("live_env.read_processed_live_source_mail");
  });

  it("exposes mandatory tools only for locked executable live-source phases", () => {
    const executable = resolveLiveSourceTurnPhase({
      prompt: "Use the structured mailbox route metadata attached to this turn.",
      selectedTargetSource: "live_source_mailbox",
      routeMetadata: {
        invocationKind: "stage_play_mail_wake",
        wakeRequestId: "stage_play_live_source_mail_wake:mandatory-helper",
        mailboxThreadId: "helix-ask:desktop",
        sourceTarget: "live_source_mailbox",
        requiredCanonicalGoal: "processed_mail_voice_decision",
        requiredPhase: "request_voice_after_decision",
        evidenceRefs: [
          "stage_play_processed_mail_packet:mandatory-helper",
          "stage_play_live_source_mail_decision:mandatory-helper",
        ],
      },
      latestToolReceipts: [{
        toolName: "live_env.record_live_source_mail_decision",
        observation: {
          artifactId: "stage_play_live_source_mail_decision",
          decisionId: "stage_play_live_source_mail_decision:mandatory-helper",
          decision: "request_voice_callout",
        },
      }],
    });

    expect(executable.phase).toBe("request_voice_after_decision");
    expect(isLockedExecutableLiveSourcePhase(executable)).toBe(true);
    expect(mandatoryToolForPhase(executable)).toBe("live_env.request_interim_voice_callout");

    const terminal = resolveLiveSourceTurnPhase({
      prompt: "Use the structured mailbox route metadata attached to this turn.",
      selectedTargetSource: "live_source_mailbox",
      latestToolReceipts: [
        {
          toolName: "live_env.record_live_source_mail_decision",
          observation: {
            artifactId: "stage_play_live_source_mail_decision",
            decisionId: "stage_play_live_source_mail_decision:terminal-helper",
            decision: "request_voice_callout",
          },
        },
        {
          toolName: "live_env.request_interim_voice_callout",
          observation: {
            schema: "helix.interim_voice_callout_tool_result.v1",
            receipt: {
              receiptId: "live_source_interim_voice_callout_receipt:terminal-helper",
              status: "awaiting_client_playback",
            },
          },
        },
      ],
    });

    expect(terminal.phase).toBe("terminal_checkpoint");
    expect(isLockedExecutableLiveSourcePhase(terminal)).toBe(false);
    expect(mandatoryToolForPhase(terminal)).toBeNull();
  });

  it("lets Stage Play mail wake metadata map read_mailbox to read_processed_mail without generic visual scope", () => {
    const phase = resolveLiveSourceTurnPhase({
      prompt: "Describe the current visual capture and use the situation context pack.",
      selectedTargetSource: "visual_capture",
      routeMetadata: {
        invocationKind: "stage_play_mail_wake",
        wakeRequestId: "stage_play_live_source_mail_wake:metadata-read",
        mailboxThreadId: "helix-ask:desktop",
        sourceTarget: "live_source_mailbox",
        requiredCanonicalGoal: "processed_mail_interpretation",
        requiredPhase: "read_mailbox",
        evidenceRefs: ["stage_play_live_source_mail_wake:metadata-read"],
        allowedCapabilities: ["live_env.read_processed_live_source_mail"],
        forbiddenCapabilities: ["visual_capture_describe", "situation_context_pack"],
      },
    });

    expect(phase.phase).toBe("read_processed_mail");
    expect(phase.canonicalGoal).toBe("processed_mail_interpretation");
    expect(phase.allowedTools).toEqual(["live_env.read_processed_live_source_mail"]);
    expect(phase.fallbackTools).toEqual(["live_env.process_live_source_mail"]);
    expect(phase.requiredEvidence).toEqual(["stage_play_processed_mail_packet"]);
    expect(phase.phaseLock.locked).toBe(true);
  });

  it("locks interpreter profile setup before mail-reading or voice wording", () => {
    const phase = resolveLiveSourceTurnPhase({
      prompt:
        "Create a Minecraft Survival Coach interpreter profile for this source. Call out danger, predict risk, and use voice only for urgent threats.",
      selectedTargetSource: "live_source_mailbox",
      selectedCapability: "live_env.read_processed_live_source_mail",
    });

    expect(phase).toMatchObject({
      phase: "configure_interpreter_profile",
      canonicalGoal: "configure_interpreter_profile",
      allowedTools: ["live_env.configure_interpreter_profile"],
      phaseLock: {
        locked: true,
      },
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_policy",
    });
    expect(phase.forbiddenTools).toContain("live_env.read_processed_live_source_mail");
  });

  it("treats survival coach contract criteria as locked interpreter profile setup", () => {
    const phase = resolveLiveSourceTurnPhase({
      prompt:
        "Make a survival coach profile for this source. Call out danger, rare resources, and strategic decisions; ignore routine walking.",
      selectedTargetSource: "live_source_mailbox",
      selectedCapability: "live_env.read_processed_live_source_mail",
    });

    expect(phase.phase).toBe("configure_interpreter_profile");
    expect(phase.canonicalGoal).toBe("configure_interpreter_profile");
    expect(phase.allowedTools).toEqual(["live_env.configure_interpreter_profile"]);
    expect(phase.forbiddenTools).toEqual(expect.arrayContaining([
      "live_env.read_processed_live_source_mail",
      "live_env.process_live_source_mail",
      "live_env.read_live_source_mail",
    ]));
    expect(phase.completionEvidence).toEqual(["stage_play_live_source_interpreter_profile"]);
    expect(phase.phaseLock).toMatchObject({
      locked: true,
    });
  });

  it("keeps overlapping profile prediction and danger wording in interpreter profile setup", () => {
    const phase = resolveLiveSourceTurnPhase({
      prompt: "Create a profile for this source that predicts what to watch next and calls out danger.",
      selectedTargetSource: "live_source_mailbox",
      selectedCapability: "live_env.read_processed_live_source_mail",
    });

    expect(phase.phase).toBe("configure_interpreter_profile");
    expect(phase.canonicalGoal).toBe("configure_interpreter_profile");
    expect(phase.allowedTools).toEqual(["live_env.configure_interpreter_profile"]);
    expect(phase.forbiddenTools).toEqual(expect.arrayContaining([
      "live_env.read_processed_live_source_mail",
      "live_env.process_live_source_mail",
      "live_env.read_live_source_mail",
    ]));
    expect(phase.phaseLock.locked).toBe(true);
  });

  it("splits create-profile-then-read wording by locking the setup phase first", () => {
    const phase = resolveLiveSourceTurnPhase({
      prompt:
        "Create the Minecraft Survival Coach interpreter profile and then read the latest mail.",
      selectedTargetSource: "live_source_mailbox",
      selectedCapability: "live_env.read_processed_live_source_mail",
    });

    expect(phase.phase).toBe("configure_interpreter_profile");
    expect(phase.nextPhase).toBe("terminal_checkpoint");
    expect(phase.allowedTools).toEqual(["live_env.configure_interpreter_profile"]);
    expect(phase.forbiddenTools).toContain("live_env.read_processed_live_source_mail");
    expect(phase.phaseLock.locked).toBe(true);
  });

  it("terminalizes profile setup after the interpreter profile receipt without reading mail", () => {
    const phase = resolveLiveSourceTurnPhase({
      prompt:
        "Make a Minecraft Survival Coach profile for this source. Call out danger and ignore routine walking.",
      latestToolReceipts: [{
        tool_name: "live_env.configure_interpreter_profile",
        observation: {
          artifactId: "stage_play_live_source_interpreter_profile",
          schemaVersion: "stage_play_live_source_interpreter_profile/v1",
          profileId: "stage_play_live_source_interpreter_profile:minecraft-survival-coach",
          title: "Minecraft Survival Coach",
        },
      }],
    });

    expect(phase.phase).toBe("terminal_checkpoint");
    expect(phase.canonicalGoal).toBe("configure_interpreter_profile");
    expect(phase.allowedTools).toEqual([]);
    expect(phase.forbiddenTools).toEqual(expect.arrayContaining([
      "live_env.read_processed_live_source_mail",
      "live_env.process_live_source_mail",
      "live_env.read_live_source_mail",
    ]));
    expect(phase.completionEvidence).toEqual(["stage_play_live_source_interpreter_profile"]);
    expect(phase.phaseLock.locked).toBe(true);
  });

  it("locks standing watch setup before processed-mail interpretation wording", () => {
    const phase = resolveLiveSourceTurnPhase({
      prompt:
        "Watch the active visual source as a Minecraft video predictor. Interpret chronological micro-batches and only use short checkpoints unless danger appears.",
      selectedTargetSource: "live_source_mailbox",
      selectedCapability: "live_env.read_processed_live_source_mail",
    });

    expect(phase.phase).toBe("configure_watch_job");
    expect(phase.canonicalGoal).toBe("configure_watch_job");
    expect(phase.allowedTools).toEqual(["live_env.configure_live_source_watch_job"]);
    expect(phase.phaseLock.locked).toBe(true);
  });

  it("locks bare standing watch language before mailbox reading", () => {
    const phase = resolveLiveSourceTurnPhase({
      prompt: "Watch this source.",
      selectedTargetSource: "live_source_mailbox",
      selectedCapability: "live_env.read_processed_live_source_mail",
    });

    expect(phase.phase).toBe("configure_watch_job");
    expect(phase.canonicalGoal).toBe("configure_watch_job");
    expect(phase.allowedTools).toEqual(["live_env.configure_live_source_watch_job"]);
    expect(phase.forbiddenTools).toEqual(expect.arrayContaining([
      "live_env.read_processed_live_source_mail",
      "live_env.process_live_source_mail",
      "live_env.read_live_source_mail",
    ]));
    expect(phase.completionEvidence).toEqual(["stage_play_live_source_watch_job_policy"]);
    expect(phase.phaseLock.locked).toBe(true);
  });

  it("locks commentate and every-batch watch prompts as watch-job setup", () => {
    for (const prompt of [
      "Keep watching and describe each batch.",
      "Every new mail batch should be described in one sentence.",
      "Announce if anything important happens.",
      "Commentate while I play.",
    ]) {
      const phase = resolveLiveSourceTurnPhase({
        prompt,
        selectedTargetSource: "live_source_mailbox",
        selectedCapability: "live_env.read_processed_live_source_mail",
      });

      expect(phase.phase).toBe("configure_watch_job");
      expect(phase.canonicalGoal).toBe("configure_watch_job");
      expect(phase.allowedTools).toEqual(["live_env.configure_live_source_watch_job"]);
      expect(phase.forbiddenTools).toContain("live_env.read_processed_live_source_mail");
      expect(phase.completionEvidence).toEqual(["stage_play_live_source_watch_job_policy"]);
      expect(phase.phaseLock.locked).toBe(true);
    }
  });

  it("terminalizes watch-job setup after policy receipt without reading mail", () => {
    const phase = resolveLiveSourceTurnPhase({
      prompt: "Watch this source and describe each new mail batch.",
      latestToolReceipts: [{
        tool_name: "live_env.configure_live_source_watch_job",
        observation: {
          schema: "stage_play_live_source_watch_job_policy_config_result/v1",
          watchJobPolicyRef: "stage_play_live_source_watch_job_policy:watch-1",
          policy: {
            artifactId: "stage_play_live_source_watch_job_policy",
            policyId: "stage_play_live_source_watch_job_policy:watch-1",
          },
        },
      }],
    });

    expect(phase.phase).toBe("terminal_checkpoint");
    expect(phase.canonicalGoal).toBe("configure_watch_job");
    expect(phase.allowedTools).toEqual([]);
    expect(phase.forbiddenTools).toEqual(expect.arrayContaining([
      "live_env.read_processed_live_source_mail",
      "live_env.process_live_source_mail",
      "live_env.read_live_source_mail",
    ]));
    expect(phase.completionEvidence).toEqual(["stage_play_live_source_watch_job_policy"]);
    expect(phase.phaseLock.locked).toBe(true);
  });

  it("locks MicroDeck inspection to the read-only preset query without processed-mail fallback", () => {
    const phase = resolveLiveSourceTurnPhase({
      prompt: "Query the MicroDeck preset assembly for the active visual source.",
      selectedTargetSource: "live_source_mailbox",
      selectedCapability: "live_env.read_processed_live_source_mail",
    });

    expect(phase.phase).toBe("query_micro_reasoner_deck");
    expect(phase.canonicalGoal).toBe("live_source_status");
    expect(phase.allowedTools).toEqual(["live_env.query_micro_reasoner_presets"]);
    expect(phase.fallbackTools).toEqual([]);
    expect(phase.requiredEvidence).toEqual(["stage_play_micro_reasoner_prompt_preset_query_result"]);
    expect(phase.completionEvidence).toEqual(["stage_play_micro_reasoner_prompt_preset_query_result"]);
    expect(phase.nextPhase).toBe("terminal_checkpoint");
    expect(phase.forbiddenTools).toEqual(expect.arrayContaining([
      "live_env.read_processed_live_source_mail",
      "live_env.process_live_source_mail",
    ]));
    expect(phase.phaseLock).toMatchObject({
      locked: true,
      reason: "MicroDeck inspection is a read-only source-prompt query, not mailbox processing.",
    });
    expect(isLockedExecutableLiveSourcePhase(phase)).toBe(true);
    expect(mandatoryToolForPhase(phase)).toBe("live_env.query_micro_reasoner_presets");
  });

  it("recognizes MicroDeck prompt and active deck inspection wording", () => {
    for (const prompt of [
      "Show the active MicroDeck prompts for this source.",
      "Inspect the micro-reasoner deck that is assembled for the live source.",
      "List the prompt presets in the source deck assembly.",
    ]) {
      const phase = resolveLiveSourceTurnPhase({
        prompt,
        selectedTargetSource: "live_source_mailbox",
      });

      expect(phase.phase).toBe("query_micro_reasoner_deck");
      expect(phase.allowedTools).toEqual(["live_env.query_micro_reasoner_presets"]);
      expect(phase.fallbackTools).toEqual([]);
      expect(phase.requiredEvidence).toEqual(["stage_play_micro_reasoner_prompt_preset_query_result"]);
    }
  });

  it("locks MicroDeck setup drafting to the read-only draft tool without processed-mail fallback", () => {
    const phase = resolveLiveSourceTurnPhase({
      prompt: "Draft a MicroDeck preset for a visual automation scenario that chooses between three candidate prompts.",
      selectedTargetSource: "live_source_mailbox",
      selectedCapability: "live_env.read_processed_live_source_mail",
    });

    expect(phase.phase).toBe("query_micro_reasoner_deck");
    expect(phase.canonicalGoal).toBe("live_source_status");
    expect(phase.allowedTools).toEqual(["live_env.draft_micro_reasoner_preset"]);
    expect(phase.fallbackTools).toEqual([]);
    expect(phase.requiredEvidence).toEqual(["stage_play_micro_reasoner_prompt_preset_draft"]);
    expect(phase.completionEvidence).toEqual(["stage_play_micro_reasoner_prompt_preset_draft"]);
    expect(phase.forbiddenTools).toEqual(expect.arrayContaining([
      "live_env.read_processed_live_source_mail",
      "live_env.process_live_source_mail",
      "live_env.read_live_source_mail",
    ]));
    expect(phase.phaseLock).toMatchObject({
      locked: true,
      reason: "MicroDeck setup drafting is a read-only source-prompt planning query, not mailbox processing or preset mutation.",
    });
    expect(isLockedExecutableLiveSourcePhase(phase)).toBe(true);
    expect(mandatoryToolForPhase(phase)).toBe("live_env.draft_micro_reasoner_preset");
  });

  it("does not execute MicroDeck query from quoted, negated, future, historical, or screen-visible mentions", () => {
    for (const prompt of [
      "Do not query the MicroDeck right now; explain what it is for.",
      "Later we might inspect the micro-reasoner deck.",
      "If we inspect the MicroDeck presets tomorrow, what should we watch for?",
      "Earlier we queried the MicroDeck preset assembly during the smoke test.",
      "The UI button says MicroDeck presets.",
      "The current screen-visible label reads Query MicroDeck presets.",
      "The operator said \"query the MicroDeck presets\" in the old transcript.",
      "The phrase `live_env.query_micro_reasoner_presets` is shown in the docs.",
    ]) {
      const phase = resolveLiveSourceTurnPhase({
        prompt,
        selectedTargetSource: "live_source_mailbox",
        selectedCapability: "live_env.query_micro_reasoner_presets",
      });

      expect(phase.phase).not.toBe("query_micro_reasoner_deck");
      expect(phase.allowedTools).not.toContain("live_env.query_micro_reasoner_presets");
    }
  });

  it("does not execute MicroDeck draft from quoted, negated, future, historical, or screen-visible mentions", () => {
    for (const prompt of [
      "Do not draft a MicroDeck right now; explain the idea first.",
      "Later we might design a micro-reasoner deck for this.",
      "If we draft the MicroDeck preset tomorrow, what inputs should we collect?",
      "Earlier we recommended a MicroDeck setup during the smoke test.",
      "The UI button says Draft MicroDeck preset.",
      "The operator said \"draft a MicroDeck preset\" in the old transcript.",
      "The phrase `live_env.draft_micro_reasoner_preset` is shown in the docs.",
    ]) {
      const phase = resolveLiveSourceTurnPhase({
        prompt,
        selectedTargetSource: "live_source_mailbox",
        selectedCapability: "live_env.draft_micro_reasoner_preset",
      });

      expect(phase.phase).not.toBe("query_micro_reasoner_deck");
      expect(phase.allowedTools).not.toContain("live_env.draft_micro_reasoner_preset");
    }
  });

  it("requires a recorded decision before voice for processed voice candidates", () => {
    const phase = resolveLiveSourceTurnPhase({
      prompt: "Read the processed Minecraft mail and call out if danger appears.",
      selectedTargetSource: "live_source_mailbox",
      processedPackets: [{
        artifactId: "stage_play_processed_mail_packet",
        packetId: "stage_play_processed_mail_packet:voice-candidate",
        observedFacts: ["The player is on fire."],
        recommendedNext: "request_voice_callout",
        salience: {
          level: "urgent",
          voiceCandidate: true,
          calloutDraft: "The player appears to be on fire.",
        },
      }],
    });

    expect(phase).toMatchObject({
      phase: "record_decision",
      canonicalGoal: "processed_mail_voice_decision",
      allowedTools: ["live_env.record_live_source_mail_decision"],
      nextPhase: "request_voice_after_decision",
      terminal_eligible: false,
    });
    expect(phase.phaseLock.locked).toBe(true);
    expect(phase.requiredEvidence).toEqual(["stage_play_processed_mail_packet"]);
    expect(phase.completionEvidence).toEqual(["stage_play_live_source_mail_decision"]);
    expect(phase.forbiddenTools).toEqual(expect.arrayContaining([
      "live_env.read_processed_live_source_mail",
      "live_env.process_live_source_mail",
      "live_env.request_interim_voice_callout",
      "final_answer",
    ]));
  });

  it("treats high or urgent salience as a voice candidate requiring decision first", () => {
    for (const level of ["high", "urgent"]) {
      const phase = resolveLiveSourceTurnPhase({
        prompt: "Read the processed Minecraft mail.",
        selectedTargetSource: "live_source_mailbox",
        processedPackets: [{
          artifactId: "stage_play_processed_mail_packet",
          packetId: `stage_play_processed_mail_packet:${level}`,
          observedFacts: ["The player is near lava."],
          recommendedNext: "record_interpretation",
          salience: {
            level,
            reasons: ["Visible danger cue."],
          },
        }],
      });

      expect(phase.phase).toBe("record_decision");
      expect(phase.canonicalGoal).toBe("processed_mail_voice_decision");
      expect(phase.allowedTools).toEqual(["live_env.record_live_source_mail_decision"]);
      expect(phase.forbiddenTools).toEqual(expect.arrayContaining([
        "live_env.request_interim_voice_callout",
        "final_answer",
      ]));
      expect(phase.requiredEvidence).toEqual(["stage_play_processed_mail_packet"]);
      expect(phase.completionEvidence).toEqual(["stage_play_live_source_mail_decision"]);
      expect(phase.nextPhase).toBe("request_voice_after_decision");
      expect(phase.phaseLock.locked).toBe(true);
    }
  });

  it("allows interim voice only after the request_voice_callout decision receipt exists", () => {
    const phase = resolveLiveSourceTurnPhase({
      prompt: "Read the processed Minecraft mail and call out if danger appears.",
      selectedTargetSource: "live_source_mailbox",
      processedPackets: [{
        artifactId: "stage_play_processed_mail_packet",
        packetId: "stage_play_processed_mail_packet:voice-candidate",
        observedFacts: ["The player is on fire."],
        recommendedNext: "request_voice_callout",
        salience: {
          level: "urgent",
          voiceCandidate: true,
          calloutDraft: "The player appears to be on fire.",
        },
      }],
      latestToolReceipts: [{
        tool_name: "live_env.record_live_source_mail_decision",
        observation: {
          artifactId: "stage_play_live_source_mail_decision",
          schemaVersion: "stage_play_live_source_mail_decision/v1",
          decisionId: "stage_play_live_source_mail_decision:voice-1",
          decision: "request_voice_callout",
          voiceCalloutDraft: {
            text: "The player appears to be on fire.",
            voiceEligible: true,
            requiresConfirmation: false,
          },
        },
      }],
    });

    expect(phase.phase).toBe("request_voice_after_decision");
    expect(phase.canonicalGoal).toBe("processed_mail_voice_decision");
    expect(phase.allowedTools).toEqual(["live_env.request_interim_voice_callout"]);
    expect(phase.forbiddenTools).toEqual(expect.arrayContaining([
      "live_env.record_live_source_mail_decision",
      "final_answer",
    ]));
    expect(phase.requiredEvidence).toEqual(["stage_play_live_source_mail_decision"]);
    expect(phase.completionEvidence).toEqual([
      "live_source_interim_voice_callout_receipt",
      "voice_hold_receipt",
      "voice_block_receipt",
      "voice_receipt",
    ]);
    expect(phase.nextPhase).toBe("terminal_checkpoint");
    expect(phase.phaseLock.locked).toBe(true);
    expect(phase.terminal_eligible).toBe(false);
  });

  it("locks to interim voice after a recorded request_voice_callout decision even without re-derived packet voice candidacy", () => {
    const phase = resolveLiveSourceTurnPhase({
      prompt: "Continue the active Stage Play live-source mailbox flow after the recorded decision.",
      selectedTargetSource: "live_source_mailbox",
      latestToolReceipts: [{
        tool_name: "live_env.record_live_source_mail_decision",
        observation: {
          artifactId: "stage_play_live_source_mail_decision",
          schemaVersion: "stage_play_live_source_mail_decision/v1",
          decisionId: "stage_play_live_source_mail_decision:voice-2",
          decision: "request_voice_callout",
          voiceCalloutDraft: {
            text: "Lava is nearby; keep distance.",
            voiceEligible: true,
            requiresConfirmation: false,
          },
        },
      }],
    });

    expect(phase.phase).toBe("request_voice_after_decision");
    expect(phase.allowedTools).toEqual(["live_env.request_interim_voice_callout"]);
    expect(phase.forbiddenTools).toEqual(expect.arrayContaining([
      "live_env.read_live_source_mail",
      "live_env.record_live_source_mail_decision",
      "final_answer",
    ]));
    expect(phase.completionEvidence).toEqual([
      "live_source_interim_voice_callout_receipt",
      "voice_hold_receipt",
      "voice_block_receipt",
      "voice_receipt",
    ]);
    expect(phase.phaseLock.locked).toBe(true);
  });

  it("terminalizes after a voice decision has a voice receipt instead of repeating the callout tool", () => {
    const phase = resolveLiveSourceTurnPhase({
      prompt: "Read the processed Minecraft mail and call out if danger appears.",
      selectedTargetSource: "live_source_mailbox",
      processedPackets: [{
        artifactId: "stage_play_processed_mail_packet",
        packetId: "stage_play_processed_mail_packet:voice-complete",
        observedFacts: ["The player is taking fire damage."],
        recommendedNext: "request_voice_callout",
        salience: {
          level: "urgent",
          voiceCandidate: true,
          calloutDraft: "You are taking fire damage.",
        },
      }],
      latestToolReceipts: [
        {
          tool_name: "live_env.record_live_source_mail_decision",
          observation: {
            artifactId: "stage_play_live_source_mail_decision",
            schemaVersion: "stage_play_live_source_mail_decision/v1",
            decisionId: "stage_play_live_source_mail_decision:voice-complete",
            decision: "request_voice_callout",
          },
        },
        {
          tool_name: "live_env.request_interim_voice_callout",
          observation: {
            schema: "helix.interim_voice_callout_tool_result.v1",
            receipt: {
              status: "awaiting_client_playback",
              assistant_answer: false,
              raw_content_included: false,
            },
          },
        },
      ],
    });

    expect(phase.phase).toBe("terminal_checkpoint");
    expect(phase.canonicalGoal).toBe("processed_mail_voice_decision");
    expect(phase.allowedTools).toEqual([]);
    expect(phase.forbiddenTools).toEqual(expect.arrayContaining([
      "live_env.request_interim_voice_callout",
      "live_env.record_live_source_mail_decision",
    ]));
    expect(phase.requiredEvidence).toEqual([
      "stage_play_processed_mail_packet",
      "stage_play_live_source_mail_decision",
      "live_source_interim_voice_callout_receipt",
    ]);
    expect(phase.completionEvidence).toEqual(["model_synthesized_answer"]);
    expect(phase.nextPhase).toBe(null);
  });

  it("routes processed-mail interpretation prompts to read processed mail with process fallback", () => {
    const phase = resolveLiveSourceTurnPhase({
      prompt: "Read the visual mail and interpret what is happening. Predict what should be watched next.",
    });

    expect(phase.phase).toBe("read_processed_mail");
    expect(phase.canonicalGoal).toBe("processed_mail_interpretation");
    expect(phase.allowedTools).toEqual(["live_env.read_processed_live_source_mail"]);
    expect(phase.fallbackTools).toEqual(["live_env.process_live_source_mail"]);
    expect(phase.completionEvidence).toEqual(["stage_play_processed_mail_packet"]);
    expect(phase.requiredEvidence).toEqual(["stage_play_processed_mail_packet"]);
    expect(phase.requiredEvidence).not.toEqual(expect.arrayContaining([
      "doc_summary",
      "visual_observation",
      "field_evaluation",
      "situation_context_pack",
    ]));
  });

  it("requires record_decision after processed packets that recommend interpretation", () => {
    const phase = resolveLiveSourceTurnPhase({
      prompt: "Compare mail and say what is happening.",
      processedPackets: [{
        artifactId: "stage_play_processed_mail_packet",
        packetId: "stage_play_processed_mail_packet:interpret",
        observedFacts: ["The player moved from inventory to a cave."],
        recommendedNext: "record_interpretation",
        salience: {
          level: "medium",
          voiceCandidate: false,
        },
      }],
    });

    expect(phase.phase).toBe("record_decision");
    expect(phase.canonicalGoal).toBe("processed_mail_interpretation");
    expect(phase.allowedTools).toEqual(["live_env.record_live_source_mail_decision"]);
    expect(phase.requiredEvidence).toEqual(["stage_play_processed_mail_packet"]);
    expect(phase.completionEvidence).toEqual(["stage_play_live_source_mail_decision"]);
    expect(phase.nextPhase).toBe("terminal_checkpoint");
    expect(phase.terminal_eligible).toBe(false);
    expect(phase.phaseLock.locked).toBe(true);
    expect(phase.forbiddenTools).toEqual(expect.arrayContaining([
      "live_env.read_processed_live_source_mail",
      "live_env.process_live_source_mail",
      "live_env.request_interim_voice_callout",
      "final_answer",
    ]));
  });

  it("requires a canonical processed read after process fallback before decision", () => {
    const phase = resolveLiveSourceTurnPhase({
      prompt: "Read the visual mail and interpret what changed.",
      latestToolReceipts: [
        {
          tool_name: "live_env.read_processed_live_source_mail",
          observation: {
            packets: [],
            missingRawMailIds: ["stage_play_live_source_mail:1"],
          },
        },
        {
          tool_name: "live_env.process_live_source_mail",
          observation: {
            packets: [{
              artifactId: "stage_play_processed_mail_packet",
              packetId: "stage_play_processed_mail_packet:processed-fallback",
              observedFacts: ["The source changed from inventory to cave."],
              recommendedNext: "record_interpretation",
              salience: {
                level: "medium",
                voiceCandidate: false,
              },
            }],
          },
        },
      ],
    });

    expect(phase.phase).toBe("read_processed_mail");
    expect(phase.allowedTools).toEqual(["live_env.read_processed_live_source_mail"]);
    expect(phase.fallbackTools).toEqual(["live_env.process_live_source_mail"]);
    expect(phase.forbiddenTools).toEqual(expect.arrayContaining([
      "live_env.record_live_source_mail_decision",
      "live_env.request_interim_voice_callout",
    ]));
    expect(phase.nextPhase).toBe("record_decision");
  });

  it("allows direct terminal checkpoint for draft_text_answer or wait processed packets", () => {
    for (const recommendedNext of ["draft_text_answer", "wait_for_next_summary"]) {
      const phase = resolveLiveSourceTurnPhase({
        prompt: "Read the visual mail and interpret what is happening.",
        processedPackets: [{
          artifactId: "stage_play_processed_mail_packet",
          packetId: `stage_play_processed_mail_packet:${recommendedNext}`,
          observedFacts: ["The source shows stable Minecraft inventory management."],
          changedFacts: [],
          recommendedNext,
          salience: {
            level: "low",
            voiceCandidate: false,
          },
        }],
      });

      expect(phase.phase).toBe("terminal_checkpoint");
      expect(phase.canonicalGoal).toBe("processed_mail_interpretation");
      expect(phase.allowedTools).toEqual([]);
      expect(phase.forbiddenTools).toEqual(expect.arrayContaining([
        "live_env.read_processed_live_source_mail",
        "live_env.process_live_source_mail",
        "live_env.record_live_source_mail_decision",
      ]));
      expect(phase.requiredEvidence).toEqual(["stage_play_processed_mail_packet"]);
      expect(phase.completionEvidence).toEqual(["model_synthesized_answer"]);
      expect(phase.nextPhase).toBe(null);
    }
  });

  it("terminalizes after a processed-mail decision receipt without another read", () => {
    const phase = resolveLiveSourceTurnPhase({
      prompt: "Read the visual mail and interpret what is happening.",
      processedPackets: [{
        artifactId: "stage_play_processed_mail_packet",
        packetId: "stage_play_processed_mail_packet:decision-complete",
        observedFacts: ["The Minecraft source changed from forest to cave."],
        recommendedNext: "record_interpretation",
        salience: {
          level: "medium",
          voiceCandidate: false,
        },
      }],
      latestToolReceipts: [{
        tool_name: "live_env.record_live_source_mail_decision",
        observation: {
          artifactId: "stage_play_live_source_mail_decision",
          schemaVersion: "stage_play_live_source_mail_decision/v1",
          decisionId: "stage_play_live_source_mail_decision:interpret-1",
          decision: "record_interpretation",
        },
      }],
    });

    expect(phase.phase).toBe("terminal_checkpoint");
    expect(phase.canonicalGoal).toBe("processed_mail_interpretation");
    expect(phase.allowedTools).toEqual([]);
    expect(phase.forbiddenTools).toContain("live_env.read_processed_live_source_mail");
    expect(phase.requiredEvidence).toEqual([
      "stage_play_processed_mail_packet",
      "stage_play_live_source_mail_decision",
    ]);
    expect(phase.completionEvidence).toEqual(["model_synthesized_answer"]);
  });

  it("uses process fallback after a processed-mail read without packet coverage", () => {
    const phase = resolveLiveSourceTurnPhase({
      prompt: "Read the visual mail and interpret what changed.",
      selectedTargetSource: "live_source_mailbox",
      latestToolReceipts: [{
        tool_name: "live_env.read_processed_live_source_mail",
        ok: true,
        observation: {
          packets: [],
        },
      }],
    });

    expect(phase.phase).toBe("process_mail_fallback");
    expect(phase.allowedTools).toEqual(["live_env.process_live_source_mail"]);
    expect(phase.nextPhase).toBe("read_processed_mail");
  });
});
