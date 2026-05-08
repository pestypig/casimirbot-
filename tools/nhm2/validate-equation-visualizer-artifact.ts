import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  validateNhm2EquationVisualizerManifest,
  type Nhm2EquationVisualizerManifest,
} from "../../shared/contracts/nhm2-equation-visualizer.v1.js";

export function validateEquationVisualizerArtifact(manifestPath = findNewestManifest()): string[] {
  const issues: string[] = [];
  if (!manifestPath || !fs.existsSync(manifestPath)) return [`manifest not found: ${manifestPath ?? "(none)"}`];
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Nhm2EquationVisualizerManifest;
  issues.push(...validateNhm2EquationVisualizerManifest(manifest));

  for (const output of manifest.outputs) {
    if (!existsFromRepo(output.outputPng)) issues.push(`output PNG missing: ${output.outputPng}`);
    if (output.outputSvg && !existsFromRepo(output.outputSvg)) issues.push(`output SVG missing: ${output.outputSvg}`);
    if (!existsFromRepo(output.sourceDataJson)) issues.push(`source-data JSON missing: ${output.sourceDataJson}`);
    if (output.vegaSpecJson && !existsFromRepo(output.vegaSpecJson)) issues.push(`vega spec JSON missing: ${output.vegaSpecJson}`);
    if (!existsFromRepo(output.visualizerPresetJson)) issues.push(`visualizer preset JSON missing: ${output.visualizerPresetJson}`);
    const sourceData = existsFromRepo(output.sourceDataJson) ? JSON.parse(fs.readFileSync(resolveFromRepo(output.sourceDataJson), "utf8")) : null;
    if (!Array.isArray(sourceData?.rows) || sourceData.rows.length === 0) issues.push(`source-data rows missing: ${output.id}`);
    if (!Array.isArray(sourceData?.variables) || sourceData.variables.length === 0) issues.push(`source-data variables missing: ${output.id}`);
    if (!Array.isArray(sourceData?.invalidSamples)) issues.push(`source-data invalidSamples must be an array: ${output.id}`);
    if (/qei/i.test(output.id) && !/requirement|not a completed|blocked|sampling/i.test(`${output.caption} ${output.uncertaintyNote}`)) {
      issues.push(`QEI output must remain requirement/placeholder: ${output.id}`);
    }
    if (output.claimBoundary.diagnosticOnly !== true) issues.push(`output ${output.id} must be diagnosticOnly`);
    if (output.claimBoundary.doesValidateNHM2 !== false) issues.push(`output ${output.id} must not validate NHM2`);
    if (output.claimBoundary.validationClaimAllowed !== false) issues.push(`output ${output.id} validationClaimAllowed must be false`);
    if (output.claimBoundary.physicalMechanismClaimAllowed !== false) issues.push(`output ${output.id} physicalMechanismClaimAllowed must be false`);
    if (output.claimBoundary.promotionAllowed !== false) issues.push(`output ${output.id} promotionAllowed must be false`);
  }
  const text = JSON.stringify(manifest);
  if (/[A-Z]:[\\/]/.test(text)) issues.push("manifest contains absolute local Windows path");
  if (/\bvalidated\b|\bproven\b|\bworking propulsion\b|\bmechanism confirmed\b/i.test(text)) issues.push("manifest contains forbidden promotion language");
  return issues;
}

function existsFromRepo(relativeOrAbsolutePath: string): boolean {
  return fs.existsSync(resolveFromRepo(relativeOrAbsolutePath));
}

function resolveFromRepo(relativeOrAbsolutePath: string): string {
  return path.isAbsolute(relativeOrAbsolutePath) ? relativeOrAbsolutePath : path.join(process.cwd(), relativeOrAbsolutePath);
}

function findNewestManifest(): string | undefined {
  const root = path.join("artifacts", "research", "full-solve", "rendered", "equation-visualizer");
  if (!fs.existsSync(root)) return undefined;
  const candidates: string[] = [];
  for (const dirent of fs.readdirSync(root, { withFileTypes: true })) {
    if (!dirent.isDirectory()) continue;
    const manifestPath = path.join(root, dirent.name, "manifest.json");
    if (fs.existsSync(manifestPath)) candidates.push(manifestPath);
  }
  candidates.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs || a.localeCompare(b));
  return candidates[0];
}

function parseArgs(argv: string[]): { manifest?: string } {
  const i = argv.indexOf("--manifest");
  return { manifest: i >= 0 ? argv[i + 1] : undefined };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const issues = validateEquationVisualizerArtifact(args.manifest);
  if (issues.length > 0) {
    console.error(JSON.stringify({ ok: false, issues }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, manifest: args.manifest ?? findNewestManifest() }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
