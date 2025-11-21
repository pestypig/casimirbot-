import { createHash, randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import sharp from "sharp";
import OpenAI from "openai";
import { EssenceEnvelope, type TEssenceEnvelope } from "@shared/essence-schema";
import { putBlob } from "../../storage";
import { essenceHub } from "../essence/events";
import { getEnvelope, putEnvelope } from "../essence/store";
import { resolveTemplate, type FashionTemplate, type PieceType } from "./templates";

const IMAGE_MODEL = (process.env.IMAGE_LOOKS_MODEL ?? "gpt-image-1").trim();

const sha256 = (buf: Buffer): string => createHash("sha256").update(buf).digest("hex");

export const piecePrompt = (piece: PieceType, style: string): string => {
  const base =
    "Isolate onto a pure white design template, laid flat, top-facing. Preserve garment pixels and edges; normalize lighting.";
  const intent: Record<PieceType, string> = {
    cape: "Short shoulder cape; no body, no mannequin; space-baroque floral + gold filigree.",
    shirt: "Shirt front panel with collar and placket visible; no sleeves if targeting front-only.",
    pants: "Pants front, waistband and fly visible; legs parallel; no shoes/feet.",
  };
  return `${intent[piece]} ${base} ${style ? `Style: ${style}` : ""}`.trim();
};

type NormalizeResult = {
  image: Buffer;
  mask: Buffer;
  width: number;
  height: number;
  template: FashionTemplate;
};

const buildMaskFromAlpha = async (image: Buffer): Promise<{ mask: Buffer; width: number; height: number }> => {
  const { data, info } = await sharp(image).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const mask = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i += 1) {
    const alpha = data[i * 4 + 3] ?? 0;
    mask[i * 4 + 0] = 255;
    mask[i * 4 + 1] = 255;
    mask[i * 4 + 2] = 255;
    mask[i * 4 + 3] = alpha > 2 ? 255 : 0;
  }
  const png = await sharp(mask, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
  return { mask: png, width: info.width, height: info.height };
};

export async function normalizePieceImage(
  piece: PieceType,
  input: Buffer,
  templateId?: string | null,
): Promise<NormalizeResult> {
  const template = await resolveTemplate(templateId, piece);
  const [width, height] = template.canvas;
  const normalizedImage = await sharp(input)
    .resize({
      width,
      height,
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();
  const { mask } = await buildMaskFromAlpha(normalizedImage);
  return { image: normalizedImage, mask, width, height, template };
}

type PersistImageArgs = {
  buffer: Buffer;
  maskUri?: string | null;
  piece: PieceType;
  template: FashionTemplate;
  creatorId?: string;
  license?: string;
  tags?: string[];
  previous?: string | null;
  step: string;
  params?: Record<string, unknown>;
  implVersion?: string;
};

export async function persistImageEnvelope({
  buffer,
  maskUri,
  piece,
  template,
  creatorId,
  license,
  tags,
  previous,
  step,
  params,
  implVersion,
}: PersistImageArgs): Promise<TEssenceEnvelope> {
  const now = new Date().toISOString();
  const blob = await putBlob(buffer, { contentType: "image/png" });
  const hash = sha256(buffer);
  const meta = await sharp(buffer).metadata();
  const width = meta.width ?? template.canvas[0];
  const height = meta.height ?? template.canvas[1];
  const env = EssenceEnvelope.parse({
    header: {
      id: randomUUID(),
      version: "essence/1.0",
      modality: "image",
      created_at: now,
      source: {
        uri: blob.uri,
        cid: blob.cid,
        original_hash: { algo: "sha256", value: hash },
        width,
        height,
        mime: "image/png",
        creator_id: creatorId ?? "persona:unknown",
        license: license ?? "CC-BY-4.0",
      },
      rights: { allow_mix: true, allow_remix: true, allow_commercial: false, attribution: true },
      acl: { visibility: "private", groups: [] },
    },
    features: {
      image: { width, height, mask_uri: maskUri ?? undefined },
      piece: { type: piece, template_id: template.id },
      text: tags?.length ? { tags } : undefined,
    },
    embeddings: [],
    provenance: {
      pipeline: [
        {
          name: step,
          impl_version: implVersion ?? IMAGE_MODEL,
          lib_hash: { algo: "sha256", value: sha256(Buffer.from(step)) },
          params: params ?? {},
          input_hash: { algo: "sha256", value: hash },
          output_hash: { algo: "sha256", value: hash },
          started_at: now,
          ended_at: now,
        },
      ],
      merkle_root: { algo: "sha256", value: hash },
      previous: previous ?? null,
      signatures: [],
    },
  });
  await putEnvelope(env);
  essenceHub.emit("created", { type: "created", essenceId: env.header.id });
  return env;
}

const ensureMaskBlob = async (mask?: Buffer | null): Promise<string | null> => {
  if (!mask) return null;
  const maskBlob = await putBlob(mask, { contentType: "image/png" });
  return maskBlob.uri;
};

const openAiClient = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY?.trim() });

type GenerateLooksArgs = {
  piece: PieceType;
  templateId?: string | null;
  image: Buffer;
  styleHint?: string;
  tags?: string[];
  creatorId?: string;
  license?: string;
  previous?: string | null;
};

export type GeneratedLook = {
  env: TEssenceEnvelope;
  uri: string;
};

export async function generatePieceLooks({
  piece,
  templateId,
  image,
  styleHint,
  tags,
  creatorId,
  license,
  previous,
}: GenerateLooksArgs): Promise<{ looks: GeneratedLook[]; template: FashionTemplate }> {
  const normalized = await normalizePieceImage(piece, image, templateId);
  const maskUri = await ensureMaskBlob(normalized.mask);
  const prompt = piecePrompt(piece, styleHint ?? "");
  let outputs: Buffer[] = [];
  try {
    const client = openAiClient();
    const size =
      normalized.width === normalized.height
        ? "1024x1024"
        : normalized.width > normalized.height
        ? "1536x1024"
        : "1024x1536";
    const edit = await client.images.edit({
      model: IMAGE_MODEL,
      image: Readable.from(normalized.image) as any,
      mask: Readable.from(normalized.mask) as any,
      prompt,
      n: 4,
      size,
    });
    const editedImages = edit?.data ?? [];
    outputs = await Promise.all(
      editedImages.map(async (img) =>
        sharp(Buffer.from(img.b64_json!, "base64"))
          .resize({ width: normalized.width, height: normalized.height, fit: "cover" })
          .png()
          .toBuffer(),
      ),
    );
  } catch (err) {
    console.warn("[fashion.looks] image edit failed; using normalized fallback", err);
    outputs = Array.from({ length: 4 }, () => normalized.image);
  }

  const looks: GeneratedLook[] = [];
  for (const buf of outputs) {
    const env = await persistImageEnvelope({
      buffer: buf,
      maskUri,
      piece,
      template: normalized.template,
      creatorId,
      license,
      tags,
      previous,
      step: "fashion.looks",
      params: { template_id: normalized.template.id, piece },
      implVersion: IMAGE_MODEL,
    });
    looks.push({ env, uri: env.header.source.uri });
  }
  return { looks, template: normalized.template };
}

export async function loadEnvelopePieceContext(
  essenceId?: string | null,
): Promise<{ piece?: PieceType; templateId?: string; previousHash?: string }> {
  if (!essenceId) return {};
  const env = await getEnvelope(essenceId);
  if (!env) return {};
  const piece = env.features?.piece?.type as PieceType | undefined;
  const templateId = env.features?.piece?.template_id;
  const previousHash = env.header.source?.original_hash?.value;
  return { piece, templateId, previousHash };
}
