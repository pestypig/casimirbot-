/**
 * Describes the host that is rendering CasimirBot. This is intentionally
 * independent of viewport size and mobile-device detection.
 *
 * Runtime capabilities are presentation and feature-availability hints only.
 * They MUST NOT be used as an authorization boundary; account policy and the
 * workstation tool gateway remain authoritative.
 */
export const RUNTIME_SURFACES = ["web", "pwa", "desktop_native"] as const;

export type RuntimeSurface = (typeof RUNTIME_SURFACES)[number];

export type RuntimeSurfaceSignals = {
  /** Set only when the typed native preload bridge completed its handshake. */
  nativeBridgeReady?: boolean;
  /** Browser display-mode signal; this does not grant native authority. */
  standaloneDisplayMode?: boolean;
};

export const RUNTIME_CAPABILITY_KEYS = [
  "nativeBinaryUpdate",
  "localServiceControl",
  "localWorkspaceAccess",
  "codexMcpRegistration",
  "secureCredentialVault",
  "deviceAgentControl",
] as const;

export type RuntimeCapabilityKey = (typeof RUNTIME_CAPABILITY_KEYS)[number];
export type RuntimeCapabilities = Readonly<Record<RuntimeCapabilityKey, boolean>>;

export type NativeRuntimeCapabilityDeclaration = Partial<RuntimeCapabilities>;

export const DESKTOP_RUNTIME_SNAPSHOT_SCHEMA_VERSION =
  "casimir_desktop_runtime/1" as const;

export type DesktopRuntimeSnapshot = {
  schemaVersion: typeof DESKTOP_RUNTIME_SNAPSHOT_SCHEMA_VERSION;
  surface: "desktop_native";
  serviceOrigin: string;
  capabilities: RuntimeCapabilities;
};

const NO_NATIVE_CAPABILITIES: RuntimeCapabilities = Object.freeze({
  nativeBinaryUpdate: false,
  localServiceControl: false,
  localWorkspaceAccess: false,
  codexMcpRegistration: false,
  secureCredentialVault: false,
  deviceAgentControl: false,
});

export function resolveRuntimeSurface(signals: RuntimeSurfaceSignals): RuntimeSurface {
  if (signals.nativeBridgeReady === true) return "desktop_native";
  if (signals.standaloneDisplayMode === true) return "pwa";
  return "web";
}

/**
 * Native features fail closed until the trusted host declares each capability.
 * Web and PWA callers cannot elevate themselves by supplying a declaration.
 */
export function resolveRuntimeCapabilities(
  surface: RuntimeSurface,
  nativeDeclaration: NativeRuntimeCapabilityDeclaration = {},
): RuntimeCapabilities {
  if (surface !== "desktop_native") return NO_NATIVE_CAPABILITIES;

  return Object.freeze({
    nativeBinaryUpdate: nativeDeclaration.nativeBinaryUpdate === true,
    localServiceControl: nativeDeclaration.localServiceControl === true,
    localWorkspaceAccess: nativeDeclaration.localWorkspaceAccess === true,
    codexMcpRegistration: nativeDeclaration.codexMcpRegistration === true,
    secureCredentialVault: nativeDeclaration.secureCredentialVault === true,
    deviceAgentControl: nativeDeclaration.deviceAgentControl === true,
  });
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasExactKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
};

const normalizeLoopbackServiceOrigin = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "http:" ||
      url.hostname !== "127.0.0.1" ||
      !url.port ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
};

/**
 * Validates the untrusted value crossing the preload boundary. The snapshot is
 * accepted only for the exact loopback origin rendering the application.
 */
export function parseDesktopRuntimeSnapshot(
  value: unknown,
  expectedServiceOrigin: string,
): DesktopRuntimeSnapshot | null {
  if (!isRecord(value) || !hasExactKeys(value, ["schemaVersion", "surface", "serviceOrigin", "capabilities"])) {
    return null;
  }
  if (
    value.schemaVersion !== DESKTOP_RUNTIME_SNAPSHOT_SCHEMA_VERSION ||
    value.surface !== "desktop_native" ||
    !isRecord(value.capabilities) ||
    !hasExactKeys(value.capabilities, RUNTIME_CAPABILITY_KEYS)
  ) {
    return null;
  }

  const serviceOrigin = normalizeLoopbackServiceOrigin(value.serviceOrigin);
  if (serviceOrigin === null || serviceOrigin !== expectedServiceOrigin) return null;
  const declaredCapabilities = value.capabilities;
  if (RUNTIME_CAPABILITY_KEYS.some((key) => typeof declaredCapabilities[key] !== "boolean")) {
    return null;
  }

  const capabilities = resolveRuntimeCapabilities(
    "desktop_native",
    declaredCapabilities as NativeRuntimeCapabilityDeclaration,
  );
  return Object.freeze({
    schemaVersion: DESKTOP_RUNTIME_SNAPSHOT_SCHEMA_VERSION,
    surface: "desktop_native",
    serviceOrigin,
    capabilities,
  });
}
