import crypto from "node:crypto";
import { desktopMcpClientRef, HELIX_DESKTOP_MCP_ISSUER } from "../../auth/helix-desktop-mcp-identity";
import type { PairingDestination } from "./pairing-ledger-contract";

const opaqueIssuer = (issuer: string) => `issuer:${crypto.createHash("sha256").update(issuer).digest("hex")}`;
type Session = { session_id: string; profile: { profile_id: string } };

/** Inputs come from authenticated owner/device stores, never request assertions. */
export async function resolvePairingAccountIssuer(input: {
  destination: PairingDestination;
  profileId: string;
  deviceId: string;
  bindings: ReadonlyArray<{ issuer: string; status: string }>;
  delegatedAccountSessionId?: string | null;
  resolveSession: (id: string) => Promise<Session | null>;
}): Promise<string | null> {
  if (input.destination.profileId !== input.profileId) return null;
  const active = input.bindings.filter(binding => binding.status === "active");
  if (input.destination.issuer !== opaqueIssuer(HELIX_DESKTOP_MCP_ISSUER)) {
    return active.find(binding => opaqueIssuer(binding.issuer) === input.destination.issuer)?.issuer ?? null;
  }
  // The account link is an independent native prerequisite. Its HTTPS issuer
  // must not replace the native principal's issuer when checking run ownership.
  const sessionId = input.delegatedAccountSessionId;
  if (!active.length || !sessionId || input.destination.clientId !==
      desktopMcpClientRef(input.deviceId, input.profileId, sessionId)) return null;
  const delegated = await input.resolveSession(sessionId);
  return delegated?.session_id === sessionId && delegated.profile.profile_id === input.profileId
    ? HELIX_DESKTOP_MCP_ISSUER : null;
}
