import crypto from "node:crypto";
import {
  HELIX_DOC_LOCATION_RESULT_SCHEMA,
  type HelixDocLocation,
  type HelixDocLocationResult,
} from "@shared/helix-doc-location-result";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const cleanLine = (value: string): string => value.replace(/\s+/g, " ").trim();

export const extractStructuredDocsLocateFields = (promptText: string): {
  docPath: string;
  locateQuery: string;
} => {
  const docPath = promptText.match(/^\s*Document\s+path\s*:\s*(.+)$/im)?.[1]?.trim() ?? "";
  const rawLocateQuery = promptText.match(/^\s*Locate\s+query\s*:\s*(.+)$/im)?.[1]?.trim() ?? "";
  const locateQuery = rawLocateQuery.replace(/^["'“”]+|["'“”]+$/g, "").trim();
  return { docPath, locateQuery };
};

export const parseLocationsText = (locationsText: string): HelixDocLocation[] => {
  const lines = locationsText.split(/\r?\n/);
  const locations: HelixDocLocation[] = [];
  let current: HelixDocLocation | null = null;

  const pushCurrent = () => {
    if (current && current.anchor.trim()) {
      locations.push({
        ...current,
        evidence_snippet: current.evidence_snippet.trim() || current.anchor.trim(),
      });
    }
    current = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || /^Locations:\s*$/i.test(trimmed)) continue;
    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      pushCurrent();
      const text = cleanLine(bullet[1]);
      const sectionMatch = text.match(/\(([^()]+)\)\s*$/);
      current = {
        anchor: text,
        section_title: sectionMatch?.[1]?.trim(),
        evidence_snippet: text,
        confidence: /no exact|closest|not found|searched/i.test(text) ? 0.45 : 0.72,
      };
      continue;
    }
    if (!current) continue;
    const snippet = trimmed.match(/^Snippet:\s*(.+)$/i);
    if (snippet) {
      current.evidence_snippet = cleanLine(snippet[1]);
      current.confidence = Math.max(current.confidence, 0.78);
      continue;
    }
    const pathLine = trimmed.match(/^Path:\s*(.+)$/i);
    if (pathLine) {
      current.anchor = cleanLine(pathLine[1]);
    }
  }
  pushCurrent();
  return locations;
};

export const buildDocLocationResultFromLocationsText = (input: {
  turnId: string;
  promptText: string;
  locationsText: string;
}): HelixDocLocationResult => {
  const fields = extractStructuredDocsLocateFields(input.promptText);
  const locations = parseLocationsText(input.locationsText);
  return {
    schema: HELIX_DOC_LOCATION_RESULT_SCHEMA,
    result_id: `doc_location_result:${hashShort([
      input.turnId,
      fields.docPath,
      fields.locateQuery,
      input.locationsText,
    ])}`,
    turn_id: input.turnId,
    doc_path: fields.docPath,
    locate_query: fields.locateQuery,
    locations,
    exact_match_found:
      locations.length > 0 &&
      !/No exact quoted request found|No locations found|No exact match/i.test(input.locationsText),
    assistant_answer: false,
    raw_content_included: false,
  };
};
