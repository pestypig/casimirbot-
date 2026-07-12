import { isAskTurnCapabilityHelpIntent } from "../capability-catalog-intent";
import {
  readHelixAskGoldenPathPrompt,
  readRecord,
  type HelixAskGoldenPathRuntimeDecision,
  type RecordLike,
} from "./core";
import {
  createHelixAskGoldenPathRuntimeDependencies,
  type HelixAskGoldenPathRuntimeDependencies,
} from "./runtime-dependencies";
import { buildHelixAskGoldenPathRuntimeContractPayload } from "./runtime-contract-payload";
import {
  compoundDispatchModules,
  singleCapabilityDispatchModules,
} from "./runtime-modules";
import { detectedItineraryAdapterCount } from "./itinerary/compound-itinerary";

export const dispatchHelixAskGoldenPathRuntime = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
  allowContractFallback?: boolean;
}): HelixAskGoldenPathRuntimeDecision => {
  const body = readRecord(args.body) ?? {};
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });

  if (!args.allowContractFallback && isAskTurnCapabilityHelpIntent(readHelixAskGoldenPathPrompt(body))) {
    return { handled: false, reason: "capability_help_precedence" };
  }

  for (const dispatchModule of compoundDispatchModules) {
    if (!dispatchModule.isRequested(body)) continue;
    return {
      handled: true,
      payload: dispatchModule.buildPayload({ body, deps }),
    };
  }

  // Dedicated two-family modules above keep their deterministic contracts.
  // An unsupported natural two-family combination must stay on the full solver
  // path; letting the first matching single-family module claim it silently
  // drops the other required observation family.
  if (!args.allowContractFallback && detectedItineraryAdapterCount(body) === 2) {
    return { handled: false, reason: "two_family_compound_requires_full_solver" };
  }

  for (const dispatchModule of singleCapabilityDispatchModules) {
    if (!dispatchModule.isRequested(body)) continue;
    return {
      handled: true,
      payload: dispatchModule.buildPayload({ body, deps }),
    };
  }

  if (!args.allowContractFallback) return { handled: false, reason: "not_requested" };

  return {
    handled: true,
    payload: buildHelixAskGoldenPathRuntimeContractPayload({ body, deps }),
  };
};
