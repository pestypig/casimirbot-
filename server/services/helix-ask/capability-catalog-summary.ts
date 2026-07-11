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
) => (
  workspaceSnapshot?: HelixAskCapabilityCatalogSummaryWorkspaceSnapshot,
  question?: string,
): string => {
  const activeDoc = deps.normalizeDocPath(workspaceSnapshot?.activeDocPath);
  const activeNote = deps.resolveWorkspaceNoteTitle(workspaceSnapshot);
  const catalog = deps.buildCapabilityCatalogObservation();
  const asksAboutScholarlyImageLensWorkflow = Boolean(
    question &&
    /\b(?:research\s+papers?|scholarly|full[-\s]?text)\b/i.test(question) &&
    /\b(?:parse|open|openable|image\s+lens|pick|select|choose|check)\b/i.test(question),
  );
  if (asksAboutScholarlyImageLensWorkflow) {
    return [
      "The research-paper workflow first searches and ranks candidate papers by the requested topic and available metadata; it does not assume every candidate is parseable.",
      "- scholarly-research.lookup_papers discovers candidates. scholarly-research.fetch_full_text then checks whether a candidate has usable, machine-readable full text or another openable source.",
      "- If text extraction is usable, Helix reasons from that text. If an available PDF page contains needed scanned text, equations, figures, or tables that text extraction cannot represent reliably, it can escalate the relevant page or region to Image Lens.",
      "- A paper that cannot be opened or parsed remains an exploratory/recovery candidate and should not become answer evidence. extract_numeric_parameters can run only after usable scholarly evidence has been materialized.",
      "So the practical order is: choose relevant candidates, verify access and parseability during full-text retrieval, then use Image Lens selectively when visual page evidence is necessary.",
    ].join("\n");
  }
  return [
    "Helix Ask can help you work across the workstation with two kinds of tools:",
    `- Information reflection: inspect or synthesize evidence from docs, repo/code, internet and scholarly sources, calculator traces, live-source mail, image lens regions, process graph snapshots, Moral/civilization context, and workspace OS status. Active examples include ${catalog.information_reflection.slice(0, 6).join("; ")}.`,
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
