const [,, baseUrl, question] = process.argv;
fetch(`${baseUrl}/api/agi/ask`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ question, debug: true, max_tokens: 512 }),
}).then(async (r) => {
  const text = await r.text();
  console.log(text);
}).catch((err) => {
  console.error(String(err && err.stack || err));
  process.exit(1);
});
