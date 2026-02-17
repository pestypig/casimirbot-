import fs from "node:fs";
import path from "node:path";

type Checklist = {
  schema_version?: string;
  kind?: string;
  tree_dag_guardrails?: {
    required_defaults?: Record<string, unknown>;
  };
  major_context_areas?: Array<{ id?: string }>;
  required_tests?: string[];
  execution_steps?: Array<{ id?: string }>;
  claim_tiers?: Array<{ tier?: string }>;
  verification_contract?: {
    casimir_verify_required?: boolean;
    certificate_required_for_certified?: boolean;
  };
};

const repoRoot = process.cwd();
const errors: string[] = [];

const CHECKLIST_PATH = path.resolve(
  process.env.AGENT_CONTEXT_CHECKLIST_PATH ??
    path.join("docs", "audits", "helix-agent-context-checklist-2026-02-17.json"),
);
const WARP_AGENTS_PATH = path.resolve(
  process.env.WARP_AGENTS_PATH ?? path.join(repoRoot, "WARP_AGENTS.md"),
);

const REQUIRED_DEFAULTS = {
  allowedCL: "CL4",
  allowConceptual: false,
  allowProxies: false,
  chart: "comoving_cartesian",
  seedOrder: "lex",
  walkMode: "bfs",
};

const REQUIRED_CONTEXT_IDS = [
  "gr_policy_fallback",
  "proof_pack_contract",
  "curvature_unit_contract",
  "gr_os_actions",
  "certificate_drift_recheck",
  "constraint_pack_policy_profiles",
  "ts_autoscale_semantics",
];

const REQUIRED_STEP_IDS = [
  "select_scope",
  "validate_policy_source",
  "update_contract_then_runtime",
  "maintain_proof_pack_parity",
  "enforce_curvature_contract",
  "run_required_tests",
  "run_casimir_verify",
  "record_policy_profile_context",
  "emit_artifact_bundle",
  "assign_claim_tier",
];

const REQUIRED_TIERS = ["diagnostic", "reduced-order", "certified"];

function fail(message: string) {
  errors.push(message);
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

function parseWarpAgentsRequiredTests(markdown: string): string[] {
  const match = markdown.match(/```json\s+warp-agents\s*([\s\S]*?)```/i);
  if (!match) {
    throw new Error("No `json warp-agents` block found in WARP_AGENTS.md.");
  }
  const parsed = JSON.parse(match[1]) as { requiredTests?: unknown };
  if (!Array.isArray(parsed.requiredTests)) {
    throw new Error("WARP_AGENTS requiredTests is missing or invalid.");
  }
  return parsed.requiredTests
    .map((value) => String(value))
    .filter((value) => value.length > 0);
}

function validateChecklist(checklist: Checklist) {
  if (checklist.schema_version !== "helix_agent_context_checklist/1") {
    fail(
      `schema_version must be helix_agent_context_checklist/1 (received ${String(checklist.schema_version)}).`,
    );
  }
  if (checklist.kind !== "agent_execution_checklist") {
    fail(`kind must be agent_execution_checklist (received ${String(checklist.kind)}).`);
  }

  const defaults = checklist.tree_dag_guardrails?.required_defaults ?? {};
  for (const [key, expected] of Object.entries(REQUIRED_DEFAULTS)) {
    if ((defaults as Record<string, unknown>)[key] !== expected) {
      fail(
        `tree_dag_guardrails.required_defaults.${key} must be ${JSON.stringify(expected)}.`,
      );
    }
  }

  const contextIds = new Set(
    (checklist.major_context_areas ?? [])
      .map((entry) => entry.id)
      .filter((value): value is string => typeof value === "string" && value.length > 0),
  );
  for (const id of REQUIRED_CONTEXT_IDS) {
    if (!contextIds.has(id)) {
      fail(`major_context_areas missing required id: ${id}`);
    }
  }

  const stepIds = new Set(
    (checklist.execution_steps ?? [])
      .map((entry) => entry.id)
      .filter((value): value is string => typeof value === "string" && value.length > 0),
  );
  for (const id of REQUIRED_STEP_IDS) {
    if (!stepIds.has(id)) {
      fail(`execution_steps missing required id: ${id}`);
    }
  }

  const tiers = new Set(
    (checklist.claim_tiers ?? [])
      .map((entry) => entry.tier)
      .filter((value): value is string => typeof value === "string" && value.length > 0),
  );
  for (const tier of REQUIRED_TIERS) {
    if (!tiers.has(tier)) {
      fail(`claim_tiers missing required tier: ${tier}`);
    }
  }

  const requiredTests = checklist.required_tests ?? [];
  if (!Array.isArray(requiredTests) || requiredTests.length === 0) {
    fail("required_tests must be a non-empty array.");
  }

  if (checklist.verification_contract?.casimir_verify_required !== true) {
    fail("verification_contract.casimir_verify_required must be true.");
  }
  if (checklist.verification_contract?.certificate_required_for_certified !== true) {
    fail("verification_contract.certificate_required_for_certified must be true.");
  }
}

function validateRequiredTestsParity(checklistTests: string[], warpTests: string[]) {
  const checklistSet = new Set(checklistTests);
  const warpSet = new Set(warpTests);

  const missingFromChecklist = [...warpSet].filter((entry) => !checklistSet.has(entry));
  const extraInChecklist = [...checklistSet].filter((entry) => !warpSet.has(entry));

  if (missingFromChecklist.length > 0) {
    fail(
      `required_tests missing entries from WARP_AGENTS: ${missingFromChecklist.join(", ")}`,
    );
  }
  if (extraInChecklist.length > 0) {
    fail(
      `required_tests has entries not present in WARP_AGENTS: ${extraInChecklist.join(", ")}`,
    );
  }
}

function main() {
  if (!fileExists(CHECKLIST_PATH)) {
    fail(`Checklist file not found: ${CHECKLIST_PATH}`);
  }
  if (!fileExists(WARP_AGENTS_PATH)) {
    fail(`WARP agents file not found: ${WARP_AGENTS_PATH}`);
  }
  if (errors.length > 0) {
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  const checklistRaw = fs.readFileSync(CHECKLIST_PATH, "utf8");
  const checklist = JSON.parse(checklistRaw) as Checklist;
  validateChecklist(checklist);

  const checklistTests = (checklist.required_tests ?? [])
    .map((entry) => String(entry))
    .filter((entry) => entry.length > 0);

  const warpRaw = fs.readFileSync(WARP_AGENTS_PATH, "utf8");
  const warpTests = parseWarpAgentsRequiredTests(warpRaw);
  validateRequiredTestsParity(checklistTests, warpTests);

  if (errors.length > 0) {
    console.error("agent-context-checklist validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(
    `agent-context-checklist validation OK. checklist_tests=${checklistTests.length} warp_tests=${warpTests.length}`,
  );
}

main();
