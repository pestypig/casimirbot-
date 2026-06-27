import { normalizeEvidenceRef } from "../../agi/refinery-identity";

const TREE_JSON_CITATION_RE = /(^|\/)docs\/knowledge\/.+-tree\.json$/i;
const DOC_EVIDENCE_PATH_RE = /(^|\/)docs\/.+\.(md|json)$/i;
const CODE_EVIDENCE_PATH_RE =
  /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|kt|cpp|cc|c|h|hpp|sql)$/i;
const NON_SIGNAL_EVIDENCE_PATH_RE = /\.(html?|css|svg|png|jpg|jpeg|gif|webp|ico)$/i;
const STAGE0_CODE_FLOOR_CODE_PATH_RE = /^(server|client|modules|shared|scripts|cli)\//i;

export const normalizeHelixAskEvidencePathKey = (value: string): string =>
  (normalizeEvidenceRef(value) ?? value).toLowerCase();

export const isHelixAskTreeJsonCitationPath = (value: string): boolean => {
  const normalized = (normalizeEvidenceRef(value) ?? value).replace(/\\/g, "/");
  return TREE_JSON_CITATION_RE.test(normalized);
};

export const isHelixAskDocEvidencePath = (value: string): boolean => {
  const normalized = (normalizeEvidenceRef(value) ?? value).replace(/\\/g, "/");
  return DOC_EVIDENCE_PATH_RE.test(normalized);
};

export const isHelixAskCodeEvidencePath = (value: string): boolean => {
  const normalized = (normalizeEvidenceRef(value) ?? value).replace(/\\/g, "/");
  if (NON_SIGNAL_EVIDENCE_PATH_RE.test(normalized)) return false;
  if (isHelixAskDocEvidencePath(normalized)) return false;
  return CODE_EVIDENCE_PATH_RE.test(normalized) || /(^|\/)(tests?|specs?)[/\\]/i.test(normalized);
};

export const computeHelixAskStage0CodeFloorPathCounts = (
  paths: string[],
): { codePathCount: number; docPathCount: number } => {
  const unique = Array.from(
    new Set(paths.map((entry) => (normalizeEvidenceRef(entry) ?? entry).replace(/\\/g, "/").trim())),
  ).filter(Boolean);
  let codePathCount = 0;
  let docPathCount = 0;
  for (const filePath of unique) {
    if (/^docs\//i.test(filePath)) {
      docPathCount += 1;
      continue;
    }
    if (STAGE0_CODE_FLOOR_CODE_PATH_RE.test(filePath)) {
      codePathCount += 1;
    }
  }
  return { codePathCount, docPathCount };
};

export const computeHelixAskTreeCitationStats = (
  paths: string[],
): { total: number; tree: number; nonTree: number; share: number } => {
  const unique = Array.from(
    new Set(paths.map((entry) => (normalizeEvidenceRef(entry) ?? entry).replace(/\\/g, "/"))),
  ).filter(Boolean);
  if (unique.length === 0) {
    return { total: 0, tree: 0, nonTree: 0, share: 0 };
  }
  const tree = unique.reduce(
    (count, entry) => count + (isHelixAskTreeJsonCitationPath(entry) ? 1 : 0),
    0,
  );
  const nonTree = Math.max(0, unique.length - tree);
  return {
    total: unique.length,
    tree,
    nonTree,
    share: tree / unique.length,
  };
};
