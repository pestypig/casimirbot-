import type { SituationCognitionPowerMode } from "@shared/helix-standby-queue";
import type {
  SituationInterjectionProposal,
  SituationSalienceReceipt,
} from "@shared/helix-situation-standby";
import type { SituationPrediction } from "@shared/helix-situation-prediction";

export type InterjectionDecision =
  | "silent_keep_in_context"
  | "visual_badge"
  | "text_callout"
  | "voice_on_confirm"
  | "request_user_input"
  | "attach_context_for_reasoning";

export function decideSituationInterjection(args: {
  salienceReceipt?: SituationSalienceReceipt | null;
  interjectionProposal?: SituationInterjectionProposal | null;
  predictions?: SituationPrediction[];
  powerMode?: SituationCognitionPowerMode;
  voiceOutputGranted?: boolean;
  directAddress?: boolean;
  speakerAuthority?: "self" | "trusted" | "unknown";
}): InterjectionDecision {
  const receipt = args.salienceReceipt;
  const powerMode = args.powerMode ?? "low_power";
  if (!receipt?.should_notify_helix) return "silent_keep_in_context";
  if (receipt.should_request_user_input) return "request_user_input";
  if (receipt.reason === "direct_address" || args.directAddress) return "attach_context_for_reasoning";
  if (args.speakerAuthority === "unknown") return "visual_badge";
  if (receipt.priority === "critical" || receipt.priority === "action") {
    return args.voiceOutputGranted && (powerMode === "game_master" || powerMode === "active_companion")
      ? "voice_on_confirm"
      : "text_callout";
  }
  if (receipt.priority === "warn") return "text_callout";
  return powerMode === "observe_only" ? "silent_keep_in_context" : "visual_badge";
}
