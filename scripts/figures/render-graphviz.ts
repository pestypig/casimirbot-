import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { Graphviz } from "@hpcc-js/wasm/graphviz";
import { ensureDir } from "./figure-manifest.js";

export async function renderDotToSvg(dot: string, outSvg: string): Promise<void> {
  ensureDir(path.dirname(outSvg));
  const graphviz = await Graphviz.load();
  const svg = graphviz.dot(dot, "svg");
  fs.writeFileSync(outSvg, svg, "utf8");
}

export async function renderDotToPng(dot: string, outPng: string): Promise<void> {
  const graphviz = await Graphviz.load();
  const svg = graphviz.dot(dot, "svg");
  ensureDir(path.dirname(outPng));
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  fs.writeFileSync(outPng, png);
}

export async function renderDot(dot: string, outDot: string, outSvg: string, outPng: string): Promise<void> {
  writeDot(dot, outDot);
  await renderDotToSvg(dot, outSvg);
  await renderDotToPng(dot, outPng);
}

export function writeDot(dot: string, outDot: string): void {
  ensureDir(path.dirname(outDot));
  fs.writeFileSync(outDot, dot, "utf8");
}
