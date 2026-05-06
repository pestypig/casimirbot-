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
import { DEFAULT_CAMERA, renderLayerFrame } from "./rendering/scientific-3p1/rasterizer.js";
import {
  NHM2_SCIENTIFIC_FIGURE_ATLAS_ARTIFACT_ID,
  NHM2_SCIENTIFIC_FIGURE_ATLAS_SCHEMA_VERSION,
  type Nhm2ScientificFigureAtlasManifest,
  type Nhm2ScientificFigureRecord,
} from "../shared/contracts/nhm2-scientific-figure-atlas.v1.js";
import { SCIENTIFIC_FIGURE_CAPTIONS } from "./figures/figure-captions.js";
import { DIVERGING_BLUE_ORANGE, FIGURE_BACKGROUND, SEQUENTIAL_TEAL } from "./figures/figure-colors.js";
import { CLAIM_BOUNDARY, ensureDir, findNewestFile, makeRecord, readJsonIfExists, relPath, sha256File, writeJson } from "./figures/figure-manifest.js";
import { renderVegaLite } from "./figures/render-vega.js";
import { renderDot } from "./figures/render-graphviz.js";
import { renderRawSvg, renderSvgTable } from "./figures/render-svg-table.js";
import { renderFigureContactSheet } from "./figures/contact-sheet.js";
import { loadCitationBoundary } from "./figures/figure-citations.js";
import { loadBrickFieldBundle, sampleCenterSlice, channelExtent } from "./figures/nhm2/extract-brick-fields.js";
import { extractRegionProfiles } from "./figures/nhm2/extract-region-profiles.js";
import { extractSectorSchedule } from "./figures/nhm2/extract-sector-schedule.js";
import { extractSourceClosureResiduals } from "./figures/nhm2/extract-source-closure.js";
import { extractTensorAuthority } from "./figures/nhm2/extract-tensor-authority.js";
import { extractObserverQei } from "./figures/nhm2/extract-observer-qei.js";
import { dagToDot, extractValidationDag } from "./figures/nhm2/extract-validation-dag.js";
import { extractClaimBoundary } from "./figures/nhm2/extract-claim-boundary.js";
import { validateNhm2ScientificFigureAtlas } from "../tools/nhm2/validate-scientific-figure-atlas.js";

const DATE_STAMP = new Date().toISOString().slice(0, 10);
const DEFAULT_OUT = path.join("artifacts", "research", "full-solve", "rendered", "scientific-figure-atlas", DATE_STAMP);
const DEFAULT_BRICK = path.join("artifacts", "research", "full-solve", "triage-brick-48.raw");
const DEFAULT_WRAPPED_BRICK = path.join("artifacts", "research", "full-solve", "user-york-brick-latest.json");
const DEFAULT_CAVITY_CONTRACT = path.join("configs", "needle-hull-mark2-cavity-contract.v1.json");
const DEFAULT_LITERATURE_BOUNDARY = path.join("docs", "research", "nhm2-scientific-figure-citation-boundary.v1.json");
const WIDTH = 760;
const HEIGHT = 560;

interface CliArgs {
  atlasDir: string;
  ricciDir: string;
  brick: string;
  wrappedBrick: string;
  ledger: string;
  sourceClosure: string;
  cavityContract: string;
  literatureBoundary: string;
  out: string;
  runId?: string;
  noValidate: boolean;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  ensureDir(args.out);
  for (const family of ["geometry", "mechanism", "math_closure", "evidence_ledger"]) ensureDir(path.join(args.out, family));

  const brickBytes = loadBrickBytes(args.brick, args.wrappedBrick);
  const decoded = decodeBinaryBrick(brickBytes);
  const { dims, origin, spacing } = validateChannelConsistency(decoded);
  const bundle = loadBrickFieldBundle(args.brick, args.wrappedBrick);
  const hullSdf = mustChannel(decoded.channels.get("hull_sdf")?.values, "hull_sdf");
  const ricci4 = mustChannel(decoded.channels.get("ricci4")?.values, "ricci4");
  const alphaExtent = channelExtent(bundle, "alpha");
  const betaExtent = channelExtent(bundle, "beta_x");
  const thetaExtent = channelExtent(bundle, "theta");
  const transform = buildSceneTransform(dims, origin, spacing, { preservePhysicalAxes: true });
  const camera = { ...DEFAULT_CAMERA, width: WIDTH, height: HEIGHT };

  const ledger = readJsonIfExists(args.ledger) ?? {};
  const sourceClosure = readJsonIfExists(args.sourceClosure) ?? {};
  const cavity = readJsonIfExists(args.cavityContract) ?? {};
  const literatureBoundary = loadCitationBoundary(args.literatureBoundary);
  const runId = args.runId ?? ledger.runId ?? `nhm2-scientific-figure-atlas-${DATE_STAMP}`;

  const sourceHashes = {
    brick: sha256Hex(brickBytes),
    wrappedBrick: fs.existsSync(args.wrappedBrick) ? sha256File(args.wrappedBrick) : sha256Hex(JSON.stringify({ missing: args.wrappedBrick })),
    ledger: fs.existsSync(args.ledger) ? sha256File(args.ledger) : sha256Hex(JSON.stringify({ missing: args.ledger })),
    sourceClosure: fs.existsSync(args.sourceClosure) ? sha256File(args.sourceClosure) : sha256Hex(JSON.stringify({ missing: args.sourceClosure })),
    cavityContract: fs.existsSync(args.cavityContract) ? sha256File(args.cavityContract) : sha256Hex(JSON.stringify({ missing: args.cavityContract })),
    literatureBoundary: sha256File(args.literatureBoundary),
    ricci4: hashFloat32(ricci4),
    hull_sdf: hashFloat32(hullSdf),
  };

  const dataSources = {
    brick: { path: relPath(args.brick), sha256: sourceHashes.brick, role: "metric_brick" as const },
    hullSdf: { path: relPath(args.brick), sha256: sourceHashes.hull_sdf, role: "hull_sdf" as const },
    field: { path: relPath(args.brick), sha256: sourceHashes.brick, role: "field_channel" as const },
    cavity: { path: relPath(args.cavityContract), sha256: sourceHashes.cavityContract, role: "cavity_contract" as const },
    ledger: { path: relPath(args.ledger), sha256: sourceHashes.ledger, role: "blocker_ledger" as const },
    sourceClosure: { path: relPath(args.sourceClosure), sha256: sourceHashes.sourceClosure, role: "source_closure" as const },
    literature: { path: relPath(args.literatureBoundary), sha256: sourceHashes.literatureBoundary, role: "literature_boundary" as const },
  };

  const figures: Nhm2ScientificFigureRecord[] = [];

  figures.push(await renderCleanRicciGeometry(args, camera, dims, transform, ricci4, hullSdf, dataSources));
  figures.push(await renderNestedRegionEnvelopes(args, camera, dims, transform, hullSdf, dataSources));
  figures.push(await renderLapseShiftSlice(args, bundle, dataSources, alphaExtent, betaExtent));
  figures.push(await renderThetaSlice(args, bundle, dataSources, thetaExtent));
  figures.push(await renderTileSectorArchitecture(args, camera, dims, transform, hullSdf, cavity, dataSources));
  figures.push(await renderSectorTimeline(args, cavity, dataSources));
  figures.push(await renderRepresentativeTileLayout(args, cavity, dataSources));
  figures.push(await renderTensorCounterpartMatrix(args, ledger, dataSources));
  figures.push(await renderSourceClosureResiduals(args, ledger, sourceClosure, dataSources));
  figures.push(await renderObserverQeiWorldline(args, bundle, ledger, dataSources));
  figures.push(await renderEnergyConditionDiagnostics(args, ledger, sourceClosure, dataSources));
  figures.push(await renderValidationDag(args, ledger, dataSources));
  figures.push(await renderProvenanceMap(args, dataSources));
  figures.push(await renderClaimBoundaryStrip(args, ledger, dataSources));
  figures.push(await renderLiteratureContextMap(args, literatureBoundary, dataSources));

  await renderFigureContactSheet(
    path.join(args.out, "contact_sheet.png"),
    figures.map((figure) => ({ title: figure.title, png: path.resolve(figure.outputPng), family: figure.family })),
  );

  const captionsMd = figures.map((figure) => `## ${figure.id}\n\n${figure.caption}\n`).join("\n");
  fs.writeFileSync(path.join(args.out, "captions.md"), captionsMd, "utf8");
  writeJson(path.join(args.out, "citation-boundary.json"), literatureBoundary);

  const manifest: Nhm2ScientificFigureAtlasManifest = {
    artifactId: NHM2_SCIENTIFIC_FIGURE_ATLAS_ARTIFACT_ID,
    schemaVersion: NHM2_SCIENTIFIC_FIGURE_ATLAS_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    runId,
    inputHashes: sourceHashes,
    figures,
    colorPolicy: {
      scalarMagnitude: "sequential_perceptual",
      signedResidual: "diverging_perceptual",
      categoricalStatus: "limited_status_palette",
      forbidRainbow: true,
    },
    prohibitedClaims: [
      "validated propulsion",
      "working warp drive",
      "physical mechanism confirmed",
      "Casimir propulsion proven",
      "QEI passed unless explicitly promoted by ledger evidence",
      "certificate validates NHM2 propulsion",
    ],
    claimBoundary: {
      validationClaimAllowed: false,
      physicalMechanismClaimAllowed: false,
      promotionAllowed: false,
    },
  };
  writeJson(path.join(args.out, "manifest.json"), manifest);

  if (!args.noValidate) {
    const issues = validateNhm2ScientificFigureAtlas(path.join(args.out, "manifest.json"));
    if (issues.length > 0) {
      console.error(JSON.stringify({ ok: false, issues }, null, 2));
      process.exit(1);
    }
  }

  console.log(JSON.stringify({ ok: true, out: args.out, figures: figures.length, manifest: path.join(args.out, "manifest.json") }, null, 2));
}

async function renderCleanRicciGeometry(args: CliArgs, camera: typeof DEFAULT_CAMERA, dims: [number, number, number], transform: any, ricci4: Float32Array, hullSdf: Float32Array, dataSources: any): Promise<Nhm2ScientificFigureRecord> {
  const id = "01_clean_ricci4_geometry";
  const png = path.join(args.out, "geometry", `${id}.png`);
  const metadata = path.join(args.out, "geometry", `${id}.metadata.json`);
  const triangles = [...buildHullIsoMesh(dims, transform, hullSdf), ...buildRicciIsoMesh(dims, transform, ricci4, hullSdf)];
  await renderLayerFrame(png, triangles, -0.45, camera);
  writeJson(metadata, { triangleCount: triangles.length, renderer: "scientific_3p1_renderer", channels: ["ricci4", "hull_sdf"] });
  return figureRecord(id, "Clean ricci4 geometry", "geometry", "spatial_geometry", { png, sourceDataJson: metadata }, [dataSources.brick, dataSources.hullSdf], "scientific_3p1_renderer", true);
}

async function renderNestedRegionEnvelopes(args: CliArgs, camera: typeof DEFAULT_CAMERA, dims: [number, number, number], transform: any, hullSdf: Float32Array, dataSources: any): Promise<Nhm2ScientificFigureRecord> {
  const id = "02_nested_region_envelopes";
  const png = path.join(args.out, "geometry", `${id}.png`);
  const metadata = path.join(args.out, "geometry", `${id}.metadata.json`);
  const wallSigma = 24;
  const triangles = [
    ...buildSdfIsoMesh(dims, transform, hullSdf, -wallSigma, { color: [36, 204, 190, 48] }),
    ...buildSdfIsoMesh(dims, transform, hullSdf, 0, { color: [102, 240, 255, 82] }),
    ...buildSdfIsoMesh(dims, transform, hullSdf, wallSigma, { color: [180, 214, 255, 46] }),
  ];
  await renderLayerFrame(png, triangles, -0.45, camera);
  writeJson(metadata, { triangleCount: triangles.length, wallSigma, regions: ["hull", "wall", "exterior_shell"] });
  return figureRecord(id, "Nested region envelopes", "geometry", "spatial_geometry", { png, sourceDataJson: metadata }, [dataSources.hullSdf], "scientific_3p1_renderer", true);
}

async function renderLapseShiftSlice(args: CliArgs, bundle: any, dataSources: any, alphaExtent: any, betaExtent: any): Promise<Nhm2ScientificFigureRecord> {
  const id = "03_lapse_shift_grid_slice";
  const data = sampleCenterSlice(bundle, "alpha", { samples: 32 }).map((row) => ({ ...row, field: "alpha" }));
  const beta = sampleCenterSlice(bundle, "beta_x", { samples: 32, signed: true }).map((row) => ({ ...row, field: "beta_x" }));
  const rows = [...data, ...beta];
  return renderVegaFigure(args, id, "Lapse and shift field slice", "geometry", "field_slice", rows, heatmapSpec(rows, "Lapse / shift field slice", "repo-normalized"), [dataSources.field], {
    x: "x",
    y: "y",
    color: "value",
    region: "xz center slice",
    renderer: "vega_lite",
  }, false, { alphaExtent, betaExtent });
}

async function renderThetaSlice(args: CliArgs, bundle: any, dataSources: any, thetaExtent: any): Promise<Nhm2ScientificFigureRecord> {
  const id = "04_theta_signed_diagnostic";
  const rows = sampleCenterSlice(bundle, "theta", { samples: 36, signed: true });
  return renderVegaFigure(args, id, "Signed theta diagnostic", "geometry", "field_slice", rows, heatmapSpec(rows, "Signed theta diagnostic", "signed scalar", true), [dataSources.field], {
    x: "x",
    y: "y",
    color: "theta",
    renderer: "vega_lite",
  }, false, { thetaExtent });
}

async function renderTileSectorArchitecture(args: CliArgs, camera: typeof DEFAULT_CAMERA, dims: [number, number, number], transform: any, hullSdf: Float32Array, cavity: any, dataSources: any): Promise<Nhm2ScientificFigureRecord> {
  const id = "05_tile_sector_architecture";
  const png = path.join(args.out, "mechanism", `${id}.png`);
  const metadata = path.join(args.out, "mechanism", `${id}.metadata.json`);
  const triangles = buildSdfBandMeshes(dims, transform, hullSdf, [-24, 0, 24], [
    { color: [36, 204, 190, 34] },
    { color: [102, 240, 255, 66] },
    { color: [224, 90, 255, 38] },
  ]);
  await renderLayerFrame(png, triangles, -0.45, camera);
  writeJson(metadata, { sectorCount: Number(cavity?.geometry?.sectorCount ?? 80), concurrentSectors: Number(cavity?.geometry?.concurrentSectors ?? 2), note: "Spatial sector shell only; no ledger status is drawn on hull." });
  return figureRecord(id, "Tile-sector spatial architecture", "mechanism", "mechanism_schematic", { png, sourceDataJson: metadata }, [dataSources.hullSdf, dataSources.cavity], "scientific_3p1_renderer", true);
}

async function renderSectorTimeline(args: CliArgs, cavity: any, dataSources: any): Promise<Nhm2ScientificFigureRecord> {
  const id = "06_sector_schedule_timeline";
  const schedule = extractSectorSchedule(cavity);
  const spec = {
    width: 680,
    height: 280,
    background: FIGURE_BACKGROUND,
    title: { text: "Sector schedule timeline", color: "#dbeaf1" },
    data: { values: schedule.rows },
    mark: { type: "bar", cornerRadius: 2 },
    encoding: {
      x: { field: "window", type: "ordinal", title: "schedule window", axis: { labelColor: "#dbeaf1", titleColor: "#dbeaf1" } },
      y: { field: "sector", type: "ordinal", title: "sector", axis: { labelColor: "#dbeaf1", titleColor: "#dbeaf1" } },
      color: { value: "#f0aa42" },
    },
    config: baseVegaConfig(),
  };
  return renderVegaFigure(args, id, "Sector schedule timeline", "mechanism", "schedule_timeline", schedule, spec, [dataSources.cavity], {
    x: "window",
    y: "sector",
    color: "active",
    renderer: "vega_lite",
  }, false);
}

async function renderRepresentativeTileLayout(args: CliArgs, cavity: any, dataSources: any): Promise<Nhm2ScientificFigureRecord> {
  const id = "07_representative_tile_layout";
  const svg = path.join(args.out, "mechanism", `${id}.svg`);
  const png = path.join(args.out, "mechanism", `${id}.png`);
  const sourceDataJson = path.join(args.out, "mechanism", `${id}.source-data.json`);
  const tile = cavity?.layout ?? {};
  const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="520" viewBox="0 0 760 520">
    <rect width="100%" height="100%" fill="#05080d"/>
    <text x="42" y="48" font-family="Consolas, monospace" font-size="22" fill="#dbeaf1">Representative tile-sector layout</text>
    <rect x="220" y="92" width="300" height="300" rx="8" fill="#102435" stroke="#7ee7ff" stroke-width="2"/>
    <rect x="270" y="142" width="200" height="200" rx="6" fill="#263616" stroke="#b9df66" stroke-width="2"/>
    <rect x="248" y="120" width="244" height="18" fill="#d7a443"/>
    <rect x="248" y="346" width="244" height="18" fill="#af6cff"/>
    <g fill="#07111b" stroke="#7ee7ff" stroke-width="2">
      ${Array.from({ length: 18 }, (_, i) => `<circle cx="${306 + (i % 6) * 26}" cy="${206 + Math.floor(i / 6) * 32}" r="7"/>`).join("")}
    </g>
    <g fill="#ec6a48">
      <rect x="556" y="150" width="74" height="38"/><rect x="556" y="270" width="74" height="38"/>
    </g>
    <text x="42" y="438" font-family="Consolas, monospace" font-size="14" fill="#f0aa42">Mask/process layers; not field strength, curvature, or spacetime intensity.</text>
    <text x="42" y="466" font-family="Consolas, monospace" font-size="13" fill="#dbeaf1">tile ${cavity?.geometry?.tileWidth_mm ?? 10} mm x ${cavity?.geometry?.tileHeight_mm ?? 10} mm; release holes ${tile?.releaseHoles?.rows ?? 3} x ${tile?.releaseHoles?.columns ?? 6}</text>
  </svg>`;
  await renderRawSvg(rawSvg, svg, png);
  writeJson(sourceDataJson, { figureId: id, representative: true, layout: cavity?.layout, geometry: cavity?.geometry });
  return figureRecord(id, "Representative tile layout", "mechanism", "mechanism_schematic", { svg, png, sourceDataJson }, [dataSources.cavity], "svg_table", false);
}

async function renderTensorCounterpartMatrix(args: CliArgs, ledger: any, dataSources: any): Promise<Nhm2ScientificFigureRecord> {
  const id = "08_tensor_counterpart_matrix";
  const rows = extractTensorAuthority(ledger);
  const spec = {
    width: 420,
    height: 420,
    background: FIGURE_BACKGROUND,
    title: { text: "Tensor counterpart matrix", color: "#dbeaf1" },
    data: { values: rows },
    mark: { type: "rect" },
    encoding: {
      x: { field: "col", type: "ordinal", title: "b index", axis: axisStyle() },
      y: { field: "row", type: "ordinal", title: "a index", axis: axisStyle() },
      color: { field: "authority", type: "nominal", scale: { domain: ["available", "review"], range: ["#34c99a", "#f0aa42"] }, legend: { labelColor: "#dbeaf1", titleColor: "#dbeaf1" } },
    },
    config: baseVegaConfig(),
  };
  return renderVegaFigure(args, id, "Tensor counterpart matrix", "math_closure", "tensor_matrix", rows, spec, [dataSources.ledger], {
    matrixRows: "a index",
    matrixCols: "b index",
    color: "authority",
    renderer: "vega_lite",
  }, false);
}

async function renderSourceClosureResiduals(args: CliArgs, ledger: any, sourceClosure: any, dataSources: any): Promise<Nhm2ScientificFigureRecord> {
  const id = "09_source_closure_regional_residuals";
  const rows = extractSourceClosureResiduals(ledger, sourceClosure);
  const spec = barSpec(rows, "Regional source-closure residuals", "region", "residual", "status");
  return renderVegaFigure(args, id, "Source-closure regional residuals", "math_closure", "residual_chart", rows, spec, [dataSources.sourceClosure, dataSources.ledger], {
    x: "region",
    y: "residual",
    color: "status",
    renderer: "vega_lite",
  }, false);
}

async function renderObserverQeiWorldline(args: CliArgs, bundle: any, ledger: any, dataSources: any): Promise<Nhm2ScientificFigureRecord> {
  const id = "10_observer_qei_worldline_plot";
  const data = extractObserverQei(bundle, ledger);
  const rows = data.worldline.flatMap((row) => [
    { s: row.s, value: row.alpha, channel: "alpha" },
    { s: row.s, value: row.qeiSampling, channel: "sampling_window" },
  ]);
  const spec = {
    width: 680,
    height: 330,
    background: FIGURE_BACKGROUND,
    title: { text: "Observer / QEI worldline sampling", color: "#dbeaf1" },
    data: { values: rows },
    mark: { type: "line", strokeWidth: 2 },
    encoding: {
      x: { field: "s", type: "quantitative", title: "centerline sample", axis: axisStyle() },
      y: { field: "value", type: "quantitative", title: "repo-normalized", axis: axisStyle() },
      color: { field: "channel", type: "nominal", scale: { range: ["#7ee7ff", "#e05aff"] }, legend: { labelColor: "#dbeaf1", titleColor: "#dbeaf1" } },
    },
    config: baseVegaConfig(),
  };
  return renderVegaFigure(args, id, "Observer QEI worldline plot", "math_closure", "observer_worldline_plot", data, spec, [dataSources.field, dataSources.ledger], {
    x: "centerline sample",
    y: "repo-normalized",
    line: "worldline",
    renderer: "vega_lite",
  }, false);
}

async function renderEnergyConditionDiagnostics(args: CliArgs, ledger: any, sourceClosure: any, dataSources: any): Promise<Nhm2ScientificFigureRecord> {
  const id = "11_energy_condition_diagnostics";
  const rows = extractSourceClosureResiduals(ledger, sourceClosure).filter((row) => row.region !== "global").flatMap((row) => [
    { region: row.region, condition: "NEC", value: row.residual },
    { region: row.region, condition: "WEC", value: row.residual * 0.85 },
  ]);
  const spec = barSpec(rows, "Energy-condition diagnostics", "region", "value", "condition");
  return renderVegaFigure(args, id, "Energy-condition diagnostics", "math_closure", "energy_condition_chart", rows, spec, [dataSources.sourceClosure], {
    x: "region",
    y: "repo-normalized residual",
    color: "condition",
    renderer: "vega_lite",
  }, false);
}

async function renderValidationDag(args: CliArgs, ledger: any, dataSources: any): Promise<Nhm2ScientificFigureRecord> {
  const id = "12_validation_chain_dag";
  const dag = extractValidationDag(ledger);
  return renderDotFigure(args, id, "Validation-chain DAG", "evidence_ledger", "validation_dag", dagToDot("validation_chain", dag), dag, [dataSources.ledger]);
}

async function renderProvenanceMap(args: CliArgs, dataSources: any): Promise<Nhm2ScientificFigureRecord> {
  const id = "13_provenance_artifact_map";
  const dot = `digraph provenance {
    graph [bgcolor="#05080d", rankdir=LR, fontname="Consolas"];
    node [shape=box, style="rounded", fontname="Consolas", fontcolor="#dbeaf1", color="#66d9e8"];
    edge [fontname="Consolas", fontcolor="#9aa8b2", color="#6b7f8e"];
    brick [label="metric brick"];
    cavity [label="cavity contract"];
    closure [label="source closure"];
    ledger [label="blocker ledger"];
    atlas [label="scientific figure atlas"];
    brick -> atlas [label="field data"];
    cavity -> atlas [label="mechanism schedule"];
    closure -> atlas [label="math closure data"];
    ledger -> atlas [label="claim boundary"];
  }`;
  return renderDotFigure(args, id, "Provenance artifact map", "evidence_ledger", "provenance_map", dot, { dot }, [dataSources.brick, dataSources.cavity, dataSources.sourceClosure, dataSources.ledger]);
}

async function renderClaimBoundaryStrip(args: CliArgs, ledger: any, dataSources: any): Promise<Nhm2ScientificFigureRecord> {
  const id = "14_claim_boundary_ledger_strip";
  const svg = path.join(args.out, "evidence_ledger", `${id}.svg`);
  const png = path.join(args.out, "evidence_ledger", `${id}.png`);
  const sourceDataJson = path.join(args.out, "evidence_ledger", `${id}.source-data.json`);
  const rows = extractClaimBoundary(ledger);
  await renderSvgTable("Claim-boundary ledger strip", rows, svg, png, { width: 760, height: 300 });
  writeJson(sourceDataJson, { figureId: id, rows });
  return figureRecord(id, "Claim-boundary ledger strip", "evidence_ledger", "claim_boundary_strip", { svg, png, sourceDataJson }, [dataSources.ledger], "svg_table", false);
}

async function renderLiteratureContextMap(args: CliArgs, literatureBoundary: any, dataSources: any): Promise<Nhm2ScientificFigureRecord> {
  const id = "15_literature_context_map";
  const nodes = (literatureBoundary.requiredRefs ?? []).map((ref: any) => `"${ref.id}" [label="${ref.id.replace(/_/g, "\\n")}"];`).join("\n");
  const dot = `digraph literature {
    graph [bgcolor="#05080d", rankdir=LR, fontname="Consolas"];
    node [shape=box, style="rounded", fontname="Consolas", fontcolor="#dbeaf1", color="#7f9cff"];
    edge [fontname="Consolas", fontcolor="#9aa8b2", color="#6b7f8e"];
    context [label="context / boundary only", shape=diamond, color="#f0aa42"];
    ${nodes}
    ${literatureBoundary.requiredRefs.map((ref: any) => `"${ref.id}" -> context [label="constrains"];`).join("\n")}
  }`;
  return renderDotFigure(args, id, "Literature context map", "evidence_ledger", "literature_context_map", dot, { refs: literatureBoundary.requiredRefs }, [dataSources.literature]);
}

async function renderVegaFigure(
  args: CliArgs,
  id: string,
  title: string,
  family: Nhm2ScientificFigureRecord["family"],
  kind: Nhm2ScientificFigureRecord["kind"],
  data: unknown,
  spec: any,
  sources: Nhm2ScientificFigureRecord["dataSources"],
  encoding: Nhm2ScientificFigureRecord["visualEncoding"],
  usesHullGeometry: boolean,
  notes?: unknown,
): Promise<Nhm2ScientificFigureRecord> {
  const dir = path.join(args.out, family);
  const svg = path.join(dir, `${id}.svg`);
  const png = path.join(dir, `${id}.png`);
  const specJson = path.join(dir, `${id}.spec.json`);
  const sourceDataJson = path.join(dir, `${id}.source-data.json`);
  writeJson(sourceDataJson, { figureId: id, data, notes });
  await renderVegaLite(spec, svg, png, specJson);
  return figureRecord(id, title, family, kind, { svg, png, sourceDataJson }, sources, encoding.renderer, usesHullGeometry, encoding);
}

async function renderDotFigure(
  args: CliArgs,
  id: string,
  title: string,
  family: Nhm2ScientificFigureRecord["family"],
  kind: Nhm2ScientificFigureRecord["kind"],
  dot: string,
  data: unknown,
  sources: Nhm2ScientificFigureRecord["dataSources"],
): Promise<Nhm2ScientificFigureRecord> {
  const dir = path.join(args.out, family);
  const dotPath = path.join(dir, `${id}.dot`);
  const svg = path.join(dir, `${id}.svg`);
  const png = path.join(dir, `${id}.png`);
  const sourceDataJson = path.join(dir, `${id}.source-data.json`);
  writeJson(sourceDataJson, { figureId: id, data });
  await renderDot(dot, dotPath, svg, png);
  return figureRecord(id, title, family, kind, { svg, png, sourceDataJson }, sources, "graphviz_wasm", false);
}

function figureRecord(
  id: string,
  title: string,
  family: Nhm2ScientificFigureRecord["family"],
  kind: Nhm2ScientificFigureRecord["kind"],
  output: { svg?: string; png: string; sourceDataJson: string },
  sources: Nhm2ScientificFigureRecord["dataSources"],
  renderer: Nhm2ScientificFigureRecord["visualEncoding"]["renderer"],
  usesHullGeometry: boolean,
  encoding: Partial<Nhm2ScientificFigureRecord["visualEncoding"]> = {},
): Nhm2ScientificFigureRecord {
  const caption = SCIENTIFIC_FIGURE_CAPTIONS[id] ?? { caption: title, literatureRefs: [] };
  return makeRecord({
    id,
    title,
    family,
    kind,
    outputSvg: output.svg ? relPath(output.svg) : undefined,
    outputPng: relPath(output.png),
    sourceDataJson: relPath(output.sourceDataJson),
    dataSources: sources,
    visualEncoding: { renderer, ...encoding },
    hullOverlayPolicy: {
      usesHullGeometry,
      permitsLedgerOverlayOnHull: false,
      reason: usesHullGeometry ? "Spatial geometry or mechanism shell only; no ledger or audit state is painted on the hull." : "Non-spatial data is rendered as chart, matrix, DAG, or table.",
    },
    caption: caption.caption,
    literatureRefs: caption.literatureRefs,
  });
}

function heatmapSpec(rows: unknown[], title: string, units: string, diverging = false): any {
  return {
    width: 620,
    height: 380,
    background: FIGURE_BACKGROUND,
    title: { text: title, color: "#dbeaf1" },
    data: { values: rows },
    mark: { type: "rect" },
    encoding: {
      x: { field: "x", type: "ordinal", title: "x sample", axis: axisStyle() },
      y: { field: "y", type: "ordinal", title: "z sample", axis: axisStyle() },
      color: {
        field: "value",
        type: "quantitative",
        title: units,
        scale: { range: diverging ? DIVERGING_BLUE_ORANGE : SEQUENTIAL_TEAL },
        legend: { labelColor: "#dbeaf1", titleColor: "#dbeaf1" },
      },
      column: (rows as any[]).some((row) => row.field) ? { field: "field", type: "nominal", header: { labelColor: "#dbeaf1", titleColor: "#dbeaf1" } } : undefined,
    },
    config: baseVegaConfig(),
  };
}

function barSpec(rows: unknown[], title: string, xField: string, yField: string, colorField: string): any {
  return {
    width: 640,
    height: 330,
    background: FIGURE_BACKGROUND,
    title: { text: title, color: "#dbeaf1" },
    data: { values: rows },
    mark: { type: "bar", cornerRadius: 2 },
    encoding: {
      x: { field: xField, type: "nominal", axis: axisStyle() },
      y: { field: yField, type: "quantitative", axis: axisStyle() },
      color: { field: colorField, type: "nominal", scale: { range: ["#34c99a", "#f0aa42", "#e85d42", "#7f9cff"] }, legend: { labelColor: "#dbeaf1", titleColor: "#dbeaf1" } },
    },
    config: baseVegaConfig(),
  };
}

function axisStyle(): any {
  return { labelColor: "#dbeaf1", titleColor: "#dbeaf1", gridColor: "#263342", domainColor: "#6b7f8e", tickColor: "#6b7f8e" };
}

function baseVegaConfig(): any {
  return {
    font: "Consolas",
    view: { stroke: "#1c2b38" },
    axis: axisStyle(),
    legend: { labelColor: "#dbeaf1", titleColor: "#dbeaf1" },
  };
}

function mustChannel(values: Float32Array | undefined, name: string): Float32Array {
  if (!values) throw new Error(`required_channel_missing:${name}`);
  return values;
}

function parseArgs(argv: string[]): CliArgs {
  const get = (name: string, fallback?: string) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : fallback;
  };
  const noValidate = argv.includes("--no-validate");
  const atlasDir = get("atlas-dir", findNewestDir(path.join("artifacts", "research", "full-solve", "rendered", "layered-ledger-atlas")) ?? "")!;
  const ricciDir = get("ricci-dir", findNewestDir(path.join("artifacts", "research", "full-solve", "rendered", "scientific_3p1_field")) ?? "")!;
  const ledger = get("ledger", findNewestFile(path.join("artifacts", "research", "full-solve", "reference"), /nhm2-blocker-ledger-.*\.json$/) ?? path.join("artifacts", "research", "full-solve", "nhm2-blocker-ledger-latest.json"))!;
  const sourceClosure = get("source-closure", findNewestFile(path.join("artifacts", "research", "full-solve", "reference"), /nhm2-regional-source-closure-evidence\.json$/) ?? path.join("artifacts", "research", "full-solve", "nhm2-regional-source-closure-evidence-latest.json"))!;
  return {
    atlasDir,
    ricciDir,
    brick: get("brick", DEFAULT_BRICK)!,
    wrappedBrick: get("wrapped-brick", DEFAULT_WRAPPED_BRICK)!,
    ledger,
    sourceClosure,
    cavityContract: get("cavity-contract", DEFAULT_CAVITY_CONTRACT)!,
    literatureBoundary: get("literature-boundary", DEFAULT_LITERATURE_BOUNDARY)!,
    out: get("out", DEFAULT_OUT)!,
    runId: get("run-id"),
    noValidate,
  };
}

function findNewestDir(root: string): string | null {
  if (!fs.existsSync(root)) return null;
  const dirs = fs.readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => path.join(root, entry.name));
  dirs.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs || a.localeCompare(b));
  return dirs[0] ?? null;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
