import express, { type Request, type Response } from "express";
import {
  chatStream,
  planSteps,
  proposePatch,
  summarizeUrl,
  type ChatMsg,
} from "../services/luma";

export const lumaRouter = express.Router();

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

  const sanitized: ChatMsg[] = [];
  for (const msg of messages) {
    if (!msg || typeof msg !== "object") continue;
    const { role, content } = msg as ChatMsg;
    if (
      (role === "user" || role === "assistant" || role === "system") &&
      typeof content === "string"
    ) {
      sanitized.push({ role, content });
    }
  }

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
