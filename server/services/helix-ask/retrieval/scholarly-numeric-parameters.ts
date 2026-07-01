import crypto from "node:crypto";
import {
  HELIX_SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
  HELIX_SCHOLARLY_NUMERIC_PARAMETER_OBSERVATION_SCHEMA,
  type HelixScholarlyFullTextObservation,
  type HelixScholarlyNumericParameterEvidence,
  type HelixScholarlyNumericParameterObservation,
  type HelixScholarlyRejectedNumericCandidate,
} from "@shared/helix-scholarly-research-observation";

type RecordLike = Record<string, unknown>;

export type RunScholarlyNumericParameterExtractionInput = {
  turnId: string;
  callId?: string | null;
  requestedVariables: string[];
  fullTextObservation?: HelixScholarlyFullTextObservation | null;
  textEvidence?: string | null;
  sourceRef?: string | null;
  paper?: {
    title?: string;
    doi?: string;
    arxiv_id?: string;
    url?: string;
  } | null;
};

const NUMERIC_PATTERN = String.raw`[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:\s*(?:[xX*]\s*10\^?|e)\s*[-+]?\d+)?`;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as RecordLike : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const normalizeWhitespace = (value: string): string =>
  value.replace(/\u0000/g, " ").replace(/\s+/g, " ").trim();

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

const uniqueStrings = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeNumericText = (value: string): number | null => {
  const compact = value.replace(/\s+/g, "");
  const scientific = compact.replace(/[xX*]10\^?/g, "e");
  const parsed = Number(scientific);
  return Number.isFinite(parsed) ? parsed : null;
};

const variableAliases = (variable: string): string[] => {
  const normalized = variable.toLowerCase();
  const aliases: Record<string, string[]> = {
    n_m3: ["n_m3", "density", "electron density", "plasma density", "number density", "n_e", "ne", "n"],
    t_ev: ["T_eV", "temperature", "electron temperature", "ion temperature", "T_e", "Te", "T"],
    b_t: ["B_T", "magnetic field", "toroidal field", "field strength", "B_T", "B"],
    e_charge: ["e_charge", "elementary charge", "electron charge", "e"],
    mu0: ["mu0", "mu_0", "permeability of free space", "vacuum permeability"],
  };
  return uniqueStrings([variable, ...(aliases[normalized] ?? [])]);
};

const normalizeUnit = (unit: string): string | null => {
  const compact = unit
    .replace(/μ/g, "u")
    .replace(/\s+/g, "")
    .replace(/−/g, "-")
    .replace(/\*\*/g, "^")
    .toLowerCase();
  if (/^(?:m\^-?3|m-3|m\(-3\)|1\/m\^?3|m\^-3)$/.test(compact)) return "m^-3";
  if (/^(?:ev|electronvolts?)$/.test(compact)) return "eV";
  if (/^(?:kev)$/.test(compact)) return "eV";
  if (/^(?:t|tesla)$/.test(compact)) return "T";
  if (/^(?:c|coulomb|coulombs)$/.test(compact)) return "C";
  if (/^(?:h\/m|n\/a\^2|newton\/ampere\^2)$/.test(compact)) return "H/m";
  return null;
};

const convertValue = (value: number, unit: string): { value: number; unit: string } | null => {
  const normalized = normalizeUnit(unit);
  if (!normalized) return null;
  if (unit.trim().toLowerCase() === "kev") return { value: value * 1000, unit: "eV" };
  return { value, unit: normalized };
};

const expectedUnitForVariable = (variable: string): string | null => {
  const normalized = variable.toLowerCase();
  if (normalized === "n_m3") return "m^-3";
  if (normalized === "t_ev") return "eV";
  if (normalized === "b_t") return "T";
  if (normalized === "e_charge") return "C";
  if (normalized === "mu0") return "H/m";
  return null;
};

const snippetAround = (text: string, index: number, length: number): string => {
  const start = Math.max(0, index - 90);
  const end = Math.min(text.length, index + Math.max(length, 1) + 140);
  return normalizeWhitespace(text.slice(start, end)).slice(0, 360);
};

const hasCitationCue = (snippet: string): boolean =>
  /\b(?:doi|arxiv|fig\.?|figure|table|section|p\.|pp\.|et\s+al\.|\[[0-9,\s-]+\]|\([A-Z][A-Za-z-]+(?:\s+et\s+al\.)?,?\s+\d{4}\))\b/i.test(snippet);

const rowTextFromInput = (
  input: RunScholarlyNumericParameterExtractionInput,
): Array<{ text: string; page: number | null; section?: string; sourceRef: string }> => {
  const rows: Array<{ text: string; page: number | null; section?: string; sourceRef: string }> = [];
  const defaultSourceRef = input.sourceRef ?? input.fullTextObservation?.artifact_id ?? null;
  const directText = normalizeWhitespace(input.textEvidence ?? "");
  if (directText && defaultSourceRef) rows.push({ text: directText, page: null, sourceRef: defaultSourceRef });
  for (const chunk of input.fullTextObservation?.selected_chunks ?? []) {
    const text = normalizeWhitespace(chunk.text_excerpt);
    if (!text) continue;
    rows.push({
      text,
      page: chunk.page_start ?? null,
      section: chunk.section_hint,
      sourceRef: chunk.citation_ref || chunk.source_text_ref || defaultSourceRef || input.fullTextObservation?.artifact_id || "scholarly_full_text_observation",
    });
  }
  return rows.slice(0, 64);
};

const extractOneVariable = (
  variable: string,
  rows: Array<{ text: string; page: number | null; section?: string; sourceRef: string }>,
): {
  parameter: HelixScholarlyNumericParameterEvidence | null;
  rejected: HelixScholarlyRejectedNumericCandidate[];
} => {
  const rejected: HelixScholarlyRejectedNumericCandidate[] = [];
  const expectedUnit = expectedUnitForVariable(variable);
  for (const row of rows) {
    for (const alias of variableAliases(variable)) {
      const aliasPattern = escapeRegExp(alias).replace(/\\ /g, String.raw`\s+`);
      const pattern = new RegExp(
        String.raw`(?:\b${aliasPattern}\b)\s*(?:=|:|is|of|was|were|~|≈|about|around)?\s*(${NUMERIC_PATTERN})\s*([A-Za-zμ][A-Za-z0-9μ_./^+-]*)?`,
        "i",
      );
      const match = row.text.match(pattern);
      if (!match?.[1]) continue;
      const snippet = snippetAround(row.text, match.index ?? 0, match[0].length);
      const numeric = normalizeNumericText(match[1]);
      if (numeric === null) {
        rejected.push({ variable, text: snippet, reason: "not_numeric" });
        continue;
      }
      const rawUnit = readString(match[2]);
      if (!rawUnit) {
        rejected.push({ variable, text: snippet, reason: expectedUnit ? "missing_unit" : "ambiguous_unit" });
        continue;
      }
      const converted = convertValue(numeric, rawUnit);
      if (!converted || (expectedUnit && converted.unit !== expectedUnit)) {
        rejected.push({ variable, text: snippet, reason: "unsupported_unit" });
        continue;
      }
      if (!hasCitationCue(`${snippet} ${row.sourceRef}`)) {
        rejected.push({ variable, text: snippet, reason: "uncited_value" });
        continue;
      }
      const evidenceRef = `scholarly-numeric:${hashShort([variable, converted.value, converted.unit, row.sourceRef, snippet])}`;
      return {
        parameter: {
          variable,
          value: numeric,
          unit: rawUnit,
          normalized_value: converted.value,
          normalized_unit: converted.unit,
          source_snippet: snippet,
          ...(row.section ? { section: row.section } : {}),
          page: row.page,
          table: /\btable\b/i.test(snippet) ? "detected_table_context" : null,
          confidence: hasCitationCue(snippet) ? "high" : "medium",
          evidence_ref: evidenceRef,
        },
        rejected,
      };
    }
  }
  return { parameter: null, rejected };
};

export function runScholarlyNumericParameterExtraction(
  input: RunScholarlyNumericParameterExtractionInput,
): HelixScholarlyNumericParameterObservation {
  const requestedVariables = uniqueStrings(input.requestedVariables.map((entry) => entry.trim())).slice(0, 24);
  const rows = rowTextFromInput(input);
  const parameters: HelixScholarlyNumericParameterEvidence[] = [];
  const rejectedCandidates: HelixScholarlyRejectedNumericCandidate[] = [];
  const missingRequirements: string[] = [];

  if (requestedVariables.length === 0) missingRequirements.push("requested_variables_required");
  if (rows.length === 0) missingRequirements.push("text_evidence_required");

  for (const variable of requestedVariables) {
    const result = extractOneVariable(variable, rows);
    rejectedCandidates.push(...result.rejected);
    if (result.parameter) parameters.push(result.parameter);
  }

  const missingVariables = requestedVariables.filter((variable) =>
    !parameters.some((parameter) => parameter.variable === variable)
  );

  if (missingVariables.length > 0) missingRequirements.push("missing_requested_numeric_variables");

  const fullText = input.fullTextObservation;
  const paperRecord = readRecord(input.paper);
  const paper = {
    ...(readString(paperRecord?.title) ?? fullText?.title ? { title: readString(paperRecord?.title) ?? fullText?.title } : {}),
    ...(readString(paperRecord?.doi) ? { doi: readString(paperRecord?.doi) ?? undefined } : {}),
    ...(readString(paperRecord?.arxiv_id) ? { arxiv_id: readString(paperRecord?.arxiv_id) ?? undefined } : {}),
    ...(readString(paperRecord?.url) ?? fullText?.source_url ? { url: readString(paperRecord?.url) ?? fullText?.source_url } : {}),
  };

  return {
    schema: HELIX_SCHOLARLY_NUMERIC_PARAMETER_OBSERVATION_SCHEMA,
    artifact_id: `${input.callId ?? input.turnId}:scholarly_numeric_parameter_observation`,
    turn_id: input.turnId,
    capability: HELIX_SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
    capability_key: HELIX_SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
    source_ref: input.sourceRef ?? fullText?.artifact_id ?? null,
    paper,
    requested_variables: requestedVariables,
    parameters,
    missing_variables: missingVariables,
    rejected_candidates: rejectedCandidates.slice(0, 24),
    missing_requirements: uniqueStrings(missingRequirements),
    selected_for_answer: parameters.length > 0 && missingVariables.length === 0,
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  };
}
