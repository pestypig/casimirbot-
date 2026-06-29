import * as Calculator from "./capabilities/calculator";
import * as CapabilityCatalog from "./capabilities/capability-catalog";
import * as CivilizationBounds from "./capabilities/civilization-bounds";
import * as DocsViewer from "./capabilities/docs-viewer";
import * as InternetSearch from "./capabilities/internet-search";
import * as ProcessedLiveSourceMail from "./capabilities/processed-live-source-mail";
import * as RepoCode from "./capabilities/repo-code";
import * as ScholarlyResearch from "./capabilities/scholarly-research";
import * as StagePlayReflection from "./capabilities/stage-play-reflection";
import * as TheoryReflection from "./capabilities/theory-reflection";
import * as VisualCapture from "./capabilities/visual-capture";
import * as WorkspaceDirectory from "./capabilities/workspace-directory";
import * as WorkspaceStatus from "./capabilities/workspace-status";
import * as ZenGraphReflection from "./capabilities/zen-graph-reflection";
import * as CatalogWorkspace from "./compounds/catalog-workspace";
import * as CivilizationZenReflection from "./compounds/civilization-zen-reflection";
import * as DocsCalculator from "./compounds/docs-calculator";
import * as InternetTheoryReflection from "./compounds/internet-theory-reflection";
import * as RepoDocs from "./compounds/repo-docs";
import * as VisualCalculator from "./compounds/visual-calculator";
import { readRecord, type HelixAskGoldenPathRuntimeDecision, type RecordLike } from "./core";
import {
  createHelixAskGoldenPathRuntimeDependencies,
  type HelixAskGoldenPathRuntimeDependencies,
} from "./runtime-dependencies";
import { buildHelixAskGoldenPathRuntimeContractPayload } from "./runtime-contract-payload";

type GoldenPathDispatchModule = {
  requiredObservationKinds: readonly string[];
  requiredTerminalKinds: readonly string[];
  isRequested: (body: RecordLike) => boolean;
  buildPayload: (args: {
    body: RecordLike;
    deps: HelixAskGoldenPathRuntimeDependencies;
  }) => RecordLike;
};

const orderedDispatchModules: readonly GoldenPathDispatchModule[] = [
  CatalogWorkspace,
  VisualCalculator,
  DocsCalculator,
  RepoDocs,
  InternetTheoryReflection,
  CivilizationZenReflection,
  ProcessedLiveSourceMail,
  StagePlayReflection,
  InternetSearch,
  ScholarlyResearch,
  CivilizationBounds,
  ZenGraphReflection,
  TheoryReflection,
  VisualCapture,
  Calculator,
  DocsViewer,
  RepoCode,
  WorkspaceDirectory,
  CapabilityCatalog,
  WorkspaceStatus,
];

export const dispatchHelixAskGoldenPathRuntime = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): HelixAskGoldenPathRuntimeDecision => {
  const body = readRecord(args.body) ?? {};
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });

  for (const dispatchModule of orderedDispatchModules) {
    if (!dispatchModule.isRequested(body)) continue;
    return {
      handled: true,
      payload: dispatchModule.buildPayload({ body, deps }),
    };
  }

  return {
    handled: true,
    payload: buildHelixAskGoldenPathRuntimeContractPayload({ body, deps }),
  };
};
