import fs from "node:fs/promises";
import path from "node:path";
import Ajv from "ajv";
import {
  PAPER_CANONICAL_RULES,
  PAPER_CANONICAL_TREE_FILES,
} from "./paper-framework-binding.js";

type CliOptions = {
  reportPath: string;
  schemaPath: string;
};

type ValidationIssue = {
  code: string;
  message: string;
  path?: string;
};

type ReportExecutableCandidate = {
  file_path?: unknown;
  symbol?: unknown;
};

type ReportExecutableMapping = {
  canonical_id?: unknown;
  implementation_candidates?: unknown;
};

type ReportCanonicalBinding = {
  canonical_id?: unknown;
  local_id?: unknown;
};

type ReportCitationLink = {
  claim_id?: unknown;
  citation_id?: unknown;
};

type ReportLike = {
  claims?: Array<{ claim_id?: unknown }>;
  citations?: Array<{ citation_id?: unknown }>;
  citation_links?: ReportCitationLink[];
  canonical_bindings?: ReportCanonicalBinding[];
  executable_mappings?: ReportExecutableMapping[];
};

const DEFAULT_SCHEMA_PATH = "schemas/paper-gpt-pro-report.schema.json";

function parseArgs(argv: string[]): CliOptions {
  const args = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const raw = argv[i];
    if (!raw.startsWith("--")) continue;
    const key = raw.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args.set(key, "1");
      continue;
    }
    args.set(key, next);
    i += 1;
  }

  const reportPath = args.get("report")?.trim();
  if (!reportPath) {
    throw new Error("Missing --report <path-to-gpt-report.json>");
  }
  const schemaPath = args.get("schema")?.trim() || DEFAULT_SCHEMA_PATH;
  return { reportPath, schemaPath };
}

async function readJson<T>(relativeOrAbsolutePath: string): Promise<T> {
  const absolute = path.resolve(relativeOrAbsolutePath);
  const raw = await fs.readFile(absolute, "utf8");
  return JSON.parse(raw) as T;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function knownCanonicalIds(): Promise<Set<string>> {
  const ids = new Set<string>(PAPER_CANONICAL_RULES.map((entry) => entry.canonicalId));
  for (const treePath of PAPER_CANONICAL_TREE_FILES) {
    try {
      const tree = await readJson<{ nodes?: Array<{ id?: unknown }> }>(treePath);
      for (const node of tree.nodes ?? []) {
        const nodeId = asString(node.id);
        if (nodeId) ids.add(nodeId);
      }
    } catch {
      // keep base rule ids
    }
  }
  return ids;
}

async function runSemanticChecks(report: ReportLike): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  const knownCanonical = await knownCanonicalIds();
  const claimIds = new Set(
    Array.isArray(report.claims)
      ? report.claims
          .map((entry) => asString(entry.claim_id))
          .filter((entry): entry is string => entry !== null)
      : [],
  );
  const citationIds = new Set(
    Array.isArray(report.citations)
      ? report.citations
          .map((entry) => asString(entry.citation_id))
          .filter((entry): entry is string => entry !== null)
      : [],
  );

  for (const [idx, binding] of (report.canonical_bindings ?? []).entries()) {
    const canonicalId = asString(binding.canonical_id);
    const localId = asString(binding.local_id);
    if (!canonicalId) continue;
    if (!knownCanonical.has(canonicalId)) {
      issues.push({
        code: "unknown_canonical_id",
        message: `canonical_bindings[${idx}].canonical_id is not in known canonical rules: ${canonicalId}`,
        path: `/canonical_bindings/${idx}/canonical_id`,
      });
    }
    if (localId && !claimIds.has(localId)) {
      // local_id may point to concept/system/equation IDs and not claim IDs.
      // This is a warning-only signal for review quality.
      if (!/^((concept|system|eq|var|unit|def|asm|model|paper):)/.test(localId)) {
        issues.push({
          code: "suspicious_local_id",
          message: `canonical_bindings[${idx}].local_id does not match known claim or ingest ID prefixes: ${localId}`,
          path: `/canonical_bindings/${idx}/local_id`,
        });
      }
    }
  }

  for (const [idx, link] of (report.citation_links ?? []).entries()) {
    const claimId = asString(link.claim_id);
    const citationId = asString(link.citation_id);
    if (claimId && !claimIds.has(claimId)) {
      issues.push({
        code: "citation_link_missing_claim",
        message: `citation_links[${idx}] references missing claim_id: ${claimId}`,
        path: `/citation_links/${idx}/claim_id`,
      });
    }
    if (citationId && !citationIds.has(citationId)) {
      issues.push({
        code: "citation_link_missing_citation",
        message: `citation_links[${idx}] references missing citation_id: ${citationId}`,
        path: `/citation_links/${idx}/citation_id`,
      });
    }
  }

  for (const [mapIdx, mapping] of (report.executable_mappings ?? []).entries()) {
    const canonicalId = asString(mapping.canonical_id);
    if (canonicalId && !knownCanonical.has(canonicalId)) {
      issues.push({
        code: "unknown_executable_mapping_canonical_id",
        message: `executable_mappings[${mapIdx}].canonical_id not in known canonical rules: ${canonicalId}`,
        path: `/executable_mappings/${mapIdx}/canonical_id`,
      });
    }
    const candidates = Array.isArray(mapping.implementation_candidates)
      ? (mapping.implementation_candidates as ReportExecutableCandidate[])
      : [];
    for (const [candIdx, candidate] of candidates.entries()) {
      const filePath = asString(candidate.file_path);
      const symbol = asString(candidate.symbol);
      if (!filePath) continue;
      try {
        await fs.access(path.resolve(filePath));
      } catch {
        issues.push({
          code: "missing_implementation_file",
          message: `implementation candidate path does not exist: ${filePath}`,
          path: `/executable_mappings/${mapIdx}/implementation_candidates/${candIdx}/file_path`,
        });
      }
      if (!symbol) {
        issues.push({
          code: "missing_implementation_symbol",
          message: "implementation candidate symbol is empty",
          path: `/executable_mappings/${mapIdx}/implementation_candidates/${candIdx}/symbol`,
        });
      }
    }
  }

  return issues;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const schema = await readJson<Record<string, unknown>>(opts.schemaPath);
  const report = await readJson<ReportLike>(opts.reportPath);

  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  const validSchema = validate(report);
  const schemaIssues: ValidationIssue[] = (validate.errors ?? []).map((entry) => ({
    code: "schema_validation_failed",
    message: `${entry.instancePath || "/"} ${entry.message ?? "invalid"}`.trim(),
    path: entry.instancePath || "/",
  }));

  const semanticIssues = await runSemanticChecks(report);
  const allIssues = [...schemaIssues, ...semanticIssues];
  const isPass = Boolean(validSchema) && allIssues.length === 0;

  const summary = {
    ok: isPass,
    reportPath: path.resolve(opts.reportPath),
    schemaPath: path.resolve(opts.schemaPath),
    counts: {
      claims: Array.isArray(report.claims) ? report.claims.length : 0,
      citations: Array.isArray(report.citations) ? report.citations.length : 0,
      citationLinks: Array.isArray(report.citation_links) ? report.citation_links.length : 0,
      canonicalBindings: Array.isArray(report.canonical_bindings) ? report.canonical_bindings.length : 0,
      executableMappings: Array.isArray(report.executable_mappings) ? report.executable_mappings.length : 0,
    },
    issues: allIssues,
  };

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!isPass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[paper-gpt-pro-validate] ${message}`);
  process.exitCode = 1;
});
