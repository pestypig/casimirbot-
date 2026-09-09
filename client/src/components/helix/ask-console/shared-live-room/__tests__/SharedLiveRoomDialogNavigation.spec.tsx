// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SharedLiveRoomDialog } from "../SharedLiveRoomDialog";

vi.mock("../SharedLiveRoomActivePanel", () => ({ SharedLiveRoomActivePanel: () => <div>
  <div tabIndex={-1} data-environment-player-settings="environment:other">Other player</div>
  <div tabIndex={-1} data-environment-player-settings="environment:exact">Exact player</div>
</div> }));
afterEach(cleanup);

it.each(["environment:exact", "environment:missing"])("reveals only the requested player section %s", async environmentBindingId => {
  render(<SharedLiveRoomDialog room={{ room_id: "room:exact" } as never}
    controller={{ error: null } as never} titleId="title" descriptionId="description"
    onClose={vi.fn()} navigationTarget={{ environmentBindingId }} />);
  if (environmentBindingId === "environment:exact") {
    await waitFor(() => expect(document.activeElement).toBe(screen.getByText("Exact player")));
    expect(screen.getByRole("status").textContent).toContain("No permission was activated");
  } else {
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close Shared GPT Live Room", exact: true })));
    expect(screen.getByRole("status").textContent).toContain("No other environment will be selected");
  }
});
