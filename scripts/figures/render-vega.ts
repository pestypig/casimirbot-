import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import * as vega from "vega";
import * as vegaLite from "vega-lite";
import { ensureDir, writeJson } from "./figure-manifest.js";

export async function renderVegaLiteToSvg(spec: any, outSvg: string): Promise<void> {
  ensureDir(path.dirname(outSvg));
  const compiled = vegaLite.compile(spec).spec;
  const view = new vega.View(vega.parse(compiled), { renderer: "none" });
  const svg = await view.toSVG();
  fs.writeFileSync(outSvg, svg, "utf8");
}

export async function renderVegaLiteToPng(spec: any, outPng: string): Promise<void> {
  const compiled = vegaLite.compile(spec).spec;
  const view = new vega.View(vega.parse(compiled), { renderer: "none" });
  const svg = await view.toSVG();
  ensureDir(path.dirname(outPng));
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  fs.writeFileSync(outPng, png);
}

export async function renderVegaLite(spec: any, outSvg: string, outPng: string, outSpecJson: string): Promise<void> {
  writeSpecJson(spec, outSpecJson);
  await renderVegaLiteToSvg(spec, outSvg);
  await renderVegaLiteToPng(spec, outPng);
}

export function writeSpecJson(spec: any, outJson: string): void {
  writeJson(outJson, spec);
}
