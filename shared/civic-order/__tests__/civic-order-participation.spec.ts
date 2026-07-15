import { describe, expect, it } from "vitest";
import { validateCivicOrderParticipationV1 } from "../../contracts/civic-order-participation.v1";
import { buildCivicOrderParticipationV1 } from "../build-civic-order-participation";

describe("Civic Order Participation", () => {
  it("separates participation and dependence from consent or legitimacy", () => {
    const artifact = buildCivicOrderParticipationV1({
      text: [
        "A tenant pays rent, uses city services, and complies with an inherited economic order.",
        "Exit exists formally but there is no affordable alternative, and the tenant dissents.",
        "The city combines market price, private contract, public provision, election, and court appeal.",
      ].join(" "),
      refs: ["turn:civic-order"],
    });

    expect(artifact).not.toBeNull();
    expect(validateCivicOrderParticipationV1(artifact)).toEqual([]);
    expect(artifact?.actors[0]).toMatchObject({
      roles: expect.arrayContaining(["tenant"]),
      consentState: "necessity_bound",
    });
    expect(artifact?.supportSignals.map((signal) => signal.signal)).toEqual(
      expect.arrayContaining(["compliance", "dissent"]),
    );
    expect(artifact?.activatedBadgeIds).toEqual(
      expect.arrayContaining([
        "participation-consent-separation",
        "inherited-order-participation",
        "voice-exit-contestability",
        "coordination-pluralism",
      ]),
    );
    expect(artifact?.authority).toMatchObject({
      terminal_eligible: false,
      legitimacy_finality: false,
      consent_inference: false,
      ideology_rank: false,
    });
  });

  it("keeps ordinary participation unknown when consent was not explicitly stated", () => {
    const artifact = buildCivicOrderParticipationV1({
      text: "A worker participates in a cooperative and receives a benefit.",
    });
    expect(artifact?.actors[0]?.consentState).toBe("unknown");
  });

  it("treats ideology names as non-authoritative labels and forbids ranking", () => {
    const artifact = buildCivicOrderParticipationV1({
      text: "Compare capitalism, democratic socialism, and communism through allocation and accountability channels.",
    });

    expect(artifact?.coordinationProfile.declaredLabels).toEqual(["capitalism", "socialism", "communism"]);
    expect(artifact?.coordinationProfile.declaredLabelsAreNonAuthoritative).toBe(true);
    expect(validateCivicOrderParticipationV1({ ...artifact, ideologyRank: ["capitalism"] })).toContain(
      "ideologyRank is forbidden",
    );
  });
});
