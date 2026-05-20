import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

type CheckLevel = "failure" | "warning";

type CheckMessage = {
  level: CheckLevel;
  code: string;
  message: string;
  file?: string;
};

const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check-only");
const runFull = args.has("--run-full");
const runRequired = args.has("--run-required") || (!checkOnly && !runFull);
const strict = args.has("--strict");
const force = args.has("--force");

const repoRoot = process.cwd();
const codexRoot = path.join(repoRoot, "external", "openai-codex-compare");
const codexReferenceFiles = [
  "codex-rs/core/src/session/turn.rs",
  "codex-rs/mcp-server/src/codex_tool_runner.rs",
  "codex-rs/core/src/exec.rs",
];

const sensitivePathPatterns = [
  /^server\/routes\/agi\.plan\.ts$/,
  /^server\/services\/helix-ask\//,
  /^server\/__tests__\/helix\.ask/,
  /^scripts\/helix-ask/,
  /^client\/src\/lib\/agi\//,
  /^client\/src\/store\/useLiveAnswerEnvironmentStore\.ts$/,
  /^client\/src\/components\/helix\//,
  /^client\/src\/components\/workstation\/LiveAnswerEnvironmentPanel\.tsx$/,
];

const sourceCodePatterns = [
  /^server\/routes\//,
  /^server\/services\/helix-ask\//,
  /^scripts\/helix-ask/,
  /^client\/src\//,
];

const classificationKeywords: Array<[string, RegExp]> = [
  ["prompt interpretation", /prompt-interpretation|prompt_interpretation|contextual_tool_mentions|negative_constraints/i],
  ["intent arbitration", /intent-arbitration|intent-hypothesis|intent_arbitration|intent_hypotheses|selected_primary_intent/i],
  ["source admission", /source-target|source_admission|source_target|live-source-identity|visual_capture/i],
  ["tool admission", /tool-admission|tool_admission|actual_tool_calls|mutating/i],
  ["evidence normalization", /evidence_selection|evidence_results|artifact_ledger|provenance/i],
  ["evidence re-entry", /evidence-reentry|evidence_reentry|receipts_reentered|selected_evidence_refs/i],
  ["follow-up reasoning", /followup|follow-up|reasoning_followup|post_evidence_reasoning/i],
  ["terminal authority", /terminal_authority|route-authority|route_authority|route_product|terminal_artifact_kind|typed_failure/i],
  ["presentation", /presentation|finalAnswer|LiveAnswerEnvironment|visibleAnswerState/i],
  ["Codex-owned runtime behavior", /sampling|sandbox|approval|subagent|compaction|session lifecycle|tool execution runtime/i],
];

function normalizePath(value: string): string {
  return value.trim().replace(/\\/g, "/");
}

function commandName(name: string): string {
  return process.platform === "win32" ? `${name}.cmd` : name;
}

function runText(command: string, commandArgs: string[], cwd = repoRoot): string {
  const result = spawnSync(command, commandArgs, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) return "";
  return String(result.stdout ?? "");
}

function gitLines(commandArgs: string[]): string[] {
  return runText("git", commandArgs)
    .split(/\r?\n/)
    .map(normalizePath)
    .filter(Boolean);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function isSensitive(file: string): boolean {
  return sensitivePathPatterns.some((pattern) => pattern.test(file));
}

function isSourceCode(file: string): boolean {
  return sourceCodePatterns.some((pattern) => pattern.test(file)) && !file.includes("__tests__/");
}

function fileExists(file: string): boolean {
  return existsSync(path.join(repoRoot, file));
}

function readUtf8(file: string): string | null {
  const absolute = path.join(repoRoot, file);
  if (!existsSync(absolute)) return null;
  const stat = statSync(absolute);
  if (!stat.isFile() || stat.size > 1_500_000) return null;
  return readFileSync(absolute, "utf8");
}

function inferClassifications(files: string[]): string[] {
  const labels = new Set<string>();
  for (const file of files) {
    const content = readUtf8(file) ?? "";
    const haystack = `${file}\n${content}`;
    for (const [label, pattern] of classificationKeywords) {
      if (pattern.test(haystack)) labels.add(label);
    }
  }
  return [...labels];
}

function checkCodexReference(messages: CheckMessage[], hasSensitiveChanges: boolean): void {
  if (!hasSensitiveChanges) return;
  if (!existsSync(codexRoot)) {
    messages.push({
      level: process.env.HELIX_ASK_DISCIPLINE_ALLOW_MISSING_CODEX === "1" ? "warning" : "failure",
      code: "codex_reference_missing",
      message:
        "Missing external/openai-codex-compare. Helix Ask discipline checks require the ignored Codex runtime reference checkout.",
    });
    return;
  }

  for (const refFile of codexReferenceFiles) {
    if (!existsSync(path.join(codexRoot, refFile))) {
      messages.push({
        level: "failure",
        code: "codex_reference_file_missing",
        message: `Missing Codex reference file ${refFile}.`,
      });
    }
  }
}

function scanFiles(files: string[], messages: CheckMessage[]): void {
  for (const file of files) {
    if (!fileExists(file)) continue;
    if (!isSourceCode(file)) continue;
    if (file === "scripts/helix-ask-discipline-check.ts") continue;

    const content = readUtf8(file);
    if (content == null) continue;

    if (/\bassistant_answer\s*:\s*true\b/.test(content)) {
      messages.push({
        level: "failure",
        code: "assistant_answer_true_in_helix_source",
        file,
        message:
          "Helix Ask trace/evidence artifacts must not claim assistant_answer=true. Only terminal presentation may become visible text.",
      });
    }

    if (/\braw_content_included\s*:\s*true\b/.test(content)) {
      messages.push({
        level: "failure",
        code: "raw_content_included_true_in_helix_source",
        file,
        message: "Helix Ask debug and evidence artifacts must not include raw content by default.",
      });
    }

    if (/\ballow_no_tool_direct\s*:\s*true\b/.test(content)) {
      messages.push({
        level: "warning",
        code: "allow_no_tool_direct_touched",
        file,
        message:
          "Review any allow_no_tool_direct change against hard source-target rules. Hard source-targeted turns must not fall back to no_tool_direct.",
      });
    }

    if (/\blive_pipeline_receipt\b/.test(content)) {
      messages.push({
        level: "warning",
        code: "live_pipeline_receipt_touched",
        file,
        message:
          "Receipts are observations, not answers. Confirm this path is pure control/status or guarded by solver arbitration and re-entry.",
      });
    }

    if (/\b(model_only_concept|client_projection|panel_generated_answer|process_graph_overview)\b/.test(content)) {
      messages.push({
        level: "warning",
        code: "shortcut_terminal_product_touched",
        file,
        message:
          "Shortcut-like terminal products must be suppressed for hard source-targeted and complex prompts unless route authority explicitly allows them.",
      });
    }
  }
}

function runCommand(label: string, command: string, commandArgs: string[]): boolean {
  console.log(`\n[helix:ask:discipline] ${label}`);
  console.log(`> ${command} ${commandArgs.join(" ")}`);
  const result =
    process.platform === "win32"
      ? spawnSync([command, ...commandArgs].map(quoteWindowsShellArg).join(" "), {
          cwd: repoRoot,
          encoding: "utf8",
          shell: true,
          stdio: "inherit",
        })
      : spawnSync(command, commandArgs, {
          cwd: repoRoot,
          encoding: "utf8",
          stdio: "inherit",
        });
  if (result.status === 0) return true;
  if (result.error) console.error(result.error.message);
  console.error(`[helix:ask:discipline] failed: ${label}`);
  return false;
}

function quoteWindowsShellArg(value: string): string {
  if (/^[A-Za-z0-9_./:=@-]+$/.test(value)) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}

function printMessages(messages: CheckMessage[]): void {
  for (const message of messages) {
    const prefix = message.level === "failure" ? "FAIL" : "WARN";
    const location = message.file ? ` ${message.file}` : "";
    console.log(`[${prefix}] ${message.code}${location}: ${message.message}`);
  }
}

const changedFiles = unique([
  ...gitLines(["diff", "--name-only"]),
  ...gitLines(["diff", "--name-only", "--cached"]),
  ...gitLines(["ls-files", "--others", "--exclude-standard"]),
]).sort();
const sensitiveFiles = changedFiles.filter(isSensitive);
const classificationFiles = sensitiveFiles.filter((file) => file !== "scripts/helix-ask-discipline-check.ts");
const messages: CheckMessage[] = [];

checkCodexReference(messages, sensitiveFiles.length > 0);
scanFiles(sensitiveFiles, messages);

const inferredClassifications = inferClassifications(classificationFiles);
const declaredClassification = process.env.HELIX_ASK_DISCIPLINE_CLASSIFICATION?.trim();
if (sensitiveFiles.length > 0 && !declaredClassification) {
  messages.push({
    level: strict ? "failure" : "warning",
    code: "classification_not_declared",
    message:
      "Set HELIX_ASK_DISCIPLINE_CLASSIFICATION for patch review, or record the inferred categories in the handoff.",
  });
}

const codexHead = existsSync(codexRoot) ? runText("git", ["rev-parse", "--short", "HEAD"], codexRoot).trim() : "missing";

console.log("[helix:ask:discipline] Codex discipline guard");
console.log(`repo: ${repoRoot}`);
console.log(`codex_reference: external/openai-codex-compare (${codexHead || "unknown"})`);
console.log(`changed_files: ${changedFiles.length}`);
console.log(`sensitive_helix_ask_files: ${sensitiveFiles.length}`);
if (sensitiveFiles.length > 0) {
  for (const file of sensitiveFiles) console.log(`  - ${file}`);
}
console.log(
  `classification: ${
    declaredClassification || (inferredClassifications.length ? inferredClassifications.join(", ") : "none inferred")
  }`,
);

printMessages(messages);

const failures = messages.filter((message) => message.level === "failure");
if (failures.length > 0) {
  console.error(`\n[helix:ask:discipline] failed static discipline checks: ${failures.length}`);
  process.exit(1);
}

if (sensitiveFiles.length === 0 && !force) {
  console.log("[helix:ask:discipline] no Helix Ask-sensitive changes detected; skipping test battery");
  process.exit(0);
}

if (checkOnly) {
  console.log("[helix:ask:discipline] static checks passed");
  process.exit(0);
}

const testCommands: Array<[string, string, string[]]> = [
  [
    "prompt-solving adversarial benchmark",
    commandName("npx"),
    ["vitest", "run", "server/__tests__/helix.ask.prompt-solving-benchmark.test.ts", "--pool=forks"],
  ],
  [
    "API parity matrix",
    commandName("npx"),
    ["vitest", "run", "server/__tests__/helix.ask.api-parity-matrix.test.ts", "--pool=forks"],
  ],
];

if (runFull) {
  testCommands.push(
    [
      "live source continuation routing",
      commandName("npx"),
      ["vitest", "run", "server/__tests__/helix.ask.turn.live-source-continuation-routing.test.ts", "--pool=forks"],
    ],
    [
      "live source identity audit",
      commandName("npx"),
      ["vitest", "run", "server/__tests__/helix.ask.live-source-identity-audit.test.ts", "--pool=forks"],
    ],
  );
}

if (runRequired || runFull) {
  testCommands.push(["server build", commandName("npm"), ["run", "build:server"]]);
}

for (const [label, command, commandArgs] of testCommands) {
  if (!runCommand(label, command, commandArgs)) process.exit(1);
}

console.log("\n[helix:ask:discipline] passed");
