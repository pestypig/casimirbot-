import { createHash } from "node:crypto";

export const CASIMIR_GATE_RECEIPT_SCHEMA =
  "casimir_desktop_gate_receipt/1";
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fail = (message) => {
  throw new Error(`[desktop-casimir-gate] ${message}`);
};

export function buildCasimirGateReceipt({
  responseBytes,
  traceBytes,
  generatedAt = new Date().toISOString(),
}) {
  let response;
  try {
    response = JSON.parse(Buffer.from(responseBytes).toString("utf8"));
  } catch {
    fail("adapter response is not valid JSON");
  }
  const verdict = response.verdict ?? (response.pass === true ? "PASS" : "FAIL");
  const certificateHash = String(
    response.certificate?.certificateHash ?? "",
  ).toLowerCase();
  if (
    verdict !== "PASS" ||
    response.pass !== true ||
    !SHA256_PATTERN.test(certificateHash) ||
    response.certificate?.integrityOk !== true
  ) {
    fail(
      `FAIL verdict=${verdict} firstFail=${response.firstFail?.id ?? "none"} certificate=${certificateHash ? "present" : "missing"} integrity=${response.certificate?.integrityOk === true ? "OK" : "NOT_OK"}`,
    );
  }

  const traceText = Buffer.from(traceBytes).toString("utf8");
  const traceLines = traceText
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
  if (traceLines.length < 1) {
    fail("training-trace export is empty");
  }
  for (const [index, line] of traceLines.entries()) {
    try {
      JSON.parse(line);
    } catch {
      fail(`training-trace record ${index + 1} is not valid JSON`);
    }
  }

  const parsedGeneratedAt = new Date(generatedAt);
  if (Number.isNaN(parsedGeneratedAt.valueOf())) {
    fail("receipt timestamp is invalid");
  }
  return {
    schema: CASIMIR_GATE_RECEIPT_SCHEMA,
    generatedAt: parsedGeneratedAt.toISOString(),
    verdict: "PASS",
    pass: true,
    firstFail: null,
    certificate: {
      certificateHash,
      integrity: "OK",
    },
    traceExport: {
      recordCount: traceLines.length,
      sha256: sha256(traceBytes),
    },
    adapterResponseSha256: sha256(responseBytes),
  };
}

