import fs from "node:fs/promises";
import path from "node:path";
import type { ConsoleTelemetryBundle } from "@shared/desktop";

const SNAPSHOT_PATH = path.join(process.cwd(), "server/_generated/console-telemetry.json");

export const CONSOLE_TELEMETRY_SNAPSHOT_PATH = SNAPSHOT_PATH;

export async function persistConsoleTelemetrySnapshot(bundle: ConsoleTelemetryBundle): Promise<void> {
  await fs.mkdir(path.dirname(SNAPSHOT_PATH), { recursive: true });
  await fs.writeFile(SNAPSHOT_PATH, JSON.stringify(bundle, null, 2), "utf8");
}
