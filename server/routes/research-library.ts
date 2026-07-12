import { Router, type Request, type Response } from "express";
import { getAccountSessionById } from "../services/helix-account/account-session-store";
import { readHelixSessionCookie } from "../services/helix-account/session-cookie";
import {
  deleteResearchLibraryDocument,
  listResearchLibraryDocuments,
  readResearchLibraryDocument,
} from "../services/helix-account/research-library-store";

export const researchLibraryRouter = Router();

const profileIdForRequest = async (req: Request): Promise<string | null> => {
  const session = await getAccountSessionById(readHelixSessionCookie(req.headers.cookie));
  return session?.profile.profile_id ?? null;
};

const requireProfile = async (req: Request, res: Response): Promise<string | null> => {
  const profileId = await profileIdForRequest(req);
  if (profileId) return profileId;
  res.status(401).json({
    ok: false,
    error: "profile_session_required",
    message: "Sign in to save and reopen private research extractions.",
    private: true,
    raw_content_included: false,
  });
  return null;
};

researchLibraryRouter.get("/", async (req, res) => {
  const profileId = await requireProfile(req, res);
  if (!profileId) return;
  res.json(await listResearchLibraryDocuments(profileId));
});

researchLibraryRouter.get("/:documentId", async (req, res) => {
  const profileId = await requireProfile(req, res);
  if (!profileId) return;
  const document = await readResearchLibraryDocument(profileId, req.params.documentId);
  if (!document) {
    return res.status(404).json({ ok: false, error: "research_library_document_not_found", raw_content_included: false });
  }
  return res.json({ ok: true, document, private: true, raw_content_included: true });
});

researchLibraryRouter.delete("/:documentId", async (req, res) => {
  const profileId = await requireProfile(req, res);
  if (!profileId) return;
  const deleted = await deleteResearchLibraryDocument(profileId, req.params.documentId);
  return res.status(deleted ? 200 : 404).json({
    ok: deleted,
    document_id: req.params.documentId,
    error: deleted ? null : "research_library_document_not_found",
    private: true,
    raw_content_included: false,
  });
});

