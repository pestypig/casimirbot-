import type { HelixLiveEnvironmentToolName } from "@shared/helix-live-agent-step";

export const hasAskTurnMicroReasonerPresetCue = (transcript: string): boolean =>
  /\blive_env\.(?:query_micro_reasoner_presets|draft_micro_reasoner_preset|apply_micro_reasoner_preset|create_micro_reasoner_preset|route_micro_reasoner_prompt|query_micro_reasoner_prompts|update_micro_reasoner_prompt|test_micro_reasoner_prompt)\b/i.test(transcript) ||
  /\b(?:microdeck|micro[-\s]?deck|micro[-\s]?reasoner\s+(?:deck|preset|prompt|assembly|cluster|router|delegation)|reasoner\s+deck|prompt\s+router|prompt\s+delegation)\b/i.test(transcript) ||
  /\b(?:query|list|show|draft|design|recommend|propose|plan|set\s+up|setup|configure|arrange|apply|use|activate|create|save|customi[sz]e|edit|route|delegate|choose|pick)\b[\s\S]{0,120}\b(?:micro[-\s]?reasoner|microdeck|micro[-\s]?deck|candidate\s+prompts?|prompt\s+router|prompt\s+delegation)\b/i.test(transcript);

export const hasContextualAskTurnMicroReasonerCue = (transcript: string): boolean =>
  /["'`][^"'`]*(?:live_env\.(?:query_micro_reasoner_presets|draft_micro_reasoner_preset|route_micro_reasoner_prompt)|micro[-\s]?deck|micro[-\s]?reasoner(?:s)?|prompt\s+(?:preset|deck|router|delegation)|source\s+deck\s+assembly)[^"'`]*["'`]/i.test(transcript) ||
  /\b(?:if|in\s+the\s+future|future|later|eventually|hypothetically|tomorrow|next\s+time|would|could|might)\b[\s\S]{0,140}\b(?:live_env\.(?:query_micro_reasoner_presets|draft_micro_reasoner_preset|route_micro_reasoner_prompt)|micro[-\s]?deck|micro[-\s]?reasoner(?:s)?|prompt\s+(?:preset|deck|router|delegation)|source\s+deck\s+assembly)\b/i.test(transcript) ||
  /\b(?:previously|earlier|last\s+time|before|already|historically|was|were|had)\b[\s\S]{0,140}\b(?:ran|run|used|queried|viewed|inspected|showed|listed|checked|read|called|routed|delegated|drafted|designed|recommended)?\b[\s\S]{0,120}\b(?:live_env\.(?:query_micro_reasoner_presets|draft_micro_reasoner_preset|route_micro_reasoner_prompt)|micro[-\s]?deck|micro[-\s]?reasoner(?:s)?|prompt\s+(?:preset|deck|router|delegation)|source\s+deck\s+assembly)\b/i.test(transcript) ||
  /\b(?:screen|page|button|label|ui|text|menu|dropdown)\b[\s\S]{0,90}\b(?:says|shows|reads|contains|labeled|labelled|called|named)\b[\s\S]{0,120}\b(?:live_env\.(?:query_micro_reasoner_presets|draft_micro_reasoner_preset|route_micro_reasoner_prompt)|micro[-\s]?deck|micro[-\s]?reasoner(?:s)?|prompt\s+(?:preset|deck|router|delegation)|source\s+deck\s+assembly)\b/i.test(transcript) ||
  /\b(?:do\s+not|don't|dont|without|not\s+asking\s+to|for\s+now)\b[\s\S]{0,140}\b(?:run|execute|use|query|view|inspect|show|list|check|read|route|delegate|choose|pick|draft|design|recommend|set\s+up|setup)?\b[\s\S]{0,120}\b(?:live_env\.(?:query_micro_reasoner_presets|draft_micro_reasoner_preset|route_micro_reasoner_prompt)|micro[-\s]?deck|micro[-\s]?reasoner(?:s)?|prompt\s+(?:preset|deck|router|delegation)|source\s+deck\s+assembly)\b/i.test(transcript);

export const hasExecutableAskTurnMicroReasonerPresetCue = (transcript: string): boolean =>
  hasAskTurnMicroReasonerPresetCue(transcript) && !hasContextualAskTurnMicroReasonerCue(transcript);

export const hasAskTurnMicroReasonerPromptRouterCue = (transcript: string): boolean =>
  /\blive_env\.route_micro_reasoner_prompt\b/i.test(transcript) ||
  /\b(?:microdeck|micro[-\s]?deck|micro[-\s]?reasoner)\b[\s\S]{0,120}\b(?:prompt\s+router|prompt\s+delegation|delegate|route|choose|pick)\b/i.test(transcript) ||
  /\b(?:prompt\s+router|prompt\s+delegation|candidate\s+prompts?|one\s+of\s+(?:the\s+)?(?:three|3)\s+prompts?)\b[\s\S]{0,160}\b(?:live[-\s]?source|visual\s+summary|source\s+summary|observation|micro[-\s]?reasoner|microdeck|micro[-\s]?deck)\b/i.test(transcript) ||
  /\b(?:route|delegate|choose|pick|select)\b[\s\S]{0,120}\b(?:one\s+of\s+(?:the\s+)?(?:three|3)\s+prompts?|candidate\s+prompts?|which\s+prompt)\b[\s\S]{0,160}\b(?:live[-\s]?source|visual\s+summary|source\s+summary|observation|micro[-\s]?reasoner|microdeck|micro[-\s]?deck)\b/i.test(transcript);

export const hasAskTurnMicroReasonerDraftCue = (transcript: string): boolean =>
  /\blive_env\.draft_micro_reasoner_preset\b/i.test(transcript) ||
  /\b(?:draft|design|recommend|propose|plan|set\s+up|setup|configure|arrange|build)\b[\s\S]{0,160}\b(?:micro[-\s]?reasoner|microdeck|micro[-\s]?deck|prompt\s+(?:preset|deck)|source\s+deck\s+assembly)\b/i.test(transcript) ||
  /\b(?:micro[-\s]?reasoner|microdeck|micro[-\s]?deck|prompt\s+(?:preset|deck)|source\s+deck\s+assembly)\b[\s\S]{0,160}\b(?:draft|design|recommend|propose|plan|set\s+up|setup|configure|arrange|build|closest\s+preset|scenario)\b/i.test(transcript);

export const selectAskTurnMicroReasonerCapability = (transcript: string): HelixLiveEnvironmentToolName =>
  hasAskTurnMicroReasonerDraftCue(transcript)
    ? "live_env.draft_micro_reasoner_preset"
    : hasAskTurnMicroReasonerPromptRouterCue(transcript)
    ? "live_env.route_micro_reasoner_prompt"
    : /\blive_env\.apply_micro_reasoner_preset\b/i.test(transcript) ||
  /\b(?:apply|use|activate|select)\b[\s\S]{0,100}\b(?:microdeck|micro[-\s]?deck|micro[-\s]?reasoner\s+preset)\b/i.test(transcript)
    ? "live_env.apply_micro_reasoner_preset"
    : /\blive_env\.create_micro_reasoner_preset\b/i.test(transcript) ||
      /\b(?:create|save|customi[sz]e|edit)\b[\s\S]{0,100}\b(?:microdeck|micro[-\s]?deck|micro[-\s]?reasoner\s+preset|micro[-\s]?reasoner\s+prompt)\b/i.test(transcript)
      ? "live_env.create_micro_reasoner_preset"
      : /\blive_env\.query_micro_reasoner_prompts\b/i.test(transcript)
        ? "live_env.query_micro_reasoner_prompts"
        : "live_env.query_micro_reasoner_presets";
