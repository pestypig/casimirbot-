fetch('http://127.0.0.1:5050/api/ready')
  .then(async (r) => { console.log(await r.text()); })
  .catch((e) => { console.error(e && e.stack || String(e)); process.exit(1); });
