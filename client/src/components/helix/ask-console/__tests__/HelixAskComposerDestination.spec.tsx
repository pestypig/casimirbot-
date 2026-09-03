// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  buildHelixAskComposerDestinationModel,
  saveHelixOperatorNote,
} from "../HelixAskComposerDestination";
import { HelixAskComposerDestinationStrip } from
  "../HelixAskComposerDestinationStrip";
import { buildHelixAskLegacyComposerState } from "../HelixAskLegacyComposerState";

describe("Helix Ask composer destination", () => {
  it("labels an available governed turn as Ask and a busy turn as Queue", () => {
    expect(buildHelixAskComposerDestinationModel({
      kind: "helix_ask",
      runtimeLabel: "Codex",
      busy: false,
    })).toMatchObject({
      destinationLabel: "Codex",
      transportLabel: "Helix Ask governed turn",
      actionLabel: "Ask",
      deliveryState: "ready",
      providerDeliveryClaimed: false,
    });
    expect(buildHelixAskComposerDestinationModel({
      kind: "helix_ask",
      runtimeLabel: "Codex",
      busy: true,
    })).toMatchObject({ actionLabel: "Queue", deliveryState: "queued" });
  });

  it("saves an operator note without claiming provider delivery", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: vi.fn((key: string) => values.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    };
    const note = saveHelixOperatorNote(
      "Remember this without sending it.",
      storage,
      new Date("2026-09-01T20:00:00.000Z"),
    );
    expect(note).toMatchObject({
      text: "Remember this without sending it.",
      delivery_state: "saved_locally",
      provider_delivery_claimed: false,
    });
    expect(JSON.parse([...values.values()][0])).toEqual([note]);
  });

  it("labels exact-task polling as queued steering without claiming provider delivery", () => {
    expect(buildHelixAskComposerDestinationModel({
      kind: "bound_agent",
      boundAgentState: "active",
    })).toMatchObject({
      destinationLabel: "Bound external AI task",
      transportLabel: "Exact MCP polling binding",
      actionLabel: "Queue",
      deliveryState: "ready",
      providerDeliveryClaimed: false,
    });
    expect(buildHelixAskComposerDestinationModel({
      kind: "bound_agent",
      boundAgentState: "awaiting_agent_pickup",
    })).toMatchObject({
      deliveryState: "awaiting_agent_pickup",
      providerDeliveryClaimed: false,
    });
  });

  it("renders the exact destination, transport, action, and delivery state", () => {
    const onDestinationChange = vi.fn();
    render(
      <HelixAskComposerDestinationStrip
        model={buildHelixAskComposerDestinationModel({
          kind: "operator_note",
          noteState: "saved",
        })}
        onDestinationChange={onDestinationChange}
      />,
    );
    expect(screen.getByText("Local operator note")).toBeInTheDocument();
    expect(screen.getByText("Save operator note")).toBeInTheDocument();
    expect(screen.getByText("saved")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Composer destination"), {
      target: { value: "helix_ask" },
    });
    expect(onDestinationChange).toHaveBeenCalledWith("helix_ask");
  });

  it("preserves the destination strip across the legacy composer bridge", () => {
    const destination = <div>Destination bridge sentinel</div>;
    const input = {
      destination,
      voiceLevelMonitor: {},
      moodAvatar: {},
      actionToolbar: {},
      textarea: {},
    } as Parameters<typeof buildHelixAskLegacyComposerState>[0];

    expect(buildHelixAskLegacyComposerState(input).destination).toBe(destination);
  });
});
