export type HelixAskCapabilityCatalogSummaryObservation = {
  active_dynamic_tool_count: number;
  information_reflection: string[];
  utility: string[];
  explicit_reflection_families: string[];
  explicit_utility_families: string[];
};

export type HelixAskCapabilityCatalogSummaryWorkspaceSnapshot = {
  activeDocPath?: unknown;
} | null;

export type HelixAskCapabilityCatalogSummaryDependencies = {
  normalizeDocPath: (value: unknown) => string | null;
  resolveWorkspaceNoteTitle: (workspaceSnapshot?: HelixAskCapabilityCatalogSummaryWorkspaceSnapshot) => string | null;
  buildCapabilityCatalogObservation: () => HelixAskCapabilityCatalogSummaryObservation;
  workstationToolAlignmentCapability: string;
  liveSyntheticDataReflectionCapability: string;
};

export const createAskTurnCapabilityHelpSummaryBuilder = (
  deps: HelixAskCapabilityCatalogSummaryDependencies,
) => (workspaceSnapshot?: HelixAskCapabilityCatalogSummaryWorkspaceSnapshot): string => {
  const activeDoc = deps.normalizeDocPath(workspaceSnapshot?.activeDocPath);
  const activeNote = deps.resolveWorkspaceNoteTitle(workspaceSnapshot);
  const catalog = deps.buildCapabilityCatalogObservation();
  return [
    "Helix Ask can help you work across the workstation with two kinds of tools:",
    `- Information reflection: inspect or synthesize evidence from docs, repo/code, internet and scholarly sources, calculator traces, live-source mail, image lens regions, process graph snapshots, Zen/civilization context, and workspace OS status. Active examples include ${catalog.information_reflection.slice(0, 6).join("; ")}.`,
    `- Utility: change workstation state through panel navigation, notes, clipboard, calculator live-source controls, live-source decisions, voice callout receipts, and restore-view actions. Active examples include ${catalog.utility.slice(0, 6).join("; ")}.`,
    `- Alignment reflection: ${deps.workstationToolAlignmentCapability} maps workstation panels and dynamic actions to tool families, reflection/utility status, admission rules, regression prompts, test coverage, and active/retired state.`,
    `- Live synthetic data reflection: ${deps.liveSyntheticDataReflectionCapability} describes how MicroDeck/MacroDeck-style summaries, processed mail, predictions, narratives, and interpretation state can be parsed over the retained mailbox/frame window.`,
    "- Reasoning: compare reflected evidence, synthesize findings, and answer from the completed solver path rather than from raw receipts.",
    `- Current catalog: ${catalog.active_dynamic_tool_count} active dynamic workstation actions, plus explicit Ask families for ${catalog.explicit_reflection_families.join(", ")} and ${catalog.explicit_utility_families.join(", ")}.`,
    "- Legacy/retired: Situation Room pipeline/source dynamic actions, including Dottie observer and Dottie voice-delivery entries, are not the normal active dynamic tool surface. Dottie should be treated as preset/context; voice goes through the voice-lane callout contract.",
    activeDoc ? `Current doc context: ${activeDoc}` : "Current doc context: no active document is attached.",
    activeNote ? `Current note context: ${activeNote}` : "Current note context: no active note is attached.",
  ].join("\n");
};
