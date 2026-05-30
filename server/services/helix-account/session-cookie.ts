import type { Response } from "express";

export const HELIX_SESSION_COOKIE = "helix_session";

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const equalsAt = trimmed.indexOf("=");
    const key = equalsAt >= 0 ? trimmed.slice(0, equalsAt) : trimmed;
    const value = equalsAt >= 0 ? trimmed.slice(equalsAt + 1) : "";
    if (!key) continue;
    cookies[decodeURIComponent(key)] = decodeURIComponent(value);
  }
  return cookies;
}

export function readCookie(cookieHeader: string | undefined, name: string): string | null {
  return parseCookies(cookieHeader)[name] ?? null;
}

export function readHelixSessionCookie(cookieHeader: string | undefined): string | null {
  return readCookie(cookieHeader, HELIX_SESSION_COOKIE);
}

export function setHelixSessionCookie(res: Response, sessionId: string): void {
  res.cookie(HELIX_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

export function clearHelixSessionCookie(res: Response): void {
  res.clearCookie(HELIX_SESSION_COOKIE, { path: "/" });
}
