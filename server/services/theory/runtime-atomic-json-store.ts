import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const writeLocks = new Map<string, Promise<void>>();

const isMissing = (error: unknown): boolean =>
  (error as NodeJS.ErrnoException)?.code === "ENOENT";

async function readTargetOrBackup(target: string): Promise<string> {
  try {
    return await fs.readFile(target, "utf8");
  } catch (error) {
    if (!isMissing(error)) throw error;
  }
  const backup = `${target}.bak`;
  const raw = await fs.readFile(backup, "utf8");
  await fs.copyFile(backup, target).catch(() => undefined);
  return raw;
}

export async function readTheoryRuntimeJsonFile(
  target: string,
): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await readTargetOrBackup(target);
    } catch (error) {
      lastError = error;
      if (!isMissing(error) || attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2));
    }
  }
  throw lastError;
}

async function replaceJsonFile(target: string, value: unknown): Promise<void> {
  const temporary = `${target}.${process.pid}.${randomUUID()}.tmp`;
  const backup = `${target}.bak`;
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  try {
    try {
      await fs.rename(temporary, target);
      await fs.rm(backup, { force: true }).catch(() => undefined);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException)?.code;
      if (code !== "EPERM" && code !== "EEXIST") throw error;
    }

    await fs.rm(backup, { force: true });
    let movedCurrent = false;
    try {
      await fs.rename(target, backup);
      movedCurrent = true;
    } catch (error) {
      if (!isMissing(error)) throw error;
    }
    try {
      await fs.rename(temporary, target);
    } catch (error) {
      if (movedCurrent) await fs.rename(backup, target).catch(() => undefined);
      throw error;
    }
    if (movedCurrent)
      await fs.rm(backup, { force: true }).catch(() => undefined);
  } finally {
    await fs.rm(temporary, { force: true }).catch(() => undefined);
  }
}

async function createJsonFileExclusive(
  target: string,
  value: unknown,
): Promise<void> {
  const temporary = `${target}.${process.pid}.${randomUUID()}.create.tmp`;
  const payload = `${JSON.stringify(value, null, 2)}\n`;
  await fs.mkdir(path.dirname(target), { recursive: true });
  try {
    const handle = await fs.open(temporary, "wx", 0o600);
    try {
      await handle.writeFile(payload, "utf8");
      await handle.sync();
    } finally {
      await handle.close();
    }

    // Linking a fully written sibling is an atomic create-if-absent operation
    // on every filesystem supported by this runtime. Unlike rename, it never
    // replaces an existing deterministic request identity on POSIX.
    await fs.link(temporary, target);
  } finally {
    await fs.rm(temporary, { force: true }).catch(() => undefined);
  }
}

export async function writeTheoryRuntimeJsonFile(
  target: string,
  value: unknown,
): Promise<void> {
  const previous = writeLocks.get(target) ?? Promise.resolve();
  const current = previous
    .catch(() => undefined)
    .then(() => replaceJsonFile(target, value));
  writeLocks.set(target, current);
  try {
    await current;
  } finally {
    if (writeLocks.get(target) === current) writeLocks.delete(target);
  }
}

export async function createTheoryRuntimeJsonFile(
  target: string,
  value: unknown,
): Promise<void> {
  const previous = writeLocks.get(target) ?? Promise.resolve();
  const current = previous
    .catch(() => undefined)
    .then(() => createJsonFileExclusive(target, value));
  writeLocks.set(target, current);
  try {
    await current;
  } finally {
    if (writeLocks.get(target) === current) writeLocks.delete(target);
  }
}
