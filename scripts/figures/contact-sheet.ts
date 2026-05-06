import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ensureDir } from "./figure-manifest.js";

export async function renderFigureContactSheet(outPng: string, figures: Array<{ title: string; png: string; family: string }>): Promise<void> {
  const tileW = 360;
  const tileH = 310;
  const columns = 3;
  const rows = Math.ceil(figures.length / columns);
  const width = columns * tileW;
  const height = 70 + rows * tileH;
  const composites: sharp.OverlayOptions[] = [];

  for (let i = 0; i < figures.length; i += 1) {
    const figure = figures[i];
    const x = (i % columns) * tileW;
    const y = 70 + Math.floor(i / columns) * tileH;
    const input = fs.existsSync(figure.png)
      ? fs.readFileSync(figure.png)
      : Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${tileW}" height="${tileH - 50}"><rect width="100%" height="100%" fill="#05080d"/><text x="18" y="42" font-family="Consolas, monospace" font-size="14" fill="#e85d42">missing source image</text></svg>`);
    const resized = await sharp(input).resize({ width: tileW, height: tileH - 50, fit: "contain", background: "#05080d" }).png().toBuffer();
    composites.push({ input: resized, left: x, top: y });
    composites.push({
      input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${tileW}" height="50">
        <rect width="100%" height="100%" fill="#101923"/>
        <text x="12" y="20" font-family="Consolas, monospace" font-size="12" fill="#dbeaf1">${escapeXml(figure.title)}</text>
        <text x="12" y="38" font-family="Consolas, monospace" font-size="11" fill="#8fb8c6">${escapeXml(figure.family)}</text>
      </svg>`),
      left: x,
      top: y + tileH - 50,
    });
  }

  const base = sharp({
    create: { width, height, channels: 4, background: "#05080d" },
  });
  composites.push({
    input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="70">
      <rect width="100%" height="100%" fill="#05080d"/>
      <text x="18" y="42" font-family="Consolas, monospace" font-size="24" fill="#dbeaf1">NHM2 scientific figure atlas</text>
    </svg>`),
    left: 0,
    top: 0,
  });
  ensureDir(path.dirname(outPng));
  await base.composite(composites).png().toFile(outPng);
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
