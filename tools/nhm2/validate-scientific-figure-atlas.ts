import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  captionNeedsScientificLiterature,
  NHM2_SCIENTIFIC_ATLAS_PROHIBITED_PATTERNS,
  validateNhm2ScientificFigureAtlasManifest,
  type Nhm2ScientificFigureAtlasManifest,
} from "../../shared/contracts/nhm2-scientific-figure-atlas.v1.js";
import { loadCitationBoundary, validateCitationBoundary } from "../../scripts/figures/figure-citations.js";

export function validateNhm2ScientificFigureAtlas(manifestPath = findNewestManifest()): string[] {
  const issues: string[] = [];
  if (!manifestPath || !fs.existsSync(manifestPath)) return [`manifest not found: ${manifestPath ?? "(none)"}`];
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Nhm2ScientificFigureAtlasManifest;
  const manifestDir = path.dirname(manifestPath);
  issues.push(...validateNhm2ScientificFigureAtlasManifest(manifest));

  for (const figure of manifest.figures ?? []) {
    if (!existsFromRepo(figure.outputPng)) issues.push(`figure PNG does not exist: ${figure.outputPng}`);
    if (figure.outputSvg && !existsFromRepo(figure.outputSvg)) issues.push(`figure SVG does not exist: ${figure.outputSvg}`);
    if (!existsFromRepo(figure.sourceDataJson)) issues.push(`source-data JSON does not exist: ${figure.sourceDataJson}`);
    if (figure.family === "evidence_ledger" && figure.hullOverlayPolicy.usesHullGeometry) {
      issues.push(`evidence_ledger figure uses hull geometry: ${figure.id}`);
    }
    if (figure.family === "math_closure" && figure.hullOverlayPolicy.usesHullGeometry) {
      issues.push(`math_closure figure uses 3D hull as primary display: ${figure.id}`);
    }
    if (figure.family === "geometry" && /ledger|certificate|provenance|claim-lock|claim lock|pass\/fail/i.test(`${figure.title} ${figure.caption}`)) {
      issues.push(`geometry figure contains non-spatial audit language: ${figure.id}`);
    }
    if (figure.family === "mechanism" && /field strength|energy intensity|curvature intensity|spacetime intensity/i.test(figure.caption)) {
      issues.push(`mechanism figure misuses physical-intensity wording: ${figure.id}`);
    }
    if (/observation|proof|propulsion/i.test(figure.caption) && !/does not|not|no external/i.test(figure.caption)) {
      issues.push(`caption may imply observation, proof, or propulsion: ${figure.id}`);
    }
    if (/certificate pass/i.test(figure.caption) && !/non-promotional/i.test(figure.caption)) {
      issues.push(`certificate pass lacks non-promotional boundary: ${figure.id}`);
    }
    if (captionNeedsScientificLiterature(figure.caption) && figure.literatureRefs.length === 0) {
      issues.push(`caption with physics-boundary term lacks literature refs: ${figure.id}`);
    }
  }

  const contactSheet = path.join(manifestDir, "contact_sheet.png");
  if (!fs.existsSync(contactSheet)) issues.push("contact_sheet.png is missing");

  const citationBoundaryPath = path.join(manifestDir, "citation-boundary.json");
  if (!fs.existsSync(citationBoundaryPath)) {
    issues.push("citation-boundary.json is missing");
  } else {
    const boundary = loadCitationBoundary(citationBoundaryPath);
    issues.push(...validateCitationBoundary(boundary));
    const ids = new Set((boundary.requiredRefs ?? []).map((ref) => ref.id));
    for (const figure of manifest.figures ?? []) {
      for (const ref of figure.literatureRefs ?? []) {
        if (!ids.has(ref)) issues.push(`figure ${figure.id} references missing literature id ${ref}`);
      }
    }
  }

  const committedText = JSON.stringify({
    figures: manifest.figures,
    claimBoundary: manifest.claimBoundary,
  });
  if (/[A-Z]:[\\/]/.test(committedText)) issues.push("manifest contains absolute local Windows path");
  for (const pattern of NHM2_SCIENTIFIC_ATLAS_PROHIBITED_PATTERNS) {
    if (pattern.test(committedText)) issues.push(`prohibited promotion language found: ${pattern}`);
  }
  return issues;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const issues = validateNhm2ScientificFigureAtlas(args.manifest ?? findNewestManifest());
  if (issues.length > 0) {
    console.error(JSON.stringify({ ok: false, issues }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, manifest: args.manifest ?? findNewestManifest() }, null, 2));
}

function parseArgs(argv: string[]): { manifest?: string } {
  const i = argv.indexOf("--manifest");
  return { manifest: i >= 0 ? argv[i + 1] : undefined };
}

function existsFromRepo(relativeOrAbsolutePath: string): boolean {
  return fs.existsSync(path.isAbsolute(relativeOrAbsolutePath) ? relativeOrAbsolutePath : path.join(process.cwd(), relativeOrAbsolutePath));
}

function findNewestManifest(): string | undefined {
  const root = path.join("artifacts", "research", "full-solve", "rendered", "scientific-figure-atlas");
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
