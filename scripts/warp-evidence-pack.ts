import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

const out = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : "artifacts/warp-evidence-pack.json";
const firstFail = process.argv.includes("--first-fail") ? process.argv[process.argv.indexOf("--first-fail") + 1] : "none";
const claimTier = process.argv.includes("--claim-tier") ? process.argv[process.argv.indexOf("--claim-tier") + 1] : "diagnostic";

const commit = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
const payload = {
  version: "warp-evidence-pack/v1",
  commit,
  generatedAt: new Date(0).toISOString(),
  proofPack: { ref: "api:/api/helix/pipeline/proofs", maturity: "reduced-order" },
  firstFailReport: { firstFail },
  claimTierSnapshot: { claimTier },
};
const canonical = JSON.stringify(payload);
const checksum = crypto.createHash("sha256").update(canonical).digest("hex");
const finalPayload = { ...payload, checksum };
const outPath = path.resolve(process.cwd(), out);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(finalPayload, null, 2));
console.log(JSON.stringify({ ok: true, out: outPath, checksum }, null, 2));
