import { Router, json, type Request, type Response } from "express";
import { getHelixWorkspaceOsStatus } from "../services/workspace-os/workspace-os-status";
import { getHelixWorkspaceStorageStatus } from "../services/workspace-os/workspace-storage-status";
import { getHelixWorkstationTaskManagerSnapshot } from "../services/workspace-os/workstation-task-manager";
import {
  getHelixWorkstationCommandReliabilityStatus,
  getLatestHelixWorkstationBrowserPerformanceSample,
  recordHelixWorkstationBrowserPerformanceSample,
  recordHelixWorkstationCommandReceipt,
} from "../services/workspace-os/browser-performance-status";
import { getAccountSessionStatus } from "../services/helix-account/account-session-store";
import { readHelixSessionCookie } from "../services/helix-account/session-cookie";

export const workspaceOsRouter = Router();
workspaceOsRouter.use(json({ limit: "32kb" }));

const queryString = (value: unknown): string | null => {
  if (Array.isArray(value)) return queryString(value[0]);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
};

workspaceOsRouter.get("/status", async (req: Request, res: Response) => {
  const status = await getHelixWorkspaceOsStatus({
    thread_id: queryString(req.query.thread_id),
    room_id: queryString(req.query.room_id),
  });
  return res.status(200).json(status);
});

workspaceOsRouter.get("/task-manager", async (req: Request, res: Response) => {
  const status = await getHelixWorkstationTaskManagerSnapshot({
    thread_id: queryString(req.query.thread_id),
    room_id: queryString(req.query.room_id),
  });
  return res.status(200).json(status);
});

workspaceOsRouter.post("/browser-performance/sample", async (req: Request, res: Response) => {
  const sample = recordHelixWorkstationBrowserPerformanceSample(req.body);
  return res.status(202).json({
    accepted: true,
    schema_version: sample.schema_version,
    sampled_at: sample.sampled_at,
    authority: sample.authority,
  });
});

workspaceOsRouter.get("/browser-performance/status", async (_req: Request, res: Response) => {
  const sample = getLatestHelixWorkstationBrowserPerformanceSample();
  return res.status(200).json({
    schema_version: "helix.workstation_browser_performance.status.v1",
    generated_at: new Date().toISOString(),
    sample,
    sample_included: Boolean(sample),
  });
});

workspaceOsRouter.post("/command-reliability/receipt", async (req: Request, res: Response) => {
  const receipt = recordHelixWorkstationCommandReceipt(req.body);
  return res.status(202).json({
    accepted: true,
    schema_version: receipt.schema_version,
    receipt_id: receipt.receipt_id,
    authority: receipt.authority,
  });
});

workspaceOsRouter.get("/command-reliability/status", async (_req: Request, res: Response) => {
  return res.status(200).json(getHelixWorkstationCommandReliabilityStatus());
});

workspaceOsRouter.get("/storage/status", async (req: Request, res: Response) => {
  const accountStatus = getAccountSessionStatus(readHelixSessionCookie(req.headers.cookie));
  const status = await getHelixWorkspaceStorageStatus({
    thread_id: queryString(req.query.thread_id),
    room_id: queryString(req.query.room_id),
    profile_id: accountStatus.session?.profile.profile_id ?? null,
    profile_quota_bytes: accountStatus.account_policy.quotas.profile_storage_bytes,
  });
  return res.status(200).json(status);
});
