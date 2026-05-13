export function isCompanionPolicyIntent(prompt: string): boolean {
  const normalized = prompt.trim().toLowerCase();
  if (!normalized) return false;
  return (
    /\bkeep\s+me\s+company\b/.test(normalized) ||
    /\b(?:dottie|cortana)\s+mode\b/.test(normalized) ||
    /\b(?:enable|turn\s+on|start|set)\b.*\b(?:active\s+)?companion\b/.test(normalized) ||
    /\b(?:mic|microphone|voice)\b.*\b(?:conversation|companion|direct\s+address)\s+mode\b/.test(normalized)
  );
}

export function buildCompanionPolicyArgs(input: {
  prompt: string;
  threadId?: string | null;
}): Record<string, unknown> {
  const normalized = input.prompt.trim().toLowerCase();
  const companionMode =
    /\b(?:off|disable|stop)\b.*\bcompanion\b/.test(normalized)
      ? "off"
      : /\bcritical\s+voice\b/.test(normalized)
        ? "critical_voice"
        : /\b(?:direct\s+address|only\s+when\s+i\s+ask)\b/.test(normalized)
          ? "direct_address_only"
          : /\bdebug\b/.test(normalized)
            ? "debug_trace"
            : "active_companion";
  return {
    thread_id: input.threadId ?? "helix-ask:desktop",
    voice_input_active: !/\bmic\s+off|microphone\s+off|voice\s+input\s+off\b/.test(normalized),
    voice_output_enabled: /\b(?:voice\s+output|speak|talk\s+out\s+loud|critical\s+voice)\b/.test(normalized),
    companion_mode: companionMode,
    commentary_mode: /\b(?:debug|trace)\b/.test(normalized)
      ? "continuous_debug"
      : /\b(?:talk|dialogue|keep\s+me\s+company)\b/.test(normalized)
        ? "active_dialogue"
        : "anomalies_and_milestones",
    direct_address_names: /\bdottie\b/.test(normalized) ? ["dottie", "helix"] : ["helix", "dottie"],
  };
}
