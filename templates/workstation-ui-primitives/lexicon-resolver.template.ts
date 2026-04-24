// lexicon-resolver.template.ts

function parseWorkstationLexiconAction(source: string, conversationalCandidate: string): HelixWorkstationAction | null {
  const normalized = source.toLowerCase();

  // Positive deterministic mapping
  const match = conversationalCandidate.match(/\b<verb>\s+<object>\s+(.+)$/i);
  if (match) {
    const value = match[1]?.replace(/[?.!]+$/g, "").trim();
    if (value) {
      return {
        action: "run_panel_action",
        panel_id: "<panel_id>",
        action_id: "<action_id>",
        args: { <arg_key>: value },
      };
    }
  }

  // Non-mutating deterministic route
  if (/\b(list|show)\s+<object>\b/i.test(normalized)) {
    return {
      action: "run_panel_action",
      panel_id: "<panel_id>",
      action_id: "<list_action_id>",
      args: undefined,
    };
  }

  // Ambiguous phrasing returns null so fallback can handle it.
  return null;
}
