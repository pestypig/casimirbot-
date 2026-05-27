import type { RepoSearchHit } from "../repo-search";
import type { HelixRepoCodeEvidenceObservation } from "../../../../shared/helix-repo-code-evidence-observation";

const INDEX_ONLY_PATHS = [
  /(?:^|\/)\.cache\//i,
  /(?:^|\/)\.tmp/i,
  /(?:^|\/)node_modules\//i,
  /(?:^|\/)dist\//i,
  /(?:^|\/)build\//i,
  /(?:^|\/)coverage\//i,
  /(?:^|\/)attached_assets\//i,
];

const GENERATED_OR_ARTIFACT_PATHS = [
  /(?:^|\/)server\/_generated\//i,
  /(?:^|\/)(?:generated|artifacts?|tmp|temp)\//i,
  /(?:^|\/)[^/]*\.generated\./i,
];

const normalize = (value: string): string => value.replace(/\\/g, "/").toLowerCase();

const tokenize = (value: string): string[] =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, " ")
    .split(/\s+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length >= 3);

const exactTermsFor = (input: {
  query: string;
  concept?: string | null;
  exactTerms?: string[];
}): string[] =>
  Array.from(
    new Set(
      [input.query, input.concept ?? "", ...(input.exactTerms ?? [])]
        .map((entry) => entry.trim())
        .filter((entry) => entry.length >= 3),
    ),
  );

const sourceKindForPath = (filePath: string): "repo_code" | "repo_doc" =>
  normalize(filePath).startsWith("docs/") ? "repo_doc" : "repo_code";

const isSituationRoomQuery = (queryTokens: Set<string>, exactTerms: string[]): boolean => {
  const joined = [...queryTokens, ...exactTerms].join(" ").toLowerCase();
  return /situation[\s_-]*room|situationroom|situation_context|situation-capture/.test(joined);
};

const isDottieQuery = (queryTokens: Set<string>, exactTerms: string[]): boolean => {
  const joined = [...queryTokens, ...exactTerms].join(" ").toLowerCase();
  return /\bdottie\b|auntie\s+dottie|voice_delivery|observer\.(?:attach|query)|dottie[_-]?manifest/.test(joined);
};

const isRouteEvidenceQuery = (queryTokens: Set<string>, exactTerms: string[]): boolean => {
  const joined = [...queryTokens, ...exactTerms].join(" ").toLowerCase();
  return /route[\s_-]*evidence|route[_-]?drift|field[_-]?worker|live[_-]?perturbation|query_navigation_state/.test(joined);
};

const isDocsPanelQuery = (queryTokens: Set<string>, exactTerms: string[]): boolean => {
  const joined = [...queryTokens, ...exactTerms].join(" ").toLowerCase();
  return /docs?[\s_-]*(?:panel|viewer)|document\s+viewer|docviewerpanel/.test(joined);
};

const isTerminalAuthorityQuery = (queryTokens: Set<string>, exactTerms: string[]): boolean => {
  const joined = [...queryTokens, ...exactTerms].join(" ").toLowerCase();
  return /terminal[\s_-]*authority|terminal[_-]?answer[_-]?authority|terminal-answer-envelope|runtime-authority-contract/.test(joined);
};

const scoreSituationRoomPath = (filePath: string, text: string): number => {
  let score = 0;
  if (/client\/src\/store\/usesituationroomstore\.ts$/.test(filePath)) score += 230;
  if (/client\/src\/store\/usesituationroom(?:jobstore|graphstore)\.ts$/.test(filePath)) score += 185;
  if (/client\/src\/lib\/helix\/situation-room\.ts$/.test(filePath)) score += 165;
  if (/client\/src\/lib\/helix\/situation-capture-context\.ts$/.test(filePath)) score += 145;
  if (/server\/services\/situation-room/.test(filePath)) score += 135;
  if (/shared\/.*situation/.test(filePath)) score += 115;
  if (/client\/src\/components\/(?:helix|workstation)\/.*situation/.test(filePath)) score += 105;
  if (/situation-room-pipelines|situation-room-sources/.test(filePath)) score += 95;
  if (/server\/services\/helix-ask\/.*situation/.test(filePath)) score += 70;
  if (/server\/services\/helix-ask/.test(filePath) && !/situation|live[_-]?environment|dottie|observer/.test(filePath)) {
    score -= 55;
  }
  if (/^\s*import\b/i.test(text) && !/\b(?:type|interface|class|function|const|enum|schema|createRoom|appendSituationEvent|attachDisplayAudioSource|SituationRoomSource)\b/i.test(text)) {
    score -= 45;
  }
  return score;
};

const scoreDottiePath = (filePath: string, text: string): number => {
  let score = 0;
  if (/shared\/helix-dottie-manifest-preset\.ts$/.test(filePath)) score += 230;
  if (/server\/services\/situation-room\/dottie-manifest-preset\.ts$/.test(filePath)) score += 215;
  if (/shared\/helix-agent-commentary\.ts$/.test(filePath)) score += 175;
  if (/shared\/workstation-dynamic-tools\.ts$/.test(filePath)) score += 165;
  if (/server\/services\/helix-ask\/workstation-tool-planner\.ts$/.test(filePath)) score += 150;
  if (/server\/services\/helix-ask\/runtime-authority-contract\.ts$/.test(filePath)) score += 120;
  if (/client\/src\/lib\/workstation\/panel(?:capabilities|actionadapters)\.ts$/.test(filePath)) score += 105;
  if (/dottie|voice_delivery|observer/.test(filePath)) score += 95;
  if (/\b(?:dottie\.manifest|dottie_manifest|auntie\s+dottie|observer\.attach|voice_delivery\.propose_from_trace)\b/i.test(text)) {
    score += 85;
  }
  if (/server\/services\/helix-ask/.test(filePath) && !/dottie|observer|voice|workstation-tool-planner|runtime-authority/.test(filePath)) {
    score -= 35;
  }
  return score;
};

const scoreRouteEvidencePath = (filePath: string, text: string): number => {
  let score = 0;
  if (/shared\/helix-situation-construct\.ts$/.test(filePath)) score += 220;
  if (/shared\/situation-room-live-job-contract\.ts$/.test(filePath)) score += 205;
  if (/server\/services\/situation-room\/situation-construct-recipe(?:-registry|-runner)?\.ts$/.test(filePath)) score += 180;
  if (/server\/services\/helix-ask\/situation-room-live-job-setup-planner\.ts$/.test(filePath)) score += 165;
  if (/client\/src\/components\/workstation\/situationroompipelinespanel\.tsx$/.test(filePath)) score += 145;
  if (/client\/src\/lib\/workstation\/panelactionadapters\.ts$/.test(filePath)) score += 125;
  if (/route[_-]?evidence|route[_-]?drift|field[_-]?worker|live[_-]?perturbation/.test(filePath)) score += 100;
  if (/\b(?:route evidence|route_drift|missing_evidence|field_worker|live_env\.query_navigation_state)\b/i.test(text)) {
    score += 85;
  }
  if (/server\/services\/helix-ask/.test(filePath) && !/situation|route|field|live/.test(filePath)) score -= 35;
  return score;
};

const scoreDocsPanelPath = (filePath: string, text: string): number => {
  let score = 0;
  if (/client\/src\/components\/docviewerpanel\.tsx$/.test(filePath)) score += 230;
  if (/client\/src\/lib\/docs\/docviewer\.ts$/.test(filePath)) score += 210;
  if (/client\/src\/lib\/workstation\/panelcapabilities\.ts$/.test(filePath)) score += 175;
  if (/client\/src\/lib\/workstation\/panelactionadapters\.ts$/.test(filePath)) score += 165;
  if (/shared\/workstation-dynamic-tools\.ts$/.test(filePath)) score += 145;
  if (/server\/services\/helix-ask\/(?:runtime-authority-contract|route-product-contract)\.ts$/.test(filePath)) score += 100;
  if (/docs?-viewer|docviewer|doc_summary|doc_location/.test(filePath)) score += 95;
  if (/\b(?:docs-viewer|DocViewerPanel|doc_summary|doc_location_matches|summarize_doc|locate_in_doc)\b/i.test(text)) {
    score += 90;
  }
  return score;
};

const scoreTerminalAuthorityPath = (filePath: string, text: string): number => {
  let score = 0;
  if (/server\/services\/helix-ask\/terminal-answer-envelope\.ts$/.test(filePath)) score += 230;
  if (/server\/services\/helix-ask\/runtime-authority-contract\.ts$/.test(filePath)) score += 220;
  if (/server\/services\/helix-ask\/solver-controller-decision\.ts$/.test(filePath)) score += 165;
  if (/server\/services\/helix-ask\/route-product-contract\.ts$/.test(filePath)) score += 155;
  if (/shared\/helix.*terminal.*authority/.test(filePath)) score += 120;
  if (/\b(?:terminal_answer_authority|terminal boundary|terminal authority|terminal_artifact_kind|final_answer_source)\b/i.test(text)) {
    score += 95;
  }
  return score;
};

const isContractLikeLine = (hit: RepoSearchHit): boolean => {
  const filePath = normalize(hit.filePath);
  const text = hit.text;
  return (
    /\b(?:export|type|interface|class|function|const|enum|schema|capability_key|describe|it|test)\b/i.test(text) ||
    /\.(?:test|spec)\.[tj]sx?$/.test(filePath) ||
    /(?:^|\/)__tests__(?:\/|$)/.test(filePath)
  );
};

const scoreHit = (
  hit: RepoSearchHit,
  queryTokens: Set<string>,
  exactTerms: string[],
): number => {
  const filePath = normalize(hit.filePath);
  const text = hit.text.toLowerCase();
  let score = 0;
  const situationRoomQuery = isSituationRoomQuery(queryTokens, exactTerms);
  const dottieQuery = isDottieQuery(queryTokens, exactTerms);
  const routeEvidenceQuery = isRouteEvidenceQuery(queryTokens, exactTerms);
  const docsPanelQuery = isDocsPanelQuery(queryTokens, exactTerms);
  const terminalAuthorityQuery = isTerminalAuthorityQuery(queryTokens, exactTerms);
  for (const term of exactTerms) {
    const normalizedTerm = term.toLowerCase();
    if (!normalizedTerm) continue;
    if (filePath.includes(normalizedTerm.replace(/\s+/g, "-")) || filePath.includes(normalizedTerm.replace(/\s+/g, "_"))) {
      score += 30;
    }
    if (text.includes(normalizedTerm)) {
      score += isContractLikeLine(hit) ? 100 : 80;
    }
  }
  for (const token of queryTokens) {
    if (filePath.includes(token)) score += 6;
    if (text.includes(token)) score += 4;
  }

  if (/server\/services\/helix-ask/.test(filePath)) score += 65;
  if (/shared\//.test(filePath)) score += 60;
  if (/client\/src\/lib\/workstation/.test(filePath)) score += 55;
  if (/client\/src\/components\/workstation/.test(filePath)) score += 55;
  if (/server\/services\/situation-room/.test(filePath)) score += 45;
  if (/(?:^|\/)__tests__\/|(?:\.test|\.spec)\.[tj]sx?$/.test(filePath)) score += 35;
  if (/docs\//.test(filePath)) score += 25;
  if (situationRoomQuery) score += scoreSituationRoomPath(filePath, hit.text);
  if (dottieQuery) score += scoreDottiePath(filePath, hit.text);
  if (routeEvidenceQuery) score += scoreRouteEvidencePath(filePath, hit.text);
  if (docsPanelQuery) score += scoreDocsPanelPath(filePath, hit.text);
  if (terminalAuthorityQuery) score += scoreTerminalAuthorityPath(filePath, hit.text);
  if (GENERATED_OR_ARTIFACT_PATHS.some((pattern) => pattern.test(filePath))) score -= 40;
  if (INDEX_ONLY_PATHS.some((pattern) => pattern.test(filePath))) score -= 60;
  return score;
};

export const isRepoCodeEvidenceIndexOnlyPath = (filePath: string): boolean =>
  INDEX_ONLY_PATHS.some((pattern) => pattern.test(normalize(filePath)));

export function rankRepoCodeEvidenceHits(input: {
  hits: RepoSearchHit[];
  query: string;
  concept?: string | null;
  exactTerms?: string[];
  maxHits?: number;
}): RepoSearchHit[] {
  const maxHits = Math.max(1, Math.min(input.maxHits ?? 40, 80));
  const queryTokens = new Set(tokenize([input.query, input.concept ?? ""].filter(Boolean).join(" ")));
  const exactTerms = exactTermsFor(input);
  const scored = input.hits
    .filter((hit) => !isRepoCodeEvidenceIndexOnlyPath(hit.filePath))
    .map((hit, index) => {
      return { hit, score: scoreHit(hit, queryTokens, exactTerms), index };
    });
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.slice(0, maxHits).map((entry) => entry.hit);
}

export function buildRepoCodeEvidenceSpans(input: {
  hits: RepoSearchHit[];
  query: string;
  concept?: string | null;
  exactTerms?: string[];
}): HelixRepoCodeEvidenceObservation["spans"] {
  const queryTokens = new Set(tokenize([input.query, input.concept ?? ""].filter(Boolean).join(" ")));
  const exactTerms = exactTermsFor(input);
  return input.hits.map((hit) => {
    const score = scoreHit(hit, queryTokens, exactTerms);
    const ref = `${hit.filePath}:${hit.line}`;
    const path = hit.filePath.replace(/\\/g, "/");
    return {
      ref,
      path,
      start_line: Math.max(1, Math.trunc(Number(hit.line) || 1)),
      end_line: Math.max(1, Math.trunc(Number(hit.line) || 1)),
      excerpt: hit.text,
      reason: score > 0 ? "matched_concept_path_or_text_signal" : "retrieved_repo_search_hit",
      source_kind: sourceKindForPath(path),
      score,
    };
  });
}
