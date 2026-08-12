import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const desktopRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const repoRoot = path.resolve(desktopRoot, "..", "..");
const source = path.join(repoRoot, "client", "public", "icons", "helix-icon.svg");
const outputDirectory = path.join(desktopRoot, "dist");
const output = path.join(outputDirectory, "icon.png");

const sourceBytes = await readFile(source);
if (
  !sourceBytes.includes(Buffer.from("<svg")) ||
  !sourceBytes.includes(Buffer.from("aria-label")) &&
    !sourceBytes.includes(Buffer.from("viewBox"))
) {
  throw new Error("[desktop-brand] tracked Helix SVG is invalid");
}

await mkdir(outputDirectory, { recursive: true });
await sharp(sourceBytes, { density: 384 })
  .resize(512, 512, { fit: "contain" })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(output);

const image = sharp(output);
const metadata = await image.metadata();
const statistics = await image.stats();
const colorEntropy = statistics.entropy;
const colorRanges = statistics.channels
  .slice(0, 3)
  .map((channel) => channel.max - channel.min);
if (
  metadata.width !== 512 ||
  metadata.height !== 512 ||
  metadata.format !== "png" ||
  !Number.isFinite(colorEntropy) ||
  colorEntropy < 0.5 ||
  colorRanges.some((range) => range < 32)
) {
  throw new Error("[desktop-brand] generated icon failed dimension or color validation");
}

console.log(
  `[desktop-brand] PASS source=client/public/icons/helix-icon.svg output=dist/icon.png size=512x512 entropy=${colorEntropy.toFixed(3)}`,
);
