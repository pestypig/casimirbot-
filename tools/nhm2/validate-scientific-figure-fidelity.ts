import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Nhm2ScientificFigureAtlasManifest, Nhm2ScientificFigureRecord } from "../../shared/contracts/nhm2-scientific-figure-atlas.v1.js";
import { REQUIRED_TILE_LAYERS } from "../../scripts/figures/nhm2/render-faithful-tile-layout.js";

export function validateNhm2ScientificFigureFidelity(manifestPath = findNewestManifest()): string[] {
  const issues: string[] = [];
  if (!manifestPath || !fs.existsSync(manifestPath)) return [`manifest not found: ${manifestPath ?? "(none)"}`];
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Nhm2ScientificFigureAtlasManifest;

  for (const figure of manifest.figures ?? []) {
    const sourceData = readFigureJson(figure.sourceDataJson);
    if (figure.kind === "field_slice") {
      issues.push(...validateFieldSlice(figure, sourceData));
    }
    if (figure.id === "06_sector_schedule_timeline") {
      issues.push(...validateSectorSchedule(figure, sourceData));
    }
    if (figure.id === "07_representative_tile_layout") {
      issues.push(...validateTileLayout(figure, sourceData));
    }
    if (figure.id === "08_tensor_counterpart_matrix") {
      if (!/diagonal|reduced-order/i.test(figure.caption) || !/full\/off-diagonal|off-diagonal|review-gated/i.test(figure.caption)) {
        issues.push("tensor matrix caption must distinguish diagonal/reduced-order authority from full/off-diagonal review");
      }
    }
    if (figure.id === "10_observer_qei_worldline_plot") {
      if (!/not a completed QEI bound|placeholder|pending/i.test(figure.caption)) {
        issues.push("QEI worldline caption must remain placeholder/pending unless ledger evidence says pass");
      }
      const regions = new Set((sourceData?.data?.worldline ?? []).map((row: any) => row.region));
      for (const region of ["hull", "wall", "exterior_shell"]) {
        if (!regions.has(region)) issues.push(`QEI worldline source data missing region band ${region}`);
      }
    }
    if (/propulsion|mechanism validation|detector observation/i.test(figure.caption) && !/not|does not|no external/i.test(figure.caption)) {
      issues.push(`caption may exceed claim boundary: ${figure.id}`);
    }
  }

  return issues;
}

function validateFieldSlice(figure: Nhm2ScientificFigureRecord, sourceData: any): string[] {
  const issues: string[] = [];
  if (!figure.fieldStatsJson) {
    issues.push(`field slice missing fieldStatsJson: ${figure.id}`);
    return issues;
  }
  if (!existsFromRepo(figure.fieldStatsJson)) {
    issues.push(`field-stats JSON does not exist: ${figure.fieldStatsJson}`);
    return issues;
  }
  const stats = asArray(readFigureJson(figure.fieldStatsJson));
  if (stats.length === 0) issues.push(`field-stats JSON is empty: ${figure.id}`);
  for (const entry of stats) {
    for (const key of ["field", "rawMin", "rawMax", "mean", "median", "p01", "p05", "p95", "p99", "normalization", "units", "sourceHash"]) {
      if (entry?.[key] === undefined) issues.push(`field-stats entry missing ${key}: ${figure.id}`);
    }
    const distinctTicks = new Set((entry?.tickLabels ?? []).map(String));
    if (distinctTicks.size < 3) issues.push(`field-stats entry has fewer than three distinct tick labels: ${figure.id}:${entry?.field}`);
  }
  if (figure.id === "03_lapse_shift_grid_slice") {
    const fields = new Set(stats.map((entry) => entry.field));
    for (const field of ["alpha", "alpha_minus_1", "beta_x", "beta_magnitude"]) {
      if (!fields.has(field)) issues.push(`lapse/shift panel missing field stats for ${field}`);
    }
    const spec = readSiblingSpec(figure);
    if (spec?.resolve?.scale?.color !== "independent") {
      issues.push("lapse/shift figure must use independent color scales");
    }
  }
  if (figure.id === "04_theta_signed_diagnostic") {
    const theta = stats.find((entry) => entry.field === "theta");
    if (theta?.normalization !== "signed_zero_centered") issues.push("theta stats must use signed_zero_centered normalization");
    const domain = theta?.colorDomain;
    if (!Array.isArray(domain) || domain.length !== 2 || Math.abs(Math.abs(domain[0]) - Math.abs(domain[1])) > Math.max(1e-12, Math.abs(domain[1]) * 1e-6)) {
      issues.push("theta color domain must be symmetric around zero");
    }
    if (typeof theta?.nearZeroEpsilon !== "number") issues.push("theta stats must document near-zero epsilon");
  }
  if (!sourceData?.data) issues.push(`field slice source-data missing data rows: ${figure.id}`);
  return issues;
}

function validateSectorSchedule(figure: Nhm2ScientificFigureRecord, sourceData: any): string[] {
  const issues: string[] = [];
  const schedule = sourceData?.data;
  const rows = schedule?.rows ?? [];
  const sectors = new Set(rows.map((row: any) => row.sector));
  if (schedule?.sectorCount !== schedule?.coveredSectorCount) issues.push("sector schedule coveredSectorCount must match sectorCount");
  if (sectors.size !== schedule?.sectorCount) issues.push(`sector schedule must account for all sectorCount sectors; got ${sectors.size}`);
  const activePerWindow = new Map<number, number>();
  for (const row of rows) {
    if (row.active) activePerWindow.set(row.window, (activePerWindow.get(row.window) ?? 0) + 1);
  }
  for (const [window, count] of activePerWindow) {
    if (count !== schedule.concurrentSectors && window < Math.floor(schedule.sectorCount / Math.max(1, schedule.concurrentSectors))) {
      issues.push(`schedule window ${window} has ${count} active sectors, expected ${schedule.concurrentSectors}`);
    }
  }
  if (!/80 sectors total|sectors/i.test(figure.caption)) issues.push("sector schedule caption must describe total sector accounting");
  return issues;
}

function validateTileLayout(figure: Nhm2ScientificFigureRecord, sourceData: any): string[] {
  const issues: string[] = [];
  const layers = new Set(sourceData?.requiredLayers ?? []);
  for (const layer of REQUIRED_TILE_LAYERS) {
    if (!layers.has(layer)) issues.push(`tile layout missing required process layer ${layer}`);
  }
  if (sourceData?.representative !== true) issues.push("tile layout must be marked representative");
  if (!/process mask|mask layers|layout\/process/i.test(figure.caption)) issues.push("tile caption must describe colors as process/layout layers");
  if (/field strength|energy intensity|curvature intensity|spacetime intensity/i.test(figure.caption)) {
    issues.push("tile caption must not describe colors as field strength, curvature, or spacetime intensity");
  }
  return issues;
}

function readFigureJson(relativeOrAbsolutePath: string): any {
  const resolved = path.isAbsolute(relativeOrAbsolutePath) ? relativeOrAbsolutePath : path.join(process.cwd(), relativeOrAbsolutePath);
  if (!fs.existsSync(resolved)) return undefined;
  return JSON.parse(fs.readFileSync(resolved, "utf8"));
}

function readSiblingSpec(figure: Nhm2ScientificFigureRecord): any {
  if (!figure.outputSvg) return undefined;
  const specPath = resolveFromRepo(figure.outputSvg).replace(/\.svg$/i, ".spec.json");
  if (!fs.existsSync(specPath)) return undefined;
  return JSON.parse(fs.readFileSync(specPath, "utf8"));
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (Array.isArray(value)) return value;
  return value === undefined ? [] : [value];
}

function existsFromRepo(relativeOrAbsolutePath: string): boolean {
  return fs.existsSync(resolveFromRepo(relativeOrAbsolutePath));
}

function resolveFromRepo(relativeOrAbsolutePath: string): string {
  return path.isAbsolute(relativeOrAbsolutePath) ? relativeOrAbsolutePath : path.join(process.cwd(), relativeOrAbsolutePath);
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

function main(): void {
  const i = process.argv.indexOf("--manifest");
  const manifest = i >= 0 ? process.argv[i + 1] : findNewestManifest();
  const issues = validateNhm2ScientificFigureFidelity(manifest);
  if (issues.length > 0) {
    console.error(JSON.stringify({ ok: false, issues }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, manifest }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
