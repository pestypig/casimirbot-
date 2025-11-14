export const PERSONA_SCOPES = ["persona:read", "persona:write", "memory:read", "memory:write", "plan"] as const;

export type PersonaScope = (typeof PERSONA_SCOPES)[number];

export type PersonaGrant = {
  id: string;
  scopes?: PersonaScope[];
};

export type PersonaAclRecord = Record<string, PersonaScope[] | string[] | undefined>;
