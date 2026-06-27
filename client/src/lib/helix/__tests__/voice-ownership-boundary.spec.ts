import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (repoPath: string): string =>
  fs.readFileSync(path.resolve(process.cwd(), repoPath), "utf8");

describe("Helix Ask voice ownership boundaries", () => {
  it("keeps pure transcript helpers in the non-React voice transcript module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const transcript = read("client/src/lib/helix/voice/voice-transcript.ts");

    expect(pill).toContain('from "@/lib/helix/voice/voice-transcript"');
    expect(pill).not.toMatch(/export function mergeVoiceTranscriptDraft\s*\(/);
    expect(pill).not.toMatch(/export function resolveVoiceDispatchTranscriptFromDraft\s*\(/);
    expect(transcript).toMatch(/export function mergeVoiceTranscriptDraft\s*\(/);
    expect(transcript).toMatch(/export function resolveVoiceDispatchTranscriptFromDraft\s*\(/);
    expect(transcript).not.toMatch(/from ["']react["']/);
    expect(transcript).not.toContain("@/store/");
    expect(transcript).not.toContain("@/components/helix/HelixAskPill");
  });

  it("keeps voice authority evaluators in the non-React voice authority module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const harness = read("client/src/lib/helix/turn-loop-harness.ts");
    const authority = read("client/src/lib/helix/voice/voice-turn-authority.ts");

    expect(pill).toContain('from "@/lib/helix/voice/voice-turn-authority"');
    expect(harness).toContain('from "@/lib/helix/voice/voice-turn-authority"');
    expect(harness).not.toContain("@/components/helix/HelixAskPill");
    expect(pill).not.toMatch(/export function evaluateVoiceTurnSealGate\s*\(/);
    expect(pill).not.toMatch(/export function evaluateVoiceReasoningResponseAuthority\s*\(/);
    expect(authority).toMatch(/export function evaluateVoiceTurnSealGate\s*\(/);
    expect(authority).toMatch(/export function evaluateVoiceReasoningResponseAuthority\s*\(/);
    expect(authority).not.toMatch(/from ["']react["']/);
    expect(authority).not.toContain("@/store/");
    expect(authority).not.toContain("@/components/helix/HelixAskPill");
  });
});
