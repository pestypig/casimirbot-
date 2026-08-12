import type { Response } from "express";
import { CASIMIR_DESKTOP_HOST_ENV } from "../../security/desktop-session";

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

const enabledFlag = (value: string | undefined): boolean => {
  const normalized = value?.trim().toLowerCase();
  return normalized === "1" || normalized === "true";
};

export function shouldUseSecureHelixSessionCookie(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const production = env.NODE_ENV?.trim().toLowerCase() === "production";
  // The packaged host is bound to loopback and protected by the native
  // per-launch desktop session header. Secure cookies cannot be retained over
  // that intentional HTTP loopback lane. All other production lanes stay
  // HTTPS-only.
  return production && !enabledFlag(env[CASIMIR_DESKTOP_HOST_ENV]);
}

export function setHelixSessionCookie(
  res: Response,
  sessionId: string,
  options?: { maxAgeMs?: number },
): void {
  res.cookie(HELIX_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureHelixSessionCookie(),
    path: "/",
    maxAge: options?.maxAgeMs ?? 1000 * 60 * 60 * 24 * 7,
  });
}

export function clearHelixSessionCookie(res: Response): void {
  res.clearCookie(HELIX_SESSION_COOKIE, { path: "/" });
}
