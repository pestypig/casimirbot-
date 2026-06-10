import fs from "node:fs/promises";

function decodeUtf16Be(buffer: Buffer): string {
  const swapped = Buffer.allocUnsafe(buffer.length);
  for (let index = 0; index < buffer.length; index += 2) {
    swapped[index] = buffer[index + 1] ?? 0;
    swapped[index + 1] = buffer[index] ?? 0;
  }
  return swapped.toString("utf16le");
}

export function decodeJsonArtifactBuffer(buffer: Buffer): string {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.subarray(3).toString("utf8");
  }
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.subarray(2).toString("utf16le");
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    return decodeUtf16Be(buffer.subarray(2));
  }

  const sample = buffer.subarray(0, Math.min(buffer.length, 64));
  const oddNulls = sample.filter((byte, index) => index % 2 === 1 && byte === 0).length;
  const evenNulls = sample.filter((byte, index) => index % 2 === 0 && byte === 0).length;
  if (oddNulls > sample.length / 8) return buffer.toString("utf16le");
  if (evenNulls > sample.length / 8) return decodeUtf16Be(buffer);
  return buffer.toString("utf8");
}

export async function readJsonArtifactFile(absolutePath: string): Promise<unknown> {
  return JSON.parse(decodeJsonArtifactBuffer(await fs.readFile(absolutePath)).trim()) as unknown;
}

export async function readJsonlArtifactFile(absolutePath: string): Promise<unknown[]> {
  return decodeJsonArtifactBuffer(await fs.readFile(absolutePath))
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as unknown);
}
