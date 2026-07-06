import { Router, type Request, type Response } from "express";
import {
  deleteAccountProfile,
  getAccountSessionStatus,
  requestPasswordAccountEmailVerification,
  requestPasswordAccountPasswordReset,
  resetPasswordAccountPassword,
  signInPasswordAccountSession,
  signInLocalAccountSession,
  signInLocalPasswordAccountSession,
  signUpPasswordAccountSession,
  signOutAccountSession,
  verifyPasswordAccountEmail,
} from "../services/helix-account/account-session-store";
import {
  clearHelixSessionCookie,
  readHelixSessionCookie,
  setHelixSessionCookie,
} from "../services/helix-account/session-cookie";
import {
  createProfileIngressToken,
  revokeProfileIngressToken,
} from "../services/helix-account/profile-ingress-store";
import {
  deleteProfileStorageSnapshot,
  readProfileStorageSnapshot,
  writeProfileStorageSnapshot,
} from "../services/helix-account/profile-storage-store";

export const accountSessionRouter = Router();

accountSessionRouter.get("/session", async (req: Request, res: Response) => {
  res.json(await getAccountSessionStatus(readHelixSessionCookie(req.headers.cookie)));
});

accountSessionRouter.post("/session/sign-in", async (req: Request, res: Response) => {
  const receipt = await signInLocalAccountSession({
    profile_id: typeof req.body?.profile_id === "string" ? req.body.profile_id : null,
    display_name: typeof req.body?.display_name === "string" ? req.body.display_name : null,
    email: typeof req.body?.email === "string" ? req.body.email : null,
    account_type: typeof req.body?.account_type === "string" ? req.body.account_type : null,
  });
  if (receipt.session) {
    setHelixSessionCookie(res, receipt.session.session_id);
  }
  res.status(receipt.ok ? 200 : 400).json(receipt);
});

accountSessionRouter.post("/session/password-sign-in", async (req: Request, res: Response) => {
  const receipt = await signInLocalPasswordAccountSession({
    username: typeof req.body?.username === "string" ? req.body.username : null,
    password: typeof req.body?.password === "string" ? req.body.password : null,
  });
  if (receipt.session) {
    setHelixSessionCookie(res, receipt.session.session_id);
  }
  res.status(receipt.ok ? 200 : 401).json(receipt);
});

accountSessionRouter.post("/session/sign-up", async (req: Request, res: Response) => {
  const receipt = await signUpPasswordAccountSession({
    email: typeof req.body?.email === "string" ? req.body.email : null,
    password: typeof req.body?.password === "string" ? req.body.password : null,
    display_name: typeof req.body?.display_name === "string" ? req.body.display_name : null,
  });
  if (receipt.session) {
    setHelixSessionCookie(res, receipt.session.session_id);
  }
  res.status(receipt.ok ? 200 : 400).json(receipt);
});

accountSessionRouter.post("/session/account-sign-in", async (req: Request, res: Response) => {
  const receipt = await signInPasswordAccountSession({
    email: typeof req.body?.email === "string" ? req.body.email : null,
    password: typeof req.body?.password === "string" ? req.body.password : null,
  });
  if (receipt.session) {
    setHelixSessionCookie(res, receipt.session.session_id);
  }
  res.status(receipt.ok ? 200 : 401).json(receipt);
});

accountSessionRouter.post("/session/email-verification/request", async (req: Request, res: Response) => {
  const receipt = await requestPasswordAccountEmailVerification(readHelixSessionCookie(req.headers.cookie));
  res.status(receipt.ok ? 200 : 401).json(receipt);
});

accountSessionRouter.post("/session/email-verification/confirm", async (req: Request, res: Response) => {
  const receipt = await verifyPasswordAccountEmail({
    token_value: typeof req.body?.token_value === "string" ? req.body.token_value : null,
  });
  res.status(receipt.ok ? 200 : 400).json(receipt);
});

accountSessionRouter.post("/session/password-reset/request", async (req: Request, res: Response) => {
  const receipt = await requestPasswordAccountPasswordReset({
    email: typeof req.body?.email === "string" ? req.body.email : null,
    requester_key: typeof req.ip === "string" ? req.ip : req.socket.remoteAddress ?? null,
  });
  res.status(200).json(receipt);
});

accountSessionRouter.post("/session/password-reset/confirm", async (req: Request, res: Response) => {
  const receipt = await resetPasswordAccountPassword({
    token_value: typeof req.body?.token_value === "string" ? req.body.token_value : null,
    password: typeof req.body?.password === "string" ? req.body.password : null,
  });
  res.status(receipt.ok ? 200 : 400).json(receipt);
});

accountSessionRouter.post("/session/sign-out", async (req: Request, res: Response) => {
  clearHelixSessionCookie(res);
  res.json(await signOutAccountSession(readHelixSessionCookie(req.headers.cookie)));
});

accountSessionRouter.delete("/profile", async (req: Request, res: Response) => {
  const receipt = await deleteAccountProfile(readHelixSessionCookie(req.headers.cookie));
  if (receipt.ok) clearHelixSessionCookie(res);
  res.status(receipt.ok ? 200 : 401).json(receipt);
});

accountSessionRouter.get("/profile-storage/snapshot", async (req: Request, res: Response) => {
  const status = await getAccountSessionStatus(readHelixSessionCookie(req.headers.cookie));
  const profileId = status.session?.profile.profile_id;
  if (!profileId) {
    return res.status(401).json({
      ok: false,
      error: "profile_session_required",
      message: "A profile session is required before profile storage can be loaded.",
      raw_profile_content_included: false,
    });
  }
  return res.status(200).json(await readProfileStorageSnapshot(profileId, {
    quota_bytes: status.account_policy.quotas.profile_storage_bytes,
  }));
});

accountSessionRouter.get("/profile-storage/export", async (req: Request, res: Response) => {
  const status = await getAccountSessionStatus(readHelixSessionCookie(req.headers.cookie));
  const profileId = status.session?.profile.profile_id;
  if (!profileId) {
    return res.status(401).json({
      ok: false,
      error: "profile_session_required",
      message: "A profile session is required before profile storage can be exported.",
      raw_profile_content_included: false,
    });
  }
  const snapshot = await readProfileStorageSnapshot(profileId, {
    quota_bytes: status.account_policy.quotas.profile_storage_bytes,
  });
  return res.status(200).json({
    ok: true,
    exported_at: new Date().toISOString(),
    snapshot,
    raw_profile_content_included: true,
  });
});

accountSessionRouter.post("/profile-storage/snapshot", async (req: Request, res: Response) => {
  const status = await getAccountSessionStatus(readHelixSessionCookie(req.headers.cookie));
  const profileId = status.session?.profile.profile_id;
  if (!profileId) {
    return res.status(401).json({
      ok: false,
      error: "profile_session_required",
      message: "A profile session is required before profile storage can be saved.",
      raw_profile_content_included: false,
    });
  }
  const receipt = await writeProfileStorageSnapshot({
    profile_id: profileId,
    quota_bytes: status.account_policy.quotas.profile_storage_bytes,
    snapshot: {
      entries: Array.isArray(req.body?.entries) ? req.body.entries : [],
      artifacts: Array.isArray(req.body?.artifacts) ? req.body.artifacts : [],
    },
  });
  return res.status(receipt.ok ? 200 : 413).json(receipt);
});

accountSessionRouter.delete("/profile-storage/snapshot", async (req: Request, res: Response) => {
  const status = await getAccountSessionStatus(readHelixSessionCookie(req.headers.cookie));
  const profileId = status.session?.profile.profile_id;
  if (!profileId) {
    return res.status(401).json({
      ok: false,
      error: "profile_session_required",
      message: "A profile session is required before profile storage can be deleted.",
      raw_profile_content_included: false,
    });
  }
  return res.status(200).json(await deleteProfileStorageSnapshot(profileId));
});

accountSessionRouter.post("/profile-ingress/token", async (req: Request, res: Response) => {
  const status = await getAccountSessionStatus(readHelixSessionCookie(req.headers.cookie));
  const profileId =
    typeof req.body?.profile_id === "string"
      ? req.body.profile_id
      : status.session?.profile.profile_id;
  const receipt = createProfileIngressToken({
    profile_id: profileId ?? "",
    label: typeof req.body?.label === "string" ? req.body.label : null,
    scopes: Array.isArray(req.body?.scopes) ? req.body.scopes : null,
    ttl_ms: typeof req.body?.ttl_ms === "number" ? req.body.ttl_ms : null,
  });
  res.status(receipt.ok ? 200 : 400).json(receipt);
});

accountSessionRouter.post("/profile-ingress/:tokenId/revoke", (req: Request, res: Response) => {
  const receipt = revokeProfileIngressToken(req.params.tokenId);
  res.status(receipt.ok ? 200 : 404).json(receipt);
});
