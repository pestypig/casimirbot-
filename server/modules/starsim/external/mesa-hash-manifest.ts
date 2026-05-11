import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { z } from "zod";

export const mesaHashEntrySchema = z.object({
  path: z.string(),
  hash: z.string(),
  present: z.boolean(),
});

export const mesaHashManifestSchema = z.object({
  schemaVersion: z.literal("starsim-mesa-hash-manifest.v1"),
  entries: z.record(z.string(), mesaHashEntrySchema),
});

export type MesaHashManifest = z.infer<typeof mesaHashManifestSchema>;

export function sha256Buffer(value: Buffer | string) {
  return createHash("sha256").update(value).digest("hex");
}

export function sha256File(path: string) {
  return sha256Buffer(readFileSync(path));
}

export function buildMesaHashManifest(paths: Record<string, string | undefined>): MesaHashManifest {
  const entries = Object.fromEntries(
    Object.entries(paths).map(([key, path]) => [
      key,
      {
        path: path ?? "",
        hash: path && existsSync(path) ? sha256File(path) : "",
        present: Boolean(path && existsSync(path)),
      },
    ]),
  );
  return mesaHashManifestSchema.parse({
    schemaVersion: "starsim-mesa-hash-manifest.v1",
    entries,
  });
}
