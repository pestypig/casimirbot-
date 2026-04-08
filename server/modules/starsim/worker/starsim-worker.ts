import { parentPort } from "node:worker_threads";
import { executeOscillationGyreRuntime, executeStructureMesaRuntime } from "./starsim-runtime.ts";
import type { StarSimWorkerRequest, StarSimWorkerResponse } from "./starsim-worker-types.ts";

const port = parentPort;
if (!port) {
  throw new Error("Star-sim worker started without parentPort");
}

port.on("message", async (message: StarSimWorkerRequest) => {
  try {
    if (message.kind === "structure_mesa") {
      const payload = await executeStructureMesaRuntime(message.star);
      const response: StarSimWorkerResponse = {
        id: message.id,
        kind: "structure_mesa",
        ok: true,
        payload,
      };
      port.postMessage(response);
      return;
    }

    const payload = await executeOscillationGyreRuntime(message.star);
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
