import { randomBytes } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const DEVICE_IDENTITY_SCHEMA = "casimir_desktop_device_identity/1" as const;
const DEVICE_IDENTITY_RELATIVE_PATH = path.join(
  "state",
  "device-identity.v1.json",
);

export type DesktopDeviceIdentity = Readonly<{
  schema: typeof DEVICE_IDENTITY_SCHEMA;
  deviceId: string;
  createdAt: string;
}>;

const parseIdentity = (value: unknown): DesktopDeviceIdentity | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (
    record.schema !== DEVICE_IDENTITY_SCHEMA ||
    typeof record.deviceId !== "string" ||
    !/^desktop_device_[A-Za-z0-9_-]{22}$/u.test(record.deviceId) ||
    typeof record.createdAt !== "string" ||
    !Number.isFinite(Date.parse(record.createdAt))
  ) {
    return null;
  }
  return Object.freeze({
    schema: DEVICE_IDENTITY_SCHEMA,
    deviceId: record.deviceId,
    createdAt: new Date(record.createdAt).toISOString(),
  });
};

export const loadOrCreateDesktopDeviceIdentity = (input: {
  userDataPath: string;
  now?: () => Date;
  random?: (size: number) => Buffer;
}): DesktopDeviceIdentity => {
  const stateRoot = path.resolve(input.userDataPath, "state");
  const identityPath = path.resolve(
    input.userDataPath,
    DEVICE_IDENTITY_RELATIVE_PATH,
  );
  if (
    path.relative(path.resolve(input.userDataPath), identityPath).startsWith("..")
  ) {
    throw new Error("Desktop device identity path escaped the user-data root");
  }
  if (existsSync(identityPath)) {
    try {
      const parsed = parseIdentity(JSON.parse(readFileSync(identityPath, "utf8")));
      if (parsed) return parsed;
    } catch {
      // The fixed error below avoids reflecting file content.
    }
    throw new Error("Desktop device identity state is invalid");
  }
  mkdirSync(stateRoot, { recursive: true });
  const random = input.random ?? randomBytes;
  const identity: DesktopDeviceIdentity = Object.freeze({
    schema: DEVICE_IDENTITY_SCHEMA,
    deviceId: `desktop_device_${random(16).toString("base64url")}`,
    createdAt: (input.now ?? (() => new Date()))().toISOString(),
  });
  const temporaryPath = `${identityPath}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(identity)}\n`, {
    encoding: "utf8",
    mode: 0o600,
    flag: "wx",
  });
  renameSync(temporaryPath, identityPath);
  return identity;
};

