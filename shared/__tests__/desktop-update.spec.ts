import { describe, expect, it } from "vitest";
import {
  DESKTOP_UPDATE_STATE_SCHEMA_VERSION,
  parseDesktopUpdateState,
} from "../desktop-update";

const validState = {
  schemaVersion: DESKTOP_UPDATE_STATE_SCHEMA_VERSION,
  phase: "available",
  currentVersion: "0.1.0",
  availableVersion: "0.1.1",
  progressPercent: null,
  errorCode: null,
  canCheck: true,
  canDownload: true,
  canInstall: false,
} as const;

describe("desktop update state", () => {
  it("accepts the narrow native update projection", () => {
    expect(parseDesktopUpdateState(validState)).toEqual(validState);
  });

  it("rejects malformed phases, progress, and missing booleans", () => {
    expect(parseDesktopUpdateState({ ...validState, phase: "executing-tools" })).toBeNull();
    expect(parseDesktopUpdateState({ ...validState, progressPercent: 101 })).toBeNull();
    expect(parseDesktopUpdateState({ ...validState, canInstall: undefined })).toBeNull();
  });
});
