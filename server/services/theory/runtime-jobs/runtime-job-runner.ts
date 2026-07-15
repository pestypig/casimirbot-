import path from "node:path";
import type { TheoryRuntimeReceiptV1 } from "../../../../shared/contracts/theory-runtime-receipt.v1";
import { getTheoryRuntimeExecutionClass } from "../../../../shared/theory/runtime-execution-policy";
import { executeLongTheoryRuntimeRequest } from "../long-runtime-executor";
import { runTheoryRuntimeAdapter, type TheoryRuntimeSpawnExecutor } from "../runtime-adapters";
import {
  readTheoryRuntimeRunRequestStatus,
  updateTheoryRuntimeRunRequestStatus,
} from "../theory-runtime-run-request-manifest";

export async function runTheoryRuntimeJob(input: {
  requestId: string;
  projectRoot?: string;
  spawnExecutor?: TheoryRuntimeSpawnExecutor;
}): Promise<TheoryRuntimeReceiptV1> {
  const request = await readTheoryRuntimeRunRequestStatus(input);
  if (!request) throw new Error(`Runtime request manifest ${input.requestId} was not found.`);
  const executionClass = getTheoryRuntimeExecutionClass(request.runtimeId);
  if (!executionClass) throw new Error(`Runtime ${request.runtimeId} is not allowlisted for execution.`);

  if (executionClass === "long_execution") {
    const result = await executeLongTheoryRuntimeRequest(
      {
        requestId: input.requestId,
        projectRoot: input.projectRoot,
        outputDirectory: path.join("artifacts", "theory-runtime-jobs", input.requestId.replace(/[^A-Za-z0-9._-]+/g, "_")),
        execute: true,
      },
      { spawnExecutor: input.spawnExecutor, manageTerminalStatus: false },
    );
    return result.receiptV1;
  }

  await updateTheoryRuntimeRunRequestStatus({
    requestId: input.requestId,
    projectRoot: input.projectRoot,
    status: "running",
    heartbeat: {
      stage: "running",
      message: `Running fixed registered runtime ${request.runtimeId}.`,
      progress: null,
    },
  });
  const receipt = await runTheoryRuntimeAdapter(
    {
      runtimeId: request.runtimeId,
      graphId: request.graphId,
      badgeIds: request.badgeIds,
      projectRoot: input.projectRoot,
      generatedAt: request.generatedAt,
    },
    { spawnExecutor: input.spawnExecutor },
  );
  return receipt;
}
