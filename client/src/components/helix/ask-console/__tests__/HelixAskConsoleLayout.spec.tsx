// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("../HelixAskLegacyRuntimeBridge", () => ({ HelixAskLegacyRuntimeBridge: () => <div>Conversation</div> }));
vi.mock("../HelixAskConsoleRuntimeShellProps", () => ({ buildHelixAskConsoleRuntimeBridgeProps: (props: unknown) => props }));
vi.mock("../HelixOperatorActivityPanel", () => ({ HelixOperatorActivityPanel: () => <div>Activity diagnostics</div> }));
vi.mock("../agent-run-observer/AgentRunObserverBindingSurface", () => ({ AgentRunObserverBindingSurface: () => <div>Connection setup</div> }));
import { HelixAskConsoleRuntimeShell } from "../HelixAskConsoleRuntimeShell";
afterEach(cleanup);
it("keeps diagnostics out of the conversation layout until requested", async () => {
  render(<HelixAskConsoleRuntimeShell />);
  await screen.findByText("Conversation");
  expect(screen.queryByText("Activity diagnostics")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Activity & setup" }));
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(screen.getByText("Activity diagnostics")).toBeTruthy();
  const setup = screen.getByText("External agent setup").closest("details");
  expect(setup?.open).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByText("Conversation")).toBeTruthy();
});
