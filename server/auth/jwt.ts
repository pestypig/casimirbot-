import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { PersonaAclRecord, PersonaGrant } from "./types";

const ENABLE_AUTH = process.env.ENABLE_AUTH === "1";
const JWT_SECRET = process.env.JWT_SECRET || "changeme";

export interface JwtClaims extends jwt.JwtPayload {
  sub: string;
  role?: string;
  tenantId?: string;
  tenant_id?: string;
  customerId?: string;
  customer_id?: string;
  orgId?: string;
  org_id?: string;
  personaAcl?: PersonaGrant[];
  persona_acl?: PersonaAclRecord;
  personas?: Array<string | (Partial<PersonaGrant> & { personaId?: string })>;
  personaIds?: string[];
  persona_ids?: string[];
  personaScopes?: PersonaAclRecord;
  persona_scopes?: PersonaAclRecord;
  personaId?: string;
  defaultPersona?: string;
}

const parseJwt = (req: Request): JwtClaims | null => {
  const header = req.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return null;
  }
  try {
    return jwt.verify(token, JWT_SECRET) as JwtClaims;
  } catch {
    return null;
  }
};

export function jwtMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!ENABLE_AUTH) {
    return next();
  }
  const claims = parseJwt(req);
  if (!claims) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  req.auth = claims;
  next();
}

export function requireJwtMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.auth) {
    return next();
  }
  const claims = parseJwt(req);
  if (!claims) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  req.auth = claims;
  next();
}
