import express from 'express';
import { planRouter } from './server/routes/agi.plan';

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use('/api/agi', planRouter);

const server = app.listen(0, async () => {
  const addr = server.address();
  const port = typeof addr === 'string' ? 0 : (addr?.port ?? 0);
  const res = await fetch(`http://127.0.0.1:${port}/api/agi/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: 'How does Feedback Loop Hygiene affect society?',
      debug: true,
      sessionId: 'tmp-cli',
    }),
  });
  const payload = await res.json();
  console.log('status', res.status);
  console.log('answer_path', payload.debug?.answer_path);
  console.log('answer_extension_appended', payload.debug?.answer_extension_appended);
  console.log('answer', payload.text);
  server.close();
});
