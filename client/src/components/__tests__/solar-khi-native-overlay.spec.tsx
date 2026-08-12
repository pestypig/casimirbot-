// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SolarKhiNativeOverlay } from "../SolarKhiNativeOverlay";

describe("SolarKhiNativeOverlay", () => {
  it("exposes native-frame ingest, reconstruction choice, and the cross-scale hierarchy", () => {
    render(<SolarKhiNativeOverlay />);

    expect(screen.getByText("DKIST FastCam Native KHI Overlay")).toBeTruthy();
    expect(screen.getByLabelText("Observation manifest")).toBeTruthy();
    expect(screen.getByLabelText("Native reconstruction frame")).toBeTruthy();
    expect(screen.getByLabelText("Solar spatial scale")).toBeTruthy();
    expect(screen.getByText(/without the 224-pixel coherence-grid cap/i)).toBeTruthy();
    expect(screen.getByRole("option", { name: "MFBD" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Speckle" })).toBeTruthy();
    expect(screen.getByText(/Full solar disk/)).toBeTruthy();
  });
});
