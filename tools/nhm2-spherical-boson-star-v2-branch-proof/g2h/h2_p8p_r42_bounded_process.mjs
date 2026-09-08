import { spawn, execFile } from 'node:child_process';

// No shell interpolation. The production adapter must supply an executable,
// not gcloud.cmd, and explicit argument elements.
export function boundedProcess(executable, args, { timeoutMs, maxBytes = 1048576, env = process.env } = {}) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('invalid_timeout');
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      shell: false, windowsHide: true, env,
      detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '', stderr = '', size = 0, failure = null, killError = null;
    let killPending = false, closed = false, exitCode;
    const finish = () => {
      if (!closed || killPending) return;
      clearTimeout(timer);
      const result = { stdout, stderr, exitCode, pid: child.pid };
      if (failure || killError || exitCode !== 0) {
        const error = new Error(killError ? `process_tree_stop_failed: ${killError}` : failure ?? `process_exit_${exitCode}`);
        Object.assign(error, result);
        reject(error);
      } else resolve(result);
    };
    const terminate = reason => {
      if (failure) return;
      failure = reason;
      killPending = true;
      if (process.platform === 'win32') {
        const systemRoot = process.env.SystemRoot;
        if (!systemRoot || !child.pid) {
          killError = 'missing_system_root_or_pid';
          killPending = false;
          child.kill();
          return;
        }
        execFile(`${systemRoot}\\System32\\taskkill.exe`, ['/PID', String(child.pid), '/T', '/F'],
          { windowsHide: true, timeout: 10000 }, error => {
            if (error) killError = error.message;
            killPending = false;
            finish();
          });
      } else {
        try { process.kill(-child.pid, 'SIGKILL'); } catch (error) {
          if (error.code !== 'ESRCH') killError = error.message;
        }
        killPending = false;
      }
    };
    const collect = stream => chunk => {
      size += chunk.length;
      if (size > maxBytes) { terminate('output_limit'); return; }
      if (stream === 'stdout') stdout += chunk.toString('utf8');
      else stderr += chunk.toString('utf8');
    };
    child.stdout.on('data', collect('stdout'));
    child.stderr.on('data', collect('stderr'));
    child.on('error', error => { failure ??= error.message; });
    child.on('close', code => { closed = true; exitCode = code; finish(); });
    const timer = setTimeout(() => terminate('process_timeout'), timeoutMs);
  });
}
