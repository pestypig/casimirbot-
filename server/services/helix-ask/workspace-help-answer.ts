export const buildAskTurnWorkspaceHelpAnswer = (): string =>
  [
    "I can help you work across the Helix workspace:",
    "- Open or find the latest docs and papers by topic.",
    "- Locate source paths, line spans, snippets, tables, fields, and named anchors inside docs.",
    "- Summarize the current document and explain what specific sections mean.",
    "- Create or update workstation notes with summaries, source paths, and located evidence.",
    "- Compare docs against notes and call out what is captured, missing, or unsupported.",
    "- Answer background-only questions without using workspace lookup when you ask for that scope.",
    "- Ask for clarification when a document, note, or target is ambiguous.",
  ].join("\n");
