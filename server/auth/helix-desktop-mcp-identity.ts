import crypto from "node:crypto";

// Native delegation is a distinct issuer, never an external OAuth token.
export const HELIX_DESKTOP_MCP_ISSUER = "urn:casimirbot:desktop-session";
export const desktopMcpClientRef = (deviceId: string, profileId: string, sessionId: string) =>
  `mcp_client:native_desktop:${crypto.createHash("sha256")
    .update(`${deviceId}\n${profileId}\n${sessionId}`).digest("hex")}`;
