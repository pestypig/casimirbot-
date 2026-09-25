import crypto from "node:crypto";

// Shared identity projection without importing workstation capability policy.
export const buildRuntimeGoalProfileRef = (profileId: string): string =>
  `runtime-goal-profile:sha256:${crypto.createHash("sha256").update(profileId.trim()).digest("hex").slice(0, 24)}`;
