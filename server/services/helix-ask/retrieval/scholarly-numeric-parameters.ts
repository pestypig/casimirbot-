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
type EvidenceRow = { text: string; page: number | null; section?: string; sourceRef: string };
type NumericCandidate = { matchIndex: number; matchLength: number; numericText: string; unitText: string | null };

export type RunScholarlyNumericParameterExtractionInput = {
  turnId: string;
  callId?: string | null;
  requestedVariables: string[];
  extractionMode?: "requested_variables" | "open_supported_parameters";
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

const NUMERIC_PATTERN = String.raw`[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:\s*(?:[xX](?:\s*10)?|\*\s*10|\\times\s*10|times\s*10|e)\s*(?:\^|\*\*)?\s*\{?\s*[-+]?\d+\s*\}?)?`;
const PI_EXPRESSION_PATTERN = String.raw`[-+]?(?:\d+(?:\.\d*)?|\.\d+)\s*(?:\*|x|X|times|\\times)?\s*pi\s*(?:\*|x|X|times|\\times)\s*10\s*(?:\^|\*\*)?\s*\{?\s*[-+]?\d+\s*\}?`;
const UNIT_PATTERN = String.raw`(?:10\s*(?:\^|\*\*)\s*\{?\s*[-+]?\d+\s*\}?\s*)?(?:m\s*(?:\^|\*\*)\s*\{?\s*-?3\s*\}?|m\s*\^\s*-?3|m-3|1\s*/\s*m\s*(?:(?:\^|\*\*)\s*\{?\s*3\s*\}?)?|cm\s*(?:\^|\*\*)\s*\{?\s*-?3\s*\}?|cm\s*\^\s*-?3|ev|kev|mev|electron\s*volts?|tesla|[Tt]|coulombs?|[Cc]|H\s*/\s*m|N\s*/\s*A\s*(?:\^|\*\*)\s*\{?\s*2\s*\}?)`;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as RecordLike : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const normalizeWhitespace = (value: string): string =>
  value
    .replace(/\u0000/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/[\u2012\u2013\u2014\u2212]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

const uniqueStrings = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeNumericText = (value: string): number | null => {
  const cleaned = value
    .replace(/\\times/gi, "x")
    .replace(/times/gi, "x")
    .replace(/[{}]/g, "")
    .replace(/\u00d7/g, "x")
    .replace(/[\u2012\u2013\u2014\u2212]/g, "-");
  const compact = cleaned.replace(/\s+/g, "");
  const scientific = compact
    .replace(/[xX](?:10)?(?:\^|\*\*)?/g, "e")
    .replace(/\*10(?:\^|\*\*)?/g, "e");
  const parsed = Number(scientific);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeConstantExpression = (value: string): number | null => {
  const piMatch = value.match(/([-+]?(?:\d+(?:\.\d*)?|\.\d+))\s*(?:\*|x|X|times|\\times)?\s*pi\s*(?:\*|x|X|times|\\times)\s*10\s*(?:\^|\*\*)?\s*\{?\s*([-+]?\d+)\s*\}?/i);
  if (!piMatch?.[1] || !piMatch[2]) return normalizeNumericText(value);
  const coefficient = Number(piMatch[1]);
  const exponent = Number(piMatch[2]);
  if (!Number.isFinite(coefficient) || !Number.isFinite(exponent)) return null;
  return coefficient * Math.PI * (10 ** exponent);
};

const variableAliases = (variable: string): string[] => {
  const normalized = variable.toLowerCase();
  const aliases: Record<string, string[]> = {
    n_m3: ["n_m3", "n m-3", "electron density", "plasma density", "number density", "line averaged density", "line-averaged density", "density", "n_e", "ne", "n"],
    t_ev: ["T_eV", "T eV", "electron temperature", "ion temperature", "plasma temperature", "temperature", "T_e", "Te", "T"],
    b_t: ["B_T", "B T", "toroidal magnetic field", "magnetic field", "toroidal field", "field strength", "field value", "B_t", "Bt"],
    e_charge: ["e_charge", "elementary charge", "electron charge", "e"],
    mu0: ["mu0", "mu_0", "mu 0", "permeability of free space", "vacuum permeability"],
  };
  return uniqueStrings([variable, ...(aliases[normalized] ?? [])]);
};

const normalizeUnit = (unit: string): { unit: string; scale: number } | null => {
  const ascii = unit
    .replace(/\u00b5/g, "u")
    .replace(/[\u2012\u2013\u2014\u2212]/g, "-")
    .replace(/[{}]/g, "")
    .replace(/electron\s+volts?/gi, "eV");
  const scaleMatch = ascii.match(/^\s*10\s*(?:\^|\*\*)\s*([-+]?\d+)\s*(.*)$/i);
  const scale = scaleMatch?.[1] ? 10 ** Number(scaleMatch[1]) : 1;
  const unitPart = scaleMatch?.[2] ?? ascii;
  const compact = unitPart
    .replace(/\s+/g, "")
    .replace(/\*\*/g, "^")
    .toLowerCase();
  if (!Number.isFinite(scale)) return null;
  if (/^(?:m\^-?3|m-3|m\(-3\)|1\/m\^?3|1\/m3)$/.test(compact)) return { unit: "m^-3", scale };
  if (/^(?:cm\^-?3|cm-3|cm\(-3\))$/.test(compact)) return { unit: "m^-3", scale: scale * 1e6 };
  if (/^(?:ev|electronvolts?)$/.test(compact)) return { unit: "eV", scale };
  if (/^(?:kev)$/.test(compact)) return { unit: "eV", scale: scale * 1000 };
  if (/^(?:mev)$/.test(compact)) return { unit: "eV", scale: scale * 1_000_000 };
  if (/^(?:t|tesla)$/.test(compact)) return { unit: "T", scale };
  if (/^(?:c|coulomb|coulombs)$/.test(compact)) return { unit: "C", scale };
  if (/^(?:h\/m|n\/a\^2|newton\/ampere\^2)$/.test(compact)) return { unit: "H/m", scale };
  return null;
};

const convertValue = (value: number, unit: string): { value: number; unit: string } | null => {
  const normalized = normalizeUnit(unit);
  if (!normalized) return null;
  return { value: value * normalized.scale, unit: normalized.unit };
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
  /(?:#page=|\bpage\s*[=:]\s*\d+|\b(?:doi|arxiv|fig\.?|figure|table|section|p\.|pp\.|et\s+al\.|\[[0-9,\s-]+\]|\([A-Z][A-Za-z-]+(?:\s+et\s+al\.)?,?\s+\d{4}\))\b)/i.test(snippet);

const tableIdForSnippet = (snippet: string): string | null =>
  /\btable\s+([0-9ivxlcdm]+|[A-Z])\b/i.exec(snippet)?.[0] ?? (/[|]\s*[^|]+\s*[|]/.test(snippet) ? "detected_table_context" : null);

const aliasPatternFor = (alias: string): string =>
  escapeRegExp(alias)
    .replace(/\\ /g, String.raw`[\s_-]+`)
    .replace(/_/g, String.raw`[\s_-]*`);

const aliasBoundary = (pattern: string): string =>
  String.raw`(?:^|[^A-Za-z0-9_])(?:${pattern})(?=$|[^A-Za-z0-9_])`;

const rowCandidatesForAlias = (rowText: string, alias: string): NumericCandidate[] => {
  const aliasPattern = aliasPatternFor(alias);
  const aliasRegex = new RegExp(aliasBoundary(aliasPattern), "i");
  const valueToUnitSeparator = String.raw`[\s,;|()[\]{}~+-]{0,18}`;
  const aliasToValueSeparator = String.raw`[\s:=,;|()[\]{}~+-]{0,28}(?:is|of|was|were|about|around|reported|measured|equals|=|:|~)?[\s:=,;|()[\]{}~+-]{0,28}`;
  const patterns = [
    new RegExp(
      String.raw`${aliasBoundary(aliasPattern)}${aliasToValueSeparator}(${NUMERIC_PATTERN})${valueToUnitSeparator}(${UNIT_PATTERN})?`,
      "ig",
    ),
    new RegExp(
      String.raw`(${NUMERIC_PATTERN})${valueToUnitSeparator}(${UNIT_PATTERN})[\s:=,;|()[\]{}~+-]{0,48}${aliasBoundary(aliasPattern)}`,
      "ig",
    ),
    new RegExp(
      String.raw`${aliasBoundary(aliasPattern)}${aliasToValueSeparator}(${PI_EXPRESSION_PATTERN})${valueToUnitSeparator}(${UNIT_PATTERN})?`,
      "ig",
    ),
  ];
  const candidates: NumericCandidate[] = [];
  for (const pattern of patterns) {
    for (const match of rowText.matchAll(pattern)) {
      const numericText = readString(match[1]);
      if (!numericText) continue;
      candidates.push({
        matchIndex: match.index ?? 0,
        matchLength: match[0]?.length ?? numericText.length,
        numericText,
        unitText: readString(match[2]),
      });
    }
  }
  if (candidates.length === 0 && aliasRegex.test(rowText) && rowText.includes("|")) {
    const tablePairPattern = new RegExp(String.raw`(${NUMERIC_PATTERN})${valueToUnitSeparator}(${UNIT_PATTERN})`, "ig");
    for (const match of rowText.matchAll(tablePairPattern)) {
      const numericText = readString(match[1]);
      if (!numericText) continue;
      candidates.push({
        matchIndex: match.index ?? 0,
        matchLength: match[0]?.length ?? numericText.length,
        numericText,
        unitText: readString(match[2]),
      });
    }
  }
  return candidates;
};

const rowTextFromInput = (input: RunScholarlyNumericParameterExtractionInput): EvidenceRow[] => {
  const rows: EvidenceRow[] = [];
  const defaultSourceRef = input.sourceRef ?? input.fullTextObservation?.artifact_id ?? null;
  const pushEvidenceText = (text: string, page: number | null, sourceRef: string, section?: string): void => {
    const normalized = normalizeWhitespace(text);
    if (!normalized) return;
    rows.push({ text: normalized, page, ...(section ? { section } : {}), sourceRef });
    for (const line of text.split(/\r?\n/)) {
      const lineText = normalizeWhitespace(line);
      if (lineText && lineText !== normalized) rows.push({ text: lineText, page, ...(section ? { section } : {}), sourceRef });
    }
  };
  if (input.textEvidence && defaultSourceRef) pushEvidenceText(input.textEvidence, null, defaultSourceRef);
  for (const chunk of input.fullTextObservation?.selected_chunks ?? []) {
    const sourceRef = chunk.citation_ref || chunk.source_text_ref || defaultSourceRef || input.fullTextObservation?.artifact_id || "scholarly_full_text_observation";
    pushEvidenceText(chunk.text_excerpt, chunk.page_start ?? null, sourceRef, chunk.section_hint);
  }
  return rows.slice(0, 64);
};

const extractOneVariable = (
  variable: string,
  rows: EvidenceRow[],
): {
  parameter: HelixScholarlyNumericParameterEvidence | null;
  rejected: HelixScholarlyRejectedNumericCandidate[];
} => {
  const rejected: HelixScholarlyRejectedNumericCandidate[] = [];
  const expectedUnit = expectedUnitForVariable(variable);
  for (const row of rows) {
    for (const alias of variableAliases(variable)) {
      for (const candidate of rowCandidatesForAlias(row.text, alias)) {
        const snippet = snippetAround(row.text, candidate.matchIndex, candidate.matchLength);
        const numeric = normalizeConstantExpression(candidate.numericText);
        if (numeric === null) {
          rejected.push({ variable, text: snippet, reason: "not_numeric" });
          continue;
        }
        const rawUnit = candidate.unitText;
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
            table: tableIdForSnippet(snippet),
            confidence: hasCitationCue(snippet) ? "high" : "medium",
            evidence_ref: evidenceRef,
          },
          rejected,
        };
      }
    }
  }
  return { parameter: null, rejected };
};

export function runScholarlyNumericParameterExtraction(
  input: RunScholarlyNumericParameterExtractionInput,
): HelixScholarlyNumericParameterObservation {
  const requestedVariables = uniqueStrings(input.requestedVariables.map((entry) => entry.trim())).slice(0, 24);
  const extractionMode = input.extractionMode === "open_supported_parameters" || requestedVariables.length === 0
    ? "open_supported_parameters"
    : "requested_variables";
  const variablesToExtract = extractionMode === "open_supported_parameters"
    ? ["n_m3", "T_eV", "B_T", "e_charge", "mu0"]
    : requestedVariables;
  const rows = rowTextFromInput(input);
  const parameters: HelixScholarlyNumericParameterEvidence[] = [];
  const rejectedCandidates: HelixScholarlyRejectedNumericCandidate[] = [];
  const missingRequirements: string[] = [];

  if (rows.length === 0) missingRequirements.push("text_evidence_required");

  for (const variable of variablesToExtract) {
    const result = extractOneVariable(variable, rows);
    rejectedCandidates.push(...result.rejected);
    if (result.parameter) parameters.push(result.parameter);
  }

  const missingVariables = extractionMode === "open_supported_parameters"
    ? []
    : requestedVariables.filter((variable) =>
        !parameters.some((parameter) => parameter.variable === variable)
      );

  if (missingVariables.length > 0) missingRequirements.push("missing_requested_numeric_variables");
  if (extractionMode === "open_supported_parameters" && parameters.length === 0) {
    missingRequirements.push("no_supported_numeric_parameters_found");
  }

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
    extraction_mode: extractionMode,
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  };
}
