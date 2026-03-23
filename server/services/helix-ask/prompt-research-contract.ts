import * as fs from "node:fs";
import * as path from "node:path";
import { extractFilePathsFromText } from "./paths";
import {
  buildPromptResearchRetrievalContract as buildPromptResearchRetrievalContractBase,
  type RetrievalContract as PromptResearchRetrievalContract,
} from "./retrieval-contract";

export type PromptResearchContractMode = "default" | "research_contract";
export type PromptResearchContractExpansionRule = "none" | "anchor_expansion" | "open";

export type PromptResearchContractStructureSection = {
  title: string;
  must_cover: string[];
};

export type PromptResearchContractOutputStyle = {
  main_body_expectations: string[];
  appendix_expectations: string[];
  minimal_heading_overhead: boolean;
  continuous_prose: boolean;
  equation_dense: boolean;
};

export type PromptResearchContractFailClosedBehavior = {
  enabled: boolean;
  missing_required_inputs_stop: boolean;
  unknown_marker: string;
  stop_reason: string;
};

export type PromptResearchContract = {
  mode: PromptResearchContractMode;
  raw_prompt: string;
  purpose: string | null;
  hard_constraints: string[];
  verbatim_constraints: string[];
  canonical_precedence: string[];
  canonical_precedence_paths: string[];
  required_repo_inputs: string[];
  allowed_extra_retrieval_rule: PromptResearchContractExpansionRule;
  output_style: PromptResearchContractOutputStyle;
  required_top_level_structure: PromptResearchContractStructureSection[];
  appendix_requirements: string[];
  provenance_table_schema: string[];
  claim_discipline: string[];
  fail_closed_behavior: PromptResearchContractFailClosedBehavior;
  self_check: string[];
  section_titles: string[];
  detection_signals: string[];
};

type MarkdownSection = {
  title: string;
  body: string;
};

const HEADING_RE = /^(#{2,6})\s+(.+?)\s*$/;
const LIST_ITEM_RE = /^\s*(?:[-*]|\d+[.)])\s+(.*\S)\s*$/;
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
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
};

const normalizeSectionTitle = (value: string): string =>
  normalizeWhitespace(value)
    .replace(/^\d+(?:\.\d+)*[.)]?\s+/, "")
    .replace(/^[-*]\s+/, "")
    .trim();

const stripMatchingQuotes = (value: string): string => {
  const trimmed = normalizeWhitespace(value);
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith("“") && trimmed.endsWith("”"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const splitMarkdownSections = (input: string, level: number): MarkdownSection[] => {
  const lines = normalizeWhitespace(input).split("\n");
  const sections: MarkdownSection[] = [];
  let currentTitle: string | null = null;
  let currentBody: string[] = [];
  for (const line of lines) {
    const match = line.match(HEADING_RE);
    if (match && match[1]?.length === level) {
      if (currentTitle) {
        sections.push({
          title: currentTitle,
          body: currentBody.join("\n").trim(),
        });
      }
      currentTitle = normalizeSectionTitle(match[2] ?? "");
      currentBody = [];
      continue;
    }
    if (currentTitle) {
      currentBody.push(line);
    }
  }
  if (currentTitle) {
    sections.push({
      title: currentTitle,
      body: currentBody.join("\n").trim(),
    });
  }
  return sections;
};

const extractListItems = (input: string): string[] => {
  const lines = normalizeWhitespace(input).split("\n");
  const items: string[] = [];
  let current = "";
  for (const line of lines) {
    const match = line.match(LIST_ITEM_RE);
    if (match) {
      if (current) items.push(current.trim());
      current = match[1]?.trim() ?? "";
      continue;
    }
    if (!line.trim()) {
      if (current) {
        items.push(current.trim());
        current = "";
      }
      continue;
    }
    if (current && /^\s{2,}\S/.test(line)) {
      current = `${current} ${line.trim()}`.trim();
    }
  }
  if (current) items.push(current.trim());
  return unique(items);
};

const extractQuotedLines = (input: string): string[] => {
  const out: string[] = [];
  for (const line of normalizeWhitespace(input).split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
      (trimmed.startsWith("“") && trimmed.endsWith("”"))
    ) {
      out.push(stripMatchingQuotes(trimmed));
    }
  }
  return unique(out);
};

const collectTableColumns = (input: string): string[] => {
  const lines = normalizeWhitespace(input).split("\n");
  for (let index = 0; index < lines.length - 1; index += 1) {
    const header = lines[index]?.trim() ?? "";
    const separator = lines[index + 1]?.trim() ?? "";
    if (!header.includes("|") || !TABLE_SEPARATOR_RE.test(separator)) continue;
    return unique(
      header
        .split("|")
        .map((entry) => entry.trim())
        .filter(Boolean),
    );
  }
  return [];
};

const collectSectionMap = (input: string): Map<string, MarkdownSection> => {
  const map = new Map<string, MarkdownSection>();
  for (const section of splitMarkdownSections(input, 2)) {
    map.set(section.title.toLowerCase(), section);
  }
  return map;
};

const parseTopLevelStructure = (input: string): PromptResearchContractStructureSection[] => {
  const subsections = splitMarkdownSections(input, 3);
  const sections: PromptResearchContractStructureSection[] = [];
  for (const subsection of subsections) {
    const title = normalizeSectionTitle(subsection.title);
    if (!title) continue;
    const lines = subsection.body.split("\n");
    const mustCoverIndex = lines.findIndex((line) => /^\s*Must\s+(?:cover|include)\s*:/i.test(line));
    const mustCoverSource =
      mustCoverIndex >= 0 ? lines.slice(mustCoverIndex + 1).join("\n") : subsection.body;
    const mustCover = extractListItems(mustCoverSource);
    sections.push({
      title,
      must_cover: mustCover.slice(0, 12),
    });
  }
  return unique(
    sections.map((section) => JSON.stringify(section)),
  ).map((entry) => JSON.parse(entry) as PromptResearchContractStructureSection);
};

const parseOutputStyle = (input: string): PromptResearchContractOutputStyle => {
  const lines = normalizeWhitespace(input).split("\n");
  const mainBodyExpectations: string[] = [];
  const appendixExpectations: string[] = [];
  let mode: "main" | "appendix" | null = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^Main-body expectations\s*:/i.test(trimmed)) {
      mode = "main";
      continue;
    }
    if (/^Appendix expectations\s*:/i.test(trimmed)) {
      mode = "appendix";
      continue;
    }
    const match = trimmed.match(LIST_ITEM_RE);
    if (!match) continue;
    if (mode === "main") mainBodyExpectations.push(match[1]?.trim() ?? "");
    if (mode === "appendix") appendixExpectations.push(match[1]?.trim() ?? "");
  }
  const normalized = normalizeWhitespace(input).toLowerCase();
  return {
    main_body_expectations: unique(mainBodyExpectations),
    appendix_expectations: unique(appendixExpectations),
    minimal_heading_overhead: normalized.includes("minimal heading overhead"),
    continuous_prose: normalized.includes("continuous prose"),
    equation_dense: normalized.includes("equations") || normalized.includes("equation"),
  };
};

const resolveExpansionRule = (input: string): PromptResearchContractExpansionRule => {
  const normalized = normalizeWhitespace(input).toLowerCase();
  if (normalized.includes("use additional repo files only as needed from those anchors")) {
    return "anchor_expansion";
  }
  if (normalized.includes("use only repo-committed, readable artifacts")) {
    return "none";
  }
  return "open";
};

export const parsePromptResearchContract = (input: string): PromptResearchContract | null => {
  const rawPrompt = normalizeWhitespace(input);
  if (!rawPrompt) return null;

  const sectionMap = collectSectionMap(rawPrompt);
  const hardConstraints = extractListItems(sectionMap.get("hard constraints")?.body ?? "");
  const canonicalPrecedence = extractListItems(sectionMap.get("canonical precedence rule")?.body ?? "");
  const requiredRepoInputs = unique(
    extractFilePathsFromText(sectionMap.get("required repo inputs")?.body ?? ""),
  );
  const requiredTopLevelStructure = parseTopLevelStructure(
    sectionMap.get("required top-level structure")?.body ?? "",
  );
  const appendixRequirements = extractListItems(
    sectionMap.get("derivation appendix requirements")?.body ?? "",
  );
  const claimDiscipline = extractListItems(sectionMap.get("claim discipline section")?.body ?? "");
  const selfCheck = extractListItems(sectionMap.get("self-check before final output")?.body ?? "");
  const failClosedSection = sectionMap.get("fail-closed behavior")?.body ?? "";
  const purpose = normalizeWhitespace(sectionMap.get("purpose")?.body ?? "") || null;
  const outputStyle = parseOutputStyle(sectionMap.get("output style rule")?.body ?? "");
  const verbatimConstraints = unique([
    ...extractQuotedLines(sectionMap.get("hard constraints")?.body ?? ""),
    ...extractQuotedLines(rawPrompt),
  ]);
  const canonicalPrecedencePaths = unique(
    extractFilePathsFromText(sectionMap.get("canonical precedence rule")?.body ?? ""),
  );
  const provenanceTableSchema = collectTableColumns(
    sectionMap.get("provenance table requirement")?.body ?? "",
  );

  const detectionSignals = [
    hardConstraints.length > 0 ? "hard_constraints" : null,
    canonicalPrecedence.length > 0 ? "canonical_precedence" : null,
    requiredRepoInputs.length > 0 ? "required_repo_inputs" : null,
    requiredTopLevelStructure.length > 0 ? "required_top_level_structure" : null,
    appendixRequirements.length > 0 ? "appendix_requirements" : null,
    claimDiscipline.length > 0 ? "claim_discipline" : null,
    failClosedSection ? "fail_closed_behavior" : null,
    selfCheck.length > 0 ? "self_check" : null,
  ].filter(Boolean) as string[];

  const isResearchContract =
    detectionSignals.length >= 3 ||
    (requiredRepoInputs.length > 0 && canonicalPrecedence.length > 0) ||
    (requiredTopLevelStructure.length >= 2 && selfCheck.length > 0);
  if (!isResearchContract) return null;

  const failClosedBehavior: PromptResearchContractFailClosedBehavior = {
    enabled: Boolean(failClosedSection) || /fail-closed/i.test(rawPrompt),
    missing_required_inputs_stop:
      /return\s+`?blocked\s*=\s*true`?/i.test(failClosedSection) ||
      /do\s+not\s+complete\s+the\s+manuscript/i.test(failClosedSection) ||
      /stop_reason\s*=\s*Fail-closed/i.test(failClosedSection),
    unknown_marker: /`UNKNOWN`/i.test(rawPrompt) ? "UNKNOWN" : "UNKNOWN",
    stop_reason: /Fail-closed/i.test(failClosedSection) ? "Fail-closed" : "Fail-closed",
  };

  return {
    mode: "research_contract",
    raw_prompt: rawPrompt,
    purpose,
    hard_constraints: hardConstraints,
    verbatim_constraints: verbatimConstraints,
    canonical_precedence: canonicalPrecedence,
    canonical_precedence_paths: canonicalPrecedencePaths,
    required_repo_inputs: requiredRepoInputs,
    allowed_extra_retrieval_rule: resolveExpansionRule(rawPrompt),
    output_style: outputStyle,
    required_top_level_structure: requiredTopLevelStructure,
    appendix_requirements: appendixRequirements,
    provenance_table_schema: provenanceTableSchema,
    claim_discipline: claimDiscipline,
    fail_closed_behavior: failClosedBehavior,
    self_check: selfCheck,
    section_titles: Array.from(sectionMap.keys()),
    detection_signals: detectionSignals,
  };
};

export const buildPromptResearchRetrievalContract = buildPromptResearchRetrievalContractBase;

export const renderPromptResearchFailClosedAnswer = (args: {
  missingPaths: string[];
  stopReason?: string | null;
}): string => {
  const stopReason = normalizeWhitespace(args.stopReason ?? "") || "Fail-closed";
  const lines = ["blocked=true", `stop_reason=${stopReason}`, "missing_paths:"];
  for (const missingPath of unique(args.missingPaths)) {
    lines.push(`- ${missingPath}`);
  }
  return lines.join("\n");
};
