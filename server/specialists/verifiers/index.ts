import type { z } from "zod";
import { VerifierSpec, VerifierInput, CheckResult } from "@shared/agi-specialists";

export type VerifierHandler = (
  input: z.infer<typeof VerifierInput>,
  ctx: Record<string, unknown>,
) => Promise<z.infer<typeof CheckResult>>;

type Verifier = z.infer<typeof VerifierSpec> & { handler: VerifierHandler };

const VERIFIERS = new Map<string, Verifier>();

export function registerVerifier(verifier: Verifier): void {
  VERIFIERS.set(verifier.name, verifier);
}

export function getVerifier(name: string): Verifier | undefined {
  return VERIFIERS.get(name);
}

export function listVerifiers(): Array<Pick<Verifier, "name" | "desc">> {
  const allow = (process.env.VERIFIER_ALLOWLIST ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const all = [...VERIFIERS.values()].map((verifier) => ({ name: verifier.name, desc: verifier.desc }));
  if (allow.length === 0) {
    return all;
  }
  const allowSet = new Set(allow);
  return all.filter((verifier) => allowSet.has(verifier.name));
}

export function __resetVerifierRegistry(): void {
  VERIFIERS.clear();
}
