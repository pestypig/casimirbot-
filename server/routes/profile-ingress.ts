import { Router } from "express";
import { ingestProfileIngressEvent } from "../services/helix-account/profile-ingress-store";

export const profileIngressRouter = Router();

profileIngressRouter.post("/:profileId/events", (req, res) => {
  const receipt = ingestProfileIngressEvent({
    profile_id: req.params.profileId,
    authorization: req.headers.authorization,
    payload: req.body?.payload && typeof req.body.payload === "object" ? req.body.payload : req.body,
    source_id: typeof req.body?.source_id === "string" ? req.body.source_id : null,
    thread_id: typeof req.body?.thread_id === "string" ? req.body.thread_id : null,
  });
  res.status(receipt.ok ? 200 : 401).json(receipt);
});
