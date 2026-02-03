import { Router } from "express";
import { z } from "zod";
import { reportError } from "../services/observability/error-reporter";

const clientErrorRouter = Router();

const ClientErrorPayload = z.object({
  message: z.string().min(1).max(2000),
  stack: z.string().max(8000).optional(),
  url: z.string().max(2000).optional(),
  userAgent: z.string().max(400).optional(),
  build: z.string().max(120).optional(),
  context: z.record(z.any()).optional(),
});

clientErrorRouter.post("/client-error", (req, res) => {
  const parsed = ClientErrorPayload.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request" });
  }
  const payload = parsed.data;
  const error = new Error(payload.message);
  if (payload.stack) {
    (error as { stack?: string }).stack = payload.stack;
  }
  reportError(error, {
    tags: { source: "client" },
    extra: {
      url: payload.url,
      userAgent: payload.userAgent,
      build: payload.build,
      context: payload.context,
    },
  });
  try {
    console.warn(
      `[client-error] ${payload.message} url=${payload.url ?? "unknown"} ua=${payload.userAgent ?? "unknown"}`,
    );
  } catch {}
  return res.status(202).json({ ok: true });
});

export { clientErrorRouter };
