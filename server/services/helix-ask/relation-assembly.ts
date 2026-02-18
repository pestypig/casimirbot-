import crypto from "node:crypto";
import type { HelixAskGraphPack } from "./graph-resolver";

export type RelationAssemblyEvidence = {
  evidence_id: string;
  path: string;
  span: string;
  snippet: string;
  domain: "warp" | "ethos" | "other";
  provenance_class?: "measured" | "proxy" | "inferred";
  claim_tier?: "diagnostic" | "reduced-order" | "certified";
  certifying?: boolean;
};

export type RelationAssemblyPacket = {
  question: string;
  domains: string[];
  fail_reason?:
    | "IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_MISSING"
    | "IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_CONTRADICTORY";
  definitions: {
    warp_definition: string;
    ethos_definition: string;
  };
  bridge_claims: string[];
  constraints: string[];
  falsifiability_hooks: string[];
  evidence: RelationAssemblyEvidence[];
  source_map: Record<string, string>;
};

export type RelationTopologySignal = {
  relationIntent: boolean;
  dualDomainAnchors: boolean;
  crossDomainBridge: boolean;
  missingAnchors: string[];
};

const WARP_ANCHOR_RE =
  /(^|\/)(docs\/knowledge\/warp\/|docs\/knowledge\/physics\/|modules\/warp\/|server\/routes\/warp-viability\.ts|server\/gr\/)/i;
const ETHOS_ANCHOR_RE = /(^|\/)(docs\/ethos\/|docs\/knowledge\/ethos\/|server\/routes\/ethos\.ts)/i;

const clip = (value: string, max = 260): string => value.replace(/\s+/g, " ").trim().slice(0, max).trim();

const sanitizeSnippet = (value: string): string =>
  value
    .replace(/\(see\s+[^\)]*\)/gi, " ")
    .replace(/\b(?:Doc|Title|Heading|Subheading|Section|Span|Code|Test):\s*[^.]+(?:\.)?/gi, " ")
    .replace(
      /\b(?:id|slug|label|aliases|scope|intenthints|topictags|mustincludefiles|version|rootid|nodes|children)\s*:\s*[^,;]+/gi,
      " ",
    )
    .replace(/(^|\s)---(\s|$)/g, " ")
    .replace(/\{[^{}]*\}/g, " ")
    .replace(/[{}[\]"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const detectDomain = (path: string, snippet = ""): "warp" | "ethos" | "other" => {
  const hay = `${path}\n${snippet}`;
  if (WARP_ANCHOR_RE.test(hay) || /\b(warp|bubble|alcubierre|natario|quantum inequality|constraint gate)\b/i.test(hay)) {
    return "warp";
  }
  if (ETHOS_ANCHOR_RE.test(hay) || /\b(ethos|ideology|mission|stewardship|verification-based diplomacy)\b/i.test(hay)) {
    return "ethos";
  }
  return "other";
};

const buildEvidenceId = (path: string, span: string): string => {
  const digest = crypto.createHash("sha1").update(`${path}:${span}`).digest("hex").slice(0, 10);
  return `ev_${digest}`;
};

const toCitation = (path: string, span: string): string => `${path}${span ? `#${span}` : ""}`;

type BridgeEvidenceContract = {
  provenance_class?: "measured" | "proxy" | "inferred";
  claim_tier?: "diagnostic" | "reduced-order" | "certified";
  certifying?: boolean;
};

const isBridgeEvidenceContractComplete = (entry: BridgeEvidenceContract): boolean =>
  Boolean(entry.provenance_class && entry.claim_tier && typeof entry.certifying === "boolean");

const hasBridgeEvidenceContractContradiction = (entry: BridgeEvidenceContract): boolean => {
  if (!isBridgeEvidenceContractComplete(entry)) return false;
  if (entry.certifying === true && entry.claim_tier !== "certified") return true;
  if (entry.certifying === true && entry.provenance_class !== "measured") return true;
  return false;
};

const bridgeEvidenceContractFingerprint = (entry: BridgeEvidenceContract): string =>
  [entry.provenance_class ?? "__missing__", entry.claim_tier ?? "__missing__", String(entry.certifying)].join("|");

const firstSentence = (text: string, fallback: string): string => {
  const first = text.split(/(?<=[.!?])\s+/)[0] ?? "";
  const normalized = clip(sanitizeSnippet(first), 220);
  if (normalized) return normalized;
  const fallbackSanitized = clip(sanitizeSnippet(fallback), 220);
  return fallbackSanitized || fallback;
};

export function resolveRelationTopologySignal(args: {
  question: string;
  relationIntent: boolean;
  contextFiles: string[];
  graphPack: HelixAskGraphPack | null;
}): RelationTopologySignal {
  const files = Array.from(new Set((args.contextFiles ?? []).map((entry) => String(entry || "").trim()).filter(Boolean))).sort();
  const hasWarpAnchor = files.some((entry) => WARP_ANCHOR_RE.test(entry));
  const hasEthosAnchor = files.some((entry) => ETHOS_ANCHOR_RE.test(entry));
  const graphBridge = (args.graphPack?.frameworks ?? []).some((framework) => {
    const nodes = framework.path ?? [];
    const hasWarpNode = nodes.some((node) => detectDomain(node.sourcePath ?? framework.sourcePath, node.title ?? node.excerpt ?? "") === "warp");
    const hasEthosNode = nodes.some((node) => detectDomain(node.sourcePath ?? framework.sourcePath, node.title ?? node.excerpt ?? "") === "ethos");
    return hasWarpNode && hasEthosNode;
  });
  const dualDomainAnchors = hasWarpAnchor && hasEthosAnchor;
  const missingAnchors: string[] = [];
  if (!hasWarpAnchor) missingAnchors.push("warp");
  if (!hasEthosAnchor) missingAnchors.push("ethos");
  return {
    relationIntent: args.relationIntent,
    dualDomainAnchors,
    crossDomainBridge: graphBridge || dualDomainAnchors,
    missingAnchors,
  };
}

export function buildRelationAssemblyPacket(args: {
  question: string;
  contextFiles: string[];
  contextText: string;
  docBlocks: Array<{ path: string; block: string }>;
  graphPack: HelixAskGraphPack | null;
  strictBridgeEvidence?: boolean;
}): RelationAssemblyPacket {
  const evidenceSeed: Array<{ path: string; block: string }> = [];
  for (const block of args.docBlocks ?? []) {
    if (block?.path && block?.block) evidenceSeed.push({ path: block.path, block: block.block });
  }
  for (const path of args.contextFiles ?? []) {
    if (typeof path === "string" && path.trim()) {
      evidenceSeed.push({ path, block: args.contextText || "" });
    }
  }
  const graphEvidenceContracts: BridgeEvidenceContract[] = [];
  const graphEvidenceContractsByPath = new Map<string, Set<string>>();
  for (const framework of args.graphPack?.frameworks ?? []) {
    for (const node of framework.path ?? []) {
      const sourcePath = node.sourcePath ?? framework.sourcePath;
      if (sourcePath) {
        evidenceSeed.push({ path: sourcePath, block: `${node.title ?? ""}. ${node.summary ?? node.excerpt ?? ""}` });
      }
      if (node.nodeType !== "bridge") continue;
      for (const evidence of node.evidence ?? []) {
        const evidencePath = typeof evidence.path === "string" ? evidence.path.trim() : "";
        if (!evidencePath) continue;
        const contract: BridgeEvidenceContract = {
          provenance_class: evidence.provenance_class,
          claim_tier: evidence.claim_tier,
          certifying: evidence.certifying,
        };
        graphEvidenceContracts.push(contract);

        if (!graphEvidenceContractsByPath.has(evidencePath)) {
          graphEvidenceContractsByPath.set(evidencePath, new Set<string>());
        }
        graphEvidenceContractsByPath.get(evidencePath)?.add(bridgeEvidenceContractFingerprint(contract));
      }
    }
  }

  const dedup = new Map<string, RelationAssemblyEvidence>();
  for (const item of evidenceSeed) {
    const path = String(item.path || "").trim();
    if (!path) continue;
    const domain = detectDomain(path, item.block);
    if (domain === "other") continue;
    const span = "L1-L1";
    const evidence_id = buildEvidenceId(path, span);
    if (dedup.has(evidence_id)) continue;
    const bridgeContractSet = graphEvidenceContractsByPath.get(path);
    const bridgeContract =
      bridgeContractSet && bridgeContractSet.size === 1
        ? (() => {
            const [provenance_class, claim_tier, certifying] = Array.from(bridgeContractSet)[0]!.split("|");
            return {
              provenance_class: provenance_class === "__missing__" ? undefined : (provenance_class as BridgeEvidenceContract["provenance_class"]),
              claim_tier: claim_tier === "__missing__" ? undefined : (claim_tier as BridgeEvidenceContract["claim_tier"]),
              certifying: certifying === "undefined" ? undefined : certifying === "true",
            };
          })()
        : undefined;
    dedup.set(evidence_id, {
      evidence_id,
      path,
      span,
      snippet: firstSentence(item.block, path),
      domain,
      provenance_class: bridgeContract?.provenance_class,
      claim_tier: bridgeContract?.claim_tier,
      certifying: bridgeContract?.certifying,
    });
  }

  const evidence = Array.from(dedup.values()).sort((a, b) =>
    a.domain.localeCompare(b.domain) || a.path.localeCompare(b.path) || a.evidence_id.localeCompare(b.evidence_id),
  );
  const warpEvidence = evidence.filter((entry) => entry.domain === "warp");
  const ethosEvidence = evidence.filter((entry) => entry.domain === "ethos");

  const warpDefinition = warpEvidence[0]?.snippet || "A warp bubble is a modeled spacetime geometry with strict constraint gates and verification bounds.";
  const ethosDefinition = ethosEvidence[0]?.snippet || "Mission ethos is the stewardship policy layer that constrains capability claims to verified, non-harmful operation.";

  const bridge_claims = [
    "Mission ethos constrains warp development to measured, auditable checkpoints before deployment.",
    "Warp viability certificates enable ethos commitments by binding claims to reproducible evidence.",
    "Verification hooks translate design ambition into falsifiable tests across physics and policy layers.",
  ].slice(0, 6);

  const constraints = [
    "Physics bounds: Ford-Roman QI, theta calibration, and GR constraint gates must pass before viability claims.",
    "Policy bounds: mission ethos requires stewardship, non-harm, and traceable evidence for operational decisions.",
  ];

  const falsifiability_hooks = [
    "Re-run /api/agi/adapter/run with updated action payload and require PASS with certificate integrity OK.",
    "Reject relation explanations when citations collapse to one domain or when bridge claims are not evidence-backed.",
  ];

  const source_map = Object.fromEntries(evidence.map((entry) => [entry.evidence_id, toCitation(entry.path, entry.span)]));
  const domainSet = new Set<string>();
  if (warpEvidence.length > 0) domainSet.add("warp");
  if (ethosEvidence.length > 0) domainSet.add("ethos");

  const strictBridgeEvidence = args.strictBridgeEvidence === true;
  const hasBridgeEvidenceMetadataGap = graphEvidenceContracts.some((entry) => !isBridgeEvidenceContractComplete(entry));
  const hasBridgeEvidenceContractContradictionAny =
    graphEvidenceContracts.some((entry) => hasBridgeEvidenceContractContradiction(entry)) ||
    Array.from(graphEvidenceContractsByPath.values()).some((fingerprints) => fingerprints.size > 1);

  return {
    question: args.question,
    domains: Array.from(domainSet).sort(),
    fail_reason:
      strictBridgeEvidence && hasBridgeEvidenceContractContradictionAny
        ? "IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_CONTRADICTORY"
        : strictBridgeEvidence && hasBridgeEvidenceMetadataGap
          ? "IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_MISSING"
          : undefined,
    definitions: {
      warp_definition: warpDefinition,
      ethos_definition: ethosDefinition,
    },
    bridge_claims,
    constraints,
    falsifiability_hooks,
    evidence,
    source_map,
  };
}

export function renderRelationAssemblyFallback(packet: RelationAssemblyPacket): string {
  const sources = Object.values(packet.source_map);
  return [
    `What is warp bubble: ${packet.definitions.warp_definition}`,
    `What is mission ethos: ${packet.definitions.ethos_definition}`,
    `How they connect: ${packet.bridge_claims.slice(0, 3).join(" ")}`,
    `Constraints and falsifiability: ${packet.constraints.join(" ")} ${packet.falsifiability_hooks[0] ?? ""}`,
    sources.length > 0 ? `Sources: ${sources.slice(0, 8).join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n")
    .trim();
}
