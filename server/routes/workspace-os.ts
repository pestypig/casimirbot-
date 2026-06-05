import { Router, type Request, type Response } from "express";
import { getHelixWorkspaceOsStatus } from "../services/workspace-os/workspace-os-status";

export const workspaceOsRouter = Router();

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
