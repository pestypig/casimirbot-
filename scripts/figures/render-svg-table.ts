import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ensureDir } from "./figure-manifest.js";
import { escapeXml, FIGURE_BACKGROUND, FIGURE_FOREGROUND, statusColor } from "./figure-colors.js";

export interface SvgTableRow {
  label: string;
  value: string;
  status?: string;
}

export async function renderSvgTable(title: string, rows: SvgTableRow[], outSvg: string, outPng: string, options: { width?: number; height?: number } = {}): Promise<void> {
  const width = options.width ?? 760;
  const rowH = 42;
  const height = options.height ?? Math.max(260, 88 + rows.length * rowH);
  const body = rows.map((row, i) => {
    const y = 78 + i * rowH;
    const color = statusColor(row.status ?? row.value);
    return `
      <rect x="28" y="${y - 24}" width="${width - 56}" height="34" rx="6" fill="#07121b" stroke="${color}" stroke-width="1"/>
      <circle cx="48" cy="${y - 7}" r="5" fill="${color}"/>
      <text x="66" y="${y - 11}" font-size="13" fill="${FIGURE_FOREGROUND}">${escapeXml(row.label)}</text>
      <text x="${width - 310}" y="${y - 11}" font-size="13" fill="${color}">${escapeXml(row.value)}</text>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="${FIGURE_BACKGROUND}"/>
    <text x="28" y="38" font-family="Consolas, monospace" font-size="22" fill="${FIGURE_FOREGROUND}">${escapeXml(title)}</text>
    <g font-family="Consolas, monospace">${body}</g>
  </svg>`;
  ensureDir(path.dirname(outSvg));
  fs.writeFileSync(outSvg, svg, "utf8");
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  fs.writeFileSync(outPng, png);
}

export async function renderRawSvg(svg: string, outSvg: string, outPng: string): Promise<void> {
  ensureDir(path.dirname(outSvg));
  fs.writeFileSync(outSvg, svg, "utf8");
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  fs.writeFileSync(outPng, png);
}
