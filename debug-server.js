import express from 'express';

const app = express();

// Serve the halobank.html file
app.get("/halobank", (req, res) => {
  console.log(`[/halobank] Serving halobank.html`);
  res.sendFile('halobank.html', { root: process.cwd() }, (err) => {
    if (err) {
      console.log(`[/halobank] ❌ Error: ${err.message}`);
      res.status(404).send(`HaloBank page not found: ${err.message}`);
    } else {
      console.log(`[/halobank] ✅ Successfully served halobank.html`);
    }
  });
});

// Serve the debug version
app.get("/debug", (req, res) => {
  console.log(`[/debug] Serving debug-halobank.html`);
  res.sendFile('debug-halobank.html', { root: process.cwd() });
});

// Simple test route
app.get("/", (req, res) => {
  res.send(`
    <h1>Debug Server</h1>
    <p><a href="/halobank">Test HaloBank</a></p>
  `);
});

const port = 8080;
app.listen(port, 'localhost', () => {
  console.log(`🚀 Debug server running on http://localhost:${port}`);
  console.log(`🌟 Test HaloBank at: http://localhost:${port}/halobank`);
  console.log(`📁 Working directory: ${process.cwd()}`);
});