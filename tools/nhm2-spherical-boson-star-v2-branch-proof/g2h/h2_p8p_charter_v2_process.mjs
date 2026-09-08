import { spawn, execFile } from 'node:child_process';

// Independent settlement deadline permits VM cleanup even if local kill fails.
// Unconfirmed termination is an error, never permission for a new attempt.
export function boundedProcess(executable, args, {
  timeoutMs, killGraceMs = 10000, maxBytes = 1048576, env = process.env,
  spawnImpl = spawn, killImpl = killTree, signal, onStdout,
} = {}) {
  if (!(timeoutMs > 0) || !Number.isFinite(timeoutMs) || !(killGraceMs > 0) || killGraceMs > 10000) throw new Error('invalid_deadline');
  if(signal?.aborted)throw new Error('cancelled_before_dispatch');
  return new Promise((resolve, reject) => {
    const child = spawnImpl(executable, args, { shell: false, windowsHide: true,
      detached: process.platform !== 'win32', env, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '', size = 0, settled = false, failure = null;
    let grace, closed = false, code = null, killConfirmed = false;
    const finish = (error, terminationConfirmed = closed) => {
      if (settled) return;
      settled = true; clearTimeout(timer); clearTimeout(grace);
      signal?.removeEventListener('abort',onAbort);
      const result = { stdout, stderr, exitCode: code, pid: child.pid, terminationConfirmed };
      if (!closed) { child.stdout.destroy(); child.stderr.destroy(); child.unref(); }
      if (error) reject(Object.assign(new Error(error), result)); else resolve(result);
    };
    const terminate = reason => {
      if (failure || settled) return;
      failure = reason;
      grace = setTimeout(() => finish(`${reason}:termination_unconfirmed`, false), killGraceMs);
      try {
        killImpl(child, error => {
          if (settled) return;
          if (error) finish(`${reason}:tree_kill_failed:${error.message}`, false);
          else { killConfirmed = true; if (closed) finish(reason, true); }
          // A successful kill request alone is not an observed process exit.
        });
      } catch (error) { finish(`${reason}:tree_kill_failed:${error.message}`, false); }
    };
    const collect = stream => chunk => {
      if (settled) return;
      size += chunk.length;
      if (size > maxBytes) { terminate('output_limit'); return; }
      if (stream === 'stdout' && onStdout) {
        try {onStdout(chunk);} catch(error) {terminate(`stdout_sink:${error.message}`);}
      } else if (stream === 'stdout') stdout += chunk.toString('utf8'); else stderr += chunk.toString('utf8');
    };
    child.stdout.on('data', collect('stdout')); child.stderr.on('data', collect('stderr'));
    child.on('error', error => finish(`spawn_error:${error.message}`, false));
    child.on('close', exitCode => {
      closed = true; code = exitCode;
      if (failure) { if (killConfirmed) finish(failure, true); }
      else finish(exitCode === 0 ? null : `process_exit_${exitCode}`, true);
    });
    const onAbort=()=>terminate('process_cancelled');
    const timer = setTimeout(() => terminate('process_timeout'), timeoutMs);
    signal?.addEventListener('abort',onAbort,{once:true});
    if(signal?.aborted)onAbort();
  });
}
function killTree(child, done) {
  if (!child.pid) return done(new Error('missing_pid'));
  if (process.platform === 'win32') {
    if (!process.env.SystemRoot) return done(new Error('missing_system_root'));
    execFile(`${process.env.SystemRoot}/System32/taskkill.exe`, ['/PID', String(child.pid), '/T', '/F'],
      { windowsHide: true, timeout: 8000 }, done);
  } else {
    try { process.kill(-child.pid, 'SIGKILL'); done(null); }
    catch (error) { done(error); }
  }
}
