import path from "node:path";

const INHERITED_DESKTOP_SERVICE_KEYS = [
  "SystemRoot",
  "WINDIR",
  "COMSPEC",
  "PATHEXT",
  "PATH",
  "TEMP",
  "TMP",
  "USERPROFILE",
  "APPDATA",
  "LOCALAPPDATA",
  "PROGRAMDATA",
  "PROCESSOR_ARCHITECTURE",
  "NUMBER_OF_PROCESSORS",
] as const;

// These are public verifier identifiers, never OAuth client secrets or tokens.
// They may be supplied through a developer workstation/system environment
// until the signed release has a reviewed Auth0 deployment profile.
const INHERITED_DESKTOP_OAUTH_PUBLIC_KEYS = [
  "HELIX_AGENT_OAUTH_ISSUER",
  "HELIX_AGENT_OAUTH_AUDIENCE",
  "HELIX_AGENT_OAUTH_JWKS_URL",
  "HELIX_AGENT_OAUTH_PROVIDER",
  "HELIX_AGENT_OAUTH_ALGORITHMS",
  "HELIX_AGENT_OAUTH_TENANT_CLAIM",
  "HELIX_AGENT_OAUTH_NATIVE_CLIENT_ID",
  "HELIX_AGENT_OAUTH_LINK_SCOPE",
] as const;

// Developer access remains an exact server-side identity allowlist. This is
// privileged workstation policy rather than a credential: the desktop host
// may inherit it for a developer pilot, but it must never synthesize a
// developer identity or default public accounts to developer.
const INHERITED_DESKTOP_ACCOUNT_POLICY_KEYS = [
  "HELIX_DEVELOPER_PROFILE_IDS",
  // Credential-free, hash-pinned C3 developer acceptance evidence may live
  // outside the packaged runtime. The reader still constrains every file to
  // the canonical root and admits only the exact developer profile in config.
  "HELIX_PRIVATE_COMPANION_C3_WORKSPACE_ROOT",
] as const;

export const DESKTOP_LOCAL_DATABASE_RELATIVE_PATH = path.join(
  "state",
  "helix-local-pg-mem.json",
);

export const DESKTOP_LOCAL_MINECRAFT_PROFILES_RELATIVE_PATH = path.join(
  "state",
  "local-minecraft-run-profiles.json",
);

export const resolveDesktopUserDataOverride = (
  value: string | null | undefined,
): string | null => {
  const configured = value?.trim() ?? "";
  if (!configured) return null;
  if (!/^[a-zA-Z]:[\\/]/.test(configured) || configured.startsWith("\\\\")) {
    throw new Error(
      "Desktop user-data override must be an absolute local Windows drive path",
    );
  }
  return path.win32.resolve(configured);
};

export const buildDesktopServiceEnvironment = (input: {
  processEnv: NodeJS.ProcessEnv;
  userDataPath: string;
  serviceOrigin: string;
  providerCredentialBroker: Readonly<{
    origin: string;
    token: string;
    openAiRealtimeAvailable?: boolean;
  }>;
  mcpTransitionBroker: Readonly<{
    origin: string;
    token: string;
  }>;
  friendsPartiesCoordinationBroker: Readonly<{
    origin: string;
    token: string;
  }> | null;
  deviceId: string;
}): NodeJS.ProcessEnv => {
  if (!input.userDataPath.trim()) {
    throw new Error("Electron userData path is required for desktop local state");
  }
  const serviceOrigin = new URL(input.serviceOrigin);
  if (
    serviceOrigin.protocol !== "http:" ||
    serviceOrigin.hostname !== "127.0.0.1" ||
    !serviceOrigin.port ||
    serviceOrigin.username ||
    serviceOrigin.password ||
    serviceOrigin.pathname !== "/" ||
    serviceOrigin.search ||
    serviceOrigin.hash
  ) {
    throw new Error(
      "Desktop service origin must be an exact HTTP 127.0.0.1 origin",
    );
  }
  const providerCredentialBrokerOrigin = new URL(
    input.providerCredentialBroker.origin,
  );
  if (
    providerCredentialBrokerOrigin.protocol !== "http:" ||
    providerCredentialBrokerOrigin.hostname !== "127.0.0.1" ||
    !providerCredentialBrokerOrigin.port ||
    providerCredentialBrokerOrigin.username ||
    providerCredentialBrokerOrigin.password ||
    providerCredentialBrokerOrigin.pathname !== "/" ||
    providerCredentialBrokerOrigin.search ||
    providerCredentialBrokerOrigin.hash
  ) {
    throw new Error(
      "Desktop provider credential broker must be an exact HTTP 127.0.0.1 origin",
    );
  }
  const providerCredentialBrokerToken =
    input.providerCredentialBroker.token.trim();
  if (
    !/^[A-Za-z0-9_-]{43}$/u.test(providerCredentialBrokerToken) ||
    Buffer.from(providerCredentialBrokerToken, "base64url").length !== 32
  ) {
    throw new Error(
      "Desktop provider credential broker token must be exactly 32 base64url bytes",
    );
  }
  const mcpTransitionBrokerOrigin = new URL(input.mcpTransitionBroker.origin);
  if (
    mcpTransitionBrokerOrigin.protocol !== "http:" ||
    mcpTransitionBrokerOrigin.hostname !== "127.0.0.1" ||
    !mcpTransitionBrokerOrigin.port ||
    mcpTransitionBrokerOrigin.username ||
    mcpTransitionBrokerOrigin.password ||
    mcpTransitionBrokerOrigin.pathname !== "/" ||
    mcpTransitionBrokerOrigin.search ||
    mcpTransitionBrokerOrigin.hash
  ) {
    throw new Error(
      "Desktop MCP transition broker must be an exact HTTP 127.0.0.1 origin",
    );
  }
  const mcpTransitionBrokerToken = input.mcpTransitionBroker.token.trim();
  if (
    !/^[A-Za-z0-9_-]{43}$/u.test(mcpTransitionBrokerToken) ||
    Buffer.from(mcpTransitionBrokerToken, "base64url").length !== 32
  ) {
    throw new Error(
      "Desktop MCP transition broker token must be exactly 32 base64url bytes",
    );
  }
  let friendsPartiesCoordinationBrokerOrigin: URL | null = null;
  let friendsPartiesCoordinationBrokerToken: string | null = null;
  if (input.friendsPartiesCoordinationBroker) {
    friendsPartiesCoordinationBrokerOrigin = new URL(
      input.friendsPartiesCoordinationBroker.origin,
    );
    friendsPartiesCoordinationBrokerToken =
      input.friendsPartiesCoordinationBroker.token.trim();
    if (
      friendsPartiesCoordinationBrokerOrigin.protocol !== "http:" ||
      friendsPartiesCoordinationBrokerOrigin.hostname !== "127.0.0.1" ||
      !friendsPartiesCoordinationBrokerOrigin.port ||
      friendsPartiesCoordinationBrokerOrigin.username ||
      friendsPartiesCoordinationBrokerOrigin.password ||
      friendsPartiesCoordinationBrokerOrigin.pathname !== "/" ||
      friendsPartiesCoordinationBrokerOrigin.search ||
      friendsPartiesCoordinationBrokerOrigin.hash ||
      !/^[A-Za-z0-9_-]{43}$/u.test(friendsPartiesCoordinationBrokerToken) ||
      Buffer.from(friendsPartiesCoordinationBrokerToken, "base64url").length !== 32
    ) {
      throw new Error(
        "Desktop Friends & Parties coordination broker is invalid",
      );
    }
  }
  const deviceId = input.deviceId.trim();
  if (!/^desktop_device_[A-Za-z0-9_-]{22}$/u.test(deviceId)) {
    throw new Error("Desktop device identity is invalid");
  }

  const environment: NodeJS.ProcessEnv = {};
  for (const key of INHERITED_DESKTOP_SERVICE_KEYS) {
    const value = input.processEnv[key];
    if (value) environment[key] = value;
  }
  for (const key of INHERITED_DESKTOP_OAUTH_PUBLIC_KEYS) {
    const value = input.processEnv[key]?.trim();
    if (value) environment[key] = value;
  }
  for (const key of INHERITED_DESKTOP_ACCOUNT_POLICY_KEYS) {
    const value = input.processEnv[key]?.trim();
    if (value) environment[key] = value;
  }

  const userDataRoot = path.resolve(input.userDataPath);
  environment.HELIX_LOCAL_DB_PATH = path.join(
    userDataRoot,
    DESKTOP_LOCAL_DATABASE_RELATIVE_PATH,
  );
  environment.HELIX_LOCAL_PG_MEM_PERSIST = "1";
  // Immediate writes use the database's streaming atomic snapshot writer and
  // avoid losing a deferred update when Windows terminates the child process.
  environment.HELIX_LOCAL_PG_MEM_WRITE_MODE = "immediate";
  environment.HELIX_PROVIDER_CREDENTIAL_BROKER_ORIGIN =
    providerCredentialBrokerOrigin.origin;
  environment.HELIX_PROVIDER_CREDENTIAL_BROKER_TOKEN =
    providerCredentialBrokerToken;
  if (input.providerCredentialBroker.openAiRealtimeAvailable === true) {
    environment.HELIX_NATIVE_OPENAI_REALTIME_BROKER_ENABLED = "1";
    environment.HELIX_REALTIME_SESSION_DESCRIPTOR_ENABLED = "1";
    environment.HELIX_REALTIME_SESSION_ADAPTER_ENABLED = "1";
    environment.HELIX_REALTIME_SESSION_LIVE_TRANSPORT_ENABLED = "1";
    environment.HELIX_REALTIME_SESSION_OPENAI_CONTRACT_ENABLED = "1";
  }
  environment.HELIX_DESKTOP_MCP_TRANSITION_BROKER_ORIGIN =
    mcpTransitionBrokerOrigin.origin;
  environment.HELIX_DESKTOP_MCP_TRANSITION_BROKER_TOKEN =
    mcpTransitionBrokerToken;
  environment.HELIX_FRIENDS_PARTIES_COORDINATION_REQUIRED = "1";
  if (
    friendsPartiesCoordinationBrokerOrigin &&
    friendsPartiesCoordinationBrokerToken
  ) {
    environment.HELIX_FRIENDS_PARTIES_COORDINATION_BROKER_ORIGIN =
      friendsPartiesCoordinationBrokerOrigin.origin;
    environment.HELIX_FRIENDS_PARTIES_COORDINATION_BROKER_TOKEN =
      friendsPartiesCoordinationBrokerToken;
  }
  environment.HELIX_DESKTOP_DEVICE_ID = deviceId;
  // The service receives only the native-owned profile registry location.
  // Individual run directories are selected by the signed-in profile through
  // the native picker and are never accepted from an MCP request.
  environment.HELIX_DESKTOP_MINECRAFT_PROFILE_STORE = path.join(
    userDataRoot,
    DESKTOP_LOCAL_MINECRAFT_PROFILES_RELATIVE_PATH,
  );
  // The private desktop MCP publishes discovery at its per-launch loopback
  // origin. OpenAI Secure MCP Tunnel performs that discovery locally and
  // rewrites resource URLs to the public tunnel endpoint. Never inherit the
  // website origin here: it can be stale and would bypass the private route.
  environment.CASIMIR_PUBLIC_BASE_URL = serviceOrigin.origin;
  return environment;
};
