import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { validateVoiceBundle } from "../server/services/voice-bundle/validator";

const dirs: string[] = [];
const hash = (s: string) => createHash("sha256").update(Buffer.from(s)).digest("hex");

const makeBundle = () => {
  const dir = mkdtempSync(join(tmpdir(), "voice-bundle-"));
  dirs.push(dir);
  return dir;
};

afterEach(() => {
  for (const d of dirs.splice(0, dirs.length)) rmSync(d, { recursive: true, force: true });
});

describe("validateVoiceBundle", () => {
  it("validates a complete bundle", () => {
    const dir = makeBundle();
    writeFileSync(join(dir, "model.bin"), "model-data");
    writeFileSync(join(dir, "sample.wav"), "sample-data");
    writeFileSync(join(dir, "manifest.json"), JSON.stringify({
      bundle_version: "voice_bundle/1",
      voice_profile_id: "dottie_default",
      display_name: "Dottie",
      created_at: "2026-02-23T00:00:00Z",
      files: [
        { path: "model.bin", sha256: hash("model-data"), bytes: 10 },
        { path: "sample.wav", sha256: hash("sample-data"), bytes: 11 },
      ],
    }));

    const result = validateVoiceBundle(dir);
    expect(result).toEqual({ ok: true, profileId: "dottie_default", filesValidated: 2 });
  });

  it("returns deterministic failure for checksum mismatch", () => {
    const dir = makeBundle();
    writeFileSync(join(dir, "model.bin"), "model-data");
    writeFileSync(join(dir, "manifest.json"), JSON.stringify({
      bundle_version: "voice_bundle/1",
      voice_profile_id: "dottie_default",
      display_name: "Dottie",
      created_at: "2026-02-23T00:00:00Z",
      files: [{ path: "model.bin", sha256: "bad", bytes: 10 }],
    }));

    const result = validateVoiceBundle(dir);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.code).toBe("checksum_mismatch");
  });
});
