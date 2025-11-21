import type { Request } from "express";
import { Router } from "express";
import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import multer from "multer";
import { EssenceEnvelope } from "@shared/essence-schema";
import { getBlob, putBlob } from "../storage";
import { essenceHub } from "../services/essence/events";
import { getEnvelope, putEnvelope } from "../services/essence/store";
import { generatePieceLooks, loadEnvelopePieceContext, normalizePieceImage, persistImageEnvelope } from "../services/fashion/pipeline";
import { PIECES, resolveTemplate, type PieceType } from "../services/fashion/templates";

export const fashionRouter = Router();

const upload = multer({ storage: multer.memoryStorage() });
const sha256 = (buf: Buffer): string => createHash("sha256").update(buf).digest("hex");

const parsePiece = (value?: string | null): PieceType | null => {
  const normalized = (value ?? "").toLowerCase();
  return (PIECES as readonly string[]).includes(normalized) ? (normalized as PieceType) : null;
};

const parseTags = (tags: unknown): string[] => {
  if (Array.isArray(tags)) {
    return tags
      .map((t) => (typeof t === "string" ? t.trim() : ""))
      .filter(Boolean)
      .slice(0, 32);
  }
  if (typeof tags === "string") {
    return tags
      .split(/[,;]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 32);
  }
  return [];
};

const readFromUri = async (uri: string): Promise<Buffer> => {
  if (uri.startsWith("storage://")) {
    const stream = await getBlob(uri);
    const chunks: Buffer[] = [];
    for await (const chunk of stream as Readable) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
  }
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    const res = await fetch(uri);
    if (!res.ok) throw new Error(`fetch_failed_${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  return fs.readFile(uri);
};

const readImageInput = async (req: Request): Promise<Buffer> => {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (file?.buffer) {
    return file.buffer as Buffer;
  }

  const essenceId = typeof req.body?.essence_id === "string" ? req.body.essence_id.trim() : "";
  if (essenceId) {
    const env = await getEnvelope(essenceId);
    const uri = env?.header?.source?.uri;
    if (uri) {
      return readFromUri(uri);
    }
  }

  const imageUrl = typeof req.body?.image_url === "string" ? req.body.image_url.trim() : "";
  if (!imageUrl) {
    throw new Error("image_required");
  }
  if (imageUrl.startsWith("data:")) {
    const [, base64] = imageUrl.split(",", 2);
    return Buffer.from(base64 ?? "", "base64");
  }
  return readFromUri(imageUrl);
};

fashionRouter.post("/pieces/:piece/normalize", upload.single("image"), async (req, res) => {
  try {
    const piece = parsePiece(req.params?.piece);
    if (!piece) {
      return res.status(400).json({ error: "invalid_piece" });
    }
    const buffer = await readImageInput(req);
    const templateId = typeof req.body?.template_id === "string" ? req.body.template_id.trim() : undefined;
    const previous = typeof req.body?.essence_id === "string" ? req.body.essence_id.trim() : null;
    const normalized = await normalizePieceImage(piece, buffer, templateId);
    const maskBlob = await putBlob(normalized.mask, { contentType: "image/png" });
    const env = await persistImageEnvelope({
      buffer: normalized.image,
      maskUri: maskBlob.uri,
      piece,
      template: normalized.template,
      creatorId: (req.body?.creator_id as string) ?? "persona:unknown",
      license: (req.body?.license as string) ?? "CC-BY-4.0",
      tags: parseTags(req.body?.tags),
      previous,
      step: "fashion.normalize",
      params: { template_id: normalized.template.id, piece },
      implVersion: normalized.template.id,
    });
    res.json({
      essence_id: env.header.id,
      normalized_image_uri: env.header.source?.uri,
      mask_uri: maskBlob.uri,
      piece,
      template_id: normalized.template.id,
    });
  } catch (err) {
    console.error("[fashion.normalize] failed", err);
    res.status(500).json({ error: "normalize_failed" });
  }
});

fashionRouter.post("/pieces/:piece/looks", upload.single("image"), async (req, res) => {
  try {
    const piece = parsePiece(req.params?.piece);
    if (!piece) {
      return res.status(400).json({ error: "invalid_piece" });
    }
    const image = await readImageInput(req);
    const templateId = typeof req.body?.template_id === "string" ? req.body.template_id.trim() : undefined;
    const styleHint = typeof req.body?.style_hint === "string" ? req.body.style_hint.trim() : "";
    const tags = parseTags(req.body?.tags);
    const previous = typeof req.body?.essence_id === "string" ? req.body.essence_id.trim() : null;
    const { looks, template } = await generatePieceLooks({
      piece,
      templateId,
      image,
      styleHint,
      tags,
      creatorId: (req.body?.creator_id as string) ?? "persona:unknown",
      license: (req.body?.license as string) ?? "CC-BY-4.0",
      previous,
    });
    res.json({
      piece,
      template_id: template.id,
      looks: looks.map((l) => ({
        essence_id: l.env.header.id,
        uri: l.uri,
        piece,
        template_id: template.id,
      })),
    });
  } catch (err) {
    console.error("[fashion.looks] failed", err);
    res.status(500).json({ error: "look_generation_failed" });
  }
});

const persistKnitStage = async (stage: "palette" | "stitchgrid" | "export-pack", req: Request) => {
  const essenceId = typeof req.body?.essence_id === "string" ? req.body.essence_id.trim() : undefined;
  const ctx = await loadEnvelopePieceContext(essenceId);
  const piece = parsePiece(req.body?.piece) ?? ctx.piece ?? undefined;
  const template = await resolveTemplate(
    typeof req.body?.template_id === "string" ? req.body.template_id.trim() : ctx.templateId,
    piece ?? undefined,
  );
  const payload = {
    ...req.body,
    piece: piece ?? template.piece,
    template_id: template.id,
  };
  const buffer = Buffer.from(JSON.stringify(payload, null, 2), "utf8");
  const blob = await putBlob(buffer, { contentType: "application/json" });
  const hash = sha256(buffer);
  const now = new Date().toISOString();
  const env = EssenceEnvelope.parse({
    header: {
      id: randomUUID(),
      version: "essence/1.0",
      modality: "text",
      created_at: now,
      source: {
        uri: blob.uri,
        cid: blob.cid,
        original_hash: { algo: "sha256", value: hash },
        mime: "application/json",
        creator_id: (req.body?.creator_id as string) ?? "persona:unknown",
        license: (req.body?.license as string) ?? "CC-BY-4.0",
      },
      rights: { allow_mix: true, allow_remix: true, allow_commercial: false, attribution: true },
      acl: { visibility: "private", groups: [] },
    },
    features: {
      text: parseTags(req.body?.tags).length ? { tags: parseTags(req.body?.tags) } : undefined,
      piece: { type: piece ?? template.piece, template_id: template.id },
      knit: {
        palette_map: Array.isArray(req.body?.palette_map) ? (req.body.palette_map as any[]) : undefined,
        stitchgrid_uri:
          typeof req.body?.stitchgrid_uri === "string" ? (req.body.stitchgrid_uri as string) : undefined,
        gauge: typeof req.body?.gauge === "object" ? (req.body.gauge as any) : undefined,
        target: typeof req.body?.target === "object" ? (req.body.target as any) : undefined,
      },
    },
    embeddings: [],
    provenance: {
      pipeline: [
        {
          name: `fashion.${stage}`,
          impl_version: "1.0",
          lib_hash: { algo: "sha256", value: sha256(Buffer.from(stage)) },
          params: payload,
          input_hash: { algo: "sha256", value: ctx.previousHash ?? hash },
          output_hash: { algo: "sha256", value: hash },
          started_at: now,
          ended_at: now,
        },
      ],
      merkle_root: { algo: "sha256", value: hash },
      previous: essenceId ?? null,
      signatures: [],
    },
  });
  await putEnvelope(env);
  essenceHub.emit("created", { type: "created", essenceId: env.header.id });
  return { env, uri: blob.uri, piece: piece ?? template.piece, templateId: template.id };
};

fashionRouter.post("/palette", async (req, res) => {
  try {
    const result = await persistKnitStage("palette", req);
    res.json({ essence_id: result.env.header.id, uri: result.uri, piece: result.piece, template_id: result.templateId });
  } catch (err) {
    console.error("[fashion.palette] failed", err);
    res.status(500).json({ error: "palette_failed" });
  }
});

fashionRouter.post("/stitchgrid", async (req, res) => {
  try {
    const result = await persistKnitStage("stitchgrid", req);
    res.json({ essence_id: result.env.header.id, uri: result.uri, piece: result.piece, template_id: result.templateId });
  } catch (err) {
    console.error("[fashion.stitchgrid] failed", err);
    res.status(500).json({ error: "stitchgrid_failed" });
  }
});

fashionRouter.post("/export-pack", async (req, res) => {
  try {
    const result = await persistKnitStage("export-pack", req);
    res.json({ essence_id: result.env.header.id, uri: result.uri, piece: result.piece, template_id: result.templateId });
  } catch (err) {
    console.error("[fashion.export-pack] failed", err);
    res.status(500).json({ error: "export_pack_failed" });
  }
});
