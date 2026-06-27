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

});
