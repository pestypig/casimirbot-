import { buildHelixGoalSatisfactionEvaluationArtifact } from "./goal-satisfaction-artifact";
import {
  buildHelixAskGoldenPathCalculatorSolvePayload,
  evaluateGoldenPathCalculatorExpression,
  formatGoldenPathNumber,
  isHelixAskGoldenPathCalculatorSolveRequested,
  readCalculatorExpression,
} from "./golden-path/capabilities/calculator";
import {
  buildHelixAskGoldenPathDocsLocatePayload,
  findGoldenPathDocLocationMatches,
  isHelixAskGoldenPathDocsLocateRequested,
  readGoldenPathDocContent,
  readGoldenPathDocLocateQuery,
  readGoldenPathDocPath,
} from "./golden-path/capabilities/docs-locate";
import {
  buildHelixAskGoldenPathRepoSearchConceptPayload,
  findGoldenPathRepoEvidence,
  isHelixAskGoldenPathRepoSearchConceptRequested,
  readGoldenPathRepoSearchFiles,
  readRepoSearchConcept,
} from "./golden-path/capabilities/repo-search-concept";
import {
  buildHelixAskGoldenPathInternetSearchPayload,
  isHelixAskGoldenPathInternetSearchRequested,
  readCompactInternetSearchResults,
  readInternetSearchQuery,
} from "./golden-path/capabilities/internet-search";
import {
  buildHelixAskGoldenPathScholarlyResearchPayload,
  isHelixAskGoldenPathScholarlyResearchRequested,
} from "./golden-path/capabilities/scholarly-research";
import {
  buildHelixAskGoldenPathTheoryReflectionPayload,
  isHelixAskGoldenPathTheoryReflectionRequested,
  readTheoryReflectionAnchors,
  readTheoryReflectionTopic,
} from "./golden-path/capabilities/theory-reflection";
import {
  buildHelixAskGoldenPathCivilizationBoundsReflectionPayload,
  isHelixAskGoldenPathCivilizationBoundsReflectionRequested,
  readCompactCivilizationBoundsToolResult,
} from "./golden-path/capabilities/civilization-bounds-reflection";
import {
  buildHelixAskGoldenPathZenGraphReflectionPayload,
  isHelixAskGoldenPathZenGraphReflectionRequested,
  readCompactZenGraphReflectionToolResult,
} from "./golden-path/capabilities/zen-graph-reflection";
import {
  buildHelixAskGoldenPathVisualCapturePayload,
  isHelixAskGoldenPathVisualCaptureRequested,
} from "./golden-path/capabilities/visual-capture";
import {
  buildHelixAskGoldenPathProcessedLiveSourceMailPayload,
  isHelixAskGoldenPathProcessedLiveSourceMailRequested,
} from "./golden-path/capabilities/processed-live-source-mail";
import {
  buildAskTurnCompositeFollowupAudit,
  buildAskTurnCompositeHandoffDecision,
} from "./composite-followup-helpers";
import {
  buildGoldenPathCompositeDebug,
  isHelixAskGoldenPathCatalogWorkspaceCompoundRequested,
  isHelixAskGoldenPathCivilizationBoundsZenReflectionCompoundRequested,
  isHelixAskGoldenPathDocsCalculatorCompoundRequested,
  isHelixAskGoldenPathInternetResearchReflectionCompoundRequested,
  isHelixAskGoldenPathRepoDocsCompoundRequested,
  isHelixAskGoldenPathVisualCalculatorCompoundRequested,
} from "./golden-path/compound-contract";
import {
  buildHelixAskGoldenPathVisualCalculatorCompoundPayload,
} from "./golden-path/compounds/visual-calculator";
import {
  buildHelixAskGoldenPathDocsCalculatorCompoundPayload,
} from "./golden-path/compounds/docs-calculator";
import {
  buildHelixAskGoldenPathRepoDocsCompoundPayload,
} from "./golden-path/compounds/repo-docs";
import {
  buildHelixAskGoldenPathInternetResearchReflectionCompoundPayload,
} from "./golden-path/compounds/internet-theory-reflection";
import {
  buildHelixAskGoldenPathCivilizationBoundsZenReflectionCompoundPayload,
} from "./golden-path/compounds/civilization-zen-reflection";
import {
  buildHelixAskGoldenPathCatalogWorkspaceCompoundPayload,
} from "./golden-path/compounds/catalog-workspace";
import {
  buildHelixAskGoldenPathRuntimeContractPayload,
} from "./golden-path/runtime-contract-payload";
import {
  buildStagePlayAskCheckpointReceiptPayload,
  type StagePlayCheckpointReceiptArtifactLike,
} from "./live-source/stage-play-checkpoint-receipt";
import {
  HELIX_INTERNET_SEARCH_OBSERVATION_SCHEMA,
} from "../../../shared/helix-internet-search-observation";
import {
  defaultHashGoalFrame,
  flagEnabled,
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
  readArray,
  readBoolean,
  readHelixAskGoldenPathPrompt,
  readNumber,
  readRecord,
  readString,
  readStringArray,
  isHelixAskGoldenPathRequested,
  type HelixAskGoldenPathRuntimeDecision,
  type HelixAskGoldenPathRuntimeTerminalResult,
  type RecordLike,
} from "./golden-path/core";
import {
  buildGoldenPathCapabilityCatalogObservation,
  buildHelixAskGoldenPathCapabilityCatalogPayload,
  isHelixAskGoldenPathCapabilityCatalogRequested,
} from "./golden-path/capabilities/capability-catalog";
import {
  buildHelixAskGoldenPathStagePlayReflectionPayload,
  isHelixAskGoldenPathStagePlayReflectionRequested,
} from "./golden-path/capabilities/stage-play-reflection";
import {
  buildGoldenPathWorkspaceStatusObservation,
  buildHelixAskGoldenPathWorkspaceStatusPayload,
  isHelixAskGoldenPathWorkspaceStatusRequested,
} from "./golden-path/capabilities/workspace-status";
import {
  buildHelixAskGoldenPathWorkspaceDirectoryPayload,
  isHelixAskGoldenPathWorkspaceDirectoryRequested,
} from "./golden-path/capabilities/workspace-directory";
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

export type HelixAskGoldenPathRuntimeDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
  buildCompositeHandoffDecision: typeof buildAskTurnCompositeHandoffDecision;
  buildCompositeFollowupAudit: typeof buildAskTurnCompositeFollowupAudit;
  buildStagePlayCheckpointReceiptPayload: typeof buildStagePlayAskCheckpointReceiptPayload;
};

export const createHelixAskGoldenPathRuntimeDependencies = (
  overrides: Partial<HelixAskGoldenPathRuntimeDependencies> = {},
): HelixAskGoldenPathRuntimeDependencies => ({
  now: () => new Date(),
  hashGoalFrame: defaultHashGoalFrame,
  buildGoalSatisfactionEvaluationArtifact: buildHelixGoalSatisfactionEvaluationArtifact,
  buildCompositeHandoffDecision: buildAskTurnCompositeHandoffDecision,
  buildCompositeFollowupAudit: buildAskTurnCompositeFollowupAudit,
  buildStagePlayCheckpointReceiptPayload: buildStagePlayAskCheckpointReceiptPayload,
  ...overrides,
});

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
  if (!isHelixAskGoldenPathRequested(args.body)) return { handled: false, reason: "not_requested" };
  const body = readRecord(args.body) ?? {};
  if (isHelixAskGoldenPathCatalogWorkspaceCompoundRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathCatalogWorkspaceCompoundPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathVisualCalculatorCompoundRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathVisualCalculatorCompoundPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathDocsCalculatorCompoundRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathDocsCalculatorCompoundPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathRepoDocsCompoundRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathRepoDocsCompoundPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathInternetResearchReflectionCompoundRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathInternetResearchReflectionCompoundPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathCivilizationBoundsZenReflectionCompoundRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathCivilizationBoundsZenReflectionCompoundPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathProcessedLiveSourceMailRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathProcessedLiveSourceMailPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathStagePlayReflectionRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathStagePlayReflectionPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathInternetSearchRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathInternetSearchPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathScholarlyResearchRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathScholarlyResearchPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathCivilizationBoundsReflectionRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathCivilizationBoundsReflectionPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathZenGraphReflectionRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathZenGraphReflectionPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathTheoryReflectionRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathTheoryReflectionPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathVisualCaptureRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathVisualCapturePayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathCalculatorSolveRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathCalculatorSolvePayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathDocsLocateRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathDocsLocatePayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathRepoSearchConceptRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathRepoSearchConceptPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathWorkspaceDirectoryRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathWorkspaceDirectoryPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathCapabilityCatalogRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathCapabilityCatalogPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathWorkspaceStatusRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathWorkspaceStatusPayload({
        body,
        deps,
      }),
    };
  }
  return {
    handled: true,
    payload: buildHelixAskGoldenPathRuntimePayload({
      body,
      deps: args.deps,
      now: args.now,
    }),
  };
};
