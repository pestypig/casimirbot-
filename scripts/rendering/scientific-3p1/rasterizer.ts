import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import type { Vec3 } from "./brick-io.js";
import type { Triangle } from "./mesh.js";

export interface RenderCamera {
  width: number;
  height: number;
  tiltRad: number;
  cameraDistance: number;
  focalPx: number;
  background: [number, number, number, number];
}

export const DEFAULT_CAMERA: RenderCamera = {
  width: 640,
  height: 640,
  tiltRad: (24 * Math.PI) / 180,
  cameraDistance: 3.2,
  focalPx: 470,
  background: [5, 8, 13, 255],
};

interface Projected {
  x: number;
  y: number;
  z: number;
}

export async function writeRgbaPng(outPath: string, rgba: Uint8Array, width: number, height: number): Promise<void> {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await sharp(rgba, { raw: { width, height, channels: 4 } }).png().toFile(outPath);
}

export function rasterizeTriangles(
  triangles: Triangle[],
  yawRad: number,
  camera: RenderCamera = DEFAULT_CAMERA,
): Uint8Array {
  const { width, height } = camera;
  const rgba = new Uint8Array(width * height * 4);
  const zbuf = new Float32Array(width * height);
  zbuf.fill(Number.POSITIVE_INFINITY);

  for (let i = 0; i < width * height; i += 1) {
    rgba[i * 4] = camera.background[0];
    rgba[i * 4 + 1] = camera.background[1];
    rgba[i * 4 + 2] = camera.background[2];
    rgba[i * 4 + 3] = camera.background[3];
  }

  const sorted = [...triangles].sort((a, b) => avgDepth(b, yawRad, camera) - avgDepth(a, yawRad, camera));
  for (const triangle of sorted) {
    drawTriangle(rgba, zbuf, width, height, project(triangle.a, yawRad, camera), project(triangle.b, yawRad, camera), project(triangle.c, yawRad, camera), triangle.color);
  }
  return rgba;
}

export async function renderLayerFrame(
  outPath: string,
  triangles: Triangle[],
  yawRad = -0.35,
  camera: RenderCamera = DEFAULT_CAMERA,
): Promise<void> {
  const rgba = rasterizeTriangles(triangles, yawRad, camera);
  await writeRgbaPng(outPath, rgba, camera.width, camera.height);
}

export async function renderContactSheet(
  outPath: string,
  imagePaths: string[],
  options: { width?: number; tileSize?: number; columns?: number; title?: string } = {},
): Promise<void> {
  const tileSize = options.tileSize ?? 280;
  const columns = options.columns ?? 3;
  const labelHeight = 34;
  const rows = Math.ceil(imagePaths.length / columns);
  const width = options.width ?? columns * tileSize;
  const height = rows * (tileSize + labelHeight) + (options.title ? 42 : 0);
  const topOffset = options.title ? 42 : 0;

  const composites: sharp.OverlayOptions[] = [];
  if (options.title) {
    composites.push(svgOverlay(width, 42, `<rect width="100%" height="100%" fill="#05080d"/><text x="18" y="27" font-family="Consolas, monospace" font-size="18" fill="#e7edf2">${escapeXml(options.title)}</text>`, 0, 0));
  }

  for (let i = 0; i < imagePaths.length; i += 1) {
    const imagePath = imagePaths[i];
    const col = i % columns;
    const row = Math.floor(i / columns);
    const left = col * tileSize;
    const top = topOffset + row * (tileSize + labelHeight);
    const label = path.basename(imagePath);
    const resized = await sharp(imagePath).resize(tileSize, tileSize, { fit: "contain", background: "#05080d" }).png().toBuffer();
    composites.push({ input: resized, left, top });
    composites.push(svgOverlay(tileSize, labelHeight, `<rect width="100%" height="100%" fill="#101823"/><text x="10" y="22" font-family="Consolas, monospace" font-size="12" fill="#c7d7e3">${escapeXml(label)}</text>`, left, top + tileSize));
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: "#05080d",
    },
  })
    .composite(composites)
    .png()
    .toFile(outPath);
}

function project(point: Vec3, yawRad: number, camera: RenderCamera): Projected {
  const cy = Math.cos(yawRad);
  const sy = Math.sin(yawRad);
  const x1 = cy * point[0] + sy * point[1];
  const y1 = -sy * point[0] + cy * point[1];
  const z1 = point[2];

  const ct = Math.cos(camera.tiltRad);
  const st = Math.sin(camera.tiltRad);
  const y2 = ct * y1 - st * z1;
  const z2 = st * y1 + ct * z1;

  const depth = camera.cameraDistance - y2;
  const scale = camera.focalPx / depth;
  return {
    x: camera.width / 2 + x1 * scale,
    y: camera.height / 2 - z2 * scale,
    z: depth,
  };
}

function avgDepth(triangle: Triangle, yawRad: number, camera: RenderCamera): number {
  return (project(triangle.a, yawRad, camera).z + project(triangle.b, yawRad, camera).z + project(triangle.c, yawRad, camera).z) / 3;
}

function drawTriangle(
  rgba: Uint8Array,
  zbuf: Float32Array,
  width: number,
  height: number,
  p0: Projected,
  p1: Projected,
  p2: Projected,
  color: [number, number, number, number],
): void {
  const minX = Math.max(0, Math.floor(Math.min(p0.x, p1.x, p2.x)));
  const maxX = Math.min(width - 1, Math.ceil(Math.max(p0.x, p1.x, p2.x)));
  const minY = Math.max(0, Math.floor(Math.min(p0.y, p1.y, p2.y)));
  const maxY = Math.min(height - 1, Math.ceil(Math.max(p0.y, p1.y, p2.y)));
  const denom = (p1.y - p2.y) * (p0.x - p2.x) + (p2.x - p1.x) * (p0.y - p2.y);
  if (Math.abs(denom) < 1e-6) return;

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const w0 = ((p1.y - p2.y) * (x - p2.x) + (p2.x - p1.x) * (y - p2.y)) / denom;
      const w1 = ((p2.y - p0.y) * (x - p2.x) + (p0.x - p2.x) * (y - p2.y)) / denom;
      const w2 = 1 - w0 - w1;
      if (w0 < 0 || w1 < 0 || w2 < 0) continue;
      const depth = w0 * p0.z + w1 * p1.z + w2 * p2.z;
      const index = x + y * width;
      if (depth > zbuf[index] + 0.08) continue;
      zbuf[index] = Math.min(zbuf[index], depth);

      const alpha = color[3] / 255;
      const base = index * 4;
      rgba[base] = Math.round(color[0] * alpha + rgba[base] * (1 - alpha));
      rgba[base + 1] = Math.round(color[1] * alpha + rgba[base + 1] * (1 - alpha));
      rgba[base + 2] = Math.round(color[2] * alpha + rgba[base + 2] * (1 - alpha));
      rgba[base + 3] = 255;
    }
  }
}

function svgOverlay(width: number, height: number, svg: string, left: number, top: number): sharp.OverlayOptions {
  return {
    input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${svg}</svg>`),
    left,
    top,
  };
}

function escapeXml(text: string): string {
  return text.replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return char;
    }
  });
}
