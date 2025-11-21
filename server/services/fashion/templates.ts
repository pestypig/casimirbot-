import fs from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";
import { z } from "zod";

export const PIECES = ["cape", "shirt", "pants"] as const;
export type PieceType = (typeof PIECES)[number];

const TemplateSchema = z.object({
  id: z.string().min(3),
  piece: z.string().optional(),
  canvas: z.tuple([z.number().positive(), z.number().positive()]),
  bleed: z.number().nonnegative().default(0),
  anchors: z.record(z.tuple([z.number(), z.number()])),
  regions: z.array(
    z.object({
      id: z.string(),
      polygon: z.array(z.tuple([z.number(), z.number()])).min(3),
    }),
  ),
});

export type FashionTemplate = z.infer<typeof TemplateSchema> & {
  piece: PieceType;
  imagePath: string | null;
  dir: string;
};

let cache: Record<string, FashionTemplate> | null = null;

const normalizePiece = (value?: string): PieceType | null => {
  const normalized = (value ?? "").trim().toLowerCase();
  return (PIECES as readonly string[]).includes(normalized) ? (normalized as PieceType) : null;
};

const findPngInDir = async (dir: string): Promise<string | null> => {
  try {
    const entries = await fs.readdir(dir);
    const png = entries.find((f) => f.toLowerCase().endsWith(".png"));
    return png ? path.join(dir, png) : null;
  } catch {
    return null;
  }
};

export const resolveTemplateRoot = (): string =>
  (process.env.FASHION_TEMPLATE_DIR?.trim() || path.join(process.cwd(), "templates", "fashion")).replace(/\\/g, "/");

export async function loadFashionTemplates(force = false): Promise<Record<string, FashionTemplate>> {
  if (cache && !force) return cache;
  const root = resolveTemplateRoot();
  const templates: Record<string, FashionTemplate> = {};
  let entries: Dirent[] = [];
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch (err) {
    console.warn(`[fashion.templates] unable to read template root (${root}):`, err);
    cache = templates;
    return templates;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(root, entry.name);
    const tplPath = path.join(dir, "template.json");
    try {
      const json = await fs.readFile(tplPath, "utf-8");
      const parsed = TemplateSchema.parse(JSON.parse(json));
      const piece = normalizePiece(parsed.piece ?? entry.name) ?? "cape";
      const imagePath = await findPngInDir(dir);
      templates[parsed.id] = {
        ...parsed,
        piece,
        imagePath,
        dir,
      };
    } catch (err) {
      console.warn(`[fashion.templates] skipped ${tplPath}:`, err);
    }
  }
  cache = templates;
  return templates;
}

export async function listTemplatesForPiece(piece?: PieceType): Promise<FashionTemplate[]> {
  const templates = await loadFashionTemplates();
  return Object.values(templates).filter((tpl) => !piece || tpl.piece === piece);
}

export async function resolveTemplate(templateId?: string | null, piece?: PieceType): Promise<FashionTemplate> {
  const templates = await loadFashionTemplates();
  if (templateId && templates[templateId]) {
    const tpl = templates[templateId];
    if (!piece || tpl.piece === piece) return tpl;
  }

  const fallback = Object.values(templates).find((tpl) => (piece ? tpl.piece === piece : true));
  if (!fallback) {
    throw new Error("fashion_template_not_found");
  }
  return fallback;
}
