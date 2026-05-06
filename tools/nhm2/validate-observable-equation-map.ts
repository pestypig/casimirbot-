import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import katex from "katex";
import {
  NHM2_OBSERVABLE_FORBIDDEN_PATTERNS,
  observableTextNeedsLiterature,
  validateNhm2ObservableEquationMap,
  type Nhm2ObservableEquationMap,
} from "../../shared/contracts/nhm2-observable-equation-map.v1.js";
import { sha256File } from "../../scripts/figures/figure-manifest.js";

const DEFAULT_MAP = path.join("docs", "research", "nhm2-observable-equation-map.v1.json");
const DEFAULT_CITATION_BOUNDARY = path.join("docs", "research", "nhm2-observable-equation-citation-boundary.v1.json");
const MISSING_ALLOWED_STATUSES = new Set(["missing_counterpart", "review", "blocked"]);

export function validateObservableEquationMap(
  mapPath = DEFAULT_MAP,
  citationBoundaryPath = DEFAULT_CITATION_BOUNDARY,
): string[] {
  const issues: string[] = [];
  if (!fs.existsSync(mapPath)) return [`map not found: ${mapPath}`];
  if (!fs.existsSync(citationBoundaryPath)) return [`citation boundary not found: ${citationBoundaryPath}`];

  const map = readJson<Nhm2ObservableEquationMap>(mapPath);
  const citationBoundary = readJson<any>(citationBoundaryPath);
  issues.push(...validateNhm2ObservableEquationMap(map));
  issues.push(...validateCitationBoundary(citationBoundary));

  for (const sourceRef of map.sourceWhitepaperRefs) {
    if (!existsFromRepo(sourceRef.path)) {
      issues.push(`source whitepaper ref missing: ${sourceRef.path}`);
      continue;
    }
    const actualHash = sha256File(resolveFromRepo(sourceRef.path));
    if (actualHash.toLowerCase() !== sourceRef.sha256.toLowerCase()) {
      issues.push(`source whitepaper ref hash mismatch: ${sourceRef.path}`);
    }
  }

  const citationIds = new Set((citationBoundary.requiredRefs ?? []).map((entry: any) => entry.id));
  const nodeIds = new Set(map.nodes.map((node) => node.id));
  const figureIds = new Set<string>();

  for (const node of map.nodes) {
    for (const binding of node.repoBindings) {
      if (!binding.units) issues.push(`repo binding missing units: ${node.id}`);
      if (!binding.artifactPath) continue;
      const exists = existsFromRepo(binding.artifactPath);
      if (!exists && !MISSING_ALLOWED_STATUSES.has(node.status)) {
        issues.push(`computed/diagnostic node has missing artifact: ${node.id}:${binding.artifactPath}`);
      }
      if (binding.hashRequired && exists) {
        const hash = sha256File(resolveFromRepo(binding.artifactPath));
        if (!/^[a-f0-9]{64}$/i.test(hash)) issues.push(`artifact hash invalid: ${node.id}:${binding.artifactPath}`);
      }
    }

    for (const plan of node.figurePlan) {
      if (figureIds.has(plan.figureId)) issues.push(`duplicate figure plan id: ${plan.figureId}`);
      figureIds.add(plan.figureId);
      if (!plan.purpose) issues.push(`figure plan missing purpose: ${plan.figureId}`);
    }

    for (const ref of node.literatureRefs) {
      if (!citationIds.has(ref)) issues.push(`node ${node.id} references missing literature id ${ref}`);
    }
    const nodeText = `${node.symbol} ${node.displayEquation ?? ""} ${node.equationLatex ?? ""} ${node.plainMeaning} ${node.whyItMatters}`;
    if (observableTextNeedsLiterature(nodeText) && node.literatureRefs.length === 0) {
      issues.push(`node ${node.id} uses external physics terms without literatureRefs`);
    }
    if (node.family === "qei_gate" && !node.literatureRefs.some((ref) => /qei|qft|fewster|pfenning|hollands/i.test(ref))) {
      issues.push(`qei_gate node lacks QEI/QFT literature refs: ${node.id}`);
    }
    if (node.family === "energy_condition" && !node.literatureRefs.some((ref) => /energy|nec|visser|kontou|pfenning/i.test(ref))) {
      issues.push(`energy_condition node lacks energy-condition literature refs: ${node.id}`);
    }
    if (/casimir/i.test(nodeText) && !node.literatureRefs.some((ref) => /casimir|lamoreaux|klimchitskaya/i.test(ref))) {
      issues.push(`Casimir node lacks Casimir literature refs: ${node.id}`);
    }
    if (node.equationLatex) {
      try {
        katex.renderToString(node.equationLatex, { throwOnError: true, output: "html" });
      } catch (error) {
        issues.push(`node ${node.id} has invalid KaTeX equation: ${(error as Error).message}`);
      }
    }
  }

  for (const edge of map.edges) {
    if (!nodeIds.has(edge.from)) issues.push(`edge has missing from node: ${edge.from}`);
    if (!nodeIds.has(edge.to)) issues.push(`edge has missing to node: ${edge.to}`);
  }

  const mapText = JSON.stringify(map);
  if (/[A-Z]:[\\/]/.test(mapText)) issues.push("map contains absolute local Windows path");
  for (const pattern of NHM2_OBSERVABLE_FORBIDDEN_PATTERNS) {
    if (pattern.test(mapText)) issues.push(`forbidden promotion language found in map: ${pattern}`);
  }
  return issues;
}

function validateCitationBoundary(boundary: any): string[] {
  const issues: string[] = [];
  if (boundary?.schemaVersion !== "v1") issues.push("citation boundary schemaVersion must be v1");
  if (!/does not validate NHM2/i.test(boundary?.globalRule ?? "")) {
    issues.push("citation boundary globalRule must state literature does not validate NHM2");
  }
  if (!Array.isArray(boundary?.requiredRefs) || boundary.requiredRefs.length === 0) {
    issues.push("citation boundary requiredRefs are missing");
    return issues;
  }
  const ids = new Set<string>();
  for (const ref of boundary.requiredRefs) {
    if (!ref.id) issues.push("citation entry missing id");
    if (ids.has(ref.id)) issues.push(`duplicate citation id: ${ref.id}`);
    ids.add(ref.id);
    if (ref.doesValidateNHM2 !== false) issues.push(`citation ${ref.id} must set doesValidateNHM2=false`);
    if (!ref.category) issues.push(`citation ${ref.id} missing category`);
    if (!Array.isArray(ref.allowedUse) || ref.allowedUse.length === 0) issues.push(`citation ${ref.id} missing allowedUse`);
    if (!Array.isArray(ref.forbiddenUse) || ref.forbiddenUse.length === 0) issues.push(`citation ${ref.id} missing forbiddenUse`);
    const allowedText = JSON.stringify(ref.allowedUse);
    if (/validates NHM2|proves propulsion|physics validation/i.test(allowedText)) {
      issues.push(`citation ${ref.id} allowedUse implies validation`);
    }
  }
  return issues;
}

function readJson<T>(pathname: string): T {
  return JSON.parse(fs.readFileSync(pathname, "utf8")) as T;
}

function existsFromRepo(relativeOrAbsolutePath: string): boolean {
  return fs.existsSync(resolveFromRepo(relativeOrAbsolutePath));
}

function resolveFromRepo(relativeOrAbsolutePath: string): string {
  return path.isAbsolute(relativeOrAbsolutePath) ? relativeOrAbsolutePath : path.join(process.cwd(), relativeOrAbsolutePath);
}

function parseArgs(argv: string[]): { map?: string; citationBoundary?: string } {
  const get = (name: string) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  return {
    map: get("map"),
    citationBoundary: get("citation-boundary"),
  };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const mapPath = args.map ?? DEFAULT_MAP;
  const citationBoundaryPath = args.citationBoundary ?? DEFAULT_CITATION_BOUNDARY;
  const issues = validateObservableEquationMap(mapPath, citationBoundaryPath);
  if (issues.length > 0) {
    console.error(JSON.stringify({ ok: false, issues }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, map: mapPath, citationBoundary: citationBoundaryPath }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
