import {
  buildHelixAskGoldenPathCalculatorSolvePayload,
  isHelixAskGoldenPathCalculatorSolveRequested,
} from "./capabilities/calculator";
import {
  buildHelixAskGoldenPathDocsLocatePayload,
  isHelixAskGoldenPathDocsLocateRequested,
} from "./capabilities/docs-locate";
import {
  buildHelixAskGoldenPathRepoSearchConceptPayload,
  isHelixAskGoldenPathRepoSearchConceptRequested,
} from "./capabilities/repo-search-concept";
import {
  buildHelixAskGoldenPathInternetSearchPayload,
  isHelixAskGoldenPathInternetSearchRequested,
} from "./capabilities/internet-search";
import {
  buildHelixAskGoldenPathScholarlyResearchPayload,
  isHelixAskGoldenPathScholarlyResearchRequested,
} from "./capabilities/scholarly-research";
import {
  buildHelixAskGoldenPathTheoryReflectionPayload,
  isHelixAskGoldenPathTheoryReflectionRequested,
} from "./capabilities/theory-reflection";
import {
  buildHelixAskGoldenPathCivilizationBoundsReflectionPayload,
  isHelixAskGoldenPathCivilizationBoundsReflectionRequested,
} from "./capabilities/civilization-bounds-reflection";
import {
  buildHelixAskGoldenPathZenGraphReflectionPayload,
  isHelixAskGoldenPathZenGraphReflectionRequested,
} from "./capabilities/zen-graph-reflection";
import {
  buildHelixAskGoldenPathVisualCapturePayload,
  isHelixAskGoldenPathVisualCaptureRequested,
} from "./capabilities/visual-capture";
import {
  buildHelixAskGoldenPathProcessedLiveSourceMailPayload,
  isHelixAskGoldenPathProcessedLiveSourceMailRequested,
} from "./capabilities/processed-live-source-mail";
import {
  isHelixAskGoldenPathCatalogWorkspaceCompoundRequested,
  isHelixAskGoldenPathCivilizationBoundsZenReflectionCompoundRequested,
  isHelixAskGoldenPathDocsCalculatorCompoundRequested,
  isHelixAskGoldenPathInternetResearchReflectionCompoundRequested,
  isHelixAskGoldenPathRepoDocsCompoundRequested,
  isHelixAskGoldenPathVisualCalculatorCompoundRequested,
} from "./compound-contract";
import { buildHelixAskGoldenPathVisualCalculatorCompoundPayload } from "./compounds/visual-calculator";
import { buildHelixAskGoldenPathDocsCalculatorCompoundPayload } from "./compounds/docs-calculator";
import { buildHelixAskGoldenPathRepoDocsCompoundPayload } from "./compounds/repo-docs";
import { buildHelixAskGoldenPathInternetResearchReflectionCompoundPayload } from "./compounds/internet-theory-reflection";
import { buildHelixAskGoldenPathCivilizationBoundsZenReflectionCompoundPayload } from "./compounds/civilization-zen-reflection";
import { buildHelixAskGoldenPathCatalogWorkspaceCompoundPayload } from "./compounds/catalog-workspace";
import {
  buildHelixAskGoldenPathCapabilityCatalogPayload,
  isHelixAskGoldenPathCapabilityCatalogRequested,
} from "./capabilities/capability-catalog";
import {
  buildHelixAskGoldenPathStagePlayReflectionPayload,
  isHelixAskGoldenPathStagePlayReflectionRequested,
} from "./capabilities/stage-play-reflection";
import {
  buildHelixAskGoldenPathWorkspaceStatusPayload,
  isHelixAskGoldenPathWorkspaceStatusRequested,
} from "./capabilities/workspace-status";
import {
  buildHelixAskGoldenPathWorkspaceDirectoryPayload,
  isHelixAskGoldenPathWorkspaceDirectoryRequested,
} from "./capabilities/workspace-directory";
import { readRecord, type HelixAskGoldenPathRuntimeDecision, type RecordLike } from "./core";
import {
  createHelixAskGoldenPathRuntimeDependencies,
  type HelixAskGoldenPathRuntimeDependencies,
} from "./runtime-dependencies";
import { buildHelixAskGoldenPathRuntimeContractPayload } from "./runtime-contract-payload";

export const dispatchHelixAskGoldenPathRuntime = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): HelixAskGoldenPathRuntimeDecision => {  const body = readRecord(args.body) ?? {};
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
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });
  return {
    handled: true,
    payload: buildHelixAskGoldenPathRuntimeContractPayload({ body, deps }),
  };
};
