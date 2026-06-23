import { normalizeSlotId } from "../obligations";

export const normalizeHelixAskObjectiveLabelKey = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const HELIX_ASK_OBJECTIVE_INFERENCE_GENERIC_SLOT_DENYLIST = new Set([
  "difference",
  "differences",
  "between",
  "compare",
  "comparison",
  "versus",
  "tradeoff",
  "tradeoffs",
  "solves",
  "solve",
  "option",
  "options",
  "choice",
  "choose",
  "risks",
  "risk",
]);

export const inferHelixAskObjectiveSlotHitsFromEvidence = (
  requiredSlots: string[],
  objectiveLabel: string,
  evidenceRefs: string[],
): string[] => {
  if (requiredSlots.length === 0 || evidenceRefs.length === 0) return [];
  const evidenceCorpus = evidenceRefs.join("\n").toLowerCase();
  const inferred: string[] = [];
  const hasPathSignal = evidenceRefs.some((entry) => /[a-z0-9_./-]+\.[a-z0-9]+/i.test(entry));
  const maybeAdd = (slot: string, test: boolean): void => {
    if (!test) return;
    if (!requiredSlots.includes(slot)) return;
    if (inferred.includes(slot)) return;
    inferred.push(slot);
  };
  for (const slot of requiredSlots) {
    const slotKey = normalizeSlotId(slot);
    if (!slotKey) continue;
    switch (slotKey) {
      case "voice-lane":
        maybeAdd(slot, /(voice|audio|tts|stt|speaker|microphone|mic|callout)/i.test(evidenceCorpus));
        break;
      case "transcription-translation":
        maybeAdd(
          slot,
          /(transcrib|translation|translate|multilang|whisper|language)/i.test(evidenceCorpus),
        );
        break;
      case "mechanism":
        maybeAdd(
          slot,
          /(mechanism|pipeline|flow|controller|scheduler|phase|how\b)/i.test(evidenceCorpus),
        );
        break;
      case "retrieval-reasoning":
      case "retrieval_reasoning":
        maybeAdd(
          slot,
          hasPathSignal &&
            /(retriev|query|evidence|source|trace|reasoning|ladder|context)/i.test(evidenceCorpus),
        );
        break;
      case "relate":
      case "relation":
        maybeAdd(slot, /(relat|bridge|connect|link)/i.test(evidenceCorpus));
        break;
      case "uncertainty":
        maybeAdd(
          slot,
          /(uncertain|unknown|hypothesis|exploratory|not yet|maturity)/i.test(evidenceCorpus),
        );
        break;
      case "evidence":
        maybeAdd(slot, hasPathSignal || /(evidence|artifact|source)/i.test(evidenceCorpus));
        break;
      case "repo-mapping":
      case "code-path":
      case "implementation-touchpoints":
        maybeAdd(slot, hasPathSignal);
        break;
      case "definition":
        maybeAdd(slot, /(definition|meaning|\bdocs\/|\.md\b|glossary|overview)/i.test(evidenceCorpus));
        break;
      default:
        maybeAdd(
          slot,
          !HELIX_ASK_OBJECTIVE_INFERENCE_GENERIC_SLOT_DENYLIST.has(slotKey) &&
            evidenceCorpus.includes(slotKey.replace(/-/g, " ")),
        );
        break;
    }
  }
  return inferred;
};
