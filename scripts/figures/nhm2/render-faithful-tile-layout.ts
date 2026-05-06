import { renderRawSvg } from "../render-svg-table.js";
import { writeJson } from "../figure-manifest.js";

export const REQUIRED_TILE_LAYERS = [
  "die_outline",
  "bottom_mirror_electrode",
  "cavity_gap_pocket",
  "top_membrane",
  "anchor_posts",
  "release_holes",
  "seal_ring",
  "edge_pads",
  "alignment_marks",
  "witness_coupons",
] as const;

export async function renderFaithfulTileLayout(cavity: any, outSvg: string, outPng: string, sourceDataJson: string): Promise<void> {
  const layout = cavity?.layout ?? {};
  const geometry = cavity?.geometry ?? {};
  const releaseRows = Number(layout.releaseHoles?.rows ?? 3);
  const releaseCols = Number(layout.releaseHoles?.columns ?? 6);
  const anchorCount = Number(layout.anchorPosts?.count ?? 16);
  const anchorNodes = Array.from({ length: anchorCount }, (_, i) => {
    const angle = (i / anchorCount) * Math.PI * 2;
    const cx = 380 + Math.cos(angle) * 118;
    const cy = 258 + Math.sin(angle) * 118;
    return `<circle class="anchor_posts" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="7"/>`;
  }).join("");
  const holes = Array.from({ length: releaseRows * releaseCols }, (_, i) => {
    const col = i % releaseCols;
    const row = Math.floor(i / releaseCols);
    return `<circle class="release_holes" cx="${304 + col * 30}" cy="${224 + row * 30}" r="6"/>`;
  }).join("");
  const coupons = (layout.witnessCoupons ?? [
    { name: "nanogap_metrology" },
    { name: "q_spoil_monitor" },
    { name: "sign_control_coupon" },
  ]).map((coupon: any, i: number) => `
    <rect class="witness_coupons" x="${572}" y="${158 + i * 58}" width="112" height="32" rx="4"/>
    <text x="586" y="${179 + i * 58}" font-size="10" fill="#05080d">${escapeXml(coupon.name)}</text>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="560" viewBox="0 0 760 560">
    <style>
      text { font-family: Consolas, monospace; }
      .die_outline { fill: #0c1d2b; stroke: #7ee7ff; stroke-width: 2; }
      .bottom_mirror_electrode { fill: #d7a443; }
      .cavity_gap_pocket { fill: #263616; stroke: #b9df66; stroke-width: 2; }
      .top_membrane { fill: none; stroke: #af6cff; stroke-width: 8; }
      .anchor_posts { fill: #dbeaf1; stroke: #7f9cff; stroke-width: 2; }
      .release_holes { fill: #05080d; stroke: #7ee7ff; stroke-width: 2; }
      .seal_ring { fill: none; stroke: #66d9e8; stroke-width: 8; }
      .edge_pads { fill: #ec6a48; }
      .alignment_marks { fill: #f0aa42; }
      .witness_coupons { fill: #91edf2; stroke: #7ee7ff; stroke-width: 1; }
    </style>
    <rect width="100%" height="100%" fill="#05080d"/>
    <text x="38" y="42" font-size="22" fill="#dbeaf1">Representative Casimir tile-sector layout</text>
    <rect class="die_outline" x="180" y="78" width="360" height="360" rx="10"/>
    <rect class="seal_ring" x="208" y="106" width="304" height="304" rx="10"/>
    <rect class="bottom_mirror_electrode" x="250" y="128" width="260" height="18"/>
    <rect class="cavity_gap_pocket" x="282" y="168" width="196" height="168" rx="6"/>
    <rect class="top_membrane" x="258" y="360" width="244" height="0"/>
    ${anchorNodes}
    ${holes}
    <g class="edge_pads">
      <rect x="92" y="150" width="58" height="44" rx="3"/>
      <rect x="92" y="322" width="58" height="44" rx="3"/>
      <rect x="572" y="92" width="58" height="44" rx="3"/>
      <rect x="572" y="380" width="58" height="44" rx="3"/>
    </g>
    <g class="alignment_marks">
      <path d="M204 92 h24 v8 h-8 v16 h-8 v-16 h-8z"/>
      <path d="M498 92 h24 v8 h-8 v16 h-8 v-16 h-8z"/>
      <path d="M204 408 h24 v8 h-8 v16 h-8 v-16 h-8z"/>
      <path d="M498 408 h24 v8 h-8 v16 h-8 v-16 h-8z"/>
    </g>
    ${coupons}
    <text x="38" y="482" font-size="13" fill="#f0aa42">Colors encode GDS/process mask layers, not field strength, curvature, or spacetime intensity.</text>
    <text x="38" y="510" font-size="12" fill="#dbeaf1">tile ${geometry.tileWidth_mm ?? 10} mm x ${geometry.tileHeight_mm ?? 10} mm; gap ${geometry.gap_nm ?? 8} nm; pocket ${geometry.pocketDiameter_um ?? 6000} um</text>
  </svg>`;
  await renderRawSvg(svg, outSvg, outPng);
  writeJson(sourceDataJson, {
    figureId: "07_representative_tile_layout",
    representative: true,
    requiredLayers: REQUIRED_TILE_LAYERS,
    layout,
    geometry,
  });
}

function escapeXml(text: unknown): string {
  return String(text).replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return char;
    }
  });
}
