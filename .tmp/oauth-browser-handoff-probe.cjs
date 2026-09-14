const http = require('node:http');
const server = http.createServer((req,res) => {
  if (req.url !== '/') { res.writeHead(404); return res.end(); }
  res.writeHead(200, {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
  res.end('<!doctype html><title>CasimirBot harmless callback probe</title><h1>Browser handoff diagnostic</h1><p>This fabricated rejection callback cannot authorize an account or grant access.</p><a href="casimirbot://oauth/callback?error=access_denied&amp;state=diagnostic_invalid_state_browser_20260913_00000">Test rejected callback handoff</a>');
});
server.listen(0,'127.0.0.1',()=>console.log('Diagnostic origin http://127.0.0.1:'+server.address().port));
setTimeout(()=>server.close(),300000).unref();
