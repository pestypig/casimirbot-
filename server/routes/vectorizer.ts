import { Router } from "express";
import multer from "multer";
import { downloadVectorized, vectorizeBuffer } from "../services/vectorizer";

export const vectorizerRouter = Router();

const upload = multer({ storage: multer.memoryStorage() });

vectorizerRouter.get("/health", (req, res) => {
  const ready = Boolean(process.env.VECTORIZER_USER && process.env.VECTORIZER_PASS);
  res.json({ ready });
});

vectorizerRouter.post("/vectorize", upload.single("image"), async (req, res) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file?.buffer) {
      return res.status(400).json({ error: "image_required" });
    }
    const modeRaw = typeof req.body?.mode === "string" ? req.body.mode.trim() : undefined;
    const mode = modeRaw === "preview" || modeRaw === "full" ? modeRaw : undefined;
    const retentionRaw =
      typeof req.body?.retention_days === "string"
        ? req.body.retention_days
        : typeof req.body?.retentionDays === "string"
          ? req.body.retentionDays
          : undefined;
    const retentionDays = retentionRaw ? Number.parseInt(retentionRaw, 10) : undefined;
    const result = await vectorizeBuffer(file.buffer, {
      filename: file.originalname || "garment.png",
      mode,
      retentionDays: Number.isFinite(retentionDays) ? retentionDays : undefined,
    });
    res.json(result);
  } catch (err: any) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("missing_vectorizer_credentials") ? 503 : 500;
    console.error("[vectorizer] vectorize failed", err);
    res.status(status).json({ error: "vectorize_failed", message });
  }
});

vectorizerRouter.get("/download/:token", async (req, res) => {
  try {
    const formatRaw = typeof req.query?.format === "string" ? req.query.format.trim() : undefined;
    const format = formatRaw === "png" || formatRaw === "pdf" ? formatRaw : "svg";
    const token = (req.params?.token ?? "").trim();
    if (!token) {
      return res.status(400).json({ error: "token_required" });
    }
    const data = await downloadVectorized(token, format as any);
    const contentType =
      format === "png" ? "image/png" : format === "pdf" ? "application/pdf" : "image/svg+xml";
    res.setHeader("Content-Type", contentType);
    res.send(data);
  } catch (err: any) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("missing_vectorizer_credentials") ? 503 : 500;
    console.error("[vectorizer] download failed", err);
    res.status(status).json({ error: "download_failed", message });
  }
});
