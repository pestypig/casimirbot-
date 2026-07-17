import { Router, type Request, type Response } from "express";

import { getAccountCapabilityPolicy } from "../services/helix-account/account-session-store";
import { readHelixSessionCookie } from "../services/helix-account/session-cookie";
import { buildHelixRuntimeParityFingerprint } from "../services/helix-ask/runtime-parity-fingerprint";

export const runtimeParityRouter = Router();

runtimeParityRouter.get("/runtime-parity/fingerprint", async (req: Request, res: Response) => {
  const accountPolicy = await getAccountCapabilityPolicy(
    readHelixSessionCookie(req.headers.cookie),
  );
  res.setHeader("Cache-Control", "no-store");
  res.json(buildHelixRuntimeParityFingerprint({ accountPolicy }));
});
