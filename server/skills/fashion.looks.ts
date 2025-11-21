import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import { generatePieceLooks, piecePrompt } from "../services/fashion/pipeline";
import type { PieceType } from "../services/fashion/templates";

const FashionLooksInput = z.object({
  piece: z.enum(["cape", "shirt", "pants"]),
  template_id: z.string().optional(),
  image_url: z.string().optional(),
  image_base64: z.string().optional(),
  style_hint: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const FashionLooksOutput = z.object({
  piece: z.string(),
  template_id: z.string(),
  prompt: z.string(),
  looks: z.array(
    z.object({
      essence_id: z.string(),
      uri: z.string(),
      piece: z.string(),
      template_id: z.string(),
    }),
  ),
});

export const fashionLooksSpec: ToolSpecShape = {
  name: "image.openai.looks",
  desc: "Generate four piece-aware fashion looks against canonical templates (cape/shirt/pants).",
  inputSchema: FashionLooksInput,
  outputSchema: FashionLooksOutput,
  deterministic: false,
  rateLimit: { rpm: 30 },
  safety: { risks: ["writes_files", "network_access"] },
};

const readImageBuffer = async (input: { image_url?: string; image_base64?: string }): Promise<Buffer> => {
  if (input.image_base64) {
    return Buffer.from(input.image_base64, "base64");
  }
  const url = input.image_url;
  if (!url) throw new Error("image_url_or_base64_required");
  if (url.startsWith("data:")) {
    const [, data] = url.split(",", 2);
    return Buffer.from(data ?? "", "base64");
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch_failed_${res.status}`);
  return Buffer.from(await res.arrayBuffer());
};

export const fashionLooksHandler: ToolHandler = async (rawInput, ctx) => {
  const parsed = FashionLooksInput.parse(rawInput ?? {});
  const buffer = await readImageBuffer(parsed);
  const creatorId = (ctx?.personaId as string) ?? "persona:unknown";
  const { looks, template } = await generatePieceLooks({
    piece: parsed.piece as PieceType,
    templateId: parsed.template_id,
    image: buffer,
    styleHint: parsed.style_hint,
    tags: parsed.tags,
    creatorId,
  });
  const prompt = piecePrompt(parsed.piece as PieceType, parsed.style_hint ?? "");
  return {
    piece: parsed.piece,
    template_id: template.id,
    prompt,
    looks: looks.map((look) => ({
      essence_id: look.env.header.id,
      uri: look.uri,
      piece: parsed.piece,
      template_id: template.id,
    })),
  };
};
