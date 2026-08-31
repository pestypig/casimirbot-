export type ActiveDesktopAccount = Readonly<{
  sessionId: string;
  profileId: string;
  accountType: "developer" | "user";
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
