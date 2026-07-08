import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";
import type { HelixLanguageModelProfileId } from "@shared/helix-language-model-policy";

import {
  buildHelixAskContextBridgeSnapshot,
  type HelixAskContextBridgeSnapshot,
} from "./HelixAskContextBridge";
import {
  buildHelixAskConsoleRequestEnvelope,
  type HelixAskConsoleRequestEnvelope,
} from "./HelixAskRequestEnvelope";
import {
  buildHelixAskSubmitAdmission,
  type HelixAskSubmitAdmissionDecision,
} from "./HelixAskSubmitAdmission";
import type { PendingHelixAskPrompt } from "@/lib/helix/ask-prompt-launch";
import {
  buildHelixAskChatReferentContextForSubmit,
  type HelixAskChatReferentReplyLike,
} from "@/lib/helix/ask-chat-referent-context";

export type HelixAskMinimalRuntimeSubmitPlan = {
  admission: HelixAskSubmitAdmissionDecision;
  context: HelixAskContextBridgeSnapshot;
  envelope: HelixAskConsoleRequestEnvelope | null;
  pendingPrompt?: PendingHelixAskPrompt | null;
};

export function buildHelixAskMinimalRuntimeSubmitPlan(args: {
  draft: string;
  selectedRuntime: HelixAgentRuntimeId;
  selectedLanguageModelProfile?: HelixLanguageModelProfileId;
  desktopUrl?: string | null;
  pendingPrompt?: PendingHelixAskPrompt | null;
  durableReplies?: readonly HelixAskChatReferentReplyLike[];
  visibleReplies?: readonly HelixAskChatReferentReplyLike[];
}): HelixAskMinimalRuntimeSubmitPlan {
  const admission = buildHelixAskSubmitAdmission({
    entries: [args.draft],
    askBusy: false,
    compactionPausePending: false,
    hasPastedTextResumeFrameForSubmit: false,
    attachmentKinds: [],
    allEntriesArePastedTextResumeRecallPrompt: false,
  });
  const baseContext = buildHelixAskContextBridgeSnapshot(args.desktopUrl ?? "");
  const chatReferentContextBuild = buildHelixAskChatReferentContextForSubmit({
    durableReplies: args.durableReplies ?? [],
    visibleReplies: args.visibleReplies ?? [],
  });
  const context: HelixAskContextBridgeSnapshot = chatReferentContextBuild.context
    ? {
        ...baseContext,
        chatReferentContext: chatReferentContextBuild.context,
        chat_referent_context: chatReferentContextBuild.context,
        chatReferentContextSourceSummary: chatReferentContextBuild.source_summary,
        chat_referent_context_source_summary: chatReferentContextBuild.source_summary,
      }
    : {
        ...baseContext,
        chatReferentContextSourceSummary: chatReferentContextBuild.source_summary,
        chat_referent_context_source_summary: chatReferentContextBuild.source_summary,
      };
  return {
    admission,
    context,
    pendingPrompt: args.pendingPrompt ?? null,
    envelope: admission.firstEntry
      ? buildHelixAskConsoleRequestEnvelope({
          question: admission.firstEntry,
          agentRuntime: args.selectedRuntime,
          languageModelProfile: args.selectedLanguageModelProfile,
          context,
        })
      : null,
  };
}
