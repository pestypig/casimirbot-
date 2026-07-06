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

export type HelixAskMinimalRuntimeSubmitPlan = {
  admission: HelixAskSubmitAdmissionDecision;
  context: HelixAskContextBridgeSnapshot;
  envelope: HelixAskConsoleRequestEnvelope | null;
};

export function buildHelixAskMinimalRuntimeSubmitPlan(args: {
  draft: string;
  selectedRuntime: HelixAgentRuntimeId;
  selectedLanguageModelProfile?: HelixLanguageModelProfileId;
  desktopUrl?: string | null;
}): HelixAskMinimalRuntimeSubmitPlan {
  const admission = buildHelixAskSubmitAdmission({
    entries: [args.draft],
    askBusy: false,
    compactionPausePending: false,
    hasPastedTextResumeFrameForSubmit: false,
    attachmentKinds: [],
    allEntriesArePastedTextResumeRecallPrompt: false,
  });
  const context = buildHelixAskContextBridgeSnapshot(args.desktopUrl ?? "");
  return {
    admission,
    context,
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
