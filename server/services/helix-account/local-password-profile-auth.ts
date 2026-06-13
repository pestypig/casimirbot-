import crypto from "node:crypto";

export type LocalPasswordProfileAuthConfig = {
  enabled: boolean;
  username: string;
  profile_id: string;
  display_name: string;
  email: string | null;
  password_hash: string;
  dev_default: boolean;
};

export type LocalPasswordProfileAuthResult =
  | {
      ok: true;
      config: LocalPasswordProfileAuthConfig;
    }
  | {
      ok: false;
      error:
        | "local_password_profile_disabled"
        | "local_password_profile_misconfigured"
        | "invalid_local_profile_credentials";
    };

const SCRYPT_PREFIX = "scrypt";
const DEFAULT_DEV_USERNAME = "admin";
const DEFAULT_DEV_PASSWORD = "password";
const DEFAULT_DEV_SALT = "casimirbot-local-dev-profile";
const DEFAULT_KEYLEN = 64;

const truthy = (value: unknown): boolean =>
  typeof value === "string" && /^(1|true|yes|on)$/i.test(value.trim());

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const scryptDigest = (
  password: string,
  salt: string,
  keylen = DEFAULT_KEYLEN,
): Buffer => crypto.scryptSync(password, salt, keylen);

export function createLocalPasswordProfileHash(input: {
  password: string;
  salt?: string;
}): string {
  const salt = normalize(input.salt) || crypto.randomBytes(16).toString("base64url");
  const digest = scryptDigest(input.password, salt);
  return `${SCRYPT_PREFIX}$${salt}$${digest.toString("base64url")}`;
}

function verifyLocalPasswordProfileHash(password: string, encodedHash: string): boolean {
  const parts = encodedHash.split("$");
  if (parts.length !== 3 || parts[0] !== SCRYPT_PREFIX) return false;
  const [, salt, digest] = parts;
  if (!salt || !digest) return false;
  const expected = Buffer.from(digest, "base64url");
  if (expected.length === 0) return false;
  const actual = scryptDigest(password, salt, expected.length);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function resolveLocalPasswordProfileAuthConfig(
  env: Record<string, string | undefined> = process.env,
): LocalPasswordProfileAuthConfig {
  const production = env.NODE_ENV === "production";
  const explicitEnabled = truthy(env.HELIX_LOCAL_PASSWORD_PROFILE_ENABLED);
  const username = normalize(env.HELIX_LOCAL_PROFILE_USERNAME) || DEFAULT_DEV_USERNAME;
  const rawPassword = normalize(env.HELIX_LOCAL_PROFILE_PASSWORD);
  const configuredHash = normalize(env.HELIX_LOCAL_PROFILE_PASSWORD_HASH);
  const devDefault = !configuredHash && !rawPassword && !production;
  const passwordHash = configuredHash || createLocalPasswordProfileHash({
    password: rawPassword || DEFAULT_DEV_PASSWORD,
    salt: devDefault ? DEFAULT_DEV_SALT : undefined,
  });

  return {
    enabled: explicitEnabled || !production,
    username,
    profile_id: normalize(env.HELIX_LOCAL_PROFILE_ID) || `local:${username}`,
    display_name: normalize(env.HELIX_LOCAL_PROFILE_DISPLAY_NAME) || "Admin Operator",
    email: normalize(env.HELIX_LOCAL_PROFILE_EMAIL) || null,
    password_hash: passwordHash,
    dev_default: devDefault,
  };
}

export function verifyLocalPasswordProfileCredentials(input: {
  username?: string | null;
  password?: string | null;
  env?: Record<string, string | undefined>;
}): LocalPasswordProfileAuthResult {
  const config = resolveLocalPasswordProfileAuthConfig(input.env);
  if (!config.enabled) {
    return { ok: false, error: "local_password_profile_disabled" };
  }
  if (!config.password_hash.startsWith(`${SCRYPT_PREFIX}$`)) {
    return { ok: false, error: "local_password_profile_misconfigured" };
  }
  const username = normalize(input.username);
  const password = typeof input.password === "string" ? input.password : "";
  if (username !== config.username || !password) {
    return { ok: false, error: "invalid_local_profile_credentials" };
  }
  try {
    if (!verifyLocalPasswordProfileHash(password, config.password_hash)) {
      return { ok: false, error: "invalid_local_profile_credentials" };
    }
  } catch {
    return { ok: false, error: "local_password_profile_misconfigured" };
  }
  return { ok: true, config };
}
