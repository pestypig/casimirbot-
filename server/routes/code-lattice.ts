import { Router, type Request, type Response } from "express";
import { essenceHub, type EssenceEvent } from "../services/essence/events";
import { getLatticeVersion } from "../services/code-lattice/loader";

export const codeLatticeRouter = Router();

function setupSse(res: Response): () => void {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();
  const heartbeat = setInterval(() => {
    try {
      res.write("event: ping\ndata: {}\n\n");
    } catch {
      /* ignore */
    }
  }, 25000);
  return () => clearInterval(heartbeat);
}

codeLatticeRouter.get("/stream", (req: Request, res: Response) => {
  const stopHeartbeat = setupSse(res);
  const bootstrapVersion = getLatticeVersion();
  if (bootstrapVersion > 0) {
    try {
      res.write("event: init\ndata: " + JSON.stringify({ version: bootstrapVersion }) + "\n\n");
    } catch {
      /* ignore */
    }
  }

  const handleUpdate = (event: Extract<EssenceEvent, { type: "code-lattice:updated" }>) => {
    try {
      res.write("data: " + JSON.stringify({ version: event.version, stats: event.stats }) + "\n\n");
    } catch {
      /* swallow */
    }
  };
  essenceHub.on("code-lattice:updated", handleUpdate);

  const cleanup = () => {
    stopHeartbeat();
    essenceHub.off("code-lattice:updated", handleUpdate);
  };
  req.on("close", cleanup);
  req.on("error", cleanup);
});
