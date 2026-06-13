import { Router } from "express";
import {
  getAccountSessionStatus,
  signInLocalAccountSession,
  signInLocalPasswordAccountSession,
  signOutAccountSession,
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
  readProfileStorageSnapshot,
  writeProfileStorageSnapshot,
} from "../services/helix-account/profile-storage-store";

export const accountSessionRouter = Router();

accountSessionRouter.get("/session", (req, res) => {
  res.json(getAccountSessionStatus(readHelixSessionCookie(req.headers.cookie)));
});

accountSessionRouter.post("/session/sign-in", (req, res) => {
  const receipt = signInLocalAccountSession({
    profile_id: typeof req.body?.profile_id === "string" ? req.body.profile_id : null,
    display_name: typeof req.body?.display_name === "string" ? req.body.display_name : null,
    email: typeof req.body?.email === "string" ? req.body.email : null,
  });
  if (receipt.session) {
    setHelixSessionCookie(res, receipt.session.session_id);
  }
  res.status(receipt.ok ? 200 : 400).json(receipt);
});

accountSessionRouter.post("/session/password-sign-in", (req, res) => {
  const receipt = signInLocalPasswordAccountSession({
    username: typeof req.body?.username === "string" ? req.body.username : null,
    password: typeof req.body?.password === "string" ? req.body.password : null,
  });
  if (receipt.session) {
    setHelixSessionCookie(res, receipt.session.session_id);
  }
  res.status(receipt.ok ? 200 : 401).json(receipt);
});

accountSessionRouter.post("/session/sign-out", (req, res) => {
  clearHelixSessionCookie(res);
  res.json(signOutAccountSession(readHelixSessionCookie(req.headers.cookie)));
});

accountSessionRouter.get("/profile-storage/snapshot", (req, res) => {
  const status = getAccountSessionStatus(readHelixSessionCookie(req.headers.cookie));
  const profileId = status.session?.profile.profile_id;
  if (!profileId) {
    return res.status(401).json({
      ok: false,
      error: "profile_session_required",
      message: "A profile session is required before profile storage can be loaded.",
      raw_profile_content_included: false,
    });
  }
  return res.status(200).json(readProfileStorageSnapshot(profileId));
});

accountSessionRouter.post("/profile-storage/snapshot", (req, res) => {
  const status = getAccountSessionStatus(readHelixSessionCookie(req.headers.cookie));
  const profileId = status.session?.profile.profile_id;
  if (!profileId) {
    return res.status(401).json({
      ok: false,
      error: "profile_session_required",
      message: "A profile session is required before profile storage can be saved.",
      raw_profile_content_included: false,
    });
  }
  const receipt = writeProfileStorageSnapshot({
    profile_id: profileId,
    snapshot: {
      entries: Array.isArray(req.body?.entries) ? req.body.entries : [],
      artifacts: Array.isArray(req.body?.artifacts) ? req.body.artifacts : [],
    },
  });
  return res.status(receipt.ok ? 200 : 413).json(receipt);
});

accountSessionRouter.post("/profile-ingress/token", (req, res) => {
  const status = getAccountSessionStatus(readHelixSessionCookie(req.headers.cookie));
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

accountSessionRouter.post("/profile-ingress/:tokenId/revoke", (req, res) => {
  const receipt = revokeProfileIngressToken(req.params.tokenId);
  res.status(receipt.ok ? 200 : 404).json(receipt);
});
