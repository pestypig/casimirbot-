import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { PersonaAclRecord, PersonaGrant } from "./types";

const ENABLE_AUTH = process.env.ENABLE_AUTH === "1";
const JWT_SECRET = process.env.JWT_SECRET || "changeme";

export interface JwtClaims extends jwt.JwtPayload {
  sub: string;
  role?: string;
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

export function jwtMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!ENABLE_AUTH) {
    return next();
  }
  const header = req.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  try {
    const claims = jwt.verify(token, JWT_SECRET) as JwtClaims;
    req.auth = claims;
    next();
  } catch {
    res.status(401).json({ error: "unauthorized" });
  }
}
