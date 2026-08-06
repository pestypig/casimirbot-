import { describe, expect, it } from "vitest";

import { planEnvironmentActionAuthoritySupersession } from "../authority-store";

describe("environment action authority supersession", () => {
  it("retires every older active lease across player subject epochs", () => {
    const plan = planEnvironmentActionAuthoritySupersession([
      {
        action_authority_id: "environment_action_authority:old-subject",
        policy_version: 4,
        created_at: new Date("2026-08-05T18:00:00.000Z"),
      },
      {
        action_authority_id: "environment_action_authority:new-subject",
        policy_version: 5,
        created_at: new Date("2026-08-05T18:05:00.000Z"),
      },
      {
        action_authority_id: "environment_action_authority:duplicate-new-subject",
        policy_version: 5,
        created_at: new Date("2026-08-05T18:06:00.000Z"),
      },
    ] as never);

    expect(plan).toEqual({
      nextPolicyVersion: 6,
      canonicalPriorAuthorityId:
        "environment_action_authority:duplicate-new-subject",
      supersededAuthorityIds: [
        "environment_action_authority:duplicate-new-subject",
        "environment_action_authority:new-subject",
        "environment_action_authority:old-subject",
      ],
    });
  });

  it("starts the first authority at policy version one", () => {
    expect(planEnvironmentActionAuthoritySupersession([])).toEqual({
      nextPolicyVersion: 1,
      canonicalPriorAuthorityId: null,
      supersededAuthorityIds: [],
    });
  });
});
