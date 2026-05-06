import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import {
  decodeBinaryBrick,
  hashFloat32,
  loadBrickBytes,
  sha256Hex,
  validateChannelConsistency,
} from "./rendering/scientific-3p1/brick-io.js";
import {
  buildHullIsoMesh,
  buildRicciIsoMesh,
  buildSceneTransform,
  buildSdfBandMeshes,
  buildSdfIsoMesh,
  type Triangle,
} from "./rendering/scientific-3p1/mesh.js";
import { DEFAULT_CAMERA, renderContactSheet, renderLayerFrame } from "./rendering/scientific-3p1/rasterizer.js";
import {
  drawAxisTriad,
  drawCenterlineWorldline,
  drawLedgerBadgeStrip,
  drawLegend,
  drawObserverQeiInset,
  drawSectorScheduleInset,
  drawSourceClosureBrackets,
  drawTensorAuthorityMatrix,
  drawTileInsetFrame,
  type Badge,
  type OverlayList,
  type RegionStatus,
} from "./rendering/scientific-3p1/overlays.js";
import type { Nhm2AtlasLayer, Nhm2AtlasManifest } from "../shared/contracts/nhm2-layered-ledger-atlas.v1.js";

const AXIS_CONVENTION = "x_ship_y_port_z_zenith";
const DEFAULT_PROFILE_ID = "stage1_centerline_alpha_0p995_v1";
const DEFAULT_LANE_ID = "nhm2_shift_lapse";
const DEFAULT_WIDTH = 720;
const DEFAULT_HEIGHT = 720;

interface CliArgs {
  brick: string;
  wrappedBrick: string;
  ledger: string;
  regionalSourceClosure: string;
  cavityContract: string;
  literatureMap: string;
  out: string;
  runId?: string;
  yawRad: number;
  wallSigma: number;
}

interface InputRecord {
  requestedPath: string;
  resolvedPath?: string;
  exists: boolean;
  hash: string | null;
  json?: any;
}

type RegionId = "global" | "hull" | "wall" | "exterior_shell";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  fs.mkdirSync(args.out, { recursive: true });

  const ledgerInput = readJsonInput(args.ledger, findNewestReferenceArtifact("nhm2-blocker-ledger-*.json"));
  const closureInput = readJsonInput(args.regionalSourceClosure, findNewestReferenceArtifact("nhm2-regional-source-closure-evidence.json"));
  const cavityInput = readJsonInput(args.cavityContract);
  const literatureInput = readJsonInput(args.literatureMap);

  const brickBytes = loadBrickBytes(args.brick, args.wrappedBrick);
  const brick = decodeBinaryBrick(brickBytes);
  const { dims, origin, spacing } = validateChannelConsistency(brick);
  const ricci4 = mustChannel(brick.channels.get("ricci4")?.values, "ricci4");
  const hullSdf = mustChannel(brick.channels.get("hull_sdf")?.values, "hull_sdf");
  const transform = buildSceneTransform(dims, origin, spacing, { preservePhysicalAxes: true });

  const camera = { ...DEFAULT_CAMERA, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
  const runId = args.runId ?? ledgerInput.json?.runId ?? `nhm2-layered-ledger-atlas-${todayIso()}`;
  const selectedProfileId = ledgerInput.json?.selectedProfileId ?? DEFAULT_PROFILE_ID;
  const sectorCount = Number(cavityInput.json?.geometry?.sectorCount ?? 80);
  const activeSectorCount = Number(cavityInput.json?.geometry?.concurrentSectors ?? 2);

  const baseTriangles = [
    ...buildHullIsoMesh(dims, transform, hullSdf, { color: [216, 224, 220, 48] }),
    ...buildRicciIsoMesh(dims, transform, ricci4, hullSdf),
  ];
  const regionTriangles = [
    ...buildSdfIsoMesh(dims, transform, hullSdf, -args.wallSigma, { color: [36, 204, 190, 48] }),
    ...buildSdfIsoMesh(dims, transform, hullSdf, 0, { color: [102, 240, 255, 82] }),
    ...buildSdfIsoMesh(dims, transform, hullSdf, args.wallSigma, { color: [62, 180, 255, 46] }),
    ...buildSdfIsoMesh(dims, transform, hullSdf, 3 * args.wallSigma, { color: [180, 214, 255, 28] }),
  ];
  const sectorTriangles = [
    ...buildSdfBandMeshes(
      dims,
      transform,
      hullSdf,
      [-args.wallSigma, 0, args.wallSigma],
      [
        { color: [36, 204, 190, 38] },
        { color: [102, 240, 255, 72] },
        { color: [62, 180, 255, 34] },
      ],
    ),
  ];

  const outputs: Record<string, string> = {};

  outputs.base_geometry = outPath(args.out, "base_geometry.png");
  await renderLayerFrame(outputs.base_geometry, baseTriangles, args.yawRad, camera);
  await compositeOver(outputs.base_geometry, outputs.base_geometry, (overlays) => {
    drawLegend(overlays, camera.width, camera.height, [
      { label: "ricci4 shell", color: "#f2ae4a" },
      { label: "hull_sdf=0", color: "#d8e0dc" },
    ]);
    drawAxisTriad(overlays, camera.width, camera.height);
  });

  outputs.region_envelopes = outPath(args.out, "region_envelopes.png");
  await renderLayerFrame(outputs.region_envelopes, regionTriangles, args.yawRad, camera);
  await compositeOver(outputs.region_envelopes, outputs.region_envelopes, (overlays) => {
    drawLegend(overlays, camera.width, camera.height, [
      { label: "hull", color: "#24ccbe" },
      { label: "wall", color: "#66f0ff" },
      { label: "exterior shell", color: "#b4d6ff" },
    ]);
    drawCenterlineWorldline(overlays, camera.width, camera.height);
    drawAxisTriad(overlays, camera.width, camera.height);
  });

  outputs.sector_lattice = outPath(args.out, "sector_lattice.png");
  await renderLayerFrame(outputs.sector_lattice, sectorTriangles, args.yawRad, camera);
  await compositeOver(outputs.sector_lattice, outputs.sector_lattice, (overlays) => {
    drawSectorScheduleInset(overlays, camera.width, camera.height, sectorCount, activeSectorCount);
    drawLedgerBadgeStrip(overlays, camera.width, camera.height, [
      { label: "sectorCount", status: String(sectorCount), tone: "unknown" },
      { label: "active", status: String(activeSectorCount), tone: "review" },
    ]);
  });

  outputs.source_closure_regions = outPath(args.out, "source_closure_regions.png");
  await renderLayerFrame(outputs.source_closure_regions, regionTriangles, args.yawRad, camera);
  await compositeOver(outputs.source_closure_regions, outputs.source_closure_regions, (overlays) => {
    drawSourceClosureBrackets(overlays, camera.width, camera.height, getRegionStatuses(ledgerInput.json, closureInput.json));
    drawLegend(overlays, camera.width, camera.height, [
      { label: "pass", color: "#40d7a0" },
      { label: "review/missing", color: "#f2ae4a" },
      { label: "fail", color: "#ec6a48" },
      { label: "unknown", color: "#8a98a6" },
    ]);
  });

  outputs.observer_qei_placeholders = outPath(args.out, "observer_qei_placeholders.png");
  await renderLayerFrame(outputs.observer_qei_placeholders, regionTriangles, args.yawRad, camera);
  await compositeOver(outputs.observer_qei_placeholders, outputs.observer_qei_placeholders, (overlays) => {
    drawCenterlineWorldline(overlays, camera.width, camera.height);
    const qeiStatus = String(ledgerInput.json?.qeiBlockers?.status ?? "missing");
    drawObserverQeiInset(overlays, camera.width, camera.height, qeiStatus, toneForStatus(qeiStatus));
  });

  outputs.tensor_authority_gate = outPath(args.out, "tensor_authority_gate.png");
  await renderBlankPanel(outputs.tensor_authority_gate, camera.width, camera.height, (overlays) => {
    drawTensorAuthorityMatrix(overlays, camera.width, camera.height, { x: 236, y: 210 });
    drawLedgerBadgeStrip(overlays, camera.width, camera.height, [
      { label: "diag", status: "reduced-order", tone: "review" },
      { label: "offdiag", status: "locked", tone: "locked" },
      { label: "authority", status: statusFromGate(ledgerInput.json, "GATE_FULL_TENSOR_WHERE_CLAIMED"), tone: toneForStatus(statusFromGate(ledgerInput.json, "GATE_FULL_TENSOR_WHERE_CLAIMED")) },
    ]);
  });

  outputs.frozen_run_ledger_frame = outPath(args.out, "frozen_run_ledger_frame.png");
  await renderBlankPanel(outputs.frozen_run_ledger_frame, camera.width, camera.height, (overlays) => {
    drawLedgerBadgeStrip(overlays, camera.width, camera.height, buildLedgerBadges(ledgerInput.json));
    drawSourceClosureBrackets(overlays, camera.width, camera.height, getRegionStatuses(ledgerInput.json, closureInput.json));
    drawTensorAuthorityMatrix(overlays, camera.width, camera.height, { x: 450, y: 112 });
    drawObserverQeiInset(overlays, camera.width, camera.height, String(ledgerInput.json?.qeiBlockers?.status ?? "missing"), toneForStatus(String(ledgerInput.json?.qeiBlockers?.status ?? "missing")));
  });

  outputs.combined_layered_atlas = outPath(args.out, "combined_layered_atlas.png");
  await renderLayerFrame(outputs.combined_layered_atlas, mergeTriangles(baseTriangles, regionTriangles.slice(0, 16000)), args.yawRad, camera);
  await compositeOver(outputs.combined_layered_atlas, outputs.combined_layered_atlas, (overlays) => {
    drawLegend(overlays, camera.width, camera.height, [
      { label: "solve-derived ricci4", color: "#f2ae4a" },
      { label: "nested hull/wall/exterior", color: "#66f0ff" },
      { label: "sector source architecture", color: "#e05aff" },
    ]);
    drawCenterlineWorldline(overlays, camera.width, camera.height);
    drawSectorScheduleInset(overlays, camera.width, camera.height, sectorCount, activeSectorCount);
    drawSourceClosureBrackets(overlays, camera.width, camera.height, getRegionStatuses(ledgerInput.json, closureInput.json));
    drawTileInsetFrame(overlays, camera.width, camera.height);
    drawLedgerBadgeStrip(overlays, camera.width, camera.height, [
      { label: "claim", status: "promotion locked", tone: "locked" },
      { label: "certificate", status: certificateStatus(ledgerInput.json), tone: "locked" },
      { label: "literature", status: "context only", tone: "locked" },
    ]);
  });

  outputs.atlas_contact_sheet = outPath(args.out, "atlas_contact_sheet.png");
  await renderContactSheet(outputs.atlas_contact_sheet, [
    outputs.base_geometry,
    outputs.region_envelopes,
    outputs.sector_lattice,
    outputs.source_closure_regions,
    outputs.observer_qei_placeholders,
    outputs.tensor_authority_gate,
    outputs.frozen_run_ledger_frame,
    outputs.combined_layered_atlas,
  ], { columns: 3, tileSize: 280, title: "NHM2 layered blocker-ledger atlas" });

  const captions = fixedCaptions();
  const manifest: Nhm2AtlasManifest = {
    artifactId: "nhm2_layered_ledger_atlas",
    schemaVersion: "v1",
    generatedAt: new Date().toISOString(),
    runId,
    selectedProfileId,
    laneId: DEFAULT_LANE_ID,
    axisConvention: AXIS_CONVENTION,
    inputRefs: {
      brick: { path: args.brick, exists: fs.existsSync(args.brick), resolvedPath: fs.existsSync(args.brick) ? args.brick : undefined },
      wrappedBrick: { path: args.wrappedBrick, exists: fs.existsSync(args.wrappedBrick), resolvedPath: fs.existsSync(args.wrappedBrick) ? args.wrappedBrick : undefined },
      ledger: { path: args.ledger, exists: ledgerInput.exists, resolvedPath: ledgerInput.resolvedPath },
      regionalSourceClosure: { path: args.regionalSourceClosure, exists: closureInput.exists, resolvedPath: closureInput.resolvedPath },
      cavityContract: { path: args.cavityContract, exists: cavityInput.exists, resolvedPath: cavityInput.resolvedPath },
      literatureMap: { path: args.literatureMap, exists: literatureInput.exists, resolvedPath: literatureInput.resolvedPath },
    },
    inputHashes: {
      brick: sha256Hex(brickBytes),
      ricci4: hashFloat32(ricci4),
      hull_sdf: hashFloat32(hullSdf),
      ledger: ledgerInput.hash,
      regionalSourceClosure: closureInput.hash,
      cavityContract: cavityInput.hash,
      literatureMap: literatureInput.hash,
    },
    camera: {
      ...camera,
      yawRad: args.yawRad,
      wallSigma: args.wallSigma,
      physicalAxisScale: "preserved_from_brick_bounds",
    },
    layers: buildLayers(outputs, sectorCount, activeSectorCount),
    captions,
    literatureRefs: literatureInput.json?.refs?.map((ref: any) => ref.id) ?? captions.flatMap((caption) => caption.literatureRefs),
    claimLock: {
      validationClaimAllowed: false,
      physicalMechanismClaimAllowed: false,
      promotionAllowed: false,
    },
    prohibitedClaims: [
      "propulsion promotion",
      "validated mechanism promotion",
      "solved full-warp promotion",
      "detector-observation equivalence",
      "direct Casimir-to-curvature validation",
      "external-paper validation of NHM2",
    ],
    validationNotes: [
      "Atlas is diagnostic and non-promotional.",
      "Validation overlays are rendered as panels, badges, brackets, or matrix gates, not hull-space physical fields.",
      `sectorCount=${sectorCount}; activeSectorCount=${activeSectorCount}`,
      "Tile inset is representative, repeated, and layout-scale.",
    ],
  };

  fs.writeFileSync(outPath(args.out, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(outPath(args.out, "captions.md"), captionsMarkdown(captions));

  console.log(JSON.stringify({ ok: true, out: args.out, outputs }, null, 2));
}

function parseArgs(argv: string[]): CliArgs {
  const get = (name: string, fallback: string) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
  };
  return {
    brick: get("brick", "artifacts/research/full-solve/triage-brick-48.raw"),
    wrappedBrick: get("wrapped-brick", "artifacts/research/full-solve/user-york-brick-latest.json"),
    ledger: get("ledger", "artifacts/research/full-solve/nhm2-blocker-ledger-latest.json"),
    regionalSourceClosure: get("regional-source-closure", "artifacts/research/full-solve/nhm2-regional-source-closure-evidence-latest.json"),
    cavityContract: get("cavity-contract", "configs/needle-hull-mark2-cavity-contract.v1.json"),
    literatureMap: get("literature-map", "docs/research/nhm2-layered-ledger-literature-map.v1.json"),
    out: get("out", `artifacts/research/full-solve/rendered/layered-ledger-atlas/${todayIso()}`),
    runId: get("run-id", "") || undefined,
    yawRad: Number(get("yaw-rad", "-0.35")),
    wallSigma: Number(get("wall-sigma", String(80 / 3))),
  };
}

function mustChannel(values: Float32Array | undefined, name: string): Float32Array {
  if (!values) throw new Error(`Required brick channel missing: ${name}`);
  return values;
}

function readJsonInput(requestedPath: string, fallbackPath?: string | null): InputRecord {
  const resolvedPath = fs.existsSync(requestedPath) ? requestedPath : fallbackPath && fs.existsSync(fallbackPath) ? fallbackPath : undefined;
  if (!resolvedPath) return { requestedPath, exists: false, hash: null };
  const text = fs.readFileSync(resolvedPath, "utf8");
  return { requestedPath, resolvedPath, exists: true, hash: sha256Hex(text), json: JSON.parse(text) };
}

function findNewestReferenceArtifact(pattern: string): string | null {
  const root = "artifacts/research/full-solve/reference";
  if (!fs.existsSync(root)) return null;
  const literalPrefix = pattern.replace("*", "");
  const matches: string[] = [];
  for (const dirent of fs.readdirSync(root, { withFileTypes: true })) {
    if (!dirent.isDirectory()) continue;
    const dir = path.join(root, dirent.name);
    for (const file of fs.readdirSync(dir)) {
      if (pattern.includes("*")) {
        const [prefix, suffix] = pattern.split("*");
        if (file.startsWith(prefix) && file.endsWith(suffix)) matches.push(path.join(dir, file));
      } else if (file === literalPrefix) {
        matches.push(path.join(dir, file));
      }
    }
  }
  matches.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return matches[0] ?? null;
}

function outPath(outDir: string, file: string): string {
  return path.join(outDir, file);
}

async function compositeOver(inPath: string, outPathValue: string, draw: (overlays: OverlayList) => void): Promise<void> {
  const overlays: OverlayList = [];
  draw(overlays);
  const rendered = await sharp(inPath).composite(overlays).png().toBuffer();
  fs.writeFileSync(outPathValue, rendered);
}

async function renderBlankPanel(outPathValue: string, width: number, height: number, draw: (overlays: OverlayList) => void): Promise<void> {
  const overlays: OverlayList = [];
  draw(overlays);
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: "#05080d",
    },
  })
    .composite(overlays)
    .png()
    .toFile(outPathValue);
}

function mergeTriangles(...groups: Triangle[][]): Triangle[] {
  return groups.flat();
}

function getRegionStatuses(ledger: any, closure: any): RegionStatus[] {
  const regions: RegionId[] = ["global", "hull", "wall", "exterior_shell"];
  return regions.map((region) => {
    const ledgerStatus = ledger?.regionalBlockers?.find((entry: any) => entry.regionId === region)?.status;
    const closureStatus = closure?.regions?.find((entry: any) => entry.regionId === region)?.status;
    const status = String(ledgerStatus ?? closureStatus ?? "unknown");
    return { region, status, tone: toneForStatus(status) };
  });
}

function buildLedgerBadges(ledger: any): Badge[] {
  const cert = certificateStatus(ledger);
  return [
    { label: "validation", status: "false", tone: "locked" },
    { label: "mechanism", status: "false", tone: "locked" },
    { label: "promotion", status: "false", tone: "locked" },
    { label: "source", status: statusFromGate(ledger, "GATE_REGIONAL_SOURCE_CLOSURE_EVIDENCE_ARTIFACT"), tone: toneForStatus(statusFromGate(ledger, "GATE_REGIONAL_SOURCE_CLOSURE_EVIDENCE_ARTIFACT")) },
    { label: "observer", status: String(ledger?.observerBlockers?.summaryVsDetailedStatus ?? "unknown"), tone: toneForStatus(String(ledger?.observerBlockers?.summaryVsDetailedStatus ?? "unknown")) },
    { label: "QEI", status: String(ledger?.qeiBlockers?.status ?? "missing"), tone: toneForStatus(String(ledger?.qeiBlockers?.status ?? "missing")) },
    { label: "tensor", status: statusFromGate(ledger, "GATE_FULL_TENSOR_WHERE_CLAIMED"), tone: toneForStatus(statusFromGate(ledger, "GATE_FULL_TENSOR_WHERE_CLAIMED")) },
    { label: "cert", status: cert, tone: cert === "pass" ? "locked" : toneForStatus(cert) },
    { label: "adapter", status: String(ledger?.adapterVerification?.status ?? "unknown"), tone: toneForStatus(String(ledger?.adapterVerification?.status ?? "unknown")) },
    { label: "literature", status: "context only", tone: "locked" },
  ];
}

function statusFromGate(ledger: any, gateId: string): string {
  return String(ledger?.gateSummary?.find((gate: any) => gate.gateId === gateId)?.state ?? "unknown");
}

function certificateStatus(ledger: any): string {
  const status = String(ledger?.certificatePolicy?.certificateStatus ?? "unknown");
  return ledger?.certificatePolicy?.greenButNonPromotional ? `${status}/locked` : status;
}

function toneForStatus(status: string): Badge["tone"] {
  const normalized = status.toLowerCase();
  if (normalized.includes("pass")) return "pass";
  if (normalized.includes("fail")) return "fail";
  if (normalized.includes("review") || normalized.includes("missing") || normalized.includes("pending")) return "review";
  if (normalized.includes("locked") || normalized.includes("false")) return "locked";
  return "unknown";
}

function buildLayers(outputs: Record<string, string>, sectorCount: number, activeSectorCount: number): Nhm2AtlasLayer[] {
  return [
    layer("base_geometry", "Solve-derived ricci4 curvature shell and hull_sdf contour.", "spatial_geometry", true, outputs.base_geometry),
    layer("region_envelopes", "Nested whole-hull centerline, hull, wall, and exterior shell regions.", "spatial_geometry", true, outputs.region_envelopes),
    layer("sector_lattice", "Distributed tile-sector source architecture scheduling visualization.", "source_evidence", true, outputs.sector_lattice, { sectorCount, activeSectorCount }),
    layer("source_closure_regions", "Regional source-closure status brackets.", "source_evidence", false, outputs.source_closure_regions),
    layer("observer_qei_placeholders", "Observer and QEI placeholder paths and status badges.", "validation_overlay", false, outputs.observer_qei_placeholders),
    layer("tensor_authority_gate", "Full tensor authority gate matrix.", "validation_overlay", false, outputs.tensor_authority_gate),
    layer("frozen_run_ledger_frame", "Frozen-run blocker ledger badge frame.", "validation_overlay", false, outputs.frozen_run_ledger_frame),
    layer("combined_layered_atlas", "Combined diagnostic atlas frame.", "source_evidence", true, outputs.combined_layered_atlas, {
      tileInset: {
        representative: true,
        repeated: true,
        layoutScale: true,
        caption: "Tile colors are GDS/process mask layers, not spacetime field strength or intensity.",
      },
    }),
    layer("atlas_contact_sheet", "Contact sheet of atlas outputs.", "citation_boundary", false, outputs.atlas_contact_sheet),
  ];
}

function layer(
  id: string,
  label: string,
  semanticKind: Nhm2AtlasLayer["semanticKind"],
  visibleOnHull: boolean,
  outputPath: string,
  metadata?: Record<string, unknown>,
): Nhm2AtlasLayer {
  return {
    id,
    label,
    semanticKind,
    sourceArtifacts: ["nhm2_metric_brick", "nhm2_blocker_ledger", "nhm2_regional_source_closure_evidence"],
    visibleOnHull,
    claimBoundary: "diagnostic visualization only; non-promotional",
    statusEncoding:
      semanticKind === "validation_overlay"
        ? "panel_badge_matrix_not_physical_hull_field"
        : "solve_geometry_or_region_evidence_only",
    outputPath,
    metadata,
  };
}

function fixedCaptions(): Nhm2AtlasManifest["captions"] {
  return [
    {
      id: "base_geometry",
      text: "Solve-derived ricci4 curvature shell from the NHM2 3+1 metric brick.",
      literatureRefs: ["natario_2002_zero_expansion"],
    },
    {
      id: "region_envelopes",
      text: "Nested whole-hull regions: centerline, hull, wall, exterior shell.",
      literatureRefs: [],
    },
    {
      id: "sector_lattice",
      text: "Distributed tile-sector source architecture: 80 scheduled sectors, 2 active.",
      literatureRefs: [],
    },
    {
      id: "tile_inset",
      text: "Representative Casimir tile-sector inset: fabrication/layout scale, not field strength. Tile colors are GDS/process mask layers, not spacetime field strength or intensity.",
      literatureRefs: ["lamoreaux_1997_casimir_force", "klimchitskaya_2009_casimir_real_materials"],
    },
    {
      id: "ledger",
      text: "Frozen-run blocker ledger: diagnostic atlas only, promotion locked.",
      literatureRefs: ["alcubierre_1994_warp_metric", "pfenning_ford_1997_warp_qi", "fewster_2005_energy_inequalities", "santiago_schuster_visser_2022_generic_warp_nec"],
      nonPromotional: true,
    },
  ];
}

function captionsMarkdown(captions: Nhm2AtlasManifest["captions"]): string {
  return captions
    .map((caption, i) => `${i + 1}. ${caption.text}\n\n   refs: ${caption.literatureRefs.length ? caption.literatureRefs.join(", ") : "none required"}\n`)
    .join("\n");
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
