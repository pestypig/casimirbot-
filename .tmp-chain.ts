import { __testHelixAskReliabilityGuards } from "./server/routes/agi.plan.ts";
const HELIX_ASK_LABEL_PREFIX_RE = /\b(Definition|Key questions|Notes|Scope)\s*:\s*/gi;
function formatHelixAskAnswer(answer) {
  if (!answer) return answer;
  const lines = answer.split(/\r?\n/);
  const formatted = [];
  let lastWasBlank = true;
  for (const rawLine of lines) {
    let line = rawLine.trimEnd();
    if (line) line = line.replace(HELIX_ASK_LABEL_PREFIX_RE, "");
    if (!line.trim()) {
      if (!lastWasBlank && formatted.length) { formatted.push(""); lastWasBlank = true; }
      continue;
    }
    const trimmedLine = line.trim();
    if (/^paragraph\s+\d+\s*:/i.test(trimmedLine)) continue;
    if (/^(general reasoning|repo evidence|evidence bullets|reasoning bullets)\s*:/i.test(trimmedLine) || /^(details|key files|sources)\s*:?\s*$/i.test(trimmedLine)) continue;
    const isListItem = /^\s*(\d+\.\s+|[-*]\s+)/.test(line);
    if (isListItem && formatted.length && !lastWasBlank) formatted.push("");
    formatted.push(line);
    lastWasBlank = false;
  }
  const normalizedParagraph = (value) => value.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
  let packed = formatted.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!packed) return packed;
  packed = packed.replace(HELIX_ASK_LABEL_PREFIX_RE, "").trim();
  const seen = new Set();
  const deduped = packed.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter((paragraph) => {
    if (!paragraph) return false;
    const key = normalizedParagraph(paragraph);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return deduped.join("\n\n").trim();
}
const raw = `Definition:
- In this codebase, warp bubble is grounded in modules/warp/natario-warp.ts, with primary implementation surfaces in modules/warp/natario-warp.ts and modules/warp/warp-module.ts. [modules/warp/natario-warp.ts]

Why it matters:
- It provides a repo-grounded definition with explicit scope for follow-up mechanism or equation asks. [modules/warp/natario-warp.ts]

Key terms:
- warp
- bubble

Repo anchors:
- modules/warp/natario-warp.ts

Sources: modules/warp/natario-warp.ts, modules/warp/warp-module.ts, server/energy-pipeline.ts, scripts/warp-evidence-pack.ts, shared/warp-promoted-profile.ts, client/src/hooks/useelectronorbitsim.ts, client/src/lib/warp-theta.ts, client/public/warp-engine.js`;
const formatted = formatHelixAskAnswer(raw);
console.log('---formatted---');
console.log(formatted);
console.log('---formatted+strip---');
console.log(__testHelixAskReliabilityGuards.stripDeterministicNoiseArtifacts(formatted));
