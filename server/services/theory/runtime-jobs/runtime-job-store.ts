import path from "node:path";
import {
  isTheoryRuntimeReceiptV1,
  type TheoryRuntimeReceiptV1,
} from "../../../../shared/contracts/theory-runtime-receipt.v1";
import {
  readTheoryRuntimeJsonFile,
  writeTheoryRuntimeJsonFile,
} from "../runtime-atomic-json-store";

const REQUEST_DIR = "artifacts/theory-runtime-requests";

function safeRequestFileName(requestId: string): string {
  return requestId.replace(/[^A-Za-z0-9._-]+/g, "_");
}

function receiptPath(projectRoot: string | undefined, requestId: string): string {
  return path.resolve(projectRoot ?? process.cwd(), REQUEST_DIR, `${safeRequestFileName(requestId)}.receipt.json`);
}

export async function writeTheoryRuntimeJobReceipt(input: {
  requestId: string;
  receipt: TheoryRuntimeReceiptV1;
  projectRoot?: string;
}): Promise<string> {
  if (!isTheoryRuntimeReceiptV1(input.receipt)) {
    throw new Error(`Runtime receipt for ${input.requestId} failed validation before persistence.`);
  }
  const target = receiptPath(input.projectRoot, input.requestId);
  await writeTheoryRuntimeJsonFile(target, input.receipt);
  return target;
}

export async function readTheoryRuntimeJobReceipt(input: {
  requestId: string;
  projectRoot?: string;
}): Promise<TheoryRuntimeReceiptV1 | null> {
  try {
    const raw = await readTheoryRuntimeJsonFile(receiptPath(input.projectRoot, input.requestId));
    const parsed = JSON.parse(raw) as unknown;
    if (!isTheoryRuntimeReceiptV1(parsed)) {
      throw new Error(`Runtime receipt for ${input.requestId} failed validation.`);
    }
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
