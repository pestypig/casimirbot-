import type { PromptResearchContract } from "./prompt-research-contract";
import {
  buildPromptResearchSectionalComposeRepair,
  type PromptResearchGenerationContract,
  type PromptResearchSectionalComposeObligationEvidence,
  type PromptResearchSectionalComposePlanSection,
} from "./generation-contract";

export type PromptResearchContractAnswerValidation = {
  ok: boolean;
  fail_reasons: string[];
  missing_verbatim_constraints: string[];
  missing_required_sections: string[];
  missing_support_sections: string[];
  missing_provenance_columns: string[];
  placeholder_hits: string[];
};

export type PromptResearchContractAnswerRepairResult = {
  text: string;
  applied: boolean;
  actions: string[];
  validation_before: PromptResearchContractAnswerValidation;
  validation_after: PromptResearchContractAnswerValidation;
};

const PLACEHOLDER_LINE_RE = /^\s*-\s*(?:plan\s+for\b|notes:\s+see\b)/gim;
const TABLE_SEPARATOR_RE = /^\s*\|?(?:\s*:?-+:?\s*\|)+\s*$/;

const normalizeWhitespace = (value: string): string =>
  String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .trim();

const unique = (values: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const normalized = normalizeWhitespace(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
};

const escapeRegExp = (value: string): string =>
  String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeColumnKey = (value: string): string =>
  normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/\s+/g, " ");

const headingPresent = (text: string, title: string): boolean => {
  const normalizedTitle = normalizeWhitespace(title);
  if (!normalizedTitle) return false;
  const escaped = escapeRegExp(normalizedTitle);
  return new RegExp(`(?:^|\\n)\\s*(?:#{1,6}\\s*)?${escaped}\\s*:`, "im").test(text);
};

const collectTableHeaders = (text: string): string[][] => {
  const lines = String(text ?? "").split(/\r?\n/);
  const headers: string[][] = [];
  for (let index = 0; index < lines.length - 1; index += 1) {
    const header = lines[index]?.trim() ?? "";
    const separator = lines[index + 1]?.trim() ?? "";
    if (!header.includes("|") || !TABLE_SEPARATOR_RE.test(separator)) continue;
    const columns = header
      .split("|")
      .map((entry) => normalizeWhitespace(entry))
      .filter(Boolean);
    if (columns.length > 0) headers.push(columns);
  }
  return headers;
};

const hasTableSchema = (text: string, schema: string[]): boolean => {
  if (schema.length === 0) return true;
  const required = new Set(schema.map(normalizeColumnKey).filter(Boolean));
  if (required.size === 0) return true;
  return collectTableHeaders(text).some((header) => {
    const present = new Set(header.map(normalizeColumnKey).filter(Boolean));
    for (const column of required) {
      if (!present.has(column)) return false;
    }
    return true;
  });
};

const insertAfterHeading = (text: string, title: string, block: string): string => {
  const normalizedTitle = normalizeWhitespace(title);
  const normalizedBlock = normalizeWhitespace(block);
  if (!normalizedTitle || !normalizedBlock) return normalizeWhitespace(text);
  const escaped = escapeRegExp(normalizedTitle);
  const pattern = new RegExp(
    `((?:^|\\n)\\s*(?:#{1,6}\\s*)?${escaped}\\s*:\\s*(?:\\n|$))`,
    "i",
  );
  if (!pattern.test(text)) {
    return normalizeWhitespace(`${normalizedBlock}\n\n${text}`);
  }
  return normalizeWhitespace(text.replace(pattern, `$1\n${normalizedBlock}\n\n`));
};

export const buildPromptResearchContractProvenanceTableBlock = (args: {
  schema: string[];
  unknownMarker?: string | null;
}): string => {
  const schema = unique(args.schema);
  if (schema.length === 0) return "";
  const unknownMarker = normalizeWhitespace(args.unknownMarker ?? "") || "UNKNOWN";
  const header = `| ${schema.join(" | ")} |`;
  const separator = `| ${schema.map(() => "---").join(" | ")} |`;
  const row = `| ${schema.map(() => unknownMarker).join(" | ")} |`;
  return [header, separator, row].join("\n");
};

export const validatePromptResearchContractAnswer = (
  contract: PromptResearchContract | null | undefined,
  text: string,
): PromptResearchContractAnswerValidation => {
  if (!contract || contract.mode !== "research_contract") {
    return {
      ok: true,
      fail_reasons: [],
      missing_verbatim_constraints: [],
      missing_required_sections: [],
      missing_support_sections: [],
      missing_provenance_columns: [],
      placeholder_hits: [],
    };
  }
  const rendered = String(text ?? "");
  const missingVerbatimConstraints = unique(contract.verbatim_constraints).filter(
    (entry) => !rendered.includes(entry),
  );
  const missingRequiredSections = unique(
    contract.required_top_level_structure
      .map((section) => section.title)
      .filter(Boolean),
  ).filter((title) => !headingPresent(rendered, title));
  const supportSections: string[] = [];
  if (contract.appendix_requirements.length > 0) supportSections.push("Derivation Appendix");
  if (contract.claim_discipline.length > 0) supportSections.push("Claim Discipline");
  if (contract.self_check.length > 0) supportSections.push("Self-Check");
  if (contract.provenance_table_schema.length > 0) supportSections.push("Provenance Table");
  const missingSupportSections = unique(supportSections).filter(
    (title) =>
      title !== "Provenance Table" &&
      !headingPresent(rendered, title),
  );
  const missingProvenanceColumns = hasTableSchema(rendered, contract.provenance_table_schema)
    ? []
    : unique(contract.provenance_table_schema);
  const placeholderHits = Array.from(rendered.matchAll(PLACEHOLDER_LINE_RE)).map((match) =>
    normalizeWhitespace(match[0] ?? ""),
  );

  const failReasons = [
    missingVerbatimConstraints.length > 0 ? "research_contract_verbatim_missing" : null,
    missingRequiredSections.length > 0 ? "research_contract_required_sections_missing" : null,
    missingSupportSections.length > 0 ? "research_contract_support_sections_missing" : null,
    missingProvenanceColumns.length > 0 ? "research_contract_provenance_schema_missing" : null,
    placeholderHits.length > 0 ? "research_contract_placeholder_section" : null,
  ].filter(Boolean) as string[];

  return {
    ok: failReasons.length === 0,
    fail_reasons: failReasons,
    missing_verbatim_constraints: missingVerbatimConstraints,
    missing_required_sections: missingRequiredSections,
    missing_support_sections: missingSupportSections,
    missing_provenance_columns: missingProvenanceColumns,
    placeholder_hits: unique(placeholderHits),
  };
};

export const repairPromptResearchContractAnswer = (args: {
  contract: PromptResearchContract | null | undefined;
  text: string;
  generationContract?: PromptResearchGenerationContract | null;
  planSections?: PromptResearchSectionalComposePlanSection[];
  obligationEvidence?: PromptResearchSectionalComposeObligationEvidence[];
}): PromptResearchContractAnswerRepairResult => {
  const contract = args.contract;
  const originalText = normalizeWhitespace(args.text);
  const before = validatePromptResearchContractAnswer(contract, originalText);
  if (!contract || contract.mode !== "research_contract" || !originalText) {
    return {
      text: originalText,
      applied: false,
      actions: [],
      validation_before: before,
      validation_after: before,
    };
  }

  let nextText = originalText;
  const actions: string[] = [];

  if (before.missing_verbatim_constraints.length > 0) {
    const boundaryTitle =
      contract.required_top_level_structure.find((section) =>
        /\bboundary\b/i.test(section.title),
      )?.title ??
      contract.required_top_level_structure.find((section) =>
        /\bmotivation\b/i.test(section.title),
      )?.title ??
      contract.required_top_level_structure[0]?.title ??
      null;
    const block = before.missing_verbatim_constraints.join("\n");
    nextText = boundaryTitle
      ? insertAfterHeading(nextText, boundaryTitle, block)
      : normalizeWhitespace(`${block}\n\n${nextText}`);
    actions.push("insert_verbatim_constraints");
  }

  const sectionalComposeRepair = buildPromptResearchSectionalComposeRepair({
    contract,
    text: nextText,
    generationContract: args.generationContract,
    planSections: args.planSections,
    obligationEvidence: args.obligationEvidence,
  });
  if (sectionalComposeRepair.used && sectionalComposeRepair.text !== nextText) {
    nextText = sectionalComposeRepair.text;
    actions.push("append_sectional_compose_sections");
  }

  if (before.missing_provenance_columns.length > 0) {
    const tableBlock = buildPromptResearchContractProvenanceTableBlock({
      schema: contract.provenance_table_schema,
      unknownMarker: contract.fail_closed_behavior.unknown_marker,
    });
    if (tableBlock) {
      if (headingPresent(nextText, "Provenance Table")) {
        nextText = insertAfterHeading(nextText, "Provenance Table", tableBlock);
      } else {
        nextText = normalizeWhitespace(`${nextText}\n\nProvenance Table:\n${tableBlock}`);
      }
      actions.push("append_provenance_table");
    }
  }

  const after = validatePromptResearchContractAnswer(contract, nextText);
  return {
    text: nextText,
    applied: actions.length > 0 && nextText !== originalText,
    actions,
    validation_before: before,
    validation_after: after,
  };
};
