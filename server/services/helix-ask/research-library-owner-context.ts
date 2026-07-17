import type { Request } from "express";

import { getAccountSessionStatus } from "../helix-account/account-session-store";
import { readHelixSessionCookie } from "../helix-account/session-cookie";

/**
 * Replaces any untrusted caller value with profile ownership resolved from the
 * authenticated Helix session. No session means no Research Library owner
 * context; downstream profile-scoped capabilities then fail closed.
 */
export const attachResearchLibraryOwnerContext = async (
  req: Pick<Request, "headers">,
  body: Record<string, unknown>,
): Promise<void> => {
  delete body.research_library_owner_id;
  try {
    const status = await getAccountSessionStatus(readHelixSessionCookie(req.headers.cookie));
    const profileId = status.session?.profile.profile_id;
    if (profileId) body.research_library_owner_id = profileId;
  } catch {
    // Research extraction remains usable when profile persistence is unavailable.
  }
};
