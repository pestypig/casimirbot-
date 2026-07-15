import { spawn, type ChildProcess } from "node:child_process";

const WINDOWS_TREE_KILL_TIMEOUT_MS = 5_000;

const stopDirectChild = (child: ChildProcess): void => {
  try {
    child.kill("SIGTERM");
  } catch {
    // The process may already have exited while cancellation was being applied.
  }
};

/**
 * Stop the process launched for a registered runtime and, on Windows, every
 * descendant created by npm/tsx. A timeout is not final until this cleanup
 * attempt finishes, so the durable receipt cannot claim timeout while the
 * scientific command continues consuming resources in the background.
 */
export const terminateTheoryRuntimeProcessTree = async (child: ChildProcess): Promise<void> => {
  const pid = child.pid;
  if (!Number.isInteger(pid) || (pid ?? 0) <= 0) {
    stopDirectChild(child);
    return;
  }
  if (process.platform !== "win32") {
    stopDirectChild(child);
    return;
  }

  await new Promise<void>((resolve) => {
    let finished = false;
    let killer: ChildProcess | null = null;
    const finish = (fallbackToDirectChild: boolean): void => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      if (fallbackToDirectChild) stopDirectChild(child);
      resolve();
    };
    const timeout = setTimeout(() => {
      try {
        killer?.kill();
      } catch {
        // Best-effort cleanup of the helper itself.
      }
      finish(true);
    }, WINDOWS_TREE_KILL_TIMEOUT_MS);

    try {
      killer = spawn("taskkill.exe", ["/pid", String(pid), "/T", "/F"], {
        stdio: "ignore",
        shell: false,
        windowsHide: true,
      });
    } catch {
      finish(true);
      return;
    }
    killer.once("error", () => finish(true));
    killer.once("close", (exitCode) => finish(exitCode !== 0));
  });
};
