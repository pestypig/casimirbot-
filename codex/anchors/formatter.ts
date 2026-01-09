import { AnchoredAnswer } from "./types";

export function formatAnchoredAnswer(answer: AnchoredAnswer): string {
  const lines: string[] = [];

  lines.push(answer.answer.trim());

  if (answer.architectureAnchors?.length) {
    lines.push("");
    lines.push("Architecture anchors");
    for (const anchor of answer.architectureAnchors) {
      lines.push(`- ${anchor.path}: ${anchor.why}`);
    }
  }

  if (answer.ideologyAnchors?.length) {
    lines.push("");
    lines.push("Ideology anchors (docs/ethos/ideology.json)");
    for (const anchor of answer.ideologyAnchors) {
      lines.push(`- ${anchor.nodeId}: ${anchor.why}`);
    }
  }

  if (answer.assumptions?.length) {
    lines.push("");
    lines.push(`Assumptions: ${answer.assumptions.join(" ")}`);
  }

  if (answer.clarifier) {
    lines.push("");
    lines.push(`Clarifier: ${answer.clarifier}`);
  }

  return lines.join("\n");
}
