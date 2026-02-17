import express from "express";
import { planRouter } from "./server/routes/agi.plan";

async function run() {
  process.env.ENABLE_AGI = "1";
  const app = express();
  app.use(express.json({ limit: "5mb" }));
  app.use("/api/agi", planRouter);
  const server = app.listen(0, async () => {
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const base = `http://127.0.0.1:${port}`;

    const askBody = {
      question: "Use halobank to calculate local sidereal time for 2026-02-17 12:00 at 34.05,-118.25",
      mode: "act",
      allowTools: ["telemetry.time_dilation.control.set", "telemetry.panels.snapshot", "docs.readme.extract"],
      sessionId: "tmp-check"
    };

    const res = await fetch(`${base}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(askBody),
    });
    const payload = await res.json();

    console.log("STATUS", res.status);
    console.log("MODE", payload?.mode ?? null);
    console.log("SELECTED_TOOL", payload?.selected_tool ?? payload?.tool ?? payload?.proof?.tool ?? null);
    console.log("RESULT_KEYS", Object.keys(payload || {}).join(","));
    if (payload?.action?.tool) console.log("ACTION_TOOL", payload.action.tool);
    if (payload?.action?.output) {
      const o = payload.action.output;
      if (o?.result?.command) console.log("ACTION_COMMAND", o.result.command.command || o.result.command);
    }

    server.close();
  });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
