import { hullModeEnabled } from "../../security/hull-guard";

/**
 * Provider selection must be explicit. HULL_MODE may block outbound adapters,
 * but it must not silently turn an unset policy into local model execution.
 */
export const applyHullModeLlmPolicyDefault = (
  env: NodeJS.ProcessEnv = process.env,
  hullMode: boolean = hullModeEnabled(),
): void => {
  void env;
  void hullMode;
};
