import fs from "node:fs";
import path from "node:path";
import {
  NHM2_ATLAS_PROHIBITED_PATTERNS,
  captionNeedsLiterature,
  validateNhm2LayeredLedgerAtlasManifest,
  type Nhm2AtlasManifest,
} from "../../shared/contracts/nhm2-layered-ledger-atlas.v1.js";

const LEGAL_SEMANTIC_KINDS = new Set([
  "spatial_geometry",
  "source_evidence",
  "validation_overlay",
  "citation_boundary",
]);

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const manifestPath = args.manifest ?? findNewestManifest();
  if (!manifestPath) fail(["No layered ledger atlas manifest found"]);

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Nhm2AtlasManifest;
  const issues: string[] = [];
  issues.push(...validateNhm2LayeredLedgerAtlasManifest(manifest));

  const literaturePath =
    args.literatureMap ??
    manifest.inputRefs?.literatureMap?.resolvedPath ??
    manifest.inputRefs?.literatureMap?.path ??
    "docs/research/nhm2-layered-ledger-literature-map.v1.json";
  const literature = fs.existsSync(literaturePath)
    ? JSON.parse(fs.readFileSync(literaturePath, "utf8"))
    : { refs: [] };
  const literatureIds = new Set((literature.refs ?? []).map((ref: any) => ref.id));

  if (!manifest.inputHashes || Object.keys(manifest.inputHashes).length === 0) {
    issues.push("inputHashes are missing");
  } else {
    for (const [key, value] of Object.entries(manifest.inputHashes)) {
      if (key !== "ledger" && key !== "regionalSourceClosure" && value === null) {
        issues.push(`Required input hash missing for ${key}`);
      }
    }
  }

  for (const layer of manifest.layers ?? []) {
    if (!LEGAL_SEMANTIC_KINDS.has(layer.semanticKind)) issues.push(`Illegal semanticKind for ${layer.id}`);
    if (!fs.existsSync(layer.outputPath)) issues.push(`Layer output image does not exist: ${layer.outputPath}`);
    if (layer.semanticKind === "validation_overlay" && layer.visibleOnHull !== false) {
      issues.push(`Validation overlay ${layer.id} is encoded as visibleOnHull`);
    }
    if (/as_?physical_?hull_?field|as_?hull_?energy|as_?curvature/i.test(layer.statusEncoding) && layer.semanticKind === "validation_overlay") {
      issues.push(`Validation overlay ${layer.id} statusEncoding implies a physical hull field`);
    }
  }

  const spatialAllowed = new Set(["base_geometry", "region_envelopes", "sector_lattice", "combined_layered_atlas"]);
  for (const layer of manifest.layers ?? []) {
    if (layer.visibleOnHull && !spatialAllowed.has(layer.id)) {
      issues.push(`Unexpected hull-visible layer ${layer.id}`);
    }
  }

  const cavityPath =
    args.cavityContract ??
    manifest.inputRefs?.cavityContract?.resolvedPath ??
    manifest.inputRefs?.cavityContract?.path ??
    "configs/needle-hull-mark2-cavity-contract.v1.json";
  if (fs.existsSync(cavityPath)) {
    const cavity = JSON.parse(fs.readFileSync(cavityPath, "utf8"));
    const sectorLayer = manifest.layers.find((layer) => layer.id === "sector_lattice");
    const expectedSectorCount = Number(cavity.geometry?.sectorCount);
    const expectedActiveCount = Number(cavity.geometry?.concurrentSectors);
    if (Number(sectorLayer?.metadata?.sectorCount) !== expectedSectorCount) {
      issues.push(`sector_lattice sectorCount must equal cavity contract sectorCount ${expectedSectorCount}`);
    }
    if (Number(sectorLayer?.metadata?.activeSectorCount) !== expectedActiveCount) {
      issues.push(`sector_lattice activeSectorCount must equal cavity contract concurrentSectors ${expectedActiveCount}`);
    }
  } else {
    issues.push(`Cavity contract not found: ${cavityPath}`);
  }

  const combinedLayer = manifest.layers.find((layer) => layer.id === "combined_layered_atlas");
  const tileInset = combinedLayer?.metadata?.tileInset as any;
  if (!tileInset?.representative || !tileInset?.repeated || !tileInset?.layoutScale) {
    issues.push("Tile inset must be marked representative, repeated, and layout-scale");
  }
  if (!/(GDS\/process mask layers|mask\/process layers)/i.test(tileInset?.caption ?? "") || !/not .*field strength/i.test(tileInset?.caption ?? "")) {
    issues.push("Tile inset caption must state mask/process layers, not field strength");
  }

  if (manifest.claimLock.validationClaimAllowed !== false) issues.push("validationClaimAllowed must remain false");
  if (manifest.claimLock.physicalMechanismClaimAllowed !== false) issues.push("physicalMechanismClaimAllowed must remain false");
  if (manifest.claimLock.promotionAllowed !== false) issues.push("promotionAllowed must remain false");

  for (const caption of manifest.captions ?? []) {
    if (captionNeedsLiterature(caption.text) && caption.literatureRefs.length === 0) {
      issues.push(`Caption ${caption.id} lacks literature refs for external physics terms`);
    }
    for (const ref of caption.literatureRefs ?? []) {
      if (!literatureIds.has(ref)) issues.push(`Caption ${caption.id} references missing literature id ${ref}`);
    }
  }

  const gatedText = JSON.stringify({
    captions: manifest.captions,
    layers: manifest.layers,
    validationNotes: manifest.validationNotes,
  });
  for (const pattern of NHM2_ATLAS_PROHIBITED_PATTERNS) {
    if (pattern.test(gatedText)) issues.push(`Prohibited promotion language found: ${pattern}`);
  }

  if (issues.length > 0) fail(issues);
  console.log(JSON.stringify({ ok: true, manifest: manifestPath, layers: manifest.layers.length }, null, 2));
}

function parseArgs(argv: string[]): { manifest?: string; literatureMap?: string; cavityContract?: string } {
  const get = (name: string) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  return {
    manifest: get("manifest"),
    literatureMap: get("literature-map"),
    cavityContract: get("cavity-contract"),
  };
}

function findNewestManifest(): string | null {
  const root = "artifacts/research/full-solve/rendered/layered-ledger-atlas";
  if (!fs.existsSync(root)) return null;
  const candidates: string[] = [];
  for (const dirent of fs.readdirSync(root, { withFileTypes: true })) {
    if (!dirent.isDirectory()) continue;
    const manifestPath = path.join(root, dirent.name, "manifest.json");
    if (fs.existsSync(manifestPath)) candidates.push(manifestPath);
  }
  candidates.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return candidates[0] ?? null;
}

function fail(issues: string[]): never {
  console.error(JSON.stringify({ ok: false, issues }, null, 2));
  process.exit(1);
}

main();
