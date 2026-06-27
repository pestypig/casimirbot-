type RepoEvidenceEntry = {
  ref?: unknown;
  path?: unknown;
  role?: string;
  excerpt?: unknown;
  why_relevant?: unknown;
};

export type HelixRuntimeRepoEvidenceSynthesisPacket = {
  concept?: unknown;
  user_question?: unknown;
  compact_evidence: RepoEvidenceEntry[];
};

const readRepoEvidenceSynthesisString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const clipDeterministicRepoSynthesisText = (value: unknown, max = 180): string => {
  const text = readRepoEvidenceSynthesisString(value)?.replace(/\s+/g, " ").trim() ?? "";
  return text.length > max ? `${text.slice(0, max - 1).trim()}...` : text;
};

const titleCaseRepoConcept = (value: string): string =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) =>
      part.length <= 3 && part === part.toUpperCase()
        ? part
        : `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`,
    )
    .join(" ");

export const buildDeterministicRepoEvidenceSynthesisText = (
  packet: HelixRuntimeRepoEvidenceSynthesisPacket,
): string | null => {
  const evidence = packet.compact_evidence.filter((entry) =>
    readRepoEvidenceSynthesisString(entry.ref) && readRepoEvidenceSynthesisString(entry.path)
  );
  if (evidence.length === 0) return null;
  const concept =
    readRepoEvidenceSynthesisString(packet.concept) ??
    readRepoEvidenceSynthesisString(packet.user_question)?.replace(/[?.!]+$/g, "").trim() ??
    "repo concept";
  const conceptLabel = titleCaseRepoConcept(concept);
  const roles = Array.from(new Set(evidence.map((entry) => entry.role).filter(Boolean)));
  const paths = Array.from(new Set(evidence.map((entry) => entry.path).filter(Boolean)));
  const roleSentence = roles.length > 0
    ? `The selected evidence covers ${roles.join(", ")} roles.`
    : "The selected evidence covers multiple repo support roles.";
  const representativeEvidence = evidence.slice(0, 3).map((entry) => {
    const excerpt = clipDeterministicRepoSynthesisText(entry.excerpt, 150);
    const reason = clipDeterministicRepoSynthesisText(entry.why_relevant, 120);
    return `${entry.path} (${entry.role})${reason ? ` marks ${reason}` : ""}${excerpt ? ` and shows "${excerpt}"` : ""}`;
  });
  const surfaceText = paths.some((entry) => /client\/src|panel|component|ui/i.test(String(entry)))
    ? "UI or panel evidence shows where the concept is exposed to the operator."
    : "The selected sources identify the user-facing surface or definition path for the concept.";
  const runtimeText = roles.some((role) => /runtime|tool_registry|terminal_authority|test_contract/i.test(role))
    ? "Runtime, tool, terminal-authority, or test evidence shows how the concept is expected to behave inside the Ask turn."
    : "The packet does not prove every runtime boundary, so the answer stays limited to the selected repo evidence.";
  const sourceSentence = evidence
    .slice(0, 6)
    .map((entry) => `${entry.ref} (${entry.role})`)
    .join("; ");
  return [
    `${conceptLabel} is a Helix Ask / Stage Play codebase concept described by the current repo evidence, not by a free-standing model guess.`,
    `${roleSentence} ${surfaceText} ${runtimeText}`,
    representativeEvidence.length > 0
      ? `In this packet, ${representativeEvidence.join("; ")}.`
      : "",
    "The authority boundary remains intact: these source refs are support for synthesis, while terminal authority still decides what can be shown.",
    `Sources: ${sourceSentence}.`,
  ].filter(Boolean).join("\n\n");
};
