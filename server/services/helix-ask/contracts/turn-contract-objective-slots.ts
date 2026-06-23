import { normalizeSlotId } from "../obligations";
import type { HelixAskEvidencePackObligationCoverage } from "../obligation-coverage";

export const inferHelixAskObjectiveSlotsFromObligationCoverage = (
  obligationCoverage: HelixAskEvidencePackObligationCoverage[],
): string[] => {
  if (!obligationCoverage.length) return [];
  const inferred = new Set<string>();
  const normalizedRefs = obligationCoverage
    .flatMap((coverage) => [...coverage.evidence_refs, ...coverage.doc_refs, ...coverage.code_refs])
    .map((ref) => ref.replace(/\\/g, "/").trim().toLowerCase())
    .filter(Boolean);
  if (normalizedRefs.length > 0) {
    inferred.add("repo-mapping");
  }
  if (obligationCoverage.some((coverage) => coverage.code_refs.length > 0)) {
    inferred.add("implementation-touchpoints");
    inferred.add("code-path");
  }
  if (obligationCoverage.some((coverage) => coverage.kind === "roadmap")) {
    inferred.add("next-steps");
  }
  if (normalizedRefs.some((ref) => /(\/|^)(voice|audio|tts|speaker|mic|callout|stt)(\/|\.|$)/i.test(ref))) {
    inferred.add("voice-lane");
  }
  if (
    normalizedRefs.some((ref) =>
      /(translation|translate|transcript|transcrib|multilang|language|interpreter|whisper)/i.test(ref),
    )
  ) {
    inferred.add("transcription-translation");
  }
  if (normalizedRefs.some((ref) => ref.endsWith(".md") || ref.includes("/docs/") || ref.includes("/knowledge/"))) {
    inferred.add("definition");
  }
  return Array.from(inferred).map((slot) => normalizeSlotId(slot)).filter(Boolean);
};
