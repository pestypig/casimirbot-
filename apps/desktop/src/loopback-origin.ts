import { lstatSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";

const PREFERENCE_SCHEMA = "casimir_desktop_loopback_preference/1";
const LEGACY_READY_SCHEMA = "casimir_desktop_service_ready_receipt/1";
const validPort = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 1024 && value <= 65535;

function readSmallRecord(file: string): Record<string, unknown> | null {
  try {
    const stat = lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 4096) return null;
    const value: unknown = JSON.parse(readFileSync(file, "utf8"));
    return value !== null && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown> : null;
  } catch { return null; }
}

/** Address preference only. Never reuse a readiness verdict or a session secret. */
export function readPreferredDesktopPort(userDataPath: string): number | null {
  const state = path.join(userDataPath, "state");
  const saved = readSmallRecord(path.join(state, "desktop-loopback-preference.json"));
  if (saved?.schema === PREFERENCE_SCHEMA && validPort(saved.port)) return saved.port;
  // Upgrade existing installs without moving browser storage or inventing consent.
  const legacy = readSmallRecord(path.join(state, "desktop-service-ready.json"));
  if (legacy?.schema !== LEGACY_READY_SCHEMA || legacy.ready !== true ||
      typeof legacy.origin !== "string") return null;
  const match = /^http:\/\/127\.0\.0\.1:([1-9][0-9]{3,4})$/.exec(legacy.origin);
  const port = match ? Number(match[1]) : null;
  return validPort(port) ? port : null;
}

function probeLoopbackPort(port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const reservation = createServer();
    reservation.unref();
    reservation.once("error", reject);
    reservation.listen(port, "127.0.0.1", () => {
      const address = reservation.address();
      if (!address || typeof address === "string") {
        reservation.close(); reject(new Error("Unable to reserve a desktop loopback port"));
        return;
      }
      reservation.close(error => error ? reject(error) : resolve(address.port));
    });
  });
}

export async function reserveDesktopLoopbackPort(preferredPort: number | null): Promise<number> {
  if (validPort(preferredPort)) {
    try { return await probeLoopbackPort(preferredPort); }
    catch (error) {
      const code = (error as NodeJS.ErrnoException)?.code;
      if (code !== "EADDRINUSE" && code !== "EACCES") throw error;
      // A different listener is never assumed to be CasimirBot or contacted.
    }
  }
  return probeLoopbackPort(0);
}

export function rememberHealthyDesktopPort(userDataPath: string, port: number): void {
  if (!validPort(port)) throw new Error("Invalid desktop loopback preference");
  const state = path.join(userDataPath, "state");
  mkdirSync(state, { recursive: true });
  const file = path.join(state, "desktop-loopback-preference.json");
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(temporary, JSON.stringify({ schema: PREFERENCE_SCHEMA, port }) + "\n", { mode: 0o600 });
  renameSync(temporary, file);
}
