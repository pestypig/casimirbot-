import { hullModeEnabled } from "../../security/hull-guard";

/**
 * In HULL_MODE we default to local policy only when no policy was explicitly set.
 * This preserves explicit HTTP policy for remote-backed Helix Ask lanes.
 */
export const applyHullModeLlmPolicyDefault = (
  env: NodeJS.ProcessEnv = process.env,
  hullMode: boolean = hullModeEnabled(),
): void => {
  if (!hullMode) return;
  if (env.LLM_POLICY?.trim().length) return;
  env.LLM_POLICY = "local";
};
