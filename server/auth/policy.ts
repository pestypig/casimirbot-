import type { JwtClaims } from "./jwt";
import { PERSONA_SCOPES, type PersonaScope } from "./types";

const SCOPE_SET = new Set<PersonaScope>(PERSONA_SCOPES);
const TRUTHY = new Set(["1", "true", "yes", "on"]);

const isTruthy = (value?: string): boolean => {
  if (!value) return false;
  return TRUTHY.has(value.toLowerCase());
};

const cloneDefaultScopes = (): PersonaScope[] => [...PERSONA_SCOPES];

function normalizeScopes(raw?: unknown): PersonaScope[] {
  if (raw === undefined || raw === null) {
    return cloneDefaultScopes();
  }
  const values = Array.isArray(raw) ? raw : [raw];
  const scopes: PersonaScope[] = [];
  for (const value of values) {
    if (typeof value === "string" && SCOPE_SET.has(value as PersonaScope)) {
      scopes.push(value as PersonaScope);
    }
  }
  return scopes.length > 0 ? scopes : cloneDefaultScopes();
}

type ScopeSet = Set<PersonaScope>;

const aggregateGrants = (claims?: JwtClaims): Map<string, ScopeSet> => {
  const map = new Map<string, ScopeSet>();
  if (!claims) {
    return map;
  }

  const addGrant = (id: unknown, scopes?: PersonaScope[]) => {
    if (typeof id !== "string") return;
    const trimmed = id.trim();
    if (!trimmed) return;
    const normalized = scopes && scopes.length > 0 ? scopes : cloneDefaultScopes();
    const bucket = map.get(trimmed) ?? new Set<PersonaScope>();
    for (const scope of normalized) {
      bucket.add(scope);
    }
    map.set(trimmed, bucket);
  };

  const arraySources: unknown[] = [claims.personaAcl, claims.personas, claims.personaIds, claims.persona_ids];
  for (const source of arraySources) {
    if (!Array.isArray(source)) continue;
    for (const entry of source) {
      if (typeof entry === "string") {
        addGrant(entry);
      } else if (entry && typeof entry === "object") {
        const candidate = entry as { id?: unknown; personaId?: unknown; scopes?: unknown };
        const id = typeof candidate.id === "string" ? candidate.id : typeof candidate.personaId === "string" ? candidate.personaId : undefined;
        if (id) {
          addGrant(id, normalizeScopes(candidate.scopes));
        }
      }
    }
  }

  const recordSources = [claims.persona_acl, claims.personaScopes, claims.persona_scopes];
  for (const source of recordSources) {
    if (!source || typeof source !== "object" || Array.isArray(source)) continue;
    for (const [id, rawValue] of Object.entries(source as Record<string, unknown>)) {
      if (!id) continue;
      if (rawValue && typeof rawValue === "object" && !Array.isArray(rawValue) && "scopes" in (rawValue as Record<string, unknown>)) {
        addGrant(id, normalizeScopes((rawValue as Record<string, unknown>).scopes));
      } else {
        addGrant(id, normalizeScopes(rawValue));
      }
    }
  }

  const singleCandidates: Array<unknown> = [claims.personaId, claims.defaultPersona, claims.sub];
  for (const candidate of singleCandidates) {
    if (typeof candidate === "string") {
      addGrant(candidate);
    }
  }

  return map;
};

const isAuthEnabled = (): boolean => isTruthy(process.env.ENABLE_AUTH);
const allowAdminBypass = (): boolean => isTruthy(process.env.ALLOW_ADMIN);

const hasAdminRole = (claims?: JwtClaims): boolean => claims?.role === "admin";

const shouldEnforceAcl = (): boolean => isAuthEnabled() && !allowAdminBypass();

const shouldRestrictRequest = (claims?: JwtClaims): boolean => shouldEnforceAcl() && !hasAdminRole(claims);

const allowedPersonas = (claims: JwtClaims | undefined, scope: PersonaScope): Set<string> => {
  const allowed = new Set<string>();
  if (!claims) {
    return allowed;
  }
  const grants = aggregateGrants(claims);
  for (const [id, scopes] of grants.entries()) {
    if (scopes.has(scope)) {
      allowed.add(id);
    }
  }
  return allowed;
};

const canAccessPersona = (claims: JwtClaims | undefined, personaId: string, scope: PersonaScope): boolean => {
  if (!shouldRestrictRequest(claims)) {
    return true;
  }
  if (!claims) {
    return false;
  }
  const target = personaId?.trim();
  if (!target) {
    return false;
  }
  const allowed = allowedPersonas(claims, scope);
  return allowed.has(target);
};

export const personaPolicy = {
  scopes: PERSONA_SCOPES,
  isAuthEnabled,
  allowAdminBypass,
  hasAdminRole,
  shouldEnforceAcl,
  shouldRestrictRequest,
  allowedPersonas,
  canAccess: canAccessPersona,
};

export type { PersonaScope };
