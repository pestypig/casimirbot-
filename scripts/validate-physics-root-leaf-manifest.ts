import fs from "node:fs";
import path from "node:path";

type RootEntry = {
  id?: string;
  name?: string;
  equation_refs?: string[];
};

type LeafEntry = {
  id?: string;
  prompt_family?: string;
  statement?: string;
};

type PathFalsifier = {
  observable?: string;
  reject_rule?: string;
  uncertainty_model?: string;
  test_refs?: string[];
};

type PathMaturityGate = {
  max_claim_tier?: string;
  required_evidence_types?: string[];
  strict_fail_reason?: string;
};

type PathEntry = {
  id?: string;
  root_id?: string;
  leaf_id?: string;
  nodes?: string[];
  dag_bridges?: string[];
  falsifier?: PathFalsifier;
  maturity_gate?: PathMaturityGate;
};

type PhysicsRootLeafManifest = {
  schema_version?: string;
  manifest_id?: string;
  claim_tier_ceiling?: string;
  roots?: RootEntry[];
  leaves?: LeafEntry[];
  paths?: PathEntry[];
};

export type ValidationResult = {
  ok: boolean;
  errors: string[];
};

const REQUIRED_SCHEMA = "physics_root_leaf_manifest/1";
const ALLOWED_CLAIM_TIERS = ["diagnostic", "reduced-order", "certified"] as const;
const REQUIRED_ROOT_IDS = [
  "physics_spacetime_gr",
  "physics_quantum_semiclassical",
  "physics_thermodynamics_entropy",
  "physics_information_dynamics",
  "physics_prebiotic_chemistry",
  "physics_biology_life",
  "physics_runtime_safety_control",
];

function parseFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index < 0 || index + 1 >= process.argv.length) {
    return undefined;
  }
  return process.argv[index + 1];
}

function tierRank(value: string): number {
  switch (value) {
    case "diagnostic":
      return 0;
    case "reduced-order":
      return 1;
    case "certified":
      return 2;
    default:
      return -1;
  }
}

function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function validatePhysicsRootLeafManifest(options?: {
  manifestPath?: string;
  repoRoot?: string;
}): ValidationResult {
  const repoRoot = path.resolve(options?.repoRoot ?? process.cwd());
  const manifestPath = path.resolve(
    repoRoot,
    options?.manifestPath ?? path.join("configs", "physics-root-leaf-manifest.v1.json"),
  );

  if (!fs.existsSync(manifestPath)) {
    return { ok: false, errors: [`manifest not found: ${path.relative(repoRoot, manifestPath)}`] };
  }

  let manifest: PhysicsRootLeafManifest;
  try {
    manifest = readJson<PhysicsRootLeafManifest>(manifestPath);
  } catch (error) {
    return { ok: false, errors: [`invalid manifest JSON: ${String(error)}`] };
  }

  const errors: string[] = [];

  if (manifest.schema_version !== REQUIRED_SCHEMA) {
    errors.push(`schema_version must be ${REQUIRED_SCHEMA}`);
  }

  const ceiling =
    typeof manifest.claim_tier_ceiling === "string" ? manifest.claim_tier_ceiling.trim() : "";
  if (!ALLOWED_CLAIM_TIERS.includes(ceiling as (typeof ALLOWED_CLAIM_TIERS)[number])) {
    errors.push(`claim_tier_ceiling must be one of ${ALLOWED_CLAIM_TIERS.join("|")}`);
  }

  const roots = Array.isArray(manifest.roots) ? manifest.roots : [];
  const leaves = Array.isArray(manifest.leaves) ? manifest.leaves : [];
  const paths = Array.isArray(manifest.paths) ? manifest.paths : [];

  if (roots.length === 0) {
    errors.push("roots must contain at least one entry");
  }
  if (leaves.length === 0) {
    errors.push("leaves must contain at least one entry");
  }
  if (paths.length === 0) {
    errors.push("paths must contain at least one entry");
  }

  const rootIds = new Set<string>();
  roots.forEach((entry, index) => {
    const id = typeof entry.id === "string" ? entry.id.trim() : "";
    const loc = `roots[${index}]`;
    if (!id) {
      errors.push(`${loc}.id is required`);
      return;
    }
    if (rootIds.has(id)) {
      errors.push(`${loc}.id duplicated: ${id}`);
    }
    rootIds.add(id);
    if (typeof entry.name !== "string" || entry.name.trim().length === 0) {
      errors.push(`${loc}.name is required`);
    }
  });

  for (const requiredRoot of REQUIRED_ROOT_IDS) {
    if (!rootIds.has(requiredRoot)) {
      errors.push(`missing required root id: ${requiredRoot}`);
    }
  }

  const leafIds = new Set<string>();
  leaves.forEach((entry, index) => {
    const id = typeof entry.id === "string" ? entry.id.trim() : "";
    const loc = `leaves[${index}]`;
    if (!id) {
      errors.push(`${loc}.id is required`);
      return;
    }
    if (leafIds.has(id)) {
      errors.push(`${loc}.id duplicated: ${id}`);
    }
    leafIds.add(id);
    if (typeof entry.prompt_family !== "string" || entry.prompt_family.trim().length === 0) {
      errors.push(`${loc}.prompt_family is required`);
    }
    if (typeof entry.statement !== "string" || entry.statement.trim().length === 0) {
      errors.push(`${loc}.statement is required`);
    }
  });

  const coveredLeaves = new Set<string>();
  const pathIds = new Set<string>();

  paths.forEach((entry, index) => {
    const loc = `paths[${index}]`;
    const id = typeof entry.id === "string" ? entry.id.trim() : "";
    if (!id) {
      errors.push(`${loc}.id is required`);
    } else if (pathIds.has(id)) {
      errors.push(`${loc}.id duplicated: ${id}`);
    } else {
      pathIds.add(id);
    }

    const rootId = typeof entry.root_id === "string" ? entry.root_id.trim() : "";
    const leafId = typeof entry.leaf_id === "string" ? entry.leaf_id.trim() : "";
    if (!rootId || !rootIds.has(rootId)) {
      errors.push(`${loc}.root_id must reference a declared root`);
    }
    if (!leafId || !leafIds.has(leafId)) {
      errors.push(`${loc}.leaf_id must reference a declared leaf`);
    } else {
      coveredLeaves.add(leafId);
    }

    const nodes = normalizeList(entry.nodes);
    if (nodes.length < 2) {
      errors.push(`${loc}.nodes must include at least [root,...,leaf]`);
    } else {
      if (rootId && nodes[0] !== rootId) {
        errors.push(`${loc}.nodes must start with root_id`);
      }
      if (leafId && nodes[nodes.length - 1] !== leafId) {
        errors.push(`${loc}.nodes must end with leaf_id`);
      }
    }

    const bridges = normalizeList(entry.dag_bridges);
    if (bridges.length === 0) {
      errors.push(`${loc}.dag_bridges must be non-empty`);
    }

    const falsifier = entry.falsifier ?? {};
    if (typeof falsifier.observable !== "string" || falsifier.observable.trim().length === 0) {
      errors.push(`${loc}.falsifier.observable is required`);
    }
    if (typeof falsifier.reject_rule !== "string" || falsifier.reject_rule.trim().length === 0) {
      errors.push(`${loc}.falsifier.reject_rule is required`);
    }
    if (
      typeof falsifier.uncertainty_model !== "string" ||
      falsifier.uncertainty_model.trim().length === 0
    ) {
      errors.push(`${loc}.falsifier.uncertainty_model is required`);
    }
    const testRefs = normalizeList(falsifier.test_refs);
    if (testRefs.length === 0) {
      errors.push(`${loc}.falsifier.test_refs must be non-empty`);
    }

    const maturityGate = entry.maturity_gate ?? {};
    const maxClaimTier =
      typeof maturityGate.max_claim_tier === "string" ? maturityGate.max_claim_tier.trim() : "";
    if (!ALLOWED_CLAIM_TIERS.includes(maxClaimTier as (typeof ALLOWED_CLAIM_TIERS)[number])) {
      errors.push(`${loc}.maturity_gate.max_claim_tier must be one of ${ALLOWED_CLAIM_TIERS.join("|")}`);
    } else if (tierRank(maxClaimTier) > tierRank(ceiling)) {
      errors.push(`${loc}.maturity_gate.max_claim_tier cannot exceed claim_tier_ceiling`);
    }

    const evidenceTypes = normalizeList(maturityGate.required_evidence_types);
    if (evidenceTypes.length === 0) {
      errors.push(`${loc}.maturity_gate.required_evidence_types must be non-empty`);
    }

    if (
      typeof maturityGate.strict_fail_reason !== "string" ||
      maturityGate.strict_fail_reason.trim().length === 0
    ) {
      errors.push(`${loc}.maturity_gate.strict_fail_reason is required`);
    }
  });

  for (const leafId of leafIds) {
    if (!coveredLeaves.has(leafId)) {
      errors.push(`leaf not covered by any root-to-leaf path: ${leafId}`);
    }
  }

  const hasEntropyFirstLifePath = paths.some((entry) => {
    const rootId = typeof entry.root_id === "string" ? entry.root_id.trim() : "";
    const leafId = typeof entry.leaf_id === "string" ? entry.leaf_id.trim() : "";
    const nodes = normalizeList(entry.nodes);
    if (rootId !== "physics_thermodynamics_entropy") return false;
    if (leafId !== "leaf_universe_produces_life") return false;
    const lifeNodeIndex = nodes.indexOf("physics_biology_life");
    return lifeNodeIndex > 0 && nodes[0] === "physics_thermodynamics_entropy";
  });
  if (!hasEntropyFirstLifePath) {
    errors.push(
      "paths must include at least one canonical entropy-first path ending at leaf_universe_produces_life",
    );
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

function main() {
  const manifestPath = parseFlag("--manifest");
  const result = validatePhysicsRootLeafManifest({ manifestPath });

  if (!result.ok) {
    console.error("physics-root-leaf-manifest validation failed:");
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("physics-root-leaf-manifest validation OK");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
