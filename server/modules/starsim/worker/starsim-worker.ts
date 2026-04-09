import { parentPort } from "node:worker_threads";
import { executeOscillationGyreRuntime, executeStructureMesaRuntime } from "./starsim-runtime.ts";
import type { StarSimWorkerRequest, StarSimWorkerResponse } from "./starsim-worker-types.ts";

const port = parentPort;
if (!port) {
  throw new Error("Star-sim worker started without parentPort");
}

port.on("message", async (message: StarSimWorkerRequest) => {
  try {
    if (process.env.STAR_SIM_WORKER_CRASH_ON_KIND === message.kind) {
      process.exit(86);
    }
    if (message.kind === "structure_mesa") {
      const payload = await executeStructureMesaRuntime({
        star: message.star,
        cache_key: message.cache_key,
      });
      const response: StarSimWorkerResponse = {
        id: message.id,
        kind: "structure_mesa",
        ok: true,
        payload,
      };
      port.postMessage(response);
      return;
    }

    const payload = await executeOscillationGyreRuntime({
      star: message.star,
      structure_cache_key: message.structure_cache_key,
      structure_claim_id: message.structure_claim_id,
      structure_summary: message.structure_summary,
    });
    const response: StarSimWorkerResponse = {
      id: message.id,
      kind: "oscillation_gyre",
      ok: true,
      payload,
    };
    port.postMessage(response);
  } catch (error) {
    const response: StarSimWorkerResponse = {
      id: message.id,
      kind: message.kind,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
    port.postMessage(response);
  }
});
