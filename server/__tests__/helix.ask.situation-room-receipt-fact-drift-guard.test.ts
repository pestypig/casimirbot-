import { describe, expect, it } from "vitest";

import { guardSituationRoomReceiptFactDrift } from "../services/helix-ask/situation-room-receipt-fact-drift-guard";

describe("Situation Room receipt fact drift guard", () => {
  it("repairs voice proposal text that claims Dottie is speaking automatically", () => {
    const result = guardSituationRoomReceiptFactDrift({
      text: "Dottie can speak automatically now.",
      payload: {
        terminal_presentation: {
          concise_text:
            "Prepared Auntie Dottie as a witness-only observer. Voice delivery remains a receipt-backed projection of public commentary; no audio is spoken unless a confirm-speak action is explicitly run.",
        },
      },
      artifacts: [{
        kind: "dottie_voice_receipt",
        payload: {
          voice_policy: "propose_only",
          spoken: false,
          confirm_speak_receipt_present: false,
          output_authority: "proposal",
        },
      }],
    });

    expect(result.repaired).toBe(true);
    expect(result.codes).toEqual(expect.arrayContaining([
      "SITUATION_ROOM_RECEIPT_FACT_DRIFT",
      "VOICE_PROPOSAL_UPGRADED_TO_SPOKEN",
    ]));
    expect(result.text).toContain("no audio is spoken unless");
    expect(result.text).not.toMatch(/speak automatically/i);
  });

  it("does not repair confirmed speech receipts", () => {
    const result = guardSituationRoomReceiptFactDrift({
      text: "The confirmed Dottie callout was spoken.",
      payload: {},
      artifacts: [{
        kind: "standby_callout_delivery_receipt",
        payload: {
          action: "voice_delivery.confirm_speak",
          spoken: true,
          confirm_speak_receipt_present: true,
          output_authority: "confirmed_spoken",
        },
      }],
    });

    expect(result.repaired).toBe(false);
    expect(result.text).toBe("The confirmed Dottie callout was spoken.");
    expect(result.codes).toEqual([]);
  });

  it("repairs construct status upgrades from receipt-only to active", () => {
    const result = guardSituationRoomReceiptFactDrift({
      text: "The Dottie setup is fully active.",
      payload: {
        construct_observation: {
          created_constructs: [{ status: "created", authority: "witness_only" }],
          policy_state: { voice_policy: "propose_only", spoken: false },
        },
      },
      artifacts: [{
        kind: "situation_construct_recipe_run",
        payload: {
          status: "receipt_only",
          missing_inputs: ["minecraft_world_events"],
        },
      }],
    });

    expect(result.repaired).toBe(true);
    expect(result.codes).toEqual(expect.arrayContaining(["LIVE_JOB_STATUS_UPGRADED"]));
  });
});
