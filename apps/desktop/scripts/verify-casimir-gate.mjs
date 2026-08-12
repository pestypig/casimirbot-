import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import { buildCasimirGateReceipt } from "./casimir-gate-receipt-lib.mjs";

const responsePath = process.argv[2];
const receiptPath = process.argv[3];
const tracePath = process.argv[4];
if (!responsePath || !receiptPath || !tracePath) {
  throw new Error(
    "Usage: node verify-casimir-gate.mjs <adapter-response.json> <public-receipt.json> <training-trace.jsonl>",
  );
}
const receipt = buildCasimirGateReceipt({
  responseBytes: await readFile(responsePath),
  traceBytes: await readFile(tracePath),
});
const temporaryPath = `${receiptPath}.tmp-${process.pid}`;
try {
  await writeFile(temporaryPath, `${JSON.stringify(receipt, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
  });
  await rename(temporaryPath, receiptPath);
} finally {
  await unlink(temporaryPath).catch(() => undefined);
}
console.log(
  `[desktop-casimir-gate] PASS verdict=PASS certificateHash=${receipt.certificate.certificateHash} integrity=OK trace_records=${receipt.traceExport.recordCount}`,
);
