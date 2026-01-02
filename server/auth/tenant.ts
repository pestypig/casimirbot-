import type { Request } from "express";
import type { JwtClaims } from "./jwt";

const TRUTHY = new Set(["1", "true", "yes", "on"]);
const DEFAULT_TENANT_HEADERS = ["x-tenant-id", "x-customer-id", "x-org-id"];
const TENANT_CLAIM_KEYS = [
  "tenantId",
  "tenant_id",
  "customerId",
  "customer_id",
  "orgId",
  "org_id",
] as const;

const isTruthy = (value?: string): boolean => {
  if (!value) return false;
  return TRUTHY.has(value.toLowerCase());
};

const normalizeTenantId = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const resolveTenantHeaders = (): string[] => {
  const raw = process.env.AGI_TENANT_HEADERS;
  if (!raw) return DEFAULT_TENANT_HEADERS;
  const parsed = raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
  return parsed.length > 0 ? parsed : DEFAULT_TENANT_HEADERS;
};

const resolveTenantFromClaims = (claims?: JwtClaims): string | undefined => {
  if (!claims) return undefined;
  for (const key of TENANT_CLAIM_KEYS) {
    const value = (claims as Record<string, unknown>)[key];
    if (typeof value === "string") {
      const normalized = normalizeTenantId(value);
      if (normalized) return normalized;
    }
  }
  return undefined;
};

const resolveTenantFromHeaders = (req: Request): string | undefined => {
  const headerNames = resolveTenantHeaders();
  for (const header of headerNames) {
    const value = req.get(header);
    const normalized = normalizeTenantId(value ?? undefined);
    if (normalized) return normalized;
  }
  return undefined;
};

export const shouldRequireTenant = (): boolean => {
  if (process.env.AGI_TENANT_REQUIRED !== undefined) {
    return isTruthy(process.env.AGI_TENANT_REQUIRED);
  }
  return process.env.ENABLE_AUTH === "1" || process.env.ENABLE_AGI_AUTH === "1";
};

export type TenantGuardResult =
  | { ok: true; tenantId?: string; source?: "auth" | "header" }
  | { ok: false; status: number; error: string };

export const guardTenant = (
  req: Request,
  options?: { require?: boolean },
): TenantGuardResult => {
  const authTenant = resolveTenantFromClaims(req.auth);
  const headerTenant = resolveTenantFromHeaders(req);
  if (authTenant && headerTenant && authTenant !== headerTenant) {
    return { ok: false, status: 403, error: "tenant-mismatch" };
  }
  const tenantId = authTenant ?? headerTenant;
  const requireTenant = options?.require ?? shouldRequireTenant();
  if (requireTenant && !tenantId) {
    return { ok: false, status: 401, error: "tenant-required" };
  }
  req.tenantId = tenantId;
  return {
    ok: true,
    tenantId,
    source: authTenant ? "auth" : headerTenant ? "header" : undefined,
  };
};
