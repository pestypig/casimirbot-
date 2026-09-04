export type ActiveDesktopAccount = Readonly<{
  sessionId: string;
  profileId: string;
  accountType: "developer" | "user";
}>;

export type DesktopAccountSessionCookie = Readonly<{
  url: string;
  name: "helix_session";
  value: string;
  httpOnly: true;
  secure: false;
  sameSite: "lax";
  path: "/";
  expirationDate: number;
}>;

const ACCOUNT_SESSION_PATTERN = /^account_session:[A-Za-z0-9-]{8,128}$/u;

export const parseActiveDesktopAccount = (
  payload: unknown,
): ActiveDesktopAccount | null => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const session = (payload as { session?: unknown }).session;
  if (!session || typeof session !== "object" || Array.isArray(session)) {
    return null;
  }
  const candidate = session as {
    session_id?: unknown;
    profile?: { profile_id?: unknown } | null;
    status?: unknown;
    account_policy?: { account_type?: unknown } | null;
  };
  const sessionId = candidate.session_id;
  const profileId = candidate.profile?.profile_id;
  const accountType = candidate.account_policy?.account_type;
  if (
    candidate.status !== "active" ||
    typeof sessionId !== "string" ||
    !ACCOUNT_SESSION_PATTERN.test(sessionId) ||
    typeof profileId !== "string" ||
    profileId.length < 1 ||
    profileId.length > 320 ||
    (accountType !== "developer" && accountType !== "user")
  ) {
    return null;
  }
  return Object.freeze({ sessionId, profileId, accountType });
};

/**
 * A native presentation request arrives through the authenticated loopback
 * broker only after the server has revalidated the installed-device trust and
 * its delegated account session. Electron may nevertheless lose the renderer
 * cookie during an external OAuth handoff. Restore only that exact still-live
 * delegated session, and never replace a different active renderer identity.
 */
export const ensureDelegatedActiveDesktopAccount = async (input: {
  origin: string;
  delegatedAccountSessionId: string;
  readActiveAccount: () => Promise<ActiveDesktopAccount>;
  setCookie: (cookie: DesktopAccountSessionCookie) => Promise<void>;
  nowMs?: number;
}): Promise<ActiveDesktopAccount> => {
  if (!ACCOUNT_SESSION_PATTERN.test(input.delegatedAccountSessionId)) {
    throw new Error("native_delegated_account_session_invalid");
  }
  const current = await input.readActiveAccount().catch(() => null);
  if (current && current.sessionId !== input.delegatedAccountSessionId) {
    throw new Error("native_delegated_account_session_mismatch");
  }
  // Refresh even a currently readable cookie. A persisted Electron cookie can
  // be seconds from expiry while the delegated server session is still live;
  // validating and then returning it would make the presented panel regress
  // immediately after the broker receipt.
  await input.setCookie(Object.freeze({
    url: input.origin,
    name: "helix_session",
    value: input.delegatedAccountSessionId,
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    expirationDate: (input.nowMs ?? Date.now()) / 1_000 + 7 * 24 * 60 * 60,
  }));
  const restored = await input.readActiveAccount();
  if (restored.sessionId !== input.delegatedAccountSessionId) {
    throw new Error("native_delegated_account_session_restore_failed");
  }
  return restored;
};
