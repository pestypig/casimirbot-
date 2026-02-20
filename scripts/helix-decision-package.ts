import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

type JsonRecord = Record<string, unknown>;

type Gate = {
  name: string;
  value: number | boolean | string | null;
  threshold: number | boolean;
  comparator: string;
  pass: boolean;
  source_path: string;
};

const ROOT = process.cwd();
const REPORT_JSON = "reports/helix-decision-package.json";
const REPORT_MD = "reports/helix-decision-package.md";

const args = new Map<string, string>();
for (let i = 2; i < process.argv.length; i += 1) {
  const token = process.argv[i];
  if (!token.startsWith("--")) continue;
  const key = token.slice(2);
  const value = process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[++i] : "true";
  args.set(key, value);
}

function opt(name: string, fallback?: string): string {
  return args.get(name) ?? process.env[name.toUpperCase().replace(/-/g, "_")] ?? fallback ?? "";
}

function readJson(filePath: string): JsonRecord {
  const abs = path.resolve(ROOT, filePath);
  const raw = fs.readFileSync(abs, "utf8");
  return JSON.parse(raw) as JsonRecord;
}

function git(cmd: string): string | null {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

function fileMeta(filePath: string) {
  const abs = path.resolve(ROOT, filePath);
  if (!fs.existsSync(abs)) {
    return { path: filePath, exists: false, sha256: null, size_bytes: null, mtime_iso: null };
  }
  const buf = fs.readFileSync(abs);
  const st = fs.statSync(abs);
  return {
    path: filePath,
    exists: true,
    sha256: crypto.createHash("sha256").update(buf).digest("hex"),
    size_bytes: st.size,
    mtime_iso: st.mtime.toISOString(),
  };
}

function asNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

const evaluationTier = (opt("evaluation-tier", "decision_grade") === "exploratory" ? "exploratory" : "decision_grade") as
  | "exploratory"
  | "decision_grade";

const narrowPath = opt("narrow", "reports/helix-self-tune-gate-summary.json");
const heavyPath = opt("heavy", "artifacts/experiments/helix-step4-heavy-rerun/versatility-1771558290390/summary.json");
const heavyRecommendationPath = opt(
  "heavy-recommendation",
  "artifacts/experiments/helix-step4-heavy-rerun/versatility-1771558290390/recommendation.json",
);
const abT02Path = opt("ab-t02", "artifacts/experiments/helix-step4-ab-rerun/t02/helix_step4_rerun_t02/summary.json");
const abT035Path = opt("ab-t035", "artifacts/experiments/helix-step4-ab-rerun/t035/helix_step4_rerun_t035/summary.json");
const casimirPath = opt("casimir", "reports/helix-self-tune-casimir.json");

const narrow = readJson(narrowPath);
const heavy = readJson(heavyPath);
const heavyRec = readJson(heavyRecommendationPath);
const abT02 = readJson(abT02Path);
const abT035 = readJson(abT035Path);
const casimir = readJson(casimirPath);

const strictGates = (narrow.strict_gates ?? {}) as JsonRecord;
const heavyQuality = ((heavy.quality_rollup ?? heavy.metrics) ?? {}) as JsonRecord;
const heavyProvenance = (heavy.provenance ?? {}) as JsonRecord;

const gateDefs: Array<[string, number | boolean, string, unknown, string]> = [
  ["relation_packet_built_rate", 0.95, ">=", heavyQuality.relation_packet_built_rate ?? strictGates.relation_packet_built_rate, heavyPath],
  [
    "relation_dual_domain_ok_rate",
    0.95,
    ">=",
    heavyQuality.relation_dual_domain_ok_rate ?? strictGates.relation_dual_domain_ok_rate,
    heavyPath,
  ],
  ["report_mode_correct_rate", 0.98, ">=", heavyQuality.report_mode_correct_rate ?? strictGates.report_mode_correct_rate, heavyPath],
  ["citation_presence_rate", 0.99, ">=", heavyQuality.citation_presence_rate ?? strictGates.citation_presence_rate, heavyPath],
  ["stub_text_detected_rate", 0, "==", heavyQuality.stub_text_detected_rate ?? strictGates.stub_text_detected_rate, heavyPath],
  ["runtime_fallback_answer", 0, "==", strictGates.runtime_fallback_answer, narrowPath],
  ["runtime_tdz_intentStrategy", 0, "==", strictGates.runtime_tdz_intentStrategy, narrowPath],
  ["runtime_tdz_intentProfile", 0, "==", strictGates.runtime_tdz_intentProfile, narrowPath],
  ["provenance_gate_pass", true, "==", heavyProvenance.gate_pass, heavyPath],
  ["decision_grade_ready", true, "==", heavyRec.decision_grade_ready, heavyRecommendationPath],
  ["casimir_verdict_pass_integrity", true, "==", casimir.verdict === "PASS" && casimir.integrityOk === true, casimirPath],
];

const gates: Gate[] = gateDefs.map(([name, threshold, comparator, raw, source_path]) => {
  const value = typeof threshold === "number" ? asNumber(raw) : typeof raw === "boolean" ? raw : raw == null ? null : String(raw);
  let pass = false;
  if (typeof threshold === "number" && typeof value === "number") {
    pass = comparator === ">=" ? value >= threshold : value === threshold;
  } else if (typeof threshold === "boolean" && typeof value === "boolean") {
    pass = value === threshold;
  }
  return { name, value, threshold, comparator, pass, source_path };
});

function noveltyFrom(summary: JsonRecord, sourcePath: string) {
  const byFamily = (summary.novel_response_rate_by_family ?? {}) as JsonRecord;
  const overall = asNumber(summary.novel_response_rate) ?? -1;
  const relation = asNumber(byFamily.relation) ?? -1;
  const repoTechnical = asNumber(byFamily.repo_technical) ?? -1;
  const ambiguous = asNumber(byFamily.ambiguous_general) ?? -1;
  const target = 0.82;
  return {
    overall,
    by_family: {
      relation,
      repo_technical: repoTechnical,
      ambiguous_general: ambiguous,
    },
    target,
    pass: overall >= target && relation >= target && repoTechnical >= target && ambiguous >= target,
    source_path: sourcePath,
  };
}

const novelty = {
  t02: noveltyFrom(abT02, abT02Path),
  t035: noveltyFrom(abT035, abT035Path),
};

const branch = git("git rev-parse --abbrev-ref HEAD") ?? "unknown";
const head = git("git rev-parse --short HEAD") ?? "unknown";
const originMain = git("git rev-parse --short origin/main");
const aheadBehindRaw = git("git rev-list --left-right --count origin/main...HEAD");
const aheadBehind = aheadBehindRaw
  ? (() => {
      const [behind, ahead] = aheadBehindRaw.split(/\s+/).map((v) => Number(v));
      return Number.isFinite(ahead) && Number.isFinite(behind) ? { ahead, behind } : null;
    })()
  : null;

const allArtifacts = [
  narrowPath,
  heavyPath,
  heavyRecommendationPath,
  abT02Path,
  abT035Path,
  casimirPath,
  "schemas/helix-decision-package.schema.json",
];

const artifacts = allArtifacts.map(fileMeta);
const hardBlockers = [
  ...gates.filter((g) => !g.pass).map((g) => `${g.name} failed (${String(g.value)} ${g.comparator} ${String(g.threshold)})`),
  ...(novelty.t02.pass ? [] : ["novelty.t02 below target >=0.82"]),
  ...(novelty.t035.pass ? [] : ["novelty.t035 below target >=0.82"]),
  ...artifacts.filter((a) => !a.exists).map((a) => `missing artifact: ${a.path}`),
];

const provenancePass = (heavyProvenance.gate_pass as boolean) === true;
const pkg = {
  schema_version: "1.0.0",
  generated_at: new Date().toISOString(),
  evaluation_tier: evaluationTier,
  git: {
    branch,
    head,
    origin_main: originMain,
    ahead_behind: aheadBehind,
  },
  runs: {
    narrow: String((narrow.precheck_run_id ?? narrow.run_id ?? "") || "") || null,
    heavy: String((heavy.run_id ?? "") || "") || null,
    ab_t02: String((abT02.run_id ?? "") || "") || null,
    ab_t035: String((abT035.run_id ?? "") || "") || null,
    casimir: String((casimir.runId ?? casimir.run_id ?? "") || "") || null,
  },
  gates,
  novelty,
  provenance: {
    pass: provenancePass,
    blocked_reason: provenancePass ? null : "provenance gate failed in heavy summary",
    warnings: Array.isArray(heavyProvenance.warnings) ? (heavyProvenance.warnings as string[]) : [],
  },
  casimir: {
    verdict: String(casimir.verdict ?? "UNKNOWN"),
    traceId: (casimir.traceId as string | undefined) ?? null,
    runId: String(casimir.runId ?? casimir.run_id ?? "") || null,
    certificateHash: String(casimir.certificateHash ?? casimir.certificate_hash ?? "") || null,
    integrityOk: casimir.integrityOk === true,
    source_path: casimirPath,
  },
  artifacts,
  decision: {
    value: hardBlockers.length === 0 ? "GO" : "NO-GO",
    hard_blockers: hardBlockers,
    reasoning: ["All metrics are sourced from machine JSON artifacts.", "Markdown report is rendered from this package JSON."],
  },
  report_paths: {
    json: REPORT_JSON,
    markdown: REPORT_MD,
  },
};

const md = [
  "# Helix Decision Package",
  "",
  `- generated_at: ${pkg.generated_at}`,
  `- evaluation_tier: ${pkg.evaluation_tier}`,
  `- decision: ${pkg.decision.value}`,
  "",
  "## Gates",
  "",
  "| gate | value | threshold | pass | source |",
  "| --- | ---: | ---: | :---: | --- |",
  ...pkg.gates.map((g) => `| ${g.name} | ${String(g.value)} | ${g.comparator} ${String(g.threshold)} | ${g.pass ? "✅" : "❌"} | ${g.source_path} |`),
  "",
  "## Novelty",
  "",
  `- t02 overall=${pkg.novelty.t02.overall} relation=${pkg.novelty.t02.by_family.relation} repo=${pkg.novelty.t02.by_family.repo_technical} ambiguous=${pkg.novelty.t02.by_family.ambiguous_general} target=${pkg.novelty.t02.target} pass=${pkg.novelty.t02.pass}`,
  `- t035 overall=${pkg.novelty.t035.overall} relation=${pkg.novelty.t035.by_family.relation} repo=${pkg.novelty.t035.by_family.repo_technical} ambiguous=${pkg.novelty.t035.by_family.ambiguous_general} target=${pkg.novelty.t035.target} pass=${pkg.novelty.t035.pass}`,
  "",
  "## Hard blockers",
  "",
  ...(pkg.decision.hard_blockers.length === 0 ? ["- none"] : pkg.decision.hard_blockers.map((b) => `- ${b}`)),
].join("\n");

fs.mkdirSync(path.resolve(ROOT, "reports"), { recursive: true });
fs.writeFileSync(path.resolve(ROOT, REPORT_JSON), `${JSON.stringify(pkg, null, 2)}\n`);
fs.writeFileSync(path.resolve(ROOT, REPORT_MD), `${md}\n`);
console.log(JSON.stringify({ ok: true, output: REPORT_JSON, decision: pkg.decision.value, blockers: pkg.decision.hard_blockers }, null, 2));
