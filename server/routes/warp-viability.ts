import { Router } from "express";
import type { Request, Response } from "express";
import { issueWarpViabilityCertificate } from "../../tools/warpViabilityCertificate";
import { verifyCertificateIntegrity } from "../../tools/verifyCertificate";
import type { WarpConfig } from "../../types/warpViability";

const router = Router();

router.post("/viability", async (req: Request, res: Response) => {
  try {
    const config = (req.body && typeof req.body === "object" ? req.body : {}) as WarpConfig;
    const certificate = await issueWarpViabilityCertificate(config);
    const payload = certificate.payload;
    const response = {
      status: payload.status,
      constraints: payload.constraints,
      snapshot: payload.snapshot,
      citations: payload.citations,
      config: payload.config,
      certificate,
      certificateHash: certificate.certificateHash,
      certificateId: certificate.header.id,
      integrityOk: verifyCertificateIntegrity(certificate),
    };
    res.json(response);
  } catch (err) {
    console.error("[warp-viability] evaluation failed:", err);
    const message = err instanceof Error ? err.message : "Viability evaluation failed";
    res.status(500).json({ error: "viability_failed", message });
  }
});

export const warpViabilityRouter = router;
export default router;
