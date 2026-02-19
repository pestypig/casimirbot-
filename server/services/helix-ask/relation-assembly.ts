import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
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
    | "IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_CONTRADICTORY"
    | "EVIDENCE_FALSIFIER_LEDGER_CONTRACT_MISSING"
    | "EVIDENCE_FALSIFIER_LEDGER_CONTRACT_CONTRADICTORY"
    | "RUNTIME_SAFETY_GATE_MISSING_DATA"
    | "RUNTIME_SAFETY_GATE_OUT_OF_BOUNDS"
    | "FAIL_CROSS_LANE_MISSING_UNCERTAINTY_MODEL"
    | "FAIL_MATURITY_CEILING_VIOLATION";
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

type RuntimeSafetyGateValidation = {
  referenced: boolean;
  pass: boolean;
  failReason?: "RUNTIME_SAFETY_GATE_MISSING_DATA" | "RUNTIME_SAFETY_GATE_OUT_OF_BOUNDS"
    | "FAIL_CROSS_LANE_MISSING_UNCERTAINTY_MODEL"
    | "FAIL_MATURITY_CEILING_VIOLATION";
  summary?: string;
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
  path?: string;
  provenance_class?: "measured" | "proxy" | "inferred";
  claim_tier?: "diagnostic" | "reduced-order" | "certified";
  certifying?: boolean;
};

type BridgeEvidenceStrictFailReason =
  | "IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_MISSING"
  | "IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_CONTRADICTORY"
  | "EVIDENCE_FALSIFIER_LEDGER_CONTRACT_MISSING"
  | "EVIDENCE_FALSIFIER_LEDGER_CONTRACT_CONTRADICTORY"
  | undefined;

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

const classifyStrictBridgeEvidenceFailure = (
  contracts: BridgeEvidenceContract[],
  options?: { requireStrongEvidence?: boolean; evidenceFalsifierLane?: boolean },
): BridgeEvidenceStrictFailReason => {
  const canonical = [...contracts].sort(
    (a, b) =>
      (a.path ?? "").localeCompare(b.path ?? "") ||
      bridgeEvidenceContractFingerprint(a).localeCompare(bridgeEvidenceContractFingerprint(b)),
  );
  const byPath = new Map<string, Set<string>>();
  let hasGap = false;
  let hasIntrinsicContradiction = false;

  for (const contract of canonical) {
    const path = contract.path?.trim();
    const fingerprint = bridgeEvidenceContractFingerprint(contract);
    if (path) {
      if (!byPath.has(path)) {
        byPath.set(path, new Set<string>());
      }
      byPath.get(path)?.add(fingerprint);
    }
    hasGap ||= !isBridgeEvidenceContractComplete(contract);
    hasIntrinsicContradiction ||= hasBridgeEvidenceContractContradiction(contract);
  }

  const hasPathCollision = Array.from(byPath.values()).some((fingerprints) => fingerprints.size > 1);
  const hasStrongEvidence = canonical.some(
    (contract) => contract.certifying === true && contract.provenance_class === "measured" && contract.claim_tier === "certified",
  );
  const missingReason = options?.evidenceFalsifierLane
    ? "EVIDENCE_FALSIFIER_LEDGER_CONTRACT_MISSING"
    : "IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_MISSING";
  const contradictoryReason = options?.evidenceFalsifierLane
    ? "EVIDENCE_FALSIFIER_LEDGER_CONTRACT_CONTRADICTORY"
    : "IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_CONTRADICTORY";
  if (hasIntrinsicContradiction || hasPathCollision) {
    return contradictoryReason;
  }
  if (hasGap) {
    return missingReason;
  }
  if (options?.requireStrongEvidence && !hasStrongEvidence) {
    return missingReason;
  }
  return undefined;
};

export const __testOnlyClassifyStrictBridgeEvidenceFailure = classifyStrictBridgeEvidenceFailure;

const RUNTIME_SAFETY_GATE_THRESHOLDS = {
  determinism_min: 0.98,
  citation_min: 0.95,
  non_200_max: 0.02,
  latency_p95_max_ms: 1200,
} as const;

const TOE_RUNTIME_MANIFEST = "configs/physics-root-leaf-manifest.v1.json";

const roundResidual = (value: number): string => (Object.is(value, -0) ? 0 : value).toFixed(4);

const resolveRuntimeSafetyGateValidation = (candidatePaths: string[]): RuntimeSafetyGateValidation => {
  const hasManifestRef = candidatePaths.some((entry) => path.normalize(entry) === path.normalize(TOE_RUNTIME_MANIFEST));
  if (!hasManifestRef) {
    return { referenced: false, pass: true };
  }

  const fullPath = path.resolve(process.cwd(), TOE_RUNTIME_MANIFEST);
  if (!fs.existsSync(fullPath)) {
    return {
      referenced: true,
      pass: false,
      failReason: "RUNTIME_SAFETY_GATE_MISSING_DATA",
      summary: "runtime_safety_gate residuals=missing_manifest",
    };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch {
    return {
      referenced: true,
      pass: false,
      failReason: "RUNTIME_SAFETY_GATE_MISSING_DATA",
      summary: "runtime_safety_gate residuals=invalid_manifest_json",
    };
  }

  const runtimeRoots = new Set(
    (Array.isArray(parsed?.roots) ? parsed.roots : [])
      .filter((root: any) => String(root?.id ?? "").trim() === "physics_runtime_safety_control")
      .map((root: any) => String(root?.id ?? "").trim())
      .filter(Boolean),
  );
  const runtimePaths = (Array.isArray(parsed?.paths) ? parsed.paths : [])
    .filter((entry: any) => {
      const model = String(entry?.falsifier?.uncertainty_model ?? "").trim();
      const referencesRuntimeRoot =
        runtimeRoots.has(String(entry?.root_id ?? "")) ||
        (Array.isArray(entry?.nodes) && entry.nodes.some((node: string) => runtimeRoots.has(String(node ?? ""))));
      return referencesRuntimeRoot || /runtime_gate_thresholds\(/i.test(model);
    })
    .map((entry: any) => ({
      id: String(entry?.id ?? "").trim(),
      model: String(entry?.falsifier?.uncertainty_model ?? "").trim(),
    }))
    .filter((entry: { id: string; model: string }) => Boolean(entry.id));

  if (runtimePaths.length === 0) {
    return {
      referenced: true,
      pass: false,
      failReason: "RUNTIME_SAFETY_GATE_MISSING_DATA",
      summary: "runtime_safety_gate residuals=missing_runtime_paths",
    };
  }

  const summaries: string[] = [];
  for (const entry of runtimePaths.sort((a, b) => a.id.localeCompare(b.id))) {
    const match = entry.model.match(/runtime_gate_thresholds\(([^)]*)\)/i);
    if (!match) {
      return {
        referenced: true,
        pass: false,
        failReason: "RUNTIME_SAFETY_GATE_MISSING_DATA",
        summary: `runtime_safety_gate residuals=${entry.id}:missing_uncertainty_model`,
      };
    }
    const thresholds = Object.fromEntries(
      match[1]
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
          const [rawKey, rawValue] = part.split("=").map((p) => p.trim());
          return [rawKey, Number(rawValue)];
        }),
    ) as Record<string, number>;

    for (const [key, expected] of Object.entries(RUNTIME_SAFETY_GATE_THRESHOLDS)) {
      const actual = thresholds[key];
      if (!Number.isFinite(actual)) {
        return {
          referenced: true,
          pass: false,
          failReason: "RUNTIME_SAFETY_GATE_MISSING_DATA",
          summary: `runtime_safety_gate residuals=${entry.id}:${key}=missing`,
        };
      }
      const residual = Number((actual - expected).toFixed(6));
      if (key.endsWith("_min") && actual < expected) {
        return {
          referenced: true,
          pass: false,
          failReason: "RUNTIME_SAFETY_GATE_OUT_OF_BOUNDS",
          summary: `runtime_safety_gate residuals=${entry.id}:${key}=${actual}<${expected} (delta=${roundResidual(residual)})`,
        };
      }
      if (key.endsWith("_max") && actual > expected) {
        return {
          referenced: true,
          pass: false,
          failReason: "RUNTIME_SAFETY_GATE_OUT_OF_BOUNDS",
          summary: `runtime_safety_gate residuals=${entry.id}:${key}=${actual}>${expected} (delta=${roundResidual(residual)})`,
        };
      }
      summaries.push(`${entry.id}:${key}=${actual} (delta=${roundResidual(residual)})`);
    }
  }

  return {
    referenced: true,
    pass: true,
    summary: `runtime_safety_gate residuals=${summaries.join("; ")}`,
  };
};

export const __testOnlyResolveRuntimeSafetyGateValidation = resolveRuntimeSafetyGateValidation;

type CrossLaneUncertaintyValidation = {
  referenced: boolean;
  pass: boolean;
  failReason?: "FAIL_CROSS_LANE_MISSING_UNCERTAINTY_MODEL";
  summary?: string;
};

const TOE_CONGRUENCE_MATRIX = "configs/math-congruence-matrix.v1.json";

const resolveCrossLaneUncertaintyValidation = (): CrossLaneUncertaintyValidation => {
  const fullPath = path.resolve(process.cwd(), TOE_CONGRUENCE_MATRIX);
  if (!fs.existsSync(fullPath)) {
    return { referenced: true, pass: false, failReason: "FAIL_CROSS_LANE_MISSING_UNCERTAINTY_MODEL", summary: "cross_lane_uncertainty=missing_matrix" };
  }
  let parsed: any;
  try {
    parsed = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch {
    return { referenced: true, pass: false, failReason: "FAIL_CROSS_LANE_MISSING_UNCERTAINTY_MODEL", summary: "cross_lane_uncertainty=invalid_matrix_json" };
  }
  const rows = Array.isArray(parsed?.rows) ? parsed.rows : [];
  const scoped = rows.filter((row: any) => row?.runtime_safety_eligible === true || row?.cross_lane_bridge === true);
  if (scoped.length === 0) return { referenced: false, pass: true };
  const missing = scoped
    .filter((row: any) => typeof row?.uncertainty_model_id !== "string" || !row.uncertainty_model_id.trim())
    .map((row: any) => String(row?.id ?? "unknown"));
  if (missing.length > 0) {
    return {
      referenced: true,
      pass: false,
      failReason: "FAIL_CROSS_LANE_MISSING_UNCERTAINTY_MODEL",
      summary: `cross_lane_uncertainty=missing_uncertainty_model_id:${missing.sort((a,b)=>a.localeCompare(b)).join(",")}`,
    };
  }
  return {
    referenced: true,
    pass: true,
    summary: `cross_lane_uncertainty=ok:${scoped.map((row: any)=>String(row.id)).sort((a,b)=>a.localeCompare(b)).join(",")}`,
  };
};

export const __testOnlyResolveCrossLaneUncertaintyValidation = resolveCrossLaneUncertaintyValidation;

type MaturityCeilingValidation = {
  referenced: boolean;
  pass: boolean;
  failReason?: "FAIL_MATURITY_CEILING_VIOLATION";
  summary?: string;
};

const TOE_ROOT_LEAF_MANIFEST = "configs/physics-root-leaf-manifest.v1.json";
const CLAIM_TIER_ORDER: Record<string, number> = {
  diagnostic: 1,
  "reduced-order": 2,
  certified: 3,
};

const resolveMaturityCeilingValidation = (evidence: RelationAssemblyEvidence[]): MaturityCeilingValidation => {
  const fullPath = path.resolve(process.cwd(), TOE_ROOT_LEAF_MANIFEST);
  if (!fs.existsSync(fullPath)) {
    return { referenced: true, pass: false, failReason: "FAIL_MATURITY_CEILING_VIOLATION", summary: "maturity_ceiling=missing_manifest" };
  }
  let parsed: any;
  try {
    parsed = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch {
    return { referenced: true, pass: false, failReason: "FAIL_MATURITY_CEILING_VIOLATION", summary: "maturity_ceiling=invalid_manifest_json" };
  }
  const policy = parsed?.maturity_propagation_policy;
  if (!policy || policy.enabled !== true || policy.no_over_promotion !== true) {
    return { referenced: false, pass: true };
  }
  const maxTier = String(policy.default_max_claim_tier ?? parsed?.claim_tier_ceiling ?? "diagnostic").trim();
  const maxOrder = CLAIM_TIER_ORDER[maxTier] ?? CLAIM_TIER_ORDER.diagnostic;
  const violations = evidence
    .filter((entry) => typeof entry.claim_tier === "string")
    .filter((entry) => (CLAIM_TIER_ORDER[String(entry.claim_tier)] ?? CLAIM_TIER_ORDER.diagnostic) > maxOrder)
    .map((entry) => `${entry.evidence_id}:${entry.claim_tier}`)
    .sort((a, b) => a.localeCompare(b));
  if (violations.length > 0) {
    return {
      referenced: true,
      pass: false,
      failReason: "FAIL_MATURITY_CEILING_VIOLATION",
      summary: `maturity_ceiling=violations(max=${maxTier}):${violations.join(",")}`,
    };
  }
  return { referenced: true, pass: true, summary: `maturity_ceiling=ok(max=${maxTier})` };
};

export const __testOnlyResolveMaturityCeilingValidation = resolveMaturityCeilingValidation;



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


export type RelationPacketFloorCheck = {
  ok: boolean;
  bridgeCount: number;
  evidenceCount: number;
  failReason?: "bridge_count_low" | "evidence_count_low";
};

export function evaluateRelationPacketFloors(
  packet: RelationAssemblyPacket | null,
  floors: { minBridges: number; minEvidence: number },
): RelationPacketFloorCheck {
  const bridgeCount = packet?.bridge_claims?.length ?? 0;
  const evidenceCount = packet?.evidence?.length ?? 0;
  if (bridgeCount < floors.minBridges) {
    return { ok: false, bridgeCount, evidenceCount, failReason: "bridge_count_low" };
  }
  if (evidenceCount < floors.minEvidence) {
    return { ok: false, bridgeCount, evidenceCount, failReason: "evidence_count_low" };
  }
  return { ok: true, bridgeCount, evidenceCount };
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
          path: evidencePath,
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
  const evidenceFalsifierLane = (args.graphPack?.treeIds ?? []).includes("evidence-falsifier-ledger");
  const requireStrongBridgeEvidence = /\b(life|origin(?:s)? of life|abiogenesis|cosmology|consciousness|open-world|universe produce life)\b/i.test(
    args.question,
  );
  const strictFailReason = classifyStrictBridgeEvidenceFailure(graphEvidenceContracts, {
    requireStrongEvidence: requireStrongBridgeEvidence,
    evidenceFalsifierLane,
  });
  const runtimeValidation = resolveRuntimeSafetyGateValidation([
    ...new Set(evidenceSeed.map((entry) => String(entry.path || "").trim()).filter(Boolean)),
  ]);
  if (runtimeValidation.referenced && runtimeValidation.summary) {
    falsifiability_hooks.push(runtimeValidation.summary);
  }
  const crossLaneUncertaintyValidation = resolveCrossLaneUncertaintyValidation();
  if (crossLaneUncertaintyValidation.referenced && crossLaneUncertaintyValidation.summary) {
    falsifiability_hooks.push(crossLaneUncertaintyValidation.summary);
  }
  const maturityCeilingValidation = resolveMaturityCeilingValidation(evidence);
  if (maturityCeilingValidation.referenced && maturityCeilingValidation.summary) {
    falsifiability_hooks.push(maturityCeilingValidation.summary);
  }
  const failReason = strictBridgeEvidence
    ? strictFailReason
    : runtimeValidation.referenced && !runtimeValidation.pass
      ? runtimeValidation.failReason
      : crossLaneUncertaintyValidation.referenced && !crossLaneUncertaintyValidation.pass
        ? crossLaneUncertaintyValidation.failReason
        : maturityCeilingValidation.referenced && !maturityCeilingValidation.pass
          ? maturityCeilingValidation.failReason
          : undefined;

  return {
    question: args.question,
    domains: Array.from(domainSet).sort(),
    fail_reason: failReason,
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
