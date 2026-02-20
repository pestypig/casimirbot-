import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const packagePath = process.argv.includes("--package")
  ? process.argv[process.argv.indexOf("--package") + 1]
  : "reports/helix-decision-package.json";
const reportPath = "reports/helix-decision-validate.json";

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(path.resolve(ROOT, filePath), "utf8"));
}

function exists(filePath: string): boolean {
  return fs.existsSync(path.resolve(ROOT, filePath));
}

function isUtilityAbSummary(obj: any): boolean {
  return (
    obj &&
    typeof obj === "object" &&
    obj.summary_schema_version === 2 &&
    typeof obj.novel_response_rate === "number" &&
    obj.novel_response_rate_by_family &&
    typeof obj.novel_response_rate_by_family.relation === "number" &&
    typeof obj.novel_response_rate_by_family.repo_technical === "number" &&
    typeof obj.novel_response_rate_by_family.ambiguous_general === "number"
  );
}

const failures: string[] = [];
let pkg: any = null;
try {
  pkg = readJson(packagePath);
} catch (err) {
  failures.push(`package_unreadable:${String(err)}`);
}

if (pkg) {
  const requiredTop = [
    "schema_version",
    "generated_at",
    "evaluation_tier",
    "git",
    "runs",
    "gates",
    "novelty",
    "provenance",
    "casimir",
    "artifacts",
    "decision",
  ];
  for (const key of requiredTop) {
    if (!(key in pkg)) failures.push(`missing_field:${key}`);
  }

  if (!Array.isArray(pkg.gates)) {
    failures.push("gates_not_array");
  } else {
    for (const gate of pkg.gates) {
      if (!gate?.source_path || typeof gate.source_path !== "string") failures.push(`metric_missing_source:${gate?.name ?? "unknown"}`);
      else if (!exists(gate.source_path)) failures.push(`source_path_missing:${gate.name}:${gate.source_path}`);
    }
  }

  for (const [key, entry] of Object.entries(pkg.novelty ?? {})) {
    if (!entry || typeof (entry as any).source_path !== "string") {
      failures.push(`novelty_missing_source:${key}`);
      continue;
    }
    if (!exists((entry as any).source_path)) {
      failures.push(`novelty_source_missing:${key}:${(entry as any).source_path}`);
      continue;
    }
    try {
      const source = readJson((entry as any).source_path);
      if (!isUtilityAbSummary(source)) failures.push(`novelty_wrong_source_format:${key}:${(entry as any).source_path}`);
    } catch (err) {
      failures.push(`novelty_source_unreadable:${key}:${String(err)}`);
    }
  }

  if (!Array.isArray(pkg.artifacts)) {
    failures.push("artifacts_not_array");
  } else {
    for (const art of pkg.artifacts) {
      const liveExists = exists(art.path);
      if (art.exists === true && !liveExists) failures.push(`artifact_exists_true_but_missing:${art.path}`);
      if (art.exists === false && liveExists) failures.push(`artifact_exists_false_but_present:${art.path}`);
    }
  }

  if (pkg.evaluation_tier === "decision_grade") {
    if (!(pkg.casimir?.verdict === "PASS" && pkg.casimir?.integrityOk === true)) {
      failures.push("decision_grade_requires_casimir_pass_integrity");
    }
    if (!(pkg.provenance?.pass === true)) {
      failures.push("decision_grade_requires_provenance_pass");
    }

    const heavyGate = (pkg.gates ?? []).find((g: any) => g.name === "provenance_gate_pass");
    if (heavyGate?.source_path && exists(heavyGate.source_path)) {
      const heavy = readJson(heavyGate.source_path);
      const p = heavy?.provenance;
      if (p && typeof p === "object") {
        const mismatch: string[] = [];
        if ((p.branch ?? null) !== (pkg.git.branch ?? null)) mismatch.push("branch");
        if ((p.head ?? null) !== (pkg.git.head ?? null)) mismatch.push("head");
        if ((p.originMain ?? null) !== (pkg.git.origin_main ?? null)) mismatch.push("origin_main");
        const ab = p.aheadBehind ?? null;
        if (
          (ab?.ahead ?? null) !== (pkg.git.ahead_behind?.ahead ?? null) ||
          (ab?.behind ?? null) !== (pkg.git.ahead_behind?.behind ?? null)
        ) {
          mismatch.push("ahead_behind");
        }
        if (mismatch.length > 0) failures.push(`decision_grade_git_provenance_mismatch:${mismatch.join(",")}`);
      }
    }
  }
}

const out = {
  ok: failures.length === 0,
  package_path: packagePath,
  failures,
  failure_count: failures.length,
};
fs.mkdirSync(path.resolve(ROOT, "reports"), { recursive: true });
fs.writeFileSync(path.resolve(ROOT, reportPath), `${JSON.stringify(out, null, 2)}\n`);
if (!out.ok) {
  console.log(JSON.stringify(out, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(out, null, 2));
