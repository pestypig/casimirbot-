import express, { type Request, type Response } from "express";
import {
  chatStream,
  planSteps,
  proposePatch,
  summarizeUrl,
  withLumaGenerationProvenance,
  type ChatMsg,
} from "../services/luma";
import { answerWithSelfConsistency } from "../services/decoding/selfConsistency";

export const lumaRouter = express.Router();

function sanitizeMessages(payload: unknown): ChatMsg[] {
  if (!Array.isArray(payload)) return [];
  const sanitized: ChatMsg[] = [];
  for (const msg of payload) {
    if (!msg || typeof msg !== "object") continue;
    const { role, content } = msg as ChatMsg;
    if (
      (role === "user" || role === "assistant" || role === "system") &&
      typeof content === "string"
    ) {
      sanitized.push({ role, content });
    }
  }
  return sanitized;
}

lumaRouter.get("/skills", (_req, res) => {
  res.json({
    skills: ["librarian.summarize", "librarian.cite", "patch.plan", "patch.diff"],
  });
});

lumaRouter.post("/plan", async (req, res) => {
  const { task } = req.body || {};
  if (typeof task !== "string" || task.trim().length === 0) {
    return res.status(400).json({ error: "task required" });
  }
  res.json(planSteps(task.trim()));
});

lumaRouter.post("/propose-patch", async (req, res) => {
  const { title, rationale, files } = req.body || {};
  if (typeof title !== "string" || title.trim().length === 0) {
    return res.status(400).json({ error: "title required" });
  }
  try {
    const diff = await proposePatch(
      title.trim(),
      typeof rationale === "string" ? rationale : "",
      Array.isArray(files) ? files : undefined,
    );
    res.type("text/plain").send(diff || "# No diff produced.");
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Unable to propose patch" });
  }
});

lumaRouter.post("/summarize", async (req, res) => {
  const { url } = req.body || {};
  if (typeof url !== "string" || url.trim().length === 0) {
    return res.status(400).json({ error: "url required" });
  }
  try {
    const summary = await summarizeUrl(url.trim());
    res.json({ url, summary });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || "Unable to summarize" });
  }
});

lumaRouter.post("/generate/provenance", async (req, res) => {
  const { output, provenance } = req.body || {};
  if (!output || typeof output !== "object" || Array.isArray(output)) {
    return res.status(400).json({ error: "output object required" });
  }

  const enriched = withLumaGenerationProvenance(
    output as Record<string, unknown>,
    provenance && typeof provenance === "object" && !Array.isArray(provenance)
      ? (provenance as { provenance_class?: string; maturity?: string; certifying?: boolean })
      : undefined,
  );

  return res.json(enriched);
});


lumaRouter.post("/chat/stream", async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  (res as any).flushHeaders?.();

  const { messages, temperature } = req.body || {};
  if (!Array.isArray(messages)) {
    res.write(`data: ${JSON.stringify({ error: "messages required" })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    return res.end();
  }

  const sanitized = sanitizeMessages(messages);

  if (sanitized.length === 0) {
    res.write(`data: ${JSON.stringify({ error: "no valid messages" })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    return res.end();
  }

  let active = true;
  req.on("close", () => {
    active = false;
  });

  try {
    for await (const delta of chatStream({
      messages: sanitized,
      temperature: typeof temperature === "number" ? temperature : undefined,
    })) {
      if (!active) break;
      res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    }
    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err?.message || "stream error" })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
  }
});

lumaRouter.post("/chat/self-consistency", async (req: Request, res: Response) => {
  const { messages, temperature, runs, seeds } = req.body || {};
  const sanitized = sanitizeMessages(messages);
  if (sanitized.length === 0) {
    return res.status(400).json({ error: "messages required" });
  }

  if (
    runs !== undefined &&
    (typeof runs !== "number" || !Number.isInteger(runs) || runs <= 0 || !Number.isFinite(runs))
  ) {
    return res.status(400).json({ error: "runs must be a positive number when provided" });
  }

  if (
    seeds !== undefined &&
    (!Array.isArray(seeds) ||
      !seeds.every((s) => typeof s === "number" && Number.isInteger(s) && Number.isFinite(s)))
  ) {
    return res.status(400).json({ error: "seeds must be an array of integers when provided" });
  }

  try {
    const result = await answerWithSelfConsistency({
      messages: sanitized,
      temperature: typeof temperature === "number" ? temperature : undefined,
      runs: runs ?? undefined,
      seeds: seeds ?? undefined,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "self consistency failed" });
  }
});
