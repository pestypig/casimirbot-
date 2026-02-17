import crypto from "node:crypto";
import type { HelixAskGraphEvidence, HelixAskGraphPack } from "./graph-resolver";

export type RelationAssemblyEvidence = {
  id: string;
  file: string;
  span?: string;
  snippet: string;
  domain: "warp" | "ethos" | "other";
};

export type RelationAssemblyPacket = {
  question: string;
  domains: string[];
  definitions: {
    warp_definition?: string;
    ethos_definition?: string;
  };
  bridge_claims: string[];
  constraints: string[];
  falsifiability_hooks: string[];
  evidence: RelationAssemblyEvidence[];
  source_map: Record<string, string>;
};

const WARP_RE = /\b(warp|bubble|alcubierre|natario|ford[-\s]?roman|theta|vdb|qi|t00|stress[-\s]?energy)\b/i;
const ETHOS_RE = /\b(ethos|ideology|mission|stewardship|ledger|feedback\s+loop\s+hygiene|radiance|citizen)\b/i;

const inferDomain = (text: string): "warp" | "ethos" | "other" => {
  const warp = WARP_RE.test(text);
  const ethos = ETHOS_RE.test(text);
  if (warp && !ethos) return "warp";
  if (ethos && !warp) return "ethos";
  return "other";
};

const stableEvidenceId = (file: string, snippet: string, index: number): string => {
  const hash = crypto.createHash("sha1").update(`${file}|${snippet}|${index}`).digest("hex").slice(0, 10);
  return `ev_${hash}`;
};

const toSnippet = (value: string, max = 220): string => value.replace(/\s+/g, " ").trim().slice(0, max).trim();

export const buildRelationAssemblyPacket = (args: {
  question: string;
  docBlocks: Array<{ path: string; block: string }>;
  graphPack?: HelixAskGraphPack | null;
  graphEvidenceItems?: HelixAskGraphEvidence[];
  contextFiles?: string[];
  evidenceText?: string;
  treeWalk?: string;
}): RelationAssemblyPacket => {
  const evidenceCandidates: Array<{ file: string; snippet: string; span?: string }> = [];

  for (const [index, block] of args.docBlocks.entries()) {
    if (!block?.path || !block?.block) continue;
    const snippet = toSnippet(block.block);
    if (!snippet) continue;
    evidenceCandidates.push({ file: block.path, snippet, span: `doc:${index + 1}` });
  }

  for (const item of args.graphEvidenceItems ?? []) {
    if (!item.path) continue;
    const snippet = toSnippet([item.note, item.heading, item.contains].filter(Boolean).join(" | "));
    if (!snippet) continue;
    evidenceCandidates.push({ file: item.path, snippet, span: item.heading });
  }

  for (const path of args.contextFiles ?? []) {
    evidenceCandidates.push({ file: path, snippet: "Context anchor file", span: "context" });
  }

  const lines = (args.evidenceText ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines.slice(0, 24)) {
    const fileMatch = line.match(/([\w./-]+\.(?:md|ts|tsx|json))/i);
    if (!fileMatch) continue;
    evidenceCandidates.push({ file: fileMatch[1], snippet: toSnippet(line), span: "line" });
  }

  const dedupe = new Map<string, RelationAssemblyEvidence>();
  for (const [index, candidate] of evidenceCandidates.entries()) {
    const snippet = toSnippet(candidate.snippet);
    if (!candidate.file || !snippet) continue;
    const key = `${candidate.file}|${snippet}`;
    if (dedupe.has(key)) continue;
    const id = stableEvidenceId(candidate.file, snippet, index);
    const domain = inferDomain(`${candidate.file} ${snippet}`);
    dedupe.set(key, { id, file: candidate.file, span: candidate.span, snippet, domain });
  }

  const evidence = Array.from(dedupe.values()).sort((a, b) => a.id.localeCompare(b.id));
  const warpEvidence = evidence.filter((entry) => entry.domain === "warp");
  const ethosEvidence = evidence.filter((entry) => entry.domain === "ethos");

  const domains = Array.from(new Set(evidence.map((entry) => entry.domain))).filter((d) => d !== "other");

  const definitions = {
    warp_definition: warpEvidence[0]?.snippet,
    ethos_definition: ethosEvidence[0]?.snippet,
  };

  const bridge_claims: string[] = [];
  const pairCount = Math.min(3, warpEvidence.length, ethosEvidence.length);
  for (let i = 0; i < pairCount; i += 1) {
    bridge_claims.push(
      `Warp anchor (${warpEvidence[i].file}) constrains implementation claims, while ethos anchor (${ethosEvidence[i].file}) constrains governance and usage claims.`,
    );
  }
  if (bridge_claims.length < 2 && warpEvidence[0] && ethosEvidence[0]) {
    bridge_claims.push(
      `A valid relation answer must cite both warp evidence (${warpEvidence[0].id}) and ethos evidence (${ethosEvidence[0].id}) in the same argument chain.`,
    );
  }

  const constraints = [
    "Do not claim physical viability unless HARD constraints pass and certificate integrity is OK.",
    "Do not propose mission application that bypasses stated policy or stewardship guardrails.",
  ];

  const falsifiability_hooks = [
    "Check whether each relation claim has at least one warp citation and one ethos citation.",
    "Check whether constraints include certificate hash + integrity status before viability wording.",
  ];

  const source_map: Record<string, string> = {};
  for (const item of evidence) {
    source_map[item.id] = `${item.file}${item.span ? `#${item.span}` : ""}`;
  }

  return {
    question: args.question,
    domains,
    definitions,
    bridge_claims: bridge_claims.slice(0, 6),
    constraints,
    falsifiability_hooks,
    evidence,
    source_map,
  };
};

export const relationTopologyAvailable = (args: {
  packet: RelationAssemblyPacket;
  treeWalk?: string;
  relationIntent: boolean;
}): boolean => {
  if (!args.relationIntent) return false;
  const hasWarp = args.packet.evidence.some((entry) => entry.domain === "warp");
  const hasEthos = args.packet.evidence.some((entry) => entry.domain === "ethos");
  const walk = String(args.treeWalk ?? "").toLowerCase();
  const hasCrossPath =
    (/warp/.test(walk) && /(ethos|ideology|mission)/.test(walk)) ||
    args.packet.bridge_claims.length >= 2;
  return hasWarp && hasEthos && hasCrossPath;
};

export const renderDeterministicRelationFallback = (packet: RelationAssemblyPacket): string => {
  const warp = packet.definitions.warp_definition ?? "Warp bubble definition evidence was not found.";
  const ethos = packet.definitions.ethos_definition ?? "Mission ethos definition evidence was not found.";
  const bridges = packet.bridge_claims.slice(0, 3).map((line) => `- ${line}`).join("\n");
  const constraints = packet.constraints.slice(0, 2).map((line) => `- ${line}`).join("\n");
  const hooks = packet.falsifiability_hooks.slice(0, 2).map((line) => `- ${line}`).join("\n");
  const sources = Object.entries(packet.source_map)
    .slice(0, 8)
    .map(([id, ref]) => `${id}:${ref}`)
    .join(", ");
  return [
    `what_is_warp_bubble: ${warp}`,
    `what_is_mission_ethos: ${ethos}`,
    `how_they_connect:\n${bridges || "- Cross-domain evidence was insufficient."}`,
    `constraints_and_falsifiability:\n${constraints}\n${hooks}`,
    sources ? `Sources: ${sources}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
};
