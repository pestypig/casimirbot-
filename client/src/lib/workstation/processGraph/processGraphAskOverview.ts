import type { ProcessGraphContextPack } from "./buildProcessGraphContextPack";

const OVERVIEW_PROMPT_PATTERN =
  /\b(?:what(?:'s| is)\s+(?:happening|going on)|what\s+are\s+you\s+doing|what\s+tools\s+are\s+active|current\s+workspace|active\s+(?:jobs?|tools?|panels?|pipeline)|why\s+did\s+that\s+fail|what\s+changed|latest\s+(?:artifact|result|job))\b/i;

const PROCEDURE_MEMORY_PROMPT_PATTERN =
  /\b(?:last\s+(?:situation\s+)?epoch|situation\s+epoch|procedure\s+epoch|what\s+changed\s+in\s+the\s+last\s+(?:situation\s+)?epoch|show\s+(?:the\s+)?evidence|why\s+did\s+you\s+say|replay\s+(?:that|the\s+last)|visual\s+capture|live\s+source|current\s+screen|screen\s+capture|what\s+(?:am\s+i|are\s+we)\s+looking\s+at|(?:what\s+changed|describe\s+what\s+changed|compare\b.*)\s+since\s+(?:the\s+)?(?:last|previous)\s+(?:scene|frame|visual|screen)|(?:last|previous)\s+(?:scene|frame|visual)|scene\s+change|frame\s+change)\b/i;

export function shouldUseProcessGraphContextPack(prompt: string): boolean {
  const trimmed = prompt.trim();
  return OVERVIEW_PROMPT_PATTERN.test(trimmed) && !PROCEDURE_MEMORY_PROMPT_PATTERN.test(trimmed);
}

function formatList(
  items: Array<{ label: string; status?: string; kind?: string; panelId?: string }>,
  empty: string,
  max = 5,
): string {
  if (items.length === 0) return empty;
  return items
    .slice(0, max)
    .map((item) => {
      const details = [item.kind, item.status, item.panelId].filter(Boolean).join(", ");
      return details ? `${item.label} (${details})` : item.label;
    })
    .join("; ");
}

export function buildProcessGraphOverviewText(pack: ProcessGraphContextPack): string {
  const active = formatList(pack.active, "No active panels, tools, jobs, or failed items are currently visible.");
  const artifacts = formatList(
    pack.recentArtifacts.map((artifact) => ({
      label: artifact.label,
      status: artifact.status,
      kind: artifact.artifactKind,
    })),
    "No recent artifacts are visible.",
  );
  const timeline = formatList(pack.recentTimeline, "No recent graph timeline events are visible.", 4);
  const warnings = pack.warnings.length > 0 ? pack.warnings.join("; ") : "No failed, stale, or pending items are visible.";

  return [
    "Here is the current workstation overview from the process graph.",
    `Active state: ${active}`,
    `Recent artifacts: ${artifacts}`,
    `Recent timeline: ${timeline}`,
    `Warnings: ${warnings}`,
    "Note: this graph is observational and may be incomplete or stale. Receipts and artifacts remain the proof of completed actions.",
  ].join("\n");
}
