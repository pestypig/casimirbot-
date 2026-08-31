import { describe, expect, it } from "vitest";
import { parseActiveDesktopAccount } from
  "../apps/desktop/src/active-account-session";

const activePayload = {
  session: {
    session_id: "account_session:developer-owner",
    profile: { profile_id: "user:owner-profile" },
    status: "active",
    account_policy: { account_type: "developer" },
  },
};

describe("desktop active account-session parsing", () => {
  it("accepts the canonical nested account-session profile shape", () => {
    expect(parseActiveDesktopAccount(activePayload)).toEqual({
      sessionId: "account_session:developer-owner",
      profileId: "user:owner-profile",
      accountType: "developer",
    });
  });

  it("rejects the obsolete direct profile_id projection", () => {
    expect(parseActiveDesktopAccount({
      session: {
        ...activePayload.session,
        profile: undefined,
        profile_id: "user:owner-profile",
      },
    })).toBeNull();
  });

  it("rejects inactive or malformed session authority", () => {
    expect(parseActiveDesktopAccount({
      session: { ...activePayload.session, status: "signed_out" },
    })).toBeNull();
    expect(parseActiveDesktopAccount({
      session: { ...activePayload.session, session_id: "invalid" },
    })).toBeNull();
    expect(parseActiveDesktopAccount({
      session: {
        ...activePayload.session,
        account_policy: { account_type: "guest" },
      },
    })).toBeNull();
  });
});
