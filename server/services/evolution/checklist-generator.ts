import crypto from "node:crypto";
import type { EvolutionChecklist } from "@shared/evolution-schema";

const READ_RULES: Array<{ pattern: RegExp; read: string; test?: string }> = [
  { pattern: /^server\//, read: "AGENTS.md", test: "npm test" },
  { pattern: /^docs\//, read: "docs/helix-ask-flow.md" },
  { pattern: /^server\/gr\//, read: "WARP_AGENTS.md", test: "npm run casimir:verify" },
  { pattern: /^shared\//, read: "shared/essence-schema.ts" },
];

const uniqSort = (arr: string[]) => Array.from(new Set(arr)).sort();

export function generateChecklistAddendum(input: { patchId: string; touchedPaths: string[]; intentTags?: string[] }): EvolutionChecklist & { stableHash: string } {
  const mandatoryReads: string[] = [];
  const requiredTests: string[] = [];

  for (const p of uniqSort(input.touchedPaths)) {
    for (const rule of READ_RULES) {
      if (rule.pattern.test(p)) {
        mandatoryReads.push(rule.read);
        if (rule.test) requiredTests.push(rule.test);
      }
    }
  }

  const artifact: EvolutionChecklist = {
    schema_version: "helix_agent_patch_checklist_addendum/1",
    patchId: input.patchId,
    intentTags: uniqSort(input.intentTags ?? []),
    mandatory_reads: uniqSort(mandatoryReads),
    required_tests: uniqSort(requiredTests),
    verification_hooks: ["casimir_verify_required"],
    agent_steps: ["collect_context", "run_checks", "report_citations"],
    notes: ["deterministic_generation=true", "generator_version=1"],
  };

  const stableHash = crypto.createHash("sha256").update(JSON.stringify(artifact)).digest("hex");
  return { ...artifact, stableHash };
}
