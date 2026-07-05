import {
  buildInterimVoiceClientHandoffDebug,
  collectInterimVoiceCalloutPlaybackIntents,
  type InterimVoiceCalloutPlaybackIntent,
  type InterimVoiceClientHandoffDebug,
} from "@/lib/helix/ask-interim-voice-callout";
import {
  mapVoicePlaybackIntentToTask,
  type VoiceAutoSpeakTask,
  type VoicePlaybackUtteranceIntent,
} from "@/lib/helix/ask-voice-playback-intent";
import type { VoicePlaybackOutcomeReceipt } from "@/lib/helix/voice-capture-diagnostics";
import {
  appendVoicePlaybackOutcomeReceipt,
  buildVoicePlaybackOutcomeReceipt,
  postVoicePlaybackOutcomeReceipt,
  type BuildVoicePlaybackOutcomeReceiptInput,
} from "@/lib/helix/voice-playback-outcome-client";

export type HelixAskVoicePlaybackToolOutputState = {
  micArmState: string;
  voiceMode: string | null;
  micArmed: boolean;
  voiceOutputArmed: boolean;
  outputArmed: boolean;
};

export type HelixAskVoicePlaybackToolHandoffStep = {
  intent: InterimVoiceCalloutPlaybackIntent;
  playbackIntent: VoicePlaybackUtteranceIntent;
  task: VoiceAutoSpeakTask;
  outputState: HelixAskVoicePlaybackToolOutputState;
  outputStateDebug: InterimVoiceClientHandoffDebug;
  enqueueDebugContext: InterimVoiceClientHandoffDebug;
  seenDetail: string;
  enqueueAttemptDetail: string;
  suppressedReason: string;
  enqueueRejectedReason: string;
};

export type HelixAskVoicePlaybackToolHandoffPlan = {
  outputState: HelixAskVoicePlaybackToolOutputState;
  steps: HelixAskVoicePlaybackToolHandoffStep[];
};

export type HelixAskVoicePlaybackToolTimelineEvent = {
  kind: "interim_voice_handoff_seen" | "interim_voice_enqueue_attempted" | "chunk_drop";
  status: "seen" | "attempted" | "suppressed";
  traceId: string | null;
  turnKey: string;
  utteranceId: string;
  text?: string;
  detail: string;
  utteranceAuthority?: string | null;
  utteranceSource?: string | null;
  debugContext?: InterimVoiceClientHandoffDebug;
  suppressionCause?: "inactive_attempt";
  authorityRejectStage?: "preflight";
};

export type HelixAskVoicePlaybackToolOutcomeReceipt = {
  status: "suppressed";
  utteranceId: string;
  turnKey: string;
  kind: InterimVoiceCalloutPlaybackIntent["kind"];
  sourceReceiptId: string;
  sourceReceiptKey: string;
  requestId: string | null;
  calloutKind: InterimVoiceCalloutPlaybackIntent["calloutKind"];
  error: string;
};

export type HelixAskVoicePlaybackToolExecutionDeps = {
  emitTimelineEvent: (event: HelixAskVoicePlaybackToolTimelineEvent) => void;
  recordPlaybackOutcomeReceipt: (receipt: HelixAskVoicePlaybackToolOutcomeReceipt) => void;
  enqueuePlaybackIntent: (intent: VoicePlaybackUtteranceIntent) => boolean;
  markHandoffConsumed: (intent: InterimVoiceCalloutPlaybackIntent) => void;
};

export type HelixAskVoicePlaybackToolReceiptInput = Omit<
  BuildVoicePlaybackOutcomeReceiptInput,
  "audioUnlocked" | "playbackPath"
>;

export type HelixAskVoicePlaybackToolReceiptRecordResult = {
  receipt: VoicePlaybackOutcomeReceipt;
  receipts: VoicePlaybackOutcomeReceipt[];
};

export function recordHelixAskVoicePlaybackToolOutcomeReceipt(input: {
  receipt: HelixAskVoicePlaybackToolReceiptInput;
  currentReceipts: VoicePlaybackOutcomeReceipt[];
  audioUnlocked: boolean;
  playbackPath?: VoicePlaybackOutcomeReceipt["playbackPath"];
  maxReceipts?: number;
  commitReceipts: (receipts: VoicePlaybackOutcomeReceipt[]) => void;
  postReceipt?: (receipt: VoicePlaybackOutcomeReceipt) => void;
}): HelixAskVoicePlaybackToolReceiptRecordResult {
  const receipt = buildVoicePlaybackOutcomeReceipt({
    ...input.receipt,
    audioUnlocked: input.audioUnlocked,
    playbackPath: input.playbackPath,
  });
  const receipts = appendVoicePlaybackOutcomeReceipt(
    input.currentReceipts,
    receipt,
    input.maxReceipts,
  );
  input.commitReceipts(receipts);
  (input.postReceipt ?? postVoicePlaybackOutcomeReceipt)(receipt);
  return { receipt, receipts };
}

export function buildHelixAskVoicePlaybackToolOutputState(input: {
  micArmState: string;
  voiceMode?: string | null;
  outputModeEnabled: boolean;
  allowMicOffPlayback?: boolean | null;
}): HelixAskVoicePlaybackToolOutputState {
  const micArmed = input.micArmState === "on";
  const voiceOutputArmed = input.outputModeEnabled || input.allowMicOffPlayback === true;
  return {
    micArmState: input.micArmState,
    voiceMode: input.voiceMode ?? null,
    micArmed,
    voiceOutputArmed,
    outputArmed: voiceOutputArmed,
  };
}

const resolvePlaybackIntent = (
  intent: InterimVoiceCalloutPlaybackIntent,
  outputState: HelixAskVoicePlaybackToolOutputState,
): VoicePlaybackUtteranceIntent => ({
  ...intent,
  allowMicOffPlayback:
    intent.allowMicOffPlayback ?? (!outputState.micArmed && outputState.voiceOutputArmed),
});

export function buildHelixAskVoicePlaybackToolHandoffPlan(input: {
  artifacts: unknown[];
  spokenReceiptKeys?: Iterable<string>;
  spokenImmediateAckTurnKeys?: Iterable<string>;
  micArmState: string;
  voiceMode?: string | null;
  outputModeEnabled: boolean;
}): HelixAskVoicePlaybackToolHandoffPlan {
  const intents = collectInterimVoiceCalloutPlaybackIntents({
    artifacts: input.artifacts,
    spokenReceiptKeys: input.spokenReceiptKeys,
    spokenImmediateAckTurnKeys: input.spokenImmediateAckTurnKeys,
  });
  const baseOutputState = buildHelixAskVoicePlaybackToolOutputState({
    micArmState: input.micArmState,
    voiceMode: input.voiceMode ?? null,
    outputModeEnabled: input.outputModeEnabled,
  });
  const steps = intents.map((intent): HelixAskVoicePlaybackToolHandoffStep => {
    const outputState = buildHelixAskVoicePlaybackToolOutputState({
      micArmState: input.micArmState,
      voiceMode: input.voiceMode ?? null,
      outputModeEnabled: input.outputModeEnabled,
      allowMicOffPlayback: intent.allowMicOffPlayback ?? null,
    });
    const playbackIntent = resolvePlaybackIntent(intent, outputState);
    const task = mapVoicePlaybackIntentToTask(playbackIntent);
    const outputStateDebug = buildInterimVoiceClientHandoffDebug({
      intent,
      micArmState: input.micArmState,
      voiceMode: input.voiceMode ?? null,
      outputModeEnabled: input.outputModeEnabled,
      allowMicOffPlayback: playbackIntent.allowMicOffPlayback ?? null,
    });
    const mode = input.voiceMode ?? null;
    const stateSuffix = `mic=${input.micArmState}:mode=${mode}:outputArmed=${outputState.outputArmed}`;
    return {
      intent,
      playbackIntent,
      task,
      outputState,
      outputStateDebug,
      enqueueDebugContext: {
        ...outputStateDebug,
        allowMicOffPlayback: playbackIntent.allowMicOffPlayback ?? null,
      },
      seenDetail: `interim_voice_handoff_seen:${stateSuffix}`,
      enqueueAttemptDetail: `interim_voice_enqueue_attempted:${stateSuffix}`,
      suppressedReason: `voice_output_not_armed:mic=${input.micArmState}:mode=${mode}`,
      enqueueRejectedReason: `interim_voice_enqueue_rejected:${stateSuffix}`,
    };
  });

  return {
    outputState: baseOutputState,
    steps,
  };
}

function buildSuppressedReceipt(
  step: HelixAskVoicePlaybackToolHandoffStep,
  error: string,
): HelixAskVoicePlaybackToolOutcomeReceipt {
  const { intent, task } = step;
  return {
    status: "suppressed",
    utteranceId: task.key,
    turnKey: intent.turnKey,
    kind: intent.kind,
    sourceReceiptId: intent.receiptId,
    sourceReceiptKey: intent.receiptKey,
    requestId: intent.requestId,
    calloutKind: intent.calloutKind,
    error,
  };
}

function buildSuppressedDropEvent(
  step: HelixAskVoicePlaybackToolHandoffStep,
  detail: string,
): HelixAskVoicePlaybackToolTimelineEvent {
  const { intent, task } = step;
  return {
    kind: "chunk_drop",
    status: "suppressed",
    traceId: intent.traceId ?? null,
    turnKey: intent.turnKey,
    utteranceId: task.key,
    detail,
    utteranceAuthority: intent.authority ?? null,
    utteranceSource: intent.source ?? null,
    suppressionCause: "inactive_attempt",
    authorityRejectStage: "preflight",
  };
}

export function executeHelixAskVoicePlaybackToolHandoffPlan(
  plan: HelixAskVoicePlaybackToolHandoffPlan,
  deps: HelixAskVoicePlaybackToolExecutionDeps,
): number {
  let acceptedCount = 0;
  for (const step of plan.steps) {
    const { intent } = step;
    deps.emitTimelineEvent({
      kind: "interim_voice_handoff_seen",
      status: "seen",
      traceId: intent.traceId ?? null,
      turnKey: intent.turnKey,
      utteranceId: intent.receiptKey,
      detail: step.seenDetail,
      utteranceAuthority: intent.authority ?? null,
      utteranceSource: intent.source ?? null,
      debugContext: step.outputStateDebug,
    });
    if (!step.outputState.outputArmed) {
      deps.recordPlaybackOutcomeReceipt(buildSuppressedReceipt(step, step.suppressedReason));
      deps.emitTimelineEvent(buildSuppressedDropEvent(step, step.suppressedReason));
      deps.markHandoffConsumed(intent);
      continue;
    }
    deps.emitTimelineEvent({
      kind: "interim_voice_enqueue_attempted",
      status: "attempted",
      traceId: intent.traceId ?? null,
      turnKey: intent.turnKey,
      utteranceId: intent.receiptKey,
      text: intent.text,
      detail: step.enqueueAttemptDetail,
      utteranceAuthority: intent.authority ?? null,
      utteranceSource: intent.source ?? null,
      debugContext: step.enqueueDebugContext,
    });
    const accepted = deps.enqueuePlaybackIntent(step.playbackIntent);
    if (!accepted) {
      deps.recordPlaybackOutcomeReceipt(buildSuppressedReceipt(step, step.enqueueRejectedReason));
      deps.emitTimelineEvent(buildSuppressedDropEvent(step, step.enqueueRejectedReason));
      deps.markHandoffConsumed(intent);
      continue;
    }
    deps.markHandoffConsumed(intent);
    acceptedCount += 1;
  }
  return acceptedCount;
}
