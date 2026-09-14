// Bounded socket-only fault fixture. Never HTTP, credentials, logs or harness behavior.
const net = require('node:net');
const server = net.createServer(socket => socket.destroy());
server.on('error', error => { process.stderr.write(String(error.code) + '\n'); process.exitCode = 1; });
server.listen({host:'127.0.0.1',port:51034,exclusive:true}, () => process.stdout.write('reserved 127.0.0.1:51034; no protocol; automatic expiry 15 minutes\n'));
const timer = setTimeout(() => server.close(), 15 * 60 * 1000);
server.on('close', () => { clearTimeout(timer); process.stdin.pause(); });
process.stdin.on('data', () => server.close());
