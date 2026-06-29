import {
  buildHelixAskGoldenPathRuntimeContractPayload,
} from "./golden-path/runtime-contract-payload";
import {
  createHelixAskGoldenPathRuntimeDependencies,
  type HelixAskGoldenPathRuntimeDependencies,
} from "./golden-path/runtime-dependencies";
import { dispatchHelixAskGoldenPathRuntime } from "./golden-path/runtime-dispatch";
import {
  flagEnabled,
  HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
  isHelixAskGoldenPathRequested,
  type HelixAskGoldenPathRuntimeDecision,
  type RecordLike,
} from "./golden-path/core";
export {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
  HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
  HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
  HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
  HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY,
  HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
  HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
  HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
  HELIX_GOLDEN_PATH_REFLECT_STAGE_PLAY_CONTEXT_CAPABILITY,
  HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
  HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
  HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
  HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
  HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
  HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
  isHelixAskGoldenPathRequested,
  readHelixAskGoldenPathPrompt,
  type HelixAskGoldenPathRuntimeDecision,
  type HelixAskGoldenPathRuntimeTerminalResult,
} from "./golden-path/core";

export {
  createHelixAskGoldenPathRuntimeDependencies,
  type HelixAskGoldenPathRuntimeDependencies,
} from "./golden-path/runtime-dependencies";

export const isHelixAskGoldenPathRuntimeEnabled = (
  env: Record<string, string | undefined> = process.env,
): boolean => flagEnabled(env[HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG]);

export const buildHelixAskGoldenPathRuntimePayload = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): RecordLike => {
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });
  return buildHelixAskGoldenPathRuntimeContractPayload({ body: args.body, deps });
};
export const runHelixAskGoldenPathRuntime = (args: {
  body: RecordLike;
  env?: Record<string, string | undefined>;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): HelixAskGoldenPathRuntimeDecision => {
  if (!isHelixAskGoldenPathRuntimeEnabled(args.env)) return { handled: false, reason: "flag_disabled" };
  const explicitGoldenPathRequest = isHelixAskGoldenPathRequested(args.body);
  return dispatchHelixAskGoldenPathRuntime({
    body: args.body,
    deps: args.deps,
    now: args.now,
    allowContractFallback: explicitGoldenPathRequest,
  });
};
