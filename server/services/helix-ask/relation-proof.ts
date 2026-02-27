export const NEEDLE_NATARIO_RELATION_FAIL_REASON =
  "RELATION_EDGE_MISSING_NEEDLE_HULL_NATARIO_FAMILY" as const;

export type NeedleNatarioRelationProofOutcome = {
  applicable: boolean;
  ok: boolean;
  outcome: "allow" | "clarify_fail_closed" | "allow_open_world_bypass" | "not_applicable";
  fail_reason?: typeof NEEDLE_NATARIO_RELATION_FAIL_REASON;
  clarify_message?: string;
  matched_edge_ids: string[];
  missing_edge_ids: string[];
};

type RelationEdgeContract = {
  id: string;
  path: string;
  requiredTokens: string[];
};

const NEEDLE_NATARIO_EDGE_CONTRACT: RelationEdgeContract[] = [
  {
    id: "needle_preset_sets_natario_field",
    path: "client/src/components/needle-hull-preset.tsx",
    requiredTokens: ["warpfieldtype", "natario"],
  },
  {
    id: "needle_mainframe_binds_natario_geometry",
    path: "docs/needle-hull-mainframe.md",
    requiredTokens: ["needle hull", "natario", "warp geometry"],
  },
];

const NEEDLE_RE = /\bneedle\s*hull\b/i;
const NATARIO_RE = /\bnatario(?:-family|\s+family)?\b/i;
const MEMBERSHIP_RE =
  /\b(?:is|are|be|belongs?\s+to|part\s+of|family|solution|variant|same\s+claim|prove|proving|evidence\s+edges?)\b/i;

const normalize = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const normalizePath = (value: string): string => value.replace(/\\/g, "/").trim();

const collectPathScopedLines = (source: string, edgePath: string): string[] => {
  if (!source) return [];
  const target = normalizePath(edgePath).toLowerCase();
  return source
    .split(/\r?\n/)
    .map((line) => line.replace(/\\/g, "/").trim())
    .filter((line) => line.toLowerCase().includes(target))
    .map((line) => normalize(line));
};

export const isNeedleNatarioFamilyClaim = (question: string): boolean => {
  const text = normalize(String(question ?? ""));
  return NEEDLE_RE.test(text) && NATARIO_RE.test(text) && MEMBERSHIP_RE.test(text);
};

export function evaluateNeedleNatarioRelationProof(args: {
  question: string;
  docBlocks?: Array<{ path: string; block: string }>;
  contextFiles?: string[];
  evidenceText?: string;
  contextText?: string;
  repoEvidenceRequired: boolean;
  openWorldBypassAllowed: boolean;
}): NeedleNatarioRelationProofOutcome {
  if (!isNeedleNatarioFamilyClaim(args.question)) {
    return {
      applicable: false,
      ok: true,
      outcome: "not_applicable",
      matched_edge_ids: [],
      missing_edge_ids: [],
    };
  }

  const paths = new Set<string>();
  for (const file of args.contextFiles ?? []) {
    const normalized = normalizePath(file);
    if (normalized) paths.add(normalized);
  }

  const blocks = args.docBlocks ?? [];
  const blocksByPath = new Map<string, string[]>();
  for (const block of blocks) {
    const normalized = normalizePath(block.path);
    if (!normalized) continue;
    paths.add(normalized);
    const existing = blocksByPath.get(normalized) ?? [];
    existing.push(normalize(block.block ?? ""));
    blocksByPath.set(normalized, existing);
  }

  const matched_edge_ids: string[] = [];
  const missing_edge_ids: string[] = [];

  for (const edge of NEEDLE_NATARIO_EDGE_CONTRACT) {
    const hasPath = paths.has(edge.path);
    const edgeCorpus = [
      ...(blocksByPath.get(edge.path) ?? []),
      ...collectPathScopedLines(args.evidenceText ?? "", edge.path),
      ...collectPathScopedLines(args.contextText ?? "", edge.path),
    ].join("\n");
    const hasTokens = edge.requiredTokens.every((token) => edgeCorpus.includes(normalize(token)));
    if (hasPath && hasTokens) {
      matched_edge_ids.push(edge.id);
    } else {
      missing_edge_ids.push(edge.id);
    }
  }

  const ok = missing_edge_ids.length === 0;
  if (ok) {
    return {
      applicable: true,
      ok: true,
      outcome: "allow",
      matched_edge_ids,
      missing_edge_ids,
    };
  }

  if (!args.repoEvidenceRequired && args.openWorldBypassAllowed) {
    return {
      applicable: true,
      ok: false,
      outcome: "allow_open_world_bypass",
      fail_reason: NEEDLE_NATARIO_RELATION_FAIL_REASON,
      matched_edge_ids,
      missing_edge_ids,
    };
  }

  return {
    applicable: true,
    ok: false,
    outcome: "clarify_fail_closed",
    fail_reason: NEEDLE_NATARIO_RELATION_FAIL_REASON,
    clarify_message:
      "I can't assert Needle Hull is Natario-family yet because explicit relation evidence edges are missing. Please cite evidence spanning client/src/components/needle-hull-preset.tsx and docs/needle-hull-mainframe.md.",
    matched_edge_ids,
    missing_edge_ids,
  };
}
