import fs from "node:fs/promises";
import crypto from "node:crypto";
import express from "express";
import request from "supertest";

async function main() {
  // Isolated non-LLM adapter verification. This is not the installed service
  // and does not use, modify or impersonate any native desktop account/session.
  process.env.TRAINING_TRACE_PERSIST = "0";
  process.env.CONSTRAINT_PACK_POLICY_PERSIST = "0";
  process.env.CASIMIR_AUTO_TELEMETRY = "0";
  const { adapterRouter } = await import("../server/routes/agi.adapter");
  const payload = JSON.parse(await fs.readFile(".tmp/launcher-native-verification-request-20260913.json", "utf8"));
  const app = express();
  const fixtureAuthorization = crypto.randomUUID();
  app.use(express.json());
  app.use((req, res, next) => {
    if (req.headers.authorization !== `Bearer ${fixtureAuthorization}`) { res.sendStatus(401); return; }
    next();
  });
  app.use("/api/agi/adapter", adapterRouter);
  const response = await request(app).post("/api/agi/adapter/run")
    .set("Authorization", `Bearer ${fixtureAuthorization}`).send(payload);
  const evidence = { schema: "casimirbot.scoped_adapter_verification.v1", observed_at: new Date().toISOString(),
    scope: "Isolated real adapter HTTP route over measured patch telemetry; no production session or physical/live acceptance claim",
    installed_cli_attempt: { status: 401, error: "desktop_session_required", bypassed: false },
    http_status: response.status, result: response.body };
  await fs.writeFile("docs/evidence/eh-g8-et6-continuous-session-build-v1/2026-09-13-launcher-native-adapter-verification.json",
    JSON.stringify(evidence, null, 2) + "\n", { flag: "wx" });
  console.log(JSON.stringify(evidence));
  if (response.status !== 200 || response.body.verdict !== "PASS" ||
      !response.body.certificate?.certificateHash || response.body.certificate.integrityOk !== true) process.exitCode = 1;
}
main().then(() => process.exit(process.exitCode ?? 0)).catch(error => { console.error(error); process.exit(1); });


