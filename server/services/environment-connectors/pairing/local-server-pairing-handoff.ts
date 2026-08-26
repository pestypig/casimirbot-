import crypto from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const SERVER_PAIRING_INBOX = "helix-fabric-sensor.pairing-inbox" as const;
const SERVER_PAIRING_COMMAND =
  /^\/helix\s+pair\s+[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}\s*$/u;

export class LocalServerPairingHandoffError extends Error {
  constructor(
    readonly code:
      | "local_server_pairing_root_unavailable"
      | "local_server_pairing_command_invalid"
      | "local_server_pairing_path_invalid",
    message: string,
  ) {
    super(message);
    this.name = "LocalServerPairingHandoffError";
  }
}

export const stageLocalMinecraftServerPairing = async (input: {
  command: string;
  workspaceRoot?: string | null;
}): Promise<{ status: "server_pairing_inbox_staged" }> => {
  const command = input.command.trim();
  if (
    !SERVER_PAIRING_COMMAND.test(command) ||
    Buffer.byteLength(command, "utf8") > 512
  ) {
    throw new LocalServerPairingHandoffError(
      "local_server_pairing_command_invalid",
      "The generated server-pairing command failed the bounded local handoff contract.",
    );
  }

  const workspaceRoot = path.resolve(
    input.workspaceRoot?.trim() || process.cwd(),
  );
  if (!workspaceRoot) {
    throw new LocalServerPairingHandoffError(
      "local_server_pairing_root_unavailable",
      "The same-host Fabric server workspace is unavailable.",
    );
  }
  const serverRoot = path.resolve(
    workspaceRoot,
    "minecraft",
    "helix-fabric-sensor",
    "run",
  );
  const configDirectory = path.resolve(serverRoot, "config");
  const relativeConfig = path.relative(workspaceRoot, configDirectory);
  if (
    relativeConfig.startsWith("..") ||
    path.isAbsolute(relativeConfig) ||
    relativeConfig !== path.join(
      "minecraft",
      "helix-fabric-sensor",
      "run",
      "config",
    )
  ) {
    throw new LocalServerPairingHandoffError(
      "local_server_pairing_path_invalid",
      "The local server pairing inbox resolved outside the fixed repository Fabric server profile.",
    );
  }

  await mkdir(configDirectory, { recursive: true });
  const inboxPath = path.join(configDirectory, SERVER_PAIRING_INBOX);
  const pendingPath = path.join(
    configDirectory,
    `${SERVER_PAIRING_INBOX}.pending.${process.pid}.${crypto.randomUUID()}`,
  );
  try {
    await writeFile(pendingPath, command, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
    await rm(inboxPath, { force: true });
    await rename(pendingPath, inboxPath);
  } finally {
    await rm(pendingPath, { force: true }).catch(() => undefined);
  }
  return { status: "server_pairing_inbox_staged" };
};
