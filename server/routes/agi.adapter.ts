import { Router } from "express";
import type { Request, Response } from "express";
import { guardTenant, shouldRequireTenant } from "../auth/tenant";
import { adapterRunRequestSchema } from "../../shared/schema.js";
import { AdapterExecutionError, runAdapterExecution } from "../services/adapter/run.js";

const setCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Tenant-Id, X-Customer-Id, X-Org-Id, traceparent, tracestate",
  );
  res.setHeader("Access-Control-Expose-Headers", "traceparent, tracestate");
};


const adapterRouter = Router();

adapterRouter.options("/run", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

adapterRouter.post("/run", async (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const tenantGuard = guardTenant(req, { require: shouldRequireTenant() });
  if (!tenantGuard.ok) {
    return res.status(tenantGuard.status).json({ error: tenantGuard.error });
  }
  const body =
    req.body && typeof req.body === "object"
      ? (req.body as Record<string, unknown>)
      : {};
  const parsed = adapterRunRequestSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "invalid-adapter-run",
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await runAdapterExecution(parsed.data, {
      tenantId: tenantGuard.tenantId,
    });
    return res.json(result);
  } catch (err) {
    if (err instanceof AdapterExecutionError) {
      return res.status(err.status).json({ error: err.code, message: err.message });
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error("[adapter] run failed:", message);
    return res.status(500).json({ error: "adapter-run-failed", message });
  }
});

export { adapterRouter };
