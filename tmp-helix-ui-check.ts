import express from "express";
import { createServer } from "node:http";
import { planRouter } from "./server/routes/agi.plan";

process.env.ENABLE_AGI = "1";
process.env.HELIX_ASK_MICRO_PASS = "0";
process.env.HELIX_ASK_MICRO_PASS_AUTO = "0";
process.env.HELIX_ASK_TWO_PASS = "0";

const app = express();
app.use(express.json({ limit: "5mb" }));
app.use('/api/agi', planRouter);

const server = createServer(app);
server.listen(0, async () => {
  const port = (server.address() as any).port;
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/agi/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'How does Feedback Loop Hygiene affect society?',
        debug: true,
        sessionId: 'tmp-ui-check',
      }),
    });
    const payload = (await response.json()) as any;
    console.log(JSON.stringify({ status: response.status, text: payload.text, answerPath: payload.debug?.answer_path ?? [] }, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    server.close();
  }
});
