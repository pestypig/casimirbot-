import type {
  HelixAskEnvelopeMode,
  HelixAskEnvelopeSection,
  HelixAskProofEnvelope,
  HelixAskResponseEnvelope,
} from "@shared/helix-ask-envelope";
import type { FalsifiabilityTier } from "./intent-directory";
import type { HelixAskFormat } from "./format";
import { extractFilePathsFromText } from "./paths";

type HelixAskEnvelopeBuildInput = {
  answer: string;
  format: HelixAskFormat;
  tier: FalsifiabilityTier;
  secondaryTier?: FalsifiabilityTier;
  mode: HelixAskEnvelopeMode;
  evidenceText?: string;
  traceId?: string;
};

const isProofRef = (value: string) =>
  value.startsWith("gate:") || value.startsWith("certificate:");
const PROOF_LINE =
  /^(gate:|status:|residuals:|constraints:|violations:|certificate:|integrity_ok:|source:)/i;

const ensureUnique = (values: string[]): string[] => {
  const seen = new Set<string>();
  return values.filter((value) => {
    if (!value) return false;
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

const splitParagraphs = (value: string): string[] =>
  value
    .split(/\n{2,}/)
    .map((entry) => entry.trim())
    .filter(Boolean);

const splitAnswerForEnvelope = (
  text: string,
  format: HelixAskFormat,
): { summary: string; details?: string } => {
  const trimmed = text.trim();
  if (!trimmed) return { summary: "" };
  if (format === "steps") return { summary: trimmed };
  const paragraphs = splitParagraphs(trimmed);
  const maxSummaryParagraphs = format === "compare" ? 2 : 1;
  if (paragraphs.length <= 1) {
    if (trimmed.length <= 420) return { summary: trimmed };
    const sentences = trimmed.match(/[^.!?]+[.!?]+(?:\s+|$)/g);
    if (!sentences || sentences.length <= 2) return { summary: trimmed };
    const summary = sentences.slice(0, 2).join("").trim();
    const rest = sentences.slice(2).join("").trim();
    return rest ? { summary, details: rest } : { summary };
  }
  if (paragraphs.length <= maxSummaryParagraphs) {
    return { summary: paragraphs.join("\n\n").trim() };
  }
  const summary = paragraphs.slice(0, maxSummaryParagraphs).join("\n\n").trim();
  const rest = paragraphs.slice(maxSummaryParagraphs).join("\n\n").trim();
  return rest ? { summary, details: rest } : { summary };
};

const parseGateEvidence = (evidenceText: string): HelixAskProofEnvelope["gate"] | undefined => {
  if (!evidenceText.trim()) return undefined;
  const gate: HelixAskProofEnvelope["gate"] = {};
  const lines = evidenceText.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("gate:")) gate.name = trimmed.replace("gate:", "").trim();
    if (trimmed.startsWith("status:")) gate.status = trimmed.replace("status:", "").trim();
    if (trimmed.startsWith("residuals:")) gate.residuals = trimmed.replace("residuals:", "").trim();
    if (trimmed.startsWith("constraints:")) gate.constraints = trimmed.replace("constraints:", "").trim();
    if (trimmed.startsWith("certificate:")) gate.certificate = trimmed.replace("certificate:", "").trim();
    if (trimmed.startsWith("integrity_ok:")) {
      const raw = trimmed.replace("integrity_ok:", "").trim().toLowerCase();
      gate.integrity_ok = raw === "true";
    }
    if (trimmed.startsWith("source:")) gate.source = trimmed.replace("source:", "").trim();
  }
  return Object.keys(gate).length ? gate : undefined;
};

const extractProofText = (evidenceText?: string): string | null => {
  if (!evidenceText?.trim()) return null;
  const lines = evidenceText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const proofLines = lines.filter((line) => PROOF_LINE.test(line));
  if (!proofLines.length) return null;
  return proofLines.join("\n");
};

const buildDetailSections = (
  details: string | undefined,
  tier: FalsifiabilityTier,
  mode: HelixAskEnvelopeMode,
): HelixAskEnvelopeSection[] => {
  if (!details) return [];
  const paragraphs = splitParagraphs(details);
  if (!paragraphs.length) return [];
  const sections: HelixAskEnvelopeSection[] = [];
  const defaultOpen = mode === "extended";
  for (let index = 0; index < paragraphs.length; index += 1) {
    const body = paragraphs[index];
    let title = "Details";
    if (/^in practice\b/i.test(body)) {
      title = "In practice";
    } else if (tier === "F3" && index === 0) {
      title = "Data flow";
    }
    const citations = ensureUnique(extractFilePathsFromText(body)).filter(
      (value) => !isProofRef(value),
    );
    sections.push({
      title,
      body,
      citations: citations.length ? citations : undefined,
      layer: "details",
      defaultOpen,
    });
  }
  return sections;
};

const buildKeyFilesSection = (
  answer: string,
  details: string | undefined,
  evidenceText?: string,
): HelixAskEnvelopeSection | null => {
  const evidenceRefs = evidenceText
    ? ensureUnique(extractFilePathsFromText(evidenceText)).filter((value) => !isProofRef(value))
    : [];
  const refsSource = evidenceRefs.length
    ? evidenceRefs
    : ensureUnique(extractFilePathsFromText(`${answer}\n${details ?? ""}`)).filter(
        (value) => !isProofRef(value),
      );
  const refs = refsSource;
  if (!refs.length) return null;
  const body = refs.map((ref) => `- ${ref}`).join("\n");
  return {
    title: "Key files",
    body,
    citations: refs,
    layer: "proof",
  };
};

const buildProofSection = (
  proofText: string | null | undefined,
  mode: HelixAskEnvelopeMode,
): HelixAskEnvelopeSection | null => {
  if (!proofText?.trim()) return null;
  const citations = ensureUnique(extractFilePathsFromText(proofText));
  if (!citations.length) return null;
  return {
    title: "Proof",
    body: proofText.trim(),
    citations,
    layer: "proof",
    defaultOpen: mode === "extended",
  };
};

export const buildHelixAskEnvelope = (
  input: HelixAskEnvelopeBuildInput,
): HelixAskResponseEnvelope => {
  const summarySplit = splitAnswerForEnvelope(input.answer, input.format);
  const summary = summarySplit.summary.trim();
  const details = summarySplit.details?.trim();
  const sections: HelixAskEnvelopeSection[] = [];
  sections.push(...buildDetailSections(details, input.tier, input.mode));

  if (input.tier !== "F0") {
    const keyFiles = buildKeyFilesSection(input.answer, details, input.evidenceText);
    if (keyFiles) sections.push(keyFiles);
  }

  const proofText = extractProofText(input.evidenceText);
  const canShowProof = input.tier === "F3" || input.secondaryTier === "F3";
  const proofSection = buildProofSection(proofText, input.mode);
  if (proofSection && canShowProof) {
    sections.push(proofSection);
  }

  const proof: HelixAskProofEnvelope | undefined =
    canShowProof && proofText
      ? {
          gate: parseGateEvidence(proofText),
          evidence: ensureUnique(extractFilePathsFromText(proofText)).map((path) => ({
            path,
          })),
          trace_ids: input.traceId ? [input.traceId] : undefined,
        }
      : undefined;

  return {
    mode: input.mode,
    tier: input.tier,
    secondaryTier: input.secondaryTier,
    answer: summary || input.answer.trim(),
    sections: sections.length ? sections : undefined,
    proof,
  };
};

export type { HelixAskEnvelopeBuildInput };
